import themeStrings from "../../styles/theme-strings.json";
import { SystemCallInterface } from "../../types/os";

export interface ThemeManagerUI {
  element: HTMLElement;
  destroy: () => void;
}

/**
 * Encapsulated Object Builder Arrow Function assigned to a const
 * to configure system compositor visual themes dynamically.
 */
export const ThemeManager = (syscall: SystemCallInterface): ThemeManagerUI => {
  // Read current system config parameters
  const currentSettings = syscall.getSettings();
  let activeTheme = currentSettings.current_desktop_theme || "Classic Blue";

  // Create UI Root element
  const container = document.createElement("div");
  container.className = "tlnx-theme-manager font-sans select-none";

  // Header Box
  const headerBox = document.createElement("div");
  headerBox.className = "tlnx-theme-header";
  
  const title = document.createElement("h2");
  title.innerText = themeStrings.themeManager.title;
  headerBox.appendChild(title);

  const desc = document.createElement("p");
  desc.innerText = themeStrings.themeManager.description;
  headerBox.appendChild(desc);
  
  container.appendChild(headerBox);

  // Theme status banner
  const statusBanner = document.createElement("div");
  statusBanner.className = "text-[10px] font-mono text-[#555] mb-3 bg-[#e8e4db] p-2 border border-[#b8b4ac] flex justify-between";
  const labelSpan = document.createElement("span");
  labelSpan.innerText = themeStrings.themeManager.themeLabel;
  const valSpan = document.createElement("strong");
  valSpan.className = "text-indigo-950 font-bold uppercase";
  valSpan.innerText = ` ${activeTheme}`;
  
  statusBanner.appendChild(labelSpan);
  statusBanner.appendChild(valSpan);
  container.appendChild(statusBanner);

  // Cards Grid layout
  const cardsGrid = document.createElement("div");
  cardsGrid.className = "tlnx-theme-card-grid";

  // Theme configuration definitions
  const themePresets = [
    {
      id: "classic-blue",
      name: themeStrings.themeManager.btnClassicBlue,
      wallpaper: "linear-gradient(135deg, #1b1e20, #2d3235)",
      colors: ["#1b1e20", "#2d3235"],
      bevel: "classic_bevel"
    },
    {
      id: "windows-95",
      name: themeStrings.themeManager.btnWin95,
      wallpaper: "#008080",
      colors: ["#0080c0", "#008080"],
      bevel: "classic_bevel"
    },
    {
      id: "ubuntu-2006",
      name: themeStrings.themeManager.btnUnix2006,
      wallpaper: "linear-gradient(135deg, #43261a 0%, #211108 100%)",
      colors: ["#43261a", "#211108"],
      bevel: "flat_minimal"
    },
    {
      id: "broken",
      name: themeStrings.themeManager.btnBroken,
      wallpaper: "linear-gradient(45deg, #1f0101, #000000)",
      colors: ["#2c0101", "#050000"],
      bevel: "shattered_corrupt"
    }
  ];

  let selectedCardId = "";
  if (activeTheme.toLowerCase().includes("win")) selectedCardId = "windows-95";
  else if (activeTheme.toLowerCase().includes("ubuntu")) selectedCardId = "ubuntu-2006";
  else if (activeTheme.toLowerCase().includes("broken")) selectedCardId = "broken";
  else selectedCardId = "classic-blue";

  // Track cards references for active highlights toggles
  const cardElements: Record<string, HTMLDivElement> = {};

  themePresets.forEach((theme) => {
    const card = document.createElement("div");
    card.className = `tlnx-theme-card ${theme.id === selectedCardId ? "active" : ""}`;
    
    const swatch = document.createElement("div");
    swatch.className = "preview-swatch";
    swatch.style.background = theme.wallpaper;
    swatch.style.backgroundImage = theme.wallpaper;
    card.appendChild(swatch);

    const nameSpan = document.createElement("span");
    nameSpan.innerText = theme.name;
    card.appendChild(nameSpan);

    card.addEventListener("click", () => {
      // Toggle state highlights
      Object.keys(cardElements).forEach((k) => cardElements[k].classList.remove("active"));
      card.classList.add("active");
      selectedCardId = theme.id;

      // Toggle broken alert warning visibility
      if (theme.id === "broken") {
        warningEl.classList.remove("hidden");
      } else {
        warningEl.classList.add("hidden");
      }
    });

    cardElements[theme.id] = card;
    cardsGrid.appendChild(card);
  });

  container.appendChild(cardsGrid);

  // Broken Theme warning node
  const warningEl = document.createElement("div");
  warningEl.className = `tlnx-theme-warning ${selectedCardId === "broken" ? "" : "hidden"}`;
  
  const wTitle = document.createElement("h4");
  wTitle.innerText = `⚠️ ${themeStrings.themeManager.warningTitle}`;
  warningEl.appendChild(wTitle);

  const wText = document.createElement("p");
  wText.innerText = themeStrings.themeManager.warningText;
  warningEl.appendChild(wText);

  container.appendChild(warningEl);

  // Alert success message label
  const successBadge = document.createElement("div");
  successBadge.className = "hidden text-[10.5px] font-bold text-center py-1.5 px-3 mb-2 bg-[#d1e7dd] border border-[#badbcc] text-[#0f5132]";
  successBadge.innerText = themeStrings.themeManager.successMsg;
  container.appendChild(successBadge);

  // Apply Button Trigger
  const applyBtn = document.createElement("button");
  applyBtn.className = "tlnx-theme-footer-btn";
  applyBtn.innerText = themeStrings.themeManager.btnApply;
  
  applyBtn.addEventListener("click", () => {
    const choice = themePresets.find((p) => p.id === selectedCardId);
    if (!choice) return;

    // Apply specific configs directly to etc/sysconfig settings map
    const liveConfig = syscall.getSettings();
    let computedThemeName = "Classic Blue";
    if (choice.id === "windows-95") computedThemeName = "Windows 95";
    else if (choice.id === "ubuntu-2006") computedThemeName = "Ubuntu 2006";
    else if (choice.id === "broken") computedThemeName = "Broken";

    const updated = {
      ...liveConfig,
      current_desktop_theme: computedThemeName,
      custom_wallpaper_color_1: choice.colors[0],
      custom_wallpaper_color_2: choice.colors[1],
      window_bevel_style: choice.bevel,
    };

    const success = syscall.saveSettings(updated);
    if (success) {
      syscall.syslog(`Theme switched dynamically to: ${computedThemeName}`);
      valSpan.innerText = ` ${computedThemeName}`;
      
      // Flash a quick elegant successful message toast
      successBadge.classList.remove("hidden");
      setTimeout(() => {
        successBadge.classList.add("hidden");
      }, 3000);
    }
  });

  container.appendChild(applyBtn);

  // Destructor callback representation
  const destroy = () => {
    // Clear listeners or timers if any was spawned inside
  };

  return {
    element: container,
    destroy
  };
};
