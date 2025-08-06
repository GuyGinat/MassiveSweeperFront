/**
 * Socket Constants
 * 
 * This file contains all socket-related constants used throughout the MassiveSweeper application.
 * This includes event names, API endpoints, error messages, and connection configurations.
 */

// ============================================================================
// SOCKET EVENTS
// ============================================================================

/** Client to Server Events */
export const CLIENT_EVENTS = {
  // Connection events
  USER_CONNECT: 'user_connect',
  
  // Game events
  GET_CHUNK: 'get_chunk',
  REVEAL_CELL: 'reveal_cell',
  FLAG_CELL: 'flag_cell',
  CHORD_CLICK: 'chord_click',
  
  // Future events (for upcoming features)
  CHAT_MESSAGE: 'chat_message',
  PLAYER_MOVE: 'player_move',
  PLAYER_TYPING: 'player_typing',
  CURSOR_UPDATE: 'cursor_update',
} as const;

/** Server to Client Events */
export const SERVER_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Game events
  CHUNK_DATA: 'chunk_data',
  CELL_UPDATE: 'cell_update',
  
  // Future events (for upcoming features)
  CHAT_MESSAGE: 'chat_message',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PLAYER_MOVE: 'player_move',
  PLAYER_TYPING: 'player_typing',
  CURSOR_UPDATE: 'cursor_update',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

/** HTTP API endpoints */
export const API_ENDPOINTS = {
  // Health and status
  HEALTH: '/health',
  GRID_SIZE: '/grid-size',
  
  // Statistics
  CHUNK_COUNT: '/chunk-count',
  REVEALED_STATS: '/revealed-stats',
  FLAGGED_STATS: '/flagged-stats',
  ACTIVE_USERS: '/active-users',
  
  // Debug endpoints (development only)
  RESET_CHUNKS: '/reset-chunks',
  REVEAL_ALL: '/reveal-all',
  TEST: '/test',
} as const;

// ============================================================================
// CONNECTION CONFIGURATION
// ============================================================================

/** Socket connection configuration */
export const SOCKET_CONFIG = {
  // Connection settings
  CONNECTION_TIMEOUT: 5000,
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
  
  // Event throttling
  CURSOR_UPDATE_THROTTLE: 50, // milliseconds
  TYPING_INDICATOR_DURATION: 3000, // milliseconds
  
  // Error handling
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/** Error messages for socket events */
export const ERROR_MESSAGES = {
  // Connection errors
  CONNECTION_FAILED: 'Failed to connect to server',
  CONNECTION_LOST: 'Connection to server lost',
  RECONNECTION_FAILED: 'Failed to reconnect to server',
  
  // Game errors
  CHUNK_REQUEST_FAILED: 'Failed to request chunk data',
  CELL_UPDATE_FAILED: 'Failed to update cell',
  INVALID_COORDINATES: 'Invalid cell coordinates',
  
  // API errors
  API_REQUEST_FAILED: 'Failed to fetch data from server',
  GRID_SIZE_FETCH_FAILED: 'Failed to fetch grid size',
  STATS_FETCH_FAILED: 'Failed to fetch game statistics',
  
  // Validation errors
  INVALID_CHUNK_COORDS: 'Invalid chunk coordinates',
  OUT_OF_BOUNDS: 'Coordinates out of grid bounds',
  CHUNK_NOT_LOADED: 'Chunk not loaded',
  
  // Future error messages
  CHAT_MESSAGE_FAILED: 'Failed to send chat message',
  PLAYER_UPDATE_FAILED: 'Failed to update player status',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

/** Success messages for socket events */
export const SUCCESS_MESSAGES = {
  CONNECTION_ESTABLISHED: 'Connected to server successfully',
  CHUNK_LOADED: 'Chunk loaded successfully',
  CELL_UPDATED: 'Cell updated successfully',
  STATS_UPDATED: 'Statistics updated successfully',
} as const;

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

/** Environment-specific configuration */
export const ENVIRONMENT = {
  DEVELOPMENT: {
    SOCKET_URL: 'http://localhost:3001',
    API_BASE_URL: 'http://localhost:3001',
  },
  PRODUCTION: {
    SOCKET_URL: 'https://massivesweeperback.onrender.com',
    API_BASE_URL: 'https://massivesweeperback.onrender.com',
  },
} as const;

// ============================================================================
// EVENT PAYLOAD TYPES
// ============================================================================

/** Type definitions for event payloads */
export interface ChunkRequestPayload {
  cx: number;
  cy: number;
}

export interface CellActionPayload {
  cx: number;
  cy: number;
  x: number;
  y: number;
}

export interface UserConnectPayload {
  token: string;
  firstTime: boolean;
}

export interface ChunkDataPayload {
  cx: number;
  cy: number;
  chunk: any[][]; // Cell[][] type
}

export interface CellUpdatePayload {
  cx: number;
  cy: number;
  x: number;
  y: number;
  cell: any; // Cell type
}

// Future payload types for upcoming features
export interface ChatMessagePayload {
  message: string;
  timestamp: number;
  userId: string;
  username: string;
}

export interface PlayerMovePayload {
  x: number;
  y: number;
  userId: string;
  username: string;
}

export interface CursorUpdatePayload {
  x: number;
  y: number;
  userId: string;
  username: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the appropriate socket URL based on environment
 * @returns Socket URL for current environment
 */
export function getSocketUrl(): string {
  return import.meta.env.DEV 
    ? ENVIRONMENT.DEVELOPMENT.SOCKET_URL 
    : ENVIRONMENT.PRODUCTION.SOCKET_URL;
}

/**
 * Get the appropriate API base URL based on environment
 * @returns API base URL for current environment
 */
export function getApiBaseUrl(): string {
  return import.meta.env.DEV 
    ? ENVIRONMENT.DEVELOPMENT.API_BASE_URL 
    : ENVIRONMENT.PRODUCTION.API_BASE_URL;
}

/**
 * Create a full API endpoint URL
 * @param endpoint - API endpoint path
 * @returns Full API URL
 */
export function createApiUrl(endpoint: string): string {
  return `${getApiBaseUrl()}${endpoint}`;
}

/**
 * Validate chunk coordinates
 * @param cx - Chunk X coordinate
 * @param cy - Chunk Y coordinate
 * @returns True if coordinates are valid
 */
export function isValidChunkCoords(cx: number, cy: number): boolean {
  return Number.isInteger(cx) && Number.isInteger(cy) && cx >= 0 && cy >= 0;
}

/**
 * Validate cell coordinates within a chunk
 * @param x - Local X coordinate
 * @param y - Local Y coordinate
 * @returns True if coordinates are valid
 */
export function isValidCellCoords(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && 
         x >= 0 && y >= 0 && x < 100 && y < 100;
}

/**
 * Create a chunk key for storage
 * @param cx - Chunk X coordinate
 * @param cy - Chunk Y coordinate
 * @returns Chunk key string
 */
export function createChunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

/**
 * Parse chunk key to coordinates
 * @param key - Chunk key string
 * @returns Object with cx and cy coordinates
 */
export function parseChunkKey(key: string): { cx: number; cy: number } {
  const [cx, cy] = key.split(',').map(Number);
  return { cx, cy };
}

/**
 * Throttle function for frequent events
 * @param func - Function to throttle
 * @param delay - Throttle delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
} 