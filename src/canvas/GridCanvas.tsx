import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChunkedGridStore, Cell, Chunk } from "../hooks/useChunkedGridStore";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { userTokenInfo, socket } from "../network/socket";
import { 
  CHUNK_SIZE, 
  CELL_SIZE, 
  ZOOM_LIMITS, 
  DEFAULT_ZOOM, 
  ZOOM_INTENSITY, 
  MIN_VISIBLE_CHUNKS,
  RULER_INTERVAL,
  STATS_POLL_INTERVAL,
  CHUNK_REFRESH_DELAY,
  COMPLETION_RESET_THRESHOLD,
  DEFAULT_GRID_CENTER,
  getCellRenderStep,
  getBufferZoneSize,
  expandChunkBounds,
  clampZoom,
  worldToChunk,
  worldToLocal,
  isWithinGridBounds
} from "../constants/game";
import { 
  COLORS, 
  Z_INDEX, 
  FONTS, 
  SPACING, 
  DIMENSIONS,
  CURSORS,
  getNumberColor,
  getResponsiveFontSize
} from "../constants/ui";
import { 
  getApiBaseUrl, 
  API_ENDPOINTS, 
  ERROR_MESSAGES 
} from "../constants/socket";

export function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedChunks = useChunkedGridStore((state) => state.loadedChunks);
  const requestChunk = useChunkedGridStore((state) => state.requestChunk);
  const revealCell = useChunkedGridStore((state) => state.revealCell);
  const flagCell = useChunkedGridStore((state) => state.flagCell);
  const chordClick = useChunkedGridStore((state) => state.chordClick);
  const fetchGridSize = useChunkedGridStore((state) => state.fetchGridSize);  
  const gridSize = useChunkedGridStore((state) => state.gridSize);
  
  // Player stats
  const { incrementCellsCleared, incrementFlagsPlaced, incrementBombsExploded, startSession, endSession } = usePlayerStats();

  // Viewport state
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Start at top-left
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM); // Start at normal zoom
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
    uniqueUsersEver: 0,
    bombsExploded: 0,
  });

  // Hovered cell state
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  
  // Chord click state (simultaneous left and right mouse buttons)
  const [pressedButtons, setPressedButtons] = useState<Set<number>>(new Set());
  
  // Visual feedback state for mouse down
  const [pressedCell, setPressedCell] = useState<{ x: number; y: number } | null>(null);
  
  // Completion screen state
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionMinimized, setCompletionMinimized] = useState(false);

  // Socket connection state
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Determine the appropriate cursor based on current state
  const getCursor = useCallback(() => {
    if (isSpaceDown) {
      if (isPanning) {
        return CURSORS.GRABBING;
      } else {
        return CURSORS.GRAB;
      }
    } else {
      return CURSORS.DEFAULT;
    }
  }, [isSpaceDown, isPanning]);

  // Consolidated completion check function
  const checkCompletion = useCallback(() => {
    if (!gridSize || completionMinimized) return false;
    const totalCells = gridSize.width * gridSize.height;
    const safeCells = totalCells - backendStats.totalMines;
    return backendStats.revealed >= safeCells;
  }, [gridSize, backendStats.revealed, backendStats.totalMines, completionMinimized]);

  // Consolidated chunk calculation function
  const calculateVisibleChunks = useCallback(() => {
    if (!gridSize) return [];
    
    const { left, top, right, bottom } = getVisibleBounds();
    const chunkLeft = Math.floor(left / CHUNK_SIZE);
    const chunkTop = Math.floor(top / CHUNK_SIZE);
    const chunkRight = Math.floor((right - 1) / CHUNK_SIZE);
    const chunkBottom = Math.floor((bottom - 1) / CHUNK_SIZE);
    
    const bufferSize = getBufferZoneSize(zoom);
    const expandedBounds = expandChunkBounds(
      { left: chunkLeft, top: chunkTop, right: chunkRight, bottom: chunkBottom },
      bufferSize
    );
    
    const maxChunkX = Math.floor(gridSize.width / CHUNK_SIZE) - 1;
    const maxChunkY = Math.floor(gridSize.height / CHUNK_SIZE) - 1;
    
    const finalLeft = Math.max(0, Math.min(expandedBounds.left, maxChunkX));
    const finalTop = Math.max(0, Math.min(expandedBounds.top, maxChunkY));
    const finalRight = Math.max(0, Math.min(expandedBounds.right, maxChunkX));
    const finalBottom = Math.max(0, Math.min(expandedBounds.bottom, maxChunkY));
    
    const chunks: Array<{ cx: number; cy: number }> = [];
    for (let cy = finalTop; cy <= finalBottom; cy++) {
      for (let cx = finalLeft; cx <= finalRight; cx++) {
        chunks.push({ cx, cy });
      }
    }
    return chunks;
  }, [gridSize, zoom]);

  // Consolidated mouse coordinate calculation
  const getMouseGridCoordinates = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left - offset.x) / zoom;
    const cy = (e.clientY - rect.top - offset.y) / zoom;
    const cellX = Math.floor(cx / CELL_SIZE);
    const cellY = Math.floor(cy / CELL_SIZE);
    
    return { cellX, cellY, cx, cy };
  }, [offset, zoom]);

  // Initialize grid and restore chunks
  useEffect(() => {
    const initializeGrid = async () => {
      try {
        await fetchGridSize();
      } catch (error) {
        // Failed to initialize grid - silently handle
      }
    };
    
    initializeGrid();
  }, [fetchGridSize]);

  // Socket connection management
  useEffect(() => {
    const handleConnect = () => {
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleConnectError = (error: any) => {
      setIsSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Set initial connection state
    setIsSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  // Single completion check effect
  useEffect(() => {
    if (checkCompletion()) {
      setShowCompletion(true);
    }
  }, [checkCompletion]);

  // Reset minimized state when game resets
  useEffect(() => {
    if (backendStats.revealed < COMPLETION_RESET_THRESHOLD && completionMinimized) {
      setCompletionMinimized(false);
    }
  }, [backendStats.revealed, completionMinimized]);

  // Debug function to reveal all cells (dev mode only)
  const revealAllCells = useCallback(async () => {
    if (!import.meta.env.DEV) return;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.REVEAL_ALL}`);
      
      if (response.ok) {
        // All cells revealed for debugging
      } else {
        // Failed to reveal all cells
      }
    } catch (error) {
      // Error revealing all cells
    }
  }, []);

  // Poll backend stats with error handling and connection awareness
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchStats() {
      if (!isSocketConnected && retryCount >= maxRetries) {
        return;
      }

      try {
        const [chunkRes, revealedRes, flaggedRes, usersRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}${API_ENDPOINTS.CHUNK_COUNT}`).then(r => r.json()),
          fetch(`${getApiBaseUrl()}${API_ENDPOINTS.REVEALED_STATS}`).then(r => r.json()),
          fetch(`${getApiBaseUrl()}${API_ENDPOINTS.FLAGGED_STATS}`).then(r => r.json()),
          fetch(`${getApiBaseUrl()}${API_ENDPOINTS.ACTIVE_USERS}`).then(r => r.json()),
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
          retryCount = 0; // Reset retry count on success
        }
      } catch (error) {
        retryCount++;
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, STATS_POLL_INTERVAL);
    
    return () => { 
      mounted = false; 
      clearInterval(interval); 
    };
  }, [isSocketConnected]);

  // Calculate visible grid bounds
  function getVisibleBounds() {
    if (!gridSize) return { left: 0, top: 0, right: 0, bottom: 0 };
    
    const left = Math.max(0, Math.floor((-offset.x) / (CELL_SIZE * zoom)));
    const top = Math.max(0, Math.floor((-offset.y) / (CELL_SIZE * zoom)));
    const right = Math.min(gridSize.width, Math.ceil((canvasSize.width - offset.x) / (CELL_SIZE * zoom)));
    const bottom = Math.min(gridSize.height, Math.ceil((canvasSize.height - offset.y) / (CELL_SIZE * zoom)));
    return { left, top, right, bottom };
  }

  // Request visible chunks with logging
  const requestVisibleChunks = useCallback(() => {
    if (!gridSize) {
      return;
    }
    
    const visibleChunks = calculateVisibleChunks();
    const bufferSize = getBufferZoneSize(zoom);
    
    for (const { cx, cy } of visibleChunks) {
      requestChunk(cx, cy);
    }
  }, [gridSize, calculateVisibleChunks, zoom, requestChunk]);

  // Request visible chunks on pan/zoom
  useEffect(() => {
    requestVisibleChunks();
  }, [offset, zoom, canvasSize, requestVisibleChunks]);

  // Wrap revealCell to re-request visible chunks after revealing (fix for chunk sync issue)
  const revealAndRefresh = useCallback((chunkX: number, chunkY: number, localX: number, localY: number) => {
    revealCell(chunkX, chunkY, localX, localY);
    
    // Wait a tick for backend to process, then re-request visible chunks
    setTimeout(() => {
      requestVisibleChunks();
    }, 50);
  }, [revealCell, requestVisibleChunks]);

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

  // Listen for cell updates from backend and track stats
  useEffect(() => {
    console.log('🔢 loadedChunks: ', loadedChunks);
    const handleCellUpdate = ({ cx, cy, x, y, cell }: { cx: number; cy: number; x: number; y: number; cell: any }) => {
      const chunkKey = `${cx},${cy}`;
      const chunk = loadedChunks[chunkKey];
      if (chunk && chunk[y] && chunk[y][x]) {
        const previousCell = chunk[y][x];
        
        if (cell.revealed && !previousCell.revealed && !previousCell.flagged) {
          incrementCellsCleared();
          if (cell.hasMine) {
            incrementBombsExploded();
          }
        }
        
        if (cell.flagged && !previousCell.flagged) {
          incrementFlagsPlaced(cell.hasMine);
        }
      }
    };

    socket.on('cell_update', handleCellUpdate);
    
    return () => {
      socket.off('cell_update', handleCellUpdate);
    };
  }, [loadedChunks, incrementCellsCleared, incrementBombsExploded, incrementFlagsPlaced]);

  // Mouse event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      setPressedButtons(prev => new Set([...prev, e.button]));
      
      if (isSpaceDown) {
        setIsPanning(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
      } else {
        const coords = getMouseGridCoordinates(e);
        if (coords && coords.cellX >= 0 && coords.cellY >= 0) {
          setPressedCell({ x: coords.cellX, y: coords.cellY });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setPressedButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.button);
        return newSet;
      });
      
      setPressedCell(null);
      
      if (isPanning) {
        setIsPanning(false);
        setLastMouse(null);
        return;
      }
      
      if (pressedCell) {
        const coords = getMouseGridCoordinates(e);
        if (coords && coords.cellX === pressedCell.x && coords.cellY === pressedCell.y) {
          const chunkX = worldToChunk(coords.cellX);
          const chunkY = worldToChunk(coords.cellY);
          const localX = worldToLocal(coords.cellX);
          const localY = worldToLocal(coords.cellY);
          
          const currentPressedButtons = new Set([...pressedButtons, e.button]);
          if (currentPressedButtons.has(0) && currentPressedButtons.has(2)) {
            chordClick(chunkX, chunkY, localX, localY);
            // Also re-request chunks after chord click
            setTimeout(() => {
              requestVisibleChunks();
            }, 50);
          } else {
            if (e.button === 0) {
              revealAndRefresh(chunkX, chunkY, localX, localY);
            } else if (e.button === 2) {
              flagCell(chunkX, chunkY, localX, localY);
            }
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !lastMouse) {
        const coords = getMouseGridCoordinates(e);
        if (coords && gridSize && isWithinGridBounds(coords.cellX, coords.cellY, gridSize.width, gridSize.height)) {
          setHoverCell({ x: coords.cellX, y: coords.cellY });
        } else {
          setHoverCell(null);
        }
      }
      
      if (isPanning && lastMouse) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMouse({ x: e.clientX, y: e.clientY });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - offset.x) / zoom;
      const worldY = (mouseY - offset.y) / zoom;
      
      const minZoomX = canvasSize.width / (CHUNK_SIZE * MIN_VISIBLE_CHUNKS * CELL_SIZE);
      const minZoomY = canvasSize.height / (CHUNK_SIZE * MIN_VISIBLE_CHUNKS * CELL_SIZE);
      const minZoom = Math.max(minZoomX, minZoomY, ZOOM_LIMITS.MIN);
      
      let newZoom = zoom - e.deltaY * ZOOM_INTENSITY * 0.01;
      newZoom = clampZoom(newZoom);
      
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
  }, [isPanning, lastMouse, zoom, isSpaceDown, offset, canvasSize, pressedButtons, chordClick, pressedCell, getMouseGridCoordinates, gridSize, revealAndRefresh, flagCell]);

  // Canvas rendering
  useEffect(() => {    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.BACKGROUND.PRIMARY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
    
    const { left, top, right, bottom } = getVisibleBounds();
    const cellStep = getCellRenderStep(zoom);
    
    for (let y = top; y < bottom; y += cellStep) {
      for (let x = left; x < right; x += cellStep) {
        const chunkSize = 100;
        const chunkX = Math.floor(x / chunkSize);
        const chunkY = Math.floor(y / chunkSize);
        const localX = ((x % chunkSize) + chunkSize) % chunkSize;
        const localY = ((y % chunkSize) + chunkSize) % chunkSize;
        const chunkKey = `${chunkX},${chunkY}`;
        const chunk = loadedChunks[chunkKey];
              
        
        if (!chunk || !chunk[localY] || !chunk[localY][localX]) continue;
        const cell = chunk[localY][localX];
        const isPressed = pressedCell && pressedCell.x === x && pressedCell.y === y;
        
        if (cell.revealed) {
          ctx.fillStyle = cell.hasMine ? COLORS.CELL.MINE : COLORS.CELL.REVEALED;
        } else {
          ctx.fillStyle = COLORS.CELL.UNREVEALED;
        }
        
        if (isPressed) {
          ctx.fillStyle = COLORS.CELL.PRESSED;
        }
        
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, (CELL_SIZE - 1) * cellStep, (CELL_SIZE - 1) * cellStep);
        ctx.strokeStyle = COLORS.CELL.BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, (CELL_SIZE - 1) * cellStep, (CELL_SIZE - 1) * cellStep);
        
        if (cellStep === 1) {
          if (cell.flagged && !cell.revealed) {
            ctx.fillStyle = COLORS.GAME.FLAG;
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE + 2, y * CELL_SIZE + 7);
            ctx.lineTo(x * CELL_SIZE + 7, y * CELL_SIZE + 4);
            ctx.lineTo(x * CELL_SIZE + 2, y * CELL_SIZE + 2);
            ctx.closePath();
            ctx.fill();
          }
          
          if (cell.revealed && cell.hasMine) {
            ctx.fillStyle = COLORS.GAME.MINE;
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + 4.5, y * CELL_SIZE + 4.5, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          if (cell.revealed && !cell.hasMine && cell.adjacentMines > 0) {
            ctx.fillStyle = getNumberColor(cell.adjacentMines);
            ctx.font = `${FONTS.SIZE.TINY} ${FONTS.FAMILY.PRIMARY}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              String(cell.adjacentMines),
              x * CELL_SIZE + 4.5,
              y * CELL_SIZE + 5
            );
          }
        }
      }
    }
    
    // Draw ruler lines
    if (gridSize) {
      ctx.save();
      ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
      ctx.strokeStyle = COLORS.GRID.RULER_LINE;
      ctx.lineWidth = 2;
      
      for (let x = RULER_INTERVAL; x < gridSize.width; x += RULER_INTERVAL) {
        const worldX = x * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(worldX, 0);
        ctx.lineTo(worldX, gridSize.height * CELL_SIZE);
        ctx.stroke();
      }
      
      for (let y = RULER_INTERVAL; y < gridSize.height; y += RULER_INTERVAL) {
        const worldY = y * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(0, worldY);
        ctx.lineTo(gridSize.width * CELL_SIZE, worldY);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Draw ruler labels
    if (gridSize) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const fontSize = getResponsiveFontSize(16, zoom);
      ctx.fillStyle = COLORS.GRID.RULER_LABEL;
      ctx.font = `${fontSize}px ${FONTS.FAMILY.MONOSPACE}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      for (let x = RULER_INTERVAL; x < gridSize.width; x += RULER_INTERVAL) {
        const worldX = x * CELL_SIZE;
        const screenX = worldX * zoom + offset.x;
        if (screenX >= -50 && screenX <= canvasSize.width + 50) {
          ctx.fillText(x.toString(), screenX, 25);
        }
      }
      
      for (let y = RULER_INTERVAL; y < gridSize.height; y += RULER_INTERVAL) {
        const worldY = y * CELL_SIZE;
        const screenY = worldY * zoom + offset.y;
        if (screenY >= -50 && screenY <= canvasSize.height + 50) {
          ctx.fillText(y.toString(), 25, screenY);
        }
      }
      
      ctx.restore();
    }
    
    // Draw MASSIVESWEEPER in center
    const gridCenterX = gridSize ? (gridSize.width * CELL_SIZE) / 2 : DEFAULT_GRID_CENTER.X;
    const gridCenterY = gridSize ? (gridSize.height * CELL_SIZE) / 2 : DEFAULT_GRID_CENTER.Y;
    ctx.save();
    ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
    ctx.font = `bold 48px ${FONTS.FAMILY.PRIMARY}`;    
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MASSIVESWEEPER", gridCenterX, gridCenterY);
    ctx.restore();
    
    // Draw UI overlay
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.BACKGROUND.OVERLAY;
    ctx.fillRect(SPACING.SMALL, SPACING.SMALL, DIMENSIONS.OVERLAY.WIDTH, DIMENSIONS.OVERLAY.HEIGHT);
    ctx.fillStyle = COLORS.UI.TEXT.PRIMARY;
    ctx.font = `16px ${FONTS.FAMILY.MONOSPACE}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`MassiveSweeper`, SPACING.BASE, SPACING.BASE);
    ctx.fillText(`🧹 Active sweepers: ${backendStats.activeUsers}`, SPACING.BASE, 30);
    ctx.fillText(`🧹 Total sweepers: ${backendStats.uniqueUsersEver}`, SPACING.BASE, 50);
    ctx.fillText(`🗺️ Revealed: ${backendStats.revealed} (${backendStats.revealedPercent.toFixed(2)}%)`, SPACING.BASE, 70);
    ctx.fillText(`🚩 Flags planted: ${backendStats.flagged}`, SPACING.BASE, 90);
    ctx.fillText(`💥 Mines exploded: ${backendStats.bombsExploded}`, SPACING.BASE, 110);
    
    if (hoverCell) {
      ctx.fillText(`🗺️ You: (${hoverCell.x}, ${hoverCell.y})`, SPACING.BASE, 130);
    }
    
    // Connection status indicator
    // ctx.fillStyle = isSocketConnected ? COLORS.UI.SUCCESS : COLORS.UI.ERROR;
    // ctx.fillText(`🔌 ${isSocketConnected ? 'Connected' : 'Disconnected'}`, SPACING.BASE, 150);
    
    // Draw player stats
    const { stats } = usePlayerStats.getState();
    ctx.fillText(`Your Stats:`, SPACING.BASE, 150);
    ctx.fillText(`🧹 Cells: ${stats.cellsCleared.toLocaleString()}`, SPACING.BASE, 170);
    ctx.fillText(`🚩 Flags: ${stats.flagsPlaced.toLocaleString()}`, SPACING.BASE, 190);
  }, [loadedChunks, offset, zoom, canvasSize, backendStats, hoverCell, pressedCell, gridSize, isSocketConnected]);

  // Keyboard event handlers
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

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ display: "block", position: "absolute", top: 0, left: 0, cursor: getCursor() }}
      />
      
      {/* Debug Panel (dev mode only) */}
      {import.meta.env.DEV && (
        <div style={{ 
          position: "absolute", 
          bottom: SPACING.BASE, 
          left: SPACING.BASE, 
          zIndex: Z_INDEX.DEBUG 
        }}>
          <button
            style={{ 
              fontSize: 14, 
              border: `2px solid ${COLORS.UI.WARNING}`, 
              background: COLORS.UI.WARNING, 
              color: COLORS.UI.TEXT.WHITE,
              cursor: CURSORS.POINTER,
              borderRadius: 4,
              padding: "8px 12px",
              fontWeight: "bold"
            }}
            onClick={e => { e.stopPropagation(); revealAllCells(); }}
            title="Debug: Reveal all cells"
          >
            🐛 REVEAL ALL
          </button>
          
          {/* Debug Info Panel */}
          <div style={{ 
            marginTop: 8, 
            padding: "8px 12px", 
            background: COLORS.BACKGROUND.OVERLAY, 
            borderRadius: 4,
            fontSize: 12,
            color: COLORS.UI.TEXT.PRIMARY,
            border: `1px solid ${COLORS.UI.BORDER}`,
            minWidth: "200px"
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px", borderBottom: `1px solid ${COLORS.UI.BORDER}`, paddingBottom: "4px" }}>
              🔧 Debug Info
            </div>
            <div>🔍 Zoom: {zoom.toFixed(2)}</div>
            <div>📦 Buffer: {getBufferZoneSize(zoom)} chunks</div>
            <div>📊 Chunks: {Object.keys(loadedChunks).length} loaded</div>
            <div>🔌 Socket: {isSocketConnected ? 'Connected' : 'Disconnected'}</div>
            <div>👥 Active Players: {backendStats.activeUsers}</div>
            <div>🌍 Total Players Ever: {backendStats.uniqueUsersEver?.toLocaleString() || 'N/A'}</div>
            <div>💥 Mines Exploded: {backendStats.bombsExploded?.toLocaleString() || 'N/A'}</div>
            <div>🚩 Flags Placed: {backendStats.flagged?.toLocaleString() || 'N/A'}</div>
          </div>
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