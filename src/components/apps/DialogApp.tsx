import React, { useState } from "react";
import { DialogInstance } from "../../types/os";

interface DialogAppProps {
  diag: DialogInstance;
  onClose: (id: string, result: unknown) => void;
}

export default function DialogApp({ diag, onClose }: DialogAppProps) {
  const [inputVal, setInputVal] = useState(diag.inputValue || "");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAction = (option: string) => {
    if (diag.type === "input") {
      onClose(diag.id, { button: option, value: inputVal });
    } else {
      onClose(diag.id, option);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    const name = file.name.toLowerCase();
    const isMedia = name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || name.endsWith(".bmp") ||
                    name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".ogg") || name.endsWith(".flac") || name.endsWith(".aac") ||
                    name.endsWith(".mp4") || name.endsWith(".avi") || name.endsWith(".mov") || name.endsWith(".mkv") || name.endsWith(".webm");

    reader.onload = (e) => {
      const content = e.target?.result as string;
      onClose(diag.id, { name: file.name, content });
    };

    if (isMedia) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const getIcon = () => {
    switch (diag.type) {
      case "error": return <span className="text-2xl shrink-0">🛑</span>;
      case "warning": return <span className="text-2xl shrink-0">⚠️</span>;
      case "question": return <span className="text-2xl shrink-0">❓</span>;
      case "input": return <span className="text-2xl shrink-0">✏️</span>;
      case "import": return <span className="text-2xl shrink-0">📥</span>;
      default: return <span className="text-2xl shrink-0">ℹ️</span>;
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[#ede9e2] text-black text-left font-sans h-full"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Content Area */}
      <div className="flex-1 p-3.5 flex flex-col space-y-2.5 overflow-y-auto">
        <div className="flex items-start space-x-3">
          <div className="shrink-0 pt-0.5">{getIcon()}</div>
          <div className="flex-1 text-[11px] leading-5 text-gray-800 font-bold font-mono whitespace-pre-wrap select-text">
            {diag.message}
          </div>
        </div>

        {diag.type === "input" && (
          <div className="mt-1 p-0.5 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-transparent outline-none border-none text-[11px] font-mono text-gray-800 p-0.5 select-text"
              placeholder="Provide response..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAction("OK");
              }}
            />
          </div>
        )}

        {diag.type === "import" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = ".txt,.cfg,.conf,.json,.sh,.desktop,.html,.css,.png,.jpg,.jpeg,.gif,.bmp,.mp3,.wav,.ogg,.flac,.aac,.mp4,.avi,.mov,.mkv,.webm";
              fileInput.onchange = (e: any) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              };
              fileInput.click();
            }}
            className={`cursor-pointer border-2 border-dashed rounded-sm p-4 flex flex-col items-center justify-center space-y-1.5 select-none transition-colors ${
              isDragOver ? "border-[#0055d4] bg-[#0055d4]/10" : "border-[#808080] hover:bg-gray-100 bg-white"
            }`}
          >
            <span className="text-xl">📁</span>
            <span className="text-[10px] font-bold text-[#404040] text-center leading-3">
              Click to choose file or drag/drop here
            </span>
            <span className="text-[8.5px] font-normal text-gray-500 font-mono text-center leading-normal">
              Supports any system media or text configurations
            </span>
          </div>
        )}
      </div>

      {/* Button Tray */}
      <div className="bg-[#d4d0c8] p-2 border-t border-[#bab3a8] flex items-center justify-end gap-1.5 shrink-0">
        {diag.type !== "import" && diag.options?.map((opt: string) => (
          <button
            key={opt}
            onClick={() => handleAction(opt)}
            className="px-4 py-1 bg-[#d4d0c8] text-black font-bold border-2 border-t-white border-l-white border-r-black border-b-black hover:bg-[#c4c0b8] active:border-t-black active:border-l-black active:border-r-white active:border-b-white text-[10.5px] uppercase select-none min-w-[64px]"
          >
            {opt}
          </button>
        ))}
        {diag.type === "import" && (
          <button
            onClick={() => onClose(diag.id, null)}
            className="px-4 py-1 bg-[#d4d0c8] text-black font-bold border-2 border-t-white border-l-white border-r-black border-b-black hover:bg-[#c4c0b8] active:border-t-black active:border-l-black active:border-r-white active:border-b-white text-[10.5px] uppercase select-none min-w-[64px]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
