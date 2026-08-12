import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { buildPhilippinesMatrix, PH_MATRIX_COLS, PH_MATRIX_ROWS } from './authPhilippinesMatrixMask';

/** Light mode — Optimus navy */
const LIGHT_MAIN = '11,61,92';
const LIGHT_ACCENT = '7,42,64';

/** Dark mode — inverted light dots on dark panel */
const DARK_MAIN = '220,232,240';
const DARK_ACCENT = '255,255,255';

/** Blink cycle ~14s; wave travels bottom→top over ~20s */
const BLINK_SPEED = 0.45;
const WAVE_STEP = 0.04;

type Props = {
  maxOpacity?: number;
};

export function AuthPhilippinesMatrixCanvas({ maxOpacity }: Props) {
  const mode = useTheme().palette.mode;
  const isDark = mode === 'dark';
  const dotColor = isDark ? DARK_MAIN : LIGHT_MAIN;
  const accentColor = isDark ? DARK_ACCENT : LIGHT_ACCENT;
  const peakOpacity = maxOpacity ?? (isDark ? 0.28 : 0.22);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef(buildPhilippinesMatrix(PH_MATRIX_COLS, PH_MATRIX_ROWS));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const matrix = matrixRef.current;
    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const staticOpacity = peakOpacity * 0.65;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = time * 0.001;

      const pad = Math.min(width, height) * 0.04;
      const availW = width - pad * 2;
      const availH = height - pad * 2;
      const pitch = Math.min(availW / PH_MATRIX_COLS, availH / PH_MATRIX_ROWS);
      const cellSize = pitch * 0.76;
      const mapWidth = PH_MATRIX_COLS * pitch - (pitch - cellSize);
      const mapHeight = PH_MATRIX_ROWS * pitch - (pitch - cellSize);
      const originX = (width - mapWidth) / 2;
      const originY = (height - mapHeight) / 2;

      ctx.clearRect(0, 0, width, height);

      for (let row = 0; row < PH_MATRIX_ROWS; row += 1) {
        for (let col = 0; col < PH_MATRIX_COLS; col += 1) {
          const cell = matrix[row][col];
          if (!cell.land) continue;

          const x = originX + col * pitch;
          const y = originY + row * pitch;
          const rowFromBottom = PH_MATRIX_ROWS - 1 - row;
          const seed = ((col * 17 + row * 31) % 97) * 0.07;

          if (reducedMotion) {
            ctx.fillStyle = `rgba(${dotColor},${staticOpacity})`;
            ctx.fillRect(x, y, cellSize, cellSize);
            continue;
          }

          const phase = t * BLINK_SPEED - rowFromBottom * WAVE_STEP + col * 0.08 + seed;
          const wave = Math.sin(phase);
          if (wave <= 0) continue;

          const color = rowFromBottom > PH_MATRIX_ROWS * 0.55 ? accentColor : dotColor;
          const alpha = staticOpacity + (peakOpacity - staticOpacity) * wave;
          ctx.fillStyle = `rgba(${color},${alpha})`;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }

      frameId = window.requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [accentColor, dotColor, peakOpacity]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        component="canvas"
        ref={canvasRef}
        aria-hidden
        sx={{ display: 'block', width: '100%', height: '100%' }}
      />
    </Box>
  );
}
