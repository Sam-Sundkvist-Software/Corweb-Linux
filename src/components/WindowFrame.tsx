import React, { useRef, useState, useEffect } from "react";
import { WindowInstance } from "../types/os";
import { Minus, Square, X } from "lucide-react";
import { useStyleSystem } from "../context/StyleSystemContext";

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

  const { resolvedStyle: windowStyleSystemProps } = useStyleSystem("div", "silver-window", win.id);
  const { resolvedStyle: headerStyleSystemProps } = useStyleSystem("div", isActive ? "silver-header" : "silver-header-inactive");
  const { resolvedStyle: buttonStyleSystemProps } = useStyleSystem("button", "silver-btn");

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
        ...windowStyleSystemProps
      }
    : {
        top: `${win.y}px`,
        left: `${win.x}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.zIndex,
        ...windowStyleSystemProps
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
        style={headerStyleSystemProps}
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
            style={buttonStyleSystemProps}
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
            style={buttonStyleSystemProps}
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
            style={buttonStyleSystemProps}
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
          <div className="absolute inset-0 bg-black/15 flex items-center justify-center select-none cursor-not-allowed pointer-events-auto z-50 p-2.5">
            <div className="bg-[#ede9e2] border-2 border-[#808080] px-4 py-2 font-sans font-bold text-[#404040] shadow-md uppercase tracking-wide text-[10px] flex items-center space-x-1">
              <span>🔒 Locked by Dialog Window</span>
            </div>
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
