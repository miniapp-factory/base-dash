"use client";

import { useEffect, useRef, useState } from "react";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

const SHAPES = [
  // I
  [
    [1, 1, 1, 1],
  ],
  // O
  [
    [1, 1],
    [1, 1],
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  // Z
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  // J
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  // L
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
];

function rotate(shape: number[][]) {
  const n = shape.length;
  const m = shape[0].length;
  const rotated: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      rotated[j][n - 1 - i] = shape[i][j];
    }
  }
  return rotated;
}

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [current, setCurrent] = useState({
    shape: SHAPES[0],
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          ctx.fillStyle = "#00f";
          ctx.fillRect(
            c * BLOCK_SIZE,
            r * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
          ctx.strokeStyle = "#fff";
          ctx.strokeRect(
            c * BLOCK_SIZE,
            r * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
        }
      }
    }
    // draw current piece
    const { shape, x, y } = current;
    shape.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell) {
          ctx.fillStyle = "#f00";
          ctx.fillRect(
            (x + j) * BLOCK_SIZE,
            (y + i) * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
          ctx.strokeStyle = "#fff";
          ctx.strokeRect(
            (x + j) * BLOCK_SIZE,
            (y + i) * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
        }
      });
    });
  };

  const move = (dir: number) => {
    const { shape, x, y } = current;
    const newX = x + dir;
    if (!collides(shape, newX, y)) {
      setCurrent({ ...current, x: newX });
    }
  };

  const drop = () => {
    const { shape, x, y } = current;
    const newY = y + 1;
    if (!collides(shape, x, newY)) {
      setCurrent({ ...current, y: newY });
    } else {
      // lock piece
      const newGrid = grid.map(row => [...row]);
      shape.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell) {
            newGrid[y + i][x + j] = 1;
          }
        });
      });
      // clear lines
      const cleared = newGrid.filter(row => row.some(cell => cell === 0));
      const linesCleared = ROWS - cleared.length;
      const newRows = Array.from({ length: linesCleared }, () => Array(COLS).fill(0));
      setGrid([...newRows, ...cleared]);

      // Update score and high score
      const points = linesCleared * 100;
      setScore(prev => prev + points);
      setHighScore(prev => Math.max(prev, score + points));

      // Show BASE message on a Tetris (4 lines cleared)
      if (linesCleared === 4) {
        setMessage('BASE');
      } else {
        setMessage(null);
      }

      // spawn new piece
      const newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const newX = Math.floor(COLS / 2) - Math.floor(newShape[0].length / 2);
      const newYPos = 0;
      // Check if the new piece immediately collides (top overflow)
      if (collides(newShape, newX, newYPos)) {
        setGameOver(true);
      } else {
        setCurrent({
          shape: newShape,
          x: newX,
          y: newYPos,
        });
      }
    }
  };

  const rotatePiece = () => {
    const newShape = rotate(current.shape);
    if (!collides(newShape, current.x, current.y)) {
      setCurrent({ ...current, shape: newShape });
    }
  };

  const collides = (shape: number[][], x: number, y: number) => {
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j]) {
          const newX = x + j;
          const newY = y + i;
          if (
            newX < 0 ||
            newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && grid[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  useEffect(() => {
    const interval = setInterval(drop, 500);
    return () => clearInterval(interval);
  }, [current, grid]);

  useEffect(() => {
    draw();
  }, [grid, current]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowDown") drop();
      if (e.key === "ArrowUp") rotatePiece();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, grid]);

  return (
    <div className="flex flex-col items-center">
      {gameOver ? (
        <div className="text-center">
          <p className="text-2xl font-bold">Game Over</p>
          <p className="mt-2">Final Score: {score}</p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => {
              setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
              setScore(0);
              setHighScore(0);
              setMessage(null);
              setGameOver(false);
              const newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
              setCurrent({
                shape: newShape,
                x: Math.floor(COLS / 2) - Math.floor(newShape[0].length / 2),
                y: 0,
              });
            }}
          >
            Restart
          </button>
        </div>
      ) : (
        <>
          <div className="mb-2 text-center">
            <p>Score: {score}</p>
            <p>High Score: {highScore}</p>
            {message && <p className="text-xl font-bold">{message}</p>}
          </div>
          <canvas
            ref={canvasRef}
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            className="border border-gray-300"
          />
          <p className="mt-4 text-sm text-gray-500">
            Use arrow keys to move and rotate the piece.
          </p>
        </>
      )}
    </div>
  );
}
