import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/Tetris.css';

// Sound synthesizer using Web Audio API
const playSound = (type, muted = false) => {
  if (muted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'rotate') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'lock') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'clear') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.warn("Audio Context init failed:", e);
  }
};

const SHAPES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0f0',
    name: 'I'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000',
    name: 'O'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a000f0',
    name: 'T'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00f000',
    name: 'S'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#f00000',
    name: 'Z'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000f0',
    name: 'J'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f0a000',
    name: 'L'
  }
};

const SHAPE_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const createGrid = () => Array.from({ length: 20 }, () => Array(10).fill({ value: 0, color: '' }));

const Tetris = () => {
  // Game states: 'LOBBY' | 'GAMEPLAY' | 'PAUSE' | 'GAMEOVER'
  const [gameState, setGameState] = useState('LOBBY');
  const gameStateRef = useRef('LOBBY');
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Audio Control
  const [muted, setMuted] = useState(() => localStorage.getItem('arcade_muted') === 'true');
  const mutedRef = useRef(false);
  useEffect(() => {
    mutedRef.current = muted;
    localStorage.setItem('arcade_muted', muted.toString());
  }, [muted]);

  // Core metrics
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const [lines, setLines] = useState(0);
  const linesRef = useRef(0);
  useEffect(() => { linesRef.current = lines; }, [lines]);

  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  useEffect(() => { levelRef.current = level; }, [level]);

  const [startLevel, setStartLevel] = useState(1);

  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('tetris_high_score') || '0', 10);
  });

  // Grid and Pieces
  const [grid, setGrid] = useState(createGrid);
  const gridRef = useRef(createGrid());
  useEffect(() => { gridRef.current = grid; }, [grid]);

  const [currentPiece, setCurrentPiece] = useState(null);
  const currentPieceRef = useRef(null);
  useEffect(() => { currentPieceRef.current = currentPiece; }, [currentPiece]);

  const [nextPiece, setNextPiece] = useState(null);
  const nextPieceRef = useRef(null);
  useEffect(() => { nextPieceRef.current = nextPiece; }, [nextPiece]);

  // Menu choices indices
  const [menuIndex, setMenuIndex] = useState(0);
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);

  // API sync states
  const [gameId, setGameId] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [rewards, setRewards] = useState(null);

  // Canvas Refs & gravity tickers
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const fallTimerAccumulatorRef = useRef(0);

  // Constants
  const CANVAS_SIZE = 600;

  // Retrieve game info
  useEffect(() => {
    axios.get('/api/v1/games')
      .then(res => {
        const game = res.data.games?.find(g => g.title === "Cyber Block Stacker");
        if (game) setGameId(game._id);
      })
      .catch(err => console.error("Failed to load game info:", err));
  }, []);

  // Submit high score
  const submitTetrisScore = async (finalScore) => {
    const token = 'cookie-token';
    if (gameId && token && finalScore > 0) {
      setSubmitStatus('submitting');
      try {
        const res = await axios.post(`/api/v1/games/${gameId}/score`, {
          score: finalScore,
          level: levelRef.current
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRewards({
          coinsEarned: res.data.coinsEarned,
          expGained: res.data.expGained,
          level: res.data.level,
          leveledUp: res.data.leveledUp
        });
        setSubmitStatus('submitted');

        // Sync local storage user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            userObj.coins = res.data.totalCoins;
            if (!userObj.gameStats) userObj.gameStats = {};
            userObj.gameStats.level = res.data.level;
            localStorage.setItem('user', JSON.stringify(userObj));
            window.dispatchEvent(new Event('user-stats-changed'));
          } catch (e) {
            console.error('Failed to sync user stats:', e);
          }
        }
      } catch (err) {
        console.error(err);
        setSubmitStatus('failed');
      }
    } else {
      setSubmitStatus('offline');
    }
  };

  // Helper generators
  const getRandomPiece = useCallback(() => {
    const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    const blueprint = SHAPES[key];
    return {
      shape: blueprint.shape,
      color: blueprint.color,
      name: blueprint.name,
      x: 3,
      y: 0
    };
  }, []);

  // Check collision helper
  const checkCollision = useCallback((shape, xOffset, yOffset, currentGrid) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const targetX = xOffset + c;
          const targetY = yOffset + r;

          // Out of boundaries
          if (targetX < 0 || targetX >= 10 || targetY >= 20) {
            return true;
          }

          // Grid cell already occupied
          if (targetY >= 0 && currentGrid[targetY][targetX].value !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Soft drop tick
  const moveDown = useCallback(() => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const piece = currentPieceRef.current;
    const currentGrid = gridRef.current;
    if (!piece) return;

    if (!checkCollision(piece.shape, piece.x, piece.y + 1, currentGrid)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      // Lock piece in place
      lockPiece();
    }
  }, [checkCollision]);

  // Lock brick matrix
  const lockPiece = () => {
    const piece = currentPieceRef.current;
    const currentGrid = gridRef.current;
    if (!piece) return;

    playSound('lock', mutedRef.current);
    const updatedGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const targetY = piece.y + r;
          const targetX = piece.x + c;
          if (targetY >= 0) {
            updatedGrid[targetY][targetX] = { value: 1, color: piece.color };
          }
        }
      }
    }

    // Check completed lines
    let linesCleared = 0;
    const filteredGrid = updatedGrid.filter(row => {
      const isFull = row.every(cell => cell.value !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredGrid.length < 20) {
      filteredGrid.unshift(Array(10).fill({ value: 0, color: '' }));
    }

    if (linesCleared > 0) {
      playSound('clear', mutedRef.current);
      const points = [0, 100, 300, 500, 800];
      const earned = points[linesCleared] * levelRef.current;
      setScore(prev => {
        const nextScore = prev + earned;
        if (nextScore > highScore) {
          localStorage.setItem('tetris_high_score', nextScore.toString());
          setHighScore(nextScore);
        }
        return nextScore;
      });

      setLines(prev => {
        const nextLines = prev + linesCleared;
        const nextLevel = Math.min(5, Math.floor(nextLines / 10) + 1);
        if (nextLevel !== levelRef.current) {
          setLevel(nextLevel);
        }
        return nextLines;
      });
    }

    // Spawn next piece
    const nextSpawn = nextPieceRef.current || getRandomPiece();
    const futureNext = getRandomPiece();

    if (checkCollision(nextSpawn.shape, nextSpawn.x, nextSpawn.y, filteredGrid)) {
      // Game Over
      setGameState('GAMEOVER');
      setMenuIndex(0);
      playSound('gameover', mutedRef.current);
      submitTetrisScore(scoreRef.current);
    } else {
      setCurrentPiece(nextSpawn);
      setNextPiece(futureNext);
    }

    setGrid(filteredGrid);
  };

  // Hard drop
  const hardDrop = () => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const piece = currentPieceRef.current;
    const currentGrid = gridRef.current;
    if (!piece) return;

    let currentY = piece.y;
    while (!checkCollision(piece.shape, piece.x, currentY + 1, currentGrid)) {
      currentY++;
    }

    playSound('lock', mutedRef.current);
    const updatedGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const targetY = currentY + r;
          const targetX = piece.x + c;
          if (targetY >= 0) {
            updatedGrid[targetY][targetX] = { value: 1, color: piece.color };
          }
        }
      }
    }

    let linesCleared = 0;
    const filteredGrid = updatedGrid.filter(row => {
      const isFull = row.every(cell => cell.value !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (filteredGrid.length < 20) {
      filteredGrid.unshift(Array(10).fill({ value: 0, color: '' }));
    }

    if (linesCleared > 0) {
      playSound('clear', mutedRef.current);
      const points = [0, 100, 300, 500, 800];
      const earned = points[linesCleared] * levelRef.current;
      setScore(prev => {
        const nextScore = prev + earned;
        if (nextScore > highScore) {
          localStorage.setItem('tetris_high_score', nextScore.toString());
          setHighScore(nextScore);
        }
        return nextScore;
      });

      setLines(prev => {
        const nextLines = prev + linesCleared;
        const nextLevel = Math.min(5, Math.floor(nextLines / 10) + 1);
        if (nextLevel !== levelRef.current) {
          setLevel(nextLevel);
        }
        return nextLines;
      });
    }

    const nextSpawn = nextPieceRef.current || getRandomPiece();
    const futureNext = getRandomPiece();

    if (checkCollision(nextSpawn.shape, nextSpawn.x, nextSpawn.y, filteredGrid)) {
      setGameState('GAMEOVER');
      setMenuIndex(0);
      playSound('gameover', mutedRef.current);
      submitTetrisScore(scoreRef.current);
    } else {
      setCurrentPiece(nextSpawn);
      setNextPiece(futureNext);
    }

    setGrid(filteredGrid);
  };

  // Horizontal shift
  const moveHorizontal = (dir) => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const piece = currentPieceRef.current;
    const currentGrid = gridRef.current;
    if (!piece) return;

    if (!checkCollision(piece.shape, piece.x + dir, piece.y, currentGrid)) {
      playSound('move', mutedRef.current);
      setCurrentPiece(prev => ({ ...prev, x: prev.x + dir }));
    }
  };

  // Rotate
  const rotatePiece = () => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const piece = currentPieceRef.current;
    const currentGrid = gridRef.current;
    if (!piece) return;

    const nShape = piece.shape[0].map((_, idx) => 
      piece.shape.map(row => row[idx]).reverse()
    );

    let kickX = 0;
    if (checkCollision(nShape, piece.x, piece.y, currentGrid)) {
      if (!checkCollision(nShape, piece.x - 1, piece.y, currentGrid)) kickX = -1;
      else if (!checkCollision(nShape, piece.x + 1, piece.y, currentGrid)) kickX = 1;
      else if (!checkCollision(nShape, piece.x - 2, piece.y, currentGrid)) kickX = -2;
      else if (!checkCollision(nShape, piece.x + 2, piece.y, currentGrid)) kickX = 2;
      else return;
    }

    playSound('rotate', mutedRef.current);
    setCurrentPiece(prev => ({
      ...prev,
      shape: nShape,
      x: prev.x + kickX
    }));
  };

  // Launch fresh game
  const startGame = () => {
    setGrid(createGrid());
    setScore(0);
    setLines(0);
    setLevel(startLevel);
    setRewards(null);
    setSubmitStatus('');
    setMenuIndex(0);

    const first = getRandomPiece();
    const second = getRandomPiece();
    setCurrentPiece(first);
    setNextPiece(second);

    setGameState('GAMEPLAY');
  };

  // Keyboard navigation controls
  const handleKeyboardNav = (code) => {
    const curState = gameStateRef.current;
    if (curState === 'LOBBY') {
      if (code === 'ArrowLeft' || code === 'KeyA') {
        playSound('click', mutedRef.current);
        setStartLevel(prev => (prev === 1 ? 5 : prev - 1));
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        playSound('click', mutedRef.current);
        setStartLevel(prev => (prev === 5 ? 1 : prev + 1));
      } else if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => {
          const next = prev === 0 ? 1 : 0;
          menuIndexRef.current = next;
          return next;
        });
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 0) startGame();
        else window.location.href = '/UODGaming';
      }
    } else if (curState === 'PAUSE') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => (prev === 0 ? 2 : prev - 1));
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => {
          const next = prev === 2 ? 0 : prev + 1;
          menuIndexRef.current = next;
          return next;
        });
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 0) {
          lastFrameTimeRef.current = performance.now();
          setGameState('GAMEPLAY');
        } else if (menuIndexRef.current === 1) {
          startGame();
        } else {
          setGameState('LOBBY');
          setStartLevel(1);
          setMenuIndex(0);
          menuIndexRef.current = 0;
        }
      } else if (code === 'Escape') {
        playSound('click', mutedRef.current);
        lastFrameTimeRef.current = performance.now();
        setGameState('GAMEPLAY');
      }
    } else if (curState === 'GAMEOVER') {
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => {
          const next = prev === 0 ? 1 : 0;
          menuIndexRef.current = next;
          return next;
        });
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 0) {
          startGame();
        } else {
          setGameState('LOBBY');
          setStartLevel(1);
          setMenuIndex(0);
          menuIndexRef.current = 0;
        }
      }
    } else if (curState === 'GAMEPLAY') {
      if (code === 'Escape') {
        playSound('click', mutedRef.current);
        setGameState('PAUSE');
        setMenuIndex(0);
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        moveHorizontal(-1);
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        moveHorizontal(1);
      } else if (code === 'ArrowUp' || code === 'KeyW') {
        rotatePiece();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        moveDown();
      } else if (code === 'Space') {
        hardDrop();
      }
    }
  };

  // Keyboard listener hooks
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeStates = ['LOBBY', 'PAUSE', 'GAMEOVER', 'GAMEPLAY'];
      if (activeStates.includes(gameStateRef.current)) {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
        handleKeyboardNav(e.code);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas Clicks
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Speaker check
    if (clickX >= 540 && clickX <= 590 && clickY >= 10 && clickY <= 50) {
      playSound('click', !muted);
      setMuted(prev => !prev);
      return;
    }

    const curState = gameState;
    if (curState === 'LOBBY') {
      // Level selections clicks (1-5)
      for (let i = 1; i <= 5; i++) {
        const lx = 200 + (i - 1) * 45;
        if (clickX >= lx && clickX <= lx + 35 && clickY >= 300 && clickY <= 335) {
          playSound('click', muted);
          setStartLevel(i);
          break;
        }
      }
      // Start button click
      if (clickX >= 150 && clickX <= 450 && clickY >= 380 && clickY <= 425) {
        playSound('click', muted);
        startGame();
      }
      // Exit button click
      if (clickX >= 150 && clickX <= 450 && clickY >= 440 && clickY <= 485) {
        playSound('click', muted);
        window.location.href = '/UODGaming';
      }
    } else if (curState === 'PAUSE') {
      if (clickX >= 200 && clickX <= 400 && clickY >= 240 && clickY <= 280) {
        playSound('click', muted);
        lastFrameTimeRef.current = performance.now();
        setGameState('GAMEPLAY');
      } else if (clickX >= 200 && clickX <= 400 && clickY >= 300 && clickY <= 340) {
        playSound('click', muted);
        startGame();
      } else if (clickX >= 200 && clickX <= 400 && clickY >= 360 && clickY <= 400) {
        playSound('click', muted);
        setGameState('LOBBY');
        setStartLevel(1);
      }
    } else if (curState === 'GAMEOVER') {
      if (clickX >= 150 && clickX <= 450 && clickY >= 440 && clickY <= 480) {
        playSound('click', muted);
        startGame();
      } else if (clickX >= 150 && clickX <= 450 && clickY >= 495 && clickY <= 535) {
        playSound('click', muted);
        setGameState('LOBBY');
        setStartLevel(1);
      }
    }
  };

  // Main Canvas Rendering loop hook
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
      const dt = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      // Handle Gravity Ticker Accumulators
      if (gameStateRef.current === 'GAMEPLAY') {
        fallTimerAccumulatorRef.current += dt;
        const speeds = [800, 600, 420, 260, 110];
        const speed = speeds[Math.min(levelRef.current - 1, 4)];

        if (fallTimerAccumulatorRef.current >= speed) {
          moveDown();
          fallTimerAccumulatorRef.current = 0;
        }
      }

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.shadowBlur = 0;

      // Background gridlines
      ctx.strokeStyle = '#050a12';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 100, 0);
        ctx.lineTo(i * 100, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * 100);
        ctx.lineTo(CANVAS_SIZE, i * 100);
        ctx.stroke();
      }

      const curState = gameStateRef.current;

      // ----------------------------------------------------
      // STATE: LOBBY
      // ----------------------------------------------------
      if (curState === 'LOBBY') {
        ctx.shadowColor = '#00f0f0';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00f0f0';
        ctx.font = 'bold 36px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CYBER BLOCK STACKER', CANVAS_SIZE / 2, 130);

        ctx.shadowColor = '#a000f0';
        ctx.fillStyle = '#b4b4c8';
        ctx.font = '14px "Exo 2", sans-serif';
        ctx.fillText('GRID RECONSTRUCTION TERMINAL', CANVAS_SIZE / 2, 170);

        // Select Start Level Options
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8888a0';
        ctx.font = 'bold 12px "Orbitron", monospace';
        ctx.fillText('SELECT RUNNING SPEED (LEVEL)', CANVAS_SIZE / 2, 265);

        for (let i = 1; i <= 5; i++) {
          const lx = 200 + (i - 1) * 45;
          const isLvlSelected = startLevel === i;

          ctx.lineWidth = 2;
          if (isLvlSelected) {
            ctx.shadowColor = '#00f0f0';
            ctx.shadowBlur = 8;
            ctx.fillStyle = 'rgba(0, 240, 240, 0.1)';
            ctx.fillRect(lx, 290, 35, 35);
            ctx.strokeStyle = '#00f0f0';
            ctx.strokeRect(lx, 290, 35, 35);
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.strokeRect(lx, 290, 35, 35);
            ctx.fillStyle = '#6b7280';
          }
          ctx.shadowBlur = 0;
          ctx.font = 'bold 15px "Orbitron", monospace';
          ctx.fillText(String(i), lx + 17.5, 313);
        }

        // Start Button
        ctx.lineWidth = 2.5;
        ctx.shadowColor = menuIndexRef.current === 0 ? '#a000f0' : 'transparent';
        ctx.shadowBlur = menuIndexRef.current === 0 ? 10 : 0;
        ctx.fillStyle = menuIndexRef.current === 0 ? '#a000f0' : 'rgba(160, 0, 240, 0.2)';
        ctx.fillRect(150, 380, 300, 45);
        ctx.strokeStyle = menuIndexRef.current === 0 ? '#ffffff' : '#6b7280';
        ctx.strokeRect(150, 380, 300, 45);

        ctx.shadowBlur = 0;
        ctx.fillStyle = menuIndexRef.current === 0 ? '#ffffff' : '#a0a0a0';
        ctx.font = 'bold 18px "Orbitron", monospace';
        ctx.fillText('INITIALIZE SEQUENCE', CANVAS_SIZE / 2, 408);

        // Exit Button
        ctx.shadowColor = menuIndexRef.current === 1 ? '#ff0055' : 'transparent';
        ctx.shadowBlur = menuIndexRef.current === 1 ? 10 : 0;
        ctx.fillStyle = menuIndexRef.current === 1 ? '#ff0055' : 'rgba(255, 0, 85, 0.2)';
        ctx.fillRect(150, 440, 300, 45);
        ctx.strokeStyle = menuIndexRef.current === 1 ? '#ffffff' : '#6b7280';
        ctx.strokeRect(150, 440, 300, 45);

        ctx.shadowBlur = 0;
        ctx.fillStyle = menuIndexRef.current === 1 ? '#ffffff' : '#a0a0a0';
        ctx.fillText('EXIT TO MENU', CANVAS_SIZE / 2, 468);

        ctx.fillStyle = '#6b7280';
        ctx.font = '12px "Exo 2", sans-serif';
        ctx.fillText('USE LEFT / RIGHT TO CHANGE SPEED • SPACEBAR TO LAUNCH', CANVAS_SIZE / 2, 550);
      }

      // ----------------------------------------------------
      // STATE: PAUSE
      // ----------------------------------------------------
      else if (curState === 'PAUSE') {
        drawTetrisBoard(ctx);

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(5, 5, 10, 0.85)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.shadowColor = '#a000f0';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#a000f0';
        ctx.font = 'bold 36px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SEQUENCE PAUSED', CANVAS_SIZE / 2, 160);

        const pauseItems = ['RESUME', 'RESTART', 'BACK TO MENU'];
        pauseItems.forEach((text, idx) => {
          const isSelected = menuIndex === idx;
          const y = 266 + idx * 60;

          if (isSelected) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f0f0';
            ctx.strokeStyle = '#00f0f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(CANVAS_SIZE / 2 - 100, y - 26, 200, 36);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px "Orbitron", monospace';
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#8888a0';
            ctx.font = '15px "Orbitron", monospace';
          }
          ctx.fillText(text, CANVAS_SIZE / 2, y);
        });
      }

      // ----------------------------------------------------
      // STATE: GAMEOVER
      // ----------------------------------------------------
      else if (curState === 'GAMEOVER') {
        drawTetrisBoard(ctx);

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(5, 5, 10, 0.88)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.shadowColor = '#f00000';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#f00000';
        ctx.font = 'bold 34px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_SIZE / 2, 100);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 20px "Orbitron", monospace';
        ctx.fillText(`CURRENT SCORE: ${scoreRef.current}`, CANVAS_SIZE / 2, 140);

        ctx.fillStyle = '#00ff88';
        ctx.fillText(`BEST SCORE: ${highScore}`, CANVAS_SIZE / 2, 170);



        // Action Options
        const gameOverItems = ['PLAY AGAIN', 'QUIT TO MENU'];
        gameOverItems.forEach((text, idx) => {
          const isSelected = menuIndex === idx;
          const y = 460 + idx * 55;

          ctx.textAlign = 'center';
          if (isSelected) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f0f0';
            ctx.strokeStyle = '#00f0f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(CANVAS_SIZE / 2 - 130, y - 26, 260, 36);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px "Orbitron", monospace';
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#8888a0';
            ctx.font = '15px "Orbitron", monospace';
          }
          ctx.fillText(text, CANVAS_SIZE / 2, y);
        });
      }

      // ----------------------------------------------------
      // STATE: GAMEPLAY
      // ----------------------------------------------------
      else if (curState === 'GAMEPLAY') {
        drawGameplayHUD(ctx);
        drawTetrisBoard(ctx);
        drawNextPiecePreview(ctx);
      }

      // Draw Global Speaker symbol
      drawSpeakerIcon(ctx);

      requestRef.current = requestAnimationFrame(render);
    };

    // Helper: Draw stats details (score, level, lines, best)
    const drawGameplayHUD = (c) => {
      c.textAlign = 'left';
      c.fillStyle = '#8888a0';
      c.font = '11px "Orbitron", monospace';

      // Score
      c.fillText('SCORE', 40, 95);
      c.fillStyle = '#ffffff';
      c.font = 'bold 16px "Orbitron", monospace';
      c.fillText(scoreRef.current.toLocaleString(), 40, 118);

      // Level / Lines
      c.fillStyle = '#8888a0';
      c.font = '11px "Orbitron", monospace';
      c.fillText('LEVEL', 40, 180);
      c.fillStyle = '#00f0f0';
      c.font = 'bold 18px "Orbitron", monospace';
      c.fillText(String(levelRef.current), 40, 203);

      c.fillStyle = '#8888a0';
      c.font = '11px "Orbitron", monospace';
      c.fillText('LINES', 40, 255);
      c.fillStyle = '#00ff88';
      c.font = 'bold 16px "Orbitron", monospace';
      c.fillText(String(linesRef.current), 40, 278);

      // Best Score
      c.fillStyle = '#8888a0';
      c.font = '11px "Orbitron", monospace';
      c.fillText('HIGH SCORE', 40, 335);
      c.fillStyle = '#ffd700';
      c.font = 'bold 15px "Orbitron", monospace';
      c.fillText(highScore.toLocaleString(), 40, 358);

      // Control Hints
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.font = '9px "Courier New", monospace';
      c.fillText('←/→ : SHIFT', 40, 430);
      c.fillText(' ↑  : ROTATE', 40, 448);
      c.fillText(' ↓  : DROP', 40, 466);
      c.fillText('SPC : HARD DROP', 40, 484);
      c.fillText('ESC : PAUSE', 40, 502);
    };

    // Helper: Draw main centered 10x20 tetris grid cells
    const drawTetrisBoard = (c) => {
      const g = gridRef.current;
      const piece = currentPieceRef.current;

      // Draw bezel bounding container
      c.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      c.lineWidth = 3;
      c.strokeRect(188, 78, 224, 444);

      // Inner cells loop
      for (let r = 0; r < 20; r++) {
        for (let col = 0; col < 10; col++) {
          const cell = g[r][col];
          let cellColor = cell.color;
          let active = cell.value !== 0;

          // Check if piece block overlaps this grid coordinate
          if (piece && gameStateRef.current === 'GAMEPLAY') {
            const py = r - piece.y;
            const px = col - piece.x;
            if (
              py >= 0 && py < piece.shape.length &&
              px >= 0 && px < piece.shape[py].length &&
              piece.shape[py][px]
            ) {
              active = true;
              cellColor = piece.color;
            }
          }

          const cellX = 190 + col * 22;
          const cellY = 80 + r * 22;

          if (active) {
            c.fillStyle = cellColor + '26'; // Transparent fill
            c.fillRect(cellX, cellY, 20, 20);

            c.shadowColor = cellColor;
            c.shadowBlur = 6;
            c.strokeStyle = cellColor;
            c.lineWidth = 1.5;
            c.strokeRect(cellX + 1, cellY + 1, 18, 18);
            c.shadowBlur = 0;
          } else {
            // Draw default empty grid coordinate outline
            c.strokeStyle = 'rgba(255,255,255,0.03)';
            c.lineWidth = 1;
            c.strokeRect(cellX, cellY, 20, 20);
          }
        }
      }
    };

    // Helper: Draw next floating upcoming block preview box
    const drawNextPiecePreview = (c) => {
      const next = nextPieceRef.current;
      const boxX = 440;
      const boxY = 80;
      const boxW = 100;
      const boxH = 100;

      // Draw bounding box
      c.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      c.lineWidth = 2;
      c.fillStyle = 'rgba(0,0,0,0.2)';
      c.fillRect(boxX, boxY, boxW, boxH);
      c.strokeRect(boxX, boxY, boxW, boxH);

      c.textAlign = 'center';
      c.fillStyle = '#8888a0';
      c.font = '10px "Orbitron", monospace';
      c.fillText('NEXT BLOCK', boxX + boxW / 2, boxY + 20);

      if (next) {
        c.save();
        const shape = next.shape;
        const cellSz = 14;
        const gap = 2;
        const totalW = shape[0].length * cellSz + (shape[0].length - 1) * gap;
        const totalH = shape.length * cellSz + (shape.length - 1) * gap;

        // Center within box
        const startX = boxX + (boxW - totalW) / 2;
        const startY = boxY + 30 + (boxH - 30 - totalH) / 2;

        for (let r = 0; r < shape.length; r++) {
          for (let col = 0; col < shape[r].length; col++) {
            if (shape[r][col]) {
              const bx = startX + col * (cellSz + gap);
              const by = startY + r * (cellSz + gap);

              c.fillStyle = next.color + '26';
              c.fillRect(bx, by, cellSz, cellSz);

              c.shadowColor = next.color;
              c.shadowBlur = 5;
              c.strokeStyle = next.color;
              c.lineWidth = 1.5;
              c.strokeRect(bx + 0.5, by + 0.5, cellSz - 1, cellSz - 1);
              c.shadowBlur = 0;
            }
          }
        }
        c.restore();
      }
    };

    // Helper: Draw speaker indicators
    const drawSpeakerIcon = (c) => {
      c.save();
      const x = 555;
      const y = 20;

      c.strokeStyle = muted ? '#ff0055' : '#8888a0';
      c.fillStyle = muted ? 'rgba(255,0,85,0.05)' : 'rgba(255,255,255,0.05)';
      c.lineWidth = 2;

      c.beginPath();
      c.moveTo(x, y + 6);
      c.lineTo(x + 6, y + 6);
      c.lineTo(x + 12, y);
      c.lineTo(x + 12, y + 16);
      c.lineTo(x + 6, y + 10);
      c.lineTo(x, y + 10);
      c.closePath();
      c.fill();
      c.stroke();

      if (!muted) {
        c.beginPath();
        c.arc(x + 10, y + 8, 5, -Math.PI / 3, Math.PI / 3);
        c.stroke();
        c.beginPath();
        c.arc(x + 10, y + 8, 9, -Math.PI / 3, Math.PI / 3);
        c.stroke();
      } else {
        c.strokeStyle = '#ff0055';
        c.beginPath();
        c.moveTo(x + 16, y + 3);
        c.lineTo(x + 22, y + 13);
        c.moveTo(x + 22, y + 3);
        c.lineTo(x + 16, y + 13);
        c.stroke();
      }
      c.restore();
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, startLevel, currentPiece, nextPiece, score, level, lines, muted, submitStatus, rewards, highScore, menuIndex]);

  return (
    <div className="tetris-page-wrapper">
      {/* Floating circular back button aligned vertically underneath website logo */}
      {gameState === 'LOBBY' || gameState === 'GAMEOVER' || gameState === 'PAUSE' ? (
        <Link to="/UODGaming" className="floating-back-btn" title="Back to Games">
          <ArrowLeft size={20} />
        </Link>
      ) : gameState === 'GAMEPLAY' ? (
        <button 
          onClick={() => { playSound('click', mutedRef.current); setGameState('PAUSE'); setMenuIndex(0); }} 
          className="floating-back-btn" 
          style={{ cursor: 'pointer' }}
          title="Pause Game"
        >
          <Pause size={20} color="white" />
        </button>
      ) : null}



      <div className="game-content-card">
        <div className="cabinet-screen crt-screen" onClick={handleCanvasClick}>
          {/* CRT scanlines, reflection and flicker overlay */}
          <div className="crt-scanlines"></div>
          <div className="crt-reflection"></div>
          <div className="crt-flicker"></div>

          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ display: 'block', background: '#020106', width: '100%', height: 'auto', maxWidth: '650px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Tetris;
