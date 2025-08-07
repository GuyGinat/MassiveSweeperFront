/**
 * UI Constants
 * 
 * This file contains all UI-related constants used throughout the MassiveSweeper application.
 * This includes colors, spacing, fonts, z-index values, and animation durations.
 */

// ============================================================================
// COLORS
// ============================================================================

/** Color palette for the entire application */
export const COLORS = {
  // Background colors
  BACKGROUND: {
    PRIMARY: '#e0e0e0',      // Light gray background
    SECONDARY: '#f0f0f0',    // Lighter gray for UI panels
    OVERLAY: 'rgba(240,240,240,0.85)', // Semi-transparent UI background
    MODAL: 'rgba(0, 0, 0, 0.7)', // Modal overlay background
  },

  // Cell colors
  CELL: {
    UNREVEALED: '#222',      // Dark gray for unrevealed cells
    PRESSED: '#444',         // Brighter gray for pressed unrevealed cells
    REVEALED: '#ccc',        // Light gray for revealed safe cells
    MINE: '#f88',           // Light red for revealed mines
    BORDER: 'black',        // Black border for cells
  },

  // Number colors (Minesweeper standard)
  NUMBERS: {
    1: '#0000FF', // Blue
    2: '#008200', // Green
    3: '#FF0000', // Red
    4: '#000080', // Navy
    5: '#800000', // Maroon
    6: '#008080', // Teal
    7: '#000000', // Black
    8: '#808080', // Gray
  },

  // UI element colors
  UI: {
    TEXT: {
      PRIMARY: '#222',       // Dark gray for primary text
      SECONDARY: '#555',     // Medium gray for secondary text
      LIGHT: '#666',         // Light gray for tertiary text
      WHITE: 'white',        // White text
    },
    BORDER: '#ccc',          // Light gray for borders
    SHADOW: 'rgba(0,0,0,0.15)', // Subtle shadow
    SUCCESS: '#4CAF50',      // Green for success states
    WARNING: '#ff6b6b',      // Red for warnings/debug
    ERROR: '#f44336',        // Red for errors
    INFO: '#007bff',         // Blue for info/links
  },

  // Ruler and grid colors
  GRID: {
    RULER_LINE: 'rgba(0, 100, 255, 0.6)', // Blue with transparency
    RULER_LABEL: 'rgba(0, 100, 255, 0.9)', // Blue for labels
    GRID_LINE: 'black',      // Black for grid lines
  },

  // Flag and mine colors
  GAME: {
    FLAG: 'red',             // Red for flags
    MINE: 'black',           // Black for mines
    HOVER: 'rgba(255, 255, 255, 0.1)', // Subtle hover effect
  },

  // Brand colors
  BRAND: {
    PRIMARY: '#007bff',      // Primary brand color
    SECONDARY: '#0056b3',    // Darker brand color
    ACCENT: '#667eea',       // Accent color
  },
} as const;

// ============================================================================
// Z-INDEX VALUES
// ============================================================================

/** Z-index hierarchy for proper layering */
export const Z_INDEX = {
  BASE: 0,                   // Base layer
  CANVAS: 1,                 // Canvas layer
  UI: 10,                    // Basic UI elements
  OVERLAY: 20,               // UI overlays (rules panel)
  HELP: 15,                  // Help button (above UI, below overlays)
  MODAL: 100,                // Modal dialogs
  COMPLETION: 100,           // Completion screen
  DEBUG: 10,                 // Debug elements
} as const;

// ============================================================================
// FONTS & TYPOGRAPHY
// ============================================================================

/** Font configurations */
export const FONTS = {
  FAMILY: {
    PRIMARY: 'sans-serif',
    MONOSPACE: 'monospace',
    BOLD: 'bold sans-serif',
  },
  SIZE: {
    TINY: '7px',
    SMALL: '12px',
    BASE: '14px',
    MEDIUM: '16px',
    LARGE: '24px',
    XLARGE: '28px',
    HUGE: '48px',
  },
  WEIGHT: {
    NORMAL: 'normal',
    BOLD: 'bold',
  },
} as const;

