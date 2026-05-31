import { useState, useEffect, useRef, useCallback } from "react";
import { NodeType, Process, WindowInstance, DaemonService, ProcessState, VFSNode, DialogInstance } from "../types/os";
import * as Kernels from "../kernel/secureKernel";
import { KernelInstance } from "../kernel/secureKernel";
import { loadVFSFromDisk, resolveNode } from "../kernel/vfs";

let globalKernel: KernelInstance | null = null;

export const useWebOS = () => {
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [vfs, setVFS] = useState<VFSNode | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [currentCwd, setCurrentCwd] = useState<string>("/home/guest");
  const dialogs = windows.filter(w => w.appId === "dialogUF" && w.dialogData).map(w => w.dialogData!) as DialogInstance[];
  
  // Interactive FOB Boot Loader states
  const [bootLoaderPhase, setBootLoaderPhase] = useState<"loader" | "booting" | "none">("loader");
  const [availableKernels, setAvailableKernels] = useState<{ id: string; name: string; entry: string; version: string }[]>([]);
  const [selectedKernelId, setSelectedKernelId] = useState<string>("secure");
  
  // Real-time login & disaster hooks
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>("guest");
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");
  const [isKernelPanicked, setIsKernelPanicked] = useState<boolean>(false);
  const [panicMessage, setPanicMessage] = useState<string>("");

  const [clipboard, setClipboard] = useState<string>("");

  const kernelRef = useRef<KernelInstance | null>(null);

  const fortunesList = [
    "You will make a beautiful WebOS that compiles perfectly in 2026.",
    "A clean reboot solves 99.9% of your computer problems. Try 'systemctl reboot'.",
    "GNOME 2 is the peak evolutionary form of the desktop supervisor.",
    "Skeuomorphic gradients are warm and full of hope. Bring back 2006 web!",
    "Tux says: Eat more fishes, write more shell scripts, and beware of kernel panics.",
    "IndexedDB is your friend. Write your files, they'll survive the browser reload!",
    "Flashing LEDs inside a computer makes it run 18% faster.",
    "Have you checked your custom systemBackgroundProcessD logs today?",
  ];

  const handleCowsay = (text: string): string => {
    const len = text.length;
    const underline = "_".repeat(len + 2);
    const overline = "-".repeat(len + 2);
    return `   ${underline}
  < ${text} >
   ${overline}
          \\   ^__^
           \\  (oo)\\_______
              (__)\\       )\\/\\
                  ||----w |
                  ||     ||`;
  };

  // Load bootaid configuration dynamically from IndexedDB prior to bootloader initiation
  useEffect(() => {
    const initBootLoader = async () => {
      const rootVFS = await loadVFSFromDisk();
      setVFS(rootVFS);
      
      let kernelsList = [
        { id: "secure", name: "Standard Secure Kernel", entry: "createSecureKernel", version: "2.6.15-26" },
        { id: "xsi", name: "XSI Advanced Isolation Kernel", entry: "createXsiKernel", version: "2.8.2-xsi-386" },
        { id: "fob", name: "FOB Minimal Core Kernel", entry: "createFobKernel", version: "1.0.0-fob-core" }
      ];
      let defaultId = "secure";
      
      try {
        const bootaidNode = resolveNode(rootVFS, "/etc/bootaid.json");
        if (bootaidNode && bootaidNode.content) {
          const parsed = JSON.parse(bootaidNode.content);
          if (parsed.kernels && Array.isArray(parsed.kernels)) {
            kernelsList = parsed.kernels;
          }
          if (parsed.default) {
            const matched = kernelsList.find(k => k.entry === parsed.default);
            if (matched) {
              defaultId = matched.id;
            }
          }
        }
      } catch (err) {
        console.warn("Could not read bootaid.json from VFS on init, using core defaults:", err);
      }
      
      setAvailableKernels(kernelsList);
      setSelectedKernelId(defaultId);
    };
    
    initBootLoader();
  }, []);

  const selectKernelAndBoot = useCallback((kernelId: string) => {
    setSelectedKernelId(kernelId);
    setBootLoaderPhase("booting");
  }, []);

  // Perform boot sequence based on dynamic reflection matching available bootaid entries
  useEffect(() => {
    if (bootLoaderPhase !== "booting") return;

    let active = true;
    const runBoot = async () => {
      const logs: string[] = [];
      const addLog = (msg: string, delay = 60) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (active) {
              logs.push(msg);
              setBootLog([...logs]);
            }
            resolve();
          }, delay);
        });
      };

      await addLog("[    0.000000] FOB Boot Loader v1.2 initialising in Sandbox...", 30);
      await addLog("[    0.010432] Scanning VFS file descriptor: /etc/bootaid.json ... SUCCESS", 45);
      
      const chosenKernel = availableKernels.find(k => k.id === selectedKernelId) || {
        id: "secure",
        name: "Standard Secure Kernel",
        entry: "createSecureKernel",
        version: "2.6.15-26"
      };

      await addLog(`[    0.024102] Target chosen kernel: ${chosenKernel.name} (v${chosenKernel.version})`, 50);
      await addLog(`[    0.038190] FOB Boot Loader: performing dynamic JS module reflection on: '${chosenKernel.entry}'`, 60);

      const entryPoint = chosenKernel.entry;
      const kernelCreator = (Kernels as any)[entryPoint];
      
      if (typeof kernelCreator === "function") {
        await addLog(`[    0.052102] REFLECTION CONTRACT: Found function '${entryPoint}' of type function [OK]`, 50);
      } else {
        await addLog(`[    0.053120] REFLECTION WARNING: function '${entryPoint}' missing or corrupt! Falling back.`, 80);
      }

      // Load File System
      const rootVFS = await loadVFSFromDisk();
      if (!globalKernel) {
        if (typeof kernelCreator === "function") {
          globalKernel = kernelCreator(rootVFS);
        } else {
          globalKernel = Kernels.createSecureKernel(rootVFS);
        }
      }
      kernelRef.current = globalKernel;

      // Register system observers before init daemon starts
      kernelRef.current.registerPanicListener((reason) => {
        setIsKernelPanicked(true);
        setPanicMessage(reason);
      });

      // Synchronize credential states
      kernelRef.current.registerAuthListener((user, role) => {
        setCurrentUser(user);
        setCurrentUserRole(role);
        setCurrentCwd(`/home/${user}`);
      });

      await addLog(`[    0.104254] Instantiated Kernel module successfully. Checking capabilities...`, 50);
      const contractCaps = ["bootProcess", "killProcess", "getProcesses", "getKernelVFS", "getSyscallToken", "flushVFSToDisk", "getCurrentUser", "testAuthentication"];
      for (const cap of contractCaps) {
        const ok = typeof (kernelRef.current as any)[cap] === "function";
        await addLog(`               - capability verification: ${cap.padEnd(20, " ")} -> [${ok ? "FOUND" : "MISSING"}]`, 20);
      }

      await addLog("[    0.280015] EXT3-fs: mounting root block VFS with journaled integrity ... SUCCESS", 60);
      
      if (selectedKernelId === "xsi") {
        await addLog("[    0.301015] [XSI SEQUENCE] Enabling Advanced Page Table Namespace Isolation.", 50);
        await addLog("[    0.312105] [XSI SEQUENCE] Mounting inter-process shared memory blocks (SHM V5).", 50);
        await addLog("[    0.324267] [XSI SEQUENCE] Allocating semaphore isolation registers (SEM V5).", 50);
      } else if (selectedKernelId === "fob") {
        await addLog("[    0.301015] [FOB MODULE] Spawning slim core microkernel optimizations.", 35);
        await addLog("[    0.312105] [FOB MODULE] Bypassing audit daemon background routines.", 35);
      }

      await addLog("[    0.340115] Sandboxed Secure Kernel: COMPILING ISOLATION LAYERS ... [ OK ]", 60);
      await addLog("[    0.410115] Core Sysconfig system policies loaded from '/etc/sysconfig.json'", 60);
      await addLog("[    0.501254] Mounting IndexedDB Persistent block storage device /dev/idb0 ... SUCCESS", 80);

      // FSCK directories output
      const etcNode = resolveNode(rootVFS, "/etc")?.children;
      if (etcNode) {
        const etcFiles = Object.keys(etcNode).join(", ");
        await addLog(`[    0.521105] FSCK: verified '/etc/' directory nodes: [ ${etcFiles} ]`, 50);
      }

      const usersFile = resolveNode(rootVFS, "/etc/users.json");
      if (usersFile && usersFile.content) {
        try {
          const parsed = JSON.parse(usersFile.content);
          const usernames = parsed.map((ac: any) => ac.username).join(", ");
          await addLog(`[    0.540120] Dynamic Accounts parsed from users.json: [ ${usernames} ]`, 50);
        } catch {}
      }

      // Spawn Init Service Daemon
      kernelRef.current.bootProcess("systemBackgroundProcessD", true);

      await addLog("INIT: service 'systemBackgroundProcessD' [PID 1] spawned successfully.", 50);
      await addLog("[    0.602115] Starting essential daemon services...", 50);

      const runningServices = selectedKernelId === "fob" ? ["syslogd.service"]
        : selectedKernelId === "xsi" ? ["syslogd.service", "journald-logger.service", "memcleanG.service", "xsi-ipc-broker.service"]
        : ["syslogd.service", "journald-logger.service", "memcleanG.service"];

      for (const service of runningServices) {
        await addLog(`Starting ${service} ... [ OK ]`, 70);
        kernelRef.current.writeSyslog(`Boot completed for ${service}`);
      }

      await addLog("[   0.890011] Initializing GNOME Display Manager 2.14.3...", 70);
      await addLog("gdm-login: opening authentication Greeter session...", 80);
      await addLog(`Boot sequence fully completed. [ SYSTEM READY - FLAVOR: ${selectedKernelId.toUpperCase()} ]`, 80);

      // Save complete logs to /var/boot_log.txt on the VFS
      const completeLog = logs.join("\n");
      const bootWriterPid = kernelRef.current.bootProcess("bootlog_writer_proc", false);
      const wSyscall = kernelRef.current.getSyscallToken(bootWriterPid);
      try {
        wSyscall.writeFile("/var/boot_log.txt", completeLog);
        await addLog("Complete boot log saved cleanly to '/var/boot_log.txt' ... [ SUCCESS ]", 40);
      } catch (err: any) {
        console.error("Failed to write to VFS /var/boot_log.txt", err);
      } finally {
        kernelRef.current.killProcess(bootWriterPid);
      }

      if (active) {
        setVFS(kernelRef.current.getKernelVFS());
        setProcesses(kernelRef.current.getProcesses());
        
        kernelRef.current.registerVFSListener((newVFS) => {
          setVFS(newVFS);
        });

        if (kernelRef.current.isPanicked()) {
          setIsKernelPanicked(true);
          setPanicMessage(kernelRef.current.getPanicMessage());
        }

        setBootLoaderPhase("none");
        setIsBooting(false);
      }
    };

    runBoot();

    return () => {
      active = false;
    };
  }, [bootLoaderPhase, selectedKernelId, availableKernels]);

  // Sync process values periodically and close orphaned windows
  useEffect(() => {
    if (isBooting || !kernelRef.current || isKernelPanicked) return;
    const interval = setInterval(() => {
      if (kernelRef.current) {
        const activeProcs = kernelRef.current.getProcesses();
        setProcesses(activeProcs);

        // Filter windows whose owner PIDs are dead
        const alivePids = new Set(activeProcs.map(p => p.pid));
        setWindows((prev) => {
          const filtered = prev.filter((w) => {
            const match = w.id.match(/win_(\d+)_/);
            if (match) {
              const pid = parseInt(match[1], 10);
              return alivePids.has(pid);
            }
            return true;
          });
          return filtered;
        });

        if (kernelRef.current.isPanicked()) {
          setIsKernelPanicked(true);
          setPanicMessage(kernelRef.current.getPanicMessage());
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isBooting, isKernelPanicked]);

  // Handle Logins
  const loginUser = useCallback((username: string, pass: string): boolean => {
    if (!kernelRef.current) return false;
    const success = kernelRef.current.loginUser(username, pass);
    if (success) {
      setIsLoggedIn(true);
    }
    return success;
  }, []);

  const logoutUser = useCallback(() => {
    if (!kernelRef.current) return;
    kernelRef.current.logoutUser();
    setIsLoggedIn(false);
    setWindows([]);
    setActiveWindowId(null);
  }, []);

  // Window operations
  const launchApp = useCallback((appId: string, title: string, options?: { content?: string; width?: number; height?: number; args?: string[]; cwd?: string }) => {
    if (!kernelRef.current || isKernelPanicked) return;

    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      setWindows((prev) =>
        prev.map((w) =>
          w.appId === appId
            ? { ...w, isMinimized: false, zIndex: Math.max(...prev.map((x) => x.zIndex), 0) + 1, args: options?.args || w.args, cwd: options?.cwd || w.cwd }
            : w
        )
      );
      setActiveWindowId(existing.id);
      return;
    }

    // Launch process under current user's authority with args and cwd
    const args = options?.args || (options?.content ? [options.content] : []);
    const parentCwd = options?.cwd || "/home/" + kernelRef.current.getCurrentUser();
    const pid = kernelRef.current.bootProcess(appId, false, args, parentCwd);
    const windowId = `win_${pid}_${Date.now()}`;

    const width = options?.width || 680;
    const height = options?.height || 480;
    const screenW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const screenH = typeof window !== "undefined" ? window.innerHeight : 768;
    const x = Math.max(40, (screenW - width) / 2 + (windows.length * 25));
    const y = Math.max(60, (screenH - height) / 2 + (windows.length * 20));

    const newWindow: WindowInstance = {
      id: windowId,
      appId,
      title,
      x,
      y,
      width,
      height,
      isMaximized: false,
      isMinimized: false,
      zIndex: Math.max(...windows.map((w) => w.zIndex), 0) + 1,
      args,
      cwd: parentCwd,
    };

    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(windowId);
  }, [windows, isKernelPanicked]);

  const closeWindow = useCallback((windowId: string) => {
    if (kernelRef.current) {
      const match = windowId.match(/win_(\d+)_/);
      if (match) {
        const pid = parseInt(match[1], 10);
        kernelRef.current.killProcess(pid);
      }
    }
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
    if (activeWindowId === windowId) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const openDialog = useCallback((
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "question" | "input" | "import",
    options?: string[],
    ownerWindowId?: string,
    onClose?: (result: any) => void,
    initialInputVal?: string
  ) => {
    const id = `win_diag_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const dialogData: DialogInstance = {
      id,
      title,
      message,
      type,
      options: options || (type === "question" ? ["Yes", "No"] : ["OK"]),
      ownerWindowId,
      onClose,
      inputValue: initialInputVal || ""
    };

    const width = type === "import" ? 340 : 310;
    const height = type === "import" ? 230 : 200;
    const screenW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const screenH = typeof window !== "undefined" ? window.innerHeight : 768;

    let x = (screenW - width) / 2;
    let y = (screenH - height) / 2;

    if (ownerWindowId) {
      setWindows((prev) => {
        const parentWin = prev.find((w) => w.id === ownerWindowId);
        if (parentWin) {
          x = parentWin.x + (parentWin.width - width) / 2;
          y = parentWin.y + (parentWin.height - height) / 2;
        }
        return prev;
      });
    }

    const newWindow: WindowInstance = {
      id,
      appId: "dialogUF",
      title,
      x: Math.max(20, x),
      y: Math.max(40, y),
      width,
      height,
      isMaximized: false,
      isMinimized: false,
      zIndex: 99999,
      parentWindowId: ownerWindowId,
      dialogData,
    };

    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(id);
    return id;
  }, []);

  const closeDialog = useCallback((id: string, result: any) => {
    setWindows((prev) => {
      const targetWin = prev.find((w) => w.id === id || (w.dialogData && w.dialogData.id === id));
      if (targetWin && targetWin.dialogData && targetWin.dialogData.onClose) {
        try {
          targetWin.dialogData.onClose(result);
        } catch (e) {
          console.error("Error in Dialog onClose callback:", e);
        }
      }
      return prev.filter((w) => w.id !== (targetWin ? targetWin.id : id));
    });
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w))
    );
    if (activeWindowId === windowId) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 0);
      return prev.map((w) =>
        w.id === windowId ? { ...w, isMinimized: false, zIndex: maxZ + 1 } : w
      );
    });
    setActiveWindowId(windowId);
  }, []);

  const updateWindowPosition = useCallback((windowId: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, x, y } : w))
    );
  }, []);

  const updateWindowSize = useCallback((windowId: string, width: number, height: number, x?: number, y?: number) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === windowId) {
          return {
            ...w,
            width: Math.max(300, width),
            height: Math.max(200, height),
            x: x !== undefined ? x : w.x,
            y: y !== undefined ? y : w.y,
          };
        }
        return w;
      })
    );
  }, []);

  // Persist cached virtual filesystem on page leave or unload
  useEffect(() => {
    const handleLeave = () => {
      if (kernelRef.current && (kernelRef.current as any).flushVFSToDisk) {
        (kernelRef.current as any).flushVFSToDisk();
      }
    };
    window.addEventListener("beforeunload", handleLeave);
    window.addEventListener("pagehide", handleLeave);
    return () => {
      window.removeEventListener("beforeunload", handleLeave);
      window.removeEventListener("pagehide", handleLeave);
    };
  }, []);

  // System reboot command
  const rebootSystem = () => {
    setIsBooting(true);
    setIsLoggedIn(false);
    setWindows([]);
    setBootLog([]);
    setActiveWindowId(null);
    setIsKernelPanicked(false);
    setPanicMessage("");
    if (kernelRef.current) {
      kernelRef.current.logoutUser();
      kernelRef.current.writeSyslog("System reboot signal toggled by user request.");
      if ((kernelRef.current as any).flushVFSToDisk) {
        (kernelRef.current as any).flushVFSToDisk();
      }
    }
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // Secure CLI Shell Core Execution Parser
  const executeTerminalCommand = (line: string): string[] => {
    if (!kernelRef.current) return ["Error: Kernel offline."];
    if (isKernelPanicked) return ["System halted: Kernel Panic is active."];

    const termPid = kernelRef.current.bootProcess("cli_sh_proc", false);
    const syscall = kernelRef.current.getSyscallToken(termPid);

    const parts = line.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    let output: string[] = [];

    const compilePath = (target: string): string => {
      if (!target) return currentCwd;
      if (target.startsWith("/")) return target;
      if (target === ".") return currentCwd;
      if (target === "..") {
        const segs = currentCwd.split("/").filter(Boolean);
        if (segs.length <= 1) return "/";
        return "/" + segs.slice(0, segs.length - 1).join("/");
      }
      return currentCwd === "/" ? `/${target}` : `${currentCwd}/${target}`;
    };

    switch (cmd) {
      case "":
        output = [];
        break;

      case "help":
        output = [
          "Linux 2006 WebOS command-line utilities shell v1.0",
          "===================================================",
          "ls [dir]        - List items of a folder node/directory",
          "cd [dir]        - Shift console focus directory",
          "pwd             - Display present cursor workspace",
          "cat [file]      - Print full file context to shell",
          "mkdir [dir]     - Create structural directory node",
          "touch [file]    - Write empty or updated text file",
          "rm [target]     - Erase specified file or directory",
          "panic [msg]     - Force trigger a critical system Kernel Panic state",
          "neofetch        - Showcase WebOS credentials and system metrics",
          "fortune         - Display classic developer fortune quotes",
          "cowsay [msg]    - Draw a vintage ascii cow containing a message",
          "ps              - Monitor currently encapsulated PID logs",
          "kill [pid]      - Submit terminate flags to active thread",
          "systemctl       - Direct systemctl daemon manager system monitor status",
          "syslog          - Read the hardware and software kernel syslog file",
          "clear           - Flush terminals history frame",
          "reboot          - Triggers cold hardware OS reboot",
          "===================================================",
          "All files written are authenticated and audited by Security policies."
        ];
        break;

      case "panic":
        const panicReason = args.length > 0 ? args.join(" ") : "Core thread hardware interrupt exception (triggered via 'panic' command).";
        syscall.triggerKernelPanic(panicReason);
        output = ["Halt signal processed."];
        break;

      case "uname":
        if (args[0] === "-a") {
          const vFile = syscall.readFile("/proc/version");
          output = [vFile && !vFile.startsWith("Error") ? vFile : "Linux 2.6.15-26-386-WebKernel"];
        } else {
          output = ["Linux"];
        }
        break;

      case "neofetch":
        const u = syscall.getCurrentUser();
        const roleStr = syscall.getCurrentUserRole();
        const kernelVerFile = syscall.readFile("/proc/version");
        const kVer = kernelVerFile && !kernelVerFile.startsWith("Error") 
          ? kernelVerFile.replace("Linux version ", "").split(" ")[0] 
          : "2.6.15-26";
        output = [
          "            .-.-.          " + u + "@trashlinux-beast",
          "           ( o o )         ----------------------",
          "            | O |          OS: TrashLinux 0.04a-stable Build 42",
          "           /     \\         Kernel: " + kVer + "-SMP x86_64",
          "          /       \\        Uptime: " + Math.floor((Date.now() - (kernelRef.current ? 0 : Date.now())) / 60000) + " mins",
          "         /   - -   \\       Active Session: " + u + " [Role: " + roleStr + "]",
          "        /           \\      Shell: bash 1.14.7-trash",
          "       = ==  ===  == =     Resolution: 1024x768 (Rigid CLI)",
          "       |             |     DE: TLDM Desktop v0.01 (Clunky Steel)",
          "       |             |     WM: Metacity-Clunky (Window Manager Frame)",
          "       \\             /     CPU: Dumpster Fire x86 CPU @ 133MHz",
          "        \\           /      Memory: 74MB / 256MB (Physically Clamped)",
          "         '-=======_/'      Storage VFS Node count: " + Object.keys(syscall.listDir("/") || {}).length,
        ];
        break;

      case "fortune":
        const randQuote = fortunesList[Math.floor(Math.random() * fortunesList.length)];
        output = [randQuote];
        break;

      case "cowsay":
        const msg = args.length > 0 ? args.join(" ") : "Mooh! Build React apps with ultimate care!";
        output = handleCowsay(msg).split("\n");
        break;

      case "pwd":
        output = [currentCwd];
        break;

      case "ls":
        const targetDir = compilePath(args[0]);
        const list = syscall.listDir(targetDir);
        if (list.length === 0) {
          const checkNode = resolveNode(vfs!, targetDir);
          if (!checkNode) {
            output = [`ls: cannot access '${args[0]}': No such file or directory`];
          } else {
            output = [];
          }
        } else {
          output = [
            list.map((item) => (item.type === NodeType.DIRECTORY ? `${item.name}/` : item.name)).join("  "),
          ];
        }
        break;

      case "cd":
        const dest = args[0] || `/home/${syscall.getCurrentUser()}`;
        const targetCd = compilePath(dest);
        const cdNode = resolveNode(vfs!, targetCd);
        if (cdNode && cdNode.type === NodeType.DIRECTORY) {
          setCurrentCwd(targetCd);
          output = [];
        } else {
          output = [`cd: ${dest}: No such directory directory`];
        }
        break;

      case "cat":
        if (!args[0]) {
          output = ["Usage: cat [filename]"];
        } else {
          const targetFile = compilePath(args[0]);
          const fileVal = syscall.readFile(targetFile);
          if (fileVal.startsWith("Error:")) {
            output = [fileVal];
          } else {
            output = fileVal.split("\n");
          }
        }
        break;

      case "touch":
        if (!args[0]) {
          output = ["Usage: touch [filename]"];
        } else {
          const fileDest = compilePath(args[0]);
          const success = syscall.writeFile(fileDest, "");
          output = success ? [] : [`touch: cannot create file, permission check failed at '${args[0]}'`];
        }
        break;

      case "mkdir":
        if (!args[0]) {
          output = ["Usage: mkdir [directory_name]"];
        } else {
          const dirDest = compilePath(args[0]);
          const success = syscall.createDirectory(dirDest);
          output = success ? [] : [`mkdir: failed to structure directory, permission check failed at '${args[0]}'`];
        }
        break;

      case "rm":
        if (!args[0]) {
          output = ["Usage: rm [filename_or_directory]"];
        } else {
          const delPath = compilePath(args[0]);
          const success = syscall.deleteNode(delPath);
          output = success ? [] : [`rm: cannot remove specified node, permission check failed at '${args[0]}'`];
        }
        break;

      case "ps":
        const procs = syscall.getProcesses();
        output = [
          "  PID  USER     STATE    MEM_KB  CPU_PER  COMMAND",
          "---------------------------------------------------",
          ...procs.map((p) => {
            const pidStr = p.pid.toString().padStart(5, " ");
            const userStr = p.owner.padEnd(8, " ");
            const stateStr = p.state.padEnd(8, " ");
            const memStr = (p.memoryUsage || 1024).toString().padStart(6, " ");
            const cpuStr = (p.cpuUsage || 0).toString().padStart(6, " ");
            return `${pidStr}  ${userStr} ${stateStr} ${memStr}  ${cpuStr}%  ${p.name}`;
          }),
        ];
        break;

      case "kill":
        const targetToKill = parseInt(args[0], 10);
        if (isNaN(targetToKill)) {
          output = ["Usage: kill [PID]"];
        } else {
          const success = syscall.killProcess(targetToKill);
          output = success ? [`Terminated PID: ${targetToKill}`] : [`kill: PID ${targetToKill} - access denied, PID offline, or kernel halted.`];
        }
        break;

      case "systemctl":
        const action = args[0];
        const servName = args[1];

        if (!action) {
          const services = syscall.getServices();
          output = [
            "  UNIT_NAME                   DESCRIPTION                    STATUS    PID",
            "-----------------------------------------------------------------------------",
            ...services.map((s) => {
              const uName = s.name.padEnd(28, " ");
              const desc = s.description.padEnd(30, " ");
              const stat = s.status.padEnd(9, " ");
              const pidV = s.pid ? s.pid.toString() : "-";
              return `${uName} ${desc} ${stat} ${pidV}`;
            }),
            "",
            "Try: systemctl [start|stop|restart] [service]"
          ];
        } else if (action && servName) {
          const act = action.toLowerCase();
          if (act === "start" || act === "stop" || act === "restart") {
            const ok = syscall.controlService(servName, act as "start" | "stop" | "restart");
            output = ok ? [`Service control operation executed for ${servName}. Check systemlogs.`] : [`systemctl: action failed for service ${servName}`];
          } else {
            output = [`systemctl: action unknown: ${act}`];
          }
        } else {
          output = ["Usage: systemctl [start|stop|restart] [unit_name]"];
        }
        break;

      case "syslog":
        output = syscall.getLogs().slice(-25);
        break;

      case "reboot":
        rebootSystem();
        output = ["Rebooting hardware system loop..."];
        break;

      case "whoami":
        output = [syscall.getCurrentUser()];
        break;

      case "echo":
        output = [args.join(" ")];
        break;

      case "grep":
        if (args.length < 2) {
          output = ["Usage: grep [pattern] [filepath]"];
        } else {
          const pattern = args[0];
          const filepath = compilePath(args[1]);
          const fileVal = syscall.readFile(filepath);
          if (fileVal.startsWith("Error:")) {
            output = [fileVal];
          } else {
            const matches = fileVal.split("\n").filter(line => line.toLowerCase().includes(pattern.toLowerCase()));
            output = matches.length > 0 ? matches : ["No matching lines found."];
          }
        }
        break;

      case "nano":
        if (!args[0]) {
          output = ["Usage: nano [filename]"];
        } else {
          output = [`[NANO_MODE_ACTIVATE] ${compilePath(args[0])}`];
        }
        break;

      case "sudo":
        if (!args[0]) {
          output = ["Usage: sudo [command]"];
        } else {
          const userRole = syscall.getCurrentUserRole();
          if (userRole !== "admin" && userRole !== "root") {
            output = ["Permission denied: user guest is not in the sudoers file. This incident will be reported."];
          } else {
            const subLine = args.join(" ");
            output = [`Executing with administrator permissions:`, ...executeTerminalCommand(subLine)];
          }
        }
        break;

      default:
        const binCheck = compilePath(`/bin/${cmd}`);
        const binNode = resolveNode(vfs!, binCheck);
        if (binNode && binNode.type === NodeType.FILE) {
          output = binNode.content ? binNode.content.split("\n") : [`Executed user logic: ${cmd}`];
        } else {
          output = [`bash: command not found: ${cmd}. Try typing 'help' to review basic control guidelines.`];
        }
    }

    if (kernelRef.current) {
      kernelRef.current.killProcess(termPid);
    }

    return output;
  };

  return {
    isBooting,
    bootLog,
    vfs,
    processes,
    windows,
    activeWindowId,
    currentCwd,
    clipboard,
    setClipboard,
    setWindows,
    rebootSystem,
    launchApp,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    executeCommand: executeTerminalCommand,
    getSyslogs: () => (kernelRef.current ? kernelRef.current.getSyslogs() : []),
    kernel: kernelRef.current,
    testAuthentication: () => kernelRef.current ? kernelRef.current.testAuthentication() : [],
    
    // FOB Boot Loader options
    bootLoaderPhase,
    availableKernels,
    selectedKernelId,
    selectKernelAndBoot,

    // Dialog states
    dialogs,
    openDialog,
    closeDialog,

    // Auth-state managers exposed
    isLoggedIn,
    loginUser,
    logoutUser,
    currentUser,
    currentUserRole,
    
    // Disaster-state managers exposed
    isKernelPanicked,
    panicMessage,
    triggerKernelPanic: (m: string) => {
      if (kernelRef.current) kernelRef.current.triggerPanic(m);
    }
  };
};
