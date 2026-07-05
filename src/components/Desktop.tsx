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
import FileDialogApp from "./apps/FileDialogApp";
import { DynamicAppRenderer } from "./apps/DynamicAppRenderer";
import AssemblyInspectorApp from "./apps/AssemblyInspectorApp";
import TlmlIdeApp from "./apps/TlmlIdeApp";

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
  Palette,
  Binary
} from "lucide-react";

const getAppIcon = (iconName?: string) => {
  switch (iconName) {
    case "file-search":
      return <Binary className="w-3.5 h-3.5" />;
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
  const fileDialogCallbacksRef = useRef<Record<string, (paths: string[]) => void>>({});

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
          openFileDialog: (
            options: {
              mode: "open" | "save";
              selectType: "file" | "folder" | "both";
              multiselect?: boolean;
              initialPath?: string;
              allowedExtensions?: string[];
            },
            onSelect: (paths: string[]) => void
          ) => {
            const dialogId = `file_dialog_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            fileDialogCallbacksRef.current[dialogId] = onSelect;
            os.launchApp("fileDialogUF", options.mode === "save" ? "Save As" : "Open File", {
              width: 580,
              height: 430,
              args: [
                JSON.stringify({
                  ...options,
                  callbackId: dialogId,
                  parentWindowId: win.id
                })
              ]
            });
          }
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
    setContextMenu(null);
  };

  // Custom tooltips and context menu states definition
  const [tooltip, setTooltip] = useState<{
    text: string;
    title?: string;
    icon?: string;
    variant?: string;
    font?: string;
    x: number;
    y: number;
  } | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);

  // Dynamic boundaries check and repositioning of the custom tooltip element
  useEffect(() => {
    if (!tooltip || !tooltipRef.current) return;
    const el = tooltipRef.current;
    
    // Set off-screen first and transparent to let layout calculate actual dimensions clean
    el.style.left = "-9999px";
    el.style.top = "-9999px";
    el.style.opacity = "0";
    
    // Perform live measurements
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const screenW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const screenH = typeof window !== "undefined" ? window.innerHeight : 768;
    
    let left = tooltip.x + 12;
    let top = tooltip.y + 15;
    
    // Determine right border overrun
    if (left + width > screenW - 8) {
      left = tooltip.x - width - 12;
    }
    // Safe viewport clamping
    left = Math.max(8, Math.min(left, screenW - width - 8));
    
    // Determine bottom border overrun
    if (top + height > screenH - 8) {
      top = tooltip.y - height - 15;
    }
    // Safe viewport clamping
    top = Math.max(8, Math.min(top, screenH - height - 8));
    
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.opacity = "1";
  }, [tooltip]);

  const getTooltipStyles = (variant: string) => {
    switch (variant) {
      case "info":
        return {
          wrapper: "bg-[#e8f0fe] text-[#185abc] border border-[#4285f4] border-l-4 border-l-[#4285f4] shadow-md min-w-[200px]",
          iconColor: "text-[#4285f4]",
          titleColor: "text-[#174ea6] font-bold",
          textColor: "text-[#185abc]"
        };
      case "warning":
        return {
          wrapper: "bg-[#fef7e0] text-[#b06000] border border-[#f4b400] border-l-4 border-l-[#f4b400] shadow-md min-w-[200px]",
          iconColor: "text-[#e37400]",
          titleColor: "text-[#b06000] font-bold",
          textColor: "text-[#804600]"
        };
      case "error":
        return {
          wrapper: "bg-[#fce8e6] text-[#c5221f] border border-[#ea4335] border-l-4 border-l-[#ea4335] shadow-md min-w-[200px]",
          iconColor: "text-[#ea4335]",
          titleColor: "text-[#b0120a] font-bold",
          textColor: "text-[#b0120a]"
        };
      case "success":
        return {
          wrapper: "bg-[#e6f4ea] text-[#137333] border border-[#34a853] border-l-4 border-l-[#34a853] shadow-md min-w-[200px]",
          iconColor: "text-[#34a853]",
          titleColor: "text-[#137333] font-bold",
          textColor: "text-[#0d652d]"
        };
      case "system":
      case "retro":
      default:
        return {
          wrapper: "bg-[#ffffe1] text-black border border-black shadow-[2px_2px_4px_rgba(0,0,0,0.3)]",
          iconColor: "text-zinc-600",
          titleColor: "text-neutral-900 font-bold",
          textColor: "text-zinc-800"
        };
    }
  };

  const parseTooltipText = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <div key={lineIndex} className="min-h-[14px]">
          {parts.map((part, partIndex) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("*") && part.endsWith("*")) {
              return <em key={partIndex} className="italic">{part.slice(1, -1)}</em>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: "desktop" | "shortcut";
    shortcutName?: string;
    shortcutType?: NodeType;
  } | null>(null);

  // Global browser context menu block
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleGlobalContextMenu);
    const handleGlobalClickAway = () => {
      setContextMenu(null);
    };
    window.addEventListener("click", handleGlobalClickAway);
    return () => {
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
      window.removeEventListener("click", handleGlobalClickAway);
    };
  }, []);

  // Global mouse interaction handlers to achieve fully native custom tooltips over regular titles
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest("[title], [data-tooltip], [data-tooltip-title]") as HTMLElement;
      if (el) {
        let text = el.getAttribute("data-tooltip");
        if (!text) {
          const originalTitle = el.getAttribute("title");
          if (originalTitle) {
            el.setAttribute("data-tooltip", originalTitle);
            el.removeAttribute("title");
            text = originalTitle;
          }
        }
        
        const tooltipTitle = el.getAttribute("data-tooltip-title") || "";
        const tooltipIcon = el.getAttribute("data-tooltip-icon") || "";
        const tooltipVariant = el.getAttribute("data-tooltip-variant") || "default";
        const tooltipFont = el.getAttribute("data-tooltip-font") || "mono";

        if (text || tooltipTitle) {
          setTooltip({
            text: text || "",
            title: tooltipTitle,
            icon: tooltipIcon,
            variant: tooltipVariant,
            font: tooltipFont,
            x: e.clientX,
            y: e.clientY
          });
        }
      } else {
        setTooltip(null);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const el = target.closest("[data-tooltip], [data-tooltip-title]") as HTMLElement;
      if (el) {
        const text = el.getAttribute("data-tooltip") || "";
        const tooltipTitle = el.getAttribute("data-tooltip-title") || "";
        const tooltipIcon = el.getAttribute("data-tooltip-icon") || "";
        const tooltipVariant = el.getAttribute("data-tooltip-variant") || "default";
        const tooltipFont = el.getAttribute("data-tooltip-font") || "mono";
        
        if (text || tooltipTitle) {
          setTooltip({
            text,
            title: tooltipTitle,
            icon: tooltipIcon,
            variant: tooltipVariant,
            font: tooltipFont,
            x: e.clientX,
            y: e.clientY
          });
          return;
        }
      }
      setTooltip(null);
    };

    const handleMouseOut = () => {
      setTooltip(null);
    };

    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  // Bubbling / tunneling aware right-click handlers
  const handleDesktopBgContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest(".silver-window") || 
      target.closest(".top-panel-main") || 
      target.closest(".bottom-taskbar-main") ||
      target.closest(".about-dialog-modal")
    ) {
      return;
    }
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: "desktop"
    });
  };

  const handleDesktopShortcutContextMenu = (e: React.MouseEvent, name: string, type: NodeType) => {
    e.preventDefault();
    e.stopPropagation(); // Stop routing to the high level wallpaper handler
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: "shortcut",
      shortcutName: name,
      shortcutType: type
    });
  };

  // Directory and Text file creation utilizing native Visual systemialog boxes
  const handleCreateFolder = () => {
    setContextMenu(null);
    os.openDialog(
      "Create Directory",
      "Enter a name for the new folder:",
      "input",
      ["OK", "Cancel"],
      undefined,
      (result: any) => {
        if (result && typeof result === "string" && result.trim()) {
          const folderName = result.trim();
          if (os.kernel) {
            const userHomePath = `/home/${os.currentUser}/Desktop/${folderName}`;
            const token = os.kernel.getSyscallToken(1);
            const success = token.createDirectory(userHomePath);
            if (!success) {
              os.openDialog("Action Error", "Failed to create directory. It may already exist or you lack permission.", "error");
            }
          }
        }
      }
    );
  };

  const handleCreateFile = () => {
    setContextMenu(null);
    os.openDialog(
      "Create File",
      "Enter a name for the text document:",
      "input",
      ["OK", "Cancel"],
      undefined,
      (result: any) => {
        if (result && typeof result === "string" && result.trim()) {
          const fileName = result.trim();
          const sanitized = fileName.endsWith(".txt") ? fileName : `${fileName}.txt`;
          if (os.kernel) {
            const userHomePath = `/home/${os.currentUser}/Desktop/${sanitized}`;
            const token = os.kernel.getSyscallToken(1);
            const success = token.writeFile(userHomePath, "");
            if (!success) {
              os.openDialog("Action Error", "Failed to create file. Check folder permissions.", "error");
            }
          }
        }
      }
    );
  };

  const handleOpenShortcut = () => {
    if (contextMenu?.shortcutName && contextMenu?.shortcutType) {
      if (contextMenu.shortcutName === "Rules Control") {
        os.launchApp("control_panel", "Systemctl Rules Panel", { width: 780, height: 500 });
      } else {
        handleDesktopShortcutDoubleClick(contextMenu.shortcutName, contextMenu.shortcutType);
      }
    }
    setContextMenu(null);
  };

  const handleTrashShortcut = () => {
    if (contextMenu?.shortcutName === "Rules Control") {
      os.openDialog("Security System", "Cannot delete static system rules launcher shortcut.", "warning");
      setContextMenu(null);
      return;
    }
    if (contextMenu?.shortcutName && os.kernel) {
      const path = `/home/${os.currentUser}/Desktop/${contextMenu.shortcutName}`;
      const token = os.kernel.getSyscallToken(1);
      const success = token.deleteNode(path);
      if (!success) {
        os.openDialog("Security Block", "System denied write/delete command for current node.", "error");
      }
    }
    setContextMenu(null);
  };

  const handleInfoShortcut = () => {
    if (contextMenu?.shortcutName) {
      const isSystemLaunch = contextMenu.shortcutName === "Rules Control";
      const path = isSystemLaunch ? "/bin/control_panel" : `/home/${os.currentUser}/Desktop/${contextMenu.shortcutName}`;
      os.openDialog(
        "Node Details Utility",
        `Target path: ${path}\nType: ${contextMenu.shortcutType === NodeType.DIRECTORY ? "Directory" : "File"}\nStatus: Active & Secure\nGroup authority: system`,
        "info"
      );
    }
    setContextMenu(null);
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
              else if (matchedApp.id === "assemblyInspectorUF") opts = { width: 840, height: 540 };
              else if (matchedApp.id === "tlmlIdeUF") opts = { width: 950, height: 620 };

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
        } else if (name.includes("AssemblyInspector")) {
          os.launchApp("assemblyInspectorUF", "Assembly Inspector", { width: 840, height: 540 });
        } else if (name.includes("TLML_IDE") || name.includes("tlmlIde")) {
          os.launchApp("tlmlIdeUF", "TLML IDE", { width: 950, height: 620 });
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
                      } else if (app.id === "assemblyInspectorUF") {
                        opts = { width: 840, height: 540 };
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
          <div 
            data-tooltip-title="User Authentication Privilege"
            data-tooltip-icon="🔑"
            data-tooltip-variant="success"
            data-tooltip={`Your authenticated context is currently active under standard group rules.\n\nRole: **${os.currentUserRole}**\nSystem status: *secure*`}
            className="flex items-center space-x-1 px-1.5 py-[1px] bg-[#b8b4ac] border border-b-[#808080] border-r-[#808080] rounded-none font-bold uppercase text-black cursor-help"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
            <span>role: {os.currentUserRole}</span>
          </div>

          <div className="flex items-center space-x-1.5 border-r border-[#808080] pr-2 select-none">
            <Volume2 className="w-3.5 h-3.5 text-[#555] opacity-80 animate-none" />
            <Wifi className="w-3.5 h-3.5 text-[#555]" />
            <span 
              data-tooltip-title="Active Network Interface Controller"
              data-tooltip-icon="🌐"
              data-tooltip-variant="warning"
              data-tooltip={`eth0 is active on sandbox loopback: **127.0.0.1**.\n\nWarning: Socket listener is *throttled* within browser sandboxing. Launch XTerm and execute ping requests directly.`}
              className="text-[10px] bg-[#b8b4ac]/50 border border-[#808080] px-1 py-0.5 font-bold cursor-help"
            >
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
        onContextMenu={handleDesktopBgContextMenu}
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
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                type: "shortcut",
                shortcutName: "Rules Control",
                shortcutType: NodeType.DIRECTORY
              });
            }}
            data-tooltip-title="Kernel Configuration & Security Panel"
            data-tooltip-icon="⚙️"
            data-tooltip-variant="info"
            data-tooltip={`Manage real-time execution bounds, systemctl daemon rules, and binary runtimes.\n\nDouble-click to expand sandbox.`}
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
                onContextMenu={(e) => handleDesktopShortcutContextMenu(e, item.name, item.type)}
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
               {win.appId === "fileDialogUF" && (
                 <FileDialogApp
                   syscall={syscall}
                   args={win.args}
                   onClose={(paths) => {
                     const argObj = win.args && win.args[0] ? JSON.parse(win.args[0]) : null;
                     if (argObj && argObj.callbackId) {
                       const cb = fileDialogCallbacksRef.current[argObj.callbackId];
                       if (cb) {
                         cb(paths);
                         delete fileDialogCallbacksRef.current[argObj.callbackId];
                       }
                     }
                     os.closeWindow(win.id);
                   }}
                   onCancel={() => {
                     os.closeWindow(win.id);
                   }}
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
              {win.appId === "assemblyInspectorUF" && (
                <AssemblyInspectorApp syscall={syscall} />
              )}
              {win.appId === "tlmlIdeUF" && (
                <TlmlIdeApp syscall={syscall} />
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
      <div className="bottom-taskbar-main h-7 w-full bg-gradient-to-b from-[#fafafa] via-[#e2e2e2] to-[#cccccc] border-t border-t-white border-b border-b-[#a0a0a0] flex items-center justify-between px-2 text-xs text-black select-none z-40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="flex items-center space-x-1 flex-1 min-w-0 pr-4">
          {/* Toggle ALL Trigger */}
          <button
            onClick={handleToggleMinimizeAll}
            className="h-4.5 flex items-center px-2 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-[9.5px] font-bold cursor-pointer hover:bg-[#c0c0c0] active:border-t-[#808080] active:border-l-[#808080] uppercase tracking-wider h-5"
            data-tooltip-title="Desktop Compositor Switcher"
            data-tooltip-icon="🖥️"
            data-tooltip-variant="success"
            data-tooltip="Instantly minimize or restore all currently open terminal and program frames.\n\nUseful for clearing workspace clutter."
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
          <div className="grid grid-cols-2 gap-[2px] w-5 h-5 p-[1px] bg-[#bab4ac] border border-t-[#808080] border-l-[#808080] border-r-white border-b-white opacity-85" data-tooltip="Workspace Switcher">
            <div className="bg-[#002080]" />
            <div className="bg-transparent" />
            <div className="bg-transparent" />
            <div className="bg-transparent" />
          </div>

          <span className="text-gray-400 pl-0.5">|</span>

          <div
            className="flex items-center space-x-1 hover:bg-[#c0c0c0] h-5 px-1 cursor-pointer"
            onClick={() => os.launchApp("fileManagerUF", "VFS Node Explorer", { content: `/home/${user}` })}
            data-tooltip-title="File Explorer Launcher"
            data-tooltip-icon="📂"
            data-tooltip-variant="retro"
            data-tooltip="Launch the quick access file manager directly in your home directory *(/home/user)*.\n\nDouble-click or click to open."
          >
            <AppWindow className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* CUSTOM CONTEXT MENU ELEMENT OVERLAY */}
      {contextMenu && contextMenu.visible && (
        <div
          className="fixed bg-[#d4d0c8] select-none text-black text-xs min-w-44 py-1 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-[3px_3px_10px_rgba(0,0,0,0.4)] leading-5 p-0.5"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 450000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "desktop" ? (
            <div className="flex flex-col text-[11px] font-sans">
              <button
                onClick={handleCreateFolder}
                className="w-full text-left px-3 py-1 cursor-pointer hover:bg-[#002080] hover:text-white flex items-center space-x-2"
              >
                <span>📂</span>
                <span>New Directory...</span>
              </button>
              <button
                onClick={handleCreateFile}
                className="w-full text-left px-3 py-1 cursor-pointer hover:bg-[#002080] hover:text-white flex items-center space-x-2"
              >
                <span>📄</span>
                <span>New Text File...</span>
              </button>
              <div className="h-px bg-[#808080] my-1 mx-1.5" />
              <button
                onClick={() => {
                  os.launchApp("themeManagerUF", "Theme Configurator", { width: 520, height: 420 });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1 cursor-pointer hover:bg-[#002080] hover:text-white flex items-center space-x-2"
              >
                <span>🌅</span>
                <span>Configure Desktop</span>
              </button>
              <button
                onClick={() => {
                  os.launchApp("terminalUF", "XTerm Shell Server", { width: 685, height: 440 });
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1 cursor-pointer hover:bg-[#002080] hover:text-white flex items-center space-x-2"
              >
                <span>💻</span>
                <span>Terminal Shell</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col text-[11px] font-sans">
              <button
                onClick={handleOpenShortcut}
                className="w-full text-left px-3 py-1 cursor-pointer hover:bg-[#002080] hover:text-white font-bold flex items-center space-x-2"
              >
                <span>🏃‍♂️</span>
                <span>Execute program</span>
              </button>
              <button
                onClick={handleInfoShortcut}
                className="w-full text-left px-3 py-1 cursor-pointer hover:bg-[#002080] hover:text-white flex items-center space-x-2"
              >
                <span>ℹ️</span>
                <span>Display Info</span>
              </button>
              <div className="h-px bg-[#808080] my-1 mx-1.5" />
              <button
                onClick={handleTrashShortcut}
                className="w-full text-left px-3 py-1 cursor-pointer hover:bg-[#002080] hover:text-white text-red-800 flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Trash Item</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CUSTOM FLOATING BOUNDS-CHECKED TOOLTIP ELEMENT OVERLAY */}
      {tooltip && (() => {
        const tStyle = getTooltipStyles(tooltip.variant || "default");
        const fontClass = tooltip.font === "sans" ? "font-sans text-[11px]" : "font-mono text-[9.5px]";

        const iconToRender = tooltip.icon || (
          tooltip.variant === "info" ? "ℹ️" :
          tooltip.variant === "warning" ? "⚠️" :
          tooltip.variant === "error" ? "🛑" :
          tooltip.variant === "success" ? "✅" : ""
        );

        return (
          <div
            ref={tooltipRef}
            className={`fixed pointer-events-none p-2 shadow-[3px_3px_6px_rgba(0,0,0,0.25)] flex flex-row items-start gap-2 max-w-[260px] whitespace-normal break-words z-[510000] border-2 transition-opacity duration-75 ${tStyle.wrapper}`}
            style={{
              left: "-9999px",
              top: "-9999px",
              opacity: 0,
            }}
          >
            {iconToRender && (
              <span className="text-sm select-none shrink-0" style={{ transform: "translateY(1px)" }}>
                {iconToRender}
              </span>
            )}
            <div className="flex-1 flex flex-col gap-0.5">
              {tooltip.title && (
                <div className={`text-[11px] font-sans font-extrabold leading-tight tracking-tight uppercase ${tStyle.titleColor}`}>
                  {tooltip.title}
                </div>
              )}
              {tooltip.text && (
                <div className={`${fontClass} leading-normal tracking-wide ${tStyle.textColor}`}>
                  {parseTooltipText(tooltip.text)}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
