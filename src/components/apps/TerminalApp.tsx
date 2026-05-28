import React, { useState, useRef, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";

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