// ============================================================================
// SPACING & DIMENSIONS
// ============================================================================

/** Spacing values for consistent layout */
export const SPACING = {
  TINY: 2,
  SMALL: 5,
  BASE: 10,
  MEDIUM: 15,
  LARGE: 20,
  XLARGE: 30,
  HUGE: 40,
} as const;

/** UI element dimensions */
export const DIMENSIONS = {
  // Button sizes
  BUTTON: {
    SMALL: {
      PADDING: '8px 12px',
      FONT_SIZE: '14px',
      BORDER_RADIUS: '4px',
    },
    MEDIUM: {
      PADDING: '12px 24px',
      FONT_SIZE: '16px',
      BORDER_RADIUS: '6px',
    },
    LARGE: {
      PADDING: '16px 32px',
      FONT_SIZE: '18px',
      BORDER_RADIUS: '8px',
    },
  },

  // Panel dimensions
  PANEL: {
    BORDER_RADIUS: '8px',
    PADDING: '20px',
    MARGIN: '10px',
    SHADOW: '0 2px 8px rgba(0,0,0,0.15)',
  },

  // Modal dimensions
  MODAL: {
    BORDER_RADIUS: '12px',
    PADDING: '40px',
    MAX_WIDTH: '500px',
    SHADOW: '0 4px 20px rgba(0,0,0,0.3)',
  },

  // UI overlay dimensions
  OVERLAY: {
    WIDTH: 260,
    HEIGHT: 220,
    PADDING: 5,
  },
} as const;

// ============================================================================
// ANIMATIONS & TRANSITIONS
// ============================================================================

/** Animation durations in milliseconds */
export const ANIMATION = {
  DURATION: {
    FAST: 150,      // Quick feedback
    NORMAL: 300,    // Standard transitions
    SLOW: 500,      // Longer animations
    VERY_SLOW: 1000, // Extended animations
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    LINEAR: 'linear',
  },
} as const;

// ============================================================================
// CURSOR STYLES
// ============================================================================

/** Cursor styles for different interactions */
export const CURSORS = {
  DEFAULT: 'default',
  POINTER: 'pointer',
  GRAB: 'grab',
  GRABBING: 'grabbing',
  NOT_ALLOWED: 'not-allowed',
  TEXT: 'text',
} as const;

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

/** Breakpoints for responsive design */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
  LARGE_DESKTOP: 1440,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get number color by adjacent mine count
 * @param count - Number of adjacent mines
 * @returns Color string for the number
 */
export function getNumberColor(count: number): string {
  return COLORS.NUMBERS[count as keyof typeof COLORS.NUMBERS] || COLORS.NUMBERS[1];
}

/**
 * Get responsive font size based on zoom level
 * @param baseSize - Base font size
 * @param zoom - Current zoom level
 * @returns Adjusted font size
 */
export function getResponsiveFontSize(baseSize: number, zoom: number): number {
  return Math.max(12, Math.min(24, baseSize / zoom));
}

/**
 * Get responsive spacing based on zoom level
 * @param baseSpacing - Base spacing value
 * @param zoom - Current zoom level
 * @returns Adjusted spacing
 */
export function getResponsiveSpacing(baseSpacing: number, zoom: number): number {
  return Math.max(baseSpacing * 0.5, Math.min(baseSpacing * 2, baseSpacing / zoom));
}

/**
 * Create a gradient background
 * @param colors - Array of colors for gradient
 * @param direction - Gradient direction (default: '135deg')
 * @returns CSS gradient string
 */
export function createGradient(colors: string[], direction: string = '135deg'): string {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
}

/**
 * Create a shadow with given parameters
 * @param x - Horizontal offset
 * @param y - Vertical offset
 * @param blur - Blur radius
 * @param color - Shadow color
 * @returns CSS shadow string
 */
export function createShadow(x: number, y: number, blur: number, color: string): string {
  return `${x}px ${y}px ${blur}px ${color}`;
} 