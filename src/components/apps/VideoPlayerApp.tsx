import React, { useState, useEffect, useRef } from "react";
import { SystemCallInterface } from "../../types/os";
import { Play, Pause, Square, Sliders, Volume2, VolumeX, FolderOpen, AlertCircle, RefreshCw } from "lucide-react";

interface VideoPlayerAppProps {
  syscall: SystemCallInterface;
  initialFilePath?: string;
}

export default function VideoPlayerApp({ syscall, initialFilePath }: VideoPlayerAppProps) {
  const [filePath, setFilePath] = useState<string>(initialFilePath || "");
  const [fileContent, setFileContent] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Media state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(100); // in percent / arbitrary ticks
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Poor quality metrics
  const [fps, setFps] = useState<number>(4); // pathetic 1 to 8 frames per second
  const [macroblockScale, setMacroblockScale] = useState<number>(12); // block grouping size
  const [bufferingDelay, setBufferingDelay] = useState<number>(2); // 0 to 10 scale of random buffer stalls
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [colorWash, setColorWash] = useState<string>("green"); // green, monochrome, cga

  // File browser states
  const [showFileOpen, setShowFileOpen] = useState<boolean>(false);
  const [filesInDir, setFilesInDir] = useState<string[]>([]);
  const [scanDir, setScanDir] = useState<string>("/home/guest/Desktop");

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const bufferTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (fileContent.startsWith("data:video/")) {
      const vid = document.createElement("video");
      vid.src = fileContent;
      vid.muted = isMuted;
      vid.loop = true;
      vid.playsInline = true;
      
      vid.onloadedmetadata = () => {
        setDuration(Math.floor(vid.duration * fps) || 100);
      };

      setVideoElement(vid);
    } else {
      setVideoElement(null);
    }
  }, [fileContent]);

  useEffect(() => {
    if (!videoElement) return;
    if (isPlaying && !isBuffering) {
      videoElement.play().catch(() => {});
    } else {
      videoElement.pause();
    }
  }, [isPlaying, isBuffering, videoElement]);

  useEffect(() => {
    if (!videoElement) return;
    videoElement.muted = isMuted;
  }, [isMuted, videoElement]);

  useEffect(() => {
    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
      }
    };
  }, [videoElement]);

  // Load a file
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
        setCurrentTime(0);
        syscall.syslog(`Video Player opened file: ${path}`);
      }
    } catch (e: any) {
      setErrorMsg(`Failed to open media file: ${e.message}`);
    }
  };

  useEffect(() => {
    if (initialFilePath) {
      loadFile(initialFilePath);
    } else {
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
        .filter((item) => item.type === "FILE" && (item.name.toLowerCase().endsWith(".mp4") || item.name.toLowerCase().endsWith(".avi") || item.name.toLowerCase().endsWith(".mov") || item.name.toLowerCase().endsWith(".mkv") || item.name.toLowerCase().endsWith(".webm") || item.name.endsWith(".txt")))
        .map((item) => item.name);
      setFilesInDir(fileNames);
    } catch {
      // ignore
    }
  };

  // Web Audio synth overlay for crackly frame-skipping sound
  const initAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(45, ctx.currentTime); // very low hum sound

      gain.gain.setValueAtTime(0, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioCtxRef.current = ctx;
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
    } catch (e) {
      // audio blocked or not supported
    }
  };

  const setAudioVolume = (vol: number) => {
    if (!gainNodeRef.current || !audioCtxRef.current) return;
    try {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      gainNodeRef.current.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
    } catch (e) {
      // ignore
    }
  };

  const updateSoundPitch = (freq: number) => {
    if (!oscillatorRef.current || !audioCtxRef.current) return;
    try {
      oscillatorRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    } catch {
      // ignore
    }
  };

  // Perform render tick of our low-quality codec simulation
  const drawVideoFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pathetic source dimensions (e.g. 64x48 or 40x30 resolution)
    const w = 48;
    const h = 36;
    canvas.width = w;
    canvas.height = h;

    const isMatrix = fileContent.includes("[VIDEO_MATRIX_MOCK]") || filePath.endsWith(".mp4");
    
    // Clear screen
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    if (videoElement) {
      ctx.drawImage(videoElement, 0, 0, w, h);
    } else if (isMatrix) {
      // Draw pixelated digital rain elements
      ctx.fillStyle = "#15b01a";
      const columns = 8;
      for (let col = 0; col < columns; col++) {
        const xPos = Math.floor((col / columns) * w) + 2;
        // speed and position based on play-time & random multipliers
        const speed = 1.2;
        const offset = (currentTime * speed + col * 4) % h;

        // Leading bright character
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(xPos, offset, 2, 2);

        // Falling trace trail
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(xPos, Math.max(0, offset - 2), 2, 2);
        ctx.fillStyle = "#008000";
        ctx.fillRect(xPos, Math.max(0, offset - 4), 2, 2);
        ctx.fillStyle = "#003300";
        ctx.fillRect(xPos, Math.max(0, offset - 6), 2, 2);
      }

      // Draw random glitch bars
      if (Math.random() < 0.15) {
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(0, Math.floor(Math.random() * h), w, 1);
      }
    } else {
      // Render simple abstract 3D wireframe cube rotating
      const theta = currentTime * 0.11;
      const scale = 14 + Math.sin(currentTime * 0.05) * 4;

      // Projection points
      const points = [
        { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 },  { x: 1, y: -1, z: 1 },  { x: 1, y: 1, z: 1 },  { x: -1, y: 1, z: 1 }
      ];

      // Rotate points
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const transPoints = points.map(p => {
        // around Y
        let x1 = p.x * cosT - p.z * sinT;
        let z1 = p.x * sinT + p.z * cosT;
        // around X
        let y2 = p.y * cosT - z1 * sinT;
        
        return {
          x: w / 2 + x1 * scale,
          y: h / 2 + y2 * scale
        };
      });

      // Draw wireframe edges
      ctx.strokeStyle = colorWash === "cga" ? "#ff00ff" : "#ffffff";
      ctx.lineWidth = 1;
      const drawEdge = (i: number, j: number) => {
        ctx.beginPath();
        ctx.moveTo(transPoints[i].x, transPoints[i].y);
        ctx.lineTo(transPoints[j].x, transPoints[j].y);
        ctx.stroke();
      };

      for (let i = 0; i < 4; i++) {
        drawEdge(i, (i + 1) % 4);      // Back loop
        drawEdge(i + 4, ((i + 1) % 4) + 4);  // Front loop
        drawEdge(i, i + 4);              // Joins
      }
    }

    // Capture pixels to apply terrible Macroblock compression & grain overlays
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    // Emulate VGA color washes or pixel conversions
    for (let y = 0; y < h; y += macroblockScale) {
      for (let x = 0; x < w; x += macroblockScale) {
        // Grab representative pixel for this macroblock cluster
        const repX = Math.min(w - 1, x);
        const repY = Math.min(h - 1, y);
        const repIdx = (repY * w + repX) * 4;
        
        let r = pixels[repIdx];
        let g = pixels[repIdx + 1];
        let b = pixels[repIdx + 2];

        // Apply harsh color limits representing low bandwidth (e.g. 1-bit or CGA color styles)
        if (colorWash === "green") {
          g = Math.max(r, g, b);
          r = 0;
          b = 0;
        } else if (colorWash === "monochrome") {
          const luma = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
          r = luma; g = luma; b = luma;
        }

        // Fill entire macroblock cluster with the representation pixel
        for (let bY = 0; bY < macroblockScale && (y + bY) < h; bY++) {
          for (let bX = 0; bX < macroblockScale && (x + bX) < w; bX++) {
            const curIdx = ((y + bY) * w + (x + bX)) * 4;
            
            // Add some jitter/noise overlay to make macroblocks scan-buggy
            const macroNoise = (Math.random() - 0.5) * 35;
            
            pixels[curIdx] = Math.max(0, Math.min(255, r + macroNoise));
            pixels[curIdx + 1] = Math.max(0, Math.min(255, g + macroNoise));
            pixels[curIdx + 2] = Math.max(0, Math.min(255, b + macroNoise));
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Modify synthetic pitch depending on visual events (e.g., matrix rain vs cubes)
    if (isPlaying && !isMuted) {
      const pitch = isMatrix ? 45 + (currentTime % 25) * 3 : 55 + (Math.sin(currentTime) * 15);
      updateSoundPitch(pitch);
    }
  };

  // Video looping timer
  useEffect(() => {
    if (isPlaying && !isBuffering) {
      const frameMS = Math.floor(1000 / fps);
      const tick = () => {
        // Mock occasional network buffering freezes (bitrate congestion)
        if (bufferingDelay > 0 && Math.random() < (bufferingDelay * 0.04)) {
          setIsBuffering(true);
          setAudioVolume(0); // mute audio hum during buffering
          
          const resumeDelay = 1200 + Math.random() * 2000;
          bufferTimerRef.current = window.setTimeout(() => {
            setIsBuffering(false);
            if (!isMuted) setAudioVolume(0.08); // restore volume
          }, resumeDelay);
          return;
        }

        setCurrentTime((prev) => {
          if (videoElement) {
            return Math.floor(videoElement.currentTime * fps);
          }
          const next = prev + 1;
          if (next >= duration) {
            return 0; // loop back
          }
          return next;
        });

        drawVideoFrame();
        playTimerRef.current = window.setTimeout(tick, frameMS);
      };

      playTimerRef.current = window.setTimeout(tick, frameMS);
    } else {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    };
  }, [isPlaying, isBuffering, fps, macroblockScale, duration, bufferingDelay, colorWash]);

  // Handle Play toggle
  const handlePlay = () => {
    initAudio();
    if (errorMsg) return;
    setIsPlaying(true);
    setIsBuffering(false);
    if (!isMuted) {
      setAudioVolume(0.08);
    }
    syscall.syslog(`Video playback started.`);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setAudioVolume(0);
    syscall.syslog(`Video playback paused.`);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioVolume(0);
    drawVideoFrame();
    syscall.syslog(`Video playback stopped.`);
  };

  const handleMuteToggle = () => {
    initAudio();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      setAudioVolume(0);
    } else if (isPlaying && !isBuffering) {
      setAudioVolume(0.08);
    }
  };

  // Initial render of black screen / logo
  useEffect(() => {
    drawVideoFrame();
  }, [filePath, fileContent, macroblockScale, colorWash]);

  // Clean audio on component dispose
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex-1 bg-[#d4d0c8] text-black flex flex-col min-h-0 select-none font-sans">
      {/* File Action Controls */}
      <div className="bg-[#ede9e2] border-b border-t border-t-white border-b-gray-400 p-2 flex items-center justify-between gap-1 text-xs">
        <button
          onClick={() => {
            scanVfsDirectory();
            setShowFileOpen(!showFileOpen);
          }}
          className="px-3 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-t-[#808080] active:border-l-[#808080] flex items-center space-x-1 cursor-pointer font-bold"
        >
          <FolderOpen className="w-3.5 h-3.5 text-yellow-600" />
          <span>Open Video File</span>
        </button>

        <div className="font-mono text-[9px] text-gray-500 flex items-center space-x-1">
          <span>CODEC: ULTRA_GLITCH_2006</span>
        </div>
      </div>

      {/* Main split lay frame */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Open VFS Dialog Dropdown */}
        {showFileOpen && (
          <div className="absolute top-0 left-0 right-0 max-h-52 bg-[#e4e0d8] border-b-2 border-r-2 border-l-2 border-[#808080] p-3 z-30 shadow-2xl flex flex-col min-h-0">
            <span className="font-bold text-slate-800 border-b border-gray-400 pb-1 flex items-center uppercase text-[10px] mb-2">
              📂 SELECT VIDEO FILE ({scanDir})
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
                  <span>📼</span>
                  <span>{name}</span>
                </button>
              ))}
              {filesInDir.length === 0 && (
                <p className="text-gray-400 italic text-center p-3 text-[11px]">
                  No videos/compatible VFS files found on Desktop.
                </p>
              )}
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setShowFileOpen(false)}
                className="px-3 py-0.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-black border-b-black font-bold uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Video Screen */}
        <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-3 m-1 border-2 border-t-gray-500 border-l-gray-500 border-r-white border-b-white relative overflow-hidden">
          {/* Interlacing Scanlines overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.45)_50%)] bg-[length:100%_6px] z-10 opacity-70" />

          {errorMsg ? (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-400 text-center rounded font-mono leading-5 max-w-xs text-xs">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-1" />
              <span>COULD NOT COMPILE MEDIA DRIVERS:</span>
              <p className="text-[10px] text-red-300 mt-1">{errorMsg}</p>
            </div>
          ) : !filePath ? (
            <div className="text-center font-mono text-gray-500 space-y-2">
              <span className="text-4xl animate-pulse block">📼</span>
              <p className="text-[10.5px]">Extract VFS payload for playback stream.</p>
              <button
                onClick={() => {
                  scanVfsDirectory();
                  setShowFileOpen(true);
                }}
                className="px-2.5 py-1 bg-[#ede9e2] text-black font-bold border border-t-white border-l-white border-r-[#808080] border-b-[#808080] mt-2 text-[10px]"
              >
                Choose default media file
              </button>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-72 h-56 sm:w-80 sm:h-60 md:w-96 md:h-72 object-contain shadow-2xl"
                style={{ imageRendering: "pixelated" }}
              />

              {/* Congested Buffering overlay screen */}
              {isBuffering && (
                <div id="video_buffering_box" className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center font-mono text-[11px] text-yellow-500 z-15">
                  <RefreshCw className="w-6 h-6 animate-spin text-yellow-500 mb-2" />
                  <span className="font-bold uppercase tracking-wider">LAGGING BUFFER FILL...</span>
                  <p className="text-[9px] text-gray-400 mt-0.5">SPEED: {(Math.random() * 8 + 4).toFixed(1)} KB/s (High Delay)</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Decoder parameters panel */}
        <div className="w-48 bg-[#ede9e2] border-l border-[#808080] p-3 flex flex-col justify-between shrink-0 m-1">
          <div className="space-y-3">
            <span className="font-bold text-[#002080] border-b border-gray-400 pb-1.5 flex items-center space-x-1.5 uppercase text-[9.5px]">
              <Sliders className="w-3.5 h-3.5" />
              <span>DECIMATOR TUNERS</span>
            </span>

            {/* Framerate Codec index */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">CODEC SPEED:</span>
                <span className="font-mono text-[#730500] font-black">{fps} FPS</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value, 10))}
                className="w-full accent-[#730500] h-1 bg-gray-300 rounded cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Extremely slow scan rate to emulate missing CPU registers.</p>
            </div>

            {/* Macroblock square size */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">COMPRESSION:</span>
                <span className="font-mono text-[#002080] font-black">{macroblockScale * 2}px</span>
              </div>
              <input
                type="range"
                min="3"
                max="16"
                step="2"
                value={macroblockScale}
                onChange={(e) => setMacroblockScale(parseInt(e.target.value, 10))}
                className="w-full accent-[#002080] h-1 bg-gray-300 rounded cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Groups raw code pixels into chunk clusters to save memory.</p>
            </div>

            {/* network congestion buffering */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">BUFFER LAGS:</span>
                <span className="font-mono text-gray-800 font-black">{bufferingDelay}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="2"
                value={bufferingDelay}
                onChange={(e) => setBufferingDelay(parseInt(e.target.value, 10))}
                className="w-full accent-neutral-800 h-1 bg-gray-300 rounded cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Triggers random frame pauses to emulate network limits.</p>
            </div>

            <hr className="border-[#beb8ad]" />

            {/* Color mode selector */}
            <div className="space-y-1">
              <span className="text-[9.5px] font-bold text-gray-500 uppercase block">VIDEO DECODER CHIP:</span>
              <select
                value={colorWash}
                onChange={(e) => setColorWash(e.target.value)}
                className="w-full font-mono bg-white text-xs border border-gray-400 p-1 text-black outline-none"
              >
                <option value="green">VT-100 CRT monochrome</option>
                <option value="monochrome">8-bit highcontrast grey</option>
                <option value="cga">CGA system palette 16-color</option>
                <option value="none">Standard TrueColor RGB</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-1.5 border leading-4 text-gray-500 select-text">
            <span className="block text-[8.5px] font-black text-[#500c00] uppercase font-mono">MOUNTED PAYLOAD:</span>
            <p className="font-mono text-[9px] truncate" title={filePath}>{filePath ? filePath.substring(filePath.lastIndexOf("/") + 1) : "[Void]"}</p>
          </div>
        </div>
      </div>

      {/* Playback Controls Bevel */}
      <div className="bg-[#ede9e2] border-t-2 border-white p-2 flex items-center justify-between gap-3">
        {/* Play/Pause control center */}
        <div className="flex items-center space-x-1">
          {isPlaying ? (
            <button
              onClick={handlePause}
              disabled={!filePath}
              className="px-3.5 py-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px hover:bg-neutral-200 cursor-pointer disabled:opacity-40"
              title="Pause Video"
            >
              <Pause className="w-3.5 h-3.5 text-black" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={!filePath}
              className="px-3.5 py-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px hover:bg-neutral-200 cursor-pointer disabled:opacity-40"
              title="Play Video"
            >
              <Play className="w-3.5 h-3.5 text-green-700" fill="currentColor" />
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={!filePath}
            className="p-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px hover:bg-neutral-200 cursor-pointer disabled:opacity-40"
            title="Stop Playback"
          >
            <Square className="w-3.5 h-3.5 text-red-700" fill="currentColor" />
          </button>
        </div>

        {/* Video progress mock selector bar */}
        <div className="flex-1 flex items-center bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white mx-1.5 py-2.5 px-2 relative h-4 overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#002080]/30 transition-all duration-200" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between text-[9px] font-mono px-2 text-black font-semibold z-10 pointer-events-none">
            <span>INDEX: {currentTime.toString().padStart(3, "0")}</span>
            <span>TOTAL: {duration.toString().padStart(3, "0")} frames</span>
          </div>
        </div>

        {/* Sound toggle controls */}
        <button
          onClick={handleMuteToggle}
          disabled={!filePath}
          className="p-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-neutral-200 cursor-pointer disabled:opacity-40"
          title="Mute hum synthesizer"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-800" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#002080]" />
          )}
        </button>
      </div>
    </div>
  );
}
