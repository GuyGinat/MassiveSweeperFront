/**
 * Canvas Renderer Hook
 * 
 * This hook handles all canvas rendering logic for the MassiveSweeper game.
 * It manages cell rendering, rulers, UI overlays, and performance optimizations.
 */

import { useCallback, useRef } from 'react';
import { useChunkedGridStore, type Cell } from './useChunkedGridStore';
import { usePlayerStats } from './usePlayerStats';
import { 
  CHUNK_SIZE, 
  CELL_SIZE, 
  RULER_INTERVAL, 
  MIN_VISIBLE_CHUNKS,
  DEFAULT_GRID_CENTER,
  getCellRenderStep,
  isWithinGridBounds
} from '../constants/game';
import { 
  COLORS, 
  FONTS, 
  getNumberColor, 
  getResponsiveFontSize 
} from '../constants/ui';

interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  zoom: number;
  offset: { x: number; y: number };
  canvasSize: { width: number; height: number };
  gridSize: { width: number; height: number } | null;
  hoverCell: { x: number; y: number } | null;
  backendStats: any;
}

interface VisibleBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function useCanvasRenderer() {
  const { loadedChunks } = useChunkedGridStore();
  
  /**
   * Calculate visible bounds based on current viewport
   */
  const getVisibleBounds = useCallback((
    zoom: number, 
    offset: { x: number; y: number }, 
    canvasSize: { width: number; height: number }
  ): VisibleBounds => {
    const left = Math.floor(-offset.x / (zoom * CELL_SIZE));
    const top = Math.floor(-offset.y / (zoom * CELL_SIZE));
    const right = Math.ceil((-offset.x + canvasSize.width) / (zoom * CELL_SIZE));
    const bottom = Math.ceil((-offset.y + canvasSize.height) / (zoom * CELL_SIZE));
    
    return { left, top, right, bottom };
  }, []);

  /**
   * Render a single cell
   */
  const renderCell = useCallback((
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    x: number,
    y: number,
    cellStep: number,
    isHovered: boolean
  ) => {
    // Cell background
    if (cell.revealed) {
      ctx.fillStyle = cell.hasMine ? COLORS.CELL.MINE : COLORS.CELL.REVEALED;
    } else {
      ctx.fillStyle = COLORS.CELL.UNREVEALED;
    }
    
    // Add hover effect
    if (isHovered) {
      ctx.fillStyle = COLORS.GAME.HOVER;
    }
    
    ctx.fillRect(
      x * CELL_SIZE, 
      y * CELL_SIZE, 
      (CELL_SIZE - 1) * cellStep, 
      (CELL_SIZE - 1) * cellStep
    );
    
    // Border
    ctx.strokeStyle = COLORS.CELL.BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x * CELL_SIZE, 
      y * CELL_SIZE, 
      (CELL_SIZE - 1) * cellStep, 
      (CELL_SIZE - 1) * cellStep
    );
    
    // Only draw details if not skipping many cells
    if (cellStep === 1) {
      // Flag
      if (cell.flagged && !cell.revealed) {
        ctx.fillStyle = COLORS.GAME.FLAG;
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + 2, y * CELL_SIZE + 7);
        ctx.lineTo(x * CELL_SIZE + 7, y * CELL_SIZE + 4);
        ctx.lineTo(x * CELL_SIZE + 2, y * CELL_SIZE + 2);
        ctx.closePath();
        ctx.fill();
      }
      
      // Mine
      if (cell.revealed && cell.hasMine) {
        ctx.fillStyle = COLORS.GAME.MINE;
        ctx.beginPath();
        ctx.arc(x * CELL_SIZE + 4.5, y * CELL_SIZE + 4.5, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Adjacent mines
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
  }, []);

  /**
   * Render the grid cells
   */
  const renderGrid = useCallback((
    ctx: CanvasRenderingContext2D,
    zoom: number,
    offset: { x: number; y: number },
    canvasSize: { width: number; height: number },
    hoverCell: { x: number; y: number } | null
  ) => {
    const { left, top, right, bottom } = getVisibleBounds(zoom, offset, canvasSize);
    const cellStep = getCellRenderStep(zoom);
    
    for (let y = top; y < bottom; y += cellStep) {
      for (let x = left; x < right; x += cellStep) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localY = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const chunk = loadedChunks[`${chunkX},${chunkY}`];
        
        if (!chunk || !chunk[localY] || !chunk[localY][localX]) continue;
        
        const cell = chunk[localY][localX];
        const isHovered = !!(hoverCell && hoverCell.x === x && hoverCell.y === y);
        
        renderCell(ctx, cell, x, y, cellStep, isHovered);
      }
    }
  }, [loadedChunks, getVisibleBounds, renderCell]);

