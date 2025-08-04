import { create } from "zustand";

export interface Cell {
  x: number;
  y: number;
  revealed: boolean;
  hasMine: boolean;
  adjacentMines: number;
  flagged: boolean;
}

interface GridState {
  grid: Cell[][];
  width: number;
  height: number;
  mineCount: number;
  gameWon: boolean;
  flagsPlanted: number;
  bombsTriggered: number;
  initGrid: (width: number, height: number, mineCount?: number) => void;
  revealCell: (x: number, y: number) => void;
  toggleFlag: (x: number, y: number) => void;
}

function createEmptyGrid(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({  
      x,
      y,
      revealed: false,
      hasMine: false,
      adjacentMines: 0,
      flagged: false,
    }))
  );
}

function placeMines(grid: Cell[][], mineCount: number) {
  const width = grid[0].length;
  const height = grid.length;
  let placed = 0;
  while (placed < mineCount) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (!grid[y][x].hasMine) {
      grid[y][x].hasMine = true;
      placed++;
    }
  }
}

function countAdjacentMines(grid: Cell[][], x: number, y: number): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (
        ny >= 0 && ny < grid.length &&
        nx >= 0 && nx < grid[0].length &&
        grid[ny][nx].hasMine
      ) {
        count++;
      }
    }
  }
  return count;
}

function fillAdjacentCounts(grid: Cell[][]) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      grid[y][x].adjacentMines = countAdjacentMines(grid, x, y);
    }
  }
}

function floodReveal(grid: Cell[][], x: number, y: number, visited: Set<string>) {
  const key = `${x},${y}`;
  if (visited.has(key)) return;
  visited.add(key);
  const cell = grid[y][x];
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  if (cell.adjacentMines === 0 && !cell.hasMine) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (
          ny >= 0 && ny < grid.length &&
          nx >= 0 && nx < grid[0].length
        ) {
          floodReveal(grid, nx, ny, visited);
        }
      }
    }
  }
}

export const useGridStore = create<GridState>((set, get) => ({
  grid: [],
  width: 0,
  height: 0,
  mineCount: 0,
  gameWon: false,
  flagsPlanted: 0,
  bombsTriggered: 0,
  initGrid: (width, height, mineCount) => {
    let actualMineCount: number;
    if (mineCount === undefined) {
      actualMineCount = Math.round(width * height * 0.18);
    } else if (mineCount > 1) {
      actualMineCount = Math.floor(mineCount);
    } else {
      actualMineCount = Math.round(width * height * mineCount);
    }
    const grid = createEmptyGrid(width, height);
    placeMines(grid, actualMineCount);
    fillAdjacentCounts(grid);
    set({ grid, width, height, mineCount: actualMineCount, gameWon: false, flagsPlanted: 0, bombsTriggered: 0 });
  },
  revealCell: (x, y) => {
    const { grid } = get();
    if (!grid[y] || !grid[y][x]) return;
    const cell = grid[y][x];
    if (cell.revealed || cell.flagged) return;
    let bombsTriggered = get().bombsTriggered;
    if (cell.hasMine) {
      cell.revealed = true;
      bombsTriggered++;
      set({ grid: [...grid], bombsTriggered });
      return;
    }
    floodReveal(grid, x, y, new Set());
    // Check win
    const allSafeRevealed = grid.flat().every(c => c.hasMine || c.revealed);
    set({ grid: [...grid], gameWon: allSafeRevealed });
  },
  toggleFlag: (x, y) => {
    const { grid, flagsPlanted } = get();
    if (!grid[y] || !grid[y][x]) return;
    const cell = grid[y][x];
    if (cell.revealed) return;
    let newFlagsPlanted = flagsPlanted;
    if (!cell.flagged) {
      cell.flagged = true;
      newFlagsPlanted++;
    } else {
      cell.flagged = false;
      newFlagsPlanted--;
    }
    set({ grid: [...grid], flagsPlanted: newFlagsPlanted });
  },
}));
