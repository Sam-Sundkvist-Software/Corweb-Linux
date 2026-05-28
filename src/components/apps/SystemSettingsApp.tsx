import React, { useState, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";
import { 
  Users, 
  Settings as SettingsIcon, 
  Trash2, 
  UserPlus, 
  Network, 
  Volume2, 
  ShieldAlert, 
  FolderLock, 
  Flame, 
  Cpu, 
  Palette, 
  Save, 
  RefreshCw,
  HardDrive,
  Monitor,
  Sliders
} from "lucide-react";

interface SystemSettingsAppProps {
  syscall: SystemCallInterface;
}

export default function SystemSettingsApp({ syscall }: SystemSettingsAppProps) {
  const [activeTab, setActiveTab] = useState<"users" | "policies" | "hardware" | "virtual_memory" | "aesthetics" | "daemons">("users");
  
  // Configuration State
  const [settings, setSettings] = useState<any>({});
  const [userList, setUserList] = useState<any[]>([]);

  // Form states for creating a user
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newAvatar, setNewAvatar] = useState("penguin");

  // Local settings fields
  const [hostname, setHostname] = useState("");
  const [networkingEnabled, setNetworkingEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [syslogVerbosity, setSyslogVerbosity] = useState("INFO");
  const [allowSystemWrites, setAllowSystemWrites] = useState(false);
  const [restrictProcessKill, setRestrictProcessKill] = useState(true);
  const [allowGuestTerminal, setAllowGuestTerminal] = useState(true);
  const [cpuThreads, setCpuThreads] = useState(4);
  const [panicOnMissingConfig, setPanicOnMissingConfig] = useState(true);
  const [wallpaperColor1, setWallpaperColor1] = useState("#2b5c8f");
  const [wallpaperColor2, setWallpaperColor2] = useState("#5086c1");
  const [restrictedPathsText, setRestrictedPathsText] = useState("");

  // Virtual Memory & Swap Config States
  const [virtualMemoryEnabled, setVirtualMemoryEnabled] = useState(true);
  const [swapFileSize, setSwapFileSize] = useState(2048);
  const [swappinessFactor, setSwappinessFactor] = useState(60);
  const [ramSizeAllocated, setRamSizeAllocated] = useState(4096);
  const [cacheEvictionPolicy, setCacheEvictionPolicy] = useState("LRU");

  // Design & Aesthetics Config States
  const [currentDesktopTheme, setCurrentDesktopTheme] = useState("Classic Blue");
  const [fontPreset, setFontPreset] = useState("Tahoma & Verdana");
  const [windowBevelStyle, setWindowBevelStyle] = useState("classic_bevel");
  const [pointerCursorEnforcement, setPointerCursorEnforcement] = useState(true);
  const [showDesktopGrid, setShowDesktopGrid] = useState(true);

  // Daemons & Services Config States
  const [daemonFlagEditor, setDaemonFlagEditor] = useState(true);
  const [daemonFileCrawler, setDaemonFileCrawler] = useState(true);
  const [daemonCronScheduler, setDaemonCronScheduler] = useState(false);
  const [daemonAudioSynth, setDaemonAudioSynth] = useState(true);
  const [bootLogVerbose, setBootLogVerbose] = useState(false);
  const [shutdownGraceSeconds, setShutdownGraceSeconds] = useState(5);

  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  // Load configuration from Kernel VFS
  const reloadConfig = () => {
    try {
      const liveSettings = syscall.getSettings();
      setSettings(liveSettings);
      
      setHostname(liveSettings.hostname || "tux-dapper-2006");
      setNetworkingEnabled(liveSettings.networking_enabled !== false);
      setSoundEnabled(liveSettings.system_sound !== false);
      setSyslogVerbosity(liveSettings.syslog_verbosity || "INFO");
      setAllowSystemWrites(liveSettings.allow_regular_user_system_writes === true);
      setRestrictProcessKill(liveSettings.restrict_process_kill !== false);
      setAllowGuestTerminal(liveSettings.allow_guest_terminal !== false);
      setCpuThreads(liveSettings.simulated_cpu_threads || 4);
      setPanicOnMissingConfig(liveSettings.kernel_panic_on_missing_sysconfig !== false);
      setWallpaperColor1(liveSettings.custom_wallpaper_color_1 || "#2b5c8f");
      setWallpaperColor2(liveSettings.custom_wallpaper_color_2 || "#5086c1");
      setRestrictedPathsText(Array.isArray(liveSettings.restricted_paths) ? liveSettings.restricted_paths.join(", ") : "");

      // Virtual Memory & Swap Config Loads
      setVirtualMemoryEnabled(liveSettings.virtual_memory_enabled !== false);
      setSwapFileSize(liveSettings.swap_file_size || 2048);
      setSwappinessFactor(liveSettings.swappiness_factor || 60);
      setRamSizeAllocated(liveSettings.ram_size_allocated || 4096);
      setCacheEvictionPolicy(liveSettings.cache_eviction_policy || "LRU");

      // Design & Aesthetics Config Loads
      setCurrentDesktopTheme(liveSettings.current_desktop_theme || "Classic Blue");
      setFontPreset(liveSettings.font_preset || "Tahoma & Verdana");
      setWindowBevelStyle(liveSettings.window_bevel_style || "classic_bevel");
      setPointerCursorEnforcement(liveSettings.pointer_cursor_enforcement !== false);
      setShowDesktopGrid(liveSettings.show_desktop_grid !== false);

      // Daemons & Services Config Loads
      setDaemonFlagEditor(liveSettings.daemon_flag_editor_enabled !== false);
      setDaemonFileCrawler(liveSettings.daemon_file_crawler_enabled !== false);
      setDaemonCronScheduler(liveSettings.daemon_cron_scheduler_enabled === true);
      setDaemonAudioSynth(liveSettings.daemon_audio_synth_enabled !== false);
      setBootLogVerbose(liveSettings.boot_log_verbose === true);
      setShutdownGraceSeconds(liveSettings.shutdown_grace_seconds || 5);

      const users = syscall.getUsers();
      setUserList(users);
    } catch (e: any) {
      console.error("Failed to read settings from filesystem", e);
    }
  };

  useEffect(() => {
    reloadConfig();
  }, []);

  const showStatus = (msg: string, type: "success" | "error") => {
    if (syscall.openDialog) {
      syscall.openDialog(
        type === "success" ? "Success Notification" : "System Notification",
        msg,
        type === "success" ? "info" : "error"
      );
    } else {
      setStatusMsg(msg);
      setStatusType(type);
      setTimeout(() => {
        setStatusMsg("");
        setStatusType("");
      }, 4000);
    }
  };

  // Save modified config back to filesystem
  const handleSaveConfig = () => {
    const rPaths = restrictedPathsText
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "");

    const updated = {
      ...settings,
      hostname,
      networking_enabled: networkingEnabled,
      system_sound: soundEnabled,
      syslog_verbosity: syslogVerbosity,
      allow_regular_user_system_writes: allowSystemWrites,
      restrict_process_kill: restrictProcessKill,
      allow_guest_terminal: allowGuestTerminal,
      simulated_cpu_threads: Number(cpuThreads),
      kernel_panic_on_missing_sysconfig: panicOnMissingConfig,
      custom_wallpaper_color_1: wallpaperColor1,
      custom_wallpaper_color_2: wallpaperColor2,
      restricted_paths: rPaths,

      // New properties to commit
      virtual_memory_enabled: virtualMemoryEnabled,
      swap_file_size: Number(swapFileSize),
      swappiness_factor: Number(swappinessFactor),
      ram_size_allocated: Number(ramSizeAllocated),
      cache_eviction_policy: cacheEvictionPolicy,

      current_desktop_theme: currentDesktopTheme,
      font_preset: fontPreset,
      window_bevel_style: windowBevelStyle,
      pointer_cursor_enforcement: pointerCursorEnforcement,
      show_desktop_grid: showDesktopGrid,

      daemon_flag_editor_enabled: daemonFlagEditor,
      daemon_file_crawler_enabled: daemonFileCrawler,
      daemon_cron_scheduler_enabled: daemonCronScheduler,
      daemon_audio_synth_enabled: daemonAudioSynth,
      boot_log_verbose: bootLogVerbose,
      shutdown_grace_seconds: Number(shutdownGraceSeconds),
    };

    const success = syscall.saveSettings(updated);
    if (success) {
      if (syscall.openDialog) {
        syscall.openDialog("Success", "Settings successfully stored to `/etc/sysconfig.json`", "info");
      } else {
        showStatus("Settings successfully stored to `/etc/sysconfig.json`", "success");
      }
      reloadConfig();
    } else {
      showStatus("Write Permission Denied. Restructured governance requires Admin/Root user status.", "error");
    }
  };

  // Add a brand new user account
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) {
      showStatus("All credential fields are required.", "error");
      return;
    }

    const success = syscall.addUser(
      newUsername.trim().toLowerCase(),
      newPassword,
      newRole,
      newFullName.trim(),
      newAvatar
    );

    if (success) {
      showStatus(`User '${newUsername}' successfully appended to '/etc/users.json'.`, "success");
      setNewUsername("");
      setNewFullName("");
      setNewPassword("");
      reloadConfig();
    } else {
      showStatus("Permission Denied: Lacking authorization or user name already exists.", "error");
    }
  };

  // Delete user account
  const handleDeleteUser = (uname: string) => {
    if (syscall.openDialog) {
      syscall.openDialog(
        "Confirm Purge",
        `Are you sure you want to permanently delete the user account for '${uname}'?`,
        "question",
        ["Yes", "No"],
        (res) => {
          if (res === "Yes") {
            const success = syscall.deleteUser(uname);
            if (success) {
              syscall.openDialog!("Purge Complete", `User credentials for '${uname}' have been successfully deleted.`, "info");
              reloadConfig();
            } else {
              syscall.openDialog!("Action Cancelled", `Cannot delete user '${uname}': Lacking higher credentials.`, "error");
            }
          }
        }
      );
    } else {
      const success = syscall.deleteUser(uname);
      if (success) {
        showStatus(`Purged user credentials for '${uname}'`, "success");
        reloadConfig();
      } else {
        showStatus(`Cannot delete user '${uname}': system restrictions active.`, "error");
      }
    }
  };

  return (
    <div className="flex-1 bg-[#eeeeec] flex flex-col min-h-0 select-none text-xs text-[#2e3436] font-sans relative">
      
      {/* Absolute non-shifting alert dialog module */}
      {statusMsg && (
        <div className="absolute inset-0 bg-[#2e3436]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-[fadeIn_0.12s_ease-out]">
          <div className="w-full max-w-[320px] bg-[#f2ebd9] border-2 border-[#a29481] rounded-md shadow-2xl flex flex-col overflow-hidden text-[#2e3436]">
            <div className="bg-[#714b43] text-[#f2ebd9] px-3 py-1.5 flex items-center justify-between font-bold text-[9.5px] uppercase select-none">
              <span>{statusType === "success" ? "✅ Success feedback" : "⚠️ Authorization error"}</span>
              <button 
                type="button"
                onClick={() => {
                  setStatusMsg("");
                  setStatusType("");
                }}
                className="w-4 h-4 rounded-xs hover:bg-white/20 flex items-center justify-center text-[9px] font-black cursor-pointer text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 flex items-start space-x-3 bg-[#faf6ec]/50 border-b border-[#a29481]/30">
              <div className="pt-0.5 shrink-0 text-md select-none">
                {statusType === "success" ? "✔️" : "⚠️"}
              </div>
              <p className="text-[10px] leading-4.5 font-bold text-[#555753] select-text">
                {statusMsg}
              </p>
            </div>
            
            <div className="bg-[#ebd9c8]/50 p-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setStatusMsg("");
                  setStatusType("");
                }}
                className="px-4 py-1 bg-[#eae1c8] hover:bg-[#dfd5bc] text-[#714b43] font-black uppercase text-[9px] border border-[#a29481] rounded shadow-xs active:translate-y-px select-none cursor-pointer"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Application Ribbon */}
      <div className="bg-gradient-to-b from-[#f3f3f1] to-[#edeceb] border-b border-[#babdb6] px-4 py-2 flex items-center justify-between text-gray-800">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-4 h-4 text-[#3465a4]" />
          <span className="font-bold text-sm text-[#204a87]">Control Panel & Governance Settings</span>
        </div>
        <button
          onClick={reloadConfig}
          className="p-1 hover:bg-[#d3d7cf] rounded transition-colors flex items-center space-x-1 border border-transparent hover:border-[#babdb6]"
          title="Sync settings"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#555753]" />
          <span className="text-[10px] font-bold">Reload FS</span>
        </button>
      </div>

      {/* Main Panel grid split */}
      <div className="flex-1 flex min-h-0">
        {/* Navigation Rail */}
        <div className="w-36 bg-[#edeceb] border-r border-[#babdb6] flex flex-col py-2.5">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 text-left font-bold flex items-center space-x-2 text-[11px] transition-colors ${
              activeTab === "users"
                ? "bg-[#729fcf]/30 border-r-4 border-r-[#3465a4] text-[#204a87]"
                : "hover:bg-[#d3d7cf]/40 text-[#2e3436]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2.5 text-left font-bold flex items-center space-x-2 text-[11px] transition-colors ${
              activeTab === "policies"
                ? "bg-[#729fcf]/30 border-r-4 border-r-[#3465a4] text-[#204a87]"
                : "hover:bg-[#d3d7cf]/40 text-[#2e3436]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Permission rules</span>
          </button>

          <button
            onClick={() => setActiveTab("hardware")}
            className={`px-4 py-2.5 text-left font-bold flex items-center space-x-2 text-[11px] transition-colors ${
              activeTab === "hardware"
                ? "bg-[#729fcf]/30 border-r-4 border-r-[#3465a4] text-[#204a87]"
                : "hover:bg-[#d3d7cf]/40 text-[#2e3436]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Core Hardware</span>
          </button>

          <button
            onClick={() => setActiveTab("virtual_memory")}
            className={`px-4 py-2.5 text-left font-bold flex items-center space-x-2 text-[11px] transition-colors ${
              activeTab === "virtual_memory"
                ? "bg-[#729fcf]/30 border-r-4 border-r-[#3465a4] text-[#204a87]"
                : "hover:bg-[#d3d7cf]/40 text-[#2e3436]"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Virtual Memory</span>
          </button>

          <button
            onClick={() => setActiveTab("aesthetics")}
            className={`px-4 py-2.5 text-left font-bold flex items-center space-x-2 text-[11px] transition-colors ${
              activeTab === "aesthetics"
                ? "bg-[#729fcf]/30 border-r-4 border-r-[#3465a4] text-[#204a87]"
                : "hover:bg-[#d3d7cf]/40 text-[#2e3436]"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Aesthetics</span>
          </button>

          <button
            onClick={() => setActiveTab("daemons")}
            className={`px-4 py-2.5 text-left font-bold flex items-center space-x-2 text-[11px] transition-colors ${
              activeTab === "daemons"
                ? "bg-[#729fcf]/30 border-r-4 border-r-[#3465a4] text-[#204a87]"
                : "hover:bg-[#d3d7cf]/40 text-[#2e3436]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Init Daemons</span>
          </button>

          {/* Test Disaster segment */}
          <div className="mt-auto px-2 pb-1 pt-4 border-t border-[#babdb6]/80 text-[10px] text-[#2e3436]">
            <div className="bg-[#ef2929]/5 border border-[#ef2929]/30 rounded p-2 flex flex-col space-y-1.5">
              <span className="font-extrabold text-[#ef2929] flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                <span>Panic Drill</span>
              </span>
              <p className="text-[9px] text-[#555753] leading-3">Simulate an immediate system-critical crash.</p>
              <button
                onClick={() => {
                  if (confirm("Execute immediately? This will trigger a realistic GDM Unix Kernel Panic screen to test disaster integrity.")) {
                    syscall.triggerKernelPanic("Simulated hardware interrupt exception (Panic drill triggered from Settings dashboard).");
                  }
                }}
                className="w-full py-1 text-center font-bold bg-[#ef2929] hover:bg-[#cc0000] text-white rounded text-[9px] shadow-xs active:translate-y-px transition-colors select-none"
              >
                Trigger Panic
              </button>
            </div>
          </div>
        </div>

        {/* Configurations Fields Pane */}
        <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col">

          {activeTab === "users" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[12px] font-bold text-[#204a87] border-b border-[#babdb6] pb-1 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#729fcf]" />
                  <span>Existing User Accounts in `/etc/users.json`</span>
                </h4>
                
                <div className="mt-2 text-[11px] divide-y divide-[#babdb6] max-h-36 overflow-y-auto border border-[#babdb6] rounded bg-[#eeeeec]/20">
                  {userList.map((user) => (
                    <div key={user.username} className="p-2.5 flex items-center justify-between hover:bg-[#729fcf]/5">
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 bg-[#babdb6] border border-[#555753] rounded-full flex items-center justify-center font-bold text-gray-800 text-[10px] uppercase shadow-inner">
                          {user.avatar === "penguin" ? "🐧" : user.avatar === "system" ? "⚙️" : "👤"}
                        </div>
                        <div>
                          <p className="font-bold text-[#2e3436]">{user.fullName} ({user.username})</p>
                          <div className="flex items-center space-x-2 text-[9px]">
                            <span className="px-1 py-[1px] bg-[#729fcf]/25 text-[#204a87] rounded border border-[#729fcf]/40 font-bold uppercase">{user.role}</span>
                            <span className="text-gray-500 font-mono">PW: {user.passwordHash ? "••••••" : "blank"}</span>
                          </div>
                        </div>
                      </div>

                      {user.username !== "root" && user.username !== "tux" ? (
                        <button
                          onClick={() => handleDeleteUser(user.username)}
                          className="p-1 hover:bg-[#ef2929]/15 rounded text-[#ef2929] hover:border-[#ef2929]/40 border border-transparent transition-all"
                          title="Purge user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-gray-400 font-bold px-1 select-none">SYSTEM</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add User account Form */}
              <form onSubmit={handleAddUser} className="bg-[#edeceb]/45 border border-[#babdb6] p-3 rounded space-y-3">
                <span className="font-bold text-[10px] text-[#204a87] flex items-center space-x-1 uppercase tracking-wider">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Custom Login Account</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-0.5">Username (lowercase)</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] outline-none text-[#2e3436] font-mono focus:border-[#729fcf]"
                      placeholder="e.g. administrator"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      maxLength={16}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-0.5">Full display name</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] outline-none text-[#2e3436] focus:border-[#729fcf]"
                      placeholder="e.g. Linus Torvalds"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      maxLength={32}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-0.5">Password hash</label>
                    <input
                      type="password"
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] outline-none text-[#2e3436] font-mono focus:border-[#729fcf]"
                      placeholder="Empty means blank"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      maxLength={16}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-0.5">System Privilege Level</label>
                    <select
                      className="w-full px-2.5 py-1 bg-white border border-[#babdb6] rounded text-[11px] outline-none text-[#2e3436] font-sans font-bold focus:border-[#729fcf]"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="user">User (guest rights)</option>
                      <option value="admin">Admin (tux rights)</option>
                      <option value="root">Root (Full access rights)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-0.5">Avatar Style</label>
                    <select
                      className="w-full px-2.5 py-1 bg-white border border-[#babdb6] rounded text-[11px] outline-none text-[#2e3436] font-sans focus:border-[#729fcf]"
                      value={newAvatar}
                      onChange={(e) => setNewAvatar(e.target.value)}
                    >
                      <option value="penguin">🐧 Penguin Icon</option>
                      <option value="system">⚙️ Cogwheel</option>
                      <option value="guest">👤 Profile Shadow</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-gradient-to-b from-[#729fcf] to-[#3465a4] text-white rounded font-bold hover:opacity-90 shadow-sm active:translate-y-px transition-all select-none border border-[#204a87]"
                >
                  Append New Account
                </button>
              </form>
            </div>
          )}

          {activeTab === "policies" && (
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold text-[#204a87] border-b border-[#babdb6] pb-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#ef2929]" />
                <span>Security Governance Policies & Restricted Paths</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3.5">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="allow_system_write_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={allowSystemWrites}
                      onChange={(e) => setAllowSystemWrites(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="allow_system_write_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Allow Normal users system write-access
                      </label>
                      <p className="text-[10px] text-gray-500 leading-4 mt-0.5">
                        If unchecked, only admin (`tux`) and `root` can modify system folders (e.g. `/bin`, `/etc`, `/var`). If checked, guests can write there too.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="restrict_sigkill_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={restrictProcessKill}
                      onChange={(e) => setRestrictProcessKill(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="restrict_sigkill_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Protect Root Processes and services from SIGKILL
                      </label>
                      <p className="text-[10px] text-gray-500 leading-4 mt-0.5">
                        Refuses requests from lower privilege processes or users to kill core root hardware processes and background service daemons.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="allow_guest_terminal_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={allowGuestTerminal}
                      onChange={(e) => setAllowGuestTerminal(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="allow_guest_terminal_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Allow Guest/Regular User Terminal CLI shells
                      </label>
                      <p className="text-[10px] text-gray-500 leading-4 mt-0.5">
                        Permits users with standard `user` roles (e.g. `guest`) to invoke CLI shell process lines. Disabling this restricts them to graphical UI icons.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 border border-[#babdb6] bg-[#eeeeec]/30 rounded space-y-2">
                    <span className="font-bold text-[10px] text-[#204a87] uppercase tracking-wider flex items-center space-x-1.5 leading-4">
                      <FolderLock className="w-3.5 h-3.5" />
                      <span>Confidential Restricted Paths</span>
                    </span>
                    <p className="text-[9px] text-gray-500 leading-3">
                      List absolute file-paths separated by commas. Regular users/guests will be blocked from reading or writing to these file target locations.
                    </p>
                    <textarea
                      className="w-full h-16 p-2 bg-white border border-[#babdb6] rounded text-[11px] text-[#2e3436] font-mono outline-none focus:border-[#729fcf] resize-none"
                      placeholder="e.g. /var/log/syslog, /etc/users.json"
                      value={restrictedPathsText}
                      onChange={(e) => setRestrictedPathsText(e.target.value)}
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="panic_missing_cfg_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={panicOnMissingConfig}
                      onChange={(e) => setPanicOnMissingConfig(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="panic_missing_cfg_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Halt Kernel immediately if core files go missing
                      </label>
                      <p className="text-[10px] text-gray-500 leading-4 mt-0.5">
                        Automatically invokes a <b>Kernel Panic</b> halt state if `/etc/sysconfig.json` is missing, deleted, or write operations corrupt its structural JSON data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#babdb6] pt-3 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-[#729fcf] border border-[#204a87] text-white hover:bg-[#3465a4] rounded font-bold text-xs select-none flex items-center space-x-1.5 shadow-sm active:translate-y-px transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit Governance Rules</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "hardware" && (
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold text-[#204a87] border-b border-[#babdb6] pb-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#8ae234]" />
                <span>Simulated CPU and Desktop Wallpaper Governance</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#2e3436] mb-1">Simulated Hardware Hostname</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] outline-none font-mono text-gray-800"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#2e3436] mb-1 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-gray-500" />
                      <span>Simulated CPU cores count (affects load loops)</span>
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 bg-white border border-[#babdb6] rounded text-[11px]"
                      value={cpuThreads}
                      onChange={(e) => setCpuThreads(Number(e.target.value))}
                    >
                      <option value={1}>1 Core Intel Pentium M (No drift)</option>
                      <option value={2}>2 Cores Intel Core Duo (Standard drift)</option>
                      <option value={4}>4 Cores Core 2 Quad (Heavy loads drift)</option>
                      <option value={8}>8 Cores Xeon Server (Hyper drift)</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="syslog_verb" className="font-bold text-[#2e3436]">System Logging Verbosity</label>
                      <select
                        id="syslog_verb"
                        className="px-2 py-1 bg-white border border-[#babdb6] rounded"
                        value={syslogVerbosity}
                        onChange={(e) => setSyslogVerbosity(e.target.value)}
                      >
                        <option value="DEBUG">DEBUG - verbose audits</option>
                        <option value="INFO">INFO - core actions</option>
                        <option value="WARN">WARN - warnings</option>
                        <option value="CRITICAL">CRITICAL - panic loops</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="networking_chk" className="font-bold text-[#2e3436] flex items-center space-x-1.5">
                        <Network className="w-4 h-4 text-gray-500" />
                        <span>Networking (eth0) socket state</span>
                      </label>
                      <input
                        type="checkbox"
                        id="networking_chk"
                        className="rounded text-[#3465a4]"
                        checked={networkingEnabled}
                        onChange={(e) => setNetworkingEnabled(e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="sound_chk" className="font-bold text-[#2e3436] flex items-center space-x-1.5">
                        <Volume2 className="w-4 h-4 text-gray-500" />
                        <span>Core system-sound synthesis speaker</span>
                      </label>
                      <input
                        type="checkbox"
                        id="sound_chk"
                        className="rounded text-[#3465a4]"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 border border-[#babdb6] bg-[#eeeeec]/20 rounded space-y-3">
                  <span className="font-bold text-[10px] text-[#204a87] uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Ubuntu Desktop Themes and Wallpaper</span>
                  </span>

                  <p className="text-[10px] text-gray-500 leading-4">
                    Modify the gradient colors parameter. These colors will directly render the desktop backdrop theme on save!
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-600 font-bold mb-0.5">Backdrop Color 1</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="color"
                          className="w-7 h-6 cursor-pointer border border-[#babdb6] rounded-sm"
                          value={wallpaperColor1}
                          onChange={(e) => setWallpaperColor1(e.target.value)}
                        />
                        <input
                          type="text"
                          className="flex-1 bg-white border border-[#babdb6] rounded text-[10px] font-mono px-1.5 text-center text-gray-700"
                          value={wallpaperColor1}
                          onChange={(e) => setWallpaperColor1(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-600 font-bold mb-0.5">Backdrop Color 2</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="color"
                          className="w-7 h-6 cursor-pointer border border-[#babdb6] rounded-sm"
                          value={wallpaperColor2}
                          onChange={(e) => setWallpaperColor2(e.target.value)}
                        />
                        <input
                          type="text"
                          className="flex-1 bg-white border border-[#babdb6] rounded text-[10px] font-mono px-1.5 text-center text-gray-700"
                          value={wallpaperColor2}
                          onChange={(e) => setWallpaperColor2(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Color Presets */}
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Color backgroud schemes presets</span>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => {
                          setWallpaperColor1("#2b5c8f");
                          setWallpaperColor2("#5086c1");
                        }}
                        className="px-2 py-1 border border-[#babdb6] rounded bg-[#2b5c8f] text-white text-[9px] font-bold"
                      >
                        Classic Blue
                      </button>
                      <button
                        onClick={() => {
                          setWallpaperColor1("#5e2750");
                          setWallpaperColor2("#e95420");
                        }}
                        className="px-2 py-1 border border-[#babdb6] rounded bg-[#5e2750] text-white text-[9px] font-bold"
                      >
                        Ubuntu Human
                      </button>
                      <button
                        onClick={() => {
                          setWallpaperColor1("#1c1b1a");
                          setWallpaperColor2("#3b3b3a");
                        }}
                        className="px-2 py-1 border border-[#babdb6] rounded bg-[#1c1b1a] text-white text-[9px] font-bold"
                      >
                        Charcoal Mono
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#babdb6] pt-3 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-[#729fcf] border border-[#204a87] text-white hover:bg-[#3465a4] rounded font-bold text-xs select-none flex items-center space-x-1.5 shadow-sm active:translate-y-px transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit Hardware configurations</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "virtual_memory" && (
            <div className="space-y-4 animate-[fadeIn_0.1s_ease-out]">
              <h4 className="text-[12px] font-bold text-[#204a87] border-b border-[#babdb6] pb-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#3465a4]" />
                <span>Virtual Memory Cache Allocation & Swapspace Config</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="vmem_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={virtualMemoryEnabled}
                      onChange={(e) => setVirtualMemoryEnabled(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="vmem_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Enable Virtual Paging Cache (Swap File)
                      </label>
                      <p className="text-[10px] text-gray-500 leading-4 mt-0.5">
                        Utilizes fallback storage sectors when primary system memory RAM cache exceeds limits.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Allocated Virtual RAM Volume (MB)</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="256"
                        max="16384"
                        step="256"
                        className="flex-1 accent-[#3465a4]"
                        value={ramSizeAllocated}
                        onChange={(e) => setRamSizeAllocated(Number(e.target.value))}
                      />
                      <span className="font-mono text-xs font-bold text-gray-800 shrink-0 w-16 text-right">
                        {ramSizeAllocated} MB
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Swap File Partition Size (MB)</label>
                    <select
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] outline-none text-[#2e3436] font-bold focus:border-[#729fcf]"
                      value={swapFileSize}
                      onChange={(e) => setSwapFileSize(Number(e.target.value))}
                    >
                      <option value="512">512 MB Partition Sector</option>
                      <option value="1024">1024 MB Partition Sector</option>
                      <option value="2048">2048 MB Standard Sector</option>
                      <option value="4096">4096 MB Large Performance Sector</option>
                      <option value="8192">8192 MB Server Enterprise Sector</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 border border-[#babdb6] bg-[#eeeeec]/20 rounded space-y-4">
                  <span className="font-bold text-[10px] text-[#204a87] uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Cache Swappiness Policies</span>
                  </span>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-1">Kernel Cache Swappiness Factor (0 - 100)</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="flex-1 accent-[#3465a4]"
                        value={swappinessFactor}
                        onChange={(e) => setSwappinessFactor(Number(e.target.value))}
                      />
                      <span className="font-mono text-xs font-bold text-gray-800 shrink-0 w-10 text-right">
                        {swappinessFactor}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-500 mt-1 leading-3">
                      Higher swappiness tells the operating system kernel to clean passive cache pages to disk early.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-1">Cache Sector Eviction Algorithm</label>
                    <select
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px]"
                      value={cacheEvictionPolicy}
                      onChange={(e) => setCacheEvictionPolicy(e.target.value)}
                    >
                      <option value="LRU">Least Recently Used (LRU - Recommended)</option>
                      <option value="LFU">Least Frequently Used (LFU - Intensive file streams)</option>
                      <option value="FIFO">First In, First Out (FIFO - Low CPU overhead)</option>
                      <option value="RANDOM">Arbitrary Random Purge</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#babdb6] pt-3 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-[#729fcf] border border-[#204a87] text-white hover:bg-[#3465a4] rounded font-bold text-xs select-none flex items-center space-x-1.5 shadow-sm active:translate-y-px transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit Virtual Memory configuration</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "aesthetics" && (
            <div className="space-y-4 animate-[fadeIn_0.1s_ease-out]">
              <h4 className="text-[12px] font-bold text-[#204a87] border-b border-[#babdb6] pb-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#f57900]" />
                <span>Operating Desktop Aesthetics & Style Preferences</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">System Global Font Order</label>
                    <select
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] cursor-pointer"
                      value={fontPreset}
                      onChange={(e) => setFontPreset(e.target.value)}
                    >
                      <option value="Tahoma & Verdana">Tahoma priority [Recommended] (Tahoma, Verdana, sans-serif)</option>
                      <option value="Verdana & Tahoma">Verdana priority (Verdana, Tahoma, sans-serif)</option>
                      <option value="Modern Inter">Modern Sans-Serif (Inter, system-ui, sans-serif)</option>
                      <option value="Monospace JetBrains">Tech Monospace (JetBrains Mono, Fira Code, monospace)</option>
                    </select>
                    <p className="text-[9px] text-gray-500 mt-1 leading-3">
                      We exclude MS Sans Serif style. Fonts automatically prioritize Tahoma and Verdana for readable retro curves.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Graphical Window Trim Border Style</label>
                    <select
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px]"
                      value={windowBevelStyle}
                      onChange={(e) => setWindowBevelStyle(e.target.value)}
                    >
                      <option value="classic_bevel">Windows 2000 Classic 3D Double Bevel Border</option>
                      <option value="sharp">Sharp Flat Minimal Slate border (90-degree corners)</option>
                      <option value="rounded">Modern Ubuntu GNOME Rounded Window Trim (8px radius)</option>
                    </select>
                  </div>

                  <div className="flex items-start space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="desktop_grid_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={showDesktopGrid}
                      onChange={(e) => setShowDesktopGrid(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="desktop_grid_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Align items to Desktop Shortcut Grid
                      </label>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-4">
                        Enforces grid snap-points on shortcuts for neat arrangement.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 border border-[#babdb6] bg-[#eeeeec]/20 rounded space-y-4">
                  <span className="font-bold text-[10px] text-[#204a87] uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Strict Cursor Standards Config</span>
                  </span>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="cursor1_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={pointerCursorEnforcement}
                      onChange={(e) => setPointerCursorEnforcement(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="cursor1_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Strict Cursor pointer standards policy
                      </label>
                      <p className="text-[10px] text-gray-500 leading-4 mt-0.5">
                        When enabled, the OS restricts the "pointer" hand cursor solely to hypertext links and shortcuts. Regular buttons use standard arrow cursors.
                      </p>
                    </div>
                  </div>

                  <div className="p-2 border border-[#edd400] bg-[#fce94f]/15 text-[#c4a000] text-[9.5px] font-bold rounded leading-3">
                    ⚠️ DESIGN COMPLIANCE: Beam selection cursors are strictly restricted to input fields only. Action trigger buttons never show the text beam.
                  </div>
                </div>
              </div>

              <div className="border-t border-[#babdb6] pt-3 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-[#729fcf] border border-[#204a87] text-white hover:bg-[#3465a4] rounded font-bold text-xs select-none flex items-center space-x-1.5 shadow-sm active:translate-y-px transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit Aesthetics configuration</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "daemons" && (
            <div className="space-y-4 animate-[fadeIn_0.1s_ease-out]">
              <h4 className="text-[12px] font-bold text-[#204a87] border-b border-[#babdb6] pb-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#3465a4]" />
                <span>System Daemon Runlevels and Startup Services</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3.5">
                  <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block">
                    Active System Services (/etc/init.d/)
                  </span>

                  <div className="flex items-center justify-between p-2 bg-[#eeeeec]/50 border border-[#babdb6] rounded">
                    <div>
                      <p className="font-bold text-[#2e3436] text-[11px]">Flag Registry Daemon (systemFlagEditorUFD)</p>
                      <p className="text-[9px] text-gray-500">Monitors kernel register writes in real-time</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded text-[#3465a4]"
                      checked={daemonFlagEditor}
                      onChange={(e) => setDaemonFlagEditor(e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-[#eeeeec]/50 border border-[#babdb6] rounded">
                    <div>
                      <p className="font-bold text-[#2e3436] text-[11px]">VFS File Indexer Crawler (vfs_indexer_svc)</p>
                      <p className="text-[9px] text-gray-500">Indexes file descriptors for lookup and operations</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded text-[#3465a4]"
                      checked={daemonFileCrawler}
                      onChange={(e) => setDaemonFileCrawler(e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-[#eeeeec]/50 border border-[#babdb6] rounded">
                    <div>
                      <p className="font-bold text-[#2e3436] text-[11px]">Task Cron Scheduler (cron_scheduler)</p>
                      <p className="text-[9px] text-gray-500">Runs registered automated events in the background</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded text-[#3465a4]"
                      checked={daemonCronScheduler}
                      onChange={(e) => setDaemonCronScheduler(e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-[#eeeeec]/50 border border-[#babdb6] rounded">
                    <div>
                      <p className="font-bold text-[#2e3436] text-[11px]">Speaker sound synthesizer daemon</p>
                      <p className="text-[9px] text-gray-500">Provides audio frequencies on standard kernel alerts</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded text-[#3465a4]"
                      checked={daemonAudioSynth}
                      onChange={(e) => setDaemonAudioSynth(e.target.checked)}
                    />
                  </div>
                </div>

                <div className="p-3.5 border border-[#babdb6] bg-[#eeeeec]/20 rounded space-y-4">
                  <span className="font-bold text-[10px] text-[#204a87] uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Boot and Grace Options</span>
                  </span>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="bootlog_chk"
                      className="mt-0.5 rounded text-[#3465a4]"
                      checked={bootLogVerbose}
                      onChange={(e) => setBootLogVerbose(e.target.checked)}
                    />
                    <div>
                      <label htmlFor="bootlog_chk" className="font-bold cursor-pointer text-[#2e3436]">
                        Verbose Startup boot log output (Verbose OS)
                      </label>
                      <p className="text-[10px] text-gray-500 leading-4 mt-0.5">
                        Outputs detailed startup steps and registers allocations before initializing desktop windows.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-600 font-bold mb-1">Shutdown Timeout Grace period (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className="w-full px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] font-mono outline-none text-[#2e3436]"
                      value={shutdownGraceSeconds}
                      onChange={(e) => setShutdownGraceSeconds(Number(e.target.value))}
                    />
                    <p className="text-[9px] text-gray-500 mt-1 leading-3">
                      Amount of seconds allowed for daemons to flush cache files to simulated flash storage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#babdb6] pt-3 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-[#729fcf] border border-[#204a87] text-white hover:bg-[#3465a4] rounded font-bold text-xs select-none flex items-center space-x-1.5 shadow-sm active:translate-y-px transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit Boot runlevels configurations</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
