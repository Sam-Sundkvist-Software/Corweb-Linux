import { useState, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";
import { Save, FolderOpen, FilePlus } from "lucide-react";

interface LeafpadAppProps {
  syscall: SystemCallInterface;
  initialFilePath?: string;
  onSaveCallback?: () => void;
}

export default function LeafpadApp({
  syscall,
  initialFilePath,
  onSaveCallback,
}: LeafpadAppProps) {
  const [filePath, setFilePath] = useState(initialFilePath || "/home/tux/Desktop/Welcome.txt");
  const [content, setContent] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    // Load file contents
    try {
      const txt = syscall.readFile(filePath);
      if (!txt.startsWith("Error:")) {
        setContent(txt);
        setStatusMsg(`Opened ${filePath} successfully.`);
      } else {
        setContent("");
        setStatusMsg(`File '${filePath}' not found or empty.`);
        if (syscall.openDialog && filePath !== "/home/tux/Desktop/Welcome.txt") {
          syscall.openDialog(
            "File Warning",
            `The requested file '${filePath}' is empty or does not exist. A blank buffer has been initialized.`,
            "warning"
          );
        }
      }
    } catch {
      setContent("");
      setStatusMsg("Failed to open file.");
      if (syscall.openDialog) {
        syscall.openDialog("File Error", `Failed to read the file node at '${filePath}'.`, "error");
      }
    }
  }, [filePath, syscall]);

  const handleSave = () => {
    if (!filePath.trim()) {
      const err = "Please provide a valid file path and name.";
      setStatusMsg(`Error: ${err}`);
      if (syscall.openDialog) {
        syscall.openDialog("Validation Error", err, "error");
      }
      return;
    }
    const ok = syscall.writeFile(filePath, content);
    if (ok) {
      const okMsg = `Saved changes to ${filePath} successfully.`;
      setStatusMsg(okMsg);
      if (syscall.openDialog) {
        syscall.openDialog("Save Successful", okMsg, "info");
      }
      if (onSaveCallback) onSaveCallback();
    } else {
      const errMsg = "Failed to write to VFS. Ensure the parent path directory exists and you have write permissions.";
      setStatusMsg(`Error: ${errMsg}`);
      if (syscall.openDialog) {
        syscall.openDialog("Permission Denied", errMsg, "error");
      }
    }
  };

  const handleNewFile = () => {
    setFilePath("/home/tux/Untitled.txt");
    setContent("");
    setStatusMsg("Created empty document buffer.");
  };

  const charCount = content.length;
  const lineCount = content.split("\n").filter(Boolean).length;

  return (
    <div className="flex-1 bg-white text-gray-800 flex flex-col min-h-0 select-text font-sans">
      {/* Menu controls (2006 style classic toolbar) */}
      <div className="h-8 bg-[#eeeeec] border-b border-[#babdb6] flex items-center px-1 space-x-1 select-none text-xs text-[#2e3436] font-medium">
        <button
          onClick={handleNewFile}
          className="flex items-center space-x-1 px-2.5 py-1 hover:bg-[#d3d7cf] rounded transition-colors"
          title="New Document"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
        <div className="w-[1px] h-4 bg-gray-300" />

        <div className="flex items-center space-x-1">
          <span className="text-gray-500 pl-1.5 pr-0.5">Path:</span>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="px-2 py-0.5 max-w-[280px] bg-white border border-[#babdb6] rounded text-[11px] font-mono outline-none text-gray-700"
            placeholder="/home/tux/notes.txt"
          />
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1 px-3 py-1 hover:bg-[#d3d7cf] rounded text-[#3465a4] font-semibold transition-colors"
          title="Save File"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </div>

      {/* Editor Main Canvas */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 p-3.5 font-mono text-sm leading-6 border-none outline-none resize-none focus:ring-0 bg-[#fdfdfb]"
        placeholder="Write text documents or write code here... Changes will persist in IndexedDB immediately on Save."
      />

      {/* Retro bar */}
      <div className="h-5 bg-[#eeeeec] border-t border-[#babdb6] flex items-center justify-between px-3 text-[10px] text-[#555753] select-none">
        <span>{statusMsg || "Ready to edit."}</span>
        <div className="flex space-x-3 pr-2 border-l border-gray-300 pl-3">
          <span>Lines: {lineCount}</span>
          <span>Chars: {charCount}</span>
        </div>
      </div>
    </div>
  );
}
