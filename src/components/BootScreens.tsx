import React, { useState, useEffect, useRef } from "react";
import { Power, RefreshCcw, ShieldAlert, Cpu, HardDrive, KeyRound, Monitor, Info } from "lucide-react";

// ==========================================
// 1. DETAILED DMESG BOOT SCREEN
// ==========================================
interface DetailedBootScreenProps {
  logs: string[];
}

export function DetailedBootScreen({ logs }: DetailedBootScreenProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col justify-between font-mono p-6 text-xs text-gray-300 select-none">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b-2 border-[#ff4500] pb-2">
        <div className="flex items-center space-x-2.5">
          <Monitor className="w-5 h-5 text-[#00ff0a] animate-pulse" />
          <span className="font-bold tracking-wider text-white select-none text-[12px]">
            LILO Boot: loading trashlinux........................
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-gray-500 text-[10px]">
          <Cpu className="w-3.5 h-3.5" />
          <span>simdev: /dev/hda1</span>
        </div>
      </div>

      {/* Scrolling Log Stream */}
      <div className="flex-1 my-5 overflow-y-auto pr-2 space-y-1 font-mono text-[11px] leading-4 text-[#00ff0a]">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {log}
          </div>
        ))}
        {logs.length > 0 && (
          <div className="text-gray-400 animate-pulse font-bold flex items-center space-x-1">
            <span>▋</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-normal ml-1">Spawning background daemons...</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Centered Spinner HUD */}
      <div className="flex flex-col items-center justify-center space-y-2.5 p-3 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#d4d0c8] text-black">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-red-600 animate-ping" />
          <span className="w-2 h-2 bg-[#ff4500]" />
          <span className="w-2 h-2 bg-black" />
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest select-none">
          TRASH LINUX v0.04a [RELEASE STATUS: HEAVY METALS]
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1.5 RETRO DOUBLE-BEVEL DIALOG OUTLINES
// ==========================================
interface GnomeDialogProps {
  title: string;
  message: string;
  type: "error" | "info" | "success";
  onClose: () => void;
}

export function GnomeDialog({ title, message, type, onClose }: GnomeDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4 select-none animate-[fadeIn_0.1s_ease-out]">
      <div 
        id="trash_alert_dialog"
        className="w-full max-w-[370px] bg-[#d4d0c8] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col overflow-hidden text-[#111] font-mono"
      >
        <div className="bg-[#002080] text-white px-3 py-1.5 flex items-center justify-between font-bold text-[11px] select-none border-b border-white">
          <span className="flex items-center space-x-1 uppercase tracking-wider">
            {type === "error" ? "🛑" : type === "success" ? "⭐" : "💾"} {title}
          </span>
          <button 
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black border border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center text-[9px] font-black cursor-pointer active:border-t-[#808080] active:border-l-[#808080]"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex items-start space-x-4 bg-[#e4e0d8] border-b-2 border-[#808080]">
          <div className="pt-0.5 shrink-0">
            {type === "error" ? (
              <ShieldAlert className="w-8 h-8 text-[#ff4500]" />
            ) : (
              <Info className="w-8 h-8 text-[#002080]" />
            )}
          </div>
          <p className="text-[11px] leading-5 font-bold text-gray-900 select-text font-mono">
            {message}
          </p>
        </div>

        <div className="bg-[#d4d0c8] px-3 py-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1 border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#d4d0c8] text-black font-black uppercase text-[10px] active:border-t-[#808080] active:border-l-[#808080] select-none cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

interface GnomeDiagnosticsDialogProps {
  testResults: { name: string; passed: boolean; message: string }[];
  testsPassed: boolean;
  onReplay: () => void;
  onClose: () => void;
}

export function GnomeDiagnosticsDialog({ testResults, testsPassed, onReplay, onClose }: GnomeDiagnosticsDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9998] p-4 select-none animate-[fadeIn_0.1s_ease-out]">
      <div 
        id="trash_diag_window"
        className="w-full max-w-[420px] bg-[#d4d0c8] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col overflow-hidden text-black font-mono"
      >
        <div className="bg-[#002080] text-white px-3 py-1.5 flex items-center justify-between font-bold text-[11px] select-none border-b border-white">
          <span className="flex items-center space-x-1.5 uppercase tracking-wider">
            🔬 Security Unit Tests Diagnostics
          </span>
          <button 
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black border border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center text-[9px] font-black cursor-pointer active:border-t-[#808080] active:border-l-[#808080]"
          >
            ✕
          </button>
        </div>

        <div className="p-4 bg-[#e4e0d8] flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between border-b border-[#808080] pb-2">
            <span className="text-[10px] font-bold text-black uppercase">Dynamic Authentication Assertions</span>
            <span className={`px-2 py-0.5 font-bold text-[8px] border uppercase ${testsPassed ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}>
              {testsPassed ? "5/5 CERTIFIED" : "FAILURES DETECTED"}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {testResults.map((test, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-mono leading-5 border-b border-dashed border-[#808080]/30 pb-1">
                <span className="text-gray-800 font-bold">{test.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 text-[9px] truncate max-w-[155px]">{test.message}</span>
                  <span className={`font-black text-[9px] shrink-0 ${test.passed ? "text-emerald-800" : "text-red-700"}`}>
                    [{test.passed ? "PASS" : "FAIL"}]
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-[#555] leading-4">
            * These dynamic unit assertions sweep standard user log-in sessions, file-write constraints, role definitions, and sandbox containment locks.
          </p>
        </div>

        <div className="bg-[#d4d0c8] border-t-2 border-[#808080] p-3 flex justify-between gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="px-3 py-1 bg-[#d4d0c8] text-black text-[9.5px] font-bold border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] active:border-t-[#808080] active:border-l-[#808080] select-none cursor-pointer flex items-center space-x-1"
          >
            <span>🔄 Re-run Tests</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#002080] text-white font-black uppercase text-[10px] border-2 border-t-white border-l-white border-r-black border-b-black select-none cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}

interface GnomeInstructionsDialogProps {
  onClose: () => void;
}

export function GnomeInstructionsDialog({ onClose }: GnomeInstructionsDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9998] p-4 select-none animate-[fadeIn_0.1s_ease-out]">
      <div 
        id="trash_instructions_window"
        className="w-full max-w-[420px] bg-[#d4d0c8] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col overflow-hidden text-black font-mono"
      >
        <div className="bg-[#002080] text-white px-3 py-1.5 flex items-center justify-between font-bold text-[11px] border-b border-white select-none">
          <span className="flex items-center space-x-1.5 uppercase tracking-wider">
            💾 TrashLinux Password Guidelines
          </span>
          <button 
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black border border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center text-[9px] font-black cursor-pointer active:border-t-[#808080] active:border-l-[#808080]"
          >
            ✕
          </button>
        </div>

        <div className="p-4 bg-[#e4e0d8] flex-1 overflow-y-auto space-y-3 text-[11px]">
          <p className="font-bold border-b border-[#808080] pb-1">DEFAULT PRE-CONFIGURED ACCOUNTS:</p>
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono bg-white p-1.5 border border-[#808080] leading-4 text-xs">
              <span className="font-extrabold text-red-700">root (Sys Administrator)</span>
              <span>passwd: <code className="bg-gray-100 rounded px-1 font-bold">root</code></span>
            </div>
            <div className="flex justify-between font-mono bg-white p-1.5 border border-[#808080] leading-4 text-xs">
              <span className="font-semibold text-slate-800">tux (Linux operator)</span>
              <span>passwd: <code className="bg-gray-100 rounded px-1 font-bold">tux</code></span>
            </div>
            <div className="flex justify-between font-mono bg-[#dcfce7] p-1.5 border border-emerald-600/35 leading-4 text-xs">
              <span className="font-extrabold text-[#111]">guest (Bypass profile)</span>
              <span className="font-bold text-emerald-800">One-Click Login Bypass</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 bg-[#eeeeec] p-2 border border-gray-300 rounded-sm">
            💡 Sandbox safety guidelines: TrashLinux does not persist any external credential variables. If custom logins cause database conflicts, click "Hard Reset VFS" at the bottom to flush the workspace cleanly.
          </p>
        </div>

        <div className="bg-[#d4d0c8] border-t-2 border-[#808080] p-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#002080] text-white font-black uppercase text-[10px] border-2 border-t-white border-l-white border-r-black border-b-black select-none cursor-pointer"
          >
            Closed
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. TRASHLINUX DISPLAY MANAGER CLASSIC GDM
// ==========================================
interface GdmLoginScreenProps {
  onLogin: (u: string, p: string) => boolean;
  onReboot: () => void;
  getUsers: () => { username: string; fullName: string; role: string; avatar: string }[];
  testAuthentication?: () => { name: string; passed: boolean; message: string }[];
}

export function GdmLoginScreen({
  onLogin,
  onReboot,
  getUsers,
  testAuthentication,
}: GdmLoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [customUsername, setCustomUsername] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [password, setPassword] = useState("");
  const [userAccounts, setUserAccounts] = useState<any[]>([]);

  // Modal alert dialog states
  const [alertModal, setAlertModal] = useState<{ title: string; message: string; type: "error" | "info" | "success" } | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Automated core diagnostics status
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testsPassed, setTestsPassed] = useState<boolean>(true);

  useEffect(() => {
    try {
      const dbUsers = getUsers();
      if (dbUsers && dbUsers.length > 0) {
        setUserAccounts(dbUsers);
      } else {
        throw new Error("No database records discovered");
      }
    } catch {
      // Fallback initial structures
      setUserAccounts([
        { username: "guest", fullName: "Regular Guest Session", role: "user", avatar: "guest" },
        { username: "tux", fullName: "Tux Linux Operator", role: "admin", avatar: "penguin" },
        { username: "root", fullName: "Sys Administrator", role: "root", avatar: "system" }
      ]);
    }
  }, [getUsers]);

  useEffect(() => {
    if (testAuthentication) {
      try {
        const results = testAuthentication();
        setTestResults(results);
        setTestsPassed(results.length > 0 && results.every((r) => r.passed));
      } catch (e) {
        console.error("Failed to run dynamic kernel auth unit tests:", e);
      }
    }
  }, [testAuthentication]);

  const handleRunTestsManually = () => {
    if (testAuthentication) {
      try {
        const results = testAuthentication();
        setTestResults(results);
        setTestsPassed(results.length > 0 && results.every((r) => r.passed));
      } catch (e) {
        console.error("Test execution aborted:", e);
      }
    }
  };

  const triggerAlert = (title: string, message: string, type: "error" | "info" | "success" = "error") => {
    setAlertModal({ title, message, type });
  };

  const handleSelectUser = (user: any) => {
    if (user.username === "guest") {
      const ok = onLogin("guest", "");
      if (!ok) {
        triggerAlert("Session Fail", "Failed to establish guest session.");
      }
      return;
    }
    setSelectedUser(user);
    setShowOtherInput(false);
    setPassword("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let username = "";
    if (showOtherInput) {
      username = customUsername.trim().toLowerCase();
    } else if (selectedUser) {
      username = selectedUser.username;
    } else {
      triggerAlert("Selection Required", "Please choose a user session profile.");
      return;
    }

    if (!username) {
      triggerAlert("Validation Alert", "Please enter an account username.");
      return;
    }

    const ok = onLogin(username, password);
    if (!ok) {
      triggerAlert("Authentication Error", "Credentials mismatched relative to standard stored user scopes.");
    }
  };

  // Filter out any duplicating "guest" records in list loop
  const filteredUsers = userAccounts.filter(u => u.username !== "guest");

  return (
    <div 
      className="w-screen h-screen bg-[#1b1d1f] flex flex-col justify-between font-mono text-xs text-black p-4 select-none"
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.01) 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }}
    >
      
      {/* Dynamic Alerts Dialog overlays */}
      {alertModal && (
        <GnomeDialog
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          onClose={() => setAlertModal(null)}
        />
      )}

      {showDiagnostics && (
        <GnomeDiagnosticsDialog
          testResults={testResults}
          testsPassed={testsPassed}
          onReplay={handleRunTestsManually}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {showInstructions && (
        <GnomeInstructionsDialog
          onClose={() => setShowInstructions(false)}
        />
      )}

      {/* Top bar */}
      <div className="flex justify-between items-center text-gray-400 px-4 py-2 text-[10.5px] select-none font-bold border-b border-[#2d3235]">
        <span className="tracking-tight flex items-center space-x-1.5">
          <span>⚙️</span>
          <span>TLDM: TrashLinux Display Greeter v0.04a</span>
        </span>
        <div className="flex items-center space-x-3.5">
          <span>CONSOLE TTY1</span>
          <span className="bg-orange-800 px-2 py-0.5 text-white leading-3 rounded uppercase font-mono text-[9px] font-bold">STABLE</span>
        </div>
      </div>

      {/* Main card box - Compact, completely flat, double bevel boxes (Zero padding deformation!) */}
      <div className="self-center my-auto w-full max-w-[370px] bg-[#d4d0c8] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] p-4.5 flex flex-col relative">
        {/* Clay visual strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff4500]" />

        {/* Vintage Trash Logo */}
        <div className="text-center mb-4 mt-2 select-none flex flex-col justify-center items-center">
          <div className="text-4xl animate-bounce mb-1">
            🗑️
          </div>
          <h2 className="text-[17px] font-black tracking-widest text-[#111111] uppercase leading-5">trashlinux</h2>
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Dumpster Fire Sandbox Core (v0.04a)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* USER SELECTION PANEL */}
          {!selectedUser && !showOtherInput ? (
            <div className="space-y-1.5">
              <span className="block text-[9.5px] font-black uppercase tracking-wider px-0.5 text-[#ff4500]">SELECT USER SESSION:</span>
              <div className="max-h-[160px] overflow-y-auto space-y-1 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white p-1.5">
                
                {/* ONE-CLICK GUEST BYPASS ACTION */}
                <button
                  id="list_instant_guest_bypass"
                  type="button"
                  onClick={() => {
                    const ok = onLogin("guest", "");
                    if (!ok) {
                      triggerAlert("Session Fail", "Failed to establish guest session.");
                    }
                  }}
                  className="w-full flex items-center justify-between p-1.5 mb-1.5 bg-[#dcfce7] border border-emerald-500 rounded-none cursor-pointer hover:bg-[#bbf7d0] transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">⚡</span>
                    <div className="text-left">
                      <p className="font-extrabold text-emerald-950 text-[10.5px] leading-3">Quick Guest Login</p>
                      <p className="text-[8.5px] text-emerald-800 font-mono leading-3">No password required</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black px-1 py-[1px] bg-emerald-700 text-white uppercase">bypass</span>
                </button>

                {/* USER ACCOUNTS */}
                {filteredUsers.map((user) => (
                  <button
                    key={user.username}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center justify-between p-1.5 rounded-none cursor-pointer hover:bg-[#bab4ac] border border-transparent hover:border-[#808080] transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {user.avatar === "penguin" ? "🐧" : user.avatar === "system" ? "⚙️" : "👤"}
                      </span>
                      <div className="text-left">
                        <p className="font-bold text-gray-950 text-[10.5px] leading-3">{user.fullName}</p>
                        <p className="text-[8.5px] text-gray-500 font-mono leading-3">uname: {user.username}</p>
                      </div>
                    </div>
                    <span className="text-[8.2px] font-bold px-1 bg-gray-300 text-gray-700 uppercase border border-gray-400">{user.role}</span>
                  </button>
                ))}

                {/* OTHER MANUALLY TYPE TRIGGER */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOtherInput(true);
                    setSelectedUser(null);
                    setCustomUsername("");
                    setPassword("");
                  }}
                  className="w-full text-center py-1.5 bg-[#b8b4ac] hover:bg-[#9c9a94] text-black font-extrabold block border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-[9.5px] rounded-none uppercase tracking-wider mt-2.5 active:border-t-[#808080] active:border-l-[#808080] cursor-pointer"
                >
                  Other Console Account...
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {/* Chosen profile strip */}
              <div className="flex items-center justify-between bg-[#e4e0d8] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">👤</span>
                  <div>
                    <span className="font-extrabold block text-gray-900 text-[10.5px]">
                      {showOtherInput ? "Other Console Session" : selectedUser?.fullName}
                    </span>
                    <span className="text-[8.5px] text-gray-500 font-mono leading-3 block">
                      username: {showOtherInput ? customUsername || "none" : selectedUser?.username}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setShowOtherInput(false);
                    setPassword("");
                  }}
                  className="text-[8.5px] text-red-900 border border-[#808080] hover:bg-red-100 rounded-none px-1.5 py-0.5 font-bold"
                >
                  [Exit]
                </button>
              </div>

              {showOtherInput && (
                <div>
                  <label htmlFor="custom_uname" className="block text-[9px] font-bold uppercase mb-0.5 text-gray-700">ACCOUNT USERNAME:</label>
                  <input
                    id="custom_uname"
                    type="text"
                    className="w-full px-2 py-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white font-mono text-[#111] outline-none text-xs"
                    placeholder="lowercase username"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label htmlFor="passwd_input" className="block text-[9px] font-bold uppercase mb-0.5 text-gray-700">ACCOUNT PASSWORD:</label>
                <div className="relative">
                  <input
                    id="passwd_input"
                    type="password"
                    className="w-full px-2 py-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white font-mono text-[#111] outline-none"
                    placeholder="blank or same as username"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus={!showOtherInput}
                  />
                  <KeyRound className="absolute right-2.5 top-1.5 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-[#002080] text-white border-2 border-t-white border-l-white border-r-black border-b-black font-black hover:bg-[#00175c] text-xs uppercase cursor-pointer"
              >
                UNMOCK SESSION AND BOOT WEBOS
              </button>
            </div>
          )}

          {/* Compact bottom grid helper buttons */}
          <div className="pt-2 border-t border-dashed border-[#808080] flex items-center justify-between text-[10px] gap-2">
            <button
              type="button"
              onClick={() => setShowDiagnostics(true)}
              className="flex-1 text-center bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] font-bold py-1 text-[9px] uppercase cursor-pointer active:border-t-[#808080] active:border-l-[#808080]"
            >
              🔬 Diagnostics ({testsPassed ? "Ok" : "Fail"})
            </button>
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="flex-1 text-center bg-[#d4d0c8] text-black border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] font-bold py-1 text-[9px] uppercase cursor-pointer active:border-t-[#808080] active:border-l-[#808080]"
            >
              ℹ️ Logins Guide
            </button>
          </div>

        </form>
      </div>

      {/* Footer bar */}
      <div className="bg-[#2d3235] text-gray-300 text-[10px] font-bold p-2 px-5 flex justify-between items-center select-none shadow">
        <div className="flex space-x-4">
          <button
            onClick={() => {
              if (confirm("Disconnect and turn off virtualization?")) {
                window.close();
              }
            }}
            className="flex items-center space-x-1 hover:text-white transition-colors cursor-pointer"
          >
            <Power className="w-3 h-3 text-red-500" />
            <span>Power Off</span>
          </button>
          <button
            onClick={onReboot}
            className="flex items-center space-x-1 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3 h-3 text-green-500" />
            <span>Restart Hardware</span>
          </button>
          <button
            onClick={() => {
              if (confirm("CRITICAL WARNING: This will immediately purge IndexedDB, resetting all custom VFS files, hostname updates, password edits, and configuration details. Proceed?")) {
                try {
                  indexedDB.deleteDatabase("Linux2006WebOS_DB");
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                } catch (err: any) {
                  alert("Failed to purge DB: " + err.message);
                }
              }
            }}
            className="flex items-center space-x-1.5 text-amber-300 hover:text-white transition-colors border border-amber-800/40 px-1.5 py-0.5 h-5 bg-amber-950/10 cursor-pointer"
            title="Wipe IndexedDB database and reboot standard configuration"
          >
            <span>🗑️ Clean VFS DB</span>
          </button>
        </div>
        <span className="text-gray-500 text-[9px]">TrashLinux Host VFS Simulator v0.04a</span>
      </div>
    </div>
  );
}


// ==========================================
// 3. KERNEL PANIC SCREEN (CRITICAL DISASTER RECOVERY)
// ==========================================
interface KernelPanicScreenProps {
  reason: string;
  onReboot: () => void;
}

export function KernelPanicScreen({ reason, onReboot }: KernelPanicScreenProps) {
  // Blinking lock keyboard lights simulation state
  const [ledState, setLedState] = useState(true);

  useEffect(() => {
    const int = setInterval(() => {
      setLedState((prev) => !prev);
    }, 500);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center font-mono p-8 text-xs text-gray-300 select-all select-none">
      
      {/* Flashing Lock LED indicator simulation */}
      <div className="absolute top-4 right-6 flex items-center space-x-3 text-gray-500 font-mono text-[10px] select-none">
        <span>Flashing Keyboard Hardware LEDs:</span>
        <div className="flex space-x-2">
          <span className="flex flex-col items-center">
            <span className={`w-2.5 h-2.5 rounded-full border border-gray-700 ${ledState ? "bg-[#33ff33]" : "bg-emerald-950"}`} />
            <span className="text-[8px] mt-0.5 text-gray-600">CAPS</span>
          </span>
          <span className="flex flex-col items-center">
            <span className={`w-2.5 h-2.5 rounded-full border border-gray-700 ${!ledState ? "bg-[#33ff33]" : "bg-emerald-950"}`} />
            <span className="text-[8px] mt-0.5 text-gray-600">SCROLL</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-black border-[3px] border-red-600 p-6 shadow-2xl relative text-left">
        {/* Clay warning line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />

        <div className="flex items-center space-x-3 text-red-500 border-b border-gray-900 pb-3 mb-4 select-none">
          <ShieldAlert className="w-8 h-8 animate-bounce text-red-600" />
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase">*** KERNEL PANIC: CORE THREAD EXCEPTION ***</h1>
            <p className="text-[9px] text-gray-400 font-normal mt-0.5">Core CPU Exception 0xEF (Kernel Halted - Fatal memory block leak).</p>
          </div>
        </div>

        {/* Reason */}
        <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded-none mb-4 selection:bg-red-800 selection:text-white">
          <span className="font-bold text-[10px] block uppercase text-red-500 mb-0.5 select-none font-mono">Panic Description:</span>
          <p className="font-mono text-[11px] font-bold leading-5">{reason || "Unknown system failure exception."}</p>
        </div>

        {/* Trace logs */}
        <p className="text-gray-400 mb-2 font-bold select-none text-[10px] uppercase">Unix Trace Dump Registry logs (VFS audit dump):</p>
        <div className="bg-[#111] p-3 rounded-none font-mono text-[9px] text-[#00ff0a] leading-4 select-all shadow-inner border border-gray-900 overflow-x-auto">
          <div>[   0.901552] Call Trace:</div>
          <div>[   0.901590]   [&lt;c0103de0&gt;] show_stack+0xa0/0xb0</div>
          <div>[   0.901614]   [&lt;c0105cc5&gt;] panic+0x125/0x240</div>
          <div>[   0.901642]   [&lt;c0147cb2&gt;] systemBackgroundProcessD_exit+0x72/0x80</div>
          <div>[   0.901691]   [&lt;c010c71c&gt;] sys_kill+0xac/0x150</div>
          <div>[   0.901712]   [&lt;c0102b35&gt;] syscall_call+0x7/0xb</div>
          <div>[   0.901750] Code: 89 d0 e8 e3 a1 fc ff eb 9d 8d b6 00 00 00 00 89 f6 8d bc</div>
          <div>[   0.901799] &lt;0&gt;Rebooting in 180 seconds ... (hardware safety timer active)</div>
        </div>

        {/* Actions Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-900 pt-4 gap-4">
          <p className="text-[10px] text-gray-500 max-w-sm leading-4 select-none">
            An irreparable memory isolation breach or manual panic drill command was signaled. The filesystem has been safely unmounted. Click below to bypass delay and force a cold hardware loop reboot.
          </p>
          
          <button
            onClick={onReboot}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-none shadow-lg text-xs transition-colors select-none flex items-center justify-center space-x-2 animate-pulse cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Power Reset Loop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