  /**
   * Render ruler lines and labels
   */
  const renderRulers = useCallback((
    ctx: CanvasRenderingContext2D,
    zoom: number,
    offset: { x: number; y: number },
    canvasSize: { width: number; height: number },
    gridSize: { width: number; height: number } | null
  ) => {
    if (!gridSize) return;
    
    // Draw ruler lines
    ctx.save();
    ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
    ctx.strokeStyle = COLORS.GRID.RULER_LINE;
    ctx.lineWidth = 2;
    
    // Vertical lines (every 100 cells)
    for (let x = RULER_INTERVAL; x < gridSize.width; x += RULER_INTERVAL) {
      const worldX = x * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(worldX, 0);
      ctx.lineTo(worldX, gridSize.height * CELL_SIZE);
      ctx.stroke();
    }
    
    // Horizontal lines (every 100 cells)
    for (let y = RULER_INTERVAL; y < gridSize.height; y += RULER_INTERVAL) {
      const worldY = y * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, worldY);
      ctx.lineTo(gridSize.width * CELL_SIZE, worldY);
      ctx.stroke();
    }
    ctx.restore();
    
    // Draw ruler labels
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen coordinates
    const fontSize = getResponsiveFontSize(16, zoom);
    
    ctx.fillStyle = COLORS.GRID.RULER_LABEL;
    ctx.font = `${fontSize}px ${FONTS.FAMILY.MONOSPACE}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Vertical labels (top edge of screen)
    for (let x = RULER_INTERVAL; x < gridSize.width; x += RULER_INTERVAL) {
      const worldX = x * CELL_SIZE;
      const screenX = worldX * zoom + offset.x;
      
      if (screenX >= -50 && screenX <= canvasSize.width + 50) {
        ctx.fillText(x.toString(), screenX, 25);
      }
    }
    
    // Horizontal labels (left edge of screen)
    for (let y = RULER_INTERVAL; y < gridSize.height; y += RULER_INTERVAL) {
      const worldY = y * CELL_SIZE;
      const screenY = worldY * zoom + offset.y;
      
      if (screenY >= -50 && screenY <= canvasSize.height + 50) {
        ctx.fillText(y.toString(), 25, screenY);
      }
    }
  }, []);

  /**
   * Render the main title
   */
  const renderTitle = useCallback((
    ctx: CanvasRenderingContext2D,
    zoom: number,
    offset: { x: number; y: number },
    gridSize: { width: number; height: number } | null
  ) => {
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
  }, []);

  /**
   * Render the stats overlay
   */
  const renderStatsOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    backendStats: any,
    hoverCell: { x: number; y: number } | null
  ) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw background for UI
    ctx.fillStyle = COLORS.BACKGROUND.OVERLAY;
    ctx.fillRect(5, 5, 260, 200);
    ctx.fillStyle = COLORS.UI.TEXT.PRIMARY;
    ctx.font = `16px ${FONTS.FAMILY.MONOSPACE}`;
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
  }, []);

  /**
   * Main render function
   */
  const render = useCallback((context: RenderContext) => {
    const { canvas, ctx, zoom, offset, canvasSize, gridSize, hoverCell, backendStats } = context;
    
    // Clear canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.BACKGROUND.PRIMARY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set transform for grid rendering
    ctx.setTransform(zoom, 0, 0, zoom, offset.x, offset.y);
    
    // Render grid cells
    renderGrid(ctx, zoom, offset, canvasSize, hoverCell);
    
    // Render rulers
    renderRulers(ctx, zoom, offset, canvasSize, gridSize);
    
    // Render title
    renderTitle(ctx, zoom, offset, gridSize);
    
    // Render stats overlay
    renderStatsOverlay(ctx, backendStats, hoverCell);
  }, [renderGrid, renderRulers, renderTitle, renderStatsOverlay]);

  return {
    render,
    getVisibleBounds,
    renderCell,
    renderGrid,
    renderRulers,
    renderTitle,
    renderStatsOverlay
  };
} 