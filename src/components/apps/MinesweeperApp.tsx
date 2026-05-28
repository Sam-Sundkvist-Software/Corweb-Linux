import React, { useState, useEffect } from "react";
import { Smile, Frown, Award, Skull } from "lucide-react";

interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMinesCount: number;
}

export default function MinesweeperApp() {
  const [gridSize, setGridSize] = useState<number>(9);
  const [mineCount, setMineCount] = useState<number>(10);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<"ready" | "playing" | "won" | "lost">("ready");
  const [timer, setTimer] = useState<number>(0);
  const [flagsRemaining, setFlagsRemaining] = useState<number>(mineCount);

  // Restart grid helper
  const initializeGrid = (size: number, mines: number) => {
    // Generate blank grid
    let newGrid: Cell[][] = [];
    for (let y = 0; y < size; y++) {
      let row: Cell[] = [];
      for (let x = 0; x < size; x++) {
        row.push({
          x,
          y,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMinesCount: 0,
        });
      }
      newGrid.push(row);
    }

    // Place mines randomly
    let placedMines = 0;
    while (placedMines < mines) {
      const rx = Math.floor(Math.random() * size);
      const ry = Math.floor(Math.random() * size);
      if (!newGrid[ry][rx].isMine) {
        newGrid[ry][rx].isMine = true;
        placedMines++;
      }
    }

    // Compute neighbor counts
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (newGrid[y][x].isMine) continue;

        let neighbors = 0;
        // Search neighboring cells
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < size && nx >= 0 && nx < size) {
              if (newGrid[ny][nx].isMine) neighbors++;
            }
          }
        }
        newGrid[y][x].neighborMinesCount = neighbors;
      }
    }

    setGrid(newGrid);
    setGameState("ready");
    setTimer(0);
    setFlagsRemaining(mines);
  };

  useEffect(() => {
    initializeGrid(gridSize, mineCount);
  }, [gridSize, mineCount]);

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (gameState === "playing") {
      interval = setInterval(() => {
        setTimer((v) => Math.min(999, v + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const handleCellClick = (x: number, y: number) => {
    if (gameState === "lost" || gameState === "won") return;
    let currentGameState = gameState;
    if (gameState === "ready") {
      currentGameState = "playing";
      setGameState("playing");
    }

    const clickedCell = grid[y][x];
    if (clickedCell.isRevealed || clickedCell.isFlagged) return;

    const updatedGrid = [...grid.map((r) => [...r])];

    if (clickedCell.isMine) {
      // Exploded! Reveal all mines and set lost
      updatedGrid.forEach((row) => {
        row.forEach((cell) => {
          if (cell.isMine) cell.isRevealed = true;
        });
      });
      setGrid(updatedGrid);
      setGameState("lost");
      return;
    }

    // Reveal cell recursively if 0 neighbors
    const revealCell = (cx: number, cy: number, gridData: Cell[][]) => {
      const cell = gridData[cy][cx];
      if (cell.isRevealed || cell.isFlagged) return;

      cell.isRevealed = true;

      if (cell.neighborMinesCount === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = cy + dy;
            const nx = cx + dx;
            if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize) {
              revealCell(nx, ny, gridData);
            }
          }
        }
      }
    };

    revealCell(x, y, updatedGrid);

    // Check Victory
    let winner = true;
    updatedGrid.forEach((row) => {
      row.forEach((cell) => {
        if (!cell.isMine && !cell.isRevealed) winner = false;
      });
    });

    setGrid(updatedGrid);
    if (winner) {
      setGameState("won");
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (gameState === "lost" || gameState === "won") return;

    const cell = grid[y][x];
    if (cell.isRevealed) return;

    const updatedGrid = [...grid.map((r) => [...r])];
    const isNowFlagged = !cell.isFlagged;
    updatedGrid[y][x].isFlagged = isNowFlagged;

    setGrid(updatedGrid);
    setFlagsRemaining((v) => v + (isNowFlagged ? -1 : 1));

    if (gameState === "ready") {
      setGameState("playing");
    }
  };

  const getSmileIcon = () => {
    if (gameState === "won") return <Award className="w-5 h-5 text-yellow-600" />;
    if (gameState === "lost") return <Frown className="w-5 h-5 text-red-600" />;
    return <Smile className="w-5 h-5 text-orange-600" />;
  };

  const getCellColor = (count: number) => {
    switch (count) {
      case 1:
        return "text-blue-600";
      case 2:
        return "text-green-600";
      case 3:
        return "text-red-600";
      case 4:
        return "text-purple-800";
      case 5:
        return "text-red-900";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex-1 bg-[#eeeeec] flex flex-col items-center justify-center p-4 select-none">
      {/* Settings Selector */}
      <div className="mb-3 flex space-x-2 text-[10px] text-gray-700 font-bold select-none leading-5">
        <button
          onClick={() => {
            setGridSize(9);
            setMineCount(10);
          }}
          className={`px-2.5 py-1 rounded border transition-colors ${
            gridSize === 9
              ? "bg-[#729fcf]/30 border-[#729fcf] text-[#204a87]"
              : "bg-white hover:bg-gray-100 border-[#babdb6]"
          }`}
        >
          Beginner (9x9)
        </button>
        <button
          onClick={() => {
            setGridSize(12);
            setMineCount(18);
          }}
          className={`px-2.5 py-1 rounded border transition-colors ${
            gridSize === 12
              ? "bg-[#729fcf]/30 border-[#729fcf] text-[#204a87]"
              : "bg-white hover:bg-gray-100 border-[#babdb6]"
          }`}
        >
          Intermediate (12x12)
        </button>
      </div>

      {/* Main retro window frame shadow inside our metacavity */}
      <div className="bg-[#eeeeec] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#888a85] p-2 rounded shadow-md select-none max-w-full overflow-hidden">
        {/* Header Board display */}
        <div className="bg-[#d3d7cf] border-2 border-[#888a85] px-3.5 py-1.5 flex justify-between items-center rounded mb-3">
          {/* Bomb indicator code */}
          <div className="bg-black text-[15px] font-mono text-red-500 font-extrabold px-2 py-0.5 rounded border border-[#888a85] tracking-wider">
            {flagsRemaining.toString().padStart(3, "0")}
          </div>

          {/* Smiley Restart button */}
          <button
            onClick={() => initializeGrid(gridSize, mineCount)}
            className="w-8 h-8 rounded border-b-2 border-r-2 border-[#888a85] bg-[#eeeeec] flex items-center justify-center hover:bg-white active:border-t-2 active:border-l-2 active:border-b-0 active:border-r-0 transition-all shadow-inner"
            title="Restart board"
          >
            {getSmileIcon()}
          </button>

          {/* Timer display */}
          <div className="bg-black text-[15px] font-mono text-red-500 font-extrabold px-2 py-0.5 rounded border border-[#888a85] tracking-wider">
            {timer.toString().padStart(3, "0")}
          </div>
        </div>

        {/* The Grid */}
        <div
          className="grid gap-[1px] bg-[#888a85] border-2 border-b-white border-r-white border-t-[#555753] border-l-[#555753]"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            width: `${gridSize * 26}px`,
            maxWidth: "100%",
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => {
              const baseCellClass =
                "w-6.5 h-6.5 text-[12px] font-bold flex items-center justify-center transition-all focus:outline-none";

              let displayContent = "";
              let cStyleClass = "";

              if (cell.isRevealed) {
                if (cell.isMine) {
                  displayContent = "💣";
                  cStyleClass = "bg-[#bf320c] text-white";
                } else {
                  displayContent =
                    cell.neighborMinesCount > 0
                      ? cell.neighborMinesCount.toString()
                      : "";
                  cStyleClass = `bg-[#efefe9] shadow-inner ${getCellColor(
                    cell.neighborMinesCount
                  )}`;
                }
              } else {
                displayContent = cell.isFlagged ? "🚩" : "";
                cStyleClass =
                  "bg-[#eeeeec] border-2 border-t-white border-l-white border-b-[#888a85] border-r-[#888a85] hover:bg-[#d3d7cf]/50 active:border-1 active:bg-[#babdb6]";
              }

              return (
                <button
                  key={`${x}_${y}`}
                  onClick={() => handleCellClick(x, y)}
                  onContextMenu={(e) => handleCellRightClick(e, x, y)}
                  className={`${baseCellClass} ${cStyleClass}`}
                >
                  {displayContent}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-3.5 text-[9px] text-[#555753] text-center max-w-xs font-semibold leading-4">
        🚩 Right-click on cells to toggle flag markers. Left-click cell grid spaces to clear safe trails.
      </div>
    </div>
  );
}
