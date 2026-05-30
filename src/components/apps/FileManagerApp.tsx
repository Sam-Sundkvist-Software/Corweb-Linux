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
  HelpCircle, 
  Upload, 
  Download, 
  Search, 
  FileText, 
  FolderPlus, 
  CornerDownRight,
  Info
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

  // History stack for power-user navigation efficiency
  const [historyBack, setHistoryBack] = useState<string[]>([]);
  const [historyForward, setHistoryForward] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDir = () => {
    try {
      const list = syscall.listDir(cwd);
      setItems(list);
    } catch {
      setErrorMsg(`Failed to list contents of ${cwd}`);
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
      setHistoryForward([]); // clear forward stack on fresh navigations
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

  const onItemClick = (name: string, type: NodeType) => {
    setSelectedName(name);
    setRenameInput(name);
    setIsRenaming(false);
  };

  const onItemDoubleClick = (name: string, type: NodeType) => {
    const fullPath = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    if (type === NodeType.DIRECTORY) {
      navigateTo(fullPath);
    } else {
      // File double clicked! Launch specialized application
      const lower = name.toLowerCase();
      if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".bmp")) {
        onLaunchApp("imageViewerUF", `Image Viewer - ${name}`, { content: fullPath, width: 620, height: 460 });
      } else if (lower.endsWith(".mp4") || lower.endsWith(".avi") || lower.endsWith(".mov") || lower.endsWith(".mkv") || lower.endsWith(".webm")) {
        onLaunchApp("videoPlayerUF", `Video Player - ${name}`, { content: fullPath, width: 620, height: 480 });
      } else if (lower.endsWith(".mp3") || lower.endsWith(".wav") || lower.endsWith(".ogg") || lower.endsWith(".flac") || lower.endsWith(".aac")) {
        onLaunchApp("musicPlayerUF", `Music Player - ${name}`, { content: fullPath, width: 620, height: 460 });
      } else if (name.endsWith(".txt") || name.endsWith(".conf") || name.endsWith(".json") || name.endsWith(".cfg") || name.endsWith(".sh")) {
        onLaunchApp("leafpadUF", `Leafpad - ${name}`, { content: fullPath });
      } else {
        onLaunchApp("leafpadUF", `Viewing: ${name}`, { content: fullPath });
      }
    }
  };

  const handleCreateFile = () => {
    if (!newItemName.trim()) return;
    const sanitized = newItemName.trim();
    const dest = cwd === "/" ? `/${sanitized}` : `${cwd}/${sanitized}`;
    const ok = syscall.writeFile(dest, `[File initialized at ${new Date().toLocaleTimeString()}]`);
    if (ok) {
      setNewItemName("");
      refreshDir();
      syscall.syslog(`VFS file structured: ${dest}`);
      if (syscall.openDialog) {
        syscall.openDialog("File Created", `File '${sanitized}' has been successfully created.`, "info");
      } else {
        setInfoMsg(`File '${sanitized}' created successfully.`);
        setTimeout(() => setInfoMsg(""), 3000);
      }
    } else {
      const err = "File creation rejected by Kernel permissions or path is invalid.";
      if (syscall.openDialog) {
        syscall.openDialog("Permission Denied", err, "error");
      } else {
        setErrorMsg(`Error: ${err}`);
        setTimeout(() => setErrorMsg(""), 4000);
      }
    }
  };

  const handleCreateDirectory = () => {
    if (!newItemName.trim()) return;
    const sanitized = newItemName.trim();
    const dest = cwd === "/" ? `/${sanitized}` : `${cwd}/${sanitized}`;
    const ok = syscall.createDirectory(dest);
    if (ok) {
      setNewItemName("");
      refreshDir();
      syscall.syslog(`VFS directory structured: ${dest}`);
      if (syscall.openDialog) {
        syscall.openDialog("Directory Created", `Directory '${sanitized}' has been successfully created.`, "info");
      } else {
        setInfoMsg(`Directory '${sanitized}' created successfully.`);
        setTimeout(() => setInfoMsg(""), 3000);
      }
    } else {
      const err = "Directory creation rejected by Kernel permission rules or parent directory does not exist.";
      if (syscall.openDialog) {
        syscall.openDialog("Permission Denied", err, "error");
      } else {
        setErrorMsg(`Error: ${err}`);
        setTimeout(() => setErrorMsg(""), 4000);
      }
    }
  };

  const handleDelete = () => {
    if (!selectedName) return;
    const dest = cwd === "/" ? `/${selectedName}` : `${cwd}/${selectedName}`;
    
    if (syscall.openDialog) {
      syscall.openDialog(
        "Confirm Deletion",
        `Are you sure you want to permanently delete '${selectedName}'? This action cannot be undone.`,
        "question",
        ["Yes", "No"],
        (res) => {
          if (res === "Yes") {
            const ok = syscall.deleteNode(dest);
            if (ok) {
              setSelectedName(null);
              refreshDir();
              syscall.syslog(`VFS node purged: ${dest}`);
              syscall.openDialog!("Success", `'${selectedName}' was successfully deleted.`, "info");
            } else {
              syscall.openDialog!("Access Denied", "Action failed: Insufficient kernel privileges or folder is not empty.", "error");
            }
          }
        }
      );
    } else {
      const ok = syscall.deleteNode(dest);
      if (ok) {
        setSelectedName(null);
        refreshDir();
        syscall.syslog(`VFS node purged: ${dest}`);
        setInfoMsg("Element deleted successfully.");
        setTimeout(() => setInfoMsg(""), 3000);
      } else {
        setErrorMsg("Error: Node deletion rejected by Kernel privileges.");
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

    // Read current node content if it's a file
    const node = items.find((i) => i.name === selectedName);
    if (node) {
      if (node.type === NodeType.DIRECTORY) {
        // Directory renaming can be emulated by creating new and purging old
        const okNew = syscall.createDirectory(targetPath);
        if (okNew) {
          syscall.deleteNode(currentPath);
          refreshDir();
          if (syscall.openDialog) {
            syscall.openDialog("Rename Complete", "Folder successfully renamed.", "info");
          } else {
            setInfoMsg("Folder successfully renamed.");
          }
        } else {
          const err = "Failed to rename folder. Kernel rejected write.";
          if (syscall.openDialog) {
            syscall.openDialog("Access Denied", err, "error");
          } else {
            setErrorMsg(err);
          }
        }
      } else {
        const fileContent = syscall.readFile(currentPath);
        const okWrite = syscall.writeFile(targetPath, fileContent);
        if (okWrite) {
          syscall.deleteNode(currentPath);
          refreshDir();
          if (syscall.openDialog) {
            syscall.openDialog("Rename Complete", "File successfully renamed.", "info");
          } else {
            setInfoMsg("File successfully renamed.");
          }
        } else {
          const err = "Failed to rename file. Check write privileges.";
          if (syscall.openDialog) {
            syscall.openDialog("Access Denied", err, "error");
          } else {
            setErrorMsg(err);
          }
        }
      }
    }
    setIsRenaming(false);
    setSelectedName(null);
    setTimeout(() => { setInfoMsg(""); setErrorMsg(""); }, 3000);
  };

  // Device context local file importer via OS Dialogue API
  const handleImportViaDialog = () => {
    if (syscall.openDialog) {
      syscall.openDialog(
        "Import File",
        `Select file to import into target directory '${cwd}':`,
        "import",
        [],
        (res) => {
          if (res && res.name && res.content !== undefined) {
            const targetPath = cwd === "/" ? `/${res.name}` : `${cwd}/${res.name}`;
            const ok = syscall.writeFile(targetPath, res.content || "");
            if (ok) {
              syscall.syslog(`Local device file imported into VFS: ${targetPath}`);
              setInfoMsg(`Successfully imported local file: ${res.name}`);
              refreshDir();
            } else {
              setErrorMsg(`Kernel rejected write sequence for: ${res.name}`);
            }
            setTimeout(() => { setInfoMsg(""); setErrorMsg(""); }, 4000);
          }
        }
      );
    }
  };

  // Device context guest export download
  const handleFileDownload = (name: string) => {
    const targetPath = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    const content = syscall.readFile(targetPath);
    if (content.startsWith("Error:")) {
      setErrorMsg("Lacking credentials to read item for export download.");
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
    setInfoMsg(`Downloaded VFS file: ${name}`);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  // Drag-and-drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      const name = file.name.toLowerCase();
      const isMedia = name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || name.endsWith(".bmp") ||
                      name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".ogg") || name.endsWith(".flac") || name.endsWith(".aac") ||
                      name.endsWith(".mp4") || name.endsWith(".avi") || name.endsWith(".mov") || name.endsWith(".mkv") || name.endsWith(".webm");

      reader.onload = (evt) => {
        const fileContent = evt.target?.result as string;
        const targetPath = cwd === "/" ? `/${file.name}` : `${cwd}/${file.name}`;
        
        const ok = syscall.writeFile(targetPath, fileContent || "");
        if (ok) {
          syscall.syslog(`Dropped device file written to WebOS VFS: ${targetPath}`);
          setInfoMsg(`Imported file: ${file.name}`);
          refreshDir();
        } else {
          setErrorMsg(`Upload failed (permissions) for: ${file.name}`);
        }
        setTimeout(() => { setInfoMsg(""); setErrorMsg(""); }, 4000);
      };

      if (isMedia) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Filter items based on user search text input
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Selected item specs
  const selectedItemNode = items.find((i) => i.name === selectedName);
  let detailSize = 0;
  let detailPreview = "";
  if (selectedItemNode && selectedItemNode.type === NodeType.FILE) {
    const p = cwd === "/" ? `/${selectedName}` : `${cwd}/${selectedName}`;
    const cVal = syscall.readFile(p);
    detailSize = cVal ? new Blob([cVal]).size : 0;
    detailPreview = cVal ? cVal.substring(0, 50) + (cVal.length > 50 ? "..." : "") : "[No content]";
  }

  return (
    <div 
      className="flex-1 bg-[#d4d0c8] flex flex-col min-h-0 select-none text-xs text-black font-sans"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 2004 Style Dual Bevel Action Toolbar */}
      <div className="bg-[#ede9e2] border-b-2 border-white p-2 flex flex-col gap-1.5 shadow-sm">
        
        <div className="flex items-center justify-between gap-2.5">
          {/* Back/Forward Nav Stack Buttons */}
          <div className="flex gap-1">
            <button
              onClick={handleHistoryBack}
              disabled={historyBack.length === 0}
              className="p-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#c0c0c0] disabled:opacity-30 disabled:hover:bg-[#d4d0c8] select-none cursor-pointer flex items-center justify-center"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleHistoryForward}
              disabled={historyForward.length === 0}
              className="p-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#c0c0c0] disabled:opacity-30 disabled:hover:bg-[#d4d0c8] select-none cursor-pointer flex items-center justify-center"
              title="Go forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCdUp}
              disabled={cwd === "/"}
              className="px-2 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#c0c0c0] font-bold text-[10px] uppercase select-none cursor-pointer disabled:opacity-40"
              title="CD UP"
            >
              Up Index
            </button>
          </div>

          {/* Path Address Panel Bar */}
          <div className="flex-1 flex items-center bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-2 py-1 font-mono text-[11px] truncate text-gray-700">
            <span className="text-[#0040a0] font-bold mr-1.5">vfs:</span>
            <input 
              type="text" 
              value={cwd} 
              onChange={(e) => setCwd(e.target.value)} 
              className="flex-1 bg-transparent outline-none border-none select-text py-0" 
            />
          </div>

          {/* Quick Search Filtering Tool */}
          <div className="w-36 flex items-center bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-1.5 py-1">
            <Search className="w-3.5 h-3.5 text-gray-400 mr-1" />
            <input
              type="text"
              placeholder="Search index..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-transparent outline-none border-none text-[10.5px] py-0"
            />
          </div>
        </div>

        {/* Rapid Operation Buttons for High Efficiency File Management */}
        <div className="flex items-center justify-between flex-wrap gap-1.5 mt-0.5 border-t border-[#b2aba2] pt-1.5">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleImportViaDialog}
              className="px-2.5 py-1 bg-[#ede9e2] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px text-black hover:bg-[#dfdad0] font-bold text-[10.5px] flex items-center space-x-1 cursor-pointer select-none"
              title="Import files using the system dialogue API"
            >
              <Upload className="w-3.5 h-3.5 text-[#204a87]" />
              <span className="font-bold">Import Local</span>
            </button>

            {selectedName && (
              <>
                <button
                  onClick={() => setIsRenaming(!isRenaming)}
                  className={`px-2.5 py-1 bg-[#ede9e2] border ${isRenaming ? "border-[#0040a0] bg-[#e3ded4]" : "border-t-white border-l-white border-r-[#808080] border-b-[#808080]"} hover:bg-[#dfdad0] font-bold text-[10.5px] flex items-center space-x-1`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-700" />
                  <span>Rename</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-t-white border-l-white border-r-red-600 border-b-red-600 font-bold text-[10.5px] flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-800" />
                  <span>Delete</span>
                </button>

                {selectedItemNode?.type === NodeType.FILE && (
                  <button
                    onClick={() => handleFileDownload(selectedName)}
                    className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 border border-t-white border-l-white border-r-blue-600 border-b-blue-600 font-bold text-[10.5px] flex items-center space-x-1 cursor-pointer select-none"
                    title="Export in real time back to host device"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-800" />
                    <span>Download</span>
                  </button>
                )}
              </>
            )}
          </div>

          <span className="text-[9.5px] text-gray-500 font-mono hidden sm:inline">
            💡 Drag & Drop device files anywhere inside pane to mount!
          </span>
        </div>
      </div>

      {/* Primary Grid with split Details property bar */}
      <div className="flex-1 flex min-h-0 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white m-1">
        
        {/* VFS Canvas Directory display */}
        <div className="flex-1 p-3 overflow-y-auto">
          {errorMsg && (
            <div className="p-2 mb-2 bg-[#ffe4e1] border-2 border-red-700 text-red-900 font-bold text-[10.5px] uppercase">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-2 mb-2 bg-[#e2f0d9] border-2 border-green-700 text-green-900 font-bold text-[10.5px] uppercase">
              {infoMsg}
            </div>
          )}

          {/* Quick renaming inline header banner */}
          {isRenaming && (
            <div className="mb-2.5 p-2 bg-[#fffacd] border border-yellow-700 rounded-sm flex items-center justify-between gap-1.5">
              <span className="font-bold text-[10px] text-yellow-900">Rename "{selectedName}":</span>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="flex-1 px-1.5 py-0.5 bg-white border border-[#babdb6] text-xs font-mono"
              />
              <button
                onClick={handleRenameSubmit}
                className="px-2 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-black border-b-black font-bold uppercase text-[9px]"
              >
                Apply
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                className="px-1.5 py-0.5 bg-gray-200 border border-t-white border-l-white border-r-black border-b-black text-[9px]"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.name}
                onClick={() => onItemClick(item.name, item.type)}
                onDoubleClick={() => onItemDoubleClick(item.name, item.type)}
                className={`flex flex-col items-center justify-center p-2.5 rounded border text-center cursor-pointer transition-all duration-100 ${
                  selectedName === item.name
                    ? "bg-[#3381cc]/25 border-[#3381cc] text-[#103070]"
                    : "bg-transparent border-transparent hover:bg-gray-100"
                }`}
              >
                {item.type === NodeType.DIRECTORY ? (
                  <div className="relative mb-2 shrink-0">
                    {/* Retro clunky folder structure */}
                    <div className="w-11 h-8.5 bg-[#fce94f] border-2 border-[#c4a000] relative shadow-sm rounded-xs">
                      <div className="absolute top-[-4px] left-[1px] w-4.5 h-1.5 bg-[#fce94f] border-t-2 border-l-2 border-r-2 border-[#c4a000] rounded-t-xs" />
                    </div>
                  </div>
                ) : (
                  <div className="relative mb-1.5 shrink-0">
                    {/* Metal slate text file structure */}
                    <div className="w-8.5 h-11 bg-white border-2 border-[#555753] relative shadow-sm rounded-xs flex items-center justify-center p-0.5">
                      <FileText className="w-5 h-5 text-[#888a85]" />
                      <div className="absolute top-1 right-[1.5px] w-2.5 h-2.5 bg-[#d4d0c8] border-l-2 border-b-2 border-[#555753] rotate-[-45deg] origin-top-right transform translate-x-px translate-y-[-px]" />
                    </div>
                  </div>
                )}
                <span className="text-[11px] font-mono leading-4 break-all max-w-[90px] text-gray-800 line-clamp-2 px-0.5">
                  {item.name}
                </span>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 font-mono italic text-[11px]">
                {items.length === 0 ? "Folder is empty. Seed elements below!" : "No nodes match directory search filter."}
              </div>
            )}
          </div>
        </div>

        {/* Properties Selected Element Specs Sidebar Pane */}
        <div className="w-48 bg-[#ede9e2] border-l border-[#babdb6] p-2.5 flex flex-col justify-between min-h-0 shrink-0">
          <div className="space-y-2.5">
            <span className="font-bold text-[#103070] border-b border-[#babdb6] pb-1.5 flex items-center space-x-1.5 uppercase text-[10px]">
              <Info className="w-3.5 h-3.5" />
              <span>Properties Sidebar</span>
            </span>

            {selectedItemNode ? (
              <div className="space-y-2 select-text font-sans">
                <div>
                  <span className="block text-[9.5px] font-bold text-gray-500 uppercase">Item Name</span>
                  <p className="font-mono text-[11px] select-all font-bold text-gray-800 break-all">{selectedName}</p>
                </div>

                <div>
                  <span className="block text-[9.5px] font-bold text-gray-500 uppercase">Node Type</span>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="text-[10px] bg-gray-200 border border-gray-400 p-0.5 font-bold rounded uppercase">
                      {selectedItemNode.type === NodeType.DIRECTORY ? "📁 Directory" : "🗎 File"}
                    </span>
                  </div>
                </div>

                {selectedItemNode.type === NodeType.FILE && (
                  <>
                    <div>
                      <span className="block text-[9.5px] font-bold text-gray-500 uppercase">Decoded Size</span>
                      <p className="font-mono text-[10px] text-gray-700">{detailSize} Bytes</p>
                    </div>

                    <div className="bg-white border p-1 rounded-sm border-t-gray-400 border-l-gray-400 leading-4 text-gray-600">
                      <span className="block text-[8.5px] font-bold text-gray-400 uppercase">VFS Preview Segment</span>
                      <p className="font-mono text-[9px] truncate" title={detailPreview}>{detailPreview || "[Blank]"}</p>
                    </div>

                    <button
                      onClick={() => {
                        const fileP = cwd === "/" ? `/${selectedName}` : `${cwd}/${selectedName}`;
                        onLaunchApp("leafpadUF", `Leafpad - ${selectedName}`, { content: fileP });
                      }}
                      className="w-full py-1 bg-[#d4d0c8] hover:bg-[#c0c0c0] font-bold border border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center justify-center space-x-1 text-[10.5px]"
                    >
                      <CornerDownRight className="w-3 h-3 text-[#204a87]" />
                      <span>Edit in Leafpad</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-gray-400 italic font-mono leading-4 p-8 text-center bg-gray-50 border rounded-sm">
                Highlight folder or file to inspect stats.
              </div>
            )}
          </div>

          <div className="mt-4 pt-2 border-t border-[#beb8ad] text-center text-[9px] text-gray-400 font-mono leading-3.5">
            Role: {syscall.getCurrentUserRole().toUpperCase()}<br />
            User: {syscall.getCurrentUser()}
          </div>
        </div>
      </div>

      {/* High-efficiency structural creators segment */}
      <div className="bg-[#ede9e2] border-t-2 border-white p-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="px-2 py-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white text-[11px] outline-none text-black font-mono w-full sm:w-56"
            placeholder="File name or Folder name..."
            maxLength={64}
          />
          <button
            onClick={handleCreateDirectory}
            className="px-3 py-1 bg-[#ede9e2] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px text-black hover:bg-[#dfdad0] font-bold text-[10.5px] flex items-center space-x-1 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-yellow-600" />
            <span>Folder</span>
          </button>
          <button
            onClick={handleCreateFile}
            className="px-3 py-1 bg-[#ede9e2] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px text-black hover:bg-[#dfdad0] font-bold text-[10.5px] flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>File</span>
          </button>
        </div>
      </div>
    </div>
  );
}
