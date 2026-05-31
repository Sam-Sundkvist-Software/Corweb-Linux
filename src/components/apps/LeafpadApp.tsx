import { useState, useEffect } from "react";
import { SystemCallInterface } from "../../types/os";
import { Save, FolderOpen, FilePlus } from "lucide-react";
import Editor from "@monaco-editor/react";

interface LeafpadAppProps {
  syscall: SystemCallInterface;
  initialFilePath?: string;
  onSaveCallback?: () => void;
}

const LANGUAGES = [
  { id: "plaintext", name: "Plain Text" },
  { id: "typescript", name: "TypeScript" },
  { id: "javascript", name: "JavaScript" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "json", name: "JSON" },
  { id: "markdown", name: "Markdown" },
  { id: "python", name: "Python" },
  { id: "shell", name: "Shell Script" },
  { id: "sql", name: "SQL" },
  { id: "xml", name: "XML" },
  { id: "yaml", name: "YAML" }
];

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'py':
      return 'python';
    case 'sql':
      return 'sql';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
    case 'bash':
      return 'shell';
    default:
      return 'plaintext';
  }
};

export default function LeafpadApp({
  syscall,
  initialFilePath,
  onSaveCallback,
}: LeafpadAppProps) {
  const [filePath, setFilePath] = useState(initialFilePath || "/home/tux/Desktop/Welcome.txt");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    // Load file contents
    try {
      const txt = syscall.readFile(filePath);
      if (!txt.startsWith("Error:")) {
        setContent(txt);
        setStatusMsg(`Opened ${filePath} successfully.`);
        // Auto-detect language
        setLanguage(getLanguageFromPath(filePath));
      } else {
        setContent("");
        setStatusMsg(`File '${filePath}' not found or empty.`);
        setLanguage(getLanguageFromPath(filePath));
        if (syscall.openDialog && filePath !== "/home/tux/Desktop/Welcome.txt" && filePath !== "/home/tux/Untitled.txt") {
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
    setLanguage("plaintext");
    setStatusMsg("Created empty document buffer.");
  };

  const charCount = content.length;
  const lineCount = content.split("\n").filter(Boolean).length;

  return (
    <div className="flex-1 bg-white text-gray-800 flex flex-col min-h-0 select-text font-sans">
      {/* Menu controls (2006 style classic toolbar) */}
      <div className="bg-[#eeeeec] border-b border-[#babdb6] flex flex-wrap items-center py-1 px-1.5 gap-2 select-none text-xs text-[#2e3436] font-medium leading-none">
        
        <button
          onClick={handleNewFile}
          className="flex items-center space-x-1 px-2 py-1.5 hover:bg-[#d3d7cf] rounded transition-colors cursor-pointer"
          title="New Document"
        >
          <FilePlus className="w-3.5 h-3.5 shrink-0" />
          <span>New</span>
        </button>
        
        <div className="w-[1px] h-4 bg-gray-300 shrink-0" />

        <div className="flex items-center space-x-1">
          <span className="text-gray-500 text-[10px] pl-1 font-bold">Path:</span>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="px-2 py-1 bg-white border border-[#babdb6] rounded text-[11px] font-mono outline-none text-gray-700 w-44"
            placeholder="/home/tux/notes.txt"
          />
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-gray-500 text-[10px] pl-1 font-bold">Syntax:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2 py-0.5 bg-white border border-[#babdb6] rounded text-[11px] font-sans outline-none text-gray-700 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1 px-2.5 py-1.5 hover:bg-[#d3d7cf] rounded text-[#3465a4] font-semibold transition-colors cursor-pointer ml-auto"
          title="Save File"
        >
          <Save className="w-3.5 h-3.5 shrink-0" />
          <span>Save</span>
        </button>
      </div>

      {/* Editor Main Canvas with Monaco */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={(val) => setContent(val || "")}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "JetBrains Mono, Fira Code, Courier New, monospace",
            wordWrap: "on",
            automaticLayout: true,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            tabSize: 2,
          }}
        />
      </div>

      {/* Retro status bar */}
      <div className="h-5 bg-[#eeeeec] border-t border-[#babdb6] flex items-center justify-between px-3 text-[10px] text-[#555753] select-none shrink-0 font-sans">
        <span>{statusMsg || "Ready to edit."}</span>
        <div className="flex space-x-3 pr-2 border-l border-gray-300 pl-3">
          <span>Lines: {lineCount}</span>
          <span>Chars: {charCount}</span>
        </div>
      </div>
    </div>
  );
}
