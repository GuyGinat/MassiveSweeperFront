import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChunkedGridStore, Cell, Chunk } from "../hooks/useChunkedGridStore";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { userTokenInfo } from "../network/socket";

export function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedChunks = useChunkedGridStore((state) => state.loadedChunks);
  const requestChunk = useChunkedGridStore((state) => state.requestChunk);
  const revealCell = useChunkedGridStore((state) => state.revealCell);
  const flagCell = useChunkedGridStore((state) => state.flagCell);
  const fetchGridSize = useChunkedGridStore((state) => state.fetchGridSize);
  const gridSize = useChunkedGridStore((state) => state.gridSize);
  
  // Player stats
  const { incrementCellsCleared, incrementFlagsPlaced, incrementBombsExploded, startSession, endSession } = usePlayerStats();

  // Viewport state
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Start at top-left
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1); // Start at normal zoom
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Backend stats state
  const [backendStats, setBackendStats] = useState({
    chunkCount: 0,
    revealed: 0,
    revealedPercent: 0,
    flagged: 0,
    correctFlags: 0,
    totalMines: 0,
    activeUsers: 0,
    uniqueUsersEver: 0, // Added for new rule
    bombsExploded: 0, // Added for new rule
  });

  // Hovered cell state
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  // Rules panel state
  const [showRules, setShowRules] = useState(false);
  // Completion screen state
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionMinimized, setCompletionMinimized] = useState(false);

  // Fetch grid size on mount
  useEffect(() => {
    fetchGridSize();
  }, [fetchGridSize]);

  // Check for completion on mount (in case joining after completion)
  useEffect(() => {
    if (gridSize && backendStats.revealed > 0 && !completionMinimized) {
      const totalCells = gridSize.width * gridSize.height;
      const safeCells = totalCells - backendStats.totalMines;
      if (backendStats.revealed >= safeCells) {
        setShowCompletion(true);
      }
    }
  }, [gridSize, backendStats.revealed, backendStats.totalMines, completionMinimized]);

  // Reset minimized state when game resets (revealed count drops significantly)
  useEffect(() => {
    if (backendStats.revealed < 1000 && completionMinimized) {
      setCompletionMinimized(false);
    }
  }, [backendStats.revealed, completionMinimized]);

  // Check if game is complete (all safe cells revealed)
  const checkCompletion = useCallback(() => {
    if (!gridSize) return false;
    const totalCells = gridSize.width * gridSize.height;
    const safeCells = totalCells - backendStats.totalMines;
    return backendStats.revealed >= safeCells;
  }, [gridSize, backendStats.revealed, backendStats.totalMines]);

  // Debug function to reveal all cells (dev mode only)
  const revealAllCells = useCallback(async () => {
    if (!import.meta.env.DEV) return;
    
    try {
      const baseUrl = "http://localhost:3001";
      const response = await fetch(`${baseUrl}/reveal-all`)
      
      if (response.ok) {
        console.log("All cells revealed for debugging");
      } else {
        console.error("Failed to reveal all cells");
      }
    } catch (error) {
      console.error("Error revealing all cells:", error);
    }
  }, []);

  // Poll backend stats every 2 seconds
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const baseUrl = import.meta.env.DEV 
          ? "http://localhost:3001" 
          : "https://massivesweeperback.onrender.com";
        
        const [chunkRes, revealedRes, flaggedRes, usersRes] = await Promise.all([
          fetch(`${baseUrl}/chunk-count`).then(r => r.json()),
          fetch(`${baseUrl}/revealed-stats`).then(r => r.json()),
          fetch(`${baseUrl}/flagged-stats`).then(r => r.json()),
          fetch(`${baseUrl}/active-users`).then(r => r.json()),
        ]);
        if (mounted) {
          const newStats = {
            chunkCount: chunkRes.count,
            revealed: revealedRes.revealed,
            revealedPercent: revealedRes.percent,
            flagged: flaggedRes.flagged,
            correctFlags: flaggedRes.correctFlags,
            totalMines: flaggedRes.totalMines,
            activeUsers: usersRes.count,
            uniqueUsersEver: usersRes.uniqueUsersEver,
            bombsExploded: revealedRes.bombsExploded ?? 0,
          };
          setBackendStats(newStats);
          
                     // Check for completion (only if not minimized)
           if (gridSize && !completionMinimized) {
             const totalCells = gridSize.width * gridSize.height;
             const safeCells = totalCells - newStats.totalMines;
             if (newStats.revealed >= safeCells) {
               setShowCompletion(true);
             }
           }
        }
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      }
    }
         fetchStats();
     const interval = setInterval(fetchStats, 2000);
     return () => { mounted = false; clearInterval(interval); };
   }, [gridSize, completionMinimized]);

  // Calculate visible grid bounds and chunks
  function getVisibleBounds() {
    if (!gridSize) return { left: 0, top: 0, right: 0, bottom: 0 };
    
    // Top-left in grid coords
    const left = Math.max(0, Math.floor((-offset.x) / (10 * zoom)));
    const top = Math.max(0, Math.floor((-offset.y) / (10 * zoom)));
    // Bottom-right in grid coords
    const right = Math.min(gridSize.width, Math.ceil((canvasSize.width - offset.x) / (10 * zoom)));
    const bottom = Math.min(gridSize.height, Math.ceil((canvasSize.height - offset.y) / (10 * zoom)));
    return { left, top, right, bottom };
  }

  function getVisibleChunks() {
    if (!gridSize) return [];
    
    const { left, top, right, bottom } = getVisibleBounds();
    const chunkSize = 100; // Should match the chunk size from the store
    const chunkLeft = Math.floor(left / chunkSize);
    const chunkTop = Math.floor(top / chunkSize);
    const chunkRight = Math.floor((right - 1) / chunkSize);
    const chunkBottom = Math.floor((bottom - 1) / chunkSize);
    const chunks: Array<{ cx: number; cy: number }> = [];
    for (let cy = chunkTop; cy <= chunkBottom; cy++) {
      for (let cx = chunkLeft; cx <= chunkRight; cx++) {
        chunks.push({ cx, cy });
      }
    }
    return chunks;
  }

  const requestVisibleChunks = useCallback(() => {
    if (!gridSize) {
      console.log("Grid size not loaded yet, skipping chunk requests");
      return;
    }
    const visibleChunks = getVisibleChunks();
    for (const { cx, cy } of visibleChunks) {
      requestChunk(cx, cy);
    }
  }, [offset, zoom, canvasSize, gridSize, requestChunk]);

  // Request visible chunks on pan/zoom
  useEffect(() => {
    requestVisibleChunks();
    // eslint-disable-next-line
  }, [offset, zoom, canvasSize]);

  // Wrap revealCell to re-request visible chunks after revealing
  const revealAndRefresh = useCallback((chunkX, chunkY, localX, localY) => {
    revealCell(chunkX, chunkY, localX, localY);
    
    // Track player stats
    const chunk = loadedChunks[`${chunkX},${chunkY}`];
    if (chunk && chunk[localY] && chunk[localY][localX]) {
      const cell = chunk[localY][localX];
      if (!cell.revealed && !cell.flagged) {
        incrementCellsCleared();
        if (cell.hasMine) {
          incrementBombsExploded();
        }
      }
    }
    
    // Wait a tick for backend to process, then re-request visible chunks
    setTimeout(() => {
      requestVisibleChunks();
    }, 50);
  }, [revealCell, requestVisibleChunks, loadedChunks, incrementCellsCleared, incrementBombsExploded]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Start player session on mount
  useEffect(() => {
    startSession();
    return () => {
      endSession();
    };
  }, [startSession, endSession]);

  // Pan handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (isSpaceDown) {
        setIsPanning(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
      } else {
        // Grid interaction
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left - offset.x) / zoom;
        const cy = (e.clientY - rect.top - offset.y) / zoom;
        const cellX = Math.floor(cx / 10);
        const cellY = Math.floor(cy / 10);
        const chunkSize = 100; // Should match the chunk size from the store
        const chunkX = Math.floor(cellX / chunkSize);
        const chunkY = Math.floor(cellY / chunkSize);
        const localX = ((cellX % chunkSize) + chunkSize) % chunkSize;
        const localY = ((cellY % chunkSize) + chunkSize) % chunkSize;
        if (cellX >= 0 && cellY >= 0) {
          if (e.button === 0) {
            revealAndRefresh(chunkX, chunkY, localX, localY);
          } else if (e.button === 2) {
            flagCell(chunkX, chunkY, localX, localY);
            
            // Track flag placement
            const chunk = loadedChunks[`${chunkX},${chunkY}`];
            if (chunk && chunk[localY] && chunk[localY][localX]) {
              const cell = chunk[localY][localX];
              if (!cell.flagged) {
                incrementFlagsPlaced(cell.hasMine);
              }
            }
          }
        }
      }
    };
    const handleMouseUp = () => {
      setIsPanning(false);
      setLastMouse(null);
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !lastMouse) {
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left - offset.x) / zoom;
        const cy = (e.clientY - rect.top - offset.y) / zoom;
        const cellX = Math.floor(cx / 10);
        const cellY = Math.floor(cy / 10);
        if (cellX >= 0 && cellY >= 0 && gridSize && cellX < gridSize.width && cellY < gridSize.height) {
          setHoverCell({ x: cellX, y: cellY });
        } else {
          setHoverCell(null);
        }
      }
      if (!isPanning || !lastMouse) return;
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // World coordinates before zoom
      const worldX = (mouseX - offset.x) / zoom;
      const worldY = (mouseY - offset.y) / zoom;
      const zoomIntensity = 0.1;
      // Calculate minZoom so that at most 4x4 chunks (400x400 cells) are visible
      const chunkSize = 100; // Should match the chunk size from the store
      const minZoomX = canvasSize.width / (chunkSize * 4 * 10);
      const minZoomY = canvasSize.height / (chunkSize * 4 * 10);
      const minZoom = Math.max(minZoomX, minZoomY, 0.05);
      let newZoom = zoom - e.deltaY * zoomIntensity * 0.01;
      newZoom = Math.max(minZoom, Math.min(4, newZoom)); // Clamp zoom
      // Adjust offset so the world point under the mouse stays under the mouse
      const newOffsetX = mouseX - worldX * newZoom;
      const newOffsetY = mouseY - worldY * newZoom;
      setZoom(newZoom);
      setOffset({ x: newOffsetX, y: newOffsetY });
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("contextmenu", handleContextMenu);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isPanning, lastMouse, zoom, isSpaceDown, offset, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#e0e0e0"; // light gray background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
    // Only render visible cells in loaded chunks
    const { left, top, right, bottom } = getVisibleBounds();
    // Dynamic cell skipping for performance
    let cellStep = 1;
    if (zoom < 0.2) cellStep = 8;
    else if (zoom < 0.4) cellStep = 4;
    else if (zoom < 0.7) cellStep = 2;
    for (let y = top; y < bottom; y += cellStep) {
      for (let x = left; x < right; x += cellStep) {
        const chunkSize = 100; // Should match the chunk size from the store
        const chunkX = Math.floor(x / chunkSize);
        const chunkY = Math.floor(y / chunkSize);
        const localX = ((x % chunkSize) + chunkSize) % chunkSize;
        const localY = ((y % chunkSize) + chunkSize) % chunkSize;
        const chunk = loadedChunks[`${chunkX},${chunkY}`];
        if (!chunk || !chunk[localY] || !chunk[localY][localX]) continue;
        const cell = chunk[localY][localX];
        // Cell background
        if (cell.revealed) {
          ctx.fillStyle = cell.hasMine ? "#f88" : "#ccc";
        } else {
          ctx.fillStyle = "#222";
        }
        ctx.fillRect(x * 10, y * 10, 9 * cellStep, 9 * cellStep);
        // Border
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeRect(x * 10, y * 10, 9 * cellStep, 9 * cellStep);
        // Only draw details if not skipping many cells
        if (cellStep === 1) {
          // Flag
          if (cell.flagged && !cell.revealed) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(x * 10 + 2, y * 10 + 7);
            ctx.lineTo(x * 10 + 7, y * 10 + 4);
            ctx.lineTo(x * 10 + 2, y * 10 + 2);
            ctx.closePath();
            ctx.fill();
          }
          // Mine
          if (cell.revealed && cell.hasMine) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(x * 10 + 4.5, y * 10 + 4.5, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
          // Adjacent mines
          if (cell.revealed && !cell.hasMine && cell.adjacentMines > 0) {
            const numberColors = [
              '', // 0 (unused)
              '#0000FF', // 1 - blue
              '#008200', // 2 - green
              '#FF0000', // 3 - red
              '#000080', // 4 - navy
              '#800000', // 5 - maroon
              '#008080', // 6 - teal
              '#000000', // 7 - black
              '#808080', // 8 - gray
            ];
            ctx.fillStyle = numberColors[cell.adjacentMines] || 'blue';
            ctx.font = "7px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              String(cell.adjacentMines),
              x * 10 + 4.5,
              y * 10 + 5
            );
          }
        }
      }
    }
    // Draw ruler lines every 100 cells
    if (gridSize) {
      ctx.save();
      ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
      ctx.strokeStyle = "rgba(0, 100, 255, 0.6)"; // Blue with transparency
      ctx.lineWidth = 2;
      
      // Vertical lines (every 100 cells)
      for (let x = 100; x < gridSize.width; x += 100) {
        const worldX = x * 10;
        ctx.beginPath();
        ctx.moveTo(worldX, 0);
        ctx.lineTo(worldX, gridSize.height * 10);
        ctx.stroke();
      }
      
      // Horizontal lines (every 100 cells)
      for (let y = 100; y < gridSize.height; y += 100) {
        const worldY = y * 10;
        ctx.beginPath();
        ctx.moveTo(0, worldY);
        ctx.lineTo(gridSize.width * 10, worldY);
        ctx.stroke();
      }
      
             ctx.restore();
     }
     
     // Draw ruler labels fixed to screen edges (after the grid transform)
     if (gridSize) {
       ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen coordinates
       
       // Calculate font size based on zoom (inverse relationship)
       const baseFontSize = 16;
       const fontSize = Math.max(12, Math.min(24, baseFontSize / zoom));
       
       ctx.fillStyle = "rgba(0, 100, 255, 0.9)";
       ctx.font = `${fontSize}px monospace`;
       ctx.textAlign = "center";
       ctx.textBaseline = "middle";
       
       // Vertical labels (top edge of screen)
       for (let x = 100; x < gridSize.width; x += 100) {
         const worldX = x * 10;
         const screenX = worldX * zoom + offset.x;
         
         // Only draw if the line is visible on screen
         if (screenX >= -50 && screenX <= canvasSize.width + 50) {
           ctx.fillText(x.toString(), screenX, 25);
         }
       }
       
       // Horizontal labels (left edge of screen)
       for (let y = 100; y < gridSize.height; y += 100) {
         const worldY = y * 10;
         const screenY = worldY * zoom + offset.y;
         
         // Only draw if the line is visible on screen
         if (screenY >= -50 && screenY <= canvasSize.height + 50) {
           ctx.fillText(y.toString(), 25, screenY);
         }
       }
      
      ctx.restore();
    }
    
    // Draw MASSIVESWEEPER in the center of the grid (world coordinates)
    const gridCenterX = gridSize ? (gridSize.width * 10) / 2 : 2000;
    const gridCenterY = gridSize ? (gridSize.height * 10) / 2 : 1500;
    ctx.save();
    ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
    ctx.font = "bold 48px sans-serif";    
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MASSIVESWEEPER", gridCenterX, gridCenterY);
    ctx.restore();
    // Draw counters in top left
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Draw background for UI
    ctx.fillStyle = "rgba(240,240,240,0.85)";
    ctx.fillRect(5, 5, 260, 200);
    ctx.fillStyle = "#222";
    ctx.font = "16px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`MassiveSweeper`, 10, 10);
    ctx.fillText(`🧹 Active sweepers: ${backendStats.activeUsers}`, 10, 30);
    ctx.fillText(`🗺️ Revealed: ${backendStats.revealed} (${backendStats.revealedPercent.toFixed(2)}%)`, 10, 50);
    ctx.fillText(`🚩 Flags planted: ${backendStats.flagged}`, 10, 70);
    ctx.fillText(`💥 Bombs exploded: ${backendStats.bombsExploded}`, 10, 90);
    if (hoverCell) {
      ctx.fillText(`🗺️ You: (${hoverCell.x}, ${hoverCell.y})`, 10, 110);
    }
    
    // Draw player stats
    const { stats } = usePlayerStats.getState();
    ctx.fillText(`Your Stats:`, 10, 140);
    ctx.fillText(`🧹 Cells: ${stats.cellsCleared.toLocaleString()}`, 10, 160);
    ctx.fillText(`🚩 Flags: ${stats.flagsPlaced.toLocaleString()}`, 10, 180);
    // ctx.fillText(`User token: ${userTokenInfo.token.slice(0, 8)}...`, 10, 150);
  }, [loadedChunks, offset, zoom, canvasSize, backendStats, hoverCell]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceDown(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Add question mark icon and rules panel
  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ display: "block", position: "absolute", top: 0, left: 0, cursor: isPanning ? "grabbing" : "grab" }}
        onClick={() => setShowRules(false)}
      />
      
      {/* Debug Panel (dev mode only) */}
      {import.meta.env.DEV && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
          <button
            style={{ 
              fontSize: 14, 
              border: "2px solid #ff6b6b", 
              background: "#ff6b6b", 
              color: "white",
              cursor: "pointer",
              borderRadius: 4,
              padding: "8px 12px",
              fontWeight: "bold"
            }}
            onClick={e => { e.stopPropagation(); revealAllCells(); }}
            title="Debug: Reveal all cells"
          >
            🐛 REVEAL ALL
          </button>
        </div>
      )}
      
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
        <button
          style={{ fontSize: 24, border: "none", background: "none", cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); setShowRules(v => !v); }}
          title="Show rules"
        >
          ❓
        </button>
      </div>
      
      {/* Rules Panel */}
      {showRules && (
        <div style={{
          position: "absolute", top: 60, right: 10, zIndex: 20, background: "#fff", color: "#222", border: "1px solid #ccc", borderRadius: 8, padding: 20, maxWidth: 400, boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
        }}>
          <h2>MASSIVESWEEPER Rules</h2>
          <ul>
            <li>Reveal all safe cells without triggering mines.</li>
            <li>Right-click to flag suspected mines.</li>
            <li>Work together with other players in real time!</li>
            <li>Zoom and pan to explore the massive grid.</li>
            <li>Stats and progress are shown in the top-left.</li>
          </ul>
          <button onClick={() => setShowRules(false)} style={{ marginTop: 10 }}>Close</button>
        </div>
      )}
      
      {/* Completion Screen */}
      {showCompletion && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: "rgba(0, 0, 0, 0.8)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "#fff", color: "#222", border: "2px solid #4CAF50", borderRadius: 12, 
            padding: 40, maxWidth: 500, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
          }}>
            <h1 style={{ color: "#4CAF50", marginBottom: 20, fontSize: "2.5em" }}>🎉 MassiveSweeper Complete! 🎉</h1>
            
            <div style={{ fontSize: "1.2em", lineHeight: 1.6, marginBottom: 30 }}>
              <p><strong>🧹 Sweepers swept:</strong> {backendStats.activeUsers}</p>
              <p><strong>💥 Mines exploded:</strong> {backendStats.bombsExploded.toLocaleString()}</p>
              <p><strong>🚩 Flags placed:</strong> {backendStats.flagged.toLocaleString()}</p>
              <p><strong>✅ Flags placed correctly:</strong> {backendStats.correctFlags.toLocaleString()}</p>
              <p><strong>📊 Total cells revealed:</strong> {backendStats.revealed.toLocaleString()}</p>
              <p><strong>📈 Completion percentage:</strong> {backendStats.revealedPercent.toFixed(2)}%</p>
              <p><strong>👥 Unique players ever:</strong> {backendStats.uniqueUsersEver.toLocaleString()}</p>
              <p><strong>🎯 Flag accuracy:</strong> {backendStats.flagged > 0 ? ((backendStats.correctFlags / backendStats.flagged) * 100).toFixed(1) : 0}%</p>
            </div>
            
            <button 
              onClick={() => {
                setShowCompletion(false);
                setCompletionMinimized(true);
              }} 
              style={{ 
                fontSize: "1.1em", 
                padding: "12px 24px", 
                background: "#4CAF50", 
                color: "white", 
                border: "none", 
                borderRadius: 6, 
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Minimize & Explore
            </button>
          </div>
        </div>
      )}
    </>
  );
}
