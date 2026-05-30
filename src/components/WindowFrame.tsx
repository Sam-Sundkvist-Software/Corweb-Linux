import React, { useRef, useState, useEffect } from "react";
import { WindowInstance } from "../types/os";
import { Minus, Square, X } from "lucide-react";

interface WindowFrameProps {
  win: WindowInstance;
  isActive: boolean;
  isDisabled?: boolean;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number, x?: number, y?: number) => void;
  children: any;
  activeDialog?: any;
  onCloseDialog?: (id: string, result: any) => void;
  key?: any;
}

export default function WindowFrame({
  win,
  isActive,
  isDisabled = false,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  children,
  activeDialog,
  onCloseDialog,
}: WindowFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);

  const startDragRef = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });
  const startResizeRef = useRef({ mouseX: 0, mouseY: 0, winW: 0, winH: 0, winX: 0, winY: 0 });

  // Handle Dragging
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (isDisabled) return;
    if (win.isMaximized) return;
    onFocus(win.id);

    // Skip drag if user is clicking a button
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;

    setIsDragging(true);
    startDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.x,
      winY: win.y,
    };
    e.preventDefault();
  };

  // Handle Resize Corner Click
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    if (isDisabled) return;
    if (win.isMaximized) return;
    onFocus(win.id);
    setIsResizing(direction);
    startResizeRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winW: win.width,
      winH: win.height,
      winX: win.x,
      winY: win.y,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - startDragRef.current.mouseX;
        const deltaY = e.clientY - startDragRef.current.mouseY;
        const targetX = Math.max(0, startDragRef.current.winX + deltaX);
        const targetY = Math.max(28, startDragRef.current.winY + deltaY); // Safe limit beneath top panel
        onMove(win.id, targetX, targetY);
      } else if (isResizing) {
        const deltaX = e.clientX - startResizeRef.current.mouseX;
        const deltaY = e.clientY - startResizeRef.current.mouseY;

        let newW = startResizeRef.current.winW;
        let newH = startResizeRef.current.winH;
        let newX = win.x;
        let newY = win.y;

        if (isResizing.includes("e")) {
          newW = startResizeRef.current.winW + deltaX;
        }
        if (isResizing.includes("s")) {
          newH = startResizeRef.current.winH + deltaY;
        }
        if (isResizing.includes("w")) {
          newW = startResizeRef.current.winW - deltaX;
          newX = startResizeRef.current.winX + deltaX;
        }
        if (isResizing.includes("n")) {
          newH = startResizeRef.current.winH - deltaY;
          newY = startResizeRef.current.winY + deltaY;
        }

        onResize(win.id, newW, newH, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, win, onMove, onResize]);

  // Set icons & extras based on app ID
  let titleIcon = "💻";
  let ledGlowClass: string | null = null;
  let extraHeaderDecoration: React.ReactNode | null = null;
  let headerThemeClass = "";

  const isTerminal = win.appId === "terminalUF";
  const isFileManager = win.appId === "fileManagerUF";
  const isLeafpad = win.appId === "leafpadUF";
  const isMinesweeper = win.appId === "minesweeperUF";
  const isSurfer = win.appId === "surferUF";
  const isSystemControl = ["controlPanelUFD", "systemMonitorUFD", "systemFlagEditorUFD"].includes(win.appId);

  if (isTerminal) {
    titleIcon = "📟";
    ledGlowClass = "glowing-led-green";
    headerThemeClass = "header-terminal";
  } else if (isFileManager) {
    titleIcon = "💧";
    headerThemeClass = "header-filemanager";
  } else if (isLeafpad) {
    titleIcon = "🪶";
    extraHeaderDecoration = <span className="text-[9px] opacity-75 ml-2 font-mono italic select-none">(edit buffer)</span>;
    headerThemeClass = "header-leafpad";
  } else if (isMinesweeper) {
    titleIcon = "👾";
    headerThemeClass = "header-minesweeper";
  } else if (isSurfer) {
    titleIcon = "🕸️";
    extraHeaderDecoration = <span className="bg-[#e4e0d8] border border-[#a0a0a0] text-gray-700 text-[8px] px-1 py-0.5 ml-2 font-sans font-bold">WWW READY</span>;
    headerThemeClass = "header-surfer";
  } else if (isSystemControl) {
    titleIcon = "⚙️";
    ledGlowClass = "glowing-led-red";
    extraHeaderDecoration = <span className="bg-[#fee2e2] border border-[#fca5a5] text-red-800 text-[8px] uppercase px-1 ml-2 font-sans font-bold">SECURE CORE</span>;
    headerThemeClass = "header-system";
  }

  const headerClass = `silver-header ${headerThemeClass} ${isActive ? "" : "silver-header-inactive"}`;
  
  // Dragging should be instant (no transitions during drag/resize)
  const isTransitioning = !isDragging && (isResizing === null);
  const transitionClass = isTransitioning ? "transition-all duration-150 ease-out" : "";
  const windowStatusClass = isActive ? "silver-window-active" : "silver-window-inactive";
  const windowClasses = `silver-window absolute ${windowStatusClass} ${transitionClass}`;
 
  const style: React.CSSProperties = win.isMaximized
    ? {
        top: "28px", // below our desk top panel
        left: "0",
        width: "100vw",
        height: "calc(100vh - 56px)", // fitting nicely between top and bottom bar
        zIndex: win.zIndex,
      }
    : {
        top: `${win.y}px`,
        left: `${win.x}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.zIndex,
      };

  if (win.isMinimized) {
    return null;
  }

  return (
    <div
      ref={frameRef}
      id={win.id}
      className={windowClasses}
      style={style}
      onClick={() => !isDisabled && onFocus(win.id)}
    >
      {/* TrashLinux Window Header Panel */}
      <div
        className={headerClass}
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={() => onMaximize(win.id)}
      >
        <div className="silver-window-title truncate">
          {ledGlowClass && (
            <div className={`${ledGlowClass} shrink-0`} />
          )}
          <span className="select-none truncate">
            {titleIcon} {win.title}
          </span>
          {extraHeaderDecoration}
        </div>

        {/* Action Buttons */}
        <div className="silver-btn-grp">
          {/* Minimize Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(win.id);
            }}
            className="silver-btn"
            title="Minimize"
          >
            _
          </button>

          {/* Maximize Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize(win.id);
            }}
            className="silver-btn"
            title="Maximize"
          >
            □
          </button>

          {/* Close Window Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(win.id);
            }}
            className="silver-btn silver-btn-close"
            title="Close"
          >
            X
          </button>
        </div>
      </div>

      {/* Application Container Canvas */}
      <div className="flex-1 min-h-0 relative bg-[#eeeeec] text-black flex flex-col font-mono select-text">
        {/* Interactive Diagonal Gloss overlay across the window pane */}
        <div className="gloss-overlay" />

        {isTerminal && (
          <div className="crt-screen-overlay" />
        )}

        {children}

        {/* Disabled Overlay if process is not focused (simulating classic window locks) */}
        {!isActive && (
          <div className="absolute inset-0 bg-black/5 pointer-events-none z-40" />
        )}

        {/* Modal disable guard overlay */}
        {isDisabled && (
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px] flex items-center justify-center select-none cursor-default pointer-events-auto z-50 p-2.5">
            {activeDialog ? (
              <InnerDialogOverlay diag={activeDialog} onClose={onCloseDialog!} />
            ) : (
              <div className="bg-[#ede9e2] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] px-4 py-2 font-sans font-bold text-[#404040] shadow-md uppercase tracking-wide text-xs flex items-center space-x-2 animate-[pulse_2s_infinite]">
                <span>🔒 Locked by Dialog</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resize handles */}
      {!win.isMaximized && (
        <>
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize flex items-end justify-end p-0.5"
            onMouseDown={(e) => handleResizeMouseDown(e, "se")}
          >
            {/* Skeuomorphic visual ridges */}
            <svg
              className="w-2 h-2 text-[#a59180] opacity-75"
              viewBox="0 0 10 10"
              fill="currentColor"
            >
              <line x1="8" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.2" />
              <line x1="8" y1="3.5" x2="3.5" y2="8" stroke="currentColor" strokeWidth="1.2" />
              <line x1="8" y1="6.8" x2="6.8" y2="8" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          <div
            className="absolute bottom-0 left-0 right-3.5 h-1 cursor-s-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "s")}
          />
          <div
            className="absolute top-7 bottom-3.5 right-0 w-1 cursor-e-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "e")}
          />
          <div
            className="absolute top-7 bottom-3.5 left-0 w-1 cursor-w-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "w")}
          />
        </>
      )}
    </div>
  );
}

function InnerDialogOverlay({ diag, onClose }: { diag: any; onClose: (id: string, res: any) => void }) {
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
      className="w-full max-w-[285px] bg-[#d4d0c8] border-[3px] border-t-white border-l-white border-r-[#404040] border-b-[#404040] shadow-xl flex flex-col overflow-hidden text-black text-left font-sans animate-[popIn_0.15s_ease-out]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Title */}
      <div className="bg-gradient-to-r from-[#0055d4] to-[#3381cc] px-2 py-1 flex items-center justify-between text-white select-none">
        <span className="font-bold text-[10px] font-mono tracking-wide truncate">
          ✨ {diag.title || "App Query"}
        </span>
        <button
          onClick={() => handleAction("Cancel")}
          className="w-3.5 h-3.5 bg-[#d4d0c8] text-black font-bold text-[8.5px] border border-t-white border-l-white border-r-black border-b-black hover:bg-[#c0c0c0] flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* Main Area */}
      <div className="p-2.5 bg-[#ede9e2] border-b border-[#bab3a8] flex flex-col space-y-2">
        <div className="flex items-start space-x-2">
          <div className="shrink-0 pt-0.5">{getIcon()}</div>
          <div className="flex-1 text-[10.5px] leading-4 text-gray-800 font-bold font-mono">
            {diag.message}
          </div>
        </div>

        {diag.type === "input" && (
          <div className="mt-1 p-0.5 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-transparent outline-none border-none text-[10.5px] font-mono text-gray-800 p-0.5"
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
            className={`cursor-pointer border-2 border-dashed rounded-sm p-3.5 flex flex-col items-center justify-center space-y-1.5 select-none transition-colors ${
              isDragOver ? "border-[#0055d4] bg-[#0055d4]/10" : "border-[#808080] hover:bg-gray-100 bg-white"
            }`}
          >
            <span className="text-lg">📁</span>
            <span className="text-[9.5px] font-bold text-[#404040] text-center leading-3">
              Click to choose file or drag/drop here
            </span>
            <span className="text-[8px] font-normal text-gray-500 font-mono text-center leading-normal">
              Any files, including images, video, audio and text
            </span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="bg-[#d4d0c8] p-1 flex items-center justify-end gap-1">
        {diag.type !== "import" && diag.options?.map((opt: string) => (
          <button
            key={opt}
            onClick={() => handleAction(opt)}
            className="px-2.5 py-1 bg-[#d4d0c8] text-black font-bold border border-t-white border-l-white border-r-black border-b-black hover:bg-[#c4c0b8] text-[9.5px] uppercase select-none min-w-[50px]"
          >
            {opt}
          </button>
        ))}
        {diag.type === "import" && (
          <button
            onClick={() => onClose(diag.id, null)}
            className="px-2.5 py-1 bg-[#d4d0c8] text-black font-bold border border-t-white border-l-white border-r-black border-b-black hover:bg-[#c4c0b8] text-[9.5px] uppercase select-none min-w-[50px]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
