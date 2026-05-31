import React, { useState, useEffect, useRef } from "react";
import { SystemCallInterface } from "../../types/os";
import { Play, Pause, Square, Music, Volume2, VolumeX, FolderOpen, Sliders, Settings } from "lucide-react";

interface MusicPlayerAppProps {
  syscall: SystemCallInterface;
  initialFilePath?: string;
}

export default function MusicPlayerApp({ syscall, initialFilePath }: MusicPlayerAppProps) {
  const [filePath, setFilePath] = useState<string>(initialFilePath || "");
  const [fileContent, setFileContent] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Music state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Intentional Degradation dials
  const [sampleRateKhz, setSampleRateKhz] = useState<number>(2.2); // 1.1 Khz (awful) to 11.0 Khz (crap phone)
  const [bitcrushMultiplier, setBitcrushMultiplier] = useState<number>(3); // 1 to 8: higher means more static distortion
  const [tapeFlutter, setTapeFlutter] = useState<number>(4); // 0 to 10: freq pitch wow-and-flutter
  const [crackleNoise, setCrackleNoise] = useState<boolean>(true);

  // File browser states
  const [showFileOpen, setShowFileOpen] = useState<boolean>(false);
  const [filesInDir, setFilesInDir] = useState<string[]>([]);
  const [scanDir, setScanDir] = useState<string>("/home/guest/Desktop");

  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isAudioServerOnline, setIsAudioServerOnline] = useState<boolean>(true);

  // Graphic states: equalizer blocks
  const [eqBars, setEqBars] = useState<number[]>([1, 2, 4, 1, 3, 5, 2, 4]);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const visualsTimerRef = useRef<number | null>(null);

  // Melody data: retro 8-bit chiptune loop
  // Tuples representing [freq oscillator, duration in ms]
  const melodyChiptune = [
    261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66, // C4 D4 E4 F4 G4 F4 E4 D4
    392.00, 440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, // G4 A4 B4 C5 D5 C5 B4 A4
    523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33  // C5 D5 E5 F5 G5 F5 E5 D5
  ];

  useEffect(() => {
    const checkAudioServer = () => {
      try {
        const svcs = syscall.getServices();
        const audioSvc = svcs.find((s) => s.name === "audio-server.service");
        setIsAudioServerOnline(audioSvc ? audioSvc.status === "active" : true);
      } catch {
        setIsAudioServerOnline(true);
      }
    };
    checkAudioServer();
    const interval = setInterval(checkAudioServer, 1500);
    return () => clearInterval(interval);
  }, [syscall]);

  useEffect(() => {
    if (fileContent.startsWith("data:audio/") || filePath.toLowerCase().endsWith(".mp3") || filePath.toLowerCase().endsWith(".wav") || filePath.toLowerCase().endsWith(".ogg") || filePath.toLowerCase().endsWith(".aac") || filePath.toLowerCase().endsWith(".flac")) {
      if (fileContent.startsWith("data:audio/")) {
        const aud = new Audio(fileContent);
        aud.loop = true;
        aud.muted = isMuted;
        setAudioElement(aud);
      } else {
        setAudioElement(null);
      }
    } else {
      setAudioElement(null);
    }
  }, [fileContent, filePath]);

  useEffect(() => {
    if (!audioElement) return;
    if (isPlaying && isAudioServerOnline) {
      audioElement.play().catch(() => {});
    } else {
      audioElement.pause();
    }
  }, [isPlaying, audioElement, isAudioServerOnline]);

  useEffect(() => {
    if (!audioElement) return;
    audioElement.muted = isMuted;
  }, [isMuted, audioElement]);

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);

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
        setCurrentStep(0);
        syscall.syslog(`Music Player loaded VFS audio: ${path}`);
      }
    } catch (e: any) {
      setErrorMsg(`Failed to decode VFS format: ${e.message}`);
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
        .filter((item) => item.type === "FILE" && (item.name.toLowerCase().endsWith(".mp3") || item.name.toLowerCase().endsWith(".wav") || item.name.toLowerCase().endsWith(".ogg") || item.name.toLowerCase().endsWith(".flac") || item.name.toLowerCase().endsWith(".aac") || item.name.endsWith(".txt")))
        .map((item) => item.name);
      setFilesInDir(fileNames);
    } catch {
      // ignore
    }
  };

  // Web Audio synth triggers
  const initAudioContext = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    } catch {
      // ignore blockages
    }
  };

  // Play a single bitcrushed chiptune note on the synth
  const playSynthesizerNote = (frequency: number) => {
    if (!audioCtxRef.current || isMuted || !isAudioServerOnline) return;
    try {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Wow and flutter frequency skew simulation (tape warp)
      const warp = (Math.random() - 0.5) * tapeFlutter * 3.5;
      osc.frequency.setValueAtTime(frequency + warp, ctx.currentTime);

      // Lo-fi square wave synth
      osc.type = "square";

      // Apply harsh telephone low-pass based on simulated Sample Rate
      // lower sample rate = lower cut-off frequency
      filter.type = "lowpass";
      const cutoffFreq = sampleRateKhz * 800; // e.g. 1.0 Khz is 800hz cutoff (awful and muddy!)
      filter.frequency.setValueAtTime(cutoffFreq, ctx.currentTime);

      // Simple click envelope
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);

      // If crackle / static noise is active, overlay a static popcorn noise burst
      if (crackleNoise) {
        // Trigger a tiny click burst
        const noiseNodesCount = bitcrushMultiplier;
        for (let burst = 0; burst < noiseNodesCount; burst++) {
          const noiseOsc = ctx.createOscillator();
          const noiseGain = ctx.createGain();
          
          noiseOsc.type = "triangle";
          noiseOsc.frequency.setValueAtTime(4000 + Math.random() * 8000, ctx.currentTime);
          
          noiseGain.gain.setValueAtTime(0, ctx.currentTime);
          noiseGain.gain.linearRampToValueAtTime(0.007, ctx.currentTime + 0.005);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
          
          noiseOsc.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          
          noiseOsc.start();
          noiseOsc.stop(ctx.currentTime + 0.03);
        }
      }
    } catch {
      // ignore audio triggers blocks
    }
  };

  // Play loop sequencer
  useEffect(() => {
    if (isPlaying) {
      const stepInterval = 180; // duration between chiptune notes
      const tick = () => {
        if (!audioElement) {
          // Determine frequency to play
          // If file content is custom mock, read it, otherwise fallback to standard melody
          let noteFreq = 440;
          if (filePath.endsWith(".mp3")) {
            // Play loop sequence
            noteFreq = melodyChiptune[currentStep % melodyChiptune.length];
          } else {
            // Extract a procedural note from file character bytes!
            const byteStr = fileContent || "default audio extraction stream lines";
            const char = byteStr.charCodeAt(currentStep % byteStr.length) || 64;
            noteFreq = 160 + (char * 4) % 900;
          }

          playSynthesizerNote(noteFreq);
        }

        setCurrentStep((prev) => (prev + 1) % 64);
        synthTimerRef.current = window.setTimeout(tick, stepInterval);
      };

      synthTimerRef.current = window.setTimeout(tick, stepInterval);
    } else {
      if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
    }

    return () => {
      if (synthTimerRef.current) clearTimeout(synthTimerRef.current);
    };
  }, [isPlaying, currentStep, sampleRateKhz, bitcrushMultiplier, tapeFlutter, crackleNoise, audioElement]);

  // Visual Equalizer block jumping
  useEffect(() => {
    if (isPlaying) {
      const tickVisuals = () => {
        const randomBars = Array.from({ length: 8 }, () => {
          const baseHeight = Math.floor(Math.random() * 7) + 1;
          return baseHeight;
        });
        setEqBars(randomBars);
        visualsTimerRef.current = window.setTimeout(tickVisuals, 110);
      };
      visualsTimerRef.current = window.setTimeout(tickVisuals, 110);
    } else {
      if (visualsTimerRef.current) clearTimeout(visualsTimerRef.current);
      setEqBars([0, 0, 0, 0, 0, 0, 0, 0]);
    }
    return () => {
      if (visualsTimerRef.current) clearTimeout(visualsTimerRef.current);
    };
  }, [isPlaying]);

  const handlePlayToggle = () => {
    initAudioContext();
    setIsPlaying(true);
    syscall.syslog(`Music audio stream started.`);
  };

  const handlePauseToggle = () => {
    setIsPlaying(false);
    syscall.syslog(`Music audio stream paused.`);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    syscall.syslog(`Music audio stream stopped.`);
  };

  // Clean audio on component release
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex-1 bg-[#d4d0c8] text-black flex flex-col min-h-0 select-none font-sans">
      {/* File utility options */}
      <div className="bg-[#ede9e2] border-b border-t border-t-white border-b-gray-400 p-2 flex items-center justify-between gap-1 text-xs">
        <button
          onClick={() => {
            scanVfsDirectory();
            setShowFileOpen(!showFileOpen);
          }}
          className="px-3 py-1 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-t-[#808080] active:border-l-[#808080] flex items-center space-x-1 cursor-pointer font-bold"
        >
          <FolderOpen className="w-3.5 h-3.5 text-yellow-600" />
          <span>Mount VFS Audio File</span>
        </button>

        <div className="font-mono text-[9px] text-gray-500 uppercase flex items-center space-x-1">
          <span>Decoder: 8BIT_SYNTH_EXTRACTOR</span>
        </div>
      </div>

      {/* Main player layout */}
      <div className="flex-1 flex min-h-0 relative">
        {/* VFS file selection dropdown */}
        {showFileOpen && (
          <div className="absolute top-0 left-0 right-0 max-h-52 bg-[#e4e0d8] border-b-2 border-r-2 border-l-2 border-[#808080] p-3 z-30 shadow-2xl flex flex-col min-h-0">
            <span className="font-bold text-slate-800 border-b border-gray-400 pb-1 flex items-center uppercase text-[10px] mb-2">
              📂 Audio File Extractor ({scanDir})
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
                  <span>🎵</span>
                  <span>{name}</span>
                </button>
              ))}
              {filesInDir.length === 0 && (
                <p className="text-gray-400 italic text-center p-3 text-[11px]">
                  No chiptunes/compatible VFS files on Desktop.
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

        {/* Vintage Cassette deck drawing box */}
        <div className="flex-1 flex flex-col justify-between p-3 m-1 border-2 border-t-gray-500 border-l-gray-500 border-r-white border-b-white bg-neutral-900 overflow-hidden relative">
          
          {!isAudioServerOnline && (
            <div className="absolute inset-0 bg-red-950/95 text-red-500 font-mono text-center flex flex-col justify-center items-center p-4 z-20">
              <span className="text-lg font-black animate-pulse">ALSA AUDIO SYSTEM OFFLINE</span>
              <p className="text-[10px] text-gray-300 mt-2 max-w-[260px] leading-4.5 font-mono">
                The sound backend server daemon <code className="text-red-400 font-bold">audio-server.service</code> was halted. Start the process via Rules panel of systemctl to restore audio pipelines.
              </p>
            </div>
          )}

          {/* Diagnostic messages for VFS */}
          {errorMsg ? (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-400 rounded font-mono text-center text-xs leading-5">
              🛑 DAC CODEC HARDWARE ERROR:
              <p className="text-[10px] text-red-300 mt-1">{errorMsg}</p>
            </div>
          ) : !filePath ? (
            <div className="text-center font-mono text-gray-500 space-y-2 my-auto">
              <Music className="w-12 h-12 text-gray-700 mx-auto animate-pulse" />
              <p className="text-xs">Mount audio tracks to run the tape loops.</p>
              <button
                onClick={() => {
                  scanVfsDirectory();
                  setShowFileOpen(true);
                }}
                className="px-2.5 py-1 bg-[#ede9e2] text-black font-bold border border-t-white border-l-white border-r-[#808080] border-b-[#808080] mt-2 text-[10px]"
              >
                Scan default directories
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-around py-2">
              {/* Spinning tape cassette illustration */}
              <div className="w-52 h-32 bg-[#2d3235] border-2 border-[#808080] mx-auto rounded-md p-2 flex flex-col justify-between relative shadow-2xl shrink-0">
                <div className="bg-[#edd400] text-black font-mono text-[8.5px] font-extrabold text-center py-1 uppercase rounded tracking-wider shadow">
                  ★ BASF RETRO CHIPTUNE 60 ★
                </div>

                {/* Tape reels */}
                <div className="flex justify-around items-center my-1.5 px-4">
                  {/* Left reel */}
                  <div className="w-10 h-10 rounded-full bg-black border-4 border-gray-400 flex items-center justify-center relative">
                    <div 
                      className="w-1.5 h-6 bg-gray-300 absolute" 
                      style={{ transform: `rotate(${isPlaying ? currentStep * 15 : 0}deg)` }}
                    />
                    <div 
                      className="w-6 h-1.5 bg-gray-300 absolute" 
                      style={{ transform: `rotate(${isPlaying ? currentStep * 15 : 0}deg)` }}
                    />
                    <div className="w-4 h-4 rounded-full bg-black border border-gray-500 z-10" />
                  </div>

                  {/* Tape plastic viewer */}
                  <div className="w-14 h-5 bg-[#1e2528] border border-gray-600 rounded flex items-center justify-center p-0.5 text-orange-500 font-sans text-[7px]" />

                  {/* Right reel */}
                  <div className="w-10 h-10 rounded-full bg-black border-4 border-gray-400 flex items-center justify-center relative">
                    <div 
                      className="w-1.5 h-6 bg-gray-300 absolute" 
                      style={{ transform: `rotate(${isPlaying ? currentStep * 15 : 0}deg)` }}
                    />
                    <div 
                      className="w-6 h-1.5 bg-gray-300 absolute" 
                      style={{ transform: `rotate(${isPlaying ? currentStep * 15 : 0}deg)` }}
                    />
                    <div className="w-4 h-4 rounded-full bg-black border border-gray-500 z-10" />
                  </div>
                </div>

                <div className="text-[7.5px] font-mono text-gray-400 flex justify-between px-1">
                  <span>DOLBY SYSTEM NR</span>
                  <span>A-SIDE BIAS: HIGH</span>
                </div>
              </div>

              {/* Dynamic Winamp-style Equalizer */}
              <div className="h-16 w-52 bg-black border border-gray-700 mx-auto rounded p-1.5 flex flex-col justify-between relative shadow">
                {/* Visualizer output */}
                <div className="flex-1 flex items-end justify-between gap-[2px] pt-1">
                  {eqBars.map((blocks, bIdx) => (
                    <div key={bIdx} className="flex-1 flex flex-col justify-end space-y-[1.5px] h-full">
                      {Array.from({ length: 6 }).map((_, blockIdx) => {
                        const cellVal = 6 - blockIdx;
                        let cellBg = "bg-green-700";
                        if (cellVal > 4) cellBg = "bg-red-700";
                        else if (cellVal > 2) cellBg = "bg-yellow-600";

                        const isActive = blocks >= cellVal;
                        return (
                          <div
                            key={blockIdx}
                            className={`h-[1.5px] w-full transition-opacity duration-100 ${
                              isActive ? `${cellBg} opacity-100` : "bg-neutral-800 opacity-20"
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-[7.5px] text-green-500 font-mono mt-1.5 px-0.5 tracking-wider font-extrabold uppercase select-none">
                  <span>EQ: {isMuted ? "MUTED" : isPlaying ? "PLAYING" : "STOP"}</span>
                  <span>STEP: {currentStep.toString().padStart(2, "0")} / 64</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chiptune distortion parameters */}
        <div className="w-48 bg-[#ede9e2] border-l border-[#808080] p-3 flex flex-col justify-between shrink-0 m-1">
          <div className="space-y-3.5">
            <span className="font-bold text-[#002080] border-b border-gray-400 pb-1.5 flex items-center space-x-1.5 uppercase text-[9.5px]">
              <Sliders className="w-3.5 h-3.5" />
              <span>BIT-CRUSH KNOBS</span>
            </span>

            {/* sample rate slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">SAMPLE RATE:</span>
                <span className="font-mono text-[#730500] font-black">{sampleRateKhz.toFixed(1)} kHz</span>
              </div>
              <input
                type="range"
                min="1.1"
                max="11.0"
                step="1.1"
                value={sampleRateKhz}
                onChange={(e) => setSampleRateKhz(parseFloat(e.target.value))}
                className="w-full accent-[#730500] h-1 bg-gray-300 rounded cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Triggers a mud low-pass cutoff to decimate high synthesis tones.</p>
            </div>

            {/* Bitness bitcrush gain static overlays */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">CRUSH POWER:</span>
                <span className="font-mono text-[#002080] font-black">{bitcrushMultiplier} BITS</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={bitcrushMultiplier}
                onChange={(e) => setBitcrushMultiplier(parseInt(e.target.value, 10))}
                className="w-full accent-[#002080] h-1 bg-gray-300 rounded cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Adds digital noise bursts mimicking a crippled 8-bit DAC chip.</p>
            </div>

            {/* wow and flutter tape flutter drags */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-gray-600">TAPE WARP:</span>
                <span className="font-mono text-gray-800 font-black">{tapeFlutter * 10}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="2"
                value={tapeFlutter}
                onChange={(e) => setTapeFlutter(parseInt(e.target.value, 10))}
                className="w-full accent-neutral-800 h-1 bg-gray-300 rounded cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 font-mono leading-3">Skews frequency pitch dynamically to replicate melting vinyl.</p>
            </div>

            <hr className="border-[#beb8ad]" />

            {/* Fuzz click checkbox filters */}
            <div>
              <label className="flex items-center space-x-2 text-[10.5px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={crackleNoise}
                  onChange={(e) => setCrackleNoise(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#002080]"
                />
                <span className="font-bold text-gray-700">Vinyl Pops & Static</span>
              </label>
              <p className="text-[8.5px] text-gray-400 font-mono leading-2.5 mt-0.5 ml-5">Overlay randomized high-frequency snap transients.</p>
            </div>
          </div>

          <div className="bg-white p-1.5 border leading-4 text-gray-500 select-text">
            <span className="block text-[8.5px] font-black text-blue-800 font-mono">TRACK TITLE:</span>
            <p className="font-mono text-[9.5px]" title={filePath}>
              {filePath ? filePath.substring(filePath.lastIndexOf("/") + 1) : "[DAC IDLE]"}
            </p>
          </div>
        </div>
      </div>

      {/* Cassette deck transport keys bottom bevel */}
      <div className="bg-[#ede9e2] border-t-2 border-white p-2 flex items-center justify-between gap-3">
        {/* Playback action keys */}
        <div className="flex items-center space-x-1">
          {isPlaying ? (
            <button
              onClick={handlePauseToggle}
              disabled={!filePath}
              className="px-3.5 py-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px hover:shadow-inner cursor-pointer disabled:opacity-40"
              title="Pause synthesizer"
            >
              <Pause className="w-3.5 h-3.5 text-black animate-pulse" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handlePlayToggle}
              disabled={!filePath}
              className="px-3.5 py-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px hover:shadow-inner cursor-pointer disabled:opacity-40"
              title="Play synthesizer"
            >
              <Play className="w-3.5 h-3.5 text-green-700" fill="currentColor" />
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={!filePath}
            className="p-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:translate-y-px hover:shadow-inner cursor-pointer disabled:opacity-40"
            title="Stop playback"
          >
            <Square className="w-3.5 h-3.5 text-red-700" fill="currentColor" />
          </button>
        </div>

        {/* Audio scrub tape timeline bar */}
        <div className="flex-1 flex items-center bg-white border border-t-[#808080] border-l-[#808080] border-r-white border-b-white mx-1.5 py-2.5 px-2.5 relative h-4 overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[#002080]/20 transition-all duration-200" 
            style={{ width: `${(currentStep / 64) * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between text-[9px] font-mono px-2.5 text-black font-extrabold z-10 pointer-events-none">
            <span>BIT: {currentStep.toString().padStart(2, "0")} / 64</span>
            <span>CHIP_RATE: {(sampleRateKhz * 1000).toFixed(0)} hz</span>
          </div>
        </div>

        {/* Muted toggle trigger */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          disabled={!filePath}
          className="p-1.5 bg-[#d4d0c8] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-neutral-200 cursor-pointer disabled:opacity-40"
          title="Turn off voice synth coils"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-700" />
          ) : (
            <Volume2 className="w-4 h-4 text-blue-800" />
          )}
        </button>
      </div>
    </div>
  );
}
