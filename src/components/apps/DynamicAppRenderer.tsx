import React, { useState, useEffect, useRef } from "react";
import * as LucideIcons from "lucide-react";
import { SystemCallInterface, AppInfo } from "../../types/os";

// Lazy-loaded Babel standalone compiler state
let babelLoadingPromise: Promise<any> | null = null;
const loadBabelStandalone = (): Promise<any> => {
  if (babelLoadingPromise) return babelLoadingPromise;
  babelLoadingPromise = new Promise((resolve, reject) => {
    if ((window as any).Babel) {
      resolve((window as any).Babel);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@babel/standalone/babel.min.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).Babel) {
        resolve((window as any).Babel);
      } else {
        reject(new Error("Babel compiler loaded but not set globally on window object."));
      }
    };
    script.onerror = (err) => {
      reject(new Error("Network Error: Failed to fetch dynamic compiler (@babel/standalone) from public CDN unpkg.com. Check internet permissions."));
    };
    document.head.appendChild(script);
  });
  return babelLoadingPromise;
};

// Default sample template source to populate VFS if a file is not found
const sampleAppTemplate = `import React, { useState } from "react";
import { Sparkles, Heart, Activity, Terminal } from "lucide-react";

export default function CustomApp({ syscall }) {
  const [likes, setLikes] = useState(0);
  const [msgInput, setMsgInput] = useState("");
  const [localLogs, setLocalLogs] = useState([]);

  const handleLog = () => {
    const time = new Date().toLocaleTimeString();
    const txt = msgInput.trim() || "Empty diagnostic pulse";
    const phrase = \`[\${time}] \${txt}\`;
    
    // Test native syscall write to persistent syslog service
    syscall.writeSyslog(\`[CustomApp] user logged event: \${txt}\`);
    setLocalLogs(prev => [phrase, ...prev.slice(0, 9)]);
    setMsgInput("");
  };

  return (
    <div className="p-4 font-mono text-xs bg-[#d4d0c8] text-black h-full flex flex-col space-y-3 select-text overflow-y-auto">
      {/* Skeuomorphic retro border top section */}
      <div className="bg-[#002080] text-white p-3 border border-b-white flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span className="font-extrabold tracking-widest uppercase">VFS RUNTIME EXECUTABLE</span>
        </div>
        <span className="bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase rounded">PID: {syscall.pid}</span>
      </div>

      {/* Main layout container with windows-style borders */}
      <div className="bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-3.5 flex-1 flex flex-col space-y-3.5 min-h-0 overflow-y-auto">
        <h3 className="font-black text-slate-900 border-b border-[#cccccc] pb-1.5 uppercase text-[12px] tracking-wide">
          Custom Application Sandbox Interface
        </h3>

        <p className="leading-5 text-gray-700 font-sans">
          This React component is compiled dynamically from the TSX file stored inside the OS Virtual File System (VFS). 
          Any edits made using <span className="font-bold underline text-blue-900">Leafpad (Text Editor)</span> on the path <strong>{syscall.appPath || "your VFS"}</strong> will render here in real-time.
        </p>

        {/* Counter interface widget */}
        <div className="bg-[#f0ece4] border border-[#a8a8a8] p-3 flex flex-col space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500">
            <span>Dynamic State Hook Tester</span>
            <span>Total Taps: {likes}</span>
          </div>

          <div className="flex space-x-1.5 pt-1">
            <button
              onClick={() => setLikes(likes + 1)}
              className="bg-[#d4d0c8] hover:bg-[#c0c0c0] active:bg-[#dfdbd3] active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-1 px-3.5 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
              <span>Tap State Count ({likes})</span>
            </button>
          </div>
        </div>

        {/* Interactive syscall logging test form */}
        <div className="flex flex-col space-y-1.5">
          <label className="font-extrabold uppercase text-[9px] text-[#ff4500]">System Logging Conduit:</label>
          <div className="flex space-x-1">
            <input
              type="text"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="e.g. Memory block flush diagnostic completed"
              className="flex-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-1.5 px-2 outline-none font-sans text-[11px] font-medium text-black focus:border-[#002080]"
              onKeyDown={(e) => e.key === "Enter" && handleLog()}
            />
            <button
              onClick={handleLog}
              className="bg-[#d4d0c8] hover:bg-[#c0c0c0] font-bold border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] px-3 active:border-t-[#808080] active:border-l-[#808080] cursor-pointer"
            >
              Incorporate Log
            </button>
          </div>
        </div>

        {/* Dynamic logs monitor */}
        <div className="flex-1 flex flex-col min-h-[120px]">
          <div className="flex items-center space-x-1 text-[#002080] text-[10px] font-bold uppercase mb-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>Sandbox Micro-Console stream:</span>
          </div>
          <div className="flex-1 bg-zinc-950 text-emerald-400 p-2.5 font-mono text-[10px] border border-zinc-800 leading-4 overflow-y-auto selection:bg-emerald-900 selection:text-white">
            {localLogs.length === 0 ? (
              <p className="text-zinc-600 italic">No events generated yet in this task sequence.</p>
            ) : (
              localLogs.map((log, index) => (
                <div key={index} className="truncate">✓ {log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="text-[9px] text-gray-500 text-center font-bold uppercase tracking-wider">
        Transpiled with @babel/standalone Runtime JIT binder
      </div>
    </div>
  );
}
`;

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: (err: Error) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SafeSandboxErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught error in dynamic custom app sandbox:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

