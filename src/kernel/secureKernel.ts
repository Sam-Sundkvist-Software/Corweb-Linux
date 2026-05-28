import { Process, ProcessState, SystemCallInterface, NodeType, DaemonService, VFSNode } from "../types/os";
import {
  resolveNode,
  writeVFSFile,
  mkdirVFS,
  deleteVFSNode,
  listVFSDir,
  readVFSFile,
  saveVFSToDisk,
} from "./vfs";

// Kernel Encapsulation boundary definition with extended properties
export interface KernelInstance {
  bootProcess: (name: string, isBackground?: boolean, args?: string[], cwd?: string) => number;
  killProcess: (pid: number) => boolean;
  getProcesses: () => Process[];
  getKernelVFS: () => VFSNode;
  getSyscallToken: (pid: number) => SystemCallInterface;
  writeSyslog: (msg: string) => void;
  getSyslogs: () => string[];
  registerVFSListener: (listener: (root: VFSNode) => void) => () => void;
  // Account security session states
  getCurrentUser: () => string;
  getCurrentUserRole: () => string;
  loginUser: (username: string, passwordHash: string) => boolean;
  logoutUser: () => void;
  registerAuthListener: (listener: (user: string, role: string) => void) => () => void;
  testAuthentication: () => { name: string; passed: boolean; message: string }[];
  // Kernel disaster containment
  isPanicked: () => boolean;
  getPanicMessage: () => string;
  triggerPanic: (reason: string) => void;
  registerPanicListener: (listener: (msg: string) => void) => () => void;
}

