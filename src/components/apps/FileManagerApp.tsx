import React, { useState, useEffect, useRef } from "react";
import { SystemCallInterface, NodeType } from "../../types/os";
import { 
  Folder, 
  File, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Download, 
  Search, 
  FileText, 
  FolderPlus, 
  CornerDownRight,
  RefreshCw,
  FolderOpen
} from "lucide-react";

interface FileManagerAppProps {
  syscall: SystemCallInterface;
  onLaunchApp: (appId: string, title: string, options?: { content?: string; width?: number; height?: number; args?: string[]; cwd?: string }) => void;
  currentGlobalCwd: string;
  onGlobalCwdChange: (path: string) => void;
}

export default function FileManagerApp({
  syscall,
  onLaunchApp,
  currentGlobalCwd,
  onGlobalCwdChange,
}: FileManagerAppProps) {
  const [cwd, setCwd] = useState(currentGlobalCwd || "/home/guest");
  const [items, setItems] = useState<{ name: string; type: NodeType }[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [renameInput, setRenameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // History stack for fast navigation
  const [historyBack, setHistoryBack] = useState<string[]>([]);
  const [historyForward, setHistoryForward] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDir = () => {
    try {
      const list = syscall.listDir(cwd) || [];
      setItems(list);
    } catch {
      setErrorMsg(`Could not read the contents of folder "${cwd}"`);
    }
  };

  useEffect(() => {
    refreshDir();
    setSelectedName(null);
    setIsRenaming(false);
    onGlobalCwdChange(cwd);
  }, [cwd, syscall]);

  const navigateTo = (newPath: string, pushHistory = true) => {
    if (pushHistory) {
      setHistoryBack((prev) => [...prev, cwd]);
      setHistoryForward([]); 
    }
    setCwd(newPath);
  };

  const handleCdUp = () => {
    if (cwd === "/") return;
    const parts = cwd.split("/").filter(Boolean);
    const parentPath = parts.length <= 1 ? "/" : "/" + parts.slice(0, parts.length - 1).join("/");
    navigateTo(parentPath);
  };

  const handleHistoryBack = () => {
    if (historyBack.length === 0) return;
    const prev = historyBack[historyBack.length - 1];
    setHistoryBack((p) => p.slice(0, p.length - 1));
    setHistoryForward((f) => [...f, cwd]);
    navigateTo(prev, false);
  };

  const handleHistoryForward = () => {
    if (historyForward.length === 0) return;
    const next = historyForward[historyForward.length - 1];
    setHistoryForward((f) => f.slice(0, f.length - 1));
    setHistoryBack((b) => [...b, cwd]);
    navigateTo(next, false);
  };

  const onItemClick = (name: string) => {
    setSelectedName(name);
    setRenameInput(name);
    setIsRenaming(false);
  };

  const onItemDoubleClick = (name: string, type: NodeType) => {
    const fullPath = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    if (type === NodeType.DIRECTORY) {
      navigateTo(fullPath);
    } else {
      // File launched! Open in a viewer
      const lower = name.toLowerCase();
      if ([".png", ".jpg", ".jpeg", ".gif", ".bmp"].some(ext => lower.endsWith(ext))) {
        onLaunchApp("imageViewerUF", `Image Viewer - ${name}`, { content: fullPath, width: 620, height: 460 });
      } else if ([".mp4", ".avi", ".mov", ".mkv", ".webm"].some(ext => lower.endsWith(ext))) {
        onLaunchApp("videoPlayerUF", `Video Player - ${name}`, { content: fullPath, width: 620, height: 485 });
      } else if ([".mp3", ".wav", ".ogg", ".flac", ".aac"].some(ext => lower.endsWith(ext))) {
        onLaunchApp("musicPlayerUF", `Music Player - ${name}`, { content: fullPath, width: 620, height: 460 });
      } else {
        onLaunchApp("leafpadUF", `Text Editor - ${name}`, { content: fullPath });
      }
    }
  };

  const handleCreateFile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    const sanitized = newItemName.trim();
    const dest = cwd === "/" ? `/${sanitized}` : `${cwd}/${sanitized}`;
    const ok = syscall.writeFile(dest, `[File created representing: ${sanitized}]`);
    if (ok) {
      setNewItemName("");
      refreshDir();
      setInfoMsg(`File "${sanitized}" successfully created.`);
      setTimeout(() => setInfoMsg(""), 3000);
    } else {
      setErrorMsg("Failed to create file. You may not have write privileges in this folder.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleCreateDirectory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    const sanitized = newItemName.trim();
    const dest = cwd === "/" ? `/${sanitized}` : `${cwd}/${sanitized}`;
    const ok = syscall.createDirectory(dest);
    if (ok) {
      setNewItemName("");
      refreshDir();
      setInfoMsg(`Folder "${sanitized}" successfully created.`);
      setTimeout(() => setInfoMsg(""), 3000);
    } else {
      setErrorMsg("Failed to create folder. Direction/Permission levels rejected the operation.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleDelete = () => {
    if (!selectedName) return;
    const dest = cwd === "/" ? `/${selectedName}` : `${cwd}/${selectedName}`;
    
    if (syscall.openDialog) {
      syscall.openDialog(
        "Delete Confirmation",
        `Are you sure you want to delete "${selectedName}"? This action is permanent.`,
        "question",
        ["Yes", "No"],
        (res) => {
          if (res === "Yes") {
            const ok = syscall.deleteNode(dest);
            if (ok) {
              setSelectedName(null);
              refreshDir();
              setInfoMsg(`"${selectedName}" has been permanently deleted.`);
              setTimeout(() => setInfoMsg(""), 3000);
            } else {
              syscall.openDialog!("Failed to Delete", "The kernel rejected this action. Check that the folder is empty or log in as administrator.", "error");
            }
          }
        }
      );
    } else {
      const ok = syscall.deleteNode(dest);
      if (ok) {
        setSelectedName(null);
        refreshDir();
        setInfoMsg(`"${selectedName}" has been successfully deleted.`);
        setTimeout(() => setInfoMsg(""), 3000);
      } else {
        setErrorMsg("Failed to delete element. Permission rules prevent changes to this location.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    }
  };

  const handleRenameSubmit = () => {
    if (!selectedName || !renameInput.trim() || renameInput === selectedName) {
      setIsRenaming(false);
      return;
    }
    const currentPath = cwd === "/" ? `/${selectedName}` : `${cwd}/${selectedName}`;
    const targetPath = cwd === "/" ? `/${renameInput.trim()}` : `${cwd}/${renameInput.trim()}`;

    const node = items.find((i) => i.name === selectedName);
    if (node) {
      if (node.type === NodeType.DIRECTORY) {
        const okNew = syscall.createDirectory(targetPath);
        if (okNew) {
          syscall.deleteNode(currentPath);
          refreshDir();
          setInfoMsg("Folder successfully renamed.");
        } else {
          setErrorMsg("Failed to rename folder.");
        }
      } else {
        const fileContent = syscall.readFile(currentPath);
        const okWrite = syscall.writeFile(targetPath, fileContent);
        if (okWrite) {
          syscall.deleteNode(currentPath);
          refreshDir();
          setInfoMsg("File successfully renamed.");
        } else {
          setErrorMsg("Failed to rename file.");
        }
      }
    }
    setIsRenaming(false);
    setSelectedName(null);
    setTimeout(() => { setInfoMsg(""); setErrorMsg(""); }, 3000);
  };

  const handleImportViaDialog = () => {
    if (syscall.openDialog) {
      syscall.openDialog(
        "Upload File",
        `Select a file to load into "${cwd}":`,
        "import",
        [],
        (res) => {
          const fileRes = res as { name?: string; content?: string } | null;
          if (fileRes && fileRes.name && fileRes.content !== undefined) {
            const targetPath = cwd === "/" ? `/${fileRes.name}` : `${cwd}/${fileRes.name}`;
            const ok = syscall.writeFile(targetPath, fileRes.content || "");
            if (ok) {
              setInfoMsg(`Successfully uploaded: ${fileRes.name}`);
              refreshDir();
            } else {
              setErrorMsg(`Upload failed for file: ${fileRes.name}`);
            }
            setTimeout(() => { setInfoMsg(""); setErrorMsg(""); }, 4000);
          }
        }
      );
    }
  };

  const handleFileDownload = (name: string) => {
    const targetPath = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    const content = syscall.readFile(targetPath);
    if (content.startsWith("Error:")) {
      setErrorMsg("Failed to read the file contents for download.");
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setInfoMsg(`Exported downloaded local copy: ${name}`);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      const lowerName = file.name.toLowerCase();
      
      reader.onload = (evt) => {
        const fileContent = evt.target?.result as string;
        const targetPath = cwd === "/" ? `/${file.name}` : `${cwd}/${file.name}`;
        
        const ok = syscall.writeFile(targetPath, fileContent || "");
        if (ok) {
          setInfoMsg(`Successfully uploaded dropped file: ${file.name}`);
          refreshDir();
        } else {
          setErrorMsg(`Failed to save file: ${file.name}`);
        }
        setTimeout(() => { setInfoMsg(""); setErrorMsg(""); }, 4500);
      };

      const textFormats = [".txt", ".json", ".conf", ".sh", ".html", ".js", ".ts", ".css", ".xml", ".csv"];
      if (textFormats.some(ext => lowerName.endsWith(ext))) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file); 
      }
    });
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const selectedItemNode = items.find((i) => i.name === selectedName);

  return (
    <div 
      className="flex-1 bg-white flex flex-col min-h-0 select-none text-xs text-slate-800 font-sans"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Dynamic Navigation/Filter Topbar */}
      <div className="border-b border-gray-150 p-3 bg-gray-50 flex items-center justify-between gap-3 flex-wrap shrink-0">
        
        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleHistoryBack}
            disabled={historyBack.length === 0}
            className="p-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleHistoryForward}
            disabled={historyForward.length === 0}
            className="p-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center"
            title="Go forward"
          >
            <ArrowRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleCdUp}
            disabled={cwd === "/"}
            className="px-2.5 py-1 text-[11px] font-medium bg-white border border-gray-200 hover:border-gray-300 rounded transition-colors disabled:opacity-30 cursor-pointer"
            title="Go up one folder level"
          >
            Up
          </button>
        </div>

        {/* Current Folder Path Input Field */}
        <div className="flex-1 min-w-[150px] flex items-center bg-white border border-gray-200 rounded px-2.5 py-1">
          <span className="text-gray-400 font-mono select-none mr-1">folder:</span>
          <input 
            type="text" 
            value={cwd} 
            onChange={(e) => setCwd(e.target.value)} 
            className="flex-1 bg-transparent outline-none border-none py-0 font-medium font-mono text-gray-800" 
          />
        </div>

        {/* Live Filter Search Input */}
        <div className="w-40 flex items-center bg-white border border-gray-200 rounded px-2 py-1">
          <Search className="w-3.5 h-3.5 text-gray-400 mr-1.5 shrink-0" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-transparent outline-none border-none text-[11px] py-0 text-gray-700"
          />
        </div>
      </div>

      {/* Selected Items Context Action Bar */}
      <div className="border-b border-gray-100 px-3.5 py-2 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
        <div className="flex items-center space-x-2">
          {/* Default Folder Upload Option */}
          <button
            onClick={handleImportViaDialog}
            className="px-3 py-1 bg-white border border-gray-200 hover:border-gray-300 rounded text-gray-700 flex items-center space-x-1 cursor-pointer font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span>Upload File</span>
          </button>

          {/* Render selected item context tools */}
          {selectedName && (
            <>
              <div className="w-[1px] h-4 bg-gray-200" />
              
              <button
                onClick={() => setIsRenaming(!isRenaming)}
                className={`px-3 py-1 bg-white border rounded text-gray-700 flex items-center space-x-1 cursor-pointer font-medium transition-colors ${
                  isRenaming ? "border-slate-800 bg-slate-100" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-550" />
                <span>Rename</span>
              </button>

              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100/50 rounded flex items-center space-x-1 cursor-pointer font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>

              {selectedItemNode?.type === NodeType.FILE && (
                <button
                  onClick={() => handleFileDownload(selectedName)}
                  className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100/50 rounded flex items-center space-x-1 cursor-pointer font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download</span>
                </button>
              )}

              {selectedItemNode?.type === NodeType.FILE && (
                <button
                  onClick={() => {
                    const fileP = cwd === "/" ? `/${selectedName}` : `${cwd}/${selectedName}`;
                    onLaunchApp("leafpadUF", `Text Editor - ${selectedName}`, { content: fileP });
                  }}
                  className="px-2 py-1 text-gray-500 hover:text-gray-900 flex items-center font-medium space-x-1"
                >
                  <CornerDownRight className="w-3 h-3 text-gray-400" />
                  <span>Edit in Text Editor</span>
                </button>
              )}
            </>
          )}
        </div>

        <span className="text-[10px] text-gray-400 italic hidden sm:inline">
          💡 Drag & drop files directly onto this window to save them.
        </span>
      </div>

      {/* Inline Renaming Banner */}
      {isRenaming && (
        <div className="px-4 py-2 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-amber-900 font-semibold">
            <span>Rename "{selectedName}":</span>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-mono outline-none focus:border-amber-500 min-w-[180px]"
            />
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleRenameSubmit}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-750 text-white rounded font-bold text-[10px] uppercase"
            >
              Apply
            </button>
            <button
              onClick={() => setIsRenaming(false)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-bold text-[10px] uppercase"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Primary Files/Directories Canvas Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {errorMsg && (
          <div className="p-3 mb-3 bg-rose-50 border border-rose-100 text-rose-800 font-medium rounded text-xs select-all">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="p-3 mb-3 bg-emerald-50 border border-emerald-100 text-emerald-800 font-medium rounded text-xs select-none">
            {infoMsg}
          </div>
        )}

        {/* Crisp Responsive Folder/File List */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const isSelected = selectedName === item.name;
            return (
              <div
                key={item.name}
                onClick={() => onItemClick(item.name)}
                onDoubleClick={() => onItemDoubleClick(item.name, item.type)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center cursor-pointer transition-all ${
                  isSelected
                    ? "bg-slate-100/80 border-slate-300 text-slate-905"
                    : "bg-transparent border-transparent hover:bg-gray-50/70"
                }`}
              >
                {/* Clean, recognizable Lucide icon elements with no redundant custom divs */}
                <div className="mb-2.5 pt-1.5 shrink-0">
                  {item.type === NodeType.DIRECTORY ? (
                    <Folder className={`w-11 h-11 ${
                      isSelected ? "text-slate-700" : "text-slate-400"
                    }`} />
                  ) : (
                    <FileText className={`w-10 h-10 ${
                      isSelected ? "text-slate-600" : "text-slate-400"
                    }`} />
                  )}
                </div>
                
                <span className="text-[11px] leading-relaxed break-all font-medium text-gray-800 line-clamp-2 px-1 max-w-[100px]">
                  {item.name}
                </span>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 italic text-xs select-none">
              {items.length === 0 ? "This folder is empty." : "No items match your search term."}
            </div>
          )}
        </div>
      </div>

      {/* Simple, Non-bloated Creators Segment at the Bottom */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          // Decide creation based on input name endings or default to folder/file button clicks
        }} 
        className="bg-gray-50 border-t border-gray-150 p-3 flex flex-wrap items-center gap-2 mt-auto shrink-0"
      >
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs outline-none text-gray-800 font-mono w-full sm:w-60 focus:border-gray-400"
            placeholder="Enter file or folder name..."
            maxLength={64}
          />
          <button
            type="button"
            onClick={() => handleCreateDirectory()}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded text-gray-700 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-gray-500" />
            <span>Folder</span>
          </button>
          <button
            type="button"
            onClick={() => handleCreateFile()}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded text-gray-700 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-500" />
            <span>File</span>
          </button>
        </div>
      </form>
    </div>
  );
}