interface DynamicAppRendererProps {
  syscall: SystemCallInterface;
  appInfo: AppInfo & { path?: string; pathType?: "web" | "internal" };
}

export function DynamicAppRenderer({ syscall, appInfo }: DynamicAppRendererProps) {
  const [sourceCode, setSourceCode] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState<boolean>(true);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [RenderedComponent, setRenderedComponent] = useState<React.ComponentType<any> | null>(null);

  // Keep a reference to reload the source code if files change
  const path = appInfo.path || "";
  const pathType = appInfo.pathType || "internal";

  const loadAndCompile = async () => {
    setIsCompiling(true);
    setCompileError(null);
    setRenderedComponent(null);

    let rawCode = "";

    try {
      if (!path) {
        throw new Error("No application source path is specified in the app registry configuration.");
      }

      // Step 1: Read code according to pathType
      if (pathType === "internal") {
        // Read file from local VFS
        try {
          const content = syscall.readFile(path);
          if (content !== undefined && content !== null) {
            if (content.startsWith("Error: ")) {
              throw new Error(content);
            }
            rawCode = content;
          } else {
            throw new Error(`File is empty or could not be loaded at: ${path}`);
          }
        } catch (vfsErr: any) {
          // If file not found, let's offer to create a template!
          if (vfsErr.message.includes("not found") || vfsErr.message.includes("corrupted") || vfsErr.message.includes("missing")) {
            // Write a beautiful template!
            const success = syscall.writeFile(path, sampleAppTemplate);
            if (success) {
              rawCode = sampleAppTemplate;
            } else {
              throw new Error(`Virtual file was not found at ${path}, and auto-creation failed due to VFS structure locks: ${vfsErr.message}`);
            }
          } else {
            throw vfsErr;
          }
        }
      } else {
        // Web type - dynamic HTTP request
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`HTTP fetch returned bad code: ${response.status} ${response.statusText}`);
          }
          rawCode = await response.text();
        } catch (fetchErr: any) {
          throw new Error(`Failed to fetch web source code from endpoint: ${path}. Details: ${fetchErr.message}`);
        }
      }

      setSourceCode(rawCode);

      // Step 2: Load Babel standalone compiler
      const Babel = await loadBabelStandalone();

      // Step 3: Transpile TSX/code
      // We must strip import statements cleanly or redirect them in our custom sandboxed require function!
      const transpiled = Babel.transform(rawCode, {
        presets: ["react", "typescript"],
        filename: "dynamic_app.tsx",
      }).code;

      if (!transpiled) {
        throw new Error("Compiling code succeeded but produced an empty executable output buffer.");
      }

      // Step 4: Create executable sandbox environment block
      const runtimeRequire = (modName: string) => {
        if (modName === "react") {
          return React;
        }
        if (modName === "lucide-react") {
          return LucideIcons;
        }
        throw new Error(`Import error: Module '${modName}' is not available in the kernel runtime environment sandbox.`);
      };

      // Create local exports holder object
      const moduleObj = { exports: {} as any };
      const exportsObj = moduleObj.exports;

      // Inject custom utility variables on the syscall for the dynamically loaded app
      const dynamicSyscall: SystemCallInterface & { appPath?: string; appPathType?: string } = {
        ...syscall,
        appPath: path,
        appPathType: pathType,
      };

      // Wrap compilation evaluation in a dynamic Function execute wrapper
      const sandboxFn = new Function(
        "React",
        "require",
        "syscall",
        "exports",
        "module",
        transpiled
      );

      sandboxFn(React, runtimeRequire, dynamicSyscall, exportsObj, moduleObj);

      const FinalComponent = moduleObj.exports.default || moduleObj.exports;
      if (typeof FinalComponent !== "function" && typeof FinalComponent !== "object") {
        throw new Error("Transpiled source file did not export index DEFAULT as an executable React component or function module.");
      }

      setRenderedComponent(() => FinalComponent);
      setIsCompiling(false);
    } catch (err: any) {
      console.error("Critical dynamic dynamic compilation failure:", err);
      setCompileError(err.message || String(err));
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    loadAndCompile();
  }, [path, pathType]);

  const handleWriteSampleTemplate = () => {
    if (path && pathType === "internal") {
      try {
        syscall.writeFile(path, sampleAppTemplate);
        loadAndCompile();
      } catch (err: any) {
        alert("Failed to write sample: " + err.message);
      }
    }
  };

  // Compile Loading State Screen
  if (isCompiling) {
    return (
      <div className="w-full h-full bg-[#1e1e1e] p-5 font-mono text-xs text-white flex flex-col justify-between select-none">
        <div className="my-auto text-center space-y-3 flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-t-emerald-400 border-l-emerald-400 border-b-transparent border-r-transparent rounded-full animate-spin" />
          <p className="font-extrabold uppercase tracking-wide text-emerald-400">
            Compiling and Binding JIT Binary...
          </p>
          <div className="text-[10px] text-zinc-500 overflow-hidden text-ellipsis max-w-sm whitespace-nowrap">
            source: {path} [{pathType.toUpperCase()}]
          </div>
        </div>
        <div className="text-[9px] text-zinc-600 text-center uppercase tracking-widest font-bold">
          Virtual Translation Unit // trashlinux core compile daemon
        </div>
      </div>
    );
  }

  // Compiler-time error Screen
  if (compileError) {
    return (
      <div className="w-full h-full bg-[#d4d0c8] text-black font-mono text-xs p-4 flex flex-col justify-between select-text select-none">
        <div className="space-y-3.5 flex-1 overflow-y-auto">
          <div className="bg-red-800 text-white p-3 border border-b-white flex items-center space-x-2.5">
            <LucideIcons.ShieldAlert className="w-5 h-5 animate-pulse text-amber-300 shrink-0" />
            <div>
              <p className="font-black leading-none uppercase text-[11px] tracking-wider">Dynamic App Compile Interrupt</p>
              <p className="text-[9px] text-red-200 mt-1 leading-none font-mono">Babel execution error at translation phase 3</p>
            </div>
          </div>

          <p className="font-sans text-gray-700 leading-5">
            The kernel failed to load or compile your custom application. Check that the source path parameters are correct and contains clean React TSX module syntax.
          </p>

          <div className="bg-black/90 text-red-500 p-3 h-48 rounded-none border border-red-950 font-mono text-[10px] leading-relaxed overflow-y-auto selection:bg-red-950">
            <span className="font-bold text-red-400 uppercase text-[9px] block mb-1">=== TRANSLATION EXCEPTION REPORT ===</span>
            <p className="whitespace-pre-wrap">{compileError}</p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={loadAndCompile}
              className="bg-[#d4d0c8] hover:bg-[#c0c0c0] font-bold border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-1.5 px-3 uppercase text-[10px] active:border-t-[#808080] active:border-l-[#808080] cursor-pointer"
            >
              🔄 Retry Build
            </button>
            {pathType === "internal" && (
              <button
                onClick={handleWriteSampleTemplate}
                className="bg-[#002080] text-white hover:bg-[#00175c] font-black py-1.5 px-3 uppercase text-[10px] cursor-pointer"
              >
                💾 Force Write Clean Template
              </button>
            )}
          </div>
        </div>

        <div className="text-[9px] text-zinc-500 text-center uppercase tracking-wider font-bold pt-2.5 mt-2 border-t border-[#808080]/35 select-none">
          Compiler code status failure 0x2A - checkout app source code format
        </div>
      </div>
    );
  }

  // Active successfully transpiled and running App
  if (RenderedComponent) {
    const renderProblemFallback = (renderErr: Error) => {
      return (
        <div className="w-full h-full bg-[#3d0000] text-red-400 font-mono text-xs p-5 select-text overflow-y-auto">
          <h2 className="text-[#ff5555] font-black uppercase text-[12px] pb-2 border-b border-red-900 border-dashed mb-3 flex items-center space-x-1.5">
            <LucideIcons.ShieldAlert className="w-5 h-5 text-red-600 animate-bounce shrink-0" />
            <span>Sandbox Runtime Crash Exception</span>
          </h2>
          <p className="leading-5 mb-4 font-sans text-gray-300">
            The transpiled virtual app executed successfully but encountered a fatal runtime exception during the active React render loop cycle.
          </p>
          <div className="bg-black text-red-500 p-4 border border-red-950 text-[10.5px] leading-relaxed font-mono whitespace-pre-wrap">
            {renderErr.message || String(renderErr)}
          </div>
          <button
            onClick={loadAndCompile}
            className="mt-4 bg-red-600 text-white font-black py-1.5 px-4 border border-white hover:bg-red-700 uppercase cursor-pointer"
          >
            Re-init virtual container
          </button>
        </div>
      );
    };

    return (
      <SafeSandboxErrorBoundary key={path} fallback={renderProblemFallback}>
        <RenderedComponent syscall={syscall} />
      </SafeSandboxErrorBoundary>
    );
  }

  return null;
}
