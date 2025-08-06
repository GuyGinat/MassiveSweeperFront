import { create } from "zustand";
import { socket } from "../network/socket";
import { CHUNK_SIZE } from "../constants/game";
import { createChunkKey, getApiBaseUrl, API_ENDPOINTS, ERROR_MESSAGES } from "../constants/socket";

export interface Cell {
  x: number;
  y: number;
  revealed: boolean;
  hasMine: boolean;
  adjacentMines: number;
  flagged: boolean;
}

export type Chunk = Cell[][];

interface ChunkedGridState {
  loadedChunks: Record<string, Chunk>;
  requestedChunks: Set<string>; // Track chunks that are being requested
  gridSize: { width: number; height: number } | null; // Dynamic grid size from server
  chunkSize: number;
  requestChunk: (cx: number, cy: number) => void;
  setChunk: (cx: number, cy: number, chunk: Chunk) => void;
  updateCell: (cx: number, cy: number, x: number, y: number, cell: Cell) => void;
  revealCell: (cx: number, cy: number, x: number, y: number) => void;
  flagCell: (cx: number, cy: number, x: number, y: number) => void;
  chordClick: (cx: number, cy: number, x: number, y: number) => void;
  clearRequestedChunk: (cx: number, cy: number) => void; // Remove from requested set (for error handling)
  setGridSize: (width: number, height: number) => void;
  fetchGridSize: () => Promise<void>;
}

// Default chunk size (should match server)
const DEFAULT_CHUNK_SIZE = CHUNK_SIZE;

export const useChunkedGridStore = create<ChunkedGridState>((set, get) => ({
  loadedChunks: {},
  requestedChunks: new Set(),
  gridSize: null,
  chunkSize: DEFAULT_CHUNK_SIZE,

  requestChunk: (cx, cy) => {
    const state = get();
    if (!state.gridSize) {
      console.warn(ERROR_MESSAGES.GRID_SIZE_FETCH_FAILED);
      return;
    }
    
    // Calculate max chunk coordinates based on current grid size
    const maxChunkX = Math.floor(state.gridSize.width / state.chunkSize) - 1;
    const maxChunkY = Math.floor(state.gridSize.height / state.chunkSize) - 1;
    
    // Clamp chunk coordinates to grid bounds
    const clampedCx = Math.max(0, Math.min(cx, maxChunkX));
    const clampedCy = Math.max(0, Math.min(cy, maxChunkY));
    const key = createChunkKey(clampedCx, clampedCy);
    
    // Only request if not already loaded and not already being requested
    if (!state.loadedChunks[key] && !state.requestedChunks.has(key)) {
      set((state) => ({
        requestedChunks: new Set([...state.requestedChunks, key])
      }));
      socket.emit("get_chunk", { cx: clampedCx, cy: clampedCy });
    }
  },

  setChunk: (cx, cy, chunk) => {
    console.log(`[frontend] Received chunk (${cx},${cy}) with ${chunk.flat().filter(c => c.revealed).length} revealed cells`);
    const key = createChunkKey(cx, cy);
    set((state) => ({
      loadedChunks: { ...state.loadedChunks, [key]: chunk },
      requestedChunks: new Set([...state.requestedChunks].filter(k => k !== key)) // Remove from requested set
    }));
  },

  updateCell: (cx, cy, x, y, cell) => {
    set((state) => {
      const key = createChunkKey(cx, cy);
      const chunk = state.loadedChunks[key];
      if (!chunk) return {};
      const newChunk = chunk.map((row, rowIdx) =>
        rowIdx === y ? row.map((c, colIdx) => (colIdx === x ? cell : c)) : row
      );
      return {
        loadedChunks: { ...state.loadedChunks, [key]: newChunk },
      };
    });
  },

  revealCell: (cx, cy, x, y) => {
    socket.emit("reveal_cell", { cx, cy, x, y });
  },

  flagCell: (cx, cy, x, y) => {
    socket.emit("flag_cell", { cx, cy, x, y });
  },

  chordClick: (cx, cy, x, y) => {
    socket.emit("chord_click", { cx, cy, x, y });
  },

  clearRequestedChunk: (cx, cy) => {
    const key = createChunkKey(cx, cy);
    set((state) => ({
      requestedChunks: new Set([...state.requestedChunks].filter(k => k !== key))
    }));
  },

  setGridSize: (width, height) => {
    set({ gridSize: { width, height } });
  },

  fetchGridSize: async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.GRID_SIZE}`);
      const data = await response.json();
      
      set({ gridSize: { width: data.width, height: data.height } });
      console.log(`[frontend] Grid size loaded: ${data.width}x${data.height}`);
    } catch (error) {
      console.error(ERROR_MESSAGES.GRID_SIZE_FETCH_FAILED, error);
    }
  },
}));

// Socket event handlers
socket.on("chunk_data", ({ cx, cy, chunk }) => {
  useChunkedGridStore.getState().setChunk(cx, cy, chunk);
});

socket.on("cell_update", ({ cx, cy, x, y, cell }) => {
  useChunkedGridStore.getState().updateCell(cx, cy, x, y, cell);
});

// Error handling - clear requested chunks on connection errors
socket.on("connect_error", () => {
  console.warn(ERROR_MESSAGES.CONNECTION_FAILED + " - clearing requested chunks");
  const store = useChunkedGridStore.getState();
  // Clear all requested chunks on connection error
  store.requestedChunks.forEach((key) => {
    const [cx, cy] = key.split(',').map(Number);
    store.clearRequestedChunk(cx, cy);
  });
}); 