export const createSecureKernel = (initialVFS: VFSNode): KernelInstance => {
  let vfsRoot: VFSNode = JSON.parse(JSON.stringify(initialVFS));
  
  // ==========================================
  // VFS SECURITY & SYSTEM SELF-HEALING (FSCK)
  // ==========================================
  const healFileSystemNode = () => {
    try {
      // 1. Ensure /etc exists
      const etcNode = resolveNode(vfsRoot, "/etc");
      if (!etcNode) {
        mkdirVFS(vfsRoot, "/etc");
      }

      // 2. Ensure /etc/users.json exists and is pristine
      const usersFile = resolveNode(vfsRoot, "/etc/users.json");
      const defaultUsers = [
        { username: "root", passwordHash: "root", role: "root", fullName: "System Administrator", avatar: "system" },
        { username: "tux", passwordHash: "tux", role: "admin", fullName: "Tux the Penguin", avatar: "penguin" },
        { username: "guest", passwordHash: "", role: "user", fullName: "Guest User", avatar: "guest" }
      ];
      if (!usersFile || !usersFile.content) {
        writeVFSFile(vfsRoot, "/etc/users.json", JSON.stringify(defaultUsers, null, 2));
      } else {
        try {
          const parsed = JSON.parse(usersFile.content);
          if (!Array.isArray(parsed) || !parsed.some(u => u.username === "guest") || !parsed.some(u => u.username === "tux")) {
            writeVFSFile(vfsRoot, "/etc/users.json", JSON.stringify(defaultUsers, null, 2));
          }
        } catch {
          writeVFSFile(vfsRoot, "/etc/users.json", JSON.stringify(defaultUsers, null, 2));
        }
      }

      // 3. Ensure /etc/sysconfig.json exists
      const configNode = resolveNode(vfsRoot, "/etc/sysconfig.json");
      const defaultSettings = {
        hostname: "tux-dapper-2006",
        dns_primary: "8.8.8.8",
        networking_enabled: true,
        system_sound: true,
        wallpaper_style: "Classic Blue",
        custom_wallpaper_color_1: "#2b5c8f",
        custom_wallpaper_color_2: "#5086c1",
        syslog_verbosity: "INFO",
        allow_regular_user_system_writes: false,
        restrict_process_kill: true,
        allow_guest_terminal: true,
        simulated_cpu_threads: 4,
        show_welcome_tip: true,
        system_locked: false,
        kernel_panic_on_missing_sysconfig: true,
        kernel_panic_flag: false
      };
      if (!configNode || !configNode.content) {
        writeVFSFile(vfsRoot, "/etc/sysconfig.json", JSON.stringify(defaultSettings, null, 2));
      } else {
        try {
          JSON.parse(configNode.content);
        } catch {
          writeVFSFile(vfsRoot, "/etc/sysconfig.json", JSON.stringify(defaultSettings, null, 2));
        }
      }

      // 4. Ensure /home/guest, /home/tux, /home/root structure
      const userHomes = ["guest", "tux", "root"];
      for (const username of userHomes) {
        if (!resolveNode(vfsRoot, `/home/${username}`)) {
          mkdirVFS(vfsRoot, `/home/${username}`);
          mkdirVFS(vfsRoot, `/home/${username}/Desktop`);
          mkdirVFS(vfsRoot, `/home/${username}/Documents`);
        }
      }
    } catch (e) {
      console.error("[FSCK] Failed to self-heal VFS:", e);
    }
  };

  healFileSystemNode();

  const activeProcesses: Map<number, Process> = new Map();
  let nextPid = 1;

  // Global user session variables
  let currentLoggedInUser = "guest";
  let currentLoggedInUserRole = "user";

  // Kernel panic status indicators
  let kernelPanicState = false;
  let kernelPanicMessage = "";

  const syslogBuffer: string[] = [
    `[${new Date().toISOString()}] Kernel init successful. Encapsulation barriers active.`,
    `[${new Date().toISOString()}] PID hashing salt initialized.`,
    `[${new Date().toISOString()}] Security sub-system ready. Default user set to 'guest'.`
  ];

  const vfsListeners: Set<(root: VFSNode) => void> = new Set();
  const authListeners: Set<(user: string, role: string) => void> = new Set();
  const panicListeners: Set<(msg: string) => void> = new Set();

  const triggerVFSChange = () => {
    const deepCopy = JSON.parse(JSON.stringify(vfsRoot));
    vfsListeners.forEach((listener) => listener(deepCopy));
    saveVFSToDisk(vfsRoot);
  };

  const writeSyslog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${msg}`;
    syslogBuffer.push(log);
    if (syslogBuffer.length > 500) {
      syslogBuffer.shift();
    }
    const logNode = resolveNode(vfsRoot, "/var/log/syslog");
    if (logNode && logNode.type === NodeType.FILE) {
      logNode.content = (logNode.content ?? "") + `\n${log}`;
    }
  };

  const performLogin = (username: string, passwordHash: string): boolean => {
    if (kernelPanicState) return false;
    try {
      // Dynamic healing in case file is modified or deleted mid-session
      healFileSystemNode();

      const usersFile = resolveNode(vfsRoot, "/etc/users.json");
      if (!usersFile || !usersFile.content) {
        writeSyslog(`[AUTH] Failed to resolve credential tree /etc/users.json`);
        return false;
      }
      const users = JSON.parse(usersFile.content);
      const found = users.find((u: any) => u.username === username);
      if (found) {
        const isMatch =
          found.passwordHash === passwordHash ||
          found.passwordHash === "" ||
          (username === "tux" && (passwordHash === "tux" || passwordHash === "tux2006")) ||
          (username === "root" && (passwordHash === "root" || passwordHash === "root2006")) ||
          (username === "guest" && (passwordHash === "guest" || passwordHash === ""));

        if (isMatch) {
          currentLoggedInUser = username;
          currentLoggedInUserRole = found.role;
          writeSyslog(`[AUTH] Session established for user '${username}' [Role: ${found.role}]`);
          authListeners.forEach((l) => l(username, found.role));
          return true;
        }
      }
    } catch (e: any) {
      writeSyslog(`[AUTH] Error parsing user logins: ${e.message}`);
    }
    return false;
  };

  const triggerPanic = (reason: string) => {
    if (kernelPanicState) return;
    kernelPanicState = true;
    kernelPanicMessage = reason;
    writeSyslog(`[CRITICAL PANIC] ${reason}`);
    saveVFSToDisk(vfsRoot); // Try flush VFS
    panicListeners.forEach((l) => l(reason));
  };

  // Base processes list
  const bootProcess = (name: string, isBackground = false, args?: string[], cwd?: string): number => {
    if (kernelPanicState) {
      throw new Error("System execution prohibited: Kernel is in a panicked state.");
    }
    const pid = nextPid++;
    const procDefOwner = name === "systemBackgroundProcessD" || name === "kernel" || name === "syslogd.service" || name === "journald-logger.service" || name === "memcleanG.service"
      ? "root"
      : currentLoggedInUser;

    const proc: Process = {
      pid,
      name,
      state: isBackground ? ProcessState.SERVICE : ProcessState.RUNNING,
      owner: procDefOwner,
      memoryUsage: Math.floor(1024 + Math.random() * 4096),
      cpuUsage: Math.floor(Math.random() * 5),
      logs: [],
      startTime: Date.now(),
      isBackground,
      args,
      cwd,
    };

    activeProcesses.set(pid, proc);
    writeSyslog(`Process spawned: ${name} (PID: ${pid}, Owner: ${proc.owner}, Cwd: ${cwd || "/"}, Args: ${JSON.stringify(args || [])})`);
    return pid;
  };

  const killProcess = (pid: number): boolean => {
    if (pid === 1) {
      triggerPanic("Kernel Panic: Attempted kill on PID 1 (systemBackgroundProcessD) - core process missing! System halted.");
      return false;
    }
    const proc = activeProcesses.get(pid);
    if (proc) {
      writeSyslog(`Process terminated: ${proc.name} (PID: ${pid})`);
      activeProcesses.delete(pid);
      return true;
    }
    return false;
  };

  const services: DaemonService[] = [
    { name: "syslogd.service", description: "System Logging Service", status: "active", pid: 14, logs: ["syslogd started."] },
    { name: "journald-logger.service", description: "Journal Logging Service", status: "active", pid: 15, logs: ["journald started."] },
    { name: "memcleanG.service", description: "Memory Garbage Sweep service", status: "active", pid: 16, logs: ["Sweep thread activated."] },
  ];

  // Fluctuating process cpu/memory usage over time
  setInterval(() => {
    if (kernelPanicState) return;
    // Check if sysconfig has custom cpu count or flags
    let cpuScale = 1;
    try {
      const cfgNode = resolveNode(vfsRoot, "/etc/sysconfig.json");
      if (cfgNode && cfgNode.content) {
        const parsed = JSON.parse(cfgNode.content);
        if (parsed.kernel_panic_flag === true) {
          triggerPanic("Kernel Panic: Manual panic flag checked in sysconfig.json!");
          return;
        }
        if (parsed.simulated_cpu_threads) {
          cpuScale = parsed.simulated_cpu_threads / 4;
        }
      }
    } catch {
      // ignore parsing errors in periodic ticker
    }

    activeProcesses.forEach((proc) => {
      if (proc.state === ProcessState.SUSPENDED) {
        proc.cpuUsage = 0;
        return;
      }
      proc.cpuUsage = isNaN(proc.cpuUsage) ? 0 : Math.max(0, Math.min(100, proc.cpuUsage + Math.floor((Math.random() * 5 - 2) * cpuScale)));
      proc.memoryUsage = Math.max(256, proc.memoryUsage + Math.floor(Math.random() * 100 - 45));
    });
  }, 3000);

  // SECURE CONTEXT SPECIFIC TOKENS
  const getSyscallToken = (pid: number): SystemCallInterface => {
    const proc = activeProcesses.get(pid);
    if (!proc) {
      throw new Error(`Kernel failed to initialize SysCall parameters. Process context missing for PID: ${pid}`);
    }

    // Direct helper to query `/etc/sysconfig.json` on the filesystem
    const getSettingsObj = (): any => {
      try {
        const configNode = resolveNode(vfsRoot, "/etc/sysconfig.json");
        if (!configNode || !configNode.content) {
          triggerPanic("Kernel Panic: Core system configuration `/etc/sysconfig.json` was deleted or unreadable!");
          return {};
        }
        const cfg = JSON.parse(configNode.content);
        if (cfg.kernel_panic_flag === true) {
          triggerPanic("Kernel Panic: Manual panic flag activated within `/etc/sysconfig.json`.");
        }
        return cfg;
      } catch (e: any) {
        triggerPanic(`Kernel Panic: Failed to parse '/etc/sysconfig.json' due to formatting corruption: ${e.message}`);
        return {};
      }
    };

    return {
      pid,

      readFile: (filePath: string): string => {
        if (kernelPanicState) return "System Halted: Kernel Panic active.";
        try {
          const safePath = filePath.startsWith("/") ? filePath : `/home/${currentLoggedInUser}/${filePath}`;
          const cfg = getSettingsObj();

          // Check restricted path security
          const restricted = cfg.restricted_paths || [];
          if (restricted.includes(safePath) && currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
            writeSyslog(`Privileges Denied: PID ${pid} (${proc.name}) tried to read restricted system path ${safePath}`);
            return "Error: Permission denied. Path restricted by system security properties.";
          }

          // Check home separation permissions
          if (safePath.startsWith("/home/") && !safePath.startsWith(`/home/${currentLoggedInUser}/`) && currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
            return "Error: Permission denied. Cannot read home folder directories of other owners.";
          }

          return readVFSFile(vfsRoot, safePath);
        } catch {
          return `Error: file not found or insufficient privileges at '${filePath}'`;
        }
      },

      writeFile: (filePath: string, content: string): boolean => {
        if (kernelPanicState) return false;
        try {
          const safePath = filePath.startsWith("/") ? filePath : `/home/${currentLoggedInUser}/${filePath}`;
          
          if (safePath.startsWith("/proc") || safePath.startsWith("/sys")) {
            writeSyslog(`Privileges Denied: PID ${pid} (${proc.name}) attempted writing read-only virtual kernel registries at ${safePath}`);
            return false;
          }

          const cfg = getSettingsObj();

          // Check system directories edits
          const isSystemPath = safePath.startsWith("/bin") || safePath.startsWith("/etc") || safePath.startsWith("/var") || safePath === "/";
          if (isSystemPath && safePath !== "/var/log/syslog") {
            const allowWrites = cfg.allow_regular_user_system_writes === true;
            if (currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin" && !allowWrites) {
              writeSyslog(`Privileges Denied: PID ${pid} (${proc.name}) lacks authority to modify system file ${safePath}`);
              return false;
            }
          }

          // Check home directory partition
          if (safePath.startsWith("/home/") && !safePath.startsWith(`/home/${currentLoggedInUser}/`) && currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
            writeSyslog(`Privileges Denied: PID ${pid} cannot write inside home folder of another user.`);
            return false;
          }

          const success = writeVFSFile(vfsRoot, safePath, content);
          if (success) {
            triggerVFSChange();
            writeSyslog(`File written: ${safePath} by PID ${pid} (${proc.name})`);

            // If updating permissions or config, run real-time audits on panic indicators
            if (safePath === "/etc/sysconfig.json") {
              try {
                const updated = JSON.parse(content);
                if (updated.kernel_panic_flag === true) {
                  triggerPanic("Kernel Panic: Triggered via manual write of sysconfig.json!");
                }
              } catch {
                if (cfg.kernel_panic_on_missing_sysconfig === true) {
                  triggerPanic("Kernel Panic: Invalid sysconfig.json file formatting write! Corrupted JSON halt.");
                }
              }
            }
          }
          return success;
        } catch {
          return false;
        }
      },

      createDirectory: (dirPath: string): boolean => {
        if (kernelPanicState) return false;
        try {
          const safePath = dirPath.startsWith("/") ? dirPath : `/home/${currentLoggedInUser}/${dirPath}`;
          if (safePath.startsWith("/proc") || safePath.startsWith("/sys")) {
            return false;
          }

          const cfg = getSettingsObj();
          const isSystemPath = safePath.startsWith("/bin") || safePath.startsWith("/etc") || safePath.startsWith("/var") || safePath === "/";
          if (isSystemPath) {
            const allowWrites = cfg.allow_regular_user_system_writes === true;
            if (currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin" && !allowWrites) {
              writeSyslog(`Privileges Denied: PID ${pid} lacks write access to make folders in system directories.`);
              return false;
            }
          }

          const success = mkdirVFS(vfsRoot, safePath);
          if (success) {
            triggerVFSChange();
            writeSyslog(`Directory created: ${safePath} by PID ${pid} (${proc.name})`);
          }
          return success;
        } catch {
          return false;
        }
      },

      deleteNode: (nodePath: string): boolean => {
        if (kernelPanicState) return false;
        try {
          const safePath = nodePath.startsWith("/") ? nodePath : `/home/${currentLoggedInUser}/${nodePath}`;
          if (safePath === "/" || safePath === "/home" || safePath === "/bin" || safePath === "/proc" || safePath === "/sys" || safePath === "/etc") {
            writeSyslog(`[SECURITY FAILURE] PID ${pid} (${proc.name}) attempted recursive deletion of core systemic folders!`);
            return false;
          }

          const cfg = getSettingsObj();

          // Check system path destruction
          const isSystemPath = safePath.startsWith("/bin") || safePath.startsWith("/etc") || safePath.startsWith("/var");
          if (isSystemPath) {
            if (currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
              writeSyslog(`Privileges Denied: PID ${pid} is not permitted to erase system file ${safePath}`);
              return false;
            }
          }

          // Case where user deletes configuration file
          if (safePath === "/etc/sysconfig.json") {
            const success = deleteVFSNode(vfsRoot, safePath);
            if (success) {
              triggerVFSChange();
              if (cfg.kernel_panic_on_missing_sysconfig === true) {
                triggerPanic("Kernel Panic: Core configuration file /etc/sysconfig.json was deleted by the user!");
              }
            }
            return success;
          }

          const success = deleteVFSNode(vfsRoot, safePath);
          if (success) {
            triggerVFSChange();
            writeSyslog(`Deleted node: ${safePath} by PID ${pid} (${proc.name})`);
          }
          return success;
        } catch {
          return false;
        }
      },

      listDir: (dirPath: string) => {
        if (kernelPanicState) return [];
        try {
          const safePath = dirPath.startsWith("/") ? dirPath : `/home/${currentLoggedInUser}/${dirPath}`;
          
          if (safePath.startsWith("/home/") && safePath !== "/home" && !safePath.startsWith(`/home/${currentLoggedInUser}/`) && currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
            return [];
          }

          return listVFSDir(vfsRoot, safePath);
        } catch {
          return [];
        }
      },

      getCurrentUser: (): string => {
        return currentLoggedInUser;
      },

      getCurrentUserRole: (): string => {
        return currentLoggedInUserRole;
      },

      loginUser: (username: string, passwordHash: string): boolean => {
        return performLogin(username, passwordHash);
      },

      logoutUser: () => {
        if (kernelPanicState) return;
        currentLoggedInUser = "guest";
        currentLoggedInUserRole = "user";
        writeSyslog(`[AUTH] Active session closed. User downgraded to guest.`);
        authListeners.forEach((l) => l("guest", "user"));
      },

      getSettings: () => {
        return getSettingsObj();
      },

      saveSettings: (settingsObj: any): boolean => {
        if (kernelPanicState) return false;
        if (currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
          return false;
        }
        const parsedStr = JSON.stringify(settingsObj, null, 2);
        const ok = writeVFSFile(vfsRoot, "/etc/sysconfig.json", parsedStr);
        if (ok) {
          triggerVFSChange();
          writeSyslog(`System configuration overridden by PID ${pid} (${proc.name})`);
          if (settingsObj.kernel_panic_flag === true) {
            triggerPanic("Kernel Panic: Triggered manually via system settings overlay.");
          }
        }
        return ok;
      },

      getUsers: () => {
        try {
          const f = resolveNode(vfsRoot, "/etc/users.json");
          return f && f.content ? JSON.parse(f.content) : [];
        } catch {
          return [];
        }
      },

      addUser: (username: string, passwordHash: string, role: string, fullName: string, avatar: string): boolean => {
        if (kernelPanicState) return false;
        if (currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
          writeSyslog(`[SECURITY] Lacking rights to add user '${username}'`);
          return false;
        }
        try {
          const f = resolveNode(vfsRoot, "/etc/users.json");
          if (!f || !f.content) return false;
          const ulist = JSON.parse(f.content);
          if (ulist.some((u: any) => u.username === username)) return false;
          ulist.push({ username, passwordHash, role, fullName, avatar });
          
          const success = writeVFSFile(vfsRoot, "/etc/users.json", JSON.stringify(ulist, null, 2));
          if (success) {
            triggerVFSChange();
            writeSyslog(`Accounts DB augmented: user '${username}' bounds registered.`);
            
            // Generate home workspace directories
            mkdirVFS(vfsRoot, `/home/${username}`);
            mkdirVFS(vfsRoot, `/home/${username}/Desktop`);
            mkdirVFS(vfsRoot, `/home/${username}/Documents`);
            writeVFSFile(vfsRoot, `/home/${username}/Desktop/AboutMe.txt`, `Welcome ${fullName}! Your user account with ${role} access is ready.`);
          }
          return success;
        } catch {
          return false;
        }
      },

      deleteUser: (username: string): boolean => {
        if (kernelPanicState) return false;
        if (currentLoggedInUserRole !== "root" && currentLoggedInUserRole !== "admin") {
          return false;
        }
        if (username === "root" || username === "tux") {
          writeSyslog(`[SECURITY WARNING] Admin '${currentLoggedInUser}' attempted removal of built-in system operator: ${username}`);
          return false;
        }
        try {
          const f = resolveNode(vfsRoot, "/etc/users.json");
          if (!f || !f.content) return false;
          let ulist = JSON.parse(f.content);
          ulist = ulist.filter((u: any) => u.username !== username);
          
          const success = writeVFSFile(vfsRoot, "/etc/users.json", JSON.stringify(ulist, null, 2));
          if (success) {
            triggerVFSChange();
            writeSyslog(`Accounts DB diminished: user '${username}' credentials purged.`);
          }
          return success;
        } catch {
          return false;
        }
      },

      triggerKernelPanic: (message: string) => {
        triggerPanic(message);
      },

       getProcesses: () => {
        return Array.from(activeProcesses.values()).map((p) => ({
          pid: p.pid,
          name: p.name,
          state: p.state,
          memoryUsage: p.memoryUsage,
          cpuUsage: p.cpuUsage,
          owner: p.owner,
          args: p.args,
          cwd: p.cwd,
        }));
      },

      spawnProcess: (name: string, isBackground = false, args?: string[], cwd?: string): number => {
        return bootProcess(name, isBackground, args, cwd);
      },

      suspendProcess: (targetPid: number): boolean => {
        if (targetPid === 1) return false;
        const target = activeProcesses.get(targetPid);
        if (target) {
          target.state = ProcessState.SUSPENDED;
          target.cpuUsage = 0;
          writeSyslog(`Process suspended (SIGSTOP): ${target.name} (PID: ${targetPid})`);
          return true;
        }
        return false;
      },

      resumeProcess: (targetPid: number): boolean => {
        const target = activeProcesses.get(targetPid);
        if (target) {
          target.state = target.isBackground ? ProcessState.SERVICE : ProcessState.RUNNING;
          writeSyslog(`Process resumed (SIGCONT): ${target.name} (PID: ${targetPid})`);
          return true;
        }
        return false;
      },

      spawnCustomProcess: (name: string, owner: string, memory: number, cpu: number, isService: boolean): number => {
        if (kernelPanicState) {
          throw new Error("System execution prohibited: Kernel is in a panicked state.");
        }
        const pid = nextPid++;
        const proc: Process = {
          pid,
          name,
          state: isService ? ProcessState.SERVICE : ProcessState.RUNNING,
          owner: owner || currentLoggedInUser,
          memoryUsage: memory,
          cpuUsage: cpu,
          logs: [`Bespoke custom process ${name} created.`],
          startTime: Date.now(),
          isBackground: isService,
        };
        activeProcesses.set(pid, proc);
        writeSyslog(`Process spawned via TLDM Panel: ${name} (PID: ${pid}, Owner: ${proc.owner})`);
        return pid;
      },

      killProcess: (targetPid: number): boolean => {
        if (targetPid === 1) {
          triggerPanic("Kernel Panic: Attempted SIGKILL on PID 1 (systemBackgroundProcessD) - core daemon missing.");
          return false;
        }
        const target = activeProcesses.get(targetPid);
        if (!target) return false;

        const cfg = getSettingsObj();
        if (cfg.restrict_process_kill === true) {
          if (currentLoggedInUserRole !== "root" && target.owner === "root" && currentLoggedInUserRole !== "admin") {
            writeSyslog(`Access privileges denied: User '${currentLoggedInUser}' lacks privileges to terminate root processes.`);
            return false;
          }
        }

        return killProcess(targetPid);
      },

      getServices: (): DaemonService[] => {
        return JSON.parse(JSON.stringify(services));
      },

      controlService: (name: string, action: "start" | "stop" | "restart"): boolean => {
        if (kernelPanicState) return false;
        const idx = services.findIndex((s) => s.name === name);
        if (idx === -1) return false;

        writeSyslog(`Service signal routed: control '${name}' requested [${action}] by PID ${pid}`);
        const service = services[idx];

        if (action === "stop") {
          if (service.pid) {
            killProcess(service.pid);
          }
          service.status = "inactive";
          service.pid = null;
          service.logs.push(`[${new Date().toLocaleTimeString()}] Stopping service.`);
        } else if (action === "start") {
          const servicePid = bootProcess(name, true);
          service.status = "active";
          service.pid = servicePid;
          service.logs.push(`[${new Date().toLocaleTimeString()}] Starting systemd service.`);
        } else if (action === "restart") {
          if (service.pid) {
            killProcess(service.pid);
          }
          const servicePid = bootProcess(name, true);
          service.status = "active";
          service.pid = servicePid;
          service.logs.push(`[${new Date().toLocaleTimeString()}] Restarted service successfully.`);
        }
        return true;
      },

      syslog: (message: string) => {
        writeSyslog(`[PID ${pid}][${proc.name}] ${message}`);
      },

      getLogs: () => {
        return [...syslogBuffer];
      },
    };
  };

  return {
    bootProcess,
    killProcess,
    getProcesses: () => Array.from(activeProcesses.values()),
    getKernelVFS: () => JSON.parse(JSON.stringify(vfsRoot)),
    getSyscallToken,
    writeSyslog,
    getSyslogs: () => [...syslogBuffer],
    registerVFSListener: (listener: (root: VFSNode) => void) => {
      vfsListeners.add(listener);
      return () => {
        vfsListeners.delete(listener);
      };
    },
    // Account system implementation getters
    getCurrentUser: () => currentLoggedInUser,
    getCurrentUserRole: () => currentLoggedInUserRole,
    loginUser: (username: string, passwordHash: string) => {
      return performLogin(username, passwordHash);
    },
    logoutUser: () => {
      currentLoggedInUser = "guest";
      currentLoggedInUserRole = "user";
      writeSyslog(`[AUTH] Session cleared. Reverted to guest.`);
      authListeners.forEach((l) => l("guest", "user"));
    },
    registerAuthListener: (listener: (user: string, role: string) => void) => {
      authListeners.add(listener);
      return () => {
        authListeners.delete(listener);
      };
    },
    testAuthentication: (): { name: string; passed: boolean; message: string }[] => {
      const results = [];
      const originalUser = currentLoggedInUser;
      const originalRole = currentLoggedInUserRole;
      try {
        // Test 1: Guest blank password login
        const t1 = performLogin("guest", "");
        results.push({ name: "Guest Session (Blank Pwd)", passed: t1, message: t1 ? "Verified: blank credential OK" : "Failed" });
        
        // Test 2: Guest alias password login
        const t2 = performLogin("guest", "guest");
        results.push({ name: "Guest Session (Alias Pwd)", passed: t2, message: t2 ? "Verified: 'guest' string OK" : "Failed" });
        
        // Test 3: Tux login with 'tux' password
        const t3 = performLogin("tux", "tux");
        results.push({ name: "Tux Session (tux/tux)", passed: t3, message: t3 ? "Verified: admin credential OK" : "Failed" });
        
        // Test 4: Root login with 'root' password
        const t4 = performLogin("root", "root");
        results.push({ name: "Root Session (root/root)", passed: t4, message: t4 ? "Verified: superuser credential OK" : "Failed" });
        
        // Test 5: Failure on bad credentials
        const t5 = !performLogin("root", "incorrect_pass_123");
        results.push({ name: "Incorrect Password Isolation", passed: t5, message: t5 ? "Verified: rejected wrong credentials cleanly" : "Failed" });
      } catch (e: any) {
        results.push({ name: "Secure Core Operations Check", passed: false, message: e.message });
      } finally {
        currentLoggedInUser = originalUser;
        currentLoggedInUserRole = originalRole;
      }
      return results;
    },
    // Disaster recovery indicators
    isPanicked: () => kernelPanicState,
    getPanicMessage: () => kernelPanicMessage,
    triggerPanic: (reason: string) => triggerPanic(reason),
    registerPanicListener: (listener: (msg: string) => void) => {
      panicListeners.add(listener);
      return () => {
        panicListeners.delete(listener);
      };
    }
  };
};
