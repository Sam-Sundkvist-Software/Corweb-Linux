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
import uiStrings from "../../data/uiStrings.json";
import appRegistryConfig from "../../data/appRegistryConfig.json";

interface AppRegistryAppProps {
  syscall: SystemCallInterface;
}

const strings = uiStrings.AppRegistryApp;

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
      const content = syscall.readFile(appRegistryConfig.registryPath);
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
          showStatus(strings.registryLoaded, false);
        } else {
          showStatus(strings.registryJsonError, true);
        }
      } else {
        showStatus(strings.registryMissingError, true);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showStatus(`${strings.registryMissingError} (${errMsg})`, true);
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
    showStatus(strings.localManifestUpdated, false);
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
    const uniqueSuffix = Date.now().toString().slice(-4);
    const newId = `${appRegistryConfig.defaultAppIdPrefix}${uniqueSuffix}`;
    const defaultPath = appRegistryConfig.defaultAppPathPattern.replace("{id}", newId);
    
    const newApp: AppInfo = {
      id: newId,
      name: appRegistryConfig.newAppDefaults.name,
      description: appRegistryConfig.newAppDefaults.description,
      version: appRegistryConfig.newAppDefaults.version,
      author: syscall.getCurrentUser(),
      dependencies: [],
      icon: appRegistryConfig.newAppDefaults.icon,
      path: defaultPath,
      pathType: appRegistryConfig.newAppDefaults.pathType as "web" | "internal"
    };

    const nextApps = [...apps, newApp];
    setApps(nextApps);
    setSelectedAppId(newId);
    syncFormFields(newApp);
    showStatus("Created a new dynamic application container shell in memory. Edit and save to write to disk.", false);
  };

  const handleDeleteApp = (id: string) => {
    if (id === "desktopEnv") {
      showStatus(strings.securityHaltError, true);
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
    showStatus(strings.removedAppSuccess.replace("{id}", id), false);
  };

  const handleSaveToVFS = () => {
    try {
      const serialized = JSON.stringify(apps, null, 2);
      const ok = syscall.writeFile(appRegistryConfig.registryPath, serialized);
      if (ok) {
        showStatus(strings.vfsSaveSuccess, false);
      } else {
        showStatus(strings.vfsWriteError, true);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showStatus(`Serialization Error: Failed to stringify/save: ${errMsg}`, true);
    }
  };

  return (
    <div className="tlnx-registry-container">
      {/* Dynamic Status Banner */}
      {statusMessage && (
        <div className={`tlnx-registry-status ${statusMessage.error ? "tlnx-error" : "tlnx-success"}`}>
          <div className="tlnx-led" />
          <span className="tlnx-status-text">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Panel Content (Splits side listing and form fields details) */}
      <div className="tlnx-registry-main">
        
        {/* Left Side App list */}
        <div className="tlnx-registry-sidebar">
          <span className="tlnx-registry-sidebar-header">
            <Layers className="w-3 h-3 text-slate-800" />
            <span>{strings.registeredSoftware}</span>
          </span>
          
          <div className="tlnx-registry-list">
            {apps.map((app) => {
              const isSelected = app.id === selectedAppId;
              return (
                <div
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`tlnx-registry-item ${isSelected ? "tlnx-selected" : ""}`}
                >
                  <span className="tlnx-item-title-row">
                    <span>{app.name}</span>
                    <span className="tlnx-item-version">
                      v{app.version}
                    </span>
                  </span>
                  <span className={`tlnx-item-id ${isSelected ? "tlnx-selected-text" : "tlnx-muted-text"}`}>
                    ID: {app.id}
                  </span>
                  {app.path && (
                    <span className={`tlnx-item-path ${isSelected ? "tlnx-selected-path" : "tlnx-muted-path"}`}>
                      🛰️ {app.pathType === "web" ? "WEB" : "VFS"}: {app.path}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="tlnx-registry-sidebar-actions">
            <button
              onClick={handleAddNewApp}
              className="tlnx-btn-classic"
              style={{ flex: 1 }}
            >
              <Plus className="w-3.5 h-3.5 text-slate-800" />
              <span>{strings.createAppShell}</span>
            </button>
            <button
              onClick={() => handleDeleteApp(selectedAppId)}
              disabled={selectedAppId === "desktopEnv"}
              className="tlnx-btn-classic"
              title="Delete app"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-700" />
            </button>
          </div>
        </div>

        {/* Right Side Editing Controls Panel Form */}
        <div className="tlnx-registry-editor">
          {selectedApp ? (
            <>
              {/* Heading Metadata Header Card */}
              <div className="tlnx-registry-editor-header">
                <div className="tlnx-header-title-box">
                  <h3>
                    {strings.editingMetadata}
                  </h3>
                  <div className="tlnx-header-uuid">
                    {strings.uuidIdentifier} <span>{selectedApp.id}</span>
                  </div>
                </div>
                <div>
                  <span className="tlnx-header-badge">
                    <span className="tlnx-badge-pulse" />
                    <span>{strings.activeManifest}</span>
                  </span>
                </div>
              </div>

              {/* Editable Configuration Fields Form Grid */}
              <div className="tlnx-registry-editor-body">
                
                {/* App Name */}
                <div className="tlnx-registry-field">
                  <label className="tlnx-field-label">
                    <FileText className="w-3 h-3 text-slate-700" />
                    <span>{strings.appName}</span>
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="tlnx-field-input tlnx-font-bold"
                  />
                </div>

                {/* Description */}
                <div className="tlnx-registry-field">
                  <label className="tlnx-field-label">
                    <HelpCircle className="w-3 h-3 text-slate-700" />
                    <span>{strings.descriptionLabel}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    className="tlnx-field-textarea"
                  />
                </div>

                {/* Version and Icon Side-By-Side Row */}
                <div className="tlnx-registry-grid-2">
                  
                  {/* Version */}
                  <div className="tlnx-registry-field">
                    <label className="tlnx-field-label">
                      <Hash className="w-3 h-3 text-slate-700" />
                      <span>{strings.releaseVersion}</span>
                    </label>
                    <div className="tlnx-field-row">
                      <input
                        type="text"
                        value={appVersion}
                        onChange={(e) => setAppVersion(e.target.value)}
                        className="tlnx-field-input tlnx-font-mono"
                      />
                      <button
                        onClick={bumpVersion}
                        className="tlnx-btn-classic"
                        title="Bump patch version automatically"
                      >
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>{strings.bumpBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* Icon Select */}
                  <div className="tlnx-registry-field">
                    <label className="tlnx-field-label">
                      <Layers className="w-3 h-3 text-slate-700" />
                      <span>{strings.launcherIcon}</span>
                    </label>
                    <select
                      value={appIcon}
                      onChange={(e) => setAppIcon(e.target.value)}
                      className="tlnx-field-select"
                    >
                      {appRegistryConfig.launcherIcons.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Author Details */}
                <div className="tlnx-registry-field">
                  <label className="tlnx-field-label">
                    <User className="w-3 h-3 text-slate-700" />
                    <span>{strings.softwareAuthor}</span>
                  </label>
                  <input
                    type="text"
                    value={appAuthor}
                    onChange={(e) => setAppAuthor(e.target.value)}
                    className="tlnx-field-input"
                  />
                </div>

                {/* Dependencies Comma-List */}
                <div className="tlnx-registry-field">
                  <label className="tlnx-field-label">
                    <GitBranch className="w-3 h-3 text-slate-700" />
                    <span>{strings.systemDependencies}</span>
                  </label>
                  <input
                    type="text"
                    value={appDependencies}
                    onChange={(e) => setAppDependencies(e.target.value)}
                    placeholder="e.g. VFS, Kernel, syslog.service"
                    className="tlnx-field-input tlnx-font-mono"
                  />
                  <span className="tlnx-field-hint">
                    {strings.dependenciesHint}
                  </span>
                </div>

                {/* Source Path */}
                <div className="tlnx-registry-field">
                  <label className="tlnx-field-label">
                    <FileText className="w-3 h-3 text-slate-700" />
                    <span>{strings.appMainPath}</span>
                  </label>
                  <input
                    type="text"
                    value={appPath}
                    onChange={(e) => setAppPath(e.target.value)}
                    placeholder="e.g. /home/guest/my_app.tsx or https://unpkg.com/..."
                    className="tlnx-field-input tlnx-font-mono"
                  />
                  <span className="tlnx-field-hint">
                    {strings.pathHint}
                  </span>
                </div>

                {/* Path Type */}
                <div className="tlnx-registry-field" style={{ paddingBottom: "1rem" }}>
                  <label className="tlnx-field-label">
                    <Layers className="w-3 h-3 text-slate-700" />
                    <span>{strings.loadingStrategy}</span>
                  </label>
                  <select
                    value={appPathType}
                    onChange={(e) => setAppPathType(e.target.value as "web" | "internal")}
                    className="tlnx-field-select"
                  >
                    <option value="internal">internal (VFS path)</option>
                    <option value="web">web (Direct HTTP fetch)</option>
                  </select>
                </div>

              </div>

              {/* Foot Controls buttons layout */}
              <div className="tlnx-registry-editor-footer">
                <button
                  onClick={handleUpdateApp}
                  className="tlnx-btn-classic"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-slate-800" />
                  <span>{strings.updateFields}</span>
                </button>
                <div className="tlnx-spacer" />
                <button
                  onClick={loadRegistryFromVFS}
                  className="tlnx-btn-classic"
                  title="Discard unsaved edits and reload original VFS file state"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-800" />
                  <span>{strings.reloadVfs}</span>
                </button>
                <button
                  onClick={handleSaveToVFS}
                  className="tlnx-btn-classic tlnx-btn-primary"
                >
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>{strings.saveRegistry}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="tlnx-registry-empty">
              <span className="tlnx-empty-icon">👾</span>
              <p className="tlnx-empty-title">{strings.noAppSelected}</p>
              <p className="tlnx-empty-hint">{strings.noAppSelectedHint}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
