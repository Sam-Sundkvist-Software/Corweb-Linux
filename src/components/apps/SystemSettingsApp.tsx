import React, { useState, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";
import { 
  Users, 
  Settings as SettingsIcon, 
  Trash2, 
  UserPlus, 
  Save, 
  RefreshCw,
  Plus,
  ShieldCheck,
  Flame,
  Check,
  X
} from "lucide-react";

interface SystemSettingsAppProps {
  syscall: SystemCallInterface;
}

const PREDEFINED_SETTINGS = [
  {
    key: "hostname",
    name: "System Hostname",
    description: "The unique identifier representing this virtual computer on diagnostic checks and prompt labels.",
    defaultType: "string"
  },
  {
    key: "networking_enabled",
    name: "In-Browser Network Connection",
    description: "Permits the Surfer web browser to route traffic. If toggled off, loading external resources will block.",
    defaultType: "boolean"
  },
  {
    key: "system_sound",
    name: "Audio Playback & Warnings",
    description: "Drives real-time audio playback, auditory clicks, and warning cues.",
    defaultType: "boolean"
  },
  {
    key: "syslog_verbosity",
    name: "System Logging Level",
    description: "Granularity level of logged operations visible in backend logs (INFO, DEBUG, WARN, ERROR).",
    defaultType: "string"
  },
  {
    key: "allow_regular_user_system_writes",
    name: "Standard Write Privileges",
    description: "Allows non-admin users to directly modify nodes inside system directories.",
    defaultType: "boolean"
  },
  {
    key: "restrict_process_kill",
    name: "Daemon Thread Protection",
    description: "Bypasses standard termination signals for critical system-owned processes.",
    defaultType: "boolean"
  },
  {
    key: "allow_guest_terminal",
    name: "Guest Terminal Shell",
    description: "Allows unauthenticated guests of the terminal program to execute shell processes.",
    defaultType: "boolean"
  },
  {
    key: "simulated_cpu_threads",
    name: "Simulated Processor Threads",
    description: "Number of logical parallel processes allocated to handle periodic file audits.",
    defaultType: "number"
  },
  {
    key: "kernel_panic_on_missing_sysconfig",
    name: "Critical Panic on Missing Configs",
    description: "Priggers a blue-screen kernel panic if the primary OS config file goes missing.",
    defaultType: "boolean"
  },
  {
    key: "custom_wallpaper_color_1",
    name: "Desktop Background Primary Hue",
    description: "Hex code representing the starting color of the desktop's backing linear gradient.",
    defaultType: "string"
  },
  {
    key: "custom_wallpaper_color_2",
    name: "Desktop Background Secondary Hue",
    description: "Hex code representing the finishing color of the desktop's backing linear gradient.",
    defaultType: "string"
  },
  {
    key: "virtual_memory_enabled",
    name: "Virtual RAM Allocation (Swap)",
    description: "Offloads inactive modules to the storage disk when system memory constraints arise.",
    defaultType: "boolean"
  },
  {
    key: "swap_file_size",
    name: "Swap Disk Size (MB)",
    description: "The volume size on the filesystem allocated purely for virtual paging sectors.",
    defaultType: "number"
  },
  {
    key: "swappiness_factor",
    name: "Memory Swappiness bias",
    description: "Controls how aggressively the kernel switches volatile pages to storage drives (0-100).",
    defaultType: "number"
  },
  {
    key: "ram_size_allocated",
    name: "Base Assigned Memory (MB)",
    description: "Represents the primary operational volatile memory allotted to active programs.",
    defaultType: "number"
  },
  {
    key: "cache_eviction_policy",
    name: "File Cache Eviction Technique",
    description: "Algorithmic rules determines how old files are cleaned from active memory. (LRU, MRU, FIFO)",
    defaultType: "string"
  },
  {
    key: "current_desktop_theme",
    name: "Visual Theme Preset",
    description: "Skins general system applications (e.g. Classic Blue, Clean Light, Charcoal Slate).",
    defaultType: "string"
  },
  {
    key: "font_preset",
    name: "Default Font Families",
    description: "Typography fonts loaded to render program title bars, menus, and system readouts.",
    defaultType: "string"
  },
  {
    key: "window_bevel_style",
    name: "Window Frame Edge Styling",
    description: "Decorates borders of standard computer programs. (classic_bevel, flat_minimal)",
    defaultType: "string"
  },
  {
    key: "pointer_cursor_enforcement",
    name: "Enforce Standard Pointer",
    description: "Enforces default graphic shapes for cursors globally across all interfaces.",
    defaultType: "boolean"
  },
  {
    key: "show_desktop_grid",
    name: "Shortcut Alignment Grid",
    description: "Snaps workspace shortcut icons neatly to predefined background grid points.",
    defaultType: "boolean"
  },
  {
    key: "daemon_flag_editor_enabled",
    name: "Configuration Integrity Daemon",
    description: "Ensures /etc/sysconfig.json files stay secure via active folder checks.",
    defaultType: "boolean"
  },
  {
    key: "daemon_file_crawler_enabled",
    name: "Active Indexing Crawler",
    description: "Crawls folders as files change to deliver instant, indexed searches.",
    defaultType: "boolean"
  },
  {
    key: "daemon_cron_scheduler_enabled",
    name: "Automated Task Scheduler",
    description: "Periodically executes scheduled command lines under background daemons.",
    defaultType: "boolean"
  },
  {
    key: "daemon_audio_synth_enabled",
    name: "Audio Synthesizer Broker",
    description: "Orchestrates background sound cards and manages real-time buffer streaming.",
    defaultType: "boolean"
  },
  {
    key: "boot_log_verbose",
    name: "Verbose Diagnostic Boot Logs",
    description: "Priggers the loader to display extra device addresses when starting up.",
    defaultType: "boolean"
  },
  {
    key: "shutdown_grace_seconds",
    name: "Shutdown Termination Buffers",
    description: "Seconds buffer to shut down processes safely before forcing task termination.",
    defaultType: "number"
  }
];

export default function SystemSettingsApp({ syscall }: SystemSettingsAppProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "users">("settings");
  
  // Settings representation
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [userList, setUserList] = useState<any[]>([]);

  // User creation fields
  const [newUname, setNewUname] = useState("");
  const [newFName, setNewFName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newAvatar, setNewAvatar] = useState("user");

  // Custom setting row creation
  const [customKey, setCustomKey] = useState("");
  const [customType, setCustomType] = useState<"string" | "boolean" | "number" | "array">("string");
  const [customVal, setCustomVal] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Determine permissions based on current authenticated actor
  const currentUser = syscall.getCurrentUser();
  const userRole = syscall.getCurrentUserRole();
  const isReadOnly = userRole !== "admin" && currentUser !== "root" && currentUser !== "tux";

  const reloadAll = () => {
    try {
      const liveSettings = syscall.getSettings() || {};
      setSettings(liveSettings);

      const users = syscall.getUsers() || [];
      setUserList(users);
      setMessage(null);
    } catch (e: any) {
      console.error("System Settings initialization error:", e);
    }
  };

  useEffect(() => {
    reloadAll();
  }, []);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdateSetting = (key: string, value: any) => {
    if (isReadOnly) {
      triggerToast("Permission denied. Guest users are not authorized to save settings.", "error");
      return;
    }

    const updated = {
      ...settings,
      [key]: value
    };

    const success = syscall.saveSettings(updated);
    if (success) {
      setSettings(updated);
      triggerToast(`Successfully modified system configuration: ${key}.`);
    } else {
      triggerToast("Failed to write to VFS. Lacking admin authorization privileges.", "error");
    }
  };

  const handleTypeChange = (key: string, targetType: string) => {
    if (isReadOnly) {
      triggerToast("Permission denied. Changing data types is restricted.", "error");
      return;
    }

    const val = settings[key];
    let converted: any = val;

    if (targetType === "boolean") {
      converted = val === "true" || val === true || String(val).toLowerCase() === "true" || Number(val) === 1;
    } else if (targetType === "number") {
      const p = Number(val);
      converted = isNaN(p) ? 0 : p;
    } else if (targetType === "string") {
      converted = String(val);
    } else if (targetType === "array") {
      if (Array.isArray(val)) {
        converted = val;
      } else {
        converted = typeof val === "string" ? val.split(",").map(item => item.trim()).filter(Boolean) : [val];
      }
    }

    handleUpdateSetting(key, converted);
  };

  const handleAddCustomSetting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKey.trim()) {
      triggerToast("Setting key name cannot be left blank.", "error");
      return;
    }

    const key = customKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    
    if (settings[key] !== undefined) {
      triggerToast(`Setting key "${key}" already exists.`, "error");
      return;
    }

    let val: any = customVal.trim();
    if (customType === "boolean") {
      val = customVal.toLowerCase() === "true" || customVal === "1";
    } else if (customType === "number") {
      val = isNaN(Number(customVal)) ? 0 : Number(customVal);
    } else if (customType === "array") {
      val = customVal.split(",").map(s => s.trim()).filter(Boolean);
    }

    handleUpdateSetting(key, val);
    setCustomKey("");
    setCustomVal("");
  };

  const handleDeleteCustomSetting = (key: string) => {
    if (isReadOnly) {
      triggerToast("Permission denied.", "error");
      return;
    }

    const updated = { ...settings };
    delete updated[key];

    const success = syscall.saveSettings(updated);
    if (success) {
      setSettings(updated);
      triggerToast(`Removed custom register: ${key}`);
    } else {
      triggerToast("Failed to delete setting.", "error");
    }
  };

  const handleSignUpUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUname.trim() || !newFName.trim()) {
      triggerToast("Username and display name must be defined.", "error");
      return;
    }

    const success = syscall.addUser(
      newUname.trim().toLowerCase(),
      newPass,
      newRole,
      newFName.trim(),
      newAvatar
    );

    if (success) {
      triggerToast(`Account for '${newUname}' successfully registered.`);
      setNewUname("");
      setNewFName("");
      setNewPass("");
      reloadAll();
    } else {
      triggerToast("Failed to create user. Username may already exist or permissions are locked.", "error");
    }
  };

  const handlePurgeUser = (uname: string) => {
    if (isReadOnly) {
      triggerToast("Lacking root administrator capability to delete users.", "error");
      return;
    }

    const success = syscall.deleteUser(uname);
    if (success) {
      triggerToast(`User '${uname}' has been deleted.`);
      reloadAll();
    } else {
      triggerToast("Cannot delete user. System user rules protect default accounts.", "error");
    }
  };

  // Helper to determine the datatype string of any value
  const getDataType = (val: any): "string" | "boolean" | "number" | "array" => {
    if (Array.isArray(val)) return "array";
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "number") return "number";
    return "string";
  };

  // Build rows array combining predefined options and new/deleted ones
  const allKeys = Object.keys(settings);
  const predefinedKeys = PREDEFINED_SETTINGS.map(p => p.key);
  const customKeys = allKeys.filter(k => !predefinedKeys.includes(k));

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 select-text font-sans text-gray-800">
      {/* Upper Navigation Ribbon */}
      <div className="border-b border-gray-150 px-4 py-3 bg-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
          <h1 className="text-sm font-semibold text-gray-900 tracking-tight">System Configuration</h1>
          <span className="text-[10px] text-gray-400 font-mono">/etc/sysconfig.json</span>
        </div>
        
        <div className="flex items-center space-x-3 text-xs">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-200/60 p-0.5 rounded-md">
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              System Settings
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                activeTab === "users"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              User Accounts
            </button>
          </div>

          <div className="w-[1px] h-4 bg-gray-200" />

          {/* Sync Button */}
          <button
            onClick={reloadAll}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] text-gray-500 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors active:translate-y-px"
            title="Reload from File System"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Mode Warning Bar */}
      {isReadOnly && (
        <div className="bg-amber-50 border-b border-amber-100 text-amber-800 px-4 py-2 text-xs flex items-center justify-between shrink-0 leading-relaxed">
          <span>⚠️ <strong>View Only Mode:</strong> You are logged in as <strong>{currentUser}</strong>. Modify restrictions require tux or root admin clearance. Please log out to switch user accounts.</span>
        </div>
      )}

      {/* Floating Status Notification Toast */}
      {message && (
        <div className={`p-3 text-xs font-medium border-b flex items-center justify-between transition-all shrink-0 ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
            : "bg-rose-50 border-rose-100 text-rose-800"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-65 hover:opacity-100 text-sm">✕</button>
        </div>
      )}

      {/* Pane Canvas scroll */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === "settings" ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Table layout container */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10.5px] font-bold text-gray-400 uppercase border-b border-gray-100">
                    <th className="px-4 py-3 w-1/2">Setting Name & Description</th>
                    <th className="px-4 py-3 w-1/4">Value</th>
                    <th className="px-4 py-3 w-1/4">Data Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {/* Render standard settings */}
                  {PREDEFINED_SETTINGS.map((def) => {
                    const value = settings[def.key] !== undefined ? settings[def.key] : "";
                    const typeOfKey = getDataType(settings[def.key]);
                    return (
                      <tr key={def.key} className="hover:bg-gray-50/50 transition-colors">
                        {/* Name and description column */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900 text-xs">{def.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{def.description}</p>
                          <p className="text-[9px] font-mono text-gray-400 mt-1.5 font-medium select-all bg-gray-50 px-1 py-0.5 rounded inline-block">ID: {def.key}</p>
                        </td>

                        {/* Interactive edit value column */}
                        <td className="px-4 py-3.5">
                          {typeOfKey === "boolean" ? (
                            <input
                              type="checkbox"
                              checked={!!value}
                              onChange={(e) => handleUpdateSetting(def.key, e.target.checked)}
                              disabled={isReadOnly}
                              className="w-4 h-4 text-slate-900 border-gray-300 rounded focus:ring-slate-500 font-sans cursor-pointer disabled:opacity-40"
                            />
                          ) : typeOfKey === "number" ? (
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => handleUpdateSetting(def.key, Number(e.target.value))}
                              disabled={isReadOnly}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 font-mono text-gray-800 disabled:opacity-50 disabled:bg-gray-50"
                            />
                          ) : typeOfKey === "array" ? (
                            <input
                              type="text"
                              value={Array.isArray(value) ? value.join(", ") : String(value)}
                              onChange={(e) => {
                                const parts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                handleUpdateSetting(def.key, parts);
                              }}
                              disabled={isReadOnly}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 font-mono text-gray-800 disabled:opacity-50 disabled:bg-gray-50"
                              placeholder="comma, separated, list"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(value)}
                              onChange={(e) => handleUpdateSetting(def.key, e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-gray-800 disabled:opacity-50 disabled:bg-gray-50"
                            />
                          )}
                        </td>

                        {/* Data Type selectors column */}
                        <td className="px-4 py-3.5">
                          <select
                            value={typeOfKey}
                            onChange={(e) => handleTypeChange(def.key, e.target.value)}
                            disabled={isReadOnly}
                            className="bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-mono disabled:opacity-50 text-gray-700 w-full"
                          >
                            <option value="string">String</option>
                            <option value="boolean">Boolean</option>
                            <option value="number">Number</option>
                            <option value="array">Array</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Render custom dynamic extras */}
                  {customKeys.map((key) => {
                    const value = settings[key];
                    const typeOfKey = getDataType(value);
                    return (
                      <tr key={key} className="hover:bg-gray-50/50 transition-colors bg-slate-50/20">
                        {/* Custom setting name and delete option */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-1.5">
                            <p className="font-semibold text-gray-900 text-xs select-all">★ {key}</p>
                            {!isReadOnly && (
                              <button
                                onClick={() => handleDeleteCustomSetting(key)}
                                className="text-rose-500 hover:text-rose-700 p-0.5 rounded transition-all"
                                title="Remove parameter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 italic">User-defined custom variable mapping.</p>
                        </td>

                        {/* Custom value box */}
                        <td className="px-4 py-3.5">
                          {typeOfKey === "boolean" ? (
                            <input
                              type="checkbox"
                              checked={!!value}
                              onChange={(e) => handleUpdateSetting(key, e.target.checked)}
                              disabled={isReadOnly}
                              className="w-4 h-4 text-slate-900 border-gray-300 rounded focus:ring-slate-500 font-sans cursor-pointer disabled:opacity-40"
                            />
                          ) : typeOfKey === "number" ? (
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => handleUpdateSetting(key, Number(e.target.value))}
                              disabled={isReadOnly}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 font-mono text-gray-800 disabled:opacity-50"
                            />
                          ) : typeOfKey === "array" ? (
                            <input
                              type="text"
                              value={Array.isArray(value) ? value.join(", ") : String(value)}
                              onChange={(e) => {
                                const parts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                handleUpdateSetting(key, parts);
                              }}
                              disabled={isReadOnly}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 font-mono text-gray-800 disabled:opacity-50"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(value)}
                              onChange={(e) => handleUpdateSetting(key, e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 text-gray-800 disabled:opacity-50"
                            />
                          )}
                        </td>

                        {/* Custom data type */}
                        <td className="px-4 py-3.5">
                          <select
                            value={typeOfKey}
                            onChange={(e) => handleTypeChange(key, e.target.value)}
                            disabled={isReadOnly}
                            className="bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-mono disabled:opacity-50 text-gray-700 w-full"
                          >
                            <option value="string">String</option>
                            <option value="boolean">Boolean</option>
                            <option value="number">Number</option>
                            <option value="array">Array</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Custom register generator */}
            {!isReadOnly && (
              <form onSubmit={handleAddCustomSetting} className="bg-gray-50 border border-gray-150 p-4 rounded-lg flex flex-col md:flex-row items-end gap-3.5">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Variable Key</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. security_level_flag"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 text-gray-800 font-mono"
                  />
                </div>
                
                <div className="w-full md:w-36 shrink-0">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Casting Type</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 text-gray-700"
                  >
                    <option value="string">String</option>
                    <option value="boolean">Boolean</option>
                    <option value="number">Number</option>
                    <option value="array">Array</option>
                  </select>
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Initial Value</label>
                  <input
                    type="text"
                    required
                    placeholder={customType === "boolean" ? "true / false" : customType === "number" ? "e.g. 50" : "e.g. active"}
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-gray-400 text-gray-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-4 py-1.5 bg-gray-900 text-white font-semibold rounded hover:bg-gray-800 text-xs shrink-0 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>
              </form>
            )}

            {/* Test Panic Drill Block */}
            <div className="bg-red-50/50 border border-red-100 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-950 flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-red-500 animate-pulse animate-duration-1000" />
                  <span>Verify Crash Recovery System</span>
                </h4>
                <p className="text-[11px] text-red-850 leading-relaxed max-w-xl">Triggers an immediate simulated Unix kernel core dump sequence to test backup systems and boot-screen restoration integrity.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Proceed with emergency panic verification drill? This will safely force restart the simulated screen environment.")) {
                    syscall.triggerKernelPanic("Simulated processor hardware interruption. System panic test active.");
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs select-none transition-colors shadow-xs hover:shadow-sm"
              >
                Trigger Panic Drill
              </button>
            </div>
          </div>
        ) : (
          /* Simplified User Manager Component */
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center space-x-1.5 border-b border-gray-150 pb-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>Registered System Accounts</span>
              </h2>
              
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse divide-y divide-gray-150">
                  <thead className="bg-gray-50 font-bold text-gray-400 uppercase select-none text-[9.5px]">
                    <tr>
                      <th className="px-4 py-2.5">User Identity</th>
                      <th className="px-4 py-2.5">Role</th>
                      <th className="px-4 py-2.5">Password Status</th>
                      <th className="px-4 py-2.5 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-[11px] text-gray-700">
                    {userList.map((usr) => (
                      <tr key={usr.username} className="hover:bg-gray-50/40">
                        {/* Display & Login values */}
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-gray-900">{usr.fullName}</span>{" "}
                          <span className="text-gray-400 font-mono text-[10px]">({usr.username})</span>
                        </td>
                        {/* Access Role */}
                        <td className="px-4 py-2.5">
                          <span className={`px-1.5 py-0.5 font-bold uppercase rounded text-[9px] border inline-block ${
                            usr.role === "admin" 
                              ? "bg-slate-100 border-slate-200 text-slate-800" 
                              : "bg-gray-100 border-gray-200 text-gray-600"
                          }`}>{usr.role}</span>
                        </td>
                        {/* Password placeholder indicators safely */}
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-[10px]">
                          {usr.passwordHash ? "Validated (Encrypted)" : "No credential lock"}
                        </td>
                        {/* Terminate user capability */}
                        <td className="px-4 py-2.5 text-right">
                          {usr.username !== "root" && usr.username !== "tux" && usr.username !== "guest" ? (
                            <button
                              onClick={() => handlePurgeUser(usr.username)}
                              disabled={isReadOnly}
                              className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-50 disabled:opacity-30 transition-colors"
                              title={`Delete ${usr.username}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[9px] text-gray-300 font-mono font-bold select-none px-2 uppercase">PROT</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Account Registration Form */}
            {!isReadOnly ? (
              <form onSubmit={handleSignUpUser} className="bg-gray-50 border border-gray-150 p-4 rounded-lg space-y-4">
                <span className="font-semibold text-xs text-gray-900 flex items-center space-x-1.5">
                  <UserPlus className="w-4 h-4 text-gray-600" />
                  <span>Register System Account</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Username (lowercase)</label>
                    <input
                      type="text"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-gray-400 font-mono text-gray-800"
                      placeholder="e.g. developer_root"
                      value={newUname}
                      onChange={(e) => setNewUname(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full display name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-gray-400 text-gray-800"
                      placeholder="e.g. Alan Turing"
                      value={newFName}
                      onChange={(e) => setNewFName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sign-on Password</label>
                    <input
                      type="password"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-gray-400 font-mono text-gray-800"
                      placeholder="e.g. ultra-safeguard"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">System clearance role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-gray-400 text-gray-700"
                    >
                      <option value="user">User (Standard Access)</option>
                      <option value="admin">Admin (System clearance)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">User Icon</label>
                    <select
                      value={newAvatar}
                      onChange={(e) => setNewAvatar(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs outline-none focus:border-gray-400 text-gray-700"
                    >
                      <option value="user">Standard User Profile</option>
                      <option value="penguin">Linux mascot (Penguin)</option>
                      <option value="system">Core Service Settings Unit</option>
                    </select>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 border border-gray-900 text-white font-semibold rounded hover:bg-gray-850 text-xs transition-colors"
                  >
                    Register User
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-gray-400 font-medium text-center py-6 bg-gray-50 rounded border border-dashed border-gray-200 select-none">
                Registering accounts is blocked. Please login as tux or root account to unlock permissions.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
