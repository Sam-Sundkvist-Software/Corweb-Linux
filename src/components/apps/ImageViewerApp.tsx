import React, { useState, useEffect, useRef } from "react";
import { SystemCallInterface } from "../../types/os";
import { Image as ImageIcon, FolderOpen, Sliders, Settings, Zap, ArrowLeft, RotateCw } from "lucide-react";

interface ImageViewerAppProps {
  syscall: SystemCallInterface;
  initialFilePath?: string;
}

export default function ImageViewerApp({ syscall, initialFilePath }: ImageViewerAppProps) {
  const [filePath, setFilePath] = useState<string>(initialFilePath || "");
  const [fileContent, setFileContent] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Quality settings for downscaling
  const [resolution, setResolution] = useState<number>(32); // 8 to 128
  const [bitDepth, setBitDepth] = useState<number>(4); // 2, 4, 8, 16, 32 BPP
  const [analogGrain, setAnalogGrain] = useState<boolean>(true);
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [vHoldJitter, setVHoldJitter] = useState<number>(0); // 0 to 10
  const [rotation, setRotation] = useState<number>(0);

  // File browser states
  const [showFileOpen, setShowFileOpen] = useState<boolean>(false);
  const [filesInDir, setFilesInDir] = useState<string[]>([]);
  const [scanDir, setScanDir] = useState<string>("/home/guest/Desktop");

  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noiseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (fileContent.startsWith("data:image/")) {
      const img = new Image();
      img.src = fileContent;
      img.onload = () => {
        setLoadedImage(img);
      };
      img.onerror = () => {
        setLoadedImage(null);
      };
    } else {
      setLoadedImage(null);
    }
  }, [fileContent]);

  // Load file content
  const loadFile = (path: string) => {
    try {
      const content = syscall.readFile(path);
      if (content.startsWith("Error:")) {
        setErrorMsg(content);
        setFileContent("");
      } else {
        setFilePath(path);
        setFileContent(content);
        setErrorMsg("");
        syscall.syslog(`Image Viewer loaded file: ${path}`);
      }
    } catch (e: any) {
      setErrorMsg(`Failed to open image file: ${e.message}`);
    }
  };

  useEffect(() => {
    if (initialFilePath) {
      loadFile(initialFilePath);
    } else {
      // Find files in desktop
      scanVfsDirectory();
    }
  }, [initialFilePath, syscall]);

  const scanVfsDirectory = () => {
    try {
      const curUser = syscall.getCurrentUser();
      const targetDir = `/home/${curUser}/Desktop`;
      setScanDir(targetDir);
      const items = syscall.listDir(targetDir);
      const fileNames = items
        .filter((item) => item.type === "FILE" && (item.name.toLowerCase().endsWith(".jpg") || item.name.toLowerCase().endsWith(".jpeg") || item.name.toLowerCase().endsWith(".png") || item.name.toLowerCase().endsWith(".gif") || item.name.toLowerCase().endsWith(".bmp") || item.name.toLowerCase().endsWith(".txt")))
        .map((item) => item.name);
      setFilesInDir(fileNames);
    } catch {
      // fallback
    }
  };

  // Redraw the canvas content based on loaded mock media format OR procedural content
  const renderImageToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = resolution;
    const h = resolution;
    canvas.width = w;
    canvas.height = h;

    // Check if we are drawing the special vintage sunset
    const isSunset = fileContent.includes("[IMAGE_SUNSET_MOCK]") || filePath.endsWith(".jpg");
    
    // Draw base pixels onto downscaled canvas
    ctx.clearRect(0, 0, w, h);

    if (loadedImage) {
      ctx.drawImage(loadedImage, 0, 0, w, h);
    } else if (isSunset) {
      // Procedurally render a classic low-res sun setting behind hills
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, "#01123a"); // Deep space night
      skyGrad.addColorStop(0.3, "#42023a"); // Twilight violent purple
      skyGrad.addColorStop(0.6, "#d1313d"); // Tangerine orange
      skyGrad.addColorStop(0.9, "#fce94f"); // Sunny yellow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Low res sun circle
      ctx.fillStyle = "#edd400";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.6 + Math.sin(Date.now() / 2000) * 2, h * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Hill vectors (low res steps)
      ctx.fillStyle = "#2e3436";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.78);
      ctx.quadraticCurveTo(w * 0.35, h * 0.65, w * 0.7, h * 0.82);
      ctx.lineTo(w, h * 0.82);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Second foreground hill
      ctx.fillStyle = "#0c1012";
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.88);
      ctx.quadraticCurveTo(w * 0.65, h * 0.75, w, h * 0.9);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.3, h);
      ctx.closePath();
      ctx.fill();

      // Reflections lines (horizontal slashes)
      ctx.strokeStyle = "#f57900";
      ctx.lineWidth = 1;
      for (let y = Math.floor(h * 0.7); y < h; y += 3) {
        ctx.beginPath();
        ctx.moveTo(w * 0.45 - (y - h * 0.7) * 0.4, y);
        ctx.lineTo(w * 0.55 + (y - h * 0.7) * 0.4, y);
        ctx.stroke();
      }
    } else {
      // Procedurally draw abstract geometric pixelated blocks generated from the file text hash
      const hashStr = fileContent || "empty image content metadata bytes vfs 2026-05-30";
      
      // Draw grid pattern in canvas based on text characters
      let charIdx = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const code = hashStr.charCodeAt(charIdx % hashStr.length) || 32;
          charIdx++;

          // Derive a low-res color
          const r = (code * 7) % 256;
          const g = (code * 17) % 256;
          const b = (code * 31) % 256;

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw simple wireframe circles or crosses
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.stroke();
    }

    // Capture pixel data to apply retro quality metrics (BPP quantization and noise/grain)
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    // Apply color quantization / bit depth downscaling
    // 2 BPP, 4 BPP, 8 BPP, etc.
    const levels = Math.max(2, Math.pow(2, Math.floor(bitDepth / 2))); // number of color divisions

    for (let i = 0; i < pixels.length; i += 4) {
      let r = pixels[i];
      let g = pixels[i + 1];
      let b = pixels[i + 2];

      // Quantize
      r = Math.round(r / 255 * (levels - 1)) * (255 / (levels - 1));
      g = Math.round(g / 255 * (levels - 1)) * (255 / (levels - 1));
      b = Math.round(b / 255 * (levels - 1)) * (255 / (levels - 1));

      // Apply low-bit grayscale filters for extremely low bit depth
      if (bitDepth <= 2) {
        const grey = Math.round((r + g + b) / 3);
        const mono = grey > 120 ? 255 : 0;
        pixels[i] = mono;
        pixels[i + 1] = mono;
        pixels[i + 2] = mono;
      } else {
        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
      }

      // Add retro analog white noise / fuzz
      if (analogGrain) {
        const fuzz = (Math.random() - 0.5) * 55;
        pixels[i] = Math.max(0, Math.min(255, pixels[i] + fuzz));
        pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + fuzz));
        pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + fuzz));
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    renderImageToCanvas();
  }, [fileContent, filePath, resolution, bitDepth, analogGrain, rotation, loadedImage]);

  // Keep rendering moving grain noise or jitter if enabled recursively
  useEffect(() => {
    if (analogGrain || vHoldJitter > 0) {
      const tick = () => {
        renderImageToCanvas();
        noiseTimerRef.current = window.setTimeout(tick, 220);
      };
      noiseTimerRef.current = window.setTimeout(tick, 220);
    }
    return () => {
      if (noiseTimerRef.current) clearTimeout(noiseTimerRef.current);
    };
  }, [analogGrain, fileContent, resolution, bitDepth, vHoldJitter]);

  return (
    <div className="flex-1 bg-[#d4d0c8] text-black flex flex-col min-h-0 select-none font-sans">
      {/* Menu Options Bar */}
      <div className="bg-[#ede9e2] border-b border-t border-t-white border-b-gray-400 p-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              scanVfsDirectory();
              setShowFileOpen(!showFileOpen);
            }}
            className="px-3 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-t-[#808080] active:border-l-[#808080] flex items-center space-x-1 cursor-pointer font-bold"
          >
            <FolderOpen className="w-3.5 h-3.5 text-yellow-600" />
            <span>Open VFS File</span>
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="px-2 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] flex items-center space-x-1 cursor-pointer"
            title="Rotate 90deg"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 font-mono text-[10px] text-gray-600">
          <span className="font-bold text-[#002080]">Format:</span>
          <span>{filePath ? filePath.substring(filePath.lastIndexOf(".") + 1).toUpperCase() : "Procedural"}</span>
          <span className="text-gray-400">|</span>
          <span className="font-bold text-[#002080]">Resolution:</span>
          <span>{resolution}x{resolution}</span>
        </div>
      </div>

      {/* Main split work-frame layout */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Dropdown File Explorer */}
        {showFileOpen && (
          <div className="absolute top-0 left-0 right-0 max-h-56 bg-[#e4e0d8] border-b-2 border-r-2 border-l-2 border-[#808080] p-3 z-25 shadow-2xl flex flex-col min-h-0">
            <span className="font-bold text-slate-800 border-b border-gray-400 pb-1 flex items-center uppercase text-[10px] mb-2">
              📂 Quick File Mounter ({scanDir})
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white p-1">
              {filesInDir.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    loadFile(`${scanDir}/${name}`);
                    setShowFileOpen(false);
                  }}
                  className="w-full text-left font-mono text-xs hover:bg-[#002080] hover:text-white px-2 py-1 flex items-center space-x-1"
                >
                  <span>🖼️</span>
                  <span>{name}</span>
                </button>
              ))}
              {filesInDir.length === 0 && (
                <p className="text-gray-400 italic text-center p-3 text-[11px]">
                  No images/files in Desktop. Try seeding more.
                </p>
              )}
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setShowFileOpen(false)}
                className="px-3 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-black border-b-black font-bold uppercase text-[10px]"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Display screen pane */}
        <div className="flex-1 bg-neutral-900 flex items-center justify-center p-4 relative overflow-hidden border-2 border-t-gray-500 border-l-gray-500 border-r-white border-b-white m-1">
          {/* Virtual Interference overlay effects */}
          {scanlines && (
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] z-10 opacity-60" />
          )}
          
          {errorMsg ? (
            <div className="p-3 bg-red-950/80 border-2 border-red-700 text-red-300 font-mono text-center rounded max-w-xs break-all leading-5">
              🛑 KERNEL DISK FAULT:
              <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
            </div>
          ) : !filePath ? (
            <div className="text-center font-mono text-gray-500 space-y-2 p-4">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-700 animate-pulse" />
              <p className="text-xs">No media file targeted for extraction.</p>
              <button
                onClick={() => {
                  scanVfsDirectory();
                  setShowFileOpen(true);
                }}
                className="px-3 py-1 bg-[#ede9e2] text-black font-bold border border-t-white border-l-white border-r-[#808080] border-b-[#808080] mt-2 active:border-t-[#808080] active:border-l-[#808080] flex items-center space-x-1.5 mx-auto"
              >
                <FolderOpen className="w-3.5 h-3.5 text-yellow-600" />
                <span>Mount sample file</span>
              </button>
            </div>
          ) : (
            <div 
              className="relative overflow-hidden transition-transform duration-100"
              style={{ 
                transform: `rotate(${rotation}deg) translateY(${Math.random() * vHoldJitter}px)`,
                maxWidth: "100%", 
                maxHeight: "100%",
                aspectRatio: "1"
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px] shadow-2xl object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          )}
        </div>

        {/* Side controller settings panel */}
        <div className="w-48 bg-[#ede9e2] border-l border-[#808080] p-3 flex flex-col justify-between shrink-0 m-1 select-none">
          <div className="space-y-3.5">
            <span className="font-bold text-[#002080] border-b border-gray-400 pb-1.5 flex items-center space-x-1.5 uppercase text-[9.5px]">
              <Sliders className="w-3.5 h-3.5" />
              <span>DOWNSCALE METRICS</span>
            </span>

            {/* Quality Crash Resolution Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">CRAP INDEX:</span>
                <span className="font-mono text-[#730500] font-black">{resolution}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                step="8"
                value={resolution}
                onChange={(e) => setResolution(parseInt(e.target.value, 10))}
                className="w-full accent-[#730500] h-1 bg-gray-300 rounded-lg cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Intentionally skips scan registers to truncate grid cells.</p>
            </div>

            {/* Color Depth quantization */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">COLOR DEPTH:</span>
                <span className="font-mono text-[#002080] font-black">{bitDepth} BPP</span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="2"
                value={bitDepth}
                onChange={(e) => setBitDepth(parseInt(e.target.value, 10))}
                className="w-full accent-[#002080] h-1 bg-gray-300 rounded-lg cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Quantizes pixel integers into restricted 8/16 color divisions.</p>
            </div>

            {/* Jitter / Vertical interruption */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">V-HOLD JITTER:</span>
                <span className="font-mono text-gray-800 font-black">{vHoldJitter} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={vHoldJitter}
                onChange={(e) => setVHoldJitter(parseInt(e.target.value, 10))}
                className="w-full accent-neutral-800 h-1 bg-gray-300 rounded-lg cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Simulates failing cathode-ray tubes scanning beam sync.</p>
            </div>

            <hr className="border-[#beb8ad]" />

            {/* Fuzz check switches */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[10.5px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={analogGrain}
                  onChange={(e) => setAnalogGrain(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#002080]"
                />
                <span className="font-bold text-gray-700">Analog Grain Fuzz</span>
              </label>

              <label className="flex items-center space-x-2 text-[10.5px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={scanlines}
                  onChange={(e) => setScanlines(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#002080]"
                />
                <span className="font-bold text-gray-700">Interlace Scanlines</span>
              </label>
            </div>
          </div>

          <div className="bg-white p-1.5 border leading-4 mt-4 select-text">
            <span className="block text-[8.5px] font-extrabold text-blue-700 uppercase font-mono">EXTRACTED PATH:</span>
            <p className="font-mono text-[9px] text-gray-600 truncate" title={filePath}>{filePath || "[No media mounted]"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
