import React, { useState } from "react";
import { DialogInstance } from "../types/os";
import { AlertCircle, Disc, Info, HelpCircle, CornerDownRight } from "lucide-react";

interface SystemDialogsProps {
  dialogs: DialogInstance[];
  onCloseDialog: (id: string, result: any) => void;
}

export default function SystemDialogs({ dialogs, onCloseDialog }: SystemDialogsProps) {
  if (!dialogs || dialogs.length === 0) return null;

  // Render ONLY system dialogs (of heavy importance that do not have an ownerWindowId) globally
  const systemDialogs = dialogs.filter((diag) => !diag.ownerWindowId);
  if (systemDialogs.length === 0) return null;

  return (
    <div className="absolute inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      {systemDialogs.map((diag) => (
        <DialogCard key={diag.id} diag={diag} onClose={onCloseDialog} />
      ))}
    </div>
  );
}

function DialogCard({ diag, onClose }: { diag: DialogInstance; onClose: (id: string, result: any) => void; key?: any }) {
  const [inputVal, setInputVal] = useState(diag.inputValue || "");

  const handleAction = (option: string) => {
    if (diag.type === "input") {
      onClose(diag.id, { button: option, value: inputVal });
    } else {
      onClose(diag.id, option);
    }
  };

  const getIcon = () => {
    switch (diag.type) {
      case "error":
        return <span className="text-3xl shrink-0">🛑</span>;
      case "warning":
        return <span className="text-3xl shrink-0">⚠️</span>;
      case "question":
        return <span className="text-3xl shrink-0">❓</span>;
      case "input":
        return <span className="text-3xl shrink-0">✏️</span>;
      case "info":
      default:
        return <span className="text-3xl shrink-0">ℹ️</span>;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] flex items-center justify-center p-4 pointer-events-auto z-[10000]">
      {/* KDE 3.x / early 2000s clunky plastic bezel card */}
      <div 
        id={diag.id}
        className="w-full max-w-sm bg-[#d4d0c8] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-2xl flex flex-col overflow-hidden text-black animate-[popIn_0.15s_ease-out]"
      >
        {/* Graded blue Titlebar with distinctive metal line */}
        <div className="bg-gradient-to-r from-[#0055d4] via-[#3381cc] to-[#0055d4] p-1.5 flex items-center justify-between text-white border-b border-white select-none">
          <span className="font-bold text-[11px] font-mono tracking-wide truncate">
            ✨ {diag.title || "VFS System Prompt"}
          </span>
          <button
            onClick={() => handleAction("Cancel")}
            className="w-4.5 h-4.5 bg-[#d4d0c8] text-black font-extrabold font-mono text-[9px] border border-t-white border-l-white border-r-black border-b-black hover:bg-[#c0c0c0] flex items-center justify-center p-0 select-none pb-0.5"
            title="Dismiss dialogue prompt"
          >
            ✕
          </button>
        </div>

        {/* Dialog Context container with vintage double bevel */}
        <div className="p-4 flex items-start space-x-3.5 bg-[#ede9e2] border-b border-[#bab3a8]">
          {getIcon()}
          
          <div className="flex-1 space-y-2 select-text text-gray-800">
            <p className="font-mono text-[11px] leading-5 font-bold tracking-tight">
              {diag.message}
            </p>

            {diag.type === "input" && (
              <div className="mt-1.5 p-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white flex items-center">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full bg-transparent outline-none border-none text-[11.5px] font-mono text-gray-800 select-text p-0"
                  placeholder="Enter feedback value..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAction("OK");
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Vintage foot action drawer */}
        <div className="bg-[#d4d0c8] p-2 flex items-center justify-end gap-1.5">
          {diag.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAction(opt)}
              className="px-4 py-1.5 bg-[#d4d0c8] text-black font-bold border-2 border-t-white border-l-white border-r-black border-b-black hover:bg-[#c4c0b8] active:border-t-black active:border-l-black active:border-r-white active:border-b-white text-[10.5px] focus:outline-none min-w-[64px] select-none uppercase"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
