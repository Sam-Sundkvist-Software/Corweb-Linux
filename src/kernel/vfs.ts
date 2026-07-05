import { NodeType, VFSNode } from "../types/os";
import { createPremadeAssemblies } from "./gsocc";

const DB_NAME = "Linux2006WebOS_DB";
const STORE_NAME = "vfs_store";
const DB_VERSION = 1;

// Base VFS pre-population with 2006 Ubuntu / Linux vibes
const createBaseVFS = (): VFSNode => {
  return {
    name: "/",
    type: NodeType.DIRECTORY,
    createdAt: Date.now(),
    children: {
      bin: {
        name: "bin",
        type: NodeType.DIRECTORY,
        createdAt: Date.now(),
        children: {
          sh: { name: "sh", type: NodeType.FILE, createdAt: Date.now(), content: "#!/bin/sh\nEcho 'Retro Shell v1.0'" },
          systemctl: { name: "systemctl", type: NodeType.FILE, createdAt: Date.now(), content: "#!/bin/systemctl" },
          neofetch: { name: "neofetch", type: NodeType.FILE, createdAt: Date.now(), content: "# neofetch config" },
        },
      },
      etc: {
        name: "etc",
        type: NodeType.DIRECTORY,
        createdAt: Date.now(),
        children: {
          hostname: { name: "hostname", type: NodeType.FILE, createdAt: Date.now(), content: "trashlinux-beast" },
          issue: { name: "issue", type: NodeType.FILE, createdAt: Date.now(), content: "TrashLinux 0.04a (stable build) \\n \\l\n\n" },
          "sysconfig.json": {
            name: "sysconfig.json",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: JSON.stringify({
              hostname: "trashlinux-beast",
              dns_primary: "1.1.1.1",
              networking_enabled: true,
              system_sound: false,
              wallpaper_style: "Solid Slate",
              custom_wallpaper_color_1: "#1b1e20",
              custom_wallpaper_color_2: "#2d3235",
              syslog_verbosity: "DEBUG",
              allow_regular_user_system_writes: true,
              restrict_process_kill: false,
              allow_guest_terminal: true,
              simulated_cpu_threads: 1,
              show_welcome_tip: true,
              system_locked: false,
              kernel_panic_on_missing_sysconfig: true,
              kernel_panic_flag: false
            }, null, 2)
          },
          "users.json": {
            name: "users.json",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: JSON.stringify([
              { username: "root", passwordHash: "root", role: "root", fullName: "Root Administrator", avatar: "system" },
              { username: "tux", passwordHash: "tux", role: "admin", fullName: "Tux Hackerman", avatar: "penguin" },
              { username: "guest", passwordHash: "", role: "user", fullName: "Default Trash Guest", avatar: "guest" }
            ], null, 2)
          },
          motd: {
            name: "motd",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: `=====================================================
Welcome to TrashLinux (0.04a-stable Build 42)
The absolute clunkiest, rawest, but most powerful hacking system.
Armed with Process Spawning and Kernel Panic switches!

* Secure Sandboxed Kernel: SEVERE THREAT LEVEL
* Background Daemon Engine (systemctl manager): ACTIVE
* In-Memory VFS with Local Persistent IndexedDB: STABLE
* Direct Process Signals Hooked: PID SUSPEND / SIGKILL

Run 'help' to see advanced system commands.
Log in as 'root' for total CPU world domination.
=====================================================`,
          },
          resolv: { name: "resolv.conf", type: NodeType.FILE, createdAt: Date.now(), content: "nameserver 1.1.1.1\nnameserver 8.8.8.8" },
          "bootaid.json": {
            name: "bootaid.json",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: JSON.stringify({
              default: "createSecureKernel",
              kernels: [
                { id: "secure", name: "Standard Secure Kernel", entry: "createSecureKernel", version: "2.6.15-26" }
              ]
            }, null, 2)
          },
          "customAppRegistry.json": {
            name: "customAppRegistry.json",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: JSON.stringify([
              {
                id: "desktopEnv",
                name: "Desktop Environment",
                description: "Core window supervisor, start panels, shortcuts, and global skeuomorphic context managers",
                version: "1.0.0",
                dependencies: ["Kernel", "syslog.service"],
                author: "TrashLinux Core Development Group"
              },
              {
                id: "terminalUF",
                name: "Command Terminal",
                description: "Terminal shell with standard command emulation, process spawners, and local environment bindings",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "GNU Terminal Project"
              },
              {
                id: "fileManagerUF",
                name: "File Explorer",
                description: "File tree navigation suite and visual disk explorer",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "Nautilus File Manager Group"
              },
              {
                id: "leafpadUF",
                name: "Text Editor",
                description: "Lightweight, distraction-free document writer and editor",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "LXDE Group"
              },
              {
                id: "systemMonitorUFD",
                name: "System Monitor",
                description: "Process monitor, daemon service status manager, and threat control console",
                version: "1.0.0",
                dependencies: ["Kernel"],
                author: "Sysinternals Logging Division"
              },
              {
                id: "minesweeperUF",
                name: "Minesweeper Game",
                description: "Classic retro logic puzzle board game with customizable grids",
                version: "1.0.0",
                dependencies: [],
                author: "Retro Classics Inc"
              },
              {
                id: "surferUF",
                name: "Web Browser",
                description: "Text-based HTML visualizer and DNS lookup client",
                version: "1.0.0",
                dependencies: ["syslog.service"],
                author: "CERN Hackers Group"
              },
              {
                id: "controlPanelUFD",
                name: "System Settings",
                description: "Users account administrator and general configuration flags setup",
                version: "1.0.0",
                dependencies: ["Kernel"],
                author: "TrashLinux Admin Foundation"
              },
              {
                id: "themeManagerUF",
                name: "Theme Configurator",
                description: "Visual customizer for skeuomorphic borders, solid/gradient desktop wallpapers, custom CSS code injections, and system-wide CSS selectors rules engine",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "XFCE Customization Labs"
              },
              {
                id: "imageViewerUF",
                name: "Image Viewer",
                description: "A fast layout graphic browser supporting simple images and canvas pixels",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "GNOME Media Developers"
              },
              {
                id: "videoPlayerUF",
                name: "Video Player",
                description: "Visual stream media window rendering offline files and logs",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "VideoLAN Team"
              },
              {
                id: "musicPlayerUF",
                name: "Music Player",
                description: "Audio playlist utility to play music streams and tracks in retro skins",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "XMMS Music Player Group"
              },
              {
                id: "appRegistryUF",
                name: "App Registry Manager",
                description: "Administrative console to dynamic app registry configurations, dependencies, authors, and version bumps",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "System Registry Software Foundation"
              },
              {
                id: "assemblyInspectorUF",
                name: "Assembly Inspector",
                description: "ILSpy style decompiler and assembly object metadata tree browser for .soc library files",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "GSOCC Development Labs"
              },
              {
                id: "tlmlIdeUF",
                name: "TLML IDE",
                description: "Advanced Integrated Development Environment for TLML assembly program compiling, AutoCommit IntelliSense, and instruction debugging.",
                version: "1.0.0",
                dependencies: ["VFS"],
                author: "GSOCC Development Labs",
                icon: "terminal"
              }
            ], null, 2)
          },
        },
      },
      home: {
        name: "home",
        type: NodeType.DIRECTORY,
        createdAt: Date.now(),
        children: {
          tux: {
            name: "tux",
            type: NodeType.DIRECTORY,
            createdAt: Date.now(),
            children: {
              Desktop: {
                name: "Desktop",
                type: NodeType.DIRECTORY,
                createdAt: Date.now(),
                children: {
                  "Welcome.txt": {
                    name: "Welcome.txt",
                    type: NodeType.FILE,
                    createdAt: Date.now(),
                    content: `Welcome to TrashLinux v0.04a-stable!

This is TrashLinux, the legendary choice for extreme process control and sandboxed VFS exploration. It looks gray, clunky, and highly industrial, but it is 100x more powerful!

NEW PROCESS & SIGNAL CONTROLS:
1. Real Process Spawner: Open System Monitor, run the "Processes" tab, and use "Spawn Process" to create a standard thread with custom CPU/RAM quotas!
2. Thread Signals: Suspend (SIGSTOP), run (SIGCONT), or terminate (SIGKILL) any PID directly. Try suspending an active service or terminal and observe state shifts!
3. Dynamic systemctl: Stop or Restart active system logging units at will.
4. Shell Upgrades: Run 'ps', 'kill', 'systemctl', 'panic', or edit files using nano/vi via local VFS.

Everything persists to IndexedDB. If you brick the kernel, click "Hard Reset VFS" at GDM. Have fun!`,
                  },
                  "Leafpad.desktop": { name: "Leafpad.desktop", type: NodeType.FILE, createdAt: Date.now(), content: "Exec=leafpad" },
                  "Minesweeper.desktop": { name: "Minesweeper.desktop", type: NodeType.FILE, createdAt: Date.now(), content: "Exec=minesweeper" },
                  "ThemeConfigurator.desktop": { name: "ThemeConfigurator.desktop", type: NodeType.FILE, createdAt: Date.now(), content: "Exec=themeManager\nIcon=palette" },
                  "AssemblyInspector.desktop": { name: "AssemblyInspector.desktop", type: NodeType.FILE, createdAt: Date.now(), content: "Exec=assemblyInspector\nIcon=file-search" },
                  "TLML_IDE.desktop": { name: "TLML_IDE.desktop", type: NodeType.FILE, createdAt: Date.now(), content: "Exec=tlmlIde\nIcon=terminal" },
                },
              },
              Documents: {
                name: "Documents",
                type: NodeType.DIRECTORY,
                createdAt: Date.now(),
                children: {
                  Assemblies: {
                    name: "Assemblies",
                    type: NodeType.DIRECTORY,
                    createdAt: Date.now(),
                    children: {
                      "TLML.Lang.soc": {
                        name: "TLML.Lang.soc",
                        type: NodeType.FILE,
                        createdAt: Date.now(),
                        content: "" // Will be populated with correct standard library content on load
                      }
                    }
                  },
                  "kernel_security.txt": {
                    name: "kernel_security.txt",
                    type: NodeType.FILE,
                    createdAt: Date.now(),
                    content: `[KERNEL SANDBOXING & MEMORY ISOLATION DESIGN]

For absolute process protection, TrashLinux implements encapsulated system-call proxies.

* No child process has direct access to the global VFS object.
* The whole file tree is shielded inside closures.
* When processes boot, they receive a bespoke, bounded SysCall token.
* This SysCall token wraps VFS traversal functions inside closure-scopes.
* Attempting to access the environment window globals/document is prevented.
* VFS transactions are fully transactional and memory-safe.`,
                  },
                  "todo.txt": {
                    name: "todo.txt",
                    type: NodeType.FILE,
                    createdAt: Date.now(),
                    content: "- Hack the core memory buffers\n- Play Minesweeper record\n- Make the UI look even clunkier",
                  },
                },
              },
            },
          },
        },
      },
      var: {
        name: "var",
        type: NodeType.DIRECTORY,
        createdAt: Date.now(),
        children: {
          log: {
            name: "log",
            type: NodeType.DIRECTORY,
            createdAt: Date.now(),
            children: {
              syslog: {
                name: "syslog",
                type: NodeType.FILE,
                createdAt: Date.now(),
                content: `May 28 09:11:47 tux-dapper-2006 kernel: [    0.000000] Initializing WebOS functional Sandboxed Kernel...
May 28 09:11:47 tux-dapper-2006 kernel: [    0.012015] Secure closure namespaces initialized.
May 28 09:11:47 tux-dapper-2006 kernel: [    0.035411] Mounting Virtual File System (VFS)...
May 28 09:11:48 tux-dapper-2006 systemBackgroundProcessD[1]: Initializing fake-systemd background service manager.
May 28 09:11:48 tux-dapper-2006 systemBackgroundProcessD[1]: Loaded journald-logger.service.
May 28 09:11:48 tux-dapper-2006 systemBackgroundProcessD[1]: Loaded syslogd.service.
May 28 09:11:48 tux-dapper-2006 systemBackgroundProcessD[1]: Loaded memcleanG.service.
May 28 09:11:48 tux-dapper-2006 systemBackgroundProcessD[1]: Starting background essential services...`,
              },
            },
          },
        },
      },
      proc: {
        name: "proc",
        type: NodeType.DIRECTORY,
        createdAt: Date.now(),
        children: {
          version: {
            name: "version",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: "Linux version 2.6.15-26-386 (buildd@dapper-build) (gcc version 4.0.3) #1 PREEMPT Mon Jun 12 16:21:44 UTC 2006",
          },
          cpuinfo: {
            name: "cpuinfo",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: "processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel\t\t: 14\nmodel name\t: Intel(R) Core(TM) Solo CPU\nstepping\t: 8\ncpu MHz\t\t: 1833.000\ncache size\t: 2048 KB\nbogomips\t: 3662.01",
          },
          meminfo: {
            name: "meminfo",
            type: NodeType.FILE,
            createdAt: Date.now(),
            content: "MemTotal:       512760 kB\nMemFree:        321152 kB\nBuffers:         15212 kB\nCached:          82040 kB",
          },
        },
      },
    },
  };
};

