import React, { useState, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";
import { 
  ISocAssembly, 
  TypeKind,
  ISocConstant,
  ISocField,
  ISocProperty,
  ISocEvent,
  ISocMethod
} from "../../types/soc";
import { initGsocCache } from "../../kernel/gsocc";
import { TreeView } from "./assembly-inspector/TreeView";
import { stepTLML, initialVMState, VMState } from "./assembly-inspector/VMSimulator";
import { 
  Search, 
  Cpu, 
  Zap, 
  Play, 
  Pause, 
  ChevronRight, 
  RefreshCw,
  FolderTree,
  Sliders,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Send,
  Binary,
  Layers,
  Database
} from "lucide-react";

interface AssemblyInspectorAppProps {
  syscall: SystemCallInterface;
}

export default function AssemblyInspectorApp({ syscall }: AssemblyInspectorAppProps) {
  // Global GSOCC cache
  const [cache, setCache] = useState<Record<string, ISocAssembly>>({});
  const [selectedItem, setSelectedItem] = useState<any>({ type: "welcome" });
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "asm_TLML.Lang.dll": true,
    "ns_TLML.Lang.dll_TLML.Lang": true
  });
  const [searchQuery, setSearchQuery] = useState("");

  // VM Simulator States for methods
  const [vmState, setVmState] = useState<VMState | null>(null);
  const [vmActiveMethod, setVmActiveMethod] = useState<string | null>(null);
  const [vmIsRunning, setVmIsRunning] = useState(false);

  // GSOCC global diagnostic variables
  const [diagnosticProgress, setDiagnosticProgress] = useState<number | null>(null);
  const [diagnosticReport, setDiagnosticReport] = useState<string | null>(null);

  // Memory allocation registers
  const [allocatedInstances, setAllocatedInstances] = useState<{ id: string; type: string; address: string; timestamp: string }[]>([]);
  const [nextAddress, setNextAddress] = useState(0x004AF300);
  const [allocationLogs, setAllocationLogs] = useState<string[]>([
    "[Memory Subsystem]: Cold standby. Virtual heap paging aligned at page boundaries."
  ]);

  // Live Register field mutation value states
  const [liveValueState, setLiveValueState] = useState<Record<string, string>>({});
  const [registerLogs, setRegisterLogs] = useState<string[]>([]);

  // Event telemetry triggers
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [newSubscriber, setNewSubscriber] = useState("");
  const [eventSubscribers, setEventSubscribers] = useState<Record<string, string[]>>({
    "OnPush": ["TraceLogger.LogPush", "CollectionsWatcher.OnPushCompleted"],
    "OnComputeHash": ["SecurityLogger.AuditComputeHash", "CryptoWatchdog.OnHashGenerated"],
    "OnLogInfo": ["TelemetryTerminal.AppendLog", "TraceWatcher.NotifyLog"]
  });

  // Sandboxing options toggles
  const [securityRules, setSecurityRules] = useState<Record<string, boolean>>({
    allowReflection: true,
    disallowUnsafeCasting: false,
    enforceStackGuard: true,
    jitInlining: true,
    sandboxIo: true
  });

  // Load and initialize cache
  useEffect(() => {
    if (!(window as any).GSOCC) {
      initGsocCache();
    }
    if ((window as any).GSOCC) {
      setCache((window as any).GSOCC.assemblies);
    }
  }, []);

  // Sync cache changes
  const updateCacheItem = (updatedAsm: ISocAssembly) => {
    const updated = { ...cache, [updatedAsm.name]: updatedAsm };
    setCache(updated);
    if ((window as any).GSOCC) {
      (window as any).GSOCC.assemblies = updated;
    }
  };

  // Toggle tree directory node
  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Run auto step timer
  useEffect(() => {
    let timer: any = null;
    if (vmIsRunning && vmState && !vmState.isCompleted) {
      timer = setInterval(() => {
        setVmState(prev => {
          if (!prev || prev.isCompleted) {
            setVmIsRunning(false);
            return prev;
          }
          return stepTLML(prev);
        });
      }, 600);
    } else if (vmState?.isCompleted) {
      setVmIsRunning(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [vmIsRunning, vmState]);

  // Initialize VM state on click
  const loadVMMethod = (methodName: string, bodyText: string) => {
    setVmActiveMethod(methodName);
    setVmIsRunning(false);
    setVmState(initialVMState(methodName, bodyText));
  };

  const handleStepVM = () => {
    if (vmState) {
      setVmState(stepTLML(vmState));
    }
  };

  const handleResetVM = (bodyText: string) => {
    if (vmActiveMethod) {
      setVmIsRunning(false);
      setVmState(initialVMState(vmActiveMethod, bodyText));
    }
  };

  // Trigger diagnostic scans
  const runDiagnostic = () => {
    setDiagnosticProgress(0);
    setDiagnosticReport(null);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setDiagnosticProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setDiagnosticProgress(null);
        setDiagnosticReport(
          `Diagnostic sweep completed! Scanned ${Object.keys(cache).length} assemblies. Integrity check: 100% compliant. Call stacks validated: OK. Sandbox security rules aligned with GSOCC boundary layer.`
        );
      }
    }, 120);
  };

  // Instantiate type in virtual memory
  const instantiateType = (typeName: string) => {
    const addr = `0x${nextAddress.toString(16).toUpperCase()}`;
    const timestamp = new Date().toLocaleTimeString();
    const newInstance = {
      id: Math.random().toString(36).substring(2, 6).toUpperCase(),
      type: typeName,
      address: addr,
      timestamp
    };
    setAllocatedInstances(prev => [newInstance, ...prev]);
    setNextAddress(prev => prev + 0x3C);
    setAllocationLogs(prev => [
      `[Memory Subsystem] ${timestamp}: Instantiated '${typeName}' at memory boundary ${addr}`,
      `[Memory Subsystem] ${timestamp}: Registered object header: V-Table -> 0x7FFA8${Math.floor(Math.random() * 9000 + 1000)}`,
      ...prev
    ]);
  };

  // Commit value registration updates
  const commitValueOverride = (assemblyName: string, namespaceName: string, typeName: string, memberName: string, isField: boolean) => {
    const overrideVal = liveValueState[`${typeName}_${memberName}`];
    if (overrideVal === undefined || overrideVal === "") return;

    // Find the assembly, update it
    const asm = cache[assemblyName];
    if (!asm) return;

    const ns = asm.namespaces.find(n => n.name === namespaceName);
    if (!ns) return;

    const type = ns.types.find(t => t.name === typeName);
    if (!type) return;

    const typeAny = type as any;
    const timestamp = new Date().toLocaleTimeString();

    if (isField) {
      const field = typeAny.fields?.find((f: any) => f.name === memberName);
      if (field) {
        field.value = overrideVal;
        setRegisterLogs(prev => [
          `[REGISTER WRITE] ${timestamp}: Field '${typeName}.${memberName}' updated to '${overrideVal}' (Target offset: 0x${Math.floor(Math.random() * 100000).toString(16).toUpperCase()})`,
          ...prev
        ]);
      }
    } else {
      const prop = typeAny.properties?.find((p: any) => p.name === memberName);
      if (prop) {
        prop.value = overrideVal;
        setRegisterLogs(prev => [
          `[REGISTER WRITE] ${timestamp}: Property '${typeName}.${memberName}' modified -> written value '${overrideVal}'`,
          ...prev
        ]);
      }
    }
    updateCacheItem(asm);
  };

  // Signal fire simulation
  const fireEventSignal = (eventName: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const subscribers = eventSubscribers[eventName] || [];
    
    setEventLogs(prev => [
      `[SIGNAL FIRE] ${timestamp}: Triggered virtual event signal for '${eventName}'`,
      `[ROUTING] ${timestamp}: Located ${subscribers.length} callback handler(s) in active cache.`,
      ...subscribers.map((sub, idx) => `  ↳ [CALLBACK ${idx + 1}] Invoked target pointer address: ${sub}() -> RETURN CODE: 0x0`),
      `[SIGNAL FIRE] ${timestamp}: Dispatched cleanly. Stack balance: OK.`,
      ...prev
    ]);
  };

  // Add event listener callback
  const addEventListener = (eventName: string) => {
    if (!newSubscriber.trim()) return;
    const current = eventSubscribers[eventName] || [];
    setEventSubscribers(prev => ({
      ...prev,
      [eventName]: [...current, newSubscriber.trim()]
    }));
    setNewSubscriber("");
  };

  // Get selected details
  const getSelectedData = () => {
    if (!selectedItem || selectedItem.type === "welcome") return null;
    const asm = cache[selectedItem.assemblyName];
    if (!asm) return null;

    if (selectedItem.type === "assembly") return { assembly: asm };
    if (selectedItem.type === "references") return { assembly: asm };

    const ns = asm.namespaces.find((n: any) => n.name === selectedItem.namespaceName);
    if (!ns) return null;
    if (selectedItem.type === "namespace") return { assembly: asm, namespace: ns };

    const type = ns.types.find((t: any) => t.name === selectedItem.typeName);
    if (!type) return null;
    if (selectedItem.type === "type") return { assembly: asm, namespace: ns, type };

    // Leaf types
    const classType = type as any;
    if (selectedItem.type === "constant") {
      const c = classType.constants?.find((item: any) => item.name === selectedItem.name);
      return { assembly: asm, namespace: ns, type, item: c };
    }
    if (selectedItem.type === "field") {
      const f = classType.fields?.find((item: any) => item.name === selectedItem.name);
      return { assembly: asm, namespace: ns, type, item: f };
    }
    if (selectedItem.type === "property") {
      const p = classType.properties?.find((item: any) => item.name === selectedItem.name);
      return { assembly: asm, namespace: ns, type, item: p };
    }
    if (selectedItem.type === "event") {
      const e = classType.events?.find((item: any) => item.name === selectedItem.name);
      return { assembly: asm, namespace: ns, type, item: e };
    }
    if (selectedItem.type === "method") {
      const m = classType.methods?.find((item: any) => item.name === selectedItem.name);
      return { assembly: asm, namespace: ns, type, item: m };
    }
    return null;
  };

  const details = getSelectedData();

  return (
    <div className="h-full flex flex-col bg-[#f6f6f0] text-[#2e3436] font-sans antialiased text-xs">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#e9e9df] border-b border-[#babdb6] shrink-0">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#555753]" />
          <span className="font-bold tracking-tight text-gray-800 text-[13px]">GSOCC Cache Inspector</span>
          <span className="bg-[#babdb6] text-white px-1.5 py-0.5 rounded text-[9px] font-mono leading-none">TLML Standard</span>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search types, members, or instructions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#babdb6] rounded pl-6 pr-2 py-0.5 text-xs font-mono outline-none focus:border-blue-500 shadow-inner"
          />
          <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" />
        </div>
      </div>

      {/* Main Panel Division */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tree Pane */}
        <div className="w-[300px] bg-[#fdfdfc] border-r border-[#babdb6] flex flex-col overflow-y-auto">
          <div className="p-2 bg-[#eeeeec] border-b border-[#babdb6] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1 text-[11px] font-bold uppercase text-[#555753]">
              <FolderTree className="w-3.5 h-3.5" />
              <span>SOC Cache Directory</span>
            </div>
            <button 
              onClick={runDiagnostic}
              className="px-1.5 py-0.5 bg-[#d3d7cf] border border-[#babdb6] hover:bg-[#c0c4bc] rounded flex items-center space-x-1 font-mono text-[9px] cursor-pointer"
              title="Audit cache integrity"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Verify</span>
            </button>
          </div>

          <TreeView
            cache={cache}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            searchQuery={searchQuery}
          />
        </div>

        {/* Right Details / Options Dashboard Pane */}
        <div className="flex-1 bg-white overflow-y-auto flex flex-col">
          {/* Welcome Dashboard */}
          {selectedItem.type === "welcome" && (
            <div className="p-6 max-w-4xl space-y-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Global Shared Object Collection Cache (GSOCC)</h1>
                <p className="text-gray-500 mt-1 text-[13px]">
                  Welcome to the Dynamic Linker Inspector interface. Scan registers, allocate memory segments, or debug compiled TLML bytecode.
                </p>
              </div>

              {/* Diagnostic verification board */}
              <div className="bg-[#fcfcfa] border border-[#d3d7cf] rounded p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#d3d7cf] pb-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-gray-800 text-[12px]">GSOCC Cache Diagnostics</span>
                  </div>
                  <button
                    onClick={runDiagnostic}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded text-[11px] shadow-sm flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                    <span>Run Full Sweep</span>
                  </button>
                </div>

                {diagnosticProgress !== null ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>Analyzing instruction segments...</span>
                      <span>{diagnosticProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2.5 rounded overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-100" style={{ width: `${diagnosticProgress}%` }} />
                    </div>
                  </div>
                ) : diagnosticReport ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded font-mono text-[11px] space-y-1">
                    <p className="font-bold text-emerald-800">✅ SYSTEM SECURE</p>
                    <p>{diagnosticReport}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 font-mono text-[11px] italic">
                    Diagnostic idle. Click "Run Full Sweep" to scan loaded assemblies for memory leaks or invalid entry points.
                  </p>
                )}
              </div>

              {/* Quick statistics layout */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-[#d3d7cf] rounded p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Loaded Assemblies</span>
                  <span className="text-2xl font-bold font-mono text-purple-600">{Object.keys(cache).length}</span>
                </div>
                <div className="bg-gray-50 border border-[#d3d7cf] rounded p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Active Sandbox Level</span>
                  <span className="text-lg font-bold font-mono text-emerald-600 block mt-1">RING 3</span>
                </div>
                <div className="bg-gray-50 border border-[#d3d7cf] rounded p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Allocation Segment</span>
                  <span className="text-xs font-bold font-mono text-gray-700 block mt-2">0x004AF000</span>
                </div>
              </div>

              {/* Sandboxing Rules Manager */}
              <div className="bg-gray-50 border border-[#d3d7cf] rounded p-4 space-y-3 shadow-sm">
                <div className="flex items-center space-x-2 border-b border-gray-200 pb-1.5">
                  <Sliders className="w-4 h-4 text-gray-600" />
                  <span className="font-bold text-[#2e3436] text-[12px]">Dynamic Sandbox Policy manager</span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                  {Object.keys(securityRules).map((key) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer bg-white p-2 border border-gray-200 rounded hover:border-blue-500">
                      <input
                        type="checkbox"
                        checked={securityRules[key]}
                        onChange={(e) => setSecurityRules(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assembly / Reference Detail Options */}
          {(selectedItem.type === "assembly" || selectedItem.type === "references") && details?.assembly && (
            <div className="p-5 space-y-6">
              <div className="border-b border-[#babdb6] pb-3">
                <h1 className="text-lg font-bold text-gray-900 font-mono">Assembly: {details.assembly.name}</h1>
                <p className="text-gray-500 font-mono mt-0.5 text-[11px]">Token: {details.assembly.publicKeyToken || "0x00000000"}</p>
              </div>

              {/* High density detail attributes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase">Metadata Specifications</span>
                  <p><span className="text-gray-400">Version:</span> {details.assembly.version}</p>
                  <p><span className="text-gray-400">Bound:</span> Local Shared Directory</p>
                  <p><span className="text-gray-400">Namespaces:</span> {details.assembly.namespaces.length}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase">Dependencies Map</span>
                  {selectedItem.type === "references" ? (
                    <div className="text-gray-700 text-[11px] leading-tight mt-1">
                      {details.assembly.dependencies.map((dep: any, idx: number) => (
                        <p key={idx} className="flex items-center space-x-1 font-mono py-0.5 border-b border-gray-100 last:border-0">
                          <Binary className="w-3 h-3 text-purple-500" />
                          <span>{dep.assemblyName} (v{dep.version})</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">Select "References" in cache directory directory tree to view direct import linkages.</p>
                  )}
                </div>
              </div>

              {/* Assembly Specific Binder Controls */}
              <div className="border border-gray-200 rounded p-4 space-y-3">
                <h2 className="font-bold text-[12px] text-gray-800 flex items-center space-x-1.5 pb-2 border-b">
                  <Sliders className="w-4 h-4 text-[#555753]" />
                  <span>Interactive Assembly Segment Binder</span>
                </h2>

                <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
                  <div className="space-y-1">
                    <label className="text-gray-500 font-bold block">Binding Mode</label>
                    <select className="w-full bg-white border border-gray-300 rounded p-1 outline-none">
                      <option>Automatic Heap Segments (Default)</option>
                      <option>Kernel Ring-0 Ring Segment</option>
                      <option>TrashLinux Shared Memory Segment 0x4F</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-500 font-bold block">Runtime Security Privilege</label>
                    <select className="w-full bg-white border border-gray-300 rounded p-1 outline-none">
                      <option>Ring 3 (Sandboxed App Mode - DEFAULT)</option>
                      <option>Ring 0 (Root Kernel Priority)</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button 
                    onClick={() => {
                      setRegisterLogs(prev => [
                        `[GSOCC REF] Re-mapped 14 Virtual Function Table pointers for '${details.assembly.name}'`,
                        ...prev
                      ]);
                    }}
                    className="px-3 py-1 bg-[#eeeeec] border border-[#babdb6] hover:bg-[#d3d7cf] rounded font-semibold text-gray-700 cursor-pointer"
                  >
                    Recalculate V-Table Index
                  </button>
                  <button 
                    onClick={() => {
                      setRegisterLogs(prev => [
                        `[SYS REG] Saved registration log for '${details.assembly.name}' into Kernel Dynamic Registry.`,
                        ...prev
                      ]);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer"
                  >
                    Register DLL to Kernel VFS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Namespace Detail Options */}
          {selectedItem.type === "namespace" && details?.namespace && (
            <div className="p-5 space-y-6">
              <div className="border-b border-[#babdb6] pb-3">
                <h1 className="text-lg font-bold text-gray-900 font-mono">Namespace: {details.namespace.name}</h1>
                <p className="text-gray-500 font-mono mt-0.5 text-[11px]">Belongs to assembly: {details.assembly.name}</p>
              </div>

              {/* Category high density grids */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 border rounded p-3 text-center">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase">Classes</span>
                  <span className="text-lg font-bold font-mono text-blue-600">
                    {details.namespace.types.filter((t: any) => t.kind === TypeKind.Class).length}
                  </span>
                </div>
                <div className="bg-gray-50 border rounded p-3 text-center">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase">Interfaces</span>
                  <span className="text-lg font-bold font-mono text-rose-600">
                    {details.namespace.types.filter((t: any) => t.kind === TypeKind.Interface).length}
                  </span>
                </div>
                <div className="bg-gray-50 border rounded p-3 text-center">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase">Enums</span>
                  <span className="text-lg font-bold font-mono text-teal-600">
                    {details.namespace.types.filter((t: any) => t.kind === TypeKind.Enum).length}
                  </span>
                </div>
                <div className="bg-gray-50 border rounded p-3 text-center">
                  <span className="text-[10px] font-bold text-gray-500 block uppercase">Structs</span>
                  <span className="text-lg font-bold font-mono text-cyan-600">
                    {details.namespace.types.filter((t: any) => t.kind === TypeKind.Struct).length}
                  </span>
                </div>
              </div>

              {/* Namespace sandbox rules checklist */}
              <div className="bg-[#fcfcfa] border rounded p-4 space-y-2">
                <h2 className="font-bold text-[12px] text-gray-800 pb-1.5 border-b">Active Namespace Isolation Rules</h2>
                <div className="space-y-1.5 font-mono text-[11px] text-gray-700">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Enforce Interprocess Isolation boundary</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Restrict Direct File write calls</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked={false} className="rounded text-blue-600" />
                    <span>Allow Dynamic Code Emit binding</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Type Detail Control Options (Class / Struct / Interface / Delegate / Enum) */}
          {selectedItem.type === "type" && details?.type && (
            <div className="p-5 space-y-6">
              <div className="border-b border-[#babdb6] pb-3 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-gray-900 font-mono">Type: {details.type.name}</h1>
                  <p className="text-gray-500 font-mono mt-0.5 text-[11px]">Kind: {details.type.kind} | Modifier: {details.type.accessModifier || "Public"}</p>
                </div>

                {/* Class allocator triggers */}
                {(details.type.kind === TypeKind.Class || details.type.kind === TypeKind.Struct) && (
                  <button
                    onClick={() => instantiateType(details.type.name)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded text-[11px] shadow-sm flex items-center space-x-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Instantiate on Heap</span>
                  </button>
                )}
              </div>

              {/* Specific Enum Visualizer */}
              {details.type.kind === TypeKind.Enum && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border rounded p-3">
                    <h3 className="font-bold text-[11px] uppercase text-gray-500 mb-2 font-mono">Bitwise Constants</h3>
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-400">
                          <th className="py-1">Constant</th>
                          <th className="py-1">Dec</th>
                          <th className="py-1">Hex</th>
                          <th className="py-1">Binary Stream</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {((details.type as any).constants || []).map((c: any) => (
                          <tr key={c.name}>
                            <td className="py-1.5 font-bold text-teal-700">{c.name}</td>
                            <td className="py-1.5">{c.value}</td>
                            <td className="py-1.5 text-indigo-600">0x{Number(c.value).toString(16).toUpperCase()}</td>
                            <td className="py-1.5 text-gray-500 font-mono">{String(Number(c.value).toString(2)).padStart(8, "0")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Class / Struct memory allocations */}
              {(details.type.kind === TypeKind.Class || details.type.kind === TypeKind.Struct) && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Allocation logs terminal */}
                  <div className="border rounded p-3 flex flex-col h-48 bg-gray-900 text-emerald-400 font-mono text-[10px] overflow-y-auto">
                    <span className="text-gray-400 font-bold border-b border-gray-700 pb-1 mb-1 block uppercase">Memory allocations</span>
                    <div className="flex-1 space-y-1">
                      {allocationLogs.map((log, idx) => (
                        <p key={idx} className="leading-tight">{log}</p>
                      ))}
                    </div>
                  </div>

                  {/* Allocated address matrix */}
                  <div className="border rounded p-3 h-48 flex flex-col overflow-y-auto bg-gray-50">
                    <span className="text-gray-500 font-bold border-b pb-1 mb-1 block uppercase text-[10px]">Active Heap objects</span>
                    <div className="flex-1 divide-y divide-gray-200">
                      {allocatedInstances.length === 0 ? (
                        <p className="text-gray-400 italic text-center pt-8">No heap active segments allocated.</p>
                      ) : (
                        allocatedInstances.map((inst, idx) => (
                          <div key={idx} className="py-1.5 font-mono flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-blue-700">{inst.type}</span>
                              <span className="text-gray-400 text-[9px] block">Allocated {inst.timestamp}</span>
                            </div>
                            <span className="bg-gray-200 text-gray-700 px-1 py-0.5 rounded text-[10px]">{inst.address}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaf members options and simulations */}
          {details && ["constant", "field", "property", "event", "method"].includes(selectedItem.type) && (
            <div className="p-5 flex-1 flex flex-col min-h-0 space-y-4">
              <div className="border-b border-[#babdb6] pb-3 shrink-0">
                <h1 className="text-lg font-bold text-gray-900 font-mono flex items-center space-x-1.5">
                  <span className="capitalize">{selectedItem.type}:</span>
                  <span className="text-blue-700">{selectedItem.name || (details as any).item?.name}</span>
                </h1>
                <p className="text-gray-500 font-mono mt-0.5 text-[11px]">
                  Parent type: {selectedItem.typeName} | Modifier: {(details as any).item?.accessModifier || "Public"}
                </p>
              </div>

              {/* Constant Options details */}
              {selectedItem.type === "constant" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border rounded p-4 font-mono text-[11px] space-y-1.5 max-w-xl">
                    <p><span className="text-gray-400">Constant Value:</span> {(details as any).item?.value}</p>
                    <p><span className="text-gray-400">Data Type:</span> {(details as any).item?.type}</p>
                    <p><span className="text-gray-400">Literal Hex Representation:</span> 0x{Number((details as any).item?.value).toString(16).toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Field / Property live mutated controls */}
              {(selectedItem.type === "field" || selectedItem.type === "property") && (
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="bg-gray-50 border rounded p-4 space-y-3 max-w-xl shrink-0">
                    <h3 className="font-bold text-[12px] text-gray-800">Field Register Overrides</h3>
                    <p className="text-gray-500 text-[11px]">Write directly to the dynamic GSOCC cache register offset address.</p>

                    <div className="flex space-x-2 font-mono">
                      <input
                        type="text"
                        placeholder={`New override value (current: ${(details as any).item?.value !== undefined ? (details as any).item?.value : "null"})`}
                        value={liveValueState[`${selectedItem.typeName}_${selectedItem.name}`] || ""}
                        onChange={(e) => setLiveValueState({ ...liveValueState, [`${selectedItem.typeName}_${selectedItem.name}`]: e.target.value })}
                        className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 outline-none text-xs"
                      />
                      <button
                        onClick={() => commitValueOverride(selectedItem.assemblyName, selectedItem.namespaceName, selectedItem.typeName, selectedItem.name, selectedItem.type === "field")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded text-xs cursor-pointer shadow-sm"
                      >
                        Commit to Register Address
                      </button>
                    </div>
                  </div>

                  {/* Register write telemetry terminals */}
                  <div className="flex-1 border rounded p-3 flex flex-col bg-gray-950 text-emerald-400 font-mono text-[10px] overflow-y-auto min-h-[150px]">
                    <span className="text-gray-400 font-bold border-b border-gray-800 pb-1 mb-1 block uppercase">Bus writing logs</span>
                    <div className="flex-1 space-y-1">
                      {registerLogs.length === 0 ? (
                        <p className="text-gray-600 italic">No writing operations executed yet.</p>
                      ) : (
                        registerLogs.map((log, idx) => (
                          <p key={idx} className="leading-tight">{log}</p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Event trigger simulation controls */}
              {selectedItem.type === "event" && (
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="bg-gray-50 border rounded p-4 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[12px] text-gray-800">Dynamic Delegate Routing Manager</h3>
                      <button
                        onClick={() => fireEventSignal(selectedItem.name)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-1.5 rounded text-[11px] shadow-sm flex items-center space-x-1 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Trigger Live Event Signal</span>
                      </button>
                    </div>

                    {/* Subscribed delegate targets list */}
                    <div className="font-mono text-[11px] space-y-1">
                      <p className="text-gray-500 font-bold block mb-1">Subscriber Pointer Addresses:</p>
                      {(eventSubscribers[selectedItem.name] || []).map((sub, idx) => (
                        <p key={idx} className="text-gray-700 py-0.5 border-b border-gray-100 last:border-0">
                          ↳ <span className="text-indigo-600 font-bold">{sub}</span> (Delegate Address: 0x7FFA{idx * 40 + 310})
                        </p>
                      ))}
                    </div>

                    {/* Add listener controls */}
                    <div className="flex space-x-2 pt-1 font-mono">
                      <input
                        type="text"
                        placeholder="Register subscriber handler address (e.g., AuditLogger.OnEvent)"
                        value={newSubscriber}
                        onChange={(e) => setNewSubscriber(e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 outline-none text-xs"
                      />
                      <button
                        onClick={() => addEventListener(selectedItem.name)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded text-xs cursor-pointer shadow-sm"
                      >
                        Subscribe Delegate
                      </button>
                    </div>
                  </div>

                  {/* Telemetry dispatcher feedback console */}
                  <div className="flex-1 border rounded p-3 flex flex-col bg-gray-950 text-emerald-400 font-mono text-[10px] overflow-y-auto min-h-[150px]">
                    <span className="text-gray-400 font-bold border-b border-gray-800 pb-1 mb-1 block uppercase">Signal dispatch telemetry console</span>
                    <div className="flex-1 space-y-1">
                      {eventLogs.length === 0 ? (
                        <p className="text-gray-600 italic">Listening for dynamic signals...</p>
                      ) : (
                        eventLogs.map((log, idx) => (
                          <p key={idx} className="leading-tight">{log}</p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Method bytecode simulator / Interactive VM debugger */}
              {selectedItem.type === "method" && (
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                  {/* Load / reload debugger controls */}
                  <div className="flex items-center justify-between bg-gray-100 border border-gray-200 p-2 rounded shrink-0">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-gray-700 font-mono text-[11px]">Debugger state:</span>
                      {vmActiveMethod === selectedItem.name && vmState ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold font-mono">
                          PC: {vmState.pc} / {vmState.instructions.length} {vmState.isCompleted ? "[COMPLETED]" : "[READY]"}
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-bold font-mono">NOT LOADED</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-[10px]">
                      {vmActiveMethod === selectedItem.name && vmState ? (
                        <>
                          <button
                            onClick={handleStepVM}
                            disabled={vmState.isCompleted || vmIsRunning}
                            className={`px-2 py-1 border rounded font-semibold flex items-center space-x-1 cursor-pointer ${
                              vmState.isCompleted || vmIsRunning ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                            }`}
                            title="Execute single instruction step"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>Step (F10)</span>
                          </button>

                          <button
                            onClick={() => setVmIsRunning(!vmIsRunning)}
                            disabled={vmState.isCompleted}
                            className={`px-2.5 py-1 rounded text-white font-semibold flex items-center space-x-1 cursor-pointer ${
                              vmState.isCompleted ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {vmIsRunning ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                            <span>{vmIsRunning ? "Pause" : "Run (F5)"}</span>
                          </button>

                          <button
                            onClick={() => handleResetVM((details as any).item?.bodySimulated || "")}
                            className="px-2 py-1 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 rounded font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reset (F11)</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => loadVMMethod(selectedItem.name, (details as any).item?.bodySimulated || "")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-sm flex items-center space-x-1 cursor-pointer"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Attach VM Debugger</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Split screen debugger panels */}
                  {vmActiveMethod === selectedItem.name && vmState ? (
                    <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
                      {/* Left: Bytecode Instruction panel */}
                      <div className="col-span-5 border rounded flex flex-col min-h-0 bg-white">
                        <span className="bg-[#eeeeec] border-b px-2.5 py-1.5 font-bold uppercase text-gray-500 text-[10px] tracking-wider font-mono">
                          Instruction stream
                        </span>
                        <div className="flex-1 overflow-y-auto p-1 font-mono text-[10px] space-y-0.5 bg-[#fdfdfc]">
                          {vmState.instructions.map((inst, idx) => {
                            const isCurrentPC = vmState.pc === idx;
                            return (
                              <div
                                key={idx}
                                className={`flex items-center px-2 py-1 rounded transition-colors ${
                                  isCurrentPC ? "bg-yellow-100 text-yellow-900 border-l-4 border-l-yellow-500 font-bold" : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <span className="w-8 shrink-0 text-gray-400 select-none">{String(idx).padStart(3, "0")}</span>
                                <span className="truncate leading-none">{inst}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Middle: Stack register & local vars panel */}
                      <div className="col-span-4 flex flex-col space-y-3 min-h-0">
                        {/* Stack memory */}
                        <div className="flex-1 border rounded flex flex-col min-h-0 bg-white">
                          <span className="bg-[#eeeeec] border-b px-2.5 py-1.5 font-bold uppercase text-gray-500 text-[10px] tracking-wider font-mono">
                            Virtual Evaluation Stack
                          </span>
                          <div className="flex-1 overflow-y-auto p-2 bg-gray-50 flex flex-col-reverse justify-end space-y-reverse space-y-1.5">
                            {vmState.stack.length === 0 ? (
                              <p className="text-gray-400 font-mono text-[10px] italic text-center pt-8">[EMPTY EVAL STACK]</p>
                            ) : (
                              vmState.stack.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-blue-50 border border-blue-200 text-blue-800 font-mono px-2 py-1 rounded text-[10px] flex items-center justify-between shadow-xs animate-slide-in"
                                >
                                  <span className="text-gray-400 text-[9px]">S[{idx}]</span>
                                  <span className="font-bold truncate max-w-[150px]">{item}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Local registers */}
                        <div className="h-28 border rounded flex flex-col min-h-0 bg-white">
                          <span className="bg-[#eeeeec] border-b px-2.5 py-1.5 font-bold uppercase text-gray-500 text-[10px] tracking-wider font-mono">
                            Local registers
                          </span>
                          <div className="flex-1 overflow-y-auto p-1.5 bg-white font-mono text-[10px] space-y-1">
                            {Object.keys(vmState.vars).length === 0 ? (
                              <p className="text-gray-400 italic text-center pt-4">No initialized registers.</p>
                            ) : (
                              Object.entries(vmState.vars).map(([name, val], idx) => (
                                <div key={idx} className="flex items-center justify-between py-0.5 border-b last:border-0 border-gray-100">
                                  <span className="text-indigo-600 font-bold">R_{name}</span>
                                  <span className="text-gray-700 bg-gray-100 px-1 rounded truncate max-w-[120px]">{val}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Telemetry log trace */}
                      <div className="col-span-3 border rounded flex flex-col min-h-0 bg-gray-950 text-emerald-400">
                        <span className="bg-gray-900 border-b border-gray-800 px-2.5 py-1.5 font-bold uppercase text-gray-400 text-[10px] tracking-wider font-mono">
                          Debugger Logs
                        </span>
                        <div className="flex-1 overflow-y-auto p-2 font-mono text-[9px] space-y-1 flex flex-col-reverse justify-end">
                          {vmState.logs.map((log, idx) => (
                            <p key={idx} className="leading-tight leading-relaxed select-text">{log}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded p-12 bg-gray-50 font-mono text-center space-y-2">
                      <Cpu className="w-12 h-12 text-gray-300 animate-pulse" />
                      <p className="font-bold text-gray-600">Attached VM Engine Standby</p>
                      <p className="text-gray-400 max-w-sm text-[11px]">
                        The virtual machine registers and evaluation stack are currently unassigned. Click "Attach VM Debugger" above to begin stepping.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
