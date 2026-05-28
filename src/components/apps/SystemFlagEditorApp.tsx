import React, { useState, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";
import { Save, ToggleLeft, Activity, Info, AlertTriangle, Play, Pause, RefreshCw, Plus, Trash2 } from "lucide-react";

interface SystemFlagEditorAppProps {
  syscall: SystemCallInterface;
}

export default function SystemFlagEditorApp({ syscall }: SystemFlagEditorAppProps) {
  const [config, setConfig] = useState<any>({});
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newType, setNewType] = useState<"boolean" | "string" | "number">("boolean");
  
  // Style theme state for application skin customization
  const [styleTheme, setStyleTheme] = useState<"kde" | "cyber" | "hacker" | "platinum">("kde");
  
  // Daemon simulator state
  const [daemonActive, setDaemonActive] = useState(true);
  const [daemonLog, setDaemonLog] = useState<string[]>([]);
  const [scanInterval, setScanInterval] = useState(3000); // 3 seconds

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const loadConfig = () => {
    try {
      const settings = syscall.getSettings();
      setConfig(settings || {});
      setErrorMsg("");
    } catch (e: any) {
      setErrorMsg(`Failed to query kernel registers: ${e.message}`);
    }
  };

  useEffect(() => {
    loadConfig();
    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] [systemFlagEditorUFD] Daemon initialized on thread PID: ${Math.floor(Math.random() * 80) + 100}`,
      `[${new Date().toLocaleTimeString()}] [systemFlagEditorUFD] Loading active kernel parameters...`,
      `[${new Date().toLocaleTimeString()}] [systemFlagEditorUFD] Active verification policy in standby.`,
    ];
    setDaemonLog(initialLogs);
  }, []);

  // Daemon Heartbeat Check simulator
  useEffect(() => {
    if (!daemonActive) return;

    const interval = setInterval(() => {
      try {
        const liveSettings = syscall.getSettings();
        const randFlagKeys = Object.keys(liveSettings);
        const randKey = randFlagKeys[Math.floor(Math.random() * randFlagKeys.length)];
        const randVal = liveSettings[randKey];

        setDaemonLog((prev) => [
          `[${new Date().toLocaleTimeString()}] [UFD_DAEMON_CHECK] OK: Flag count=${randFlagKeys.length} | Audit checked: [${randKey}] = ${JSON.stringify(randVal)}`,
          ...prev.slice(0, 30),
        ]);
      } catch (e: any) {
        setDaemonLog((prev) => [
          `[${new Date().toLocaleTimeString()}] [UFD_DAEMON_ERROR] Kernel connection failed: ${e.message}`,
          ...prev.slice(0, 30),
        ]);
      }
    }, scanInterval);

    return () => clearInterval(interval);
  }, [daemonActive, scanInterval]);

  const saveConfig = (updated: any) => {
    const ok = syscall.saveSettings(updated);
    if (ok) {
      setConfig(updated);
      if (syscall.openDialog) {
        syscall.openDialog("Kernel Synchronized", "Kernel registers updated successfully!", "info");
      } else {
        setInfoMsg("Kernel registers updated successfully!");
        setTimeout(() => setInfoMsg(""), 3500);
      }
      setDaemonLog((prev) => [
        `[${new Date().toLocaleTimeString()}] [UFD_DAEMON_ALERT] USER MODIFIED KERNEL CONFIGS. Re-synced and verified registry.`,
        ...prev,
      ]);
      setErrorMsg("");
    } else {
      const err = "Write rejected by kernel. Admin/Root clearance required.";
      if (syscall.openDialog) {
        syscall.openDialog("Permission Denied", err, "error");
      } else {
        setErrorMsg(err);
        setTimeout(() => setErrorMsg(""), 4500);
      }
    }
  };

  const handleToggle = (key: string) => {
    const updated = {
      ...config,
      [key]: !config[key],
    };
    saveConfig(updated);
  };

  const handleValChange = (key: string, val: any) => {
    const updated = {
      ...config,
      [key]: val,
    };
    saveConfig(updated);
  };

  const handleAddFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) {
      const err = "Flag name cannot be empty.";
      if (syscall.openDialog) {
        syscall.openDialog("Field Required", err, "warning");
      } else {
        setErrorMsg(err);
      }
      return;
    }
    const sanitizedKey = newKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    
    let parsedVal: any = newVal;
    if (newType === "boolean") {
      parsedVal = newVal.toLowerCase() === "true" || newVal === "1" || newVal.toLowerCase() === "yes";
    } else if (newType === "number") {
      parsedVal = isNaN(Number(newVal)) ? 0 : Number(newVal);
    }

    const updated = {
      ...config,
      [sanitizedKey]: parsedVal,
    };
    
    saveConfig(updated);
    setNewKey("");
    setNewVal("");
  };

  const handleDeleteFlag = (key: string) => {
    if (["hostname", "networking_enabled", "system_sound"].includes(key)) {
      const err = `Cannot remove fundamental system anchor register: ${key}`;
      if (syscall.openDialog) {
        syscall.openDialog("Protected Register", err, "error");
      } else {
        setErrorMsg(err);
      }
      return;
    }
    
    if (syscall.openDialog) {
      syscall.openDialog(
        "Confirm Register Exclusion",
        `Are you sure you want to permanently erase the kernel flag register '${key}'?`,
        "question",
        ["Yes", "No"],
        (res) => {
          if (res === "Yes") {
            const updated = { ...config };
            delete updated[key];
            saveConfig(updated);
          }
        }
      );
    } else {
      const updated = { ...config };
      delete updated[key];
      saveConfig(updated);
    }
  };

  // Dynamic CSS styling rules based on the chosen workspace styles
  const isKde = styleTheme === "kde";
  const isCyber = styleTheme === "cyber";
  const isHacker = styleTheme === "hacker";
  const isPlatinum = styleTheme === "platinum";

  const mainBgClass = isKde 
    ? "bg-[#d4d0c8] text-black font-sans" 
    : isCyber 
    ? "bg-[#140220] text-[#00ffcc] font-mono border-2 border-[#f107a3]" 
    : isHacker 
    ? "bg-black text-green-500 font-mono border border-green-500" 
    : "bg-[#e5e5e5] text-gray-900 font-sans";

  const headerClass = isKde
    ? "bg-gradient-to-r from-[#0055d4] via-[#3381cc] to-[#0055d4] text-white border-b-2 border-white"
    : isCyber
    ? "bg-[#f107a3] text-black border-b-2 border-[#00ffcc]"
    : isHacker
    ? "bg-[#0c0c0c] text-[#33ff33] border-b border-green-500"
    : "bg-gradient-to-b from-[#b8b8b8] to-[#9c9c9c] text-black border-b border-gray-400";

  const panelClass = isKde
    ? "bg-[#ede9e2] border-2 border-r-white border-b-white border-t-[#808080] border-l-[#808080]"
    : isCyber
    ? "bg-[#250d32] border-2 border-[#f107a3]"
    : isHacker
    ? "bg-[#050505] border border-green-900"
    : "bg-[#f4f4f4] border-2 border-r-white border-b-white border-t-gray-400 border-l-gray-400";

  const listContainerClass = isKde
    ? "bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white"
    : isCyber
    ? "bg-[#180722] border border-[#00ffcc]/40"
    : isHacker
    ? "bg-black border border-green-900"
    : "bg-white border border-t-gray-400 border-l-gray-400 border-r-white border-b-white";

  const itemBgClass = isKde
    ? "bg-[#f5f3ef] border-b border-[#bab3a8] hover:bg-[#e8e4db]"
    : isCyber
    ? "bg-[#200a2b] border-b border-[#f107a3]/30 hover:bg-[#341144] text-[#00ffcc]"
    : isHacker
    ? "bg-black border-b border-green-900 hover:bg-[#070707] text-green-400"
    : "bg-[#fafafa] border-b border-gray-300 hover:bg-gray-100";

  const buttonClass = isKde
    ? "bg-[#d4d0c8] text-black border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#c0c0c0]"
    : isCyber
    ? "bg-[#f107a3] text-black border border-[#00ffcc] hover:bg-[#d8058f]"
    : isHacker
    ? "bg-black text-green-500 border border-green-500 hover:bg-green-950"
    : "bg-[#e5e5e5] text-black border border-t-white border-l-white border-r-gray-400 border-b-gray-400 hover:bg-gray-200";

  const textContrastColor = isKde 
    ? "text-[#103070]" 
    : isCyber 
    ? "text-[#00ffcc]" 
    : isHacker 
    ? "text-green-500" 
    : "text-gray-800";

  const textMutedColor = isKde
    ? "text-gray-600"
    : isCyber
    ? "text-[#f107a3]/80"
    : isHacker
    ? "text-green-700 font-mono font-bold"
    : "text-gray-500";

  return (
    <div className={`p-0 w-full h-full flex flex-col min-h-0 select-none text-xs ${mainBgClass}`}>
      
      {/* Dynamic Styled Header */}
      <div className={`p-2 flex items-center justify-between select-none ${headerClass}`}>
        <div className="flex items-center space-x-2">
          <Activity className="w-4.5 h-4.5" />
          <span className="font-extrabold tracking-wider font-mono text-[11px] uppercase">
            systemFlagEditorUFD :: Core System Kernel Flag daemon Registry
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`w-2.5 h-2.5 rounded-full ${daemonActive ? "bg-green-400 animate-pulse" : "bg-red-400"} border border-black`} />
          <span className="text-[9.5px] font-mono tracking-widest font-bold uppercase">{daemonActive ? "daem_active" : "daem_paused"}</span>
        </div>
      </div>

      {/* Main split work layout */}
      <div className="flex-1 flex min-h-0 p-1.5 gap-1.5">
        
        {/* Left Side: System flags list editor */}
        <div className={`flex-1 p-2 flex flex-col min-h-0 ${panelClass}`}>
          <div className="flex items-center justify-between border-b pb-1.5 mb-2 border-[#808080]">
            <span className={`font-bold flex items-center space-x-1 ${textContrastColor}`}>
              <span>🎚️ Active Registry Flags</span>
              <span className={`text-[9px] font-mono font-bold uppercase`}>(/etc/sysconfig.json)</span>
            </span>
            <button
              onClick={loadConfig}
              className={`p-1 text-xs font-mono font-bold hover:opacity-90 active:translate-y-px flex items-center space-x-1 ${buttonClass}`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Force Reload</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-2 mb-2 bg-[#ffe4e1] border-2 border-red-700 text-red-900 font-bold font-mono text-[10px] uppercase flex items-center space-x-1.5 shadow-sm">
              <AlertTriangle className="w-4.5 h-4.5 text-red-700 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-2 mb-2 bg-[#e2f0d9] border-2 border-green-700 text-green-900 font-bold font-mono text-[10px] uppercase flex items-center space-x-1.5 shadow-sm">
              <Info className="w-4.5 h-4.5 text-green-700 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* List scrollarea */}
          <div className={`flex-1 overflow-y-auto p-1 space-y-1 ${listContainerClass}`}>
            {Object.keys(config).map((key) => {
              const val = config[key];
              const isBool = typeof val === "boolean";
              const isFundamental = ["hostname", "networking_enabled", "system_sound"].includes(key);

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-1.5 transition-colors gap-2 text-[11px] ${itemBgClass}`}
                >
                  <div className="flex flex-col truncate">
                    <span className="font-mono font-bold tracking-tight">{key}</span>
                    <span className={`text-[9px] font-bold font-mono uppercase ${textMutedColor}`}>
                      Type: {typeof val} {isFundamental && "● system_protected"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 text-black">
                    {isBool ? (
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() => handleToggle(key)}
                        className="w-4.5 h-4.5 cursor-pointer accent-[#0040a0]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleValChange(key, e.target.value)}
                        className="px-1.5 py-0.5 w-28 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white text-[10.5px] font-mono text-gray-700"
                      />
                    )}

                    <button
                      disabled={isFundamental}
                      onClick={() => handleDeleteFlag(key)}
                      className="p-1 hover:bg-red-100 rounded text-red-700 disabled:opacity-20"
                      title="Purge parameter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick seed inputs form */}
          <form
            onSubmit={handleAddFlag}
            className="mt-2 p-2 border-t-2 border-[#b2aba2] flex flex-col gap-1.5"
          >
            <span className={`font-bold text-[10.5px] flex items-center space-x-1 ${textContrastColor}`}>
              <Plus className="w-3.5 h-3.5" />
              <span>Append Custom Flag Attribute</span>
            </span>
            <div className="grid grid-cols-3 gap-1">
              <input
                type="text"
                placeholder="key_name (e.g. log_level)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="px-1.5 py-1 bg-white text-black border border-t-[#808080] border-l-[#808080] text-[10.5px] font-mono"
              />
              <input
                type="text"
                placeholder="value (e.g. true, 12, warn)"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                className="px-1.5 py-1 bg-white text-black border border-t-[#808080] border-l-[#808080] text-[10.5px] font-mono"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="bg-[#d4d0c8] text-black border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-[10px] font-bold"
              >
                <option value="boolean">Boolean</option>
                <option value="string">String</option>
                <option value="number">Number</option>
              </select>
            </div>
            <button
              type="submit"
              className={`py-1 text-white font-bold uppercase text-[10px] w-full ${buttonClass}`}
            >
              Add Flag to VFS config
            </button>
          </form>
        </div>

        {/* Right Side: Daemon controller and activity ticker */}
        <div className={`w-56 p-2 flex flex-col min-h-0 ${panelClass}`}>
          <span className={`font-bold border-b pb-1.5 mb-2 flex items-center space-x-1.5 border-[#808080] ${textContrastColor}`}>
            <Activity className="w-3.5 h-3.5" />
            <span>UFD Daemon State Control</span>
          </span>

          <div className="bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-2 text-center flex flex-col items-center space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Daemon Service Status</span>
            <span className={`px-2 py-0.5 font-mono text-[11px] font-extrabold uppercase border-2 ${
              daemonActive ? "bg-green-100 text-green-800 border-green-700" : "bg-red-100 text-red-800 border-red-700"
            }`}>
              {daemonActive ? "● ACTIVE & LISTENING" : "■ STOPPED"}
            </span>

            <div className="flex gap-1.5 w-full mt-2">
              <button
                onClick={() => setDaemonActive(true)}
                disabled={daemonActive}
                className="flex-1 py-1 bg-[#d4d0c8] text-black hover:bg-[#c0c0c0] font-bold border border-t-white border-l-white border-r-[#808080] border-b-[#808080] disabled:opacity-40 flex items-center justify-center space-x-1"
              >
                <Play className="w-3 h-3 text-green-700" />
                <span>Start</span>
              </button>
              <button
                onClick={() => setDaemonActive(false)}
                disabled={!daemonActive}
                className="flex-1 py-1 bg-[#d4d0c8] text-black hover:bg-[#c0c0c0] font-bold border border-t-white border-l-white border-r-[#808080] border-b-[#808080] disabled:opacity-40 flex items-center justify-center space-x-1"
              >
                <Pause className="w-3 h-3 text-red-700" />
                <span>Pause</span>
              </button>
            </div>
          </div>

          {/* Trigger Frequency Setting */}
          <div className="mt-2 bg-[#e8e3da] text-black p-2 border border-[#b2aba2] space-y-1">
            <label htmlFor="scan_rate" className="block text-[9.5px] font-bold text-gray-600 uppercase">Daemon Sweep Interval</label>
            <select
              id="scan_rate"
              value={scanInterval}
              onChange={(e) => setScanInterval(Number(e.target.value))}
              className="w-full bg-white border border-t-[#808080] border-l-[#808080] text-[10px] p-0.5"
            >
              <option value={1000}>1 Second (Intense audit)</option>
              <option value={3000}>3 Seconds (Relaxed audit)</option>
              <option value={5000}>5 Seconds (Idle sweep)</option>
              <option value={10000}>10 Seconds (Power-save mode)</option>
            </select>
          </div>

          {/* Flag Manager Theme Customization */}
          <div className="mt-2 text-xs border border-[#b2aba2] bg-[#e8e3da] text-black p-1.5 space-y-1">
            <span className="block text-[9px] font-bold text-gray-600 uppercase">Style Windows Presets</span>
            <div className="grid grid-cols-2 gap-1 font-sans">
              <button
                type="button"
                onClick={() => setStyleTheme("kde")}
                className={`py-0.5 text-[9px] font-bold border rounded-sm transition-colors ${
                  styleTheme === "kde" ? "bg-[#3465a4] text-white border-[#204a87]" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                KDE Bevel
              </button>
              <button
                type="button"
                onClick={() => setStyleTheme("cyber")}
                className={`py-0.5 text-[9px] font-bold border rounded-sm transition-colors ${
                  styleTheme === "cyber" ? "bg-[#f107a3] text-white border-[#f107a3]" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Neon Neon
              </button>
              <button
                type="button"
                onClick={() => setStyleTheme("hacker")}
                className={`py-0.5 text-[9px] font-bold border rounded-sm transition-colors ${
                  styleTheme === "hacker" ? "bg-green-700 text-white border-green-900" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Hacker Mono
              </button>
              <button
                type="button"
                onClick={() => setStyleTheme("platinum")}
                className={`py-0.5 text-[9px] font-bold border rounded-sm transition-colors ${
                  styleTheme === "platinum" ? "bg-gray-600 text-white border-gray-700" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Platinum
              </button>
            </div>
          </div>

          <span className={`mt-2.5 font-bold text-[9.5px] uppercase tracking-wide ${textContrastColor}`}>Heartbeat Event Log</span>
          
          {/* Terminal logger */}
          <div className="flex-1 mt-1 font-mono text-[9px] text-[#85ea85] bg-black p-1.5 overflow-y-auto leading-4 select-text border-2 border-r-white border-b-white border-t-gray-800 border-l-gray-800">
            {daemonLog.map((log, index) => (
              <div key={index} className="truncate" title={log}>{log}</div>
            ))}
            {daemonLog.length === 0 && <span className="text-gray-500 italic">Listening for heartbeat...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}