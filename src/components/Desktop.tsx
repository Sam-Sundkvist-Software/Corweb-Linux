import { useState, useEffect, useRef } from "react";
import { useWebOS } from "../hooks/useWebOS";
import WindowFrame from "./WindowFrame";
import { NodeType, WindowInstance, VFSNode } from "../types/os";
import { resolveNode } from "../kernel/vfs";

// Apps imports
import TerminalApp from "./apps/TerminalApp";
import LeafpadApp from "./apps/LeafpadApp";
import SystemMonitorApp from "./apps/SystemMonitorApp";
import FileManagerApp from "./apps/FileManagerApp";
import MinesweeperApp from "./apps/MinesweeperApp";
import SurferApp from "./apps/SurferApp";
import SystemSettingsApp from "./apps/SystemSettingsApp";
import SystemFlagEditorApp from "./apps/SystemFlagEditorApp";
import SystemDialogs from "./SystemDialogs";

// Boot Screens imports
import { DetailedBootScreen, GdmLoginScreen, KernelPanicScreen } from "./BootScreens";

// Icons imports
import {
  Monitor,
  Terminal as TermIcon,
  FileText,
  Cpu,
  FolderOpen,
  Gamepad2,
  Globe2,
  Wifi,
  Volume2,
  Calendar,
  Clock,
  LogOut,
  AppWindow,
  Info,
  Settings as SettingsIcon,
  User as UserIcon,
  ShieldCheck,
  Activity
} from "lucide-react";

export default function Desktop() {
  const os = useWebOS();
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [placesMenuOpen, setPlacesMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [globalCwd, setGlobalCwd] = useState("/home/guest");
  const [aboutOpen, setAboutOpen] = useState(false);

  // Stable window-aware custom Syscall interface cache to prevent React hook re-trigger loops
  const syscallsCacheRef = useRef<Record<string, any>>({});
  if (os.kernel) {
    const activeIds = new Set(os.windows.map((w) => w.id));
    // Clean deleted window instances from cache references
    Object.keys(syscallsCacheRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        delete syscallsCacheRef.current[id];
      }
    });

    // Populate or retrieve cached syscall tokens
    os.windows.forEach((win) => {
      if (!syscallsCacheRef.current[win.id]) {
        const shMatch = win.id.match(/win_(\d+)_/);
        const shPid = shMatch ? parseInt(shMatch[1], 10) : 99;
        const rawSyscall = os.kernel!.getSyscallToken(shPid);
        syscallsCacheRef.current[win.id] = {
          ...rawSyscall,
          openDialog: (
            title: string,
            message: string,
            type: "info" | "warning" | "error" | "question" | "input" | "import",
            options?: string[],
            onClose?: (result: any) => void,
            initialInputVal?: string
          ) => {
            return os.openDialog(title, message, type, options, win.id, onClose, initialInputVal);
          },
          closeDialog: os.closeDialog,
        };
      }
    });
  }

  // Time tracker hook
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update starting working directory whenever logged user changes
  useEffect(() => {
    if (os.currentUser) {
      setGlobalCwd(`/home/${os.currentUser}`);
    }
  }, [os.currentUser]);

  // Close menus when clicking desktop wallpaper
  const handleWallpaperClick = () => {
    setAppsMenuOpen(false);
    setPlacesMenuOpen(false);
    setSystemMenuOpen(false);
  };

  // 1. KERNEL PANIC SCREEN COVERAGE
  if (os.isKernelPanicked) {
    return <KernelPanicScreen reason={os.panicMessage} onReboot={os.rebootSystem} />;
  }

  // 2. DMESG BOOT SEQUENCE COVERAGE
  if (os.isBooting) {
    return <DetailedBootScreen logs={os.bootLog} />;
  }

  // 3. GDM LOGIN GREETER COVERAGE
  if (!os.isLoggedIn) {
    return (
      <GdmLoginScreen
        onLogin={os.loginUser}
        getUsers={() => (os.kernel ? os.kernel.getSyscallToken(1).getUsers() : [])}
        onReboot={os.rebootSystem}
        testAuthentication={os.testAuthentication}
      />
    );
  }

  // Resolve custom wallpapers from system VFS options in settings
  const liveSettingsObj = os.kernel ? os.kernel?.getSyscallToken(1).getSettings() : {};
  const wallpaperCol1 = liveSettingsObj?.custom_wallpaper_color_1 || "#1b1e20";
  const wallpaperCol2 = liveSettingsObj?.custom_wallpaper_color_2 || "#2d3235";

  // Double click handler for desktop items
  const handleDesktopShortcutDoubleClick = (name: string, type: NodeType) => {
    const user = os.currentUser;
    if (type === NodeType.DIRECTORY) {
      os.launchApp("fileManagerUF", "VFS Node Manager", { content: `/home/${user}/Desktop/${name}` });
    } else {
      if (name.endsWith(".txt")) {
        os.launchApp("leafpadUF", `Leafpad - ${name}`, { content: `/home/${user}/Desktop/${name}` });
      } else if (name.endsWith(".desktop")) {
        if (name.includes("Minesweeper")) {
          os.launchApp("minesweeperUF", "Minesweeper Retro");
        } else if (name.includes("Leafpad")) {
          os.launchApp("leafpadUF", "Leafpad (Text Editor)");
        }
      }
    }
  };

  // Active user's VFS Desktop files loader
  const user = os.currentUser;
  const desktopNodes = os.vfs ? resolveNode(os.vfs, `/home/${user}/Desktop`)?.children : null;
  const desktopItems = (desktopNodes ? Object.values(desktopNodes) : []) as VFSNode[];

  // Toggle Minimize All
  const handleToggleMinimizeAll = () => {
    const allMin = os.windows.every((w) => w.isMinimized);
    if (allMin) {
      os.setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: false })));
    } else {
      os.setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden relative select-none bg-[#111314] font-mono text-xs">
      
      {/* Immersive UI Wallpaper Gradient configured in Control Panel */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-700 opacity-95"
        style={{
          background: `linear-gradient(135deg, ${wallpaperCol1} 0%, ${wallpaperCol2} 100%)`,
          backgroundImage: "radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.5) 100%)"
        }}
      />

      {/* TOP TRASHLINUX PANEL BAR */}
      <div className="h-6 w-full bg-[#d4d0c8] border-b-2 border-b-[#808080] flex items-center justify-between px-2 text-[11px] text-black z-50 select-none">
        <div className="flex items-center space-x-1">
          {/* Main system branding badge */}
          <div 
            onClick={() => setAboutOpen(true)}
            className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#b8b4ac] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] cursor-pointer mr-2 active:border-t-[#808080] active:border-l-[#808080] select-none"
          >
            <span className="text-xs">🗑️</span>
            <span className="font-extrabold tracking-tight text-[10px] uppercase text-black">TRASHLINUX</span>
          </div>

          {/* Applications Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setAppsMenuOpen(!appsMenuOpen);
                setPlacesMenuOpen(false);
                setSystemMenuOpen(false);
              }}
              className={`px-2.5 py-0.5 flex items-center space-x-1 transition-all rounded-none text-[11px] cursor-pointer ${
                appsMenuOpen 
                  ? "bg-[#b8b4ac] border border-t-[#808080] border-l-[#808080] border-r-white border-b-white font-bold" 
                  : "hover:bg-[#c0c0c0] border border-transparent"
              }`}
            >
              <span>[Applications]</span>
            </button>

            {appsMenuOpen && (
              <div className="absolute top-[22px] left-0 w-52 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-xl divide-y divide-[#808080]/30 z-50 text-[10.5px]">
                <button
                  onClick={() => {
                    os.launchApp("terminalUF", "Console Terminal (sh)");
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black"
                >
                  <TermIcon className="w-3.5 h-3.5 text-slate-800 hover:text-white" />
                  <span className="font-bold">sh terminal console</span>
                </button>

                <button
                  onClick={() => {
                    os.launchApp("fileManagerUF", "VFS Node Explorer");
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-bold">vfs file explorer</span>
                </button>

                <button
                  onClick={() => {
                    os.launchApp("leafpadUF", "Leafpad text editor");
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-bold">leafpad code text</span>
                </button>

                <button
                  onClick={() => {
                    os.launchApp("systemMonitorUFD", "Kernel Thread Monitor");
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black"
                >
                  <Cpu className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-bold">proc system monitor</span>
                </button>

                <button
                  onClick={() => {
                    os.launchApp("minesweeperUF", "Minesweeper Retro");
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-bold">retro minesweeper</span>
                </button>

                <button
                  onClick={() => {
                    os.launchApp("surferUF", "Surfer HTML browser");
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black"
                >
                  <Globe2 className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-bold">surfer web proxy</span>
                </button>

                <button
                  onClick={() => {
                    os.launchApp("controlPanelUFD", "Systemctl Rules Panel", { width: 780, height: 500 });
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-black">[systemctl rules]</span>
                </button>

                <button
                  onClick={() => {
                    os.launchApp("systemFlagEditorUFD", "systemFlagEditorUFD - Flag Editor Daemon");
                    setAppsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white flex items-center space-x-2 text-black border-t border-[#808080]/40"
                >
                  <Activity className="w-3.5 h-3.5 text-red-800" />
                  <span className="font-extrabold text-[#730500]">[flag editor daemon]</span>
                </button>
              </div>
            )}
          </div>

          {/* Places dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setPlacesMenuOpen(!placesMenuOpen);
                setAppsMenuOpen(false);
                setSystemMenuOpen(false);
              }}
              className={`px-2.5 py-0.5 flex items-center space-x-1 transition-all rounded-none text-[11px] cursor-pointer ${
                placesMenuOpen 
                  ? "bg-[#b8b4ac] border border-t-[#808080] border-l-[#808080] border-r-white border-b-white font-bold" 
                  : "hover:bg-[#c0c0c0] border border-transparent"
              }`}
            >
              <span>[Places]</span>
            </button>
            {placesMenuOpen && (
              <div className="absolute top-[22px] left-0 w-44 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-xl divide-y divide-[#808080]/30 z-50 text-[10.5px]">
                <button
                  onClick={() => {
                    os.launchApp("fileManagerUF", "VFS Node Explorer", { content: `/home/${user}` });
                    setPlacesMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold text-black"
                >
                  home folder
                </button>
                <button
                  onClick={() => {
                    os.launchApp("fileManagerUF", "VFS Node Explorer", { content: `/home/${user}/Desktop` });
                    setPlacesMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold text-black"
                >
                  desktop path
                </button>
                <button
                  onClick={() => {
                    os.launchApp("fileManagerUF", "VFS Node Explorer", { content: `/home/${user}/Documents` });
                    setPlacesMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold text-black"
                >
                  documents dir
                </button>
                <button
                  onClick={() => {
                    os.launchApp("fileManagerUF", "VFS Node Explorer", { content: "/" });
                    setPlacesMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold text-black"
                >
                  computer root (/)
                </button>
              </div>
            )}
          </div>

          {/* System Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setSystemMenuOpen(!systemMenuOpen);
                setAppsMenuOpen(false);
                setPlacesMenuOpen(false);
              }}
              className={`px-2.5 py-0.5 flex items-center space-x-1 transition-all rounded-none text-[11px] cursor-pointer ${
                systemMenuOpen 
                  ? "bg-[#b8b4ac] border border-t-[#808080] border-l-[#808080] border-r-white border-b-white font-bold" 
                  : "hover:bg-[#c0c0c0] border border-transparent"
              }`}
            >
              <span>[System]</span>
            </button>
            {systemMenuOpen && (
              <div className="absolute top-[22px] left-0 w-48 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-xl divide-y divide-[#808080]/30 z-50 text-[10.5px]">
                <button
                  onClick={() => {
                    os.launchApp("controlPanelUFD", "Systemctl Rules Panel", { width: 780, height: 500 });
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold flex items-center space-x-2 text-black"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>preferences center</span>
                </button>

                <button
                  onClick={() => {
                    setAboutOpen(true);
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold flex items-center space-x-2 text-black"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>about trashlinux</span>
                </button>

                <button
                  onClick={() => {
                    os.logoutUser();
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold flex items-center space-x-2 text-red-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>logout session</span>
                </button>

                <button
                  onClick={() => {
                    os.rebootSystem();
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-800 hover:text-white text-red-700 font-bold flex items-center space-x-2"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>cold reset loop</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TOP PANEL RIGHTS & SEC SECURITY STATS */}
        <div className="flex items-center space-x-2 text-[10.5px]">
          {/* Active privileges indicator */}
          <div className="flex items-center space-x-1 px-1.5 py-[1px] bg-[#b8b4ac] border border-b-[#808080] border-r-[#808080] rounded-none font-bold uppercase text-black">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
            <span>role: {os.currentUserRole}</span>
          </div>

          <div className="flex items-center space-x-1.5 border-r border-[#808080] pr-2 select-none">
            <Volume2 className="w-3.5 h-3.5 text-[#555] opacity-80" />
            <Wifi className="w-3.5 h-3.5 text-[#555]" />
            <span className="text-[10px] bg-[#b8b4ac]/50 border border-[#808080] px-1 py-0.5 font-bold">
              eth0: {liveSettingsObj?.networking_enabled !== false ? "127.0.0.1" : "offline"}
            </span>
          </div>

          <div className="flex items-center space-x-1 px-1">
            <Calendar className="w-3.5 h-3.5 text-[#555] opacity-85" />
            <span>{currentDate}</span>
            <span className="text-gray-400 pl-0.5">|</span>
            <Clock className="w-3.5 h-3.5 text-[#555] opacity-85" />
            <span className="font-bold text-slate-950">{currentTime}</span>
          </div>

          <button
            onClick={() => os.logoutUser()}
            className="p-1 hover:bg-[#808080] rounded transition-colors cursor-pointer"
            title="Log out and secure VFS state"
          >
            <LogOut className="w-3.5 h-3.5 text-red-800" />
          </button>
        </div>
      </div>

      {/* WORKSPACE MAIN DESKTOP GRID WALLPAPER */}
      <div
        className="flex-1 w-full relative z-10 p-4"
        onClick={handleWallpaperClick}
      >
        {/* DESKTOP INTEGRATED VFS SHORTCUT ICONS */}
        <div className="absolute top-10 left-10 flex flex-col space-y-4 items-center select-none z-10 w-24">
          
          {/* Default User Session Icon */}
          <div 
            onDoubleClick={() => os.launchApp("control_panel", "Systemctl Rules Panel", { width: 780, height: 500 })}
            className="flex flex-col items-center group cursor-pointer text-center w-22 p-1"
          >
            <div className="w-10 h-10 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center shadow-lg group-hover:scale-105 transition-all text-xl">
              ⚙️
            </div>
            <span className="text-white text-[11px] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] text-center font-bold mt-1.5">
              Rules Control
            </span>
          </div>

          {desktopItems.map((item) => {
            const isComputer = item.name === "Computer";
            const isHome = item.name === "Home" || item.name === user;
            return (
              <div
                key={item.name}
                onDoubleClick={() => handleDesktopShortcutDoubleClick(item.name, item.type)}
                className="flex flex-col items-center group cursor-pointer text-center w-22 p-1 select-all"
                style={{ contentVisibility: "auto" }}
              >
                {item.type === NodeType.DIRECTORY ? (
                  isComputer ? (
                    <div className="w-10 h-10 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center shadow-md">
                      <span>💻</span>
                    </div>
                  ) : isHome ? (
                    <div className="w-10 h-10 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center shadow-md">
                      <span>🏠</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center shadow-md relative">
                      <span>📁</span>
                    </div>
                  )
                ) : (
                  <div className="w-10 h-10 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center shadow-md">
                    <span>📄</span>
                  </div>
                )}
                <span className="text-white text-[11px] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)] text-center font-bold mt-1">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* ACTIVE WINDOW VIEWER STACKING PANEL */}
        {os.windows.map((win) => {
          const syscall = syscallsCacheRef.current[win.id] || (os.kernel ? os.kernel.getSyscallToken(99) : null);
          const activeDialog = os.dialogs.find((d) => d.ownerWindowId === win.id);

          return (
            <WindowFrame
              key={win.id}
              win={win}
              isActive={os.activeWindowId === win.id}
              isDisabled={!!activeDialog}
              activeDialog={activeDialog}
              onCloseDialog={os.closeDialog}
              onClose={os.closeWindow}
              onMinimize={os.minimizeWindow}
              onMaximize={os.maximizeWindow}
              onFocus={os.focusWindow}
              onMove={os.updateWindowPosition}
              onResize={os.updateWindowSize}
            >
               {win.appId === "terminalUF" && (
                <TerminalApp
                  syscall={syscall}
                  initialCwd={win.cwd || globalCwd}
                  onCwdChange={setGlobalCwd}
                  executeCommand={os.executeCommand}
                />
              )}
              {win.appId === "leafpadUF" && (
                <LeafpadApp
                  syscall={syscall}
                  initialFilePath={win.args && win.args[0] ? win.args[0] : undefined}
                />
              )}
              {win.appId === "systemMonitorUFD" && (
                <SystemMonitorApp syscall={syscall} />
              )}
              {win.appId === "fileManagerUF" && (
                <FileManagerApp
                  syscall={syscall}
                  onLaunchApp={os.launchApp}
                  currentGlobalCwd={win.args && win.args[0] ? win.args[0] : (win.cwd || globalCwd)}
                  onGlobalCwdChange={setGlobalCwd}
                />
              )}
              {win.appId === "minesweeperUF" && <MinesweeperApp />}
              {win.appId === "surferUF" && <SurferApp syscall={syscall} />}
              {win.appId === "controlPanelUFD" && <SystemSettingsApp syscall={syscall} />}
              {win.appId === "systemFlagEditorUFD" && <SystemFlagEditorApp syscall={syscall} />}
            </WindowFrame>
          );
        })}

        {/* ABOUT DIALOG MODAL PANEL */}
        {aboutOpen && (
          <div className="absolute inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="w-80 bg-[#d4d0c8] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col p-4 space-y-3.5">
              <div className="flex items-center space-x-2.5 border-b border-[#808080] pb-2">
                <span className="text-3xl">🗑️</span>
                <div>
                  <h3 className="font-bold text-sm text-black uppercase">TrashLinux v0.04a</h3>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-extrabold font-mono">Dumpster Fire Core Engine</span>
                </div>
              </div>

              <div className="text-[11px] leading-5 text-slate-800">
                <p>
                  A hardcore client-side OS sandbox paying homage to clunky vintage steel interfaces. Crafted entirely in rigid TS layouts, completely omitting unrequested fluid decorations.
                </p>
                <div className="mt-2 text-[9.5px] font-mono bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-2 text-gray-700 leading-4.5">
                  • Suspended & Resumed process registers<br />
                  • Custom Process Spawning & SIGKILL<br />
                  • Dynamic systemctl logger controls<br />
                  • Secure multi-role local filesystem
                </div>
              </div>

              <button
                onClick={() => setAboutOpen(false)}
                className="w-full py-1 bg-[#002080] text-white font-bold border-2 border-t-white border-l-white border-r-black border-b-black text-xs uppercase cursor-pointer"
              >
                Accept specs
              </button>
            </div>
          </div>
        )}

        {/* GLOBAL SYSTEM-WIDE DIALOG MODALS LAYER */}
        <SystemDialogs dialogs={os.dialogs} onCloseDialog={os.closeDialog} />
      </div>

      {/* BOTTOM TASKS TRAY PANEL BAR */}
      <div className="h-6 w-full bg-[#d4d0c8] border-t-2 border-t-white flex items-center justify-between px-2 text-xs text-black select-none z-40">
        <div className="flex items-center space-x-1 flex-1 min-w-0 pr-4">
          {/* Toggle ALL Trigger */}
          <button
            onClick={handleToggleMinimizeAll}
            className="h-4.5 flex items-center px-2 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-[9.5px] font-bold cursor-pointer hover:bg-[#c0c0c0] active:border-t-[#808080] active:border-l-[#808080] uppercase tracking-wider h-5"
            title="Minimize all opened windows overlay"
          >
            Show Desktop
          </button>

          <span className="text-gray-400 pl-0.5 select-none">|</span>

          {/* Tray loaded processes links */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {os.windows.map((w) => {
              const isActive = os.activeWindowId === w.id && !w.isMinimized;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    if (isActive) {
                      os.minimizeWindow(w.id);
                    } else {
                      os.focusWindow(w.id);
                    }
                  }}
                  className={`h-4.5 flex items-center px-2.5 text-[9.5px] border transition-all truncate max-w-[130px] cursor-pointer ${
                    isActive
                      ? "bg-[#bab4ac] border border-t-[#808080] border-l-[#808080] border-r-white border-b-white font-bold"
                      : "bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#c0c0c0]"
                  }`}
                >
                  {w.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Space indicator mock widget box */}
        <div className="flex items-center space-x-2">
          {/* 4 elements mini workspace grid picker */}
          <div className="grid grid-cols-2 gap-[2px] w-5 h-5 p-[1px] bg-[#bab4ac] border border-t-[#808080] border-l-[#808080] border-r-white border-b-white opacity-85" title="Workspace Switcher">
            <div className="bg-[#002080]" />
            <div className="bg-transparent" />
            <div className="bg-transparent" />
            <div className="bg-transparent" />
          </div>

          <span className="text-gray-400 pl-0.5">|</span>

          <div
            className="flex items-center space-x-1 hover:bg-[#c0c0c0] h-5 px-1 cursor-pointer"
            onClick={() => os.launchApp("fileManagerUF", "VFS Node Explorer", { content: `/home/${user}` })}
            title="Quick access file manager"
          >
            <AppWindow className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
