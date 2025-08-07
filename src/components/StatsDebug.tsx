import React, { useEffect, useState } from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { COLORS, SPACING, Z_INDEX } from '../constants/ui';

const StatsDebug: React.FC = () => {
  const stats = usePlayerStats((state) => state.stats);
  const [localStorageData, setLocalStorageData] = useState<string>('');

  useEffect(() => {
    // Check localStorage directly
    const stored = localStorage.getItem('massivesweeper-player-stats');
    setLocalStorageData(stored || 'No data found');
  }, [stats]);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: SPACING.BASE,
      right: SPACING.BASE,
      zIndex: Z_INDEX.DEBUG,
      background: COLORS.BACKGROUND.OVERLAY,
      border: `1px solid ${COLORS.UI.BORDER}`,
      borderRadius: 4,
      padding: '8px 12px',
      fontSize: 12,
      color: COLORS.UI.TEXT.PRIMARY,
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: `1px solid ${COLORS.UI.BORDER}`, paddingBottom: '4px' }}>
        📊 Stats Debug
      </div>
      <div>🧹 Cells: {stats.cellsCleared}</div>
      <div>🚩 Flags: {stats.flagsPlaced}</div>
      <div>💥 Bombs: {stats.bombsExploded}</div>
      <div>✅ Correct: {stats.correctFlags}</div>
      <div>❌ Incorrect: {stats.incorrectFlags}</div>
      <div>⏱️ Play Time: {stats.totalPlayTime}s</div>
      <div>🎮 Sessions: {stats.sessionsPlayed}</div>
      <div>📅 First Play: {new Date(stats.firstPlayDate).toLocaleDateString()}</div>
      <div>📅 Last Play: {new Date(stats.lastPlayDate).toLocaleDateString()}</div>
      <div style={{ marginTop: '8px', fontSize: 10, wordBreak: 'break-all' }}>
        <strong>localStorage:</strong> {localStorageData.substring(0, 100)}...
      </div>
    </div>
  );
};

export default StatsDebug; 