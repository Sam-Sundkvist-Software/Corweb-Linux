import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Globe, ArrowRightCircle, ThumbsUp } from "lucide-react";
import { SystemCallInterface } from "../../types/os";

interface SubPage {
  title: string;
  url: string;
  render: () => React.JSX.Element;
}

interface SurferAppProps {
  syscall: SystemCallInterface;
}

export default function SurferApp({ syscall }: SurferAppProps) {
  const [currentUrl, setCurrentUrl] = useState("http://google.com");
  const [history, setHistory] = useState<string[]>(["http://google.com"]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<number | null>(null);

  // Check networking status on mount and when URL shifts, requiring web-dns.service to be active
  useEffect(() => {
    const checkState = () => {
      try {
        const cfg = syscall.getSettings();
        const svcs = syscall.getServices();
        const dnsSvc = svcs.find((s) => s.name === "web-dns.service");
        const dnsActive = dnsSvc ? dnsSvc.status === "active" : true;
        setIsOnline(cfg.networking_enabled !== false && dnsActive);
      } catch {
        setIsOnline(true);
      }
    };
    checkState();
    const interval = setInterval(checkState, 1500);
    return () => clearInterval(interval);
  }, [currentUrl, syscall]);

  const visitUrl = (url: string) => {
    const formatted = url.startsWith("http") ? url : `http://${url}`;
    
    // Simulate web transmission progress delay
    setLoadingProgress(0);
    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal += 20;
      if (progressVal >= 100) {
        clearInterval(interval);
        setLoadingProgress(null);
      } else {
        setLoadingProgress(progressVal);
      }
    }, 60);

    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(formatted);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
    setCurrentUrl(formatted);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setCurrentUrl(history[historyIdx - 1]);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setCurrentUrl(history[historyIdx + 1]);
    }
  };

  // Trigger search actions in Google 2006 Mockup
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Generate fun 2006 search results
    const q = searchQuery.toLowerCase();
    let r: any[] = [];

    if (q.includes("linux") || q.includes("ubuntu")) {
      r = [
        {
          title: "Ubuntu 6.06 LTS (Dapper Drake) Released!",
          url: "http://ubuntu.com/news/dapper",
          desc: "Canonical announces the first long term support version of Ubuntu. Includes Gnome 2.14, OpenOffice.org 2.0, and a faster graphical installation loop.",
        },
        {
          title: "Slashdot | Is Linux finally taking over the desktop?",
          url: "http://slashdot.org/article/desktop_war",
          desc: "User 'tux_master' writes: With the launch of dapper drake, hardware compatibility issues are shrinking. Is this finally the year of desktop Linux?",
        },
      ];
    } else if (q.includes("game") || q.includes("minesweeper") || q.includes("wii")) {
      r = [
        {
          title: "Nintendo Wii: Revolutionary motion controls revealed",
          url: "http://ign.com/wii_specials",
          desc: "IGN coverage on the upcoming codename 'Revolution' console. Play retro games and shake a dynamic controller!",
        },
        {
          title: "Minesweeper Gnomine records and cheat codes",
          url: "http://tuxwiki.org/minesweeper_secrets",
          desc: "Discover how to spot columns easily. Hint: The corner blocks define the safe zones.",
        },
      ];
    } else if (q.includes("space") || q.includes("stellar") || q.includes("universe") || q.includes("star")) {
      r = [
        {
          title: "Stellar Voyage Chronicles - Space Exploration Log",
          url: "http://stellar-voyage-chronicles.net",
          desc: "The vintage journal documenting celestial orbital telemetry, deep space spectrum maps, and outer universe rover tracking.",
        },
        {
          title: "Slashdot | NASA launches Kepler telescope preparation feeds",
          url: "http://slashdot.org/nasa-kepler-space",
          desc: "A review of orbital spectroscopy sensors being structured to locate earth-like planet candidates in distant constellations.",
        }
      ];
    } else if (q.includes("software") || q.includes("download") || q.includes("app") || q.includes("editor")) {
      r = [
        {
          title: "Retro Software Depot - Early Web VFS Utilities",
          url: "http://retro-software-depot.com",
          desc: "The central index for legacy operating system widgets, in-place compiler binaries, and custom text editor options.",
        },
        {
          title: "Tux Wiki - Development of Secure Sandboxing in JS",
          url: "http://tuxwiki.org/sandbox_specs",
          desc: "A wiki entry analyzing the construction of in-memory filesystems and isolated user execution structures using closures.",
        }
      ];
    } else {
      r = [
        {
          title: `Myspace profile layouts matching query: '${searchQuery}'`,
          url: "http://myspace.com/layouts-unlimited",
          desc: "Add flashing sparkles and custom retro background soundtracks using custom inline CSS stylesheets.",
        },
        {
          title: `Wikipedia - The Encyclopedia of ${searchQuery}`,
          url: "http://tuxwiki.org/search?q=" + encodeURIComponent(searchQuery),
          desc: "Read collaborative explanations of this query. Did you know Web 2.0 trends are growing rapidly?",
        },
        {
          title: `Slashdot | Discussions on '${searchQuery}'`,
          url: "http://slashdot.org/search?q=" + encodeURIComponent(searchQuery),
          desc: "Explore nerd comments and flame-threads covering DRM, browsers, and secure Linux sandboxing.",
        },
      ];
    }

    setSearchResults(r);
    setCurrentUrl("http://google.com/search?q=" + encodeURIComponent(searchQuery));
  };

  // Render Page Content Mock
  const renderBrowserBody = () => {
    if (!isOnline) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 font-sans select-none bg-slate-50">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-2xl font-bold mb-4 border border-red-200">
            ⚠
          </div>
          <h3 className="font-bold text-base text-[#2e3436] tracking-tight">DNS Lookup Failure / Disconnected</h3>
          <p className="text-xs text-gray-600 max-w-sm mt-1.5 leading-5">
            The ethernet adapter socket `eth0` reports networking has been disabled. To restore internet and browser capabilities, allow networking inside the <strong>Control Panel & Governance Settings</strong>.
          </p>
          <button
            onClick={() => {
              try {
                const cfg = syscall.getSettings();
                setIsOnline(cfg.networking_enabled !== false);
              } catch {
                setIsOnline(true);
              }
            }}
            className="mt-4 px-3.5 py-1.5 bg-gradient-to-b from-[#f3f3f1] to-[#edeceb] border border-[#babdb6] rounded shadow-sm text-xs text-gray-700 font-bold active:translate-y-px transition-all"
          >
            Retry DNS resolution
          </button>
        </div>
      );
    }

    // Check path URL routers
    if (currentUrl.startsWith("http://google.com/search")) {
      return (
        <div className="p-4 space-y-4 font-sans select-all">
          <div className="flex items-center space-x-4 border-b pb-3 mb-2">
            <span className="text-xl font-bold tracking-tight text-[#e17424] select-none">
              <span className="text-blue-600">G</span>
              <span className="text-red-600">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-600">g</span>
              <span className="text-green-600">l</span>
              <span className="text-red-600">e</span>
            </span>
            <form onSubmit={handleSearchSubmit} className="flex-1 flex max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-400 p-1 px-2.5 rounded-l text-xs outline-none focus:border-blue-500 bg-white"
              />
              <button className="bg-gradient-to-b from-gray-100 to-gray-200 border border-l-0 border-gray-400 px-3 rounded-r font-bold text-gray-700 hover:from-white">
                Go
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="text-[11px] text-gray-500 font-semibold leading-3">
              Search Results for: <span className="text-[#8e4a13] font-bold">"{searchQuery}"</span>
            </div>

            {searchResults.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => visitUrl(item.url)}
                  className="text-blue-800 hover:underline font-bold text-sm text-left leading-4"
                >
                  {item.title}
                </button>
                <div className="text-xs text-green-700 font-mono leading-3">{item.url}</div>
                <p className="text-xs text-gray-700 leading-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentUrl.includes("google.com")) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-10 font-sans">
          {/* Main Logo */}
          <div className="text-4xl font-extrabold pb-4 tracking-tighter select-none">
            <span className="text-blue-600">G</span>
            <span className="text-red-600">o</span>
            <span className="text-yellow-500">o</span>
            <span className="text-blue-600">g</span>
            <span className="text-green-600">l</span>
            <span className="text-red-600">e</span>
            <span className="text-xs font-mono text-gray-500 uppercase ml-1.5 px-1 py-0.5 rounded bg-gray-100 border">
              2006 Beta
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-md flex flex-col items-center space-y-3.5 px-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-gray-300 p-1.5 px-3 rounded shadow-inner outline-none focus:border-blue-500 text-sm bg-white text-gray-800"
              placeholder="Search early web nodes... Try: 'ubuntu', 'minesweeper'"
              autoFocus
            />

            <div className="flex space-x-2.5">
              <button
                type="submit"
                className="px-4 py-1.5 bg-gradient-to-b from-[#f3f3f1] to-[#edeceb] border border-[#babdb6] rounded text-xs hover:from-white text-gray-800 font-semibold shadow-sm"
              >
                Google Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("minesweeper");
                  // submit
                  setTimeout(() => {
                    visitUrl("http://tuxwiki.org/minesweeper_secrets");
                  }, 100);
                }}
                className="px-4 py-1.5 bg-gradient-to-b from-[#f3f3f1] to-[#edeceb] border border-[#babdb6] rounded text-xs hover:from-white text-gray-800 font-semibold shadow-sm"
              >
                I'm Feeling Lucky
              </button>
            </div>
          </form>

          {/* directory lists */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-[#204a87] font-bold max-w-md px-4">
            <button onClick={() => visitUrl("http://slashdot.org")} className="hover:underline">Slashdot</button>
            <span>•</span>
            <button onClick={() => visitUrl("http://tuxwiki.org")} className="hover:underline">Tux Wiki</button>
            <span>•</span>
            <button onClick={() => visitUrl("http://youtube.com")} className="hover:underline">YouTube Classic</button>
            <span>•</span>
            <button onClick={() => visitUrl("http://digg.com")} className="hover:underline">Digg Social</button>
            <span>•</span>
            <button onClick={() => visitUrl("http://stellar-voyage-chronicles.net")} className="hover:underline text-amber-750">Stellar Voyage</button>
            <span>•</span>
            <button onClick={() => visitUrl("http://retro-software-depot.com")} className="hover:underline text-blue-700">Software Depot</button>
          </div>
        </div>
      );
    }

    if (currentUrl.includes("slashdot.org")) {
      return (
        <div className="font-sans antialiased text-[#003333] bg-white flex flex-col min-h-full select-text">
          {/* Header */}
          <div className="bg-[#006666] text-white p-3 flex justify-between items-center select-none shadow">
            <div>
              <span className="text-2xl font-black italic tracking-wide">Slashdot</span>
              <p className="text-[10px] text-teal-100 font-mono tracking-wider">News for Nerds. Stuff that Matters.</p>
            </div>
            <span className="text-[11px] font-mono pr-2 text-teal-200">2006 Tech Syndicate</span>
          </div>

          <div className="p-4 space-y-5">
            {/* Story 1 */}
            <div className="border border-teal-300 rounded bg-[#f3fbfb] p-3.5 space-y-1">
              <span className="text-xs text-gray-500 uppercase font-mono tracking-tight font-bold">Web Development</span>
              <h2 className="text-base font-bold text-teal-900 font-serif leading-5">Are client-side SPA interfaces superior to static HTML CGI scripts?</h2>
              <div className="text-[10px] text-gray-600 font-semibold mb-2">
                Posted by <span className="text-[#a83315]">tux_fanatic</span> on Thursday May 28, @09:11AM
              </div>
              <p className="text-xs leading-5 text-gray-700">
                A new generation of web technologies is emerging. With developments in AJAX parsing and clients storing complex states, several teams are building full desktops in the browser frame. Skeptics claim this will exhaust standard hardware allocations (of 512MB RAM), but visual programmers are pushing constraints.
              </p>
            </div>

            {/* Story 2 */}
            <div className="border border-teal-300 rounded bg-[#f3fbfb] p-3.5 space-y-1">
              <span className="text-xs text-gray-500 uppercase font-mono tracking-tight font-bold">Hardware</span>
              <h2 className="text-base font-bold text-teal-900 font-serif leading-5">Nintendo Wii: Is motion control the future of gaming?</h2>
              <div className="text-[10px] text-gray-600 font-semibold mb-2">
                Posted by <span className="text-[#a83315]">nes_retro</span> on Wednesday May 27, @11:34PM
              </div>
              <p className="text-xs leading-5 text-gray-700">
                With the Sony PS3 and Xbox 360 pushing extreme poly graphics grids, Nintendo is taking a different gamble with the Wii. Focusing purely on physical swings and interactive spatial feedback over pixel count. Critics suggest it is a flash in the pan; retro fans claim it is the future.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentUrl.includes("tuxwiki.org")) {
      return (
        <div className="bg-white p-5 font-serif text-gray-800 flex-1 leading-6 select-text select-all">
          <div className="border-b-2 border-gray-300 pb-3 mb-4 select-none">
            <span className="text-2xl font-black tracking-tight text-[#8e4a13]">Tux Web Wiki</span>
            <p className="text-[10px] text-gray-500 font-mono">The open archive for early UNIX systems, GNOME layouts, and web development.</p>
          </div>

          <div className="space-y-4 text-xs font-sans text-gray-700">
            <h1 className="text-lg font-bold text-gray-900 font-serif border-b pb-1">Ubuntu 6.06 (Dapper Drake) Specifications</h1>
            <p className="leading-5">
              Released on June 1, 2006, Ubuntu 6.06 is Canonical's historic release to utilize the LTS (Long Term Support) program. It merges beautiful warm skeuomorphism with highly optimized boot times.
            </p>

            <h2 className="text-sm font-bold text-gray-900 font-serif pt-2 border-b pb-0.5">Minesweeper Gnomine Corner Strategy</h2>
            <p className="leading-5">
              Beating Gnomine under 30 seconds requires quick cell flagging instead of searching blindly.
              The cardinal rule is: Look for cell clusters forming symmetrical boundaries.
              If a number "1" cell has only one diagonal neighbor block, it MUST be a mine! Flag it immediately using a right-click.
            </p>

            <h2 className="text-sm font-bold text-gray-900 font-serif pt-2 border-b pb-0.5">WebOS Secure Kernel Design</h2>
            <p className="leading-5">
              Secure kernels in JavaScript operate through <strong>Functional Closure Encapsulation</strong>.
              By hiding the main database descriptors and array targets inside a private scoped factory execution block, child windows and processes cannot modify properties outside of their localized SysCall tokens. This minimizes registry crashes and secures persistent storage.
            </p>
          </div>
        </div>
      );
    }

    if (currentUrl.includes("youtube.com")) {
      return (
        <div className="bg-[#f3efea] p-4 flex-1 font-sans select-all">
          <div className="flex justify-between items-center border-b border-red-200 pb-3 mb-3 select-none">
            <span className="text-xl font-black text-red-600 tracking-tight flex items-center">
              YouTube<span className="text-xs font-mono text-gray-500 ml-1">2006-tube</span>
            </span>
            <span className="text-[10px] text-gray-400">Broadcast Yourself</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Video Card */}
            <div className="border border-gray-300 bg-white p-2 rounded hover:shadow-md cursor-pointer transition-shadow">
              <div className="bg-black/90 aspect-video rounded flex items-center justify-center text-red-500 font-mono text-xs select-none relative">
                <span>Evolution of Dance</span>
                <span className="absolute bottom-1 right-1.5 bg-black/75 px-1 py-0.5 text-[9px] text-white">06:12</span>
              </div>
              <h3 className="font-bold text-xs text-blue-800 hover:underline leading-4 mt-1.5">Evolution of Dance (Classic)</h3>
              <p className="text-[10px] text-gray-500">Views: 12,400,125</p>
            </div>

            {/* Video Card */}
            <div className="border border-gray-300 bg-white p-2 rounded hover:shadow-md cursor-pointer transition-shadow">
              <div className="bg-black/90 aspect-video rounded flex items-center justify-center text-red-500 font-mono text-xs select-none relative">
                <span>Charlie bit me!</span>
                <span className="absolute bottom-1 right-1.5 bg-black/75 px-1 py-0.5 text-[9px] text-white font-semibold">00:55</span>
              </div>
              <h3 className="font-bold text-xs text-blue-800 hover:underline leading-4 mt-1.5">Charlie bit my finger again!</h3>
              <p className="text-[10px] text-gray-500">Views: 8,410,211</p>
            </div>

            {/* Video Card */}
            <div className="border border-gray-300 bg-white p-2 rounded hover:shadow-md cursor-pointer transition-shadow">
              <div className="bg-black/90 aspect-video rounded flex items-center justify-center text-red-500 font-mono text-xs select-none relative">
                <span>Numa Numa</span>
                <span className="absolute bottom-1 right-1.5 bg-black/75 px-1 py-0.5 text-[9px] text-white font-semibold">02:30</span>
              </div>
              <h3 className="font-bold text-xs text-blue-800 hover:underline leading-4 mt-1.5">Original Numa Numa Singer</h3>
              <p className="text-[10px] text-gray-500">Views: 6,105,820</p>
            </div>
          </div>

          <div className="mt-6 border-t pt-3 p-3 bg-[#eeeeec] rounded text-center select-none">
            <p className="text-xs text-gray-600 font-semibold leading-5">Welcome to YouTube! Broadcast Yourself in 240p resolutions.</p>
          </div>
        </div>
      );
    }

    if (currentUrl.includes("digg.com")) {
      return (
        <div className="font-sans text-gray-800 bg-white flex-1 select-text">
          <div className="bg-[#1b3e1b] text-white p-4 flex justify-between items-center select-none shadow">
            <div>
              <span className="text-2xl font-black tracking-tighter">digg</span>
              <p className="text-[9px] text-emerald-200 uppercase font-mono tracking-widest font-bold">Community-driven news aggregator</p>
            </div>
            <span className="text-xs text-[#9dca9d]">Digg Count: 48,124</span>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-start space-x-3.5 border-b pb-3.5">
              <div className="bg-[#e4ece4] border border-[#a1bfa1] p-1.5 px-3 rounded text-center select-none">
                <span className="block font-black text-emerald-800 text-lg">748</span>
                <span className="text-[8px] text-gray-500 uppercase tracking-widest font-extrabold">diggs</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-blue-900 hover:underline leading-5 cursor-pointer">Web 2.0 and the expansion of CSS-based round corners</h2>
                <p className="text-xs text-gray-600 leading-4">
                  For years, webmasters used massive slicing programs inside Photoshop to load nested structural tables with transparent background GIFs just to display a round-border box. A new trend discusses dynamic JavaScript layout tricks.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 border-b pb-3.5">
              <div className="bg-[#e4ece4] border border-[#a1bfa1] p-1.5 px-3 rounded text-center select-none">
                <span className="block font-black text-emerald-800 text-lg">562</span>
                <span className="text-[8px] text-gray-500 uppercase tracking-widest font-extrabold">diggs</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-blue-900 hover:underline leading-5 cursor-pointer">Is Web kernel sandboxing genuinely safe?</h2>
                <p className="text-xs text-gray-600 leading-4">
                  Security auditors publish a paper discussing functional boundaries within modern web frameworks. Utilizing JavaScript scopes inside closures provides highly restricted sandbox execution tokens for virtual environments.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentUrl.includes("stellar-voyage-chronicles.net")) {
      return (
        <div className="font-mono text-xs bg-[#0b0c10] text-[#66fcf1] flex-1 flex flex-col p-4 select-text">
          <div className="border border-[#1f2833] p-3 mb-4 bg-[#1f2833]/15 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl animate-pulse">🛰️</span>
              <div>
                <h1 className="text-sm font-extrabold text-[#45f3ff] uppercase tracking-widest">STELLAR VOYAGE CHRONICLES</h1>
                <p className="text-[9px] text-[#c5c6c7] uppercase">Deep Space Spectroscopy Telemetry Interface</p>
              </div>
            </div>
            <div className="text-right text-[10px] text-[#45f3ff] font-bold">
              <span>ORBIT STATUS: ALIGNED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="border border-[#1f2833] bg-[#0b0c10] p-3 space-y-2.5">
              <div className="text-[10px] text-[#45f3ff] font-extrabold uppercase border-b border-[#1f2833] pb-1 flex items-center justify-between">
                <span>Constellation Spectrum Feeds</span>
                <span className="text-rose-500 font-bold">● LIVE DATA</span>
              </div>
              <p className="text-[11px] leading-5 text-[#c5c6c7]">
                Sensors detect orbital radiation anomalies in the Cygnus constellation cluster. Multi-band infrared imagery reveals a dense ionized hot pocket of carbon monoxide molecules rotating about target coordinates RA 20h 30m / Dec +40° 15'.
              </p>
              <div className="bg-[#1f2833]/10 p-2 border border-[#1f2833] space-y-1 text-[#45f3ff]/85 font-bold text-[9px] leading-4">
                <div>✓ ANOMALY FLUX RANGE: 340 THz - 410 THz [STABLE]</div>
                <div>✓ EXPECTED DECAY CONSTANT: ~11,200 SOLAR ORBITS</div>
              </div>
            </div>

            <div className="border border-[#1f2833] bg-[#0b0c10] p-3 space-y-2">
              <div className="text-[10px] text-[#45f3ff] font-extrabold uppercase border-b border-[#1f2833] pb-1">
                Active Space Mission Telemetry
              </div>
              <p className="text-[11px] leading-5 text-[#c5c6c7]">
                Autonomous landing craft "Vanguard-4" has initiated descent protocols towards Kepler-186f sector alpha. Ground crew signals register standard 140ms delay cycles.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-[#1f2833]/25 p-1.5 border border-[#1f2833] text-center text-[#66fcf1]">
                  <span className="block text-[8px] uppercase tracking-wide text-zinc-400">Descent Rate</span>
                  <span className="font-bold text-xs">142 m/s</span>
                </div>
                <div className="bg-[#1f2833]/25 p-1.5 border border-[#1f2833] text-center text-[#66fcf1]">
                  <span className="block text-[8px] uppercase tracking-wide text-zinc-400">Fuel Reserves</span>
                  <span className="font-bold text-xs">88.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (currentUrl.includes("retro-software-depot.com")) {
      return (
        <div className="font-sans text-xs bg-[#eeeeec] text-[#2c2c2c] flex-1 flex flex-col p-4 select-text">
          <div className="bg-gradient-to-r from-[#204a87] to-[#3465a4] text-white p-4 rounded-sm flex items-center justify-between mb-4 shadow">
            <div>
              <span className="text-xl font-black italic tracking-tight">Retro Software Depot</span>
              <p className="text-[9px] tracking-wide uppercase font-semibold text-sky-100">Free open-source software catalog for Virtual-VFS environments</p>
            </div>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 font-bold uppercase rounded pr-2 text-sky-200">2006 Forge Host</span>
          </div>

          <div className="space-y-3.5 flex-1">
            <h2 className="text-sm font-bold text-[#204a87] border-b border-[#babdb6] pb-1 uppercase tracking-wide">Available Packages</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Package 1 */}
              <div className="border border-[#babdb6] bg-white p-3 space-y-1 shadow-sm flex flex-col rounded-sm">
                <span className="font-bold text-sm text-blue-900 leading-tight">Leafpad Word-Typewriter Mod v2.1</span>
                <span className="text-[9.5px] text-emerald-800 font-mono">Size: 90 KB | License: GPL v2</span>
                <p className="text-xs text-gray-600 leading-normal flex-1">
                  Enforces strict typewriter mode with Courier New configurations, dynamic save-with-progress dialog updates, and directory validation checks.
                </p>
                <div className="pt-2 text-right">
                  <button
                    onClick={() => {
                      if (syscall.openDialog) {
                        let pct = 0;
                        const diagId = syscall.openDialog(
                          "Downloading Leafpad",
                          "Downloading word_typewriter.bin archive bytes from main forge host...",
                          "info",
                          ["Cancel"]
                        );
                        // Start simulation
                        const timer = setInterval(() => {
                          pct += 25;
                          if (pct >= 100) {
                            clearInterval(timer);
                            if (syscall.closeDialog) syscall.closeDialog(diagId, null);
                            syscall.openDialog("Download Success", "Package 'word_typewriter.bin' has been acquired successfully and integrated into virtual cache.", "info");
                          }
                        }, 200);
                      }
                    }}
                    className="px-2.5 py-1 bg-[#d3d7cf] hover:bg-[#babdb6] border border-[#a8a8a8] rounded text-[10.5px] text-gray-800 font-bold cursor-pointer transition-colors"
                  >
                    Download Binaries
                  </button>
                </div>
              </div>

              {/* Package 2 */}
              <div className="border border-[#babdb6] bg-white p-3 space-y-1 shadow-sm flex flex-col rounded-sm">
                <span className="font-bold text-sm text-blue-900 leading-tight">Minesweeper Retro Gnomine Solvers Suite v1.0</span>
                <span className="text-[9.5px] text-[#8e4a13] font-mono">Size: 52 KB | License: Free BSD</span>
                <p className="text-xs text-gray-600 leading-normal flex-1">
                  Includes advanced algorithms to flag symmetrical cell groups and locate safe blocks with zero guesses. Shows live progress dialog overlays.
                </p>
                <div className="pt-2 text-right">
                  <button
                    onClick={() => {
                      if (syscall.openDialog) {
                        let pct = 0;
                        const diagId = syscall.openDialog(
                          "Downloading Solvers",
                          "Downloading gnomine_solvers.sh package payload from main forge host...",
                          "info",
                          ["Cancel"]
                        );
                        const timer = setInterval(() => {
                          pct += 25;
                          if (pct >= 100) {
                            clearInterval(timer);
                            if (syscall.closeDialog) syscall.closeDialog(diagId, null);
                            syscall.openDialog("Download Success", "Package 'gnomine_solvers.sh' successfully downloaded to /home/tux/Documents/Download/ and verified.", "info");
                          }
                        }, 200);
                      }
                    }}
                    className="px-2.5 py-1 bg-[#d3d7cf] hover:bg-[#babdb6] border border-[#a8a8a8] rounded text-[10.5px] text-gray-800 font-bold cursor-pointer transition-colors"
                  >
                    Download Shell Script
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 italic font-sans select-none">
        <Globe className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-sm">Unable to resolve domain lookup: {currentUrl}</p>
        <button
          onClick={() => visitUrl("http://google.com")}
          className="mt-3 px-3 py-1.5 bg-[#eeeeec] text-[#204a87] font-bold border border-[#babdb6] rounded text-[10px]"
        >
          Return to Google 2006
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 select-text font-sans">
      {/* Search Header visual Epiphany panel */}
      <div className="bg-[#eeeeec] border-b border-[#babdb6] p-1.5 flex flex-wrap items-center space-x-1.5 select-none text-[#2e3436]">
        {/* Navigation actions */}
        <div className="flex space-x-1">
          <button
            onClick={handleBack}
            disabled={historyIdx <= 0}
            className="p-1 px-1.5 bg-gradient-to-b from-[#f3f3f1] to-[#edeceb] border border-[#babdb6] rounded hover:bg-[#d3d7cf] disabled:opacity-40 select-none"
            title="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIdx >= history.length - 1}
            className="p-1 px-1.5 bg-gradient-to-b from-[#f3f3f1] to-[#edeceb] border border-[#babdb6] rounded hover:bg-[#d3d7cf] disabled:opacity-40 select-none"
            title="Go forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentUrl(currentUrl)}
            className="p-1 px-1.5 bg-gradient-to-b from-[#f3f3f1] to-[#edeceb] border border-[#babdb6] rounded hover:bg-[#d3d7cf]"
            title="Reload page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Link Box */}
        <div className="flex-1 flex items-center space-x-1 border border-[#babdb6] rounded bg-white px-2 py-0.5 text-xs text-gray-700">
          <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") visitUrl(currentUrl);
            }}
            className="flex-1 bg-transparent border-none outline-none text-xs focus:ring-0 text-gray-800 font-mono"
          />
          <button onClick={() => visitUrl(currentUrl)} title="Navigate to address">
            <ArrowRightCircle className="w-3.5 h-3.5 text-[#3465a4]" />
          </button>
        </div>
      </div>

      {/* Dynamic Vintage Progress bar for loading simulated web pages */}
      {loadingProgress !== null && (
        <div className="h-1 bg-[#edeceb] w-full relative shrink-0 overflow-hidden select-none border-b border-[#babdb6]">
          <div 
            className="h-full bg-[#3465a4] transition-all duration-75" 
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      )}

      {/* Main viewport canvas */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col min-h-0">
        {renderBrowserBody()}
      </div>
    </div>
  );
}
