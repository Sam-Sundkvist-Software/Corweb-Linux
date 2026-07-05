import React, { useState, useEffect } from "react";
import { SystemCallInterface, NodeType } from "../../types/os";
import { 
  Folder, 
  File, 
  ArrowLeft, 
  CornerDownRight, 
  Plus, 
  Search, 
  FolderPlus,
  RefreshCw,
  HardDrive
} from "lucide-react";

interface FileDialogAppProps {
  syscall: SystemCallInterface;
  args?: string[];
  onClose: (paths: string[]) => void;
  onCancel: () => void;
}

interface DialogConfig {
  mode: "open" | "save";
  selectType: "file" | "folder" | "both";
  multiselect?: boolean;
  initialPath?: string;
  allowedExtensions?: string[]; // e.g., [".txt", ".json"]
}

export default function FileDialogApp({
  syscall,
  args,
  onClose,
  onCancel,
}: FileDialogAppProps) {
  // Parse dialog config options from arguments
  const config: DialogConfig = React.useMemo(() => {
    try {
      if (args && args[0]) {
        return JSON.parse(args[0]);
      }
    } catch (e) {
      console.error("Failed to parse FileDialog arguments:", e);
    }
    return {
      mode: "open",
      selectType: "file",
      multiselect: false,
      initialPath: "/home/tux",
    };
  }, [args]);

  const [cwd, setCwd] = useState(() => {
    if (config.initialPath) {
      if (config.initialPath.endsWith(".txt") || config.initialPath.includes(".")) {
        // extract folder of file path
        const parts = config.initialPath.split("/");
        parts.pop();
        return parts.join("/") || "/";
      }
      return config.initialPath;
    }
    return "/home/tux";
  });

  const [items, setItems] = useState<{ name: string; type: NodeType }[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [saveFileName, setSaveFileName] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [extensionFilter, setExtensionFilter] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshDir = () => {
    try {
      const list = syscall.listDir(cwd) || [];
      setItems(list);
      setErrorMsg("");
    } catch {
      setErrorMsg(`Could not read the contents of folder "${cwd}"`);
    }
  };

  useEffect(() => {
    refreshDir();
    setSelectedNames([]);
    setShowNewFolderInput(false);
    setNewFolderName("");
  }, [cwd, syscall]);

  const handleCdUp = () => {
    if (cwd === "/") return;
    const parts = cwd.split("/").filter(Boolean);
    const parentPath = parts.length <= 1 ? "/" : "/" + parts.slice(0, parts.length - 1).join("/");
    setCwd(parentPath);
  };

  const handleCreateDirectory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const sanitized = newFolderName.trim();
    const dest = cwd === "/" ? `/${sanitized}` : `${cwd}/${sanitized}`;
    
    const ok = syscall.createDirectory(dest);
    if (ok) {
      setNewFolderName("");
      setShowNewFolderInput(false);
      refreshDir();
    } else {
      setErrorMsg("Failed to create folder. Permission denied.");
    }
  };

  const handleItemClick = (name: string, type: NodeType) => {
    if (config.multiselect) {
      if (selectedNames.includes(name)) {
        setSelectedNames(prev => prev.filter(n => n !== name));
      } else {
        setSelectedNames(prev => [...prev, name]);
      }
    } else {
      setSelectedNames([name]);
      if (config.mode === "save" && type === NodeType.FILE) {
        setSaveFileName(name);
      }
    }
  };

  const handleItemDoubleClick = (name: string, type: NodeType) => {
    const fullPath = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    if (type === NodeType.DIRECTORY) {
      setCwd(fullPath);
    } else {
      // In open mode, double clicking a file opens it
      if (config.mode === "open" && (config.selectType === "file" || config.selectType === "both")) {
        onClose([fullPath]);
      }
    }
  };

  // Run validation and submit selected nodes
  const handleSubmit = () => {
    if (config.mode === "save") {
      if (!saveFileName.trim()) {
        setErrorMsg("Please enter a valid file name to save.");
        return;
      }
      const finalFileName = saveFileName.trim();
      const savePath = cwd === "/" ? `/${finalFileName}` : `${cwd}/${finalFileName}`;
      
      // Access/existence validation
      try {
        // If file exists, prompt for overwrite verification
        const existingFiles = syscall.listDir(cwd) || [];
        const exists = existingFiles.some(f => f.name === finalFileName && f.type === NodeType.FILE);
        
        if (exists) {
          if (syscall.openDialog) {
            syscall.openDialog(
              "Overwrite Confirmation",
              `The file '${finalFileName}' already exists in '${cwd}'. Do you wish to overwrite its parameters?`,
              "question",
              ["Yes", "No"],
              (res: any) => {
                if (res === "Yes") {
                  onClose([savePath]);
                }
              }
            );
          } else {
            // Callback-less fallback
            onClose([savePath]);
          }
        } else {
          onClose([savePath]);
        }
      } catch {
        onClose([savePath]);
      }
    } else {
      // Open mode
      let targets = selectedNames;
      
      // If there's no item explicitly checked, check if saveFileName contains a valid typed node or single fallback
      if (targets.length === 0) {
        if (saveFileName.trim()) {
          targets = [saveFileName.trim()];
        } else {
          setErrorMsg("Please select a file or folder first.");
          return;
        }
      }

      const paths = targets.map(name => {
        if (name.startsWith("/")) return name; // Absolute shortcut
        return cwd === "/" ? `/${name}` : `${cwd}/${name}`;
      });

      // Basic existence checking
      const invalidPaths: string[] = [];
      paths.forEach(p => {
        try {
          const name = p.split("/").pop() || "";
          const parent = p.substring(0, p.lastIndexOf("/")) || "/";
          const list = syscall.listDir(parent) || [];
          const exists = list.some(item => item.name === name);
          if (!exists && p !== "/") {
            invalidPaths.push(p);
          }
        } catch {
          invalidPaths.push(p);
        }
      });

      if (invalidPaths.length > 0) {
        setErrorMsg(`Validation Failure: Target(s) do not exist: ${invalidPaths.join(", ")}`);
        return;
      }

      // Filter by selection rules
      const filteredPaths = paths.filter(p => {
        try {
          const name = p.split("/").pop() || "";
          const parent = p.substring(0, p.lastIndexOf("/")) || "/";
          const list = syscall.listDir(parent) || [];
          const node = list.find(item => item.name === name);
          if (!node) return p === "/"; // root folder
          
          if (config.selectType === "file" && node.type !== NodeType.FILE) return false;
          if (config.selectType === "folder" && node.type !== NodeType.DIRECTORY) return false;
          return true;
        } catch {
          return true;
        }
      });

      if (filteredPaths.length === 0) {
        setErrorMsg(`Selection Type Mismatch: Please select a ${config.selectType} node.`);
        return;
      }

      onClose(filteredPaths);
    }
  };

  // Filter listed files based on search and file extensions
  const filteredItems = items.filter(item => {
    // Search match
    if (searchFilter.trim() && !item.name.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    // Extension match
    if (item.type === NodeType.FILE && config.allowedExtensions && config.allowedExtensions.length > 0) {
      if (extensionFilter !== "all") {
        return item.name.toLowerCase().endsWith(extensionFilter);
      }
      return config.allowedExtensions.some(ext => item.name.toLowerCase().endsWith(ext.toLowerCase()));
    }
    return true;
  });

  const shortcuts = [
    { name: "Root VFS (/) ", path: "/" },
    { name: "Home (/home/tux)", path: "/home/tux" },
    { name: "Desktop", path: "/home/tux/Desktop" },
    { name: "Documents", path: "/home/tux/Documents" },
    { name: "Music Hub", path: "/home/tux/Music" },
    { name: "Video Cluster", path: "/home/tux/Videos" }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#ede9e2] text-black text-left font-sans select-none min-h-0 h-full border-t border-t-white border-l border-l-white">
      {/* Top Navbar Navigational Conduit */}
      <div className="bg-[#d4d0c8] p-2 border-b border-[#bab3a8] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCdUp}
            disabled={cwd === "/"}
            className="p-1 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-gray-200 active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white disabled:opacity-40 cursor-pointer"
            title="Up One Directory Level"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => refreshDir()}
            className="p-1 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-gray-200 active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setShowNewFolderInput(!showNewFolderInput)}
            className="px-2 py-1 bg-[#d4d0c8] text-xs font-semibold border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-gray-200 active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-emerald-800" />
            <span>Folder</span>
          </button>
        </div>

        {/* Cwd Path text block */}
        <div className="flex-1 flex items-center bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-2 py-0.5 text-xs text-gray-800 min-w-0">
          <span className="text-[10px] text-gray-500 font-bold font-mono mr-1 shrink-0">Look in:</span>
          <span className="font-mono text-[11px] truncate select-all outline-none" title={cwd}>{cwd}</span>
        </div>

        {/* Live Filter query search container */}
        <div className="flex items-center bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-1.5 py-0.5 max-w-[140px] shrink-0">
          <Search className="w-3 h-3 text-gray-400 mr-1" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search VFS"
            className="bg-transparent border-none outline-none text-[10px] w-full text-gray-800"
          />
        </div>
      </div>

      {/* New folder inline prompt box */}
      {showNewFolderInput && (
        <form onSubmit={handleCreateDirectory} className="p-2 bg-yellow-50 border-b border-yellow-200 flex items-center space-x-2 shrink-0">
          <span className="text-[10px] font-bold text-amber-900 uppercase">New Directory:</span>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Format: notes_folder|documents"
            className="flex-1 text-[11px] px-2 py-0.5 border border-[#808080] rounded outline-none font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="bg-[#d4d0c8] text-xs px-2 py-0.5 border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-gray-200 cursor-pointer text-gray-800 font-bold"
          >
            Create
          </button>
        </form>
      )}

      {/* Middle main viewport content area (split screen sidebar + list) */}
      <div className="flex-1 flex min-h-0 min-w-0 bg-white">
        {/* Left hand locations sidebar */}
        <div className="w-32 bg-[#eeeeec] border-r border-[#babdb6] flex flex-col p-1.5 space-y-1 select-none overflow-y-auto shrink-0">
          <div className="text-[9px] font-extrabold uppercase text-gray-500 tracking-wider mb-1 px-1">Places</div>
          {shortcuts.map((shortcut) => {
            const isCurrent = cwd === shortcut.path;
            return (
              <button
                key={shortcut.path}
                onClick={() => setCwd(shortcut.path)}
                className={`w-full text-left font-sans text-[10.5px] px-1.5 py-1 flex items-center space-x-1.5 rounded-sm transition-colors text-gray-800 ${
                  isCurrent 
                    ? "bg-[#002080] text-white font-bold" 
                    : "hover:bg-[#d4d0c8]/50"
                }`}
              >
                <HardDrive className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-amber-300" : "text-gray-500"}`} />
                <span className="truncate">{shortcut.name}</span>
              </button>
            );
          })}
        </div>

        {/* Central main listed explorer contents */}
        <div className="flex-1 flex flex-col p-2 min-w-0 overflow-hidden font-mono text-[11px]">
          {errorMsg ? (
            <div className="bg-red-50 text-red-900 p-2 text-xs border border-red-200 select-text font-bold mb-2 break-all overflow-y-auto max-h-[100px]">
              {errorMsg}
            </div>
          ) : null}

          {/* List display container */}
          <div className="flex-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white overflow-y-auto min-h-0 select-text p-1 grid grid-cols-1 gap-0.5">
            {filteredItems.length === 0 ? (
              <div className="text-gray-400 italic text-[10px] text-center p-8 select-none">
                No matching VFS entries found in directory
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedNames.includes(item.name);
                const isDir = item.type === NodeType.DIRECTORY;
                return (
                  <div
                    key={item.name}
                    onClick={() => handleItemClick(item.name, item.type)}
                    onDoubleClick={() => handleItemDoubleClick(item.name, item.type)}
                    className={`flex items-center space-x-2 px-2 py-1 select-none cursor-pointer border border-transparent ${
                      isSelected 
                        ? "bg-[#002080] text-white border-[#001040]" 
                        : "hover:bg-[#002080]/10 text-gray-800"
                    }`}
                  >
                    {/* Multiselect Checkbox */}
                    {config.multiselect && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Click handled by div wrapper
                        className="mr-1 accent-blue-900 select-none pointer-events-none"
                      />
                    )}
                    
                    {isDir ? (
                      <Folder className={`w-3.5 h-3.5 ${isSelected ? "text-amber-300" : "text-amber-600 fill-amber-100"}`} />
                    ) : (
                      <File className={`w-3.5 h-3.5 ${isSelected ? "text-sky-200" : "text-gray-500 fill-gray-100"}`} />
                    )}
                    <span className="truncate flex-1">{item.name}</span>
                    <span className="text-[9px] uppercase tracking-normal opacity-60 text-right pr-1 shrink-0 select-none">
                      {isDir ? "Folder" : "File"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Save/File-Details conduit */}
      <div className="bg-[#d4d0c8] p-3 border-t border-[#bab3a8] flex flex-col space-y-2.5 shrink-0 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-[#303030] font-bold w-22 text-right">File name:</span>
          <div className="flex-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-0.5">
            <input
              type="text"
              value={config.mode === "save" ? saveFileName : (selectedNames.join(", ") || saveFileName)}
              onChange={(e) => {
                setSaveFileName(e.target.value);
                if (config.mode === "open") {
                  setSelectedNames([e.target.value]);
                }
              }}
              placeholder={config.mode === "save" ? "e.g. notes.txt" : "Select or enter filename"}
              className="w-full bg-transparent outline-none border-none text-[11px] font-mono text-gray-800 p-0.5 select-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
        </div>

        {/* Extensions filter picker dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[#303030] font-bold w-22 text-right">Files of type:</span>
          <div className="bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-0.5 w-[200px]">
            <select
              value={extensionFilter}
              onChange={(e) => setExtensionFilter(e.target.value)}
              className="w-full bg-transparent outline-none border-none text-[10.5px] cursor-pointer text-gray-800 font-sans font-medium"
            >
              <option value="all">All Available Files (*.*)</option>
              {config.allowedExtensions && config.allowedExtensions.map(ext => (
                <option key={ext} value={ext.toLowerCase()}>
                  Files (*{ext.toLowerCase()})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1" />

          {/* Cancel and OK submission controls */}
          <div className="flex space-x-1.5 shrink-0">
            <button
              onClick={handleSubmit}
              className="px-5 py-1 bg-[#d4d0c8] text-black font-bold border-2 border-t-white border-l-white border-r-black border-b-black hover:bg-[#c4c0b8] active:border-t-black active:border-l-black active:border-r-white active:border-b-white text-[10.5px] uppercase select-none min-w-[75px]"
            >
              {config.mode === "save" ? "Save" : "Open"}
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-1 bg-[#d4d0c8] text-black font-medium border-2 border-t-white border-l-white border-r-black border-b-black hover:bg-[#c4c0b8] active:border-t-black active:border-l-black active:border-r-white active:border-b-white text-[10.5px] uppercase select-none min-w-[75px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
