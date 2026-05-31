import React, { useState, useRef, useEffect } from "react";
import { SystemCallInterface, NodeType } from "../../types/os";

interface TerminalAppProps {
  syscall: SystemCallInterface;
  initialCwd: string;
  onCwdChange: (path: string) => void;
  executeCommand: (line: string) => string[];
}

export default function TerminalApp({
  syscall,
  initialCwd,
  onCwdChange,
  executeCommand,
}: TerminalAppProps) {
  const [history, setHistory] = useState<{ text: string; type: "input" | "output" }[]>([
    { text: "Linux ubuntu-dapper-2006 2.6.15-26-386-WebKernel GNU/Linux", type: "output" },
    { text: "Loading web terminal capsule shell...", type: "output" },
    { text: "Type 'help' to show all available CLI utilities.", type: "output" },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cwd, setCwd] = useState(initialCwd);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [nanoFilename, setNanoFilename] = useState<string | null>(null);
  const [nanoContent, setNanoContent] = useState("");

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const cfg = syscall.getSettings();
      const currentUser = syscall.getCurrentUser();
      // If user is guest and policy prohibits terminal access
      if (currentUser === "guest" && cfg.allow_guest_terminal === false) {
        setIsAccessDenied(true);
      } else {
        setIsAccessDenied(false);
      }
    } catch {
      setIsAccessDenied(false);
    }
  }, []);

  useEffect(() => {
    if (!isAccessDenied) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isAccessDenied]);

  const focusInput = () => {
    terminalInputRef.current?.focus();
  };

  useEffect(() => {
    if (!isAccessDenied) {
      focusInput();
    }
  }, [isAccessDenied]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const line = inputVal.trim();
    if (!line) return;

    const newHistory = [...history, { text: `${getPrompt()}${inputVal}`, type: "input" as const }];

    // Catch special terminal clear
    if (line.toLowerCase() === "clear") {
      setHistory([]);
      setInputVal("");
      setCmdHistory((prev) => [line, ...prev]);
      setHistoryIdx(-1);
      return;
    }

    // Execute dynamic bash emulation
    const result = executeCommand(line);

    if (result.length > 0 && result[0].startsWith("[NANO_MODE_ACTIVATE] ")) {
      const filename = result[0].substring("[NANO_MODE_ACTIVATE] ".length);
      setNanoFilename(filename);
      const val = syscall.readFile(filename);
      setNanoContent(val.startsWith("Error:") ? "" : val);
      setInputVal("");
      setCmdHistory((prev) => [line, ...prev]);
      setHistoryIdx(-1);
      return;
    }

    // If cd commanded, catch updated current working directory
    const parts = line.split(/\s+/);
    if (parts[0]?.toLowerCase() === "cd") {
      const pathArg = parts[1] || `/home/${syscall.getCurrentUser()}`;
      let resolved = pathArg;
      if (!pathArg.startsWith("/")) {
        resolved = cwd === "/" ? `/${pathArg}` : `${cwd}/${pathArg}`;
      }
      if (pathArg === "..") {
        const segs = cwd.split("/").filter(Boolean);
        resolved = segs.length <= 1 ? "/" : "/" + segs.slice(0, segs.length - 1).join("/");
      } else if (pathArg === ".") {
        resolved = cwd;
      }
      
      // Let standard shell execution validate node existence
      const targetDir = resolved === "/" ? "/" : resolved;
      // We will read if cd was successful (if result doesn't have "cd: No such directory")
      const failed = result.some((r) => r.includes("cd:"));
      if (!failed) {
        setCwd(targetDir);
        onCwdChange(targetDir);
      }
    }

    setHistory([...newHistory, ...result.map((lineStr) => ({ text: lineStr, type: "output" as const }))]);
    setInputVal("");
    setCmdHistory((prev) => [line, ...prev]);
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx < cmdHistory.length) {
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = historyIdx - 1;
      if (nextIdx >= 0) {
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      } else {
        setHistoryIdx(-1);
        setInputVal("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = inputVal.split(/\s+/);
      if (parts.length === 1) {
        const prefix = parts[0]?.toLowerCase() || "";
        const availableCmds = ["help", "ls", "cd", "pwd", "cat", "touch", "mkdir", "rm", "panic", "neofetch", "fortune", "cowsay", "ps", "kill", "systemctl", "syslog", "clear", "reboot", "whoami", "echo", "grep", "nano", "sudo"];
        const matches = availableCmds.filter(c => c.startsWith(prefix));
        if (matches.length === 1) {
          setInputVal(matches[0] + " ");
        } else if (matches.length > 1) {
          setHistory(prev => [
            ...prev,
            { text: `${getPrompt()}${inputVal}`, type: "input" },
            { text: matches.join("   "), type: "output" }
          ]);
        }
      } else {
        const prefix = parts[parts.length - 1] || "";
        let directory = ".";
        let filePrefix = prefix;

        if (prefix.includes("/")) {
          const lastSlash = prefix.lastIndexOf("/");
          directory = prefix.substring(0, lastSlash) || "/";
          filePrefix = prefix.substring(lastSlash + 1);
        }

        const resolvedDir = directory.startsWith("/") ? directory : (cwd === "/" ? `/${directory}` : `${cwd}/${directory}`);
        try {
          const list = syscall.listDir(resolvedDir);
          const matches = list.filter(item => item.name.toLowerCase().startsWith(filePrefix.toLowerCase()));
          if (matches.length === 1) {
            const completedName = matches[0].name + (matches[0].type === NodeType.DIRECTORY ? "/" : "");
            const beforePrefix = prefix.includes("/") ? prefix.substring(0, prefix.lastIndexOf("/") + 1) : "";
            parts[parts.length - 1] = beforePrefix + completedName;
            setInputVal(parts.join(" "));
          } else if (matches.length > 1) {
            setHistory(prev => [
              ...prev,
              { text: `${getPrompt()}${inputVal}`, type: "input" },
              { text: matches.map(m => m.name).join("   "), type: "output" }
            ]);
          }
        } catch {
          // ignore directory list errors
        }
      }
    }
  };

  const getPrompt = () => {
    const user = syscall.getCurrentUser();
    const homePrefix = `/home/${user}`;
    const displayPath = cwd.startsWith(homePrefix)
      ? cwd.replace(homePrefix, "~")
      : cwd;
    const isRoot = user === "root";
    return `${user}@ubuntu-dapper-2006:${displayPath}${isRoot ? "#" : "$"} `;
  };

  if (nanoFilename !== null) {
    const handleNanoSave = () => {
      const success = syscall.writeFile(nanoFilename, nanoContent);
      if (success) {
        setHistory(prev => [...prev, { text: `[nano] Wrote file: ${nanoFilename}`, type: "output" }]);
      } else {
        setHistory(prev => [...prev, { text: `[nano] Error: Permission denied writing file`, type: "output" }]);
      }
    };

    const handleNanoExit = () => {
      setNanoFilename(null);
      setNanoContent("");
    };

    return (
      <div 
        className="flex-1 bg-black text-[#eeeeec] font-mono text-xs flex flex-col h-full select-text" 
        id="terminal_nano_editor" 
        style={{ minHeight: "250px" }}
      >
        <div className="bg-[#555753] text-[#eeeeec] px-2 py-0.5 flex items-center justify-between font-bold text-[10px] select-none border-b border-[#2e3436]">
          <span>📝 UW-NANO v2006</span>
          <span className="truncate max-w-[200px]">File: {nanoFilename}</span>
          <span className="text-emerald-400">Lines: {nanoContent.split("\n").length}</span>
        </div>

        <div className="flex-1 p-2 bg-[#2e3436]/40">
          <textarea
            value={nanoContent}
            onChange={(e) => setNanoContent(e.target.value)}
            className="w-full h-full bg-transparent text-[#ffffff] font-mono text-xs leading-5 border-none outline-none resize-none focus:ring-0 p-0 caret-[#eeeeec]"
            placeholder="Type content... Use shortcuts below or click Buttons to manage"
            autoFocus
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "o") {
                e.preventDefault();
                handleNanoSave();
              } else if (e.ctrlKey && e.key === "x") {
                e.preventDefault();
                handleNanoExit();
              }
            }}
          />
        </div>

        <div className="bg-[#2e3436] text-[#eeeeec] p-2 flex flex-wrap items-center justify-between gap-1 select-none border-t border-[#1a1b1c]">
          <span className="text-[9.5px] text-yellow-500 font-semibold font-mono">
            Ctrl+O: Save  |  Ctrl+X: Exit (Keyboard shortcuts)
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleNanoSave}
              className="px-2.5 py-0.5 bg-[#4d4d4d] border border-t-[#bababa] border-l-[#bababa] border-r-black border-b-black hover:bg-[#5a5a5a] active:translate-y-px text-[9.5px] text-white font-bold font-mono"
            >
              WriteOut (Ctrl+O)
            </button>
            <button
              onClick={handleNanoExit}
              className="px-2.5 py-0.5 bg-[#4d4d4d] border border-t-[#bababa] border-l-[#bababa] border-r-black border-b-black hover:bg-[#5a5a5a] active:translate-y-px text-[9.5px] text-white font-bold font-mono"
            >
              Exit (Ctrl+X)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="flex-1 bg-[#1a1b1c] text-[#ef2929] font-mono text-xs p-5 flex flex-col items-center justify-center space-y-3.5 select-none">
        <span className="text-4xl animate-pulse">🔒</span>
        <span className="font-extrabold text-[#eeeeec] text-sm uppercase tracking-wider">Access privileges violation</span>
        <p className="text-gray-400 text-center max-w-xs leading-5">
          System policy <code className="text-orange-400">/etc/sysconfig.json</code> prohibits console UNIX bash shell executions for Guest accounts. Request upgrade permissions.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 bg-[#2e3436]/95 text-[#eeeeec] font-mono text-xs p-3 overflow-y-auto flex flex-col select-text"
      onClick={focusInput}
      id="terminal_container"
      style={{ minHeight: "250px" }}
    >
      <div className="flex-1 space-y-1">
        {history.map((record, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap leading-5 ${
              record.type === "input" ? "text-white font-bold" : "text-[#eeeeec]/90"
            }`}
          >
            {record.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center mt-2.5">
        <span className="text-[#8ae234] font-bold whitespace-nowrap mr-1 select-none">
          {getPrompt()}
        </span>
        <input
          ref={terminalInputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-[#ffffff] font-mono font-medium focus:ring-0 p-0 caret-[#eeeeec]"
          autoFocus
          maxLength={128}
          autoCapitalize="none"
          autoComplete="off"
        />
      </form>
    </div>
  );
}
