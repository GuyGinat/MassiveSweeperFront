import React from 'react';
import { COLORS, FONTS, SPACING, Z_INDEX, CURSORS } from '../constants/ui';

interface HelpButtonProps {
  onClick: () => void;
}

const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: SPACING.BASE,
        right: SPACING.BASE,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        background: COLORS.UI.SHADOW,
        color: COLORS.UI.TEXT.WHITE,
        fontSize: '20px',
        fontWeight: 'bold',
        cursor: CURSORS.POINTER,
        zIndex: Z_INDEX.HELP,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
      }}
      title="Help & Tutorial"
    >
      ❓
    </button>
  );
};

export default HelpButton; 