// IndexedDB core integration helpers
export const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const loadVFSFromDisk = async (): Promise<VFSNode> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("root_vfs");

      request.onsuccess = () => {
        if (request.result) {
          const loadedVFS = request.result as VFSNode;
          let changed = false;

          // 1. Ensure Assembly Inspector desktop shortcut exists
          if (!resolveNode(loadedVFS, "/home/tux/Desktop/AssemblyInspector.desktop")) {
            writeVFSFile(loadedVFS, "/home/tux/Desktop/AssemblyInspector.desktop", "Exec=assemblyInspector\nIcon=file-search");
            changed = true;
          }

          // Ensure TLML IDE desktop shortcut exists
          if (!resolveNode(loadedVFS, "/home/tux/Desktop/TLML_IDE.desktop")) {
            writeVFSFile(loadedVFS, "/home/tux/Desktop/TLML_IDE.desktop", "Exec=tlmlIde\nIcon=terminal");
            changed = true;
          }

          // Ensure sys/lib directory exists and standard library is written
          if (!resolveNode(loadedVFS, "/sys")) {
            mkdirVFS(loadedVFS, "/sys");
            changed = true;
          }
          if (!resolveNode(loadedVFS, "/sys/lib")) {
            mkdirVFS(loadedVFS, "/sys/lib");
            changed = true;
          }

          const premade = createPremadeAssemblies();

          if (!resolveNode(loadedVFS, "/sys/lib/TLML.Lang.soc")) {
            writeVFSFile(loadedVFS, "/sys/lib/TLML.Lang.soc", JSON.stringify(premade["TLML.Lang"], null, 2));
            changed = true;
          } else {
            // Update to latest standard assembly definition with the new namespaces/methods
            writeVFSFile(loadedVFS, "/sys/lib/TLML.Lang.soc", JSON.stringify(premade["TLML.Lang"], null, 2));
            changed = true;
          }

          // 2. Ensure Assemblies directory and files exist
          if (!resolveNode(loadedVFS, "/home/tux/Documents/Assemblies")) {
            mkdirVFS(loadedVFS, "/home/tux/Documents/Assemblies");
            changed = true;
          }

          // Clean up distracting old assemblies from previous VFS states if present
          const distractingAssemblies = [
            "TrashKernel.Security.soc",
            "Quantum.Voxel.Physics.soc",
            "Diagnostics.Telemetry.soc"
          ];
          for (const key of distractingAssemblies) {
            const path = `/home/tux/Documents/Assemblies/${key}`;
            if (resolveNode(loadedVFS, path)) {
              deleteVFSNode(loadedVFS, path);
              changed = true;
            }
          }

          // Write updated TLML.Lang.soc to Assemblies folder too
          const langPath = `/home/tux/Documents/Assemblies/TLML.Lang.soc`;
          writeVFSFile(loadedVFS, langPath, JSON.stringify(premade["TLML.Lang"], null, 2));
          changed = true;

          // 3. Ensure customAppRegistry contains both apps
          const customRegistryNode = resolveNode(loadedVFS, "/etc/customAppRegistry.json");
          if (customRegistryNode && customRegistryNode.type === NodeType.FILE && customRegistryNode.content) {
            try {
              const registry = JSON.parse(customRegistryNode.content);
              if (Array.isArray(registry)) {
                let regChanged = false;
                if (!registry.some(app => app.id === "assemblyInspectorUF")) {
                  registry.push({
                    id: "assemblyInspectorUF",
                    name: "Assembly Inspector",
                    description: "ILSpy style decompiler and assembly object metadata tree browser for .soc library files",
                    version: "1.0.0",
                    dependencies: ["VFS"],
                    author: "GSOCC Development Labs"
                  });
                  regChanged = true;
                }
                if (!registry.some(app => app.id === "tlmlIdeUF")) {
                  registry.push({
                    id: "tlmlIdeUF",
                    name: "TLML IDE",
                    description: "Advanced Integrated Development Environment for TLML assembly program compiling, AutoCommit IntelliSense, and instruction debugging.",
                    version: "1.0.0",
                    dependencies: ["VFS"],
                    author: "GSOCC Development Labs",
                    icon: "terminal"
                  });
                  regChanged = true;
                }
                if (regChanged) {
                  customRegistryNode.content = JSON.stringify(registry, null, 2);
                  changed = true;
                }
              }
            } catch (err) {
              console.warn("Failed to parse customAppRegistry.json", err);
            }
          }

          // Legacy check backup
          const registryNode = resolveNode(loadedVFS, "/etc/apps/registry.json");
          if (registryNode && registryNode.type === NodeType.FILE && registryNode.content) {
            try {
              const registry = JSON.parse(registryNode.content);
              if (Array.isArray(registry) && !registry.some(app => app.id === "assemblyInspectorUF")) {
                registry.push({
                  id: "assemblyInspectorUF",
                  name: "Assembly Inspector",
                  description: "ILSpy style decompiler and assembly object metadata tree browser for .soc library files",
                  version: "1.0.0",
                  dependencies: ["VFS"],
                  author: "GSOCC Development Labs"
                });
                registryNode.content = JSON.stringify(registry, null, 2);
                changed = true;
              }
            } catch (err) {
              console.warn("Failed to parse registry.json to inject assemblyInspector", err);
            }
          }

          if (changed) {
            saveVFSToDisk(loadedVFS);
          }

          resolve(loadedVFS);
        } else {
          // If no VFS in indexedDB, create default and save
          const base = createBaseVFS();
          saveVFSToDisk(base);
          resolve(base);
        }
      };
      request.onerror = () => {
        resolve(createBaseVFS());
      };
    });
  } catch (e) {
    console.warn("Failed to read from IndexedDB, falling back to in-memory only", e);
    return createBaseVFS();
  }
};

