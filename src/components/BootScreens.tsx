import React, { useState, useEffect, useRef } from "react";
import { Power, RefreshCcw, ShieldAlert, Cpu, HardDrive, KeyRound, Monitor, Info } from "lucide-react";

// ==========================================
// 1. DETAILED DMESG BOOT SCREEN
// ==========================================
interface DetailedBootScreenProps {
  logs: string[];
  bootLoaderPhase?: "loader" | "booting" | "none";
  availableKernels?: { id: string; name: string; entry: string; version: string }[];
  selectedKernelId?: string;
  onSelectKernel?: (id: string) => void;
}

export function DetailedBootScreen({
  logs,
  bootLoaderPhase = "booting",
  availableKernels = [],
  selectedKernelId = "secure",
  onSelectKernel,
}: DetailedBootScreenProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(5);
  const [activeSelection, setActiveSelection] = useState<string>("secure");

  useEffect(() => {
    setActiveSelection(selectedKernelId);
  }, [selectedKernelId]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (bootLoaderPhase !== "loader") return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSelectKernel?.(activeSelection || "secure");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bootLoaderPhase, activeSelection, onSelectKernel]);

  useEffect(() => {
    if (bootLoaderPhase !== "loader") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") {
        setActiveSelection("secure");
      } else if (e.key === "2") {
        setActiveSelection("xsi");
      } else if (e.key === "3") {
        setActiveSelection("fob");
      } else if (e.key === "Enter") {
        onSelectKernel?.(activeSelection);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bootLoaderPhase, activeSelection, onSelectKernel]);

  if (bootLoaderPhase === "loader") {
    return (
      <div className="w-screen h-screen bg-black flex flex-col justify-between font-mono p-10 text-white select-none">
        <div className="max-w-3xl w-full mx-auto space-y-8 flex-1 flex flex-col justify-center">
          {/* Header */}
          <div className="space-y-2 border-b border-gray-800 pb-4">
            <div className="flex items-center space-x-3 text-red-500 animate-pulse">
              <Cpu className="w-6 h-6" />
              <h1 className="text-sm font-black tracking-widest uppercase">
                ★ FOB BOOT LOADER (v1.2-SANDBOX) ★
              </h1>
            </div>
            <p className="text-[10px] text-gray-500 leading-4">
              AMI INTEL-80386 CPU VIRTUAL BIOS SHIELD // MEMORY STATUS: OK // HDD: /dev/hda1
            </p>
          </div>

          {/* Menu */}
          <div className="space-y-4">
            <p className="text-xs text-gray-400 font-bold">
              Please select a kernel to execute (Press keys [1-3] or Click):
            </p>

            <div className="border border-gray-800 bg-zinc-950 p-4 space-y-2">
              {availableKernels.map((kernel, index) => {
                const isSelected = activeSelection === kernel.id;
                return (
                  <button
                    key={kernel.id}
                    type="button"
                    onClick={() => {
                      setActiveSelection(kernel.id);
                      onSelectKernel?.(kernel.id);
                    }}
                    className={`w-full text-left p-3 flex items-center justify-between text-xs font-mono transition-all border ${
                      isSelected
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-gray-400 border-transparent hover:border-gray-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold">[{index + 1}]</span>
                      <span className="font-bold tracking-wide">{kernel.name}</span>
                    </div>
                    <div className="text-[10px] font-mono opacity-80">
                      entry: {kernel.entry} // v{kernel.version}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          <div className="text-center space-y-2 bg-zinc-900/40 p-4 border border-zinc-900">
            <p className="text-xs text-red-400 animate-pulse font-extrabold uppercase">
              ⏳ Automatic boot of standard target in {countdown} seconds...
            </p>
            <p className="text-[10px] text-gray-500">
              Press [1-3] or click an alternative kernel image to interrupt. Press [ENTER] to boot selected.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-600 tracking-wider">
          FOB MULTI-KERNEL REFLECTION RUNTIME LAYER // XSI ISOLATED CHASSIS
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col justify-between font-mono p-6 text-xs text-white select-none">
      {/* Top Banner */}
      <div className="flex justify-between items-center border-b-2 border-[#ff4500] pb-2">
        <div className="flex items-center space-x-2.5">
          <Monitor className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="font-bold tracking-wider text-white select-none text-[12px]">
            {activeSelection === "xsi" 
              ? "XSI Boot: Loading Advanced IPC Isolation Kernels..." 
              : activeSelection === "fob" 
              ? "FOB Boot: Spawning Lightweight Core Minimal Container..." 
              : "LILO Boot: loading trashlinux........................"}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-gray-500 text-[10px]">
          <Cpu className="w-3.5 h-3.5" />
          <span>simdev: /dev/hda1 [FLAVOR: {activeSelection.toUpperCase()}]</span>
        </div>
      </div>

      {/* Scrolling Log Stream */}
      <div className="flex-1 my-5 overflow-y-auto pr-2 space-y-1 font-mono text-[11px] leading-4 text-white">
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
          TRASH LINUX v0.04a [BOOT FLAVOR: {activeSelection.toUpperCase()}]
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
  const [ledState, setLedState] = useState(true);

  useEffect(() => {
    const int = setInterval(() => {
      setLedState((prev) => !prev);
    }, 400);
    return () => clearInterval(int);
  }, []);

  // Parse the reason and stack trace
  let primaryReason = reason || "Unknown critical kernel boundary fault.";
  let stackTrace = "";

  if (reason && reason.includes("STACK_TRACE:")) {
    const parts = reason.split("STACK_TRACE:");
    primaryReason = parts[0].trim();
    stackTrace = parts[1].trim();
  }

  // If stackTrace wasn't supplied, output a simulated but beautiful stack trace
  if (!stackTrace) {
    stackTrace = `Error: System integrity violation at SecureKernel.init
    at initializeSyscallParameter (secureKernel.ts:634:11)
    at Object.getSyscallToken (secureKernel.ts:664:14)
    at Desktop.tsx:288:42
    at launchApp (useWebOS.tsx:472:25)
    at HTMLButtonElement.onClick (Desktop.tsx:478:29)
    at invokeReactEventHandler (react-dom.production.min.js:23:441)
    at dispatchEvent (react-dom.production.min.js:23:1003)`;
  }

  // Generate simulated register values
  const registerDump = `EAX: 0x00FF8C1E  EBX: 0xFF900D8C  ECX: 0x0000003F  EDX: 0x002B4F6D
ESI: 0x004A92E1  EDI: 0x005E21FA  EBP: 0xFFEF901B  ESP: 0xFFEF9000
CS: 0x0008  DS: 0x0010  SS: 0x0010  ES: 0x0010  FS: 0x0033  GS: 0x003B
CR0: 0x80050033  CR2: 0x00103E4A  CR3: 0x00201000  EFLAGS: 0x00010246`;

  return (
    <div className="w-screen h-screen bg-[#800000] text-[#f7f7f7] font-mono p-6 md:p-12 flex flex-col justify-between select-text overflow-y-auto selection:bg-red-600 selection:text-white z-[9999] absolute inset-0">
      
      {/* LED indicators simulated overlay */}
      <div className="flex items-center justify-between border-b-2 border-red-500/50 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-8 h-8 text-white animate-bounce shrink-0" />
          <div>
            <h1 className="text-sm md:text-md font-black tracking-widest text-white uppercase">
              TRASHLINUX FATAL EXCEPTION OCCURRED
            </h1>
            <p className="text-[10px] text-red-200 mt-0.5 uppercase tracking-wider font-extrabold">
              SYSTEM INTEGRITY EXCEPTION // EXCEPTION CODE: 0xDEADBEEF
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-red-300 text-[10px]">
          <span>HARDWARE KEYBOARD LEDS:</span>
          <div className="flex space-x-3 bg-red-950/40 p-1.5 border border-red-800">
            <span className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full border border-red-700 ${ledState ? "bg-emerald-400" : "bg-zinc-950"}`} />
              <span className="text-[9px] font-bold">CAPS</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full border border-red-700 ${!ledState ? "bg-emerald-400" : "bg-zinc-950"}`} />
              <span className="text-[9px] font-bold">SCROLL</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <div>
          <p className="text-[11px] md:text-[12px] leading-relaxed text-red-100 max-w-4xl font-sans">
            A fatal instruction was executed or a corrupt virtual memory state was encountered inside the secure Ring 0 kernel context line. 
            Execution has been suspended to prevent page corruption, loss of user VFS files, or unauthorized system state alterations.
          </p>
        </div>

        {/* Diagnostic parameters display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Main Error */}
          <div className="bg-red-950/40 border border-red-600 p-4 flex flex-col justify-between">
            <div>
              <span className="font-extrabold text-[10px] uppercase text-red-300 block mb-1">
                Primary Panic Description:
              </span>
              <p className="text-[11px] md:text-[12px] font-black text-white leading-relaxed whitespace-pre-line">
                {primaryReason}
              </p>
            </div>
            <div className="text-[9px] text-red-300 border-t border-red-700/60 pt-3 mt-4">
              FAULTING MODULE: secureKernel.ts // SYSTEM_CALL_CONDUIT: [int 0x80]
            </div>
          </div>

          {/* Processor details */}
          <div className="bg-red-950/40 border border-red-600 p-4 font-mono text-[9.5px] leading-relaxed">
            <span className="font-extrabold text-[10px] uppercase text-red-300 block mb-1">
              Active Virtual Registers Dump:
            </span>
            <pre className="whitespace-pre-wrap text-emerald-300 selection:bg-emerald-800 selection:text-white">
              {registerDump}
            </pre>
          </div>
        </div>

        {/* Backtrace details */}
        <div>
          <span className="font-extrabold text-[10.5px] uppercase text-red-300 block mb-1.5">
            Active Exception Call Backtrace (D3-DUMP):
          </span>
          <div className="bg-[#1e0000] border-2 border-red-600 p-4 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
            <pre className="text-white text-[9px] sm:text-[10px] whitespace-pre-wrap select-text font-mono selection:bg-red-800">
              {stackTrace}
            </pre>
          </div>
        </div>

        {/* Mitigation procedures */}
        <div className="bg-red-950/20 p-4 border border-red-800/40 text-[10.5px] leading-relaxed text-red-100 font-sans">
          <p className="font-bold font-mono text-red-300 uppercase mb-1.5">Standard Recovery Procedures:</p>
          <ul className="list-decimal pl-5 space-y-1">
            <li>Check file permissions within <span className="font-bold underline">/etc/sysconfig.json</span> and recover lost parameters.</li>
            <li>Maintain memory allocation buffers using the <span className="font-bold">App Registry Manager</span> or clear leak vectors.</li>
            <li>In case of recurring panics, use the terminal <span className="font-bold font-mono">panic</span> trigger parameters to analyze syscall boundaries.</li>
          </ul>
        </div>
      </div>

      {/* Shutdown action controls */}
      <div className="border-t-2 border-red-500/50 pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[9px] text-red-300 max-w-xl leading-relaxed text-center sm:text-left select-none font-sans uppercase font-bold">
          If this is the first time you are seeing this layout screen, press the reboot trigger button. 
          The local volume storage (VFS) cache is stored securely in memory and committed on graceful restarts.
        </p>

        <button
          onClick={onReboot}
          className="w-full sm:w-auto px-6 py-3 bg-white text-red-800 font-black hover:bg-red-100 transition-colors uppercase border-2 border-transparent hover:border-red-600 flex items-center justify-center space-x-2 animate-pulse cursor-pointer shadow-lg"
        >
          <Power className="w-4 h-4 text-red-800 animate-spin" />
          <span>Cold System Reboot</span>
        </button>
      </div>
    </div>
  );
}
