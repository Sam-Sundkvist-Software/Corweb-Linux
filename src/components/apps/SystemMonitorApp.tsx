import React, { useState, useEffect } from "react";
import { SystemCallInterface, DaemonService, Process } from "../../types/os";
import { Cpu, List, CpuIcon, RefreshCw, Layers, Plus, Pause, Play, Trash2 } from "lucide-react";

interface SystemMonitorAppProps {
  syscall: SystemCallInterface;
}

export default function SystemMonitorApp({ syscall }: SystemMonitorAppProps) {
  const [activeTab, setActiveTab] = useState<"system" | "processes" | "services">("system");
  const [procs, setProcs] = useState<Process[]>([]);
  const [services, setServices] = useState<DaemonService[]>([]);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(30).fill(5));
  const [memPercent, setMemPercent] = useState<number>(12);
  const [selectedService, setSelectedService] = useState<DaemonService | null>(null);

  // Spawner form states
  const [showSpawner, setShowSpawner] = useState(false);
  const [spawnName, setSpawnName] = useState("mining_daemon");
  const [spawnOwner, setSpawnOwner] = useState("tux");
  const [spawnMemory, setSpawnMemory] = useState(4096);
  const [spawnCpu, setSpawnCpu] = useState(15);
  const [spawnIsService, setSpawnIsService] = useState(false);

  const fetchStats = () => {
    // Collect active PID processes list
    const pList = syscall.getProcesses() as Process[];
    setProcs(pList);

    // Collect daemon status values
    const sList = syscall.getServices();
    setServices(sList);

    if (selectedService) {
      const match = sList.find((s) => s.name === selectedService.name);
      if (match) setSelectedService(match);
    }

    // Compute average CPU usage across active processes (suspended ones count as 0)
    const totalCpu = pList.reduce((acc, p) => acc + (p.state === "SUSPENDED" ? 0 : (p.cpuUsage || 0)), 0) + 1;
    const clampedCpu = Math.max(1, Math.min(100, totalCpu));

    setCpuHistory((prev) => {
      const next = [...prev.slice(1), clampedCpu];
      return next;
    });

    // Compute total memory percentage
    const totalMem = pList.reduce((acc, p) => acc + (p.memoryUsage || 1024), 0);
    const mockLimit = 256 * 1024; // 256MB RAM in TrashLinux!
    const calcPercent = Math.min(99, Math.max(5, Math.floor((totalMem / mockLimit) * 100)));
    setMemPercent(calcPercent);
  };

  // Retro fragile HTML-string interpolation logic
  const renderFragileDiagnosticsHTML = () => {
    const curCpu = cpuHistory[cpuHistory.length - 1] || 0;
    const loadStatus = curCpu > 70 ? "🔥 CONGESTED" : curCpu > 40 ? "⚠️ MODERATE" : "✅ NOMINAL";
    const statusColor = curCpu > 70 ? "#b91c1c" : curCpu > 40 ? "#b45309" : "#15803d";
    return `
      <div class="system-specs-box space-y-1 bg-[#ede9e2] border border-[#a8a49c] p-2.5 rounded-sm shadow-[inset_1px_1px_0_#ffffff]">
        <span class="font-bold text-slate-800 border-b border-[#bab3a8] pb-1 block uppercase" style="font-size: 10px; font-family: sans-serif;">⚡ SYSTEM RESOURCE COMPILER</span>
        <div class="space-y-1.5 mt-2 text-[10px]" style="font-family: monospace; line-height: 1.4;">
          <div><b style="color: #4b5563;">KERNEL STATE:</b> <span style="font-weight: bold; color: ${statusColor};">${loadStatus} (${curCpu}% load)</span></div>
          <div><b style="color: #4b5563;">VIRTUAL SWAP RAM:</b> <span>${memPercent}% utilization</span></div>
          <div><b style="color: #4b5563;">ALLOCATED THREADS:</b> <span>${procs.length} active tasks</span></div>
          <div><b style="color: #4b5563;">KERNEL TICK RATE:</b> <span>${Date.now()} ms</span></div>
        </div>
      </div>
      
      <div class="system-specs-box space-y-1 bg-[#ede9e2] border border-[#a8a49c] p-2.5 rounded-sm shadow-[inset_1px_1px_0_#ffffff]">
        <span class="font-bold text-slate-800 border-b border-[#bab3a8] pb-1 block uppercase" style="font-size: 10px; font-family: sans-serif;">📋 DAEMON CONFIG MATRIX</span>
        <div class="space-y-1.5 mt-2 text-[10px]" style="font-family: monospace; line-height: 1.4;">
          <div><b style="color: #4b5563;">ACTIVE DEV UNITS:</b> <span>${services.filter(s => s.status === "active").length} services</span></div>
          <div><b style="color: #4b5563;">SECTOR SWAP CACHE:</b> <span>INDEXED_DB [MAPPED]</span></div>
          <div><b style="color: #4b5563;">TELEMETRY REFRESH:</b> <span>${new Date().toLocaleTimeString()}</span></div>
          <div><b style="color: #4b5563;">COMPILER PIPELINE:</b> <span style="color: #1d4ed8; text-decoration: underline;">SILVER_GLAZE_V4</span></div>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 1500);
    return () => clearInterval(interval);
  }, [syscall, selectedService]);

  const handleKill = (pid: number) => {
    const ok = syscall.killProcess(pid);
    if (ok) {
      syscall.syslog(`SIGKILL submitted successfully to thread PID: ${pid}`);
      fetchStats();
    }
  };

  const handleSuspend = (pid: number) => {
    if (syscall.suspendProcess) {
      syscall.suspendProcess(pid);
      fetchStats();
    }
  };

  const handleResume = (pid: number) => {
    if (syscall.resumeProcess) {
      syscall.resumeProcess(pid);
      fetchStats();
    }
  };

  const handleSpawn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spawnName.trim()) return;
    if (syscall.spawnCustomProcess) {
      syscall.spawnCustomProcess(spawnName, spawnOwner, spawnMemory, spawnCpu, spawnIsService);
      setShowSpawner(false);
      fetchStats();
    }
  };

  const handleServiceControl = (name: string, action: "start" | "stop" | "restart") => {
    syscall.controlService(name, action);
    fetchStats();
  };

  // SVG Chart rendering settings
  const width = 450;
  const height = 110;

  return (
    <div className="flex-1 bg-[#d4d0c8] flex flex-col min-h-0 select-none text-xs text-[#111111] font-mono p-1">
      
      {/* Visual Navigation Tabs (Classic Windows 98 / Steel Bevel style) */}
      <div className="flex items-end px-1 pt-1.5 space-x-1 border-b border-[#808080] pb-[1px]">
        <button
          onClick={() => setActiveTab("system")}
          className={`px-3 py-1 text-[11px] font-bold border-t border-l border-r border-t-white border-l-white select-none transition-all cursor-pointer ${
            activeTab === "system"
              ? "bg-[#d4d0c8] border-r-[#808080] border-b-[2px] border-b-[#d4d0c8] -mb-[2px] pb-[6px] z-10"
              : "bg-[#b8b4ac] border-r-[#808080] border-b-[#808080] pb-[4px] hover:bg-[#c4c0b8] text-[#555]"
          }`}
        >
          <span className="flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-slate-800" />
            <span>SYS_LOAD</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab("processes")}
          className={`px-3 py-1 text-[11px] font-bold border-t border-l border-r border-t-white border-l-white select-none transition-all cursor-pointer ${
            activeTab === "processes"
              ? "bg-[#d4d0c8] border-r-[#808080] border-b-[2px] border-b-[#d4d0c8] -mb-[2px] pb-[6px] z-10"
              : "bg-[#b8b4ac] border-r-[#808080] border-b-[#808080] pb-[4px] hover:bg-[#c4c0b8] text-[#555]"
          }`}
        >
          <span className="flex items-center space-x-1">
            <List className="w-3.5 h-3.5 text-slate-800" />
            <span>PROCESS_TABLE</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`px-3 py-1 text-[11px] font-bold border-t border-l border-r border-t-white border-l-white select-none transition-all cursor-pointer ${
            activeTab === "services"
              ? "bg-[#d4d0c8] border-r-[#808080] border-b-[2px] border-b-[#d4d0c8] -mb-[2px] pb-[6px] z-10"
              : "bg-[#b8b4ac] border-r-[#808080] border-b-[#808080] pb-[4px] hover:bg-[#c4c0b8] text-[#555]"
          }`}
        >
          <span className="flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-slate-800" />
            <span>DAEMONS_LIST</span>
          </span>
        </button>
      </div>

      {/* Main Content Area (Inward retro block) */}
      <div className="flex-1 min-h-0 bg-[#d4d0c8] p-3 flex flex-col overflow-y-auto">
        
        {activeTab === "system" && (
          <div className="space-y-4">
            {/* CPU utilization grid plotting graph */}
            <div className="bg-black border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-2 flex flex-col">
              <span className="text-[11px] font-mono font-bold text-[#ec1c24] mb-1.5 flex items-center space-x-1.5">
                <CpuIcon className="w-3.5 h-3.5 animate-pulse" />
                <span>CPU UTILIZATION PLOT (SMP 1x CORE)</span>
              </span>

              {/* Vector grid plot rendering */}
              <div className="relative w-full overflow-hidden self-center bg-[#0d0f11]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
                  {/* Grid Lines */}
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={(height / 4) * i}
                        x2={width}
                        y2={(height / 4) * i}
                        stroke="#22272e"
                        strokeDasharray="2 2"
                      />
                    ))}
                  {Array(15)
                    .fill(0)
                    .map((_, i) => (
                      <line
                        key={i}
                        x1={(width / 15) * i}
                        y1="0"
                        x2={(width / 15) * i}
                        y2={height}
                        stroke="#22272e"
                        strokeDasharray="2 2"
                      />
                    ))}

                  {/* Gradient area beneath green path chart */}
                  <path
                    d={`M 0 ${height} ${cpuHistory
                      .map((val, idx) => {
                        const x = (width / (cpuHistory.length - 1)) * idx;
                        const y = height - (val / 100) * height;
                        return `L ${x} ${y}`;
                      })
                      .join(" ")} L ${width} ${height} Z`}
                    fill="rgba(0, 255, 10, 0.05)"
                  />

                  {/* Graph Line */}
                  <path
                    d={cpuHistory
                      .map((val, idx) => {
                        const x = (width / (cpuHistory.length - 1)) * idx;
                        const y = height - (val / 100) * height;
                        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#00ff0a"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-1 px-1">
                <span>Core Avg: {cpuHistory[cpuHistory.length - 1]}% Load</span>
                <span>System status: STABLE (0x00)</span>
              </div>
            </div>

            {/* RAM Progress Indicator */}
            <div className="border border-white border-b-[#808080] border-r-[#808080] p-2 bg-[#d4d0c8]">
              <div className="flex justify-between font-bold text-[#111] text-[10px] mb-1">
                <span>SYSTEM RAM CONGESTION</span>
                <span>
                  {Math.floor((memPercent / 100) * 256)} MB / 256 MB (MAX)
                </span>
              </div>
              <div className="w-full bg-[#9c9a94] h-5 overflow-hidden border border-t-[#808080] border-l-[#808080] border-r-white border-b-white relative p-[1px]">
                <div
                  className="bg-[#002080] h-full"
                  style={{ width: `${memPercent}%` }}
                />
                <span className="absolute inset-x-0 inset-y-0 text-[10px] font-black font-mono text-center text-white flex items-center justify-center mix-blend-difference">
                  {memPercent}% PHYS_RAM ALLOC
                </span>
              </div>
            </div>

            {/* General environment system statistics details info rendered through raw fragile interpolated HTML */}
            <div 
              className="grid grid-cols-2 gap-2 text-[10px]"
              dangerouslySetInnerHTML={{ __html: renderFragileDiagnosticsHTML() }}
            />
          </div>
        )}

        {activeTab === "processes" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-[#808080] pb-2">
              <span className="font-bold text-[11px] text-slate-800 uppercase tracking-tight">Active Process Table</span>
              <button
                onClick={() => setShowSpawner(!showSpawner)}
                className={`px-3 py-1 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] font-bold text-[10px] uppercase cursor-pointer select-none active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white bg-[#d4d0c8] flex items-center space-x-1 ${showSpawner ? "bg-[#b8b4ac]" : ""}`}
              >
                <Plus className="w-3 h-3" />
                <span>[ SP_PROCS_CREATOR ]</span>
              </button>
            </div>

            {/* SPAWNER DRAWER FORM */}
            {showSpawner && (
              <form onSubmit={handleSpawn} className="border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#ece9e0] p-3 text-[10px] space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-[#808080] pb-1">
                  <span className="font-bold text-slate-800 font-mono text-[10.5px]">🔧 SPAWN NEW KERNEL PROCESS</span>
                  <button 
                    type="button" 
                    onClick={() => setShowSpawner(false)}
                    className="font-black hover:text-red-700 uppercase"
                  >
                    [Close]
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">BINARY COMM:</label>
                    <input 
                      type="text" 
                      className="w-full px-1.5 py-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white outline-none font-bold text-[#111]"
                      value={spawnName}
                      onChange={(e) => setSpawnName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">OWNER SECURITY ID:</label>
                    <select 
                      className="w-full px-1 py-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white outline-none font-bold"
                      value={spawnOwner}
                      onChange={(e) => setSpawnOwner(e.target.value)}
                    >
                      <option value="root">root</option>
                      <option value="tux">tux</option>
                      <option value="guest">guest</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">RAM QUOTA (KB):</label>
                    <input 
                      type="number" 
                      className="w-full px-1 py-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white outline-none"
                      value={spawnMemory}
                      onChange={(e) => setSpawnMemory(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">AVG_CPU quota %:</label>
                    <input 
                      type="number" 
                      className="w-full px-1 py-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white outline-none"
                      value={spawnCpu}
                      onChange={(e) => setSpawnCpu(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">EXECUTION SCOPE:</label>
                    <div className="flex items-center space-x-1 mt-1">
                      <input 
                        type="checkbox" 
                        id="exec_is_service"
                        className="cursor-pointer"
                        checked={spawnIsService}
                        onChange={(e) => setSpawnIsService(e.target.checked)}
                      />
                      <label htmlFor="exec_is_service" className="cursor-pointer font-bold uppercase">Background</label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] font-black uppercase tracking-wider text-center cursor-pointer active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white bg-[#002080] text-white hover:bg-[#00175c]"
                >
                  LOAD INTO KERNEL TASK QUEUE [SIGBOOT]
                </button>
              </form>
            )}

            {/* PROCESSES TABLE GRID */}
            <div className="flex-1 flex flex-col min-h-0 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-[10.5px]">
                  <thead>
                    <tr className="bg-[#b8b4ac] border-b border-[#808080] text-[#111] font-bold">
                      <th className="py-2 px-2.5 font-bold">PID</th>
                      <th className="py-2 px-2.5 font-bold">OWNER</th>
                      <th className="py-2 px-2.5 font-bold">BIN COMMAND</th>
                      <th className="py-2 px-2.5 font-bold">STATE</th>
                      <th className="py-2 px-2.5 text-right font-bold">MEMORY</th>
                      <th className="py-2 px-2.5 text-right font-bold">CPU %</th>
                      <th className="py-2 px-2.5 text-center font-bold">SYS_SIGNALS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {procs.map((p) => (
                      <tr
                        key={p.pid}
                        className="hover:bg-slate-100 leading-4"
                      >
                        <td className="py-2 px-2.5 font-mono text-gray-500 font-bold">{p.pid}</td>
                        <td className="py-2 px-2.5">
                          <span className={`font-bold ${p.owner === "root" ? "text-red-700" : "text-slate-800"}`}>
                            {p.owner}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-bold text-gray-900">{p.name}</td>
                        <td className="py-2 px-2.5 text-[9.5px]">
                          <span className={`inline-flex px-1.5 py-[1px] font-bold border ${
                            p.state === "SUSPENDED" 
                              ? "bg-amber-100 text-amber-800 border-amber-300" 
                              : p.state === "SERVICE"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}>
                            {p.state}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-medium">
                          {(p.memoryUsage || 1024).toLocaleString()} KB
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-indigo-800">
                          {p.state === "SUSPENDED" ? "0%" : `${p.cpuUsage || 0}%`}
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Toggle Suspend/Resume */}
                            {p.state === "SUSPENDED" ? (
                              <button
                                type="button"
                                onClick={() => handleResume(p.pid)}
                                className="px-1.5 py-0.5 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-teal-600 text-white font-bold tracking-tight uppercase hover:bg-teal-700 text-[8.5px] cursor-pointer"
                                title="Resume process (SIGCONT)"
                              >
                                CONT
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSuspend(p.pid)}
                                disabled={p.pid === 1}
                                className={`px-1.5 py-0.5 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#edd400] text-slate-800 font-bold tracking-tight uppercase text-[8.5px] cursor-pointer ${p.pid === 1 ? "opacity-50 cursor-not-allowed border-none bg-gray-200" : ""}`}
                                title="Suspend process (SIGSTOP)"
                              >
                                STOP
                              </button>
                            )}

                            {/* Kill signal button */}
                            <button
                              type="button"
                              onClick={() => handleKill(p.pid)}
                              disabled={p.pid === 1}
                              className={`px-1.5 py-0.5 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-red-600 text-white font-bold tracking-tight uppercase hover:bg-red-700 text-[8.5px] cursor-pointer ${p.pid === 1 ? "opacity-30 border-none bg-gray-200 cursor-not-allowed" : ""}`}
                              title="Kill thread index (SIGKILL)"
                            >
                              KILL
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="h-6 bg-[#eeeeec] px-3 border-t border-[#808080] flex items-center justify-between text-[9.5px] text-gray-600 font-mono">
                <span>Active Process Units: {procs.length} threads</span>
                <span className="font-bold">Total Swap state: SECURE</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="flex-1 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 min-h-0">
            {/* Services List Panel */}
            <div className="md:w-1/2 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-white rounded flex flex-col min-h-0">
              <span className="bg-[#b8b4ac] text-[#111] py-2 px-3 font-bold border-b border-[#808080] flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>TrashLinux Systemctl Daemons</span>
              </span>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                {services.map((s) => (
                  <div
                    key={s.name}
                    onClick={() => setSelectedService(s)}
                    className={`p-3.5 flex flex-col cursor-pointer transition-colors ${
                      selectedService?.name === s.name
                        ? "bg-[#002080]/15"
                        : "hover:bg-gray-50 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold font-mono text-[#111] text-[11px]">
                        {s.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                          s.status === "active"
                            ? "bg-green-100 text-green-800 border-green-300 border"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        ● {s.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 mb-2">{s.description}</span>

                    {/* Operational systemctl control actions */}
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceControl(s.name, s.status === "active" ? "stop" : "start");
                        }}
                        className={`px-2 py-0.5 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-[9.5px] font-bold uppercase tracking-tight cursor-default active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white ${
                          s.status === "active"
                            ? "bg-red-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {s.status === "active" ? "Stop unit" : "Start unit"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceControl(s.name, "restart");
                        }}
                        className="px-2 py-0.5 bg-[#d4d0c8] text-slate-900 border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#c0c0c0] rounded-sm text-[9.5px] font-bold flex items-center space-x-1 cursor-default active:border-t-[#808080] active:border-l-[#808080] active:border-[#808080] leading-3"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Restart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Service Log Monitor Console */}
            <div className="md:w-1/2 border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-black text-[#5ce65c] font-mono text-[9.5px] rounded flex flex-col min-h-0 p-1">
              <span className="bg-[#1a1a1a] text-white py-1.5 px-3 font-semibold border-b border-gray-800 flex items-center justify-between">
                <span>[ LOG MONITOR ]</span>
                <span className="text-[8.5px] text-gray-500 font-bold uppercase select-none">Live Telemetry</span>
              </span>

              <div className="flex-1 p-3 overflow-y-auto leading-4 space-y-1">
                {selectedService ? (
                  selectedService.logs.map((log, index) => (
                    <div key={index} className="text-[#00ff0a] whitespace-pre-wrap selection:bg-[#00ff0a] selection:text-black">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">
                    SELECT A DEVICE DAEMON ON THE LEFT TO CAPTURE PHYSICAL LOG STREAMS.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