export const saveVFSToDisk = async (rootNode: VFSNode): Promise<boolean> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(rootNode, "root_vfs");

      transaction.oncomplete = () => {
        resolve(true);
      };
      transaction.onerror = () => {
        resolve(false);
      };
    });
  } catch (e) {
    console.error("VFS Persisting Failure", e);
    return false;
  }
};

// Synchronous operations on the in-memory tree copy
// Split path to parts like "/home/tux/Desktop" -> ["home", "tux", "Desktop"]
export const parsePath = (path: string): string[] => {
  return path.split("/").filter((p) => p !== "");
};

export const resolveNode = (root: VFSNode, absolutePath: string): VFSNode | null => {
  if (absolutePath === "/") return root;
  const parts = parsePath(absolutePath);
  let current: VFSNode = root;

  for (const part of parts) {
    if (current.type !== NodeType.DIRECTORY || !current.children || !current.children[part]) {
      return null;
    }
    current = current.children[part];
  }
  return current;
};

export const writeVFSFile = (root: VFSNode, absolutePath: string, content: string): boolean => {
  const parts = parsePath(absolutePath);
  if (parts.length === 0) return false;

  const fileName = parts[parts.length - 1];
  const dirParts = parts.slice(0, parts.length - 1);

  let current = root;
  for (const part of dirParts) {
    if (current.type !== NodeType.DIRECTORY || !current.children) {
      return false;
    }
    if (!current.children[part]) {
      // Create folder dynamically for parents
      current.children[part] = {
        name: part,
        type: NodeType.DIRECTORY,
        createdAt: Date.now(),
        children: {},
      };
    }
    current = current.children[part];
  }

  if (current.type !== NodeType.DIRECTORY || !current.children) {
    return false;
  }

  current.children[fileName] = {
    name: fileName,
    type: NodeType.FILE,
    createdAt: Date.now(),
    content: content,
  };

  return true;
};

