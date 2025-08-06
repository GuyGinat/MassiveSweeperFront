/**
 * Canvas Renderer Component
 * 
 * This component handles all canvas rendering for the MassiveSweeper game.
 * It uses the useCanvasRenderer hook to manage rendering logic and performance optimizations.
 */

import React, { useRef, useEffect } from 'react';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';

interface CanvasRendererProps {
  zoom: number;
  offset: { x: number; y: number };
  canvasSize: { width: number; height: number };
  gridSize: { width: number; height: number } | null;
  hoverCell: { x: number; y: number } | null;
  backendStats: any;
  style?: React.CSSProperties;
  className?: string;
}

export function CanvasRenderer({
  zoom,
  offset,
  canvasSize,
  gridSize,
  hoverCell,
  backendStats,
  style,
  className
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { render } = useCanvasRenderer();

  // Render the canvas whenever dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match the provided canvasSize
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Render the canvas
    render({
      canvas,
      ctx,
      zoom,
      offset,
      canvasSize,
      gridSize,
      hoverCell,
      backendStats
    });
  }, [render, zoom, offset, canvasSize, gridSize, hoverCell, backendStats]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      style={style}
      className={className}
    />
  );
} 