import React, { useState, useEffect, useRef } from "react";
import { useWebOS } from "../hooks/useWebOS";
import WindowFrame from "./WindowFrame";
import { NodeType, WindowInstance, VFSNode } from "../types/os";
import { resolveNode } from "../kernel/vfs";
import { TlnxStyleProvider } from "../context/StyleSystemContext";

function scopeCSS(cssText: string, prefix: string): string {
  if (!cssText) return "";
  return cssText
    .split("}")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      const parts = trimmed.split("{");
      if (parts.length < 2) return trimmed;
      const selector = parts[0].trim();
      const rule = parts[1].trim();
      if (!selector) return trimmed;
      // scope nested selectors safely to not ruin outer UI
      const prefixedSelector = selector
        .split(",")
        .map((sel) => {
          const s = sel.trim();
          if (s.startsWith("@")) return s;
          return `${prefix} ${s}`;
        })
        .join(", ");
      return `${prefixedSelector} { ${rule} }`;
    })
    .join("\n");
}

// Apps imports
import TerminalApp from "./apps/TerminalApp";
import LeafpadApp from "./apps/LeafpadApp";
import SystemMonitorApp from "./apps/SystemMonitorApp";
import FileManagerApp from "./apps/FileManagerApp";
import MinesweeperApp from "./apps/MinesweeperApp";
import SurferApp from "./apps/SurferApp";
import SystemSettingsApp from "./apps/SystemSettingsApp";
import ImageViewerApp from "./apps/ImageViewerApp";
import VideoPlayerApp from "./apps/VideoPlayerApp";
import MusicPlayerApp from "./apps/MusicPlayerApp";
import DialogApp from "./apps/DialogApp";
import ThemeManagerApp from "./apps/ThemeManagerApp";
import AppRegistryApp from "./apps/AppRegistryApp";
import { DynamicAppRenderer } from "./apps/DynamicAppRenderer";

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
  Activity,
  Image as ImageIcon,
  Video,
  Music,
  Palette
} from "lucide-react";

const getAppIcon = (iconName?: string) => {
  switch (iconName) {
    case "monitor":
      return <Monitor className="w-3.5 h-3.5" />;
    case "terminal":
      return <TermIcon className="w-3.5 h-3.5" />;
    case "file-text":
      return <FileText className="w-3.5 h-3.5" />;
    case "cpu":
      return <Cpu className="w-3.5 h-3.5" />;
    case "folder":
      return <FolderOpen className="w-3.5 h-3.5" />;
    case "gamepad":
      return <Gamepad2 className="w-3.5 h-3.5" />;
    case "globe":
      return <Globe2 className="w-3.5 h-3.5" />;
    case "settings":
      return <SettingsIcon className="w-3.5 h-3.5" />;
    case "palette":
      return <Palette className="w-3.5 h-3.5" />;
    case "image":
      return <ImageIcon className="w-3.5 h-3.5" />;
    case "video":
      return <Video className="w-3.5 h-3.5" />;
    case "music":
      return <Music className="w-3.5 h-3.5" />;
    case "layout":
    default:
      return <AppWindow className="w-3.5 h-3.5" />;
  }
};

export default function Desktop() {
  const os = useWebOS();
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [placesMenuOpen, setPlacesMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [globalCwd, setGlobalCwd] = useState("/home/guest");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [glitchTicker, setGlitchTicker] = useState(0);

  // Resolve custom wallpapers from system VFS options in settings
  const liveSettingsObj = (os.kernel ? os.kernel?.getSyscallToken(1).getSettings() : {}) as any;
  const currentServicesList = os.kernel ? os.kernel?.getSyscallToken(1).getServices() : [];
  const isDesktopManagerActive = os.kernel ? currentServicesList.find(s => s.name === "desktop-manager.service")?.status !== "inactive" : true;
  const wallpaperCol1 = isDesktopManagerActive ? (liveSettingsObj?.custom_wallpaper_color_1 || "#1b1e20") : "#0a0a0a";
  const wallpaperCol2 = isDesktopManagerActive ? (liveSettingsObj?.custom_wallpaper_color_2 || "#2d3235") : "#0a0a0a";

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

  // Broken or glitched theme dynamic status updates and lag intervals
  useEffect(() => {
    if (liveSettingsObj?.current_desktop_theme !== "Broken") return;
    const interval = setInterval(() => {
      setGlitchTicker((t) => t + 1);
    }, 450);
    return () => clearInterval(interval);
  }, [liveSettingsObj?.current_desktop_theme]);

  useEffect(() => {
    if (liveSettingsObj?.current_desktop_theme !== "Broken") return;
    const lagInterval = setInterval(() => {
      const start = Date.now();
      while (Date.now() - start < 150) {
        // Blocks single-threaded loop execution for 150ms to create genuine system-wide input stagger and lag
      }
    }, 1200);
    return () => clearInterval(lagInterval);
  }, [liveSettingsObj?.current_desktop_theme]);

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
    return (
      <DetailedBootScreen
        logs={os.bootLog}
        bootLoaderPhase={(os as any).bootLoaderPhase}
        availableKernels={(os as any).availableKernels}
        selectedKernelId={(os as any).selectedKernelId}
        onSelectKernel={(os as any).selectKernelAndBoot}
      />
    );
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

  // Double click handler for desktop items
  const handleDesktopShortcutDoubleClick = (name: string, type: NodeType) => {
    const user = os.currentUser;
    const fullPath = `/home/${user}/Desktop/${name}`;
    if (type === NodeType.DIRECTORY) {
      os.launchApp("fileManagerUF", "VFS Node Manager", { content: fullPath });
    } else {
      const lower = name.toLowerCase();
      if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".bmp")) {
        os.launchApp("imageViewerUF", `Image Viewer - ${name}`, { content: fullPath, width: 620, height: 460 });
      } else if (lower.endsWith(".mp4") || lower.endsWith(".avi") || lower.endsWith(".mov") || lower.endsWith(".mkv") || lower.endsWith(".webm")) {
        os.launchApp("videoPlayerUF", `Video Player - ${name}`, { content: fullPath, width: 620, height: 480 });
      } else if (lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".ogg") || lower.endsWith(".flac") || lower.endsWith(".aac")) {
        os.launchApp("musicPlayerUF", `Music Player - ${name}`, { content: fullPath, width: 620, height: 460 });
      } else if (name.endsWith(".txt")) {
        os.launchApp("leafpadUF", `Leafpad - ${name}`, { content: fullPath });
      } else if (name.endsWith(".desktop")) {
        // Try to perform dynamic execution from .desktop contents
        const shortcutNode = os.vfs ? resolveNode(os.vfs, fullPath) : null;
        if (shortcutNode && shortcutNode.content) {
          const lines = shortcutNode.content.split("\n");
          const execLine = lines.find(line => line.startsWith("Exec="));
          if (execLine) {
            const execCmd = execLine.substring(5).trim();
            // Look up corresponding application in our dynamic apps manifest
            const matchedApp = (os.apps || []).find(app => 
              app.id.toLowerCase() === execCmd.toLowerCase() ||
              app.id.toLowerCase().replace(/uf[d]?$/, "") === execCmd.toLowerCase()
            );

            if (matchedApp) {
              let opts: any = {};
              if (matchedApp.id === "terminalUF") opts = { width: 680, height: 460 };
              else if (matchedApp.id === "themeManagerUF") opts = { width: 520, height: 420 };
              else if (matchedApp.id === "controlPanelUFD") opts = { width: 780, height: 500 };
              else if (matchedApp.id === "imageViewerUF") opts = { width: 620, height: 460 };
              else if (matchedApp.id === "videoPlayerUF") opts = { width: 620, height: 480 };
              else if (matchedApp.id === "musicPlayerUF") opts = { width: 620, height: 460 };
              else if (matchedApp.id === "appRegistryUF") opts = { width: 700, height: 500 };

              os.launchApp(matchedApp.id, matchedApp.name, opts);
              return;
            }
          }
        }

        // Fallback for static safety code
        if (name.includes("Minesweeper")) {
          os.launchApp("minesweeperUF", "Minesweeper Retro");
        } else if (name.includes("Leafpad")) {
          os.launchApp("leafpadUF", "Leafpad (Text Editor)");
        } else if (name.includes("Theme")) {
          os.launchApp("themeManagerUF", "Theme Configurator", { width: 520, height: 420 });
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

  const currentThemeClassName = `tlnx-theme-${String(liveSettingsObj?.current_desktop_theme || "Classic Blue").toLowerCase().replace(/\s+/g, "-")}`;

  // Custom User/System dynamic styling injection to support heavy compositor customizations
  const userThemeOverrideStyles = (
    <style id="trashlinux-theme-overrides">{`
      @layer SystemConfigOverride {
        /* Set Top Panel Background */
        .top-panel-main {
          background: ${liveSettingsObj?.theme_panel_bg || "linear-gradient(to bottom, #fafafa 0%, #cccccc 100%)"} !important;
        }

        /* Set Custom Window Window background & border radius */
        .silver-window {
          background-color: ${liveSettingsObj?.theme_window_bg || "#f0ede6"} !important;
          border-radius: ${liveSettingsObj?.theme_window_border_radius || "6px"} !important;
        }

        /* Set Custom Bevel Border Style if specified */
        ${
          liveSettingsObj?.window_bevel_style === "flat_minimal"
            ? `
            .silver-window {
              border: 1px solid #71717a !important;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            }
            `
            : liveSettingsObj?.window_bevel_style === "shattered_corrupt"
            ? `
            .silver-window {
              border: 2px dashed #dc2626 !important;
              box-shadow: 0 12px 30px rgba(120, 0, 0, 0.4) !important;
              animation: tlnx-anim-screen-vibrate 0.2s infinite alternate;
            }
            `
            : `
            /* classic_bevel: windows classic 3D border shadows */
            .silver-window {
              border: 1px solid #85837d !important;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.28) !important;
            }
            `
        }

        /* Set Header Banner (Active) */
        .silver-header {
          background: ${liveSettingsObj?.theme_header_active_bg || "linear-gradient(180deg, #ffffff 0%, #eceae6 20%, #d8d4cd 50%, #c4bfae 100%)"} !important;
          color: ${liveSettingsObj?.theme_header_active_text || "#1a1e20"} !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
          text-shadow: none !important;
        }

        /* Set Header Banner (Inactive) */
        .silver-header-inactive {
          background: ${liveSettingsObj?.theme_header_inactive_bg || "linear-gradient(180deg, #fcfcfc 0%, #e8e8e8 30%, #d1d1d1 70%, #bababa 100%)"} !important;
          color: ${liveSettingsObj?.theme_header_inactive_text || "#7a766f"} !important;
          text-shadow: none !important;
          box-shadow: none !important;
        }

        /* Set Window Title text coloring */
        .silver-window-title span {
          color: ${liveSettingsObj?.theme_header_active_text || "#1a1e20"} !important;
        }

        .silver-window-inactive .silver-window-title span {
          color: ${liveSettingsObj?.theme_header_inactive_text || "#7a766f"} !important;
        }

        /* Scope customized overrides inside wrapper bounds */
        ${scopeCSS(liveSettingsObj?.custom_css_overrides || "", ".tlnx-desktop-wrapper")}
      }
    `}</style>
  );

  let desktopBackgroundStyle: React.CSSProperties = {};
  if (!isDesktopManagerActive) {
    desktopBackgroundStyle = { background: "#0a0a0a" };
  } else {
    const wallType = liveSettingsObj?.wallpaper_type || "gradient";
    if (wallType === "color") {
      desktopBackgroundStyle = { backgroundColor: liveSettingsObj?.wallpaper_solid_color || "#1b1e20" };
    } else if (wallType === "image") {
      const imgUrl = liveSettingsObj?.wallpaper_image_url || "";
      desktopBackgroundStyle = {
        backgroundImage: imgUrl ? `url(${imgUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#1b1e20",
        backgroundRepeat: "no-repeat"
      };
    } else {
      if (liveSettingsObj?.wallpaper_gradient_css) {
        desktopBackgroundStyle = { background: liveSettingsObj.wallpaper_gradient_css };
      } else {
        desktopBackgroundStyle = {
          background: `linear-gradient(135deg, ${wallpaperCol1} 0%, ${wallpaperCol2} 100%)`
        };
      }
    }
  }

  const styleSystemRules = liveSettingsObj?.style_system_rules || {};

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden relative select-none bg-[#1a1e20] font-sans text-xs ${currentThemeClassName} tlnx-desktop-wrapper`}>
      {userThemeOverrideStyles}
      
      <TlnxStyleProvider rules={styleSystemRules}>
        {/* Immersive UI Wallpaper Gradient configured in Control Panel */}
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-all duration-700 opacity-95"
          style={desktopBackgroundStyle}
        />

      {/* TOP TRASHLINUX PANEL BAR */}
      <div className="h-7 w-full top-panel-main bg-gradient-to-b from-[#fafafa] via-[#e2e2e2] to-[#cccccc] border-b border-b-[#a0a0a0] flex items-center justify-between px-2 text-[11px] text-black z-50 select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1.5px_3px_rgba(0,0,0,0.15)]">
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
              <div className="absolute top-[22px] left-0 w-60 bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-xl divide-y divide-[#808080]/30 z-50 text-[10.5px] max-h-96 overflow-y-auto">
                {(os.apps && os.apps.length > 0 ? os.apps : []).filter(app => app.id !== "desktopEnv").map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      let opts: any = {};
                      if (app.id === "terminalUF") {
                        opts = { width: 680, height: 460 };
                      } else if (app.id === "themeManagerUF") {
                        opts = { width: 520, height: 420 };
                      } else if (app.id === "controlPanelUFD") {
                        opts = { width: 780, height: 500 };
                      } else if (app.id === "imageViewerUF") {
                        opts = { width: 620, height: 460 };
                      } else if (app.id === "videoPlayerUF") {
                        opts = { width: 620, height: 480 };
                      } else if (app.id === "musicPlayerUF") {
                        opts = { width: 620, height: 460 };
                      } else if (app.id === "appRegistryUF") {
                        opts = { width: 700, height: 500 };
                      }
                      os.launchApp(app.id, app.name, opts);
                      setAppsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#002080] hover:text-white flex items-start space-x-2 text-black"
                    title={`${app.description} (v${app.version} by ${app.author})`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getAppIcon(app.icon)}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold leading-none">{app.name}</span>
                      <span className="text-[8.5px] opacity-70 mt-0.5 max-w-[180px] truncate">{app.description}</span>
                    </div>
                  </button>
                ))}
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
                    os.launchApp("controlPanelUFD", "System Settings", { width: 780, height: 500 });
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold flex items-center space-x-2 text-black"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>System Settings</span>
                </button>

                <button
                  onClick={() => {
                    setAboutOpen(true);
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold flex items-center space-x-2 text-black"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>About System</span>
                </button>

                <button
                  onClick={() => {
                    os.logoutUser();
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#002080] hover:text-white font-bold flex items-center space-x-2 text-red-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>

                <button
                  onClick={() => {
                    os.rebootSystem();
                    setSystemMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-800 hover:text-white text-red-700 font-bold flex items-center space-x-2"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Restart System</span>
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
        {!isDesktopManagerActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 font-mono text-center p-6 select-none z-30">
            <div className="border-2 border-red-500 bg-red-950/40 p-5 max-w-md shadow-2xl animate-pulse text-red-500 rounded-none">
              <span className="text-2xl font-black block mb-2 font-mono">⚠️ DESKTOP COMPOSITOR PANIC ⚠️</span>
              <p className="text-[11px] leading-5 text-gray-300 font-mono">
                The <code className="text-red-400 font-bold">desktop-manager.service</code> background daemon was terminated or failed to start. Theme composites and wallpaper elements are frozen.
              </p>
              <div className="mt-5 flex space-x-2.5 justify-center">
                <button
                  onClick={() => {
                    if (os.kernel) {
                      os.kernel.getSyscallToken(1).controlService("desktop-manager.service", "start");
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white font-bold border-2 border-t-red-400 border-l-red-400 border-r-red-900 border-b-red-900 text-xs uppercase hover:bg-red-700 cursor-pointer"
                >
                  systemctl start desktop-manager
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
          const childDialogWin = os.windows.find((w) => w.appId === "dialogUF" && w.parentWindowId === win.id);

          return (
            <WindowFrame
              key={win.id}
              win={win}
              isActive={os.activeWindowId === win.id}
              isDisabled={!!childDialogWin}
              activeDialog={childDialogWin?.dialogData}
              onCloseDialog={os.closeDialog}
              onClose={os.closeWindow}
              onMinimize={os.minimizeWindow}
              onMaximize={os.maximizeWindow}
              onFocus={os.focusWindow}
              onMove={os.updateWindowPosition}
              onResize={os.updateWindowSize}
            >
               {win.appId === "dialogUF" && win.dialogData && (
                 <DialogApp
                   diag={win.dialogData}
                   onClose={(id, res) => os.closeDialog(win.id, res)}
                 />
               )}
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
              {win.appId === "themeManagerUF" && (
                <ThemeManagerApp syscall={syscall} />
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
              {win.appId === "appRegistryUF" && (
                <AppRegistryApp syscall={syscall} />
              )}
              {win.appId === "controlPanelUFD" && <SystemSettingsApp syscall={syscall} />}
              {win.appId === "systemFlagEditorUFD" && <SystemSettingsApp syscall={syscall} />}
              {win.appId === "imageViewerUF" && (
                <ImageViewerApp
                  syscall={syscall}
                  initialFilePath={win.args && win.args[0] ? win.args[0] : undefined}
                />
              )}
              {win.appId === "videoPlayerUF" && (
                <VideoPlayerApp
                  syscall={syscall}
                  initialFilePath={win.args && win.args[0] ? win.args[0] : undefined}
                />
              )}
              {win.appId === "musicPlayerUF" && (
                <MusicPlayerApp
                  syscall={syscall}
                  initialFilePath={win.args && win.args[0] ? win.args[0] : undefined}
                />
              )}
              {(() => {
                const builtInApps = [
                  "terminalUF", "leafpadUF", "systemMonitorUFD", "themeManagerUF",
                  "fileManagerUF", "minesweeperUF", "surferUF", "appRegistryUF",
                  "controlPanelUFD", "imageViewerUF", "videoPlayerUF", "musicPlayerUF"
                ];
                if (!builtInApps.includes(win.appId)) {
                  const matched = (os.apps || []).find((a) => a.id === win.appId || a.id.toLowerCase() === win.appId.toLowerCase());
                  if (matched && matched.path) {
                    return (
                      <DynamicAppRenderer
                        syscall={syscall}
                        appInfo={matched}
                      />
                    );
                  }
                }
                return null;
              })()}
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
      </div>

      {/* BOTTOM TASKS TRAY PANEL BAR */}
      <div className="h-7 w-full bg-gradient-to-b from-[#fafafa] via-[#e2e2e2] to-[#cccccc] border-t border-t-white border-b border-b-[#a0a0a0] flex items-center justify-between px-2 text-xs text-black select-none z-40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
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
            {os.windows.filter(w => w.appId !== "dialogUF").map((w) => {
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

      {liveSettingsObj?.current_desktop_theme === "Broken" && (
        <>
          <div className="absolute top-[10%] left-[25%] p-4 z-40 bg-black text-[#02ff05] font-mono select-none pointer-events-none text-[9px] border border-red-500 max-w-xs uppercase leading-3" style={{ animation: "tlnx-anim-artifact-flash 1s infinite alternate" }}>
            [FATAL INSTABILITY LEVEL 9]<br/>
            Core segment registers: corrupted<br/>
            PHYSICAL ADDR REF: 0xDEADBEEF<br/>
            THREAD INDEX LOCKED: OS PANIC INBOUND
          </div>
          <div className="absolute bottom-[20%] right-[15%] p-2 z-40 bg-[#250101] text-yellow-300 font-mono select-none pointer-events-none text-xs border-2 border-yellow-500 rounded flex items-center space-x-1" style={{ animation: "tlnx-anim-screen-vibrate 0.1s infinite alternate" }}>
            <span>⚠️ CRITICAL CORE FLUX STUTTER</span>
          </div>
          <div className="absolute top-[40%] right-[35%] w-32 h-16 bg-gradient-to-tr from-purple-900 to-green-950 opacity-40 z-30 pointer-events-none border border-green-500" style={{ animation: "tlnx-anim-screen-vibrate 0.3s infinite" }} />
        </>
      )}
      </TlnxStyleProvider>
    </div>
  );
}