export const mkdirVFS = (root: VFSNode, absolutePath: string): boolean => {
  const parts = parsePath(absolutePath);
  if (parts.length === 0) return false;

  let current = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current.type !== NodeType.DIRECTORY || !current.children) {
      return false;
    }
    if (!current.children[part]) {
      // Create directory
      current.children[part] = {
        name: part,
        type: NodeType.DIRECTORY,
        createdAt: Date.now(),
        children: {},
      };
    } else if (i === parts.length - 1) {
      // Already exists at target path
      return false;
    }
    current = current.children[part];
  }

  return true;
};

export const deleteVFSNode = (root: VFSNode, absolutePath: string): boolean => {
  const parts = parsePath(absolutePath);
  if (parts.length === 0) return false;

  const targetName = parts[parts.length - 1];
  const dirParts = parts.slice(0, parts.length - 1);

  let current = root;
  for (const part of dirParts) {
    if (current.type !== NodeType.DIRECTORY || !current.children || !current.children[part]) {
      return false;
    }
    current = current.children[part];
  }

  if (current.type !== NodeType.DIRECTORY || !current.children || !current.children[targetName]) {
    return false;
  }

  delete current.children[targetName];
  return true;
};

export const readVFSFile = (root: VFSNode, absolutePath: string): string => {
  const node = resolveNode(root, absolutePath);
  if (node && node.type === NodeType.FILE) {
    return node.content ?? "";
  }
  throw new Error(`File not found or directory target error: ${absolutePath}`);
};

export const listVFSDir = (root: VFSNode, absolutePath: string): { name: string; type: NodeType }[] => {
  const node = resolveNode(root, absolutePath);
  if (node && node.type === NodeType.DIRECTORY && node.children) {
    return Object.values(node.children).map((child) => ({
      name: child.name,
      type: child.type,
    }));
  }
  return [];
};
