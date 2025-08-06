/**
 * Game Constants
 * 
 * This file contains all game-related constants used throughout the MassiveSweeper application.
 * Centralizing these values makes the codebase more maintainable and reduces magic numbers.
 */

// ============================================================================
// GRID & CHUNK CONFIGURATION
// ============================================================================

/** Size of each chunk in cells (width x height) */
export const CHUNK_SIZE = 100;

/** Size of each cell in pixels */
export const CELL_SIZE = 10;

/** Total grid dimensions in cells - these are now fetched from the server */
// Removed hardcoded values - grid size is fetched dynamically from server

/** Percentage of cells that contain mines (0.17 = 17%) */
export const MINE_PERCENTAGE = 0.17;

/** Interval for ruler lines (every 100 cells) */
export const RULER_INTERVAL = 100;

// ============================================================================
// ZOOM & VIEWPORT CONFIGURATION
// ============================================================================

/** Zoom limits for the viewport */
export const ZOOM_LIMITS = {
  MIN: 0.35,
  MAX: 4.0,
} as const;

/** Default zoom level */
export const DEFAULT_ZOOM = 1.0;

/** Zoom intensity for mouse wheel */
export const ZOOM_INTENSITY = 0.1;

/** Minimum number of chunks visible at maximum zoom */
export const MIN_VISIBLE_CHUNKS = 4;

/** Buffer zone for preemptive chunk loading (in chunks) */
export const CHUNK_BUFFER_ZONE = 1;

/** Maximum buffer zone size to prevent excessive loading */
export const MAX_BUFFER_ZONE = 3;

// ============================================================================
// GAME LOGIC CONSTANTS
// ============================================================================

/** Maximum number of adjacent cells (including diagonals) */
export const MAX_ADJACENT_CELLS = 8;

/** Default cell state values */
export const DEFAULT_CELL_STATE = {
  REVEALED: false,
  HAS_MINE: false,
  ADJACENT_MINES: 0,
  FLAGGED: false,
} as const;

// ============================================================================
// PERFORMANCE & OPTIMIZATION
// ============================================================================

/** Cell rendering step sizes based on zoom level */
export const CELL_RENDER_STEPS = {
  ZOOM_0_2: 8,    // Skip 8 cells when zoom < 0.2
  ZOOM_0_4: 4,    // Skip 4 cells when zoom < 0.4
  ZOOM_0_7: 2,    // Skip 2 cells when zoom < 0.7
  ZOOM_DEFAULT: 1, // No skipping when zoom >= 0.7
} as const;

/** Polling interval for backend stats (in milliseconds) */
export const STATS_POLL_INTERVAL = 2000;

/** Delay before re-requesting chunks after cell reveal (in milliseconds) */
export const CHUNK_REFRESH_DELAY = 50;

// ============================================================================
// COMPLETION & GAME STATE
// ============================================================================

/** Threshold for resetting completion minimized state */
export const COMPLETION_RESET_THRESHOLD = 1000;

/** Default grid center coordinates (fallback) */
export const DEFAULT_GRID_CENTER = {
  X: 2000,
  Y: 1500,
} as const;

// ============================================================================
// VALIDATION & BOUNDS
// ============================================================================

/** Maximum grid dimensions (safety limits) */
export const MAX_GRID_DIMENSIONS = {
  WIDTH: 10000,
  HEIGHT: 10000,
} as const;

/** Minimum grid dimensions */
export const MIN_GRID_DIMENSIONS = {
  WIDTH: 100,
  HEIGHT: 100,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the number of chunks needed for a given grid dimension
 * @param dimension - Grid dimension (width or height)
 * @returns Number of chunks needed
 */
export function getChunkCount(dimension: number): number {
  return Math.ceil(dimension / CHUNK_SIZE);
}

/**
 * Convert world coordinates to chunk coordinates
 * @param worldCoord - World coordinate (x or y)
 * @returns Chunk coordinate
 */
export function worldToChunk(worldCoord: number): number {
  return Math.floor(worldCoord / CHUNK_SIZE);
}

/**
 * Convert world coordinates to local chunk coordinates
 * @param worldCoord - World coordinate (x or y)
 * @returns Local coordinate within chunk (0-99)
 */
export function worldToLocal(worldCoord: number): number {
  return ((worldCoord % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
}

/**
 * Convert chunk and local coordinates to world coordinates
 * @param chunkCoord - Chunk coordinate
 * @param localCoord - Local coordinate within chunk
 * @returns World coordinate
 */
export function chunkToWorld(chunkCoord: number, localCoord: number): number {
  return chunkCoord * CHUNK_SIZE + localCoord;
}

/**
 * Check if coordinates are within grid bounds
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param gridWidth - Grid width in cells
 * @param gridHeight - Grid height in cells
 * @returns True if coordinates are valid
 */
export function isWithinGridBounds(x: number, y: number, gridWidth: number, gridHeight: number): boolean {
  return x >= 0 && y >= 0 && x < gridWidth && y < gridHeight;
}

/**
 * Clamp zoom value to valid range
 * @param zoom - Zoom value to clamp
 * @returns Clamped zoom value
 */
export function clampZoom(zoom: number): number {
  return Math.max(ZOOM_LIMITS.MIN, Math.min(ZOOM_LIMITS.MAX, zoom));
}

/**
 * Calculate cell render step based on zoom level
 * @param zoom - Current zoom level
 * @returns Cell render step (1, 2, 4, or 8)
 */
export function getCellRenderStep(zoom: number): number {
  if (zoom < 0.2) return CELL_RENDER_STEPS.ZOOM_0_2;
  if (zoom < 0.4) return CELL_RENDER_STEPS.ZOOM_0_4;
  if (zoom < 0.7) return CELL_RENDER_STEPS.ZOOM_0_7;
  return CELL_RENDER_STEPS.ZOOM_DEFAULT;
}

/**
 * Calculate buffer zone size based on zoom level
 * @param zoom - Current zoom level
 * @returns Buffer zone size in chunks
 */
export function getBufferZoneSize(zoom: number): number {
  // Larger buffer zone for higher zoom levels (more chunks visible)
  if (zoom >= 2.0) return Math.min(MAX_BUFFER_ZONE, 3);
  if (zoom >= 1.0) return Math.min(MAX_BUFFER_ZONE, 2);
  if (zoom >= 0.5) return Math.min(MAX_BUFFER_ZONE, 1);
  return 0; // No buffer for very low zoom levels
}

/**
 * Expand chunk bounds by buffer zone
 * @param bounds - Original chunk bounds { left, top, right, bottom }
 * @param bufferSize - Buffer zone size in chunks
 * @returns Expanded bounds
 */
export function expandChunkBounds(
  bounds: { left: number; top: number; right: number; bottom: number },
  bufferSize: number
): { left: number; top: number; right: number; bottom: number } {
  return {
    left: Math.max(0, bounds.left - bufferSize),
    top: Math.max(0, bounds.top - bufferSize),
    right: bounds.right + bufferSize,
    bottom: bounds.bottom + bufferSize,
  };
} 