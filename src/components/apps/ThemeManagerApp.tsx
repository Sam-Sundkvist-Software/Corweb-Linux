import React, { useState, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";
import { StyleRegistry } from "../../context/StyleSystemContext";
import {
  Save,
  Trash,
  Palette,
  Plus,
  Settings,
  Check,
  RotateCcw,
  Info,
  Sliders,
  Image,
  Sparkles,
  RefreshCw,
  Code2,
  X,
  Type,
  Layout,
  Paintbrush
} from "lucide-react";

interface ThemeDefinition {
  id: string;
  name: string;
  custom_wallpaper_color_1: string;
  custom_wallpaper_color_2: string;
  window_bevel_style: string;
  theme_header_active_bg: string;
  theme_header_inactive_bg: string;
  theme_header_active_text: string;
  theme_header_inactive_text: string;
  theme_window_bg: string;
  theme_window_border_radius: string;
  theme_panel_bg: string;
  
  // Custom background & extra overrides parameters
  wallpaper_type?: "color" | "gradient" | "image";
  wallpaper_solid_color?: string;
  wallpaper_gradient_css?: string;
  wallpaper_image_url?: string;
  custom_css_overrides?: string;
  style_rules?: StyleRegistry;
  
  isSystem?: boolean;
}

interface ThemeManagerAppProps {
  syscall: SystemCallInterface;
}

const DEFAULT_SYSTEM_THEMES: ThemeDefinition[] = [
  {
    id: "classic-blue",
    name: "Classic Blue (Original)",
    custom_wallpaper_color_1: "#1b1e20",
    custom_wallpaper_color_2: "#2d3235",
    window_bevel_style: "classic_bevel",
    theme_header_active_bg: "linear-gradient(180deg, #ffffff 0%, #eceae6 20%, #d8d4cd 50%, #c4bfae 100%)",
    theme_header_inactive_bg: "linear-gradient(180deg, #fcfcfc 0%, #e8e8e8 30%, #d1d1d1 70%, #bababa 100%)",
    theme_header_active_text: "#1a1e20",
    theme_header_inactive_text: "#7a766f",
    theme_window_bg: "#f0ede6",
    theme_window_border_radius: "6px",
    theme_panel_bg: "linear-gradient(to bottom, #fafafa 0%, #cccccc 100%)",
    wallpaper_type: "gradient",
    wallpaper_solid_color: "#1b1e20",
    wallpaper_gradient_css: "linear-gradient(135deg, #1b1e20 0%, #2d3235 100%)",
    wallpaper_image_url: "",
    custom_css_overrides: "",
    style_rules: {
      "button": {
        "cursor": "pointer"
      },
      ".top-panel-main": {
        "fontSize": "11px",
        "fontWeight": "normal"
      }
    }
  },
  {
    id: "windows-1995",
    name: "Windows 95 Classic",
    custom_wallpaper_color_1: "#008080",
    custom_wallpaper_color_2: "#008080",
    window_bevel_style: "classic_bevel",
    theme_header_active_bg: "#000080",
    theme_header_inactive_bg: "#808080",
    theme_header_active_text: "#ffffff",
    theme_header_inactive_text: "#c0c0c0",
    theme_window_bg: "#c0c0c0",
    theme_window_border_radius: "0px",
    theme_panel_bg: "#c0c0c0",
    wallpaper_type: "color",
    wallpaper_solid_color: "#008080",
    wallpaper_gradient_css: "linear-gradient(135deg, #008080 0%, #008080 100%)",
    wallpaper_image_url: "",
    custom_css_overrides: "/* Vintage 95 tweaks */\n.top-panel-main {\n  font-family: sans-serif !important;\n}",
    style_rules: {
      "button": {
        "fontFamily": "sans-serif",
        "borderRadius": "0px",
        "fontWeight": "bold"
      },
      ".top-panel-main": {
        "fontFamily": "sans-serif",
        "fontWeight": "bold",
        "fontSize": "11.5px"
      }
    }
  },
  {
    id: "ubuntu-2006",
    name: "Ubuntu 2006 (Earthy)",
    custom_wallpaper_color_1: "#43261a",
    custom_wallpaper_color_2: "#211108",
    window_bevel_style: "flat_minimal",
    theme_header_active_bg: "linear-gradient(90deg, #3c2317 0%, #e95420 100%)",
    theme_header_inactive_bg: "#7a6e67",
    theme_header_active_text: "#efebe7",
    theme_header_inactive_text: "#dfdbd2",
    theme_window_bg: "#efebe7",
    theme_window_border_radius: "5px",
    theme_panel_bg: "linear-gradient(to bottom, #4d362d 0%, #3c2317 100%)",
    wallpaper_type: "gradient",
    wallpaper_solid_color: "#43261a",
    wallpaper_gradient_css: "linear-gradient(135deg, #43261a 0%, #211108 100%)",
    wallpaper_image_url: "",
    custom_css_overrides: "",
    style_rules: {
      "button": {
        "borderRadius": "4px",
        "color": "#222222"
      },
      ".top-panel-main": {
        "fontSize": "11.5px",
        "letterSpacing": "0.1px"
      }
    }
  },
  {
    id: "broken",
    name: "Broken (Glitched Core)",
    custom_wallpaper_color_1: "#2c0101",
    custom_wallpaper_color_2: "#050000",
    window_bevel_style: "shattered_corrupt",
    theme_header_active_bg: "repeating-linear-gradient(90deg, #000, #ff0055 50%, #00ff00 100%)",
    theme_header_inactive_bg: "#1a0101",
    theme_header_active_text: "#ffff00",
    theme_header_inactive_text: "#ff0055",
    theme_window_bg: "#1a0101",
    theme_window_border_radius: "16px",
    theme_panel_bg: "repeating-linear-gradient(45deg, #111, #111 12px, #ff0055 12px, #ff0055 24px)",
    wallpaper_type: "gradient",
    wallpaper_solid_color: "#2c0101",
    wallpaper_gradient_css: "repeating-linear-gradient(45deg, #2c0101, #050000 60px)",
    wallpaper_image_url: "",
    custom_css_overrides: "/* Corrupt theme effects */\n.top-panel-main {\n  text-decoration: line-through !important;\n}",
    style_rules: {
      "button": {
        "color": "#ff0055",
        "backgroundColor": "#0c0101",
        "borderColor": "#00ff00"
      },
      ".top-panel-main": {
        "letterSpacing": "-0.5px",
        "textDecoration": "line-through"
      }
    }
  }
];

const PRESET_WALLPAPERS = [
  { name: "Neon Sunset Vaporwave", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop" },
  { name: "Digital Aura", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop" },
  { name: "Abstract Fluid Art", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop" },
  { name: "Milkyway Deep Field", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop" },
  { name: "Cyberpunk Tech Matrix", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop" }
];

const CSS_OVERRIDE_PRESETS = [
  {
    name: "🎐 Frosted Glassmorphic Shell",
    css: `.silver-window {
  background-color: rgba(240, 237, 230, 0.45) !important;
  backdrop-filter: blur(8px) !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
}`
  },
  {
    name: "⚡ Cyberpunk Neon Glow",
    css: `.silver-window {
  border: 2px solid #00f0ff !important;
  box-shadow: 0 0 15px #00f0ff, inset 0 0 5px #00f0ff !important;
  background-color: #0b0b14 !important;
}
.silver-header {
  background: linear-gradient(90deg, #ff0055 0%, #00f0ff 100%) !important;
  color: #ffffff !important;
  text-shadow: 0 0 5px #ffffff !important;
}
.top-panel-main {
  background: #0b0b14 !important;
  border-bottom: 2px solid #ff0055 !important;
  box-shadow: 0 0 10px #ff0055 !important;
}`
  },
  {
    name: "📼 90s Vintage CRT Console",
    css: `.tlnx-desktop-wrapper {
  filter: sepia(30%) contrast(125%) brightness(95%) !important;
}
.top-panel-main {
  background: #102010 !important;
  border-bottom: 2px solid #33ff33 !important;
}
.silver-window {
  background-color: #051005 !important;
  border: 2px solid #33ff33 !important;
}
.silver-window-title span {
  color: #33ff33 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  text-shadow: 0 0 4px #33ff33 !important;
}`
  },
  {
    name: "✒️ High-Contrast Minimalist Slate",
    css: `.top-panel-main {
  background: #111111 !important;
  border-bottom: 1px solid #222222 !important;
}
.silver-window {
  background-color: #fafafa !important;
  border: 1px solid #000000 !important;
  box-shadow: 4px 4px 0px #000000 !important;
  border-radius: 0px !important;
}
.silver-header {
  background: #000000 !important;
  color: #ffffff !important;
  border-radius: 0px !important;
}`
  },
  {
    name: "🍬 Bubblegum Vaporwave",
    css: `.top-panel-main {
  background: linear-gradient(to right, #ff71ce, #01cdfe, #05ffa1) !important;
}
.silver-window {
  background-color: #ffb5e8 !important;
  border: 3px solid #b28dff !important;
  border-radius: 12px !important;
}
.silver-header {
  background: #01cdfe !important;
  color: #fffb96 !important;
}`
  }
];

interface StopItem {
  id: string;
  color: string;
  position: number;
}

export default function ThemeManagerApp({ syscall }: ThemeManagerAppProps) {
  const currentSettings = syscall.getSettings();
  const username = syscall.getCurrentUser();
  const userRole = syscall.getCurrentUserRole();

  // Active theme states
  const [activeThemeId, setActiveThemeId] = useState<string>(
    String(currentSettings.current_desktop_theme_id || "classic-blue")
  );

  const [systemThemes, setSystemThemes] = useState<ThemeDefinition[]>([]);
  const [userThemes, setUserThemes] = useState<ThemeDefinition[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Theme buffer compiler variables
  const [editorName, setEditorName] = useState("Custom Dynamic");
  const [editorWall1, setEditorWall1] = useState("#2e3436");
  const [editorWall2, setEditorWall2] = useState("#0f1214");
  const [editorBevel, setEditorBevel] = useState("classic_bevel");
  const [editorHeaderActive, setEditorHeaderActive] = useState("#073642");
  const [editorHeaderInactive, setEditorHeaderInactive] = useState("#586e75");
  const [editorHeaderTextActive, setEditorHeaderTextActive] = useState("#fdf6e3");
  const [editorHeaderTextInactive, setEditorHeaderTextInactive] = useState("#93a1a1");
  const [editorWindowBg, setEditorWindowBg] = useState("#eae6df");
  const [editorRadius, setEditorRadius] = useState("6px");
  const [editorPanelBg, setEditorPanelBg] = useState("#23282b");
  const [styleRules, setStyleRules] = useState<StyleRegistry>({});

  // Advanced Background Configuration fields
  const [wallpaperType, setWallpaperType] = useState<"color" | "gradient" | "image">("gradient");
  const [wallpaperSolidColor, setWallpaperSolidColor] = useState("#1b1e20");
  const [wallpaperGradientCss, setWallpaperGradientCss] = useState("linear-gradient(135deg, #1b1e20 0%, #2d3235 100%)");
  const [wallpaperImageUrl, setWallpaperImageUrl] = useState("");
  const [customCssOverrides, setCustomCssOverrides] = useState("");

  // Saving settings path
  const [savingLocation, setSavingLocation] = useState<"user" | "system">("user");

  // Specialized Sub-Dialog Window Overlays state
  const [activeOverlayDialog, setActiveOverlayDialog] = useState<"none" | "gradient_editor" | "css_overrides" | "image_presets" | "style_rules">("none");

  // --- LOCAL STATES FOR ADVANCED GRADIENT EDITOR ---
  const [gradType, setGradType] = useState<"linear" | "radial" | "conic">("linear");
  const [gradAngle, setGradAngle] = useState(135);
  const [gradShape, setGradShape] = useState<"circle" | "ellipse">("circle");
  const [gradPosition, setGradPosition] = useState("center");
  const [gradStops, setGradStops] = useState<StopItem[]>([
    { id: "st-1", color: "#1e3c72", position: 0 },
    { id: "st-2", color: "#2a5298", position: 100 }
  ]);

  // --- LOCAL STATES FOR ADVANCED TSX STYLE RULES EDITOR ---
  const [selectedRuleSelector, setSelectedRuleSelector] = useState<string>("button");
  const [ruleJsonText, setRuleJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");
  const [newRuleSelectorInput, setNewRuleSelectorInput] = useState<string>("");

  // Read theme definitions from OS FS node
  useEffect(() => {
    loadThemesFromVFS();
  }, [username]);

  // Sync editor buffer state when selected CSS selector changes
  useEffect(() => {
    if (activeOverlayDialog === "style_rules" && selectedRuleSelector) {
      const currentVal = styleRules[selectedRuleSelector] || {};
      setRuleJsonText(JSON.stringify(currentVal, null, 2));
      setJsonError("");
    }
  }, [selectedRuleSelector, activeOverlayDialog, styleRules]);

  const loadThemesFromVFS = () => {
    try {
      // 1. System wide themes from /etc/systemThemes.json
      let sysThemeList: ThemeDefinition[] = [];
      const sysJson = syscall.readFile("/etc/systemThemes.json");
      if (sysJson && !sysJson.startsWith("Error:")) {
        try {
          sysThemeList = JSON.parse(sysJson);
        } catch {
          sysThemeList = DEFAULT_SYSTEM_THEMES;
          syscall.writeFile("/etc/systemThemes.json", JSON.stringify(DEFAULT_SYSTEM_THEMES, null, 2));
        }
      } else {
        sysThemeList = DEFAULT_SYSTEM_THEMES;
        syscall.writeFile("/etc/systemThemes.json", JSON.stringify(DEFAULT_SYSTEM_THEMES, null, 2));
      }
      setSystemThemes(sysThemeList);

      // 2. User specific themes from /home/<username>/userThemes.json
      let userThemeList: ThemeDefinition[] = [];
      const userPath = `/home/${username}/userThemes.json`;
      const userJson = syscall.readFile(userPath);
      if (userJson && !userJson.startsWith("Error:")) {
        try {
          userThemeList = JSON.parse(userJson);
        } catch {
          userThemeList = [];
          syscall.writeFile(userPath, JSON.stringify([], null, 2));
        }
      } else {
        userThemeList = [];
        syscall.writeFile(userPath, JSON.stringify([], null, 2));
      }
      setUserThemes(userThemeList);
    } catch (e: any) {
      setErrorMsg("Failed to read theme descriptor files.");
      syscall.syslog(`Theme load error: ${e.message}`);
    }
  };

  const handleApplyTheme = (theme: ThemeDefinition) => {
    try {
      const settings = syscall.getSettings();
      // Apply backwards compatibility fallback for custom fields
      const appliedWallpaperType = theme.wallpaper_type || "gradient";
      const appliedSolidColor = theme.wallpaper_solid_color || theme.custom_wallpaper_color_1 || "#1b1e20";
      const appliedHeaderActiveBg = theme.theme_header_active_bg || "linear-gradient(180deg, #ffffff 0%, #eceae6 20%, #d8d4cd 50%, #c4bfae 100%)";
      const appliedGradientCss = theme.wallpaper_gradient_css || `linear-gradient(135deg, ${theme.custom_wallpaper_color_1 || "#1b1e20"} 0%, ${theme.custom_wallpaper_color_2 || "#2d3235"} 100%)`;

      const updated = {
        ...settings,
        current_desktop_theme: theme.name,
        current_desktop_theme_id: theme.id,
        custom_wallpaper_color_1: theme.custom_wallpaper_color_1,
        custom_wallpaper_color_2: theme.custom_wallpaper_color_2,
        window_bevel_style: theme.window_bevel_style,
        theme_header_active_bg: appliedHeaderActiveBg,
        theme_header_inactive_bg: theme.theme_header_inactive_bg,
        theme_header_active_text: theme.theme_header_active_text,
        theme_header_inactive_text: theme.theme_header_inactive_text,
        theme_window_bg: theme.theme_window_bg,
        theme_window_border_radius: theme.theme_window_border_radius,
        theme_panel_bg: theme.theme_panel_bg,
        
        wallpaper_type: appliedWallpaperType,
        wallpaper_solid_color: appliedSolidColor,
        wallpaper_gradient_css: appliedGradientCss,
        wallpaper_image_url: theme.wallpaper_image_url || "",
        custom_css_overrides: theme.custom_css_overrides || "",
        style_system_rules: theme.style_rules || {}
      };

      const ok = syscall.saveSettings(updated);
      if (ok) {
        setActiveThemeId(theme.id);
        syscall.syslog(`Theme ${theme.name} applied globally successfully.`);
        setSuccessMsg(`Applied preset "${theme.name}" globally!`);
        setErrorMsg("");
        
        // Match active preset colors into current editor slots
        setEditorName(theme.name);
        setEditorWall1(theme.custom_wallpaper_color_1);
        setEditorWall2(theme.custom_wallpaper_color_2);
        setEditorBevel(theme.window_bevel_style);
        setEditorHeaderActive(appliedHeaderActiveBg);
        setEditorHeaderInactive(theme.theme_header_inactive_bg);
        setEditorHeaderTextActive(theme.theme_header_active_text);
        setEditorHeaderTextInactive(theme.theme_header_inactive_text);
        setEditorWindowBg(theme.theme_window_bg);
        setEditorRadius(theme.theme_window_border_radius);
        setEditorPanelBg(theme.theme_panel_bg);
        setWallpaperType(appliedWallpaperType);
        setWallpaperSolidColor(appliedSolidColor);
        setWallpaperGradientCss(appliedGradientCss);
        setWallpaperImageUrl(theme.wallpaper_image_url || "");
        setCustomCssOverrides(theme.custom_css_overrides || "");
        setStyleRules(theme.style_rules || {});

        setTimeout(() => setSuccessMsg(""), 3500);
      } else {
        setErrorMsg("System error: Unable to save applied configurations.");
      }
    } catch (e: any) {
      setErrorMsg("Crash during theme loading sequence.");
      syscall.syslog(`Theme launch error: ${e.message}`);
    }
  };

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorName.trim()) {
      setErrorMsg("Please specify a metadata theme name.");
      return;
    }

    const newTheme: ThemeDefinition = {
      id: "theme-" + Date.now(),
      name: editorName,
      custom_wallpaper_color_1: editorWall1,
      custom_wallpaper_color_2: editorWall2,
      window_bevel_style: editorBevel,
      theme_header_active_bg: editorHeaderActive,
      theme_header_inactive_bg: editorHeaderInactive,
      theme_header_active_text: editorHeaderTextActive,
      theme_header_inactive_text: editorHeaderTextInactive,
      theme_window_bg: editorWindowBg,
      theme_window_border_radius: editorRadius,
      theme_panel_bg: editorPanelBg,
      
      // Extended fields
      wallpaper_type: wallpaperType,
      wallpaper_solid_color: wallpaperSolidColor,
      wallpaper_gradient_css: wallpaperGradientCss,
      wallpaper_image_url: wallpaperImageUrl,
      custom_css_overrides: customCssOverrides,
      style_rules: styleRules
    };

    try {
      if (savingLocation === "system") {
        if (userRole !== "root" && userRole !== "admin") {
          const settings = syscall.getSettings();
          if (!settings.allow_regular_user_system_writes) {
            setErrorMsg("Permission Denied: Root / administrator role required for etc changes.");
            return;
          }
        }

        const updatedSys = [...systemThemes, newTheme];
        const ok = syscall.writeFile("/etc/systemThemes.json", JSON.stringify(updatedSys, null, 2));
        if (ok) {
          setSystemThemes(updatedSys);
          setSuccessMsg(`Created system preset "${editorName}" in /etc/!`);
          setErrorMsg("");
          syscall.syslog(`Created global theme: ${editorName}`);
          setTimeout(() => setSuccessMsg(""), 3500);
        } else {
          setErrorMsg("Permission error writing to /etc directory.");
        }
      } else {
        const userPath = `/home/${username}/userThemes.json`;
        const updatedUser = [...userThemes, newTheme];
        const ok = syscall.writeFile(userPath, JSON.stringify(updatedUser, null, 2));
        if (ok) {
          setUserThemes(updatedUser);
          setSuccessMsg(`Personal theme "${editorName}" saved to home!`);
          setErrorMsg("");
          syscall.syslog(`Saved private theme ${editorName}`);
          setTimeout(() => setSuccessMsg(""), 3500);
        } else {
          setErrorMsg("Failed writing to local VFS home path.");
        }
      }
    } catch (err: any) {
      setErrorMsg("FS writing error: Nodes locked or invalid directory.");
    }
  };

  const handleDeleteTheme = (id: string, isSystem: boolean) => {
    try {
      if (isSystem) {
        if (userRole !== "root" && userRole !== "admin") {
          const settings = syscall.getSettings();
          if (!settings.allow_regular_user_system_writes) {
            setErrorMsg("Permissions restricted. Administrator credentials required.");
            return;
          }
        }
        const updated = systemThemes.filter((t) => t.id !== id);
        const ok = syscall.writeFile("/etc/systemThemes.json", JSON.stringify(updated, null, 2));
        if (ok) {
          setSystemThemes(updated);
          setSuccessMsg("Deleted system preset definition.");
          setTimeout(() => setSuccessMsg(""), 2000);
        }
      } else {
        const updated = userThemes.filter((t) => t.id !== id);
        const userPath = `/home/${username}/userThemes.json`;
        const ok = syscall.writeFile(userPath, JSON.stringify(updated, null, 2));
        if (ok) {
          setUserThemes(updated);
          setSuccessMsg("Personal theme entry removed.");
          setTimeout(() => setSuccessMsg(""), 2000);
        }
      }
    } catch {
      setErrorMsg("Failed to remove theme entry.");
    }
  };

  const handleSelectionFromPresetToEditor = (theme: ThemeDefinition) => {
    setEditorName(`${theme.name} Custom`);
    setEditorWall1(theme.custom_wallpaper_color_1);
    setEditorWall2(theme.custom_wallpaper_color_2);
    setEditorBevel(theme.window_bevel_style);
    setEditorHeaderActive(theme.theme_header_active_bg || "linear-gradient(180deg, #ffffff 0%, #eceae6 20%, #d8d4cd 50%, #c4bfae 100%)");
    setEditorHeaderInactive(theme.theme_header_inactive_bg);
    setEditorHeaderTextActive(theme.theme_header_active_text);
    setEditorHeaderTextInactive(theme.theme_header_inactive_text);
    setEditorWindowBg(theme.theme_window_bg);
    setEditorRadius(theme.theme_window_border_radius);
    setEditorPanelBg(theme.theme_panel_bg);

    setWallpaperType(theme.wallpaper_type || "gradient");
    setWallpaperSolidColor(theme.wallpaper_solid_color || theme.custom_wallpaper_color_1 || "#1b1e20");
    setWallpaperGradientCss(theme.wallpaper_gradient_css || `linear-gradient(135deg, ${theme.custom_wallpaper_color_1 || "#1b1e20"} 0%, ${theme.custom_wallpaper_color_2 || "#2d3235"} 100%)`);
    setWallpaperImageUrl(theme.wallpaper_image_url || "");
    setCustomCssOverrides(theme.custom_css_overrides || "");
    setStyleRules(theme.style_rules || {});

    setSuccessMsg(`Loaded "${theme.name}" fields into customized workspace!`);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  // Compile gradient parameters to raw CSS in editor input
  const compileActiveGradientToCss = (
    type: "linear" | "radial" | "conic",
    angle: number,
    shape: "circle" | "ellipse",
    pos: string,
    stops: StopItem[]
  ): string => {
    const stopsStr = [...stops]
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");

    if (type === "radial") {
      return `radial-gradient(${shape} at ${pos}, ${stopsStr})`;
    } else if (type === "conic") {
      return `conic-gradient(from ${angle}deg at ${pos}, ${stopsStr})`;
    } else {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    }
  };

  const handleApplyGradientFromEditor = () => {
    const resCss = compileActiveGradientToCss(gradType, gradAngle, gradShape, gradPosition, gradStops);
    setWallpaperGradientCss(resCss);
    setWallpaperType("gradient");
    setActiveOverlayDialog("none");
    setSuccessMsg("Gradient compiled and selected!");
    setTimeout(() => setSuccessMsg(""), 2200);
  };

  const handleAddStop = () => {
    const nextPos = Math.min(
      100,
      gradStops.length > 0 ? Math.round(gradStops[gradStops.length - 1].position + 15) : 50
    );
    const newStop: StopItem = {
      id: "st-" + Date.now(),
      color: "#ff0055",
      position: nextPos > 100 ? 100 : nextPos
    };
    setGradStops([...gradStops, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    if (gradStops.length <= 2) {
      alert("Gradients require at least 2 color stops.");
      return;
    }
    setGradStops(gradStops.filter((st) => st.id !== id));
  };

  const handleUpdateStopColor = (id: string, col: string) => {
    setGradStops(gradStops.map((st) => (st.id === id ? { ...st, color: col } : st)));
  };

  const handleUpdateStopPos = (id: string, pos: number) => {
    setGradStops(gradStops.map((st) => (st.id === id ? { ...st, position: pos } : st)));
  };

  const handleLoadGradientStylePreset = (presetType: string) => {
    if (presetType === "sunset") {
      setGradType("linear");
      setGradAngle(90);
      setGradStops([
        { id: "p1", color: "#f12711", position: 0 },
        { id: "p2", color: "#f5af19", position: 100 }
      ]);
    } else if (presetType === "cyber") {
      setGradType("linear");
      setGradAngle(45);
      setGradStops([
        { id: "p1", color: "#00f0ff", position: 0 },
        { id: "p2", color: "#ff007f", position: 50 },
        { id: "p3", color: "#7f00ff", position: 100 }
      ]);
    } else if (presetType === "radial_cosmic") {
      setGradType("radial");
      setGradShape("circle");
      setGradPosition("center");
      setGradStops([
        { id: "p1", color: "#20093b", position: 0 },
        { id: "p2", color: "#030008", position: 100 }
      ]);
    } else if (presetType === "monochrome") {
      setGradType("linear");
      setGradAngle(180);
      setGradStops([
        { id: "p1", color: "#ffffff", position: 0 },
        { id: "p2", color: "#888888", position: 50 },
        { id: "p3", color: "#000000", position: 100 }
      ]);
    }
  };

  // Mock Desktop preview Background computation
  let previewWallBackground = "linear-gradient(135deg, #1b1e20 0%, #2d3235 100%)";
  if (wallpaperType === "color") {
    previewWallBackground = wallpaperSolidColor;
  } else if (wallpaperType === "image") {
    previewWallBackground = wallpaperImageUrl ? `url(${wallpaperImageUrl})` : "none";
  } else {
    previewWallBackground = wallpaperGradientCss;
  }

  const isOverlayOpen = activeOverlayDialog !== "none";

  return (
    <div className="flex-1 bg-[#d4d0c8] text-black h-full flex overflow-hidden font-sans select-none p-3.5 box-border relative">
      
      {/* DIABLED CONTAINER FILTER TO DE-CLUTTER MAIN INTERFACE & SYSTEM STYLINGS */}
      <div
        className={`w-full h-full flex overflow-hidden gap-3.5 transition-all duration-300 ${
          isOverlayOpen ? "pointer-events-none select-none opacity-25 filter grayscale blur-[1px]" : ""
        }`}
      >
        {/* LEFT COMPONENT: SAVED PRESETS LIST */}
        <div className="w-[50%] border-2 border-[#808080] border-t-white border-l-white bg-[#ece9d8] p-3 flex flex-col h-full min-h-0 overflow-y-auto box-border">
          <div className="flex items-center space-x-1.5 mb-2.5 pb-2 border-b border-gray-400">
            <Palette className="w-4 h-4 text-slate-800" />
            <span className="text-xs font-bold leading-none">OS Style Presets Database</span>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="p-2 mb-2 bg-[#d1e7dd] border border-[#badbcc] text-[#0f5132] font-semibold text-[10px] leading-tight">
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-2 mb-2 bg-[#f8d7da] border border-[#f5c2c7] text-[#842029] font-semibold text-[10px] leading-tight">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* SYSTEM-WIDE DESCRIPTIONS */}
          <div className="mb-3.5">
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600 mb-1.5 block">
              🌌 Global Presets (/etc/systemThemes.json)
            </div>

            <div className="grid grid-cols-1 gap-2">
              {systemThemes.map((theme) => {
                const isActive = activeThemeId === theme.id;
                let swatchBg = "linear-gradient(135deg, #1b1e20 0%, #29323c 100%)";
                if (theme.wallpaper_type === "color") {
                  swatchBg = theme.wallpaper_solid_color || theme.custom_wallpaper_color_1 || "#008080";
                } else if (theme.wallpaper_type === "image") {
                  swatchBg = theme.wallpaper_image_url ? `url(${theme.wallpaper_image_url})` : "#2a3b4c";
                } else {
                  swatchBg = theme.wallpaper_gradient_css || `linear-gradient(135deg, ${theme.custom_wallpaper_color_1} 0%, ${theme.custom_wallpaper_color_2} 100%)`;
                }

                return (
                  <div
                    key={theme.id}
                    className={`border-2 p-2 relative cursor-pointer hover:bg-gray-100 flex flex-col justify-between ${
                      isActive
                        ? "border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-slate-200"
                        : "border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#e4e0d8]"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-[10.5px] truncate max-w-[170px]" title={theme.name}>
                        {theme.name}
                      </span>
                      {isActive && (
                        <span className="text-[9px] px-1 bg-green-700 text-white font-extrabold rounded-none shadow">
                          Active Layout
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5 mb-2.5">
                      {/* Swatch visual render */}
                      <div
                        className="w-full h-4.5 border border-gray-600 shadow-inner rounded-none"
                        style={{
                          background: swatchBg,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }}
                      />
                    </div>

                    <div className="flex space-x-1.5 items-center">
                      <button
                        onClick={() => handleApplyTheme(theme)}
                        className={`text-[9.5px] font-bold px-2 py-0.5 border ${
                          isActive
                            ? "opacity-50 pointer-events-none border-gray-400 text-gray-500"
                            : "border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 hover:bg-gray-100 cursor-pointer text-black"
                        }`}
                      >
                        Apply Theme
                      </button>
                      <button
                        onClick={() => handleSelectionFromPresetToEditor(theme)}
                        className="text-[9.5px] font-bold px-2 py-0.5 border border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 hover:bg-gray-100 cursor-pointer text-black"
                      >
                        Customize Options
                      </button>
                      {/* Delete custom entries */}
                      {["classic-blue", "windows-1995", "ubuntu-2006", "broken"].indexOf(theme.id) === -1 && (
                        <button
                          onClick={() => handleDeleteTheme(theme.id, true)}
                          className="text-[9.5px] text-red-700 hover:text-red-950 px-1 ml-auto"
                          title="Delete system wide theme"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* USER CUSTOMIZATIONS */}
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-600 mb-1.5 block">
              🏠 Personal Profiles (~/userThemes.json)
            </div>

            {userThemes.length === 0 ? (
              <div className="bg-[#e4e0d8] border border-dashed border-gray-500 p-3 text-center text-gray-500 text-[9.5px]">
                No user profiles compiled yet. Make a setup on the right and save!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {userThemes.map((theme) => {
                  const isActive = activeThemeId === theme.id;
                  let swatchBg = "#000";
                  if (theme.wallpaper_type === "color") {
                    swatchBg = theme.wallpaper_solid_color || "#111";
                  } else if (theme.wallpaper_type === "image") {
                    swatchBg = theme.wallpaper_image_url ? `url(${theme.wallpaper_image_url})` : "#222";
                  } else {
                    swatchBg = theme.wallpaper_gradient_css || `linear-gradient(${theme.custom_wallpaper_color_1}, ${theme.custom_wallpaper_color_2})`;
                  }

                  return (
                    <div
                      key={theme.id}
                      className={`border-2 p-2 relative cursor-pointer hover:bg-gray-100 flex flex-col justify-between ${
                        isActive
                          ? "border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-slate-200"
                          : "border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#e4e0d8]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[10.5px] truncate max-w-[170px]" title={theme.name}>
                          {theme.name}
                        </span>
                        {isActive && (
                          <span className="text-[9px] px-1 bg-green-700 text-white font-extrabold rounded-none">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className="w-full h-4.5 border border-gray-600"
                          style={{
                            background: swatchBg,
                            backgroundSize: "cover",
                            backgroundPosition: "center"
                          }}
                        />
                      </div>

                      <div className="flex space-x-1 mt-auto items-center">
                        <button
                          onClick={() => handleApplyTheme(theme)}
                          className={`text-[9.5px] font-bold px-2 py-0.5 border ${
                            isActive
                              ? "opacity-50 pointer-events-none border-gray-400 text-gray-500"
                              : "border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 hover:bg-gray-100 cursor-pointer text-black"
                          }`}
                        >
                          Apply Preset
                        </button>
                        <button
                          onClick={() => handleSelectionFromPresetToEditor(theme)}
                          className="text-[9.5px] font-bold px-2 py-0.5 border border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 hover:bg-gray-100 cursor-pointer text-black"
                        >
                          Modify Workspace
                        </button>
                        <button
                          onClick={() => handleDeleteTheme(theme.id, false)}
                          className="text-[9.5px] text-red-700 hover:text-red-950 px-1 ml-auto cursor-pointer"
                          title="Delete user theme"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT: HEAVY EDIT BLOCK */}
        <div className="w-[50%] flex flex-col justify-between min-h-0 h-full box-border">
          
          {/* COMPOSITOR PREVIEW PANEL */}
          <div className="border-2 border-[#808080] border-b-white border-r-white bg-[#e4e0d8] p-2 flex flex-col min-h-0 mb-3 relative overflow-hidden h-[180px] select-none">
            <span className="absolute top-1 right-2 text-[8px] font-mono text-gray-400">Preview Frame</span>
            
            <div 
              className="w-full h-4.5 text-[8.5px] text-gray-200 flex items-center px-1.5 mb-2 shadow-inner"
              style={{ background: editorPanelBg }}
            >
              <span className="font-extrabold flex items-center gap-1">🗑️ CORE TOP PANEL PREVIEW</span>
            </div>

            <div 
              className="flex-1 w-full border border-gray-600 relative p-3 flex flex-col items-center justify-center overflow-hidden"
              style={{
                background: previewWallBackground,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              {/* Window Box Simulation mockup */}
              <div
                className={`w-[160px] min-h-[75px] flex flex-col border shadow-2xl bg-white ${
                  editorBevel === "classic_bevel"
                    ? "border-t-white border-l-white border-b-[#303030] border-r-[#303030]"
                    : editorBevel === "shattered_corrupt"
                    ? "border-2 border-red-500 border-dashed transform rotate-1 scale-95"
                    : "border border-gray-500"
                }`}
                style={{
                  borderRadius: editorRadius,
                  backgroundColor: editorWindowBg,
                }}
              >
                {/* Header */}
                <div
                  className="h-5 flex items-center justify-between px-2 text-[9px] font-bold select-none cursor-default"
                  style={{
                    background: editorHeaderActive,
                    color: editorHeaderTextActive,
                  }}
                >
                  <span className="truncate">Active Window</span>
                  <span className="text-[7px] tracking-tight bg-white/20 px-1 border border-black/35 font-mono">X</span>
                </div>

                {/* Body */}
                <div className="p-1 px-2 flex-grow flex flex-col justify-between text-[8px] text-black">
                  <p className="leading-3 text-[8px] font-semibold text-gray-700">Radius: {editorRadius}</p>
                  <div className="flex space-x-1 justify-end">
                    <div className="h-3 w-8 bg-gray-300 border border-t-white border-l-white border-r-gray-600 border-b-gray-600"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT FORM BLOCKS */}
          <form
            onSubmit={handleSaveTheme}
            className="flex-grow bg-[#e4e0d8] border-2 border-[#808080] border-t-white border-l-white p-3 flex flex-col text-[10px] space-y-2 select-none justify-between h-auto min-h-0"
          >
            <div className="flex items-center space-x-1 pb-1 border-b border-gray-400">
              <Sliders className="w-3.5 h-3.5 text-blue-800" />
              <span className="font-bold">Heavy Compositor Customizer</span>
            </div>

            {/* Scrolling Settings Container */}
            <div className="overflow-y-auto pr-1 flex-grow space-y-2 h-[210px] max-h-[220px]">
              
              {/* Wallpaper types parameters */}
              <div className="bg-[#dfdbd0] p-2 border border-gray-400">
                <span className="font-bold text-[9px] block text-slate-800 mb-1.5 uppercase tracking-wide">
                  🖼️ Desktop Wallpaper Settings
                </span>

                <div className="grid grid-cols-3 gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setWallpaperType("color")}
                    className={`p-1 font-bold text-[9px] text-center border ${
                      wallpaperType === "color"
                        ? "bg-slate-700 text-white border-slate-900"
                        : "bg-gray-200 text-black border-t-white border-l-white border-r-gray-600 border-b-gray-600 active:border-t-gray-600"
                    }`}
                  >
                    Solid Color
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWallpaperType("gradient");
                      setActiveOverlayDialog("gradient_editor");
                    }}
                    className={`p-1 font-bold text-[9px] text-center border relative flex items-center justify-center gap-1 ${
                      wallpaperType === "gradient"
                        ? "bg-slate-700 text-white border-slate-900"
                        : "bg-gray-200 text-black border-t-white border-l-white border-r-gray-600 border-b-gray-600 active:border-t-gray-600"
                    }`}
                  >
                    <Paintbrush className="w-2.5 h-2.5" />
                    <span>Grad Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWallpaperType("image")}
                    className={`p-1 font-bold text-[9px] text-center border ${
                      wallpaperType === "image"
                        ? "bg-slate-700 text-white border-slate-900"
                        : "bg-gray-200 text-black border-t-white border-l-white border-r-gray-600 border-b-gray-600 active:border-t-gray-600"
                    }`}
                  >
                    Image Wall
                  </button>
                </div>

                {wallpaperType === "color" && (
                  <div className="flex space-x-1.5 items-center bg-[#eae6df] p-1.5 border border-gray-400">
                    <label className="text-[9px] font-bold text-gray-700">Solid Hex Style:</label>
                    <input
                      type="color"
                      value={wallpaperSolidColor}
                      onChange={(e) => setWallpaperSolidColor(e.target.value)}
                      className="w-5 h-5 border border-gray-500 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={wallpaperSolidColor}
                      onChange={(e) => setWallpaperSolidColor(e.target.value)}
                      className="w-20 bg-white text-black p-0.5 font-mono text-[9px] border border-gray-400"
                    />
                  </div>
                )}

                {wallpaperType === "gradient" && (
                  <div className="bg-[#eae6df] p-1.5 border border-gray-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8.5px] text-slate-700 truncate max-w-[150px]" title={wallpaperGradientCss}>
                        {wallpaperGradientCss}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveOverlayDialog("gradient_editor")}
                        className="px-1 text-[8px] bg-indigo-600 text-white animate-pulse"
                      >
                        Launch Stop Builder
                      </button>
                    </div>
                  </div>
                )}

                {wallpaperType === "image" && (
                  <div className="bg-[#eae6df] p-1.5 border border-gray-400 space-y-1.5 text-center">
                    <input
                      type="text"
                      value={wallpaperImageUrl}
                      onChange={(e) => setWallpaperImageUrl(e.target.value)}
                      placeholder="Enter target image web URL here..."
                      className="w-full bg-white text-black p-1 font-mono text-[9px] border border-gray-400 focus:outline-none"
                    />
                    <div className="flex justify-between items-center text-[8.5px]">
                      <span className="text-gray-500 font-bold italic">Or grab curated works:</span>
                      <button
                        type="button"
                        onClick={() => setActiveOverlayDialog("image_presets")}
                        className="px-1.5 py-0.5 text-[8.5px] bg-slate-800 text-white font-bold border border-t-slate-500"
                      >
                        Grab Presets
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Classic Window parameters */}
              <div className="grid grid-cols-2 gap-2 bg-[#dfdbd0] p-2 border border-gray-400">
                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Preset Theme Name:</label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    className="w-full bg-white text-black p-0.5 border border-gray-500 font-bold focus:outline-none focus:border-indigo-600 text-[10px] px-1"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Bevel Edge:</label>
                  <select
                    value={editorBevel}
                    onChange={(e) => setEditorBevel(e.target.value)}
                    className="w-full bg-white text-black p-0.5 border border-gray-500 focus:outline-none text-[9.5px] font-semibold"
                  >
                    <option value="classic_bevel">3D Classic Bevel</option>
                    <option value="flat_minimal">Flat Minimal</option>
                    <option value="shattered_corrupt">Shattered Corrupt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Header (Active):</label>
                  <div className="flex space-x-1 items-center">
                    <input
                      type="color"
                      value={editorHeaderActive.startsWith("#") ? editorHeaderActive.slice(0, 7) : "#000080"}
                      onChange={(e) => setEditorHeaderActive(e.target.value)}
                      className="w-4.5 h-4.5 border border-gray-500 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={editorHeaderActive}
                      onChange={(e) => setEditorHeaderActive(e.target.value)}
                      className="w-16 bg-white text-black p-0.5 font-mono text-[8.5px] border border-gray-400 focus:outline-none truncate"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Header (Inactive):</label>
                  <div className="flex space-x-1 items-center">
                    <input
                      type="color"
                      value={editorHeaderInactive.startsWith("#") ? editorHeaderInactive.slice(0, 7) : "#808080"}
                      onChange={(e) => setEditorHeaderInactive(e.target.value)}
                      className="w-4.5 h-4.5 border border-gray-500 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={editorHeaderInactive}
                      onChange={(e) => setEditorHeaderInactive(e.target.value)}
                      className="w-16 bg-white text-black p-0.5 font-mono text-[8.5px] border border-gray-400 focus:outline-none truncate"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Active Header Text:</label>
                  <input
                    type="text"
                    value={editorHeaderTextActive}
                    onChange={(e) => setEditorHeaderTextActive(e.target.value)}
                    className="w-full bg-white text-black p-0.5 font-mono text-[8.5px] border border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Inactive Header Text:</label>
                  <input
                    type="text"
                    value={editorHeaderTextInactive}
                    onChange={(e) => setEditorHeaderTextInactive(e.target.value)}
                    className="w-full bg-white text-black p-0.5 font-mono text-[8.5px] border border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Window Bg:</label>
                  <input
                    type="text"
                    value={editorWindowBg}
                    onChange={(e) => setEditorWindowBg(e.target.value)}
                    className="w-full bg-white text-black p-0.5 font-mono text-[8.5px] border border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Panel Bar Bg:</label>
                  <input
                    type="text"
                    value={editorPanelBg}
                    onChange={(e) => setEditorPanelBg(e.target.value)}
                    className="w-full bg-white text-black p-0.5 font-mono text-[8.5px] border border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Border Radius (px):</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={parseInt(editorRadius) || 0}
                    onChange={(e) => setEditorRadius(e.target.value + "px")}
                    className="w-full cursor-pointer h-4.5 bg-gray-200 border border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-0.5">Save Destination:</label>
                  <select
                    value={savingLocation}
                    onChange={(e) => setSavingLocation(e.target.value as "user" | "system")}
                    className="w-full bg-white text-black p-0.5 border border-gray-500 focus:outline-none text-[9.5px] font-bold"
                  >
                    <option value="user">User Path (/home/{username}/)</option>
                    <option value="system">Global etc (/etc/)</option>
                  </select>
                </div>
              </div>

              {/* Free-form scoping stylesheet trigger */}
              <div className="bg-[#b3af9f] p-2 border-2 border-dashed border-gray-600 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-[9.5px] text-slate-900 block leading-tight">💎 Override Elements Stylesheet</span>
                  <span className="text-[8px] text-slate-700 italic block mt-0.5">Modify buttons, clocks, text colors or retro details freely!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOverlayDialog("css_overrides")}
                  className="px-2 py-1 bg-slate-900 text-white font-extrabold text-[8.5px] hover:bg-slate-800 tracking-wide border border-black flex items-center space-x-1 uppercase"
                >
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  <span>Edit Custom CSS</span>
                </button>
              </div>

              {/* TSX Style system rules trigger */}
              <div className="bg-[#a8a494] p-2 border-2 border-dashed border-gray-600 flex justify-between items-center mt-2">
                <div>
                  <span className="font-extrabold text-[9.5px] text-slate-900 block leading-tight">🚀 TSX Style System rules Engine</span>
                  <span className="text-[8px] text-slate-700 italic block mt-0.5">Define selectors style rules (elements/classes/IDs) that inherit dynamically!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOverlayDialog("style_rules")}
                  className="px-2 py-1 bg-[#102040] text-yellow-300 font-extrabold text-[8.5px] hover:bg-[#1a3060] tracking-wide border border-black flex items-center space-x-1 uppercase"
                >
                  <Code2 className="w-3 h-3 text-yellow-400" />
                  <span>Configure Style Rules</span>
                </button>
              </div>

            </div>

            {/* Form actions panel footer */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-400 box-border">
              <div className="text-[8px] italic text-slate-600 flex items-center gap-0.5 leading-none">
                <Info className="w-3 h-3 text-slate-700" />
                <span>Outputs into SystemConfigOverride layer</span>
              </div>
              
              <button
                type="submit"
                className="px-3.5 py-1 font-bold cursor-pointer border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-gray-200 active:border-t-gray-700 active:border-l-gray-700 hover:bg-gray-100 flex items-center space-x-1.5 text-black"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Compile & Save</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 1. ADVANCED GRADIENT STOP EDITOR DIALOG modal LOCK OVERLAY */}
      {/* ========================================================= */}
      {activeOverlayDialog === "gradient_editor" && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] z-50 flex items-center justify-center p-3">
          <div className="w-[350px] bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col p-3 text-[10px] select-none text-black box-border">
            
            {/* Retro title bar */}
            <div className="bg-[#000080] text-white flex justify-between items-center px-1.5 py-1 font-bold text-[10px] mb-3">
              <div className="flex items-center space-x-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-white" />
                <span>OS Desktop Gradient Stops Compiler</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveOverlayDialog("none")}
                className="bg-red-700 text-white hover:bg-red-600 px-1 font-mono text-[9px] border border-t-red-400 border-l-red-400 border-r-black border-b-black"
              >
                X
              </button>
            </div>

            {/* Multi stop visual strip builder */}
            <div className="space-y-3">
              
              {/* Large live gradient swatch preview */}
              <div className="border border-gray-600 p-1 bg-white">
                <div
                  className="w-full h-8 border border-gray-400 shadow-inner"
                  style={{
                    background: compileActiveGradientToCss(gradType, gradAngle, gradShape, gradPosition, gradStops)
                  }}
                />
              </div>

              {/* Gradient selector settings */}
              <div className="grid grid-cols-2 gap-2 bg-[#dfdbd0] p-2 border border-gray-400">
                <div>
                  <label className="block text-[9px] font-bold text-gray-700 mb-0.5">Gradient Mode:</label>
                  <select
                    value={gradType}
                    onChange={(e) => setGradType(e.target.value as "linear" | "radial" | "conic")}
                    className="w-full bg-white text-black p-0.5 border border-gray-500 focus:outline-none text-[9px] font-semibold"
                  >
                    <option value="linear">Linear Gradient</option>
                    <option value="radial">Radial Gradient</option>
                    <option value="conic">Conic Gradient</option>
                  </select>
                </div>

                {gradType === "linear" && (
                  <div>
                    <label className="block text-[9px] font-bold text-gray-700 mb-0.5">Angle degrees: {gradAngle}°</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradAngle}
                      onChange={(e) => setGradAngle(parseInt(e.target.value))}
                      className="w-full cursor-pointer h-4.5"
                    />
                  </div>
                )}

                {gradType === "conic" && (
                  <div>
                    <label className="block text-[9px] font-bold text-gray-700 mb-0.5">Starting Angle: {gradAngle}°</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradAngle}
                      onChange={(e) => setGradAngle(parseInt(e.target.value))}
                      className="w-full cursor-pointer h-4.5"
                    />
                  </div>
                )}

                {gradType === "radial" && (
                  <div>
                    <label className="block text-[9px] font-bold text-gray-700 mb-0.5">Shape Formulation:</label>
                    <div className="flex space-x-1 bg-white p-0.5 border border-gray-400">
                      <button
                        type="button"
                        onClick={() => setGradShape("circle")}
                        className={`px-1 text-[8.5px] font-bold ${gradShape === "circle" ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                      >
                        Circle
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradShape("ellipse")}
                        className={`px-1 text-[8.5px] font-bold ${gradShape === "ellipse" ? "bg-slate-700 text-white" : "bg-gray-100"}`}
                      >
                        Ellipse
                      </button>
                    </div>
                  </div>
                )}

                {(gradType === "radial" || gradType === "conic") && (
                  <div>
                    <label className="block text-[9px] font-bold text-gray-700 mb-0.5">Anchor Center Point:</label>
                    <select
                      value={gradPosition}
                      onChange={(e) => setGradPosition(e.target.value)}
                      className="w-full bg-white text-black p-0.5 border border-gray-400 focus:outline-none text-[8.5px]"
                    >
                      <option value="center">Center Center</option>
                      <option value="top left">Top Left</option>
                      <option value="top right">Top Right</option>
                      <option value="bottom left">Bottom Left</option>
                      <option value="bottom right">Bottom Right</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Stops controller list */}
              <div className="bg-[#dfdbd0] p-2 border border-gray-400 space-y-1.5 max-h-[140px] overflow-y-auto">
                <div className="flex justify-between items-center pb-1 border-b border-gray-500 mb-1">
                  <span className="font-extrabold text-[9px] text-slate-800">Color Stop Markers</span>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="bg-indigo-700 text-white font-bold px-1.5 py-0.5 text-[8.5px] border border-indigo-900"
                  >
                    + Add Stop Mark
                  </button>
                </div>

                {gradStops.map((st, i) => (
                  <div key={st.id} className="flex items-center space-x-1.5 bg-[#eae6df] p-1 border border-gray-400 justify-between">
                    <span className="font-bold text-[8.5px] text-gray-600">#{i + 1}</span>
                    <input
                      type="color"
                      value={st.color}
                      onChange={(e) => handleUpdateStopColor(st.id, e.target.value)}
                      className="w-4 h-4 p-0 cursor-pointer border bg-transparent"
                    />
                    <input
                      type="text"
                      value={st.color}
                      onChange={(e) => handleUpdateStopColor(st.id, e.target.value)}
                      className="w-12 text-[8px] font-mono bg-white text-black p-0.5 border"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={st.position}
                      onChange={(e) => handleUpdateStopPos(st.id, parseInt(e.target.value))}
                      className="w-20 cursor-pointer h-4"
                    />
                    <span className="font-mono text-[8px] font-bold w-5">{st.position}%</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(st.id)}
                      className="text-red-700 hover:text-red-900 font-extrabold text-[8.5px] px-1"
                      title="Delete stop"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Preset Gradients shortcuts */}
              <div className="p-1 px-2 bg-[#bdafa0] border border-orange-200">
                <span className="text-[8.5px] font-bold text-orange-950 block mb-1">⚡ Dynamic System Presets:</span>
                <div className="flex space-x-1.5 justify-around">
                  <button
                    type="button"
                    onClick={() => handleLoadGradientStylePreset("sunset")}
                    className="p-1 text-[8.5px] bg-[#d2691e] text-white font-bold flex items-center"
                  >
                    Vapor Sunset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadGradientStylePreset("cyber")}
                    className="p-1 text-[8.5px] bg-[#008080] text-white font-bold flex items-center"
                  >
                    Neon Cyber
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadGradientStylePreset("radial_cosmic")}
                    className="p-1 text-[8.5px] bg-[#4b0082] text-white font-bold flex items-center"
                  >
                    Cosmic Deep
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadGradientStylePreset("monochrome")}
                    className="p-1 text-[8.5px] bg-[#333] text-white font-bold flex items-center"
                  >
                    Monochrome
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-400">
              <button
                type="button"
                onClick={() => setActiveOverlayDialog("none")}
                className="px-2.5 py-1 text-black border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-gray-200 active:border-t-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyGradientFromCss => handleApplyGradientFromEditor()}
                className="px-4 py-1 font-bold text-white border border-indigo-900 bg-indigo-700 hover:bg-indigo-600 flex items-center space-x-1"
              >
                <Check className="w-3 h-3 text-white" />
                <span>Confirm Gradient Stops</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. STYLESHEET CSS OVERRIDES DIALOG modal LOCK OVERLAY */}
      {/* ========================================================= */}
      {activeOverlayDialog === "css_overrides" && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] z-50 flex items-center justify-center p-3">
          <div className="w-[430px] h-[340px] bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col p-3 text-[10px] select-none text-black box-border">
            
            {/* Retro title bar */}
            <div className="bg-[#5c2d91] text-white flex justify-between items-center px-1.5 py-1 font-bold text-[10px] mb-2.5">
              <div className="flex items-center space-x-1.5 text-white">
                <Code2 className="w-3.5 h-3.5 text-pink-300 animate-pulse" />
                <span>CSS Style Compiler (@layer SystemConfigOverride)</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveOverlayDialog("none")}
                className="bg-red-700 text-white hover:bg-red-600 px-1 font-mono text-[9px] border border-t-red-400 border-l-red-400 border-r-black border-b-black"
              >
                X
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden gap-2">
              
              {/* LEFT COLUMN: Editor area */}
              <div className="flex-1 flex flex-col justify-between">
                <label className="block text-[8.5px] font-bold text-slate-800 mb-1 leading-none uppercase">
                  ✏️ CSS Override Textarea:
                </label>
                <textarea
                  value={customCssOverrides}
                  onChange={(e) => setCustomCssOverrides(e.target.value)}
                  placeholder="/* Customize any element globally! */\n.top-panel-main {\n  background: #000 !important;\n}\n.silver-window {\n  background-color: yellow !important;\n}"
                  className="w-full flex-1 bg-white text-black p-1.5 font-mono text-[9px] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white leading-tight focus:outline-none resize-none overflow-y-auto"
                />
                <span className="text-[7.5px] text-gray-500 italic mt-1 font-mono">
                  Any CSS you write is automatically prefixed with .tlnx-desktop-wrapper bounds.
                </span>
              </div>

              {/* RIGHT COLUMN: Quick layout presets */}
              <div className="w-[155px] bg-[#dfdbd0] border border-gray-400 p-2 flex flex-col justify-between overflow-y-auto">
                <div>
                  <span className="font-extrabold text-[8.5px] text-slate-900 block mb-1.5 uppercase leading-none pb-1 border-b border-gray-400">
                    🪄 Click-to-Apply Presets:
                  </span>
                  <div className="space-y-1.5 max-h-[220px]">
                    {CSS_OVERRIDE_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCustomCssOverrides(preset.css);
                          // Trigger preview panel immediately
                          setSuccessMsg(`Applied CSS preset: ${preset.name.slice(3)}`);
                          setTimeout(() => setSuccessMsg(""), 1800);
                        }}
                        className="w-full text-left p-1 bg-[#eae6df] hover:bg-slate-700 hover:text-white border border-t-white border-l-white border-r-gray-600 border-b-gray-600 text-[8.5px] leading-tight font-bold cursor-pointer text-black"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#bdafa0] p-1.5 mt-2 border border-orange-200">
                  <span className="text-[8px] font-bold text-amber-950 block leading-tight">⚓ Targetable Classes:</span>
                  <p className="text-[7.5px] text-amber-900 font-mono leading-tight mt-1">
                    • <code className="text-purple-950">.top-panel-main</code><br />
                    • <code className="text-purple-950">.silver-window</code><br />
                    • <code className="text-purple-950">.silver-header</code><br />
                    • <code className="text-purple-950">.taskbar-btn</code><br />
                    • <code className="text-purple-950">.clock-panel</code>
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-400">
              <button
                type="button"
                onClick={() => setCustomCssOverrides("")}
                className="px-2 py-0.5 text-red-800 font-bold bg-gray-200 border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 active:border-t-gray-600 cursor-pointer"
              >
                Clear all custom rules
              </button>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => setActiveOverlayDialog("none")}
                  className="px-4 py-1.5 font-bold text-white border border-indigo-900 bg-[#5c2d91] hover:bg-[#4a2475] flex items-center space-x-1 uppercase tracking-wide cursor-pointer"
                >
                  <Check className="w-3 h-3 text-white" />
                  <span>Adopt Stylesheet</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DOCK BACKGROUND IMAGE SELECTOR modal LOCK OVERLAY */}
      {/* ========================================================= */}
      {activeOverlayDialog === "image_presets" && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] z-50 flex items-center justify-center p-3">
          <div className="w-[340px] bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col p-3 text-[10px] select-none text-black box-border">
            
            {/* Retro title bar */}
            <div className="bg-[#002080] text-white flex justify-between items-center px-1.5 py-1 font-bold text-[10px] mb-2.5">
              <div className="flex items-center space-x-1.5 text-white">
                <Image className="w-3.5 h-3.5 text-sky-300" />
                <span>Curated Wallpaper Presets Deck</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveOverlayDialog("none")}
                className="bg-red-700 text-white hover:bg-red-600 px-1 font-mono text-[9px] border border-t-red-400 border-l-red-400 border-r-black border-b-black"
              >
                X
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-gray-700 font-bold block mb-1">
                Select from our beautiful curated high-resolution digital art designs:
              </span>

              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {PRESET_WALLPAPERS.map((cur, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setWallpaperImageUrl(cur.url);
                      setWallpaperType("image");
                      setActiveOverlayDialog("none");
                      setSuccessMsg(`Applied curations wallpaper: ${cur.name}!`);
                      setTimeout(() => setSuccessMsg(""), 2000);
                    }}
                    className="flex justify-between items-center p-1.5 border border-gray-400 bg-[#dfdbd0] cursor-pointer hover:bg-slate-700 hover:text-white"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-10 h-7 border border-black/35 shadow-sm"
                        style={{
                          backgroundImage: `url(${cur.url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }}
                      />
                      <span className="font-bold text-[8.5px] truncate max-w-[180px]">{cur.name}</span>
                    </div>
                    <span className="text-[7.5px] text-slate-500 hover:text-white italic">Import →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-start mt-3">
              <button
                type="button"
                onClick={() => setActiveOverlayDialog("none")}
                className="px-3 py-1 font-bold text-black border-2 border-t-white border-l-white border-r-gray-700 border-b-gray-700 bg-gray-200 active:border-t-gray-700"
              >
                Close Presets
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TS(X) COMPREHENSIVE STYLE SYSTEM RULES CONFIGURATOR    */}
      {/* ========================================================= */}
      {activeOverlayDialog === "style_rules" && (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[0.5px] z-50 flex items-center justify-center p-3">
          <div className="w-[540px] bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col p-3 text-[10px] select-none text-black box-border">
            
            {/* Retro title bar */}
            <div className="bg-[#002080] text-white flex justify-between items-center px-1.5 py-1 font-bold text-[10px] mb-2.5">
              <div className="flex items-center space-x-1.5 text-white">
                <Code2 className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>TypeScript Style Rules Engine (System Overrides)</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveOverlayDialog("none")}
                className="bg-red-700 text-white hover:bg-red-600 px-1 font-mono text-[9px] border border-t-red-400 border-l-red-400 border-r-black border-b-black"
              >
                X
              </button>
            </div>

            <div className="text-[10px] leading-relaxed text-slate-800 mb-2 border-b border-gray-400 pb-2">
              <span className="font-bold">Propagation Engine Instructions:</span> Set TSX-based design specifications for standard components (like <code className="bg-white/50 px-0.5 rounded font-mono">button</code>), classes (like <code className="bg-white/50 px-0.5 rounded font-mono">.top-panel-main</code>, <code className="bg-white/50 px-0.5 rounded font-mono">.silver-window</code>), or local IDs (<code className="bg-white/50 px-0.5 rounded font-mono">#win-dialog</code>). These properties will <span className="font-bold">propagate down the JSX element hierarchy</span> until explicitly overridden by a descendant node!
            </div>

            {/* Split layout */}
            <div className="flex gap-2.5 flex-1 min-h-[300px]">
              
              {/* Left Selector List */}
              <div className="w-[35%] bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-2 overflow-y-auto flex flex-col">
                <span className="font-bold text-gray-700 mb-1.5 border-b pb-1">Active Selectors</span>
                
                <div className="flex-1 space-y-1">
                  {Object.keys(styleRules).map((sel) => (
                    <div
                      key={sel}
                      onClick={() => setSelectedRuleSelector(sel)}
                      className={`px-2 py-1.5 cursor-pointer flex justify-between items-center text-[9px] ${
                        selectedRuleSelector === sel
                          ? "bg-[#002080] text-white font-bold"
                          : "bg-gray-100 hover:bg-gray-200 text-black border border-gray-200"
                      }`}
                    >
                      <span className="truncate">{sel}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cp = { ...styleRules };
                          delete cp[sel];
                          setStyleRules(cp);
                          if (selectedRuleSelector === sel) {
                            const remaining = Object.keys(cp);
                            setSelectedRuleSelector(remaining[0] || "");
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-bold px-0.5 ml-1 select-none"
                        title="Delete rules selector"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {Object.keys(styleRules).length === 0 && (
                    <span className="text-gray-400 italic block p-1">No custom style rules defined.</span>
                  )}
                </div>

                {/* Add standard rules triggers or simple input picker */}
                <div className="mt-3 border-t pt-2 space-y-1">
                  <input
                    type="text"
                    placeholder="e.g. .btn or button"
                    value={newRuleSelectorInput}
                    onChange={(e) => setNewRuleSelectorInput(e.target.value)}
                    className="w-full bg-white text-black p-1 border border-gray-500 text-[9px] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newRuleSelectorInput.trim();
                      if (!trimmed) return;
                      // Add with a default clear style properties object
                      if (!styleRules[trimmed]) {
                        setStyleRules({
                          ...styleRules,
                          [trimmed]: {}
                        });
                      }
                      setSelectedRuleSelector(trimmed);
                      setNewRuleSelectorInput("");
                    }}
                    className="w-full py-1 bg-gray-200 font-bold border border-gray-500 hover:bg-gray-100 active:bg-gray-300 text-[9px]"
                  >
                    + Add New Selector
                  </button>
                </div>
              </div>

              {/* Right JSON style value Editor */}
              <div className="flex-1 flex flex-col bg-[#ece9d8] border border-gray-400 p-2.5">
                <div className="flex justify-between items-center mb-1 pb-1 border-b">
                  <span className="font-bold text-[9.5px]">
                    Properties of: <code className="text-[#002080] bg-white/40 px-1 rounded">{selectedRuleSelector || "(none selected)"}</code>
                  </span>
                  <span className="text-[7.5px] font-mono select-all text-gray-500">TSX valid CamelCase dict</span>
                </div>

                {selectedRuleSelector ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <span className="text-[8.5px] text-gray-600 italic leading-snug">
                      Write valid React.CSSProperties inside JSON format rules (e.g. key: "fontSize", value: "12px", "color": "#00ff00", etc.):
                    </span>
                    
                    <textarea
                      value={ruleJsonText}
                      onChange={(e) => {
                        setRuleJsonText(e.target.value);
                        // Validate as JSON on typing
                        try {
                          const parsed = JSON.parse(e.target.value);
                          if (parsed && typeof parsed === "object") {
                            setJsonError("");
                          } else {
                            setJsonError("Must be a valid key-value style object.");
                          }
                        } catch (err: any) {
                          setJsonError(err.message);
                        }
                      }}
                      className="flex-1 p-1 bg-white text-black font-mono text-[9px] border border-gray-400 focus:outline-none focus:border-blue-500 overflow-y-auto leading-normal"
                      placeholder={`{\n  "color": "#33ff33",\n  "fontStyle": "italic"\n}`}
                    />

                    {jsonError && (
                      <span className="text-red-700 bg-red-100 p-1 border border-red-200 text-[8px] font-mono leading-tight whitespace-pre-wrap max-h-[45px] overflow-y-auto block">
                        JSON Error: {jsonError}
                      </span>
                    )}

                    {/* Preloaded quick presets to paste into JSON */}
                    <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t">
                      <span className="text-[8px] font-bold text-gray-600 block w-full mb-0.5">Quick Inject Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const injection = {
                            color: "#00ff66",
                            backgroundColor: "#030612",
                            border: "1px dashed #00fed6",
                            borderRadius: "4px"
                          };
                          setRuleJsonText(JSON.stringify(injection, null, 2));
                          setJsonError("");
                        }}
                        className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-100 border border-gray-400 text-[8px]"
                      >
                        ⚡ Neon Outline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const injection = {
                            fontFamily: "ui-monospace, SFMono-Regular, monospace",
                            fontSize: "10.5px",
                            letterSpacing: "0.5px"
                          };
                          setRuleJsonText(JSON.stringify(injection, null, 2));
                          setJsonError("");
                        }}
                        className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-100 border border-gray-400 text-[8px]"
                      >
                        📟 Vintage Mono
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const injection = {
                            boxShadow: "3px 3px 0px #000000",
                            border: "1px solid #000000",
                            borderRadius: "0px"
                          };
                          setRuleJsonText(JSON.stringify(injection, null, 2));
                          setJsonError("");
                        }}
                        className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-100 border border-gray-400 text-[8px]"
                      >
                        🗃️ Brutalist Box
                      </button>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        disabled={!!jsonError}
                        onClick={() => {
                          if (jsonError) return;
                          try {
                            const parsed = JSON.parse(ruleJsonText);
                            setStyleRules({
                              ...styleRules,
                              [selectedRuleSelector]: parsed
                            });
                            setSuccessMsg(`Merged style properties for "${selectedRuleSelector}" selector!`);
                            setTimeout(() => setSuccessMsg(""), 2000);
                          } catch {
                            setJsonError("Failed to parse and merge Properties block.");
                          }
                        }}
                        className={`px-3 py-1 bg-slate-900 text-white font-bold text-[9px] uppercase border border-black ${
                          jsonError ? "opacity-45 cursor-not-allowed" : "hover:bg-slate-800"
                        }`}
                      >
                        Save Rules Selector Properties
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center italic text-gray-500 text-[10px]">
                    Choose or create a selector style rule from the sidebar menu list first to edit context settings.
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-400">
              <button
                type="button"
                onClick={() => {
                  setStyleRules({});
                  setSelectedRuleSelector("");
                  setRuleJsonText("");
                }}
                className="px-2 py-0.5 text-red-800 font-bold bg-gray-200 border border-red-300 hover:bg-red-50 text-[9px] active:bg-red-100 cursor-pointer uppercase"
              >
                Clear all style system rules
              </button>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    // Make sure the active selected buffer properties is saved before adopting!
                    if (selectedRuleSelector && !jsonError && ruleJsonText) {
                      try {
                        const parsed = JSON.parse(ruleJsonText);
                        const updated = {
                          ...styleRules,
                          [selectedRuleSelector]: parsed
                        };
                        setStyleRules(updated);
                        
                        // Apply immediately to let the user see results in preview!
                        const settings = syscall.getSettings();
                        const updatedConfig = {
                          ...settings,
                          style_system_rules: updated
                        };
                        syscall.saveSettings(updatedConfig);
                      } catch {
                        // ignore and adopt what was safe
                      }
                    } else {
                      // Apply what we have
                      const settings = syscall.getSettings();
                      const updatedConfig = {
                        ...settings,
                        style_system_rules: styleRules
                      };
                      syscall.saveSettings(updatedConfig);
                    }
                    setActiveOverlayDialog("none");
                    setSuccessMsg("Propagated System Overrides to dynamic styled components tree!");
                    setTimeout(() => setSuccessMsg(""), 3500);
                  }}
                  className="px-4 py-1.5 font-bold text-yellow-300 border border-slate-900 bg-[#102040] hover:bg-[#1a3060] flex items-center space-x-1 uppercase tracking-wide cursor-pointer text-[9px]"
                >
                  <Check className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Adopt and Propagate System Overrides</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
