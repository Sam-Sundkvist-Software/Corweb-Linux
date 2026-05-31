import React, { useState, useEffect } from "react";
import { SystemCallInterface, AppInfo } from "../../types/os";
import {
  Save,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  User,
  GitBranch,
  Layers,
  HelpCircle,
  Hash
} from "lucide-react";

interface AppRegistryAppProps {
  syscall: SystemCallInterface;
}

export default function AppRegistryApp({ syscall }: AppRegistryAppProps) {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("desktopEnv");
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  
  // Form fields
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [appAuthor, setAppAuthor] = useState("");
  const [appDependencies, setAppDependencies] = useState("");
  const [appIcon, setAppIcon] = useState("layout");
  const [appPath, setAppPath] = useState("");
  const [appPathType, setAppPathType] = useState<"web" | "internal">("internal");

  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Load apps from VFS directly on mount or reload
  const loadRegistryFromVFS = () => {
    try {
      const content = syscall.readFile("/etc/customAppRegistry.json");
      if (content) {
        const parsed = JSON.parse(content) as AppInfo[];
        if (Array.isArray(parsed)) {
          setApps(parsed);
          // Set selection
          const defaultApp = parsed.find((a) => a.id === selectedAppId) || parsed[0] || null;
          if (defaultApp) {
            setSelectedAppId(defaultApp.id);
            syncFormFields(defaultApp);
          }
          showStatus("App registry loaded from /etc/customAppRegistry.json successfully.", false);
        } else {
          showStatus("Registry read error: JSON was not an array of apps.", true);
        }
      } else {
        showStatus("Registry file /etc/customAppRegistry.json is empty or missing.", true);
      }
    } catch (err: any) {
      showStatus(`Error reading registry file: ${err.message}`, true);
    }
  };

  useEffect(() => {
    loadRegistryFromVFS();
  }, []);

  const syncFormFields = (app: AppInfo) => {
    setSelectedApp(app);
    setAppName(app.name);
    setAppDescription(app.description);
    setAppVersion(app.version);
    setAppAuthor(app.author);
    setAppDependencies(app.dependencies ? app.dependencies.join(", ") : "");
    setAppIcon(app.icon || "layout");
    setAppPath(app.path || "");
    setAppPathType(app.pathType || "internal");
  };

  const handleSelectApp = (appId: string) => {
    setSelectedAppId(appId);
    const app = apps.find((a) => a.id === appId);
    if (app) {
      syncFormFields(app);
    }
  };

  const showStatus = (text: string, error: boolean) => {
    setStatusMessage({ text, error });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const handleUpdateApp = () => {
    if (!selectedApp) return;

    const updatedApps = apps.map((app) => {
      if (app.id === selectedApp.id) {
        return {
          ...app,
          name: appName,
          description: appDescription,
          version: appVersion,
          author: appAuthor,
          dependencies: appDependencies.split(",").map((d) => d.trim()).filter(Boolean),
          icon: appIcon,
          path: appPath,
          pathType: appPathType,
        };
      }
      return app;
    });

    setApps(updatedApps);
    const matched = updatedApps.find(a => a.id === selectedAppId);
    if (matched) setSelectedApp(matched);
    showStatus("Local application metadata updated. Press 'Save Registry to Disk' to persist changes.", false);
  };

  const bumpVersion = () => {
    // Regular expression to find any three-part semver
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
    const match = appVersion.trim().match(semverRegex);
    
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      const patch = parseInt(match[3], 10);
      // Bump patch version
      const newVer = `${major}.${minor}.${patch + 1}`;
      setAppVersion(newVer);
      
      // Update locally
      if (selectedApp) {
        const updatedApps = apps.map((app) => {
          if (app.id === selectedApp.id) {
            return {
              ...app,
              version: newVer,
              name: appName,
              description: appDescription,
              author: appAuthor,
              dependencies: appDependencies.split(",").map((d) => d.trim()).filter(Boolean),
              icon: appIcon,
              path: appPath,
              pathType: appPathType,
            };
          }
          return app;
        });

        setApps(updatedApps);
        const matched = updatedApps.find(a => a.id === selectedAppId);
        if (matched) setSelectedApp(matched);
      }
      showStatus(`Bumped patch version to ${newVer} successfully!`, false);
    } else {
      // Not strict semver; just add/increment suffix
      const digits = appVersion.match(/\d+$/);
      if (digits) {
        const num = parseInt(digits[0], 10) + 1;
        const newVer = appVersion.substring(0, appVersion.length - digits[0].length) + num;
        setAppVersion(newVer);
        showStatus(`Bumped trailing number version to ${newVer}`, false);
      } else {
        const newVer = appVersion + ".1";
        setAppVersion(newVer);
        showStatus(`Appended extension. New version set to ${newVer}`, false);
      }
    }
  };

  const handleAddNewApp = () => {
    const newId = `customApp_${Date.now().toString().slice(-4)}`;
    const newApp: AppInfo = {
      id: newId,
      name: "New Guest Application",
      description: "Custom user-generated executable system utility",
      version: "1.0.0",
      author: syscall.getCurrentUser(),
      dependencies: [],
      icon: "layout",
      path: `/home/guest/new_app_${newId}.tsx`,
      pathType: "internal"
    };

    const nextApps = [...apps, newApp];
    setApps(nextApps);
    setSelectedAppId(newId);
    syncFormFields(newApp);
    showStatus("Created a new dynamic application container shell in memory. Edit and save to write to disk.", false);
  };

  const handleDeleteApp = (id: string) => {
    if (id === "desktopEnv") {
      showStatus("Critical Security Halt: Cannot delete the Desktop Environment app shell registry!", true);
      return;
    }

    const filtered = apps.filter((app) => app.id !== id);
    setApps(filtered);
    if (selectedAppId === id) {
      if (filtered.length > 0) {
        setSelectedAppId(filtered[0].id);
        syncFormFields(filtered[0]);
      } else {
        setSelectedApp(null);
      }
    }
    showStatus(`Removed application ${id} directory records. Click 'Save' to save modifications.`, false);
  };

  const handleSaveToVFS = () => {
    try {
      const serialized = JSON.stringify(apps, null, 2);
      const ok = syscall.writeFile("/etc/customAppRegistry.json", serialized);
      if (ok) {
        showStatus("Perfect! Save successful. System manifest fully propagated to VFS.", false);
      } else {
        showStatus("Write Permission Error: VFS returned failure when writing /etc/customAppRegistry.json.", true);
      }
    } catch (err: any) {
      showStatus(`Serialization Error: Failed to stringify/save: ${err.message}`, true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#d4d0c8] text-black font-sans text-xs select-none select-text pb-2 p-1 overflow-hidden">
      {/* Dynamic Status Banner */}
      {statusMessage && (
        <div className={`p-2.5 mb-1.5 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white text-[11px] flex items-center space-x-2 font-mono ${statusMessage.error ? "bg-red-950 text-red-200 border-red-500" : "bg-teal-950 text-teal-200 border-teal-500"}`}>
          <div className={`w-2 h-2 rounded-full ${statusMessage.error ? "bg-red-500 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Panel Content (Splits side listing and form fields details) */}
      <div className="flex-1 flex space-x-1.5 min-h-0">
        
        {/* Left Side App list */}
        <div className="w-1/3 bg-white border-t-2 border-l-2 border-t-[#808080] border-l-[#808080] border-r border-b border-r-white border-b-white flex flex-col p-1.5 min-h-0">
          <span className="text-[10px] text-gray-500 font-bold uppercase font-mono tracking-wider mb-1 flex items-center space-x-1">
            <Layers className="w-3 h-3 text-slate-800" />
            <span>Registered Software</span>
          </span>
          
          <div className="flex-1 overflow-y-auto divide-y divide-[#eceae6] border border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#fafafa]">
            {apps.map((app) => {
              const isSelected = app.id === selectedAppId;
              return (
                <div
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`p-2.5 cursor-pointer transition-colors flex flex-col text-[11px] ${
                    isSelected
                      ? "bg-[#002080] text-white"
                      : "hover:bg-[#dfdbd3] text-black"
                  }`}
                >
                  <span className="font-bold flex items-center justify-between">
                    <span>{app.name}</span>
                    <span className="text-[9.5px] font-mono font-extrabold tracking-tight opacity-80 bg-black/10 px-1 py-0.5 rounded">
                      v{app.version}
                    </span>
                  </span>
                  <span className={`text-[9.5px] font-mono shrink mt-0.5 mt-1 block truncate ${isSelected ? "text-gray-200" : "text-gray-500"}`}>
                    ID: {app.id}
                  </span>
                  {app.path && (
                    <span className={`text-[9px] font-mono shrink mt-1 block truncate p-1 rounded border ${
                      isSelected 
                        ? "text-amber-200 bg-white/10 border-white/10" 
                        : "text-[#505050] bg-gray-100 border-gray-200"
                    }`}>
                      🛰️ {app.pathType === "web" ? "WEB" : "VFS"}: {app.path}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 flex items-center space-x-1">
            <button
              onClick={handleAddNewApp}
              className="flex-1 active:bg-[#dfdbd3] active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white bg-[#d4d0c8] border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-1.5 px-2 font-bold font-sans text-center transition-all shadow-[inset_1px_1px_0_rgba(255,255,255,0.95)] flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5 text-slate-800" />
              <span>Create App Shell</span>
            </button>
            <button
              onClick={() => handleDeleteApp(selectedAppId)}
              disabled={selectedAppId === "desktopEnv"}
              className="active:bg-[#dfdbd3] active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white bg-[#d4d0c8] border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-1.5 px-2.5 font-bold font-sans text-center transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center"
              title="Delete app"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-700" />
            </button>
          </div>
        </div>

        {/* Right Side Editing Controls Panel Form */}
        <div className="flex-1 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-3 flex flex-col min-h-0 space-y-2.5">
          {selectedApp ? (
            <>
              {/* Heading Metadata Header Card */}
              <div className="bg-[#b8b4ac] p-3.5 border border-t-[#808080] border-l-[#808080] border-r-white border-b-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-[12px] uppercase tracking-wide text-slate-900">
                    Editing Application Metadata
                  </h3>
                  <div className="text-[10px] font-mono text-gray-700 mt-0.5">
                    UUID Identifier: <span className="font-bold">{selectedApp.id}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-emerald-800 font-extrabold bg-white border border-[#808080] px-1.5 py-0.5 flex items-center space-x-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span>Active Manifest Entry</span>
                  </span>
                </div>
              </div>

              {/* Editable Configuration Fields Form Grid */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[11px]">
                
                {/* App Name */}
                <div className="flex flex-col space-y-1">
                  <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                    <FileText className="w-3 h-3 text-slate-700" />
                    <span>Application Name</span>
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-b-white border-r-white p-1.5 text-[11px] font-bold outline-none text-black selection:bg-slate-300"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col space-y-1">
                  <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                    <HelpCircle className="w-3 h-3 text-slate-700" />
                    <span>Description / Core Policy Statement</span>
                  </label>
                  <textarea
                    rows={2}
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    className="bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-b-white border-r-white p-1.5 text-[11px] outline-none text-black resize-none selection:bg-slate-300"
                  />
                </div>

                {/* Version and Icon Side-By-Side Row */}
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* Version */}
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                      <Hash className="w-3 h-3 text-slate-700" />
                      <span>Release Version</span>
                    </label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={appVersion}
                        onChange={(e) => setAppVersion(e.target.value)}
                        className="flex-1 bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-b-white border-r-white p-1.5 text-[11px] font-mono outline-none text-black selection:bg-slate-300"
                      />
                      <button
                        onClick={bumpVersion}
                        className="bg-[#d4d0c8] hover:bg-[#c0c0c0] active:bg-[#a8a8a8] border-t border-l border-t-white border-l-white border-r border-b border-r-[#808080] border-b-[#808080] px-2 font-mono font-bold text-center text-[10px] flex items-center space-x-1"
                        title="Bump patch version automatically"
                      >
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>BUMP</span>
                      </button>
                    </div>
                  </div>

                  {/* Icon Select */}
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                      <Layers className="w-3 h-3 text-slate-700" />
                      <span>Launcher Icon</span>
                    </label>
                    <select
                      value={appIcon}
                      onChange={(e) => setAppIcon(e.target.value)}
                      className="bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-b-white border-r-white p-1.5 text-[11px] outline-none text-black cursor-pointer"
                    >
                      <option value="monitor">monitor (Desktop/Terminal)</option>
                      <option value="terminal">terminal (Terminal)</option>
                      <option value="folder">folder (Explorer)</option>
                      <option value="file-text">file-text (Editor)</option>
                      <option value="cpu">cpu (System Monitor)</option>
                      <option value="gamepad">gamepad (Minesweeper)</option>
                      <option value="globe">globe (Browser)</option>
                      <option value="settings">settings (Configurator)</option>
                      <option value="palette">palette (Theme Designer)</option>
                      <option value="image">image (Photo Viewer)</option>
                      <option value="video">video (Video Player)</option>
                      <option value="music">music (Audio Stream)</option>
                      <option value="layout">layout (Default shell)</option>
                    </select>
                  </div>
                </div>

                {/* Author Details */}
                <div className="flex flex-col space-y-1">
                  <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                    <User className="w-3 h-3 text-slate-700" />
                    <span>Software Author / Development Group</span>
                  </label>
                  <input
                    type="text"
                    value={appAuthor}
                    onChange={(e) => setAppAuthor(e.target.value)}
                    className="bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-b-white border-r-white p-1.5 text-[11px] outline-none text-black selection:bg-slate-300"
                  />
                </div>

                {/* Dependencies Comma-List */}
                <div className="flex flex-col space-y-1">
                  <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                    <GitBranch className="w-3 h-3 text-slate-700" />
                    <span>System Dependencies (Comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={appDependencies}
                    onChange={(e) => setAppDependencies(e.target.value)}
                    placeholder="e.g. VFS, Kernel, syslog.service"
                    className="bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-[#808080] border-b-white border-r-white p-1.5 text-[11px] font-mono outline-none text-black selection:bg-slate-300"
                  />
                  <span className="text-[9.5px] text-gray-500 font-mono italic">
                    Declares which process resources are queried on startup.
                  </span>
                </div>

                {/* Source Path */}
                <div className="flex flex-col space-y-1">
                  <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                    <FileText className="w-3 h-3 text-slate-700" />
                    <span>Application Main Path / URI</span>
                  </label>
                  <input
                    type="text"
                    value={appPath}
                    onChange={(e) => setAppPath(e.target.value)}
                    placeholder="e.g. /home/guest/my_app.tsx or https://unpkg.com/..."
                    className="bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-[#808080] border-b-white border-r-white p-1.5 text-[11px] font-mono outline-none text-black selection:bg-slate-300"
                  />
                  <span className="text-[9.5px] text-gray-500 font-mono italic">
                    Location of the executable source code. Leave empty for traditional system built-ins.
                  </span>
                </div>

                {/* Path Type */}
                <div className="flex flex-col space-y-1 pb-4">
                  <label className="font-bold flex items-center space-x-1.5 text-gray-800">
                    <Layers className="w-3 h-3 text-slate-700" />
                    <span>Path Loading Strategy</span>
                  </label>
                  <select
                    value={appPathType}
                    onChange={(e) => setAppPathType(e.target.value as "web" | "internal")}
                    className="bg-white border-t border-l border-t-[#808080] border-l-[#808080] border-b border-r border-b-white border-r-white p-1.5 text-[11px] outline-none text-black cursor-pointer"
                  >
                    <option value="internal">internal (VFS path)</option>
                    <option value="web">web (Direct HTTP fetch)</option>
                  </select>
                </div>

              </div>

              {/* Foot Controls buttons layout */}
              <div className="flex items-center space-x-1.5 pt-2 border-t border-[#808080]/30 shrink-0">
                <button
                  onClick={handleUpdateApp}
                  className="bg-[#d4d0c8] hover:bg-[#c0c0c0] active:bg-[#dfdbd3] active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-1.5 px-3 font-bold transition-all shadow-[inset_1px_1px_0_rgba(255,255,255,0.95)] flex items-center justify-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-slate-800" />
                  <span>Update Fields</span>
                </button>
                <div className="flex-1" />
                <button
                  onClick={loadRegistryFromVFS}
                  className="bg-[#d4d0c8] hover:bg-[#c0c0c0] active:bg-[#dfdbd3] active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] py-1.5 px-3 font-bold transition-all shadow-[inset_1px_1px_0_rgba(255,255,255,0.95)] flex items-center justify-center space-x-1"
                  title="Discard unsaved edits and reload original VFS file state"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-800" />
                  <span>Reload VFS</span>
                </button>
                <button
                  onClick={handleSaveToVFS}
                  className="bg-[#002080] hover:bg-[#001060] text-white border-t-2 border-l-2 border-r-2 border-b-2 border-t-white/30 border-l-white/30 border-r-[#000030] border-b-[#000030] py-1.5 px-3.5 font-bold transition-all flex items-center justify-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>Save Registry to Disk</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <span className="text-4xl animate-bounce mb-2">👾</span>
              <p className="font-bold">No application selected.</p>
              <p className="text-[10px]">Select or spawn a software container shell on the left to begin configuring metadata options.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
