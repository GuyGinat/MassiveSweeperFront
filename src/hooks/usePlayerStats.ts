import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlayerStats {
  cellsCleared: number;
  flagsPlaced: number;
  bombsExploded: number;
  correctFlags: number;
  incorrectFlags: number;
  totalPlayTime: number; // in seconds
  firstPlayDate: string;
  lastPlayDate: string;
  sessionsPlayed: number;
  currentSessionStart: number;
}

interface PlayerStatsState {
  stats: PlayerStats;
  // Actions
  incrementCellsCleared: () => void;
  incrementFlagsPlaced: (wasCorrect: boolean) => void;
  incrementBombsExploded: () => void;
  startSession: () => void;
  endSession: () => void;
  resetStats: () => void;
  getAccuracy: () => number;
  getSessionStats: () => { currentSession: number; totalSessions: number };
}

const defaultStats: PlayerStats = {
  cellsCleared: 0,
  flagsPlaced: 0,
  bombsExploded: 0,
  correctFlags: 0,
  incorrectFlags: 0,
  totalPlayTime: 0,
  firstPlayDate: new Date().toISOString(),
  lastPlayDate: new Date().toISOString(),
  sessionsPlayed: 0,
  currentSessionStart: 0,
};

export const usePlayerStats = create<PlayerStatsState>()(
  persist(
    (set, get) => ({
      stats: defaultStats,

      incrementCellsCleared: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            cellsCleared: state.stats.cellsCleared + 1,
            lastPlayDate: new Date().toISOString(),
          },
        }));
      },

      incrementFlagsPlaced: (wasCorrect: boolean) => {
        set((state) => ({
          stats: {
            ...state.stats,
            flagsPlaced: state.stats.flagsPlaced + 1,
            correctFlags: wasCorrect 
              ? state.stats.correctFlags + 1 
              : state.stats.correctFlags,
            incorrectFlags: !wasCorrect 
              ? state.stats.incorrectFlags + 1 
              : state.stats.incorrectFlags,
            lastPlayDate: new Date().toISOString(),
          },
        }));
      },

      incrementBombsExploded: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            bombsExploded: state.stats.bombsExploded + 1,
            lastPlayDate: new Date().toISOString(),
          },
        }));
      },

      startSession: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            sessionsPlayed: state.stats.sessionsPlayed + 1,
            currentSessionStart: Date.now(),
            firstPlayDate: state.stats.firstPlayDate || new Date().toISOString(),
          },
        }));
      },

      endSession: () => {
        set((state) => {
          const sessionDuration = state.stats.currentSessionStart 
            ? Math.floor((Date.now() - state.stats.currentSessionStart) / 1000)
            : 0;
          
          return {
            stats: {
              ...state.stats,
              totalPlayTime: state.stats.totalPlayTime + sessionDuration,
              currentSessionStart: 0,
            },
          };
        });
      },

      resetStats: () => {
        set({ stats: defaultStats });
      },

      getAccuracy: () => {
        const { stats } = get();
        const totalFlags = stats.correctFlags + stats.incorrectFlags;
        return totalFlags > 0 ? (stats.correctFlags / totalFlags) * 100 : 0;
      },

      getSessionStats: () => {
        const { stats } = get();
        const currentSession = stats.currentSessionStart 
          ? Math.floor((Date.now() - stats.currentSessionStart) / 1000)
          : 0;
        
        return {
          currentSession,
          totalSessions: stats.sessionsPlayed,
        };
      },
    }),
    {
      name: 'massivesweeper-player-stats',
      version: 1,
    }
  )
); 