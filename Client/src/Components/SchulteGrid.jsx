import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/SchulteGrid.css';

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
    } else if (type === 'change') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.08);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn("Audio Context init failed:", e);
  }
};

const SchulteGrid = () => {
  // Game states: 'LOBBY' | 'GAMEPLAY' | 'GAMEOVER'
  const [gameState, setGameState] = useState('LOBBY');
  const gameStateRef = useRef('LOBBY');
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Audio mute
  const [muted, setMuted] = useState(() => localStorage.getItem('arcade_muted') === 'true');
  const mutedRef = useRef(false);
  useEffect(() => {
    mutedRef.current = muted;
    localStorage.setItem('arcade_muted', muted.toString());
  }, [muted]);

  // Grid config & sizing
  const [gridSize, setGridSize] = useState(5); // 3 | 5 | 7
  const gridSizeRef = useRef(5);
  useEffect(() => { gridSizeRef.current = gridSize; }, [gridSize]);

  const [grid, setGrid] = useState([]);
  const gridRef = useRef([]);
  useEffect(() => { gridRef.current = grid; }, [grid]);

  // Target number in sequence (1 to N^2)
  const [target, setTarget] = useState(1);
  const targetRef = useRef(1);
  useEffect(() => { targetRef.current = target; }, [target]);

  // Scoring metrics
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);
  useEffect(() => { elapsedTimeRef.current = elapsedTime; }, [elapsedTime]);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const [highScores, setHighScores] = useState({
    3: parseInt(localStorage.getItem('schulte_high_score_3') || '0', 10),
    5: parseInt(localStorage.getItem('schulte_high_score_5') || '0', 10),
    7: parseInt(localStorage.getItem('schulte_high_score_7') || '0', 10)
  });

  // Navigation indices
  const [menuIndex, setMenuIndex] = useState(0); // 0 = size selector, 1 = START, 2 = EXIT
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);

  const [gridCursor, setGridCursor] = useState({ row: 0, col: 0 }); // Keyboard selection grid coordinate
  const gridCursorRef = useRef({ row: 0, col: 0 });
  useEffect(() => { gridCursorRef.current = gridCursor; }, [gridCursor]);

  // Database API integration
  const [gameId, setGameId] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [rewards, setRewards] = useState(null);

  // Canvas details
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseStartTimeRef = useRef(0);

  const CANVAS_SIZE = 600;
  const GRID_SIZE_PX = 440;
  const GRID_X_START = 80;
  const GRID_Y_START = 110;

  // Flash parameters on correct / incorrect
  const [wrongCellIdx, setWrongCellIdx] = useState(null);
  const wrongCellIdxRef = useRef(null);
  useEffect(() => { wrongCellIdxRef.current = wrongCellIdx; }, [wrongCellIdx]);

  // Retrieve game info on mount
  useEffect(() => {
    axios.get('/api/v1/games')
      .then(res => {
        const game = res.data.games?.find(g => g.title === "Cyber Grid 1-25");
        if (game) setGameId(game._id);
      })
      .catch(err => console.error("Failed to load game info:", err));
  }, []);

  // Submit high score
  const submitGridScore = async (finalScore, selectedGridSize) => {
    const token = 'cookie-token';
    if (gameId && token && finalScore > 0) {
      setSubmitStatus('submitting');
      try {
        const res = await axios.post(`/api/v1/games/${gameId}/score`, {
          score: finalScore,
          level: selectedGridSize === 3 ? 1 : selectedGridSize === 5 ? 2 : 3
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

  // Fisher-Yates shuffle algorithm
  const generateShuffledGrid = (size) => {
    const totalCells = size * size;
    const base = Array.from({ length: totalCells }, (_, i) => ({
      value: i + 1,
      status: 'idle'
    }));

    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = base[i];
      base[i] = base[j];
      base[j] = temp;
    }
    return base;
  };

  // Launch new game
  const startGame = () => {
    playSound('start', mutedRef.current);
    const initialGrid = generateShuffledGrid(gridSize);
    setGrid(initialGrid);
    setTarget(1);
    setElapsedTime(0);
    setScore(0);
    setRewards(null);
    setSubmitStatus('');
    setGridCursor({ row: 0, col: 0 });
    setWrongCellIdx(null);

    startTimeRef.current = performance.now();
    setGameState('GAMEPLAY');
  };

  // Process cell picking at index
  const selectCell = (idx) => {
    if (gameStateRef.current !== 'GAMEPLAY') return;

    const currentGrid = [...gridRef.current];
    const cell = currentGrid[idx];
    const currentTarget = targetRef.current;

    if (cell.status === 'correct') return; // already done

    if (cell.value === currentTarget) {
      playSound('correct', mutedRef.current);
      currentGrid[idx].status = 'correct';
      setGrid(currentGrid);

      const maxVal = gridSizeRef.current * gridSizeRef.current;
      if (currentTarget === maxVal) {
        // VICTORY / COMPLETED
        const endTime = performance.now();
        const finalTimeSec = (endTime - startTimeRef.current) / 1000;
        setElapsedTime(finalTimeSec);

        playSound('win', mutedRef.current);

        let basePoints = 100000;
        if (gridSizeRef.current === 3) basePoints = 20000;
        if (gridSizeRef.current === 7) basePoints = 300000;

        const finalScore = Math.max(10, Math.round(basePoints / finalTimeSec));
        setScore(finalScore);

        // Update High Score local storage
        const scoreKey = `schulte_high_score_${gridSizeRef.current}`;
        const prevHighScore = highScores[gridSizeRef.current];
        if (finalScore > prevHighScore) {
          localStorage.setItem(scoreKey, finalScore.toString());
          setHighScores(prev => ({ ...prev, [gridSizeRef.current]: finalScore }));
        }

        setGameState('GAMEOVER');
        setMenuIndex(0);
        submitGridScore(finalScore, gridSizeRef.current);
      } else {
        setTarget(currentTarget + 1);
      }
    } else {
      // Wrong click
      playSound('wrong', mutedRef.current);
      setWrongCellIdx(idx);
      setTimeout(() => {
        setWrongCellIdx(prev => (prev === idx ? null : prev));
      }, 300);
    }
  };

  // Keyboard navigation mappings
  const handleKeyboardNav = (code) => {
    const curState = gameStateRef.current;
    if (curState === 'LOBBY') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => { const next = prev === 0 ? 2 : prev - 1; menuIndexRef.current = next; return next; });
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => { const next = prev === 2 ? 0 : prev + 1; menuIndexRef.current = next; return next; });
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        if (menuIndexRef.current === 0) {
          playSound('change', mutedRef.current);
          setGridSize(prev => (prev === 5 ? 3 : prev === 7 ? 5 : 7));
        }
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        if (menuIndexRef.current === 0) {
          playSound('change', mutedRef.current);
          setGridSize(prev => (prev === 3 ? 5 : prev === 5 ? 7 : 3));
        }
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 2) window.location.href = '/UODGaming';
        else startGame();
      }
    } else if (curState === 'GAMEPLAY') {
      const size = gridSizeRef.current;
      const cursor = gridCursorRef.current;

      if (code === 'ArrowUp' || code === 'KeyW') {
        setGridCursor(prev => ({ ...prev, row: (prev.row - 1 + size) % size }));
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        setGridCursor(prev => ({ ...prev, row: (prev.row + 1) % size }));
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        setGridCursor(prev => ({ ...prev, col: (prev.col - 1 + size) % size }));
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        setGridCursor(prev => ({ ...prev, col: (prev.col + 1) % size }));
      } else if (code === 'Space' || code === 'Enter') {
        const idx = cursor.row * size + cursor.col;
        selectCell(idx);
      } else if (code === 'Escape') {
        playSound('click', mutedRef.current);
        pauseStartTimeRef.current = performance.now();
        setGameState('PAUSE');
        setMenuIndex(0);
      }
    } else if (curState === 'PAUSE') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => (prev === 0 ? 2 : prev - 1));
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => (prev === 2 ? 0 : prev + 1));
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 0) {
          startTimeRef.current += (performance.now() - pauseStartTimeRef.current);
          setGameState('GAMEPLAY');
        } else if (menuIndexRef.current === 1) {
          startGame();
        } else {
          setGameState('LOBBY');
          setMenuIndex(0);
        }
      } else if (code === 'Escape') {
        playSound('click', mutedRef.current);
        startTimeRef.current += (performance.now() - pauseStartTimeRef.current);
        setGameState('GAMEPLAY');
      }
    } else if (curState === 'GAMEOVER') {
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => (prev === 0 ? 1 : 0));
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 0) {
          startGame();
        } else {
          setGameState('LOBBY');
          setMenuIndex(0);
        }
      }
    }
  };

  // Register window listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeStates = ['LOBBY', 'GAMEPLAY', 'GAMEOVER', 'PAUSE'];
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
    if (curState === 'GAMEPLAY') {
      if (
        clickX >= GRID_X_START &&
        clickX <= GRID_X_START + GRID_SIZE_PX &&
        clickY >= GRID_Y_START &&
        clickY <= GRID_Y_START + GRID_SIZE_PX
      ) {
        const cellWidth = GRID_SIZE_PX / gridSize;
        const cellHeight = GRID_SIZE_PX / gridSize;
        const col = Math.floor((clickX - GRID_X_START) / cellWidth);
        const row = Math.floor((clickY - GRID_Y_START) / cellHeight);

        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          setGridCursor({ row, col });
          const idx = row * gridSize + col;
          selectCell(idx);
        }
      }
    }
  };

  // Canvas Mouse Move to highlight selectors on hover
  const handleCanvasMouseMove = (e) => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (
      mouseX >= GRID_X_START &&
      mouseX <= GRID_X_START + GRID_SIZE_PX &&
      mouseY >= GRID_Y_START &&
      mouseY <= GRID_Y_START + GRID_SIZE_PX
    ) {
      const cellWidth = GRID_SIZE_PX / gridSize;
      const cellHeight = GRID_SIZE_PX / gridSize;
      const col = Math.floor((mouseX - GRID_X_START) / cellWidth);
      const row = Math.floor((mouseY - GRID_Y_START) / cellHeight);

      if (
        row >= 0 &&
        row < gridSize &&
        col >= 0 &&
        col < gridSize &&
        (gridCursorRef.current.row !== row || gridCursorRef.current.col !== col)
      ) {
        setGridCursor({ row, col });
      }
    }
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      // Update Timer in GAMEPLAY
      if (gameStateRef.current === 'GAMEPLAY') {
        const timeNow = performance.now();
        const diff = (timeNow - startTimeRef.current) / 1000;
        setElapsedTime(diff);
      }

      // Drawing background
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.shadowBlur = 0;

      // Draw Retro Grid lines in space
      ctx.strokeStyle = '#050c18';
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
      // STATE HANDLING
      // ----------------------------------------------------
      if (curState === 'PAUSE' || curState === 'GAMEOVER' || curState === 'GAMEPLAY') {
        // Draw HUD details
        ctx.textAlign = 'left';
        ctx.fillStyle = '#8888a0';
        ctx.font = '11px "Orbitron", monospace';
        ctx.fillText('FIND SEQUENTIAL TARGET', 40, 30);
        ctx.fillText('HIGH SCORE', 300, 30);

        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px "Orbitron", monospace';
        ctx.fillText(`[ ${targetRef.current} ]`, 40, 52);

        ctx.fillStyle = '#ffd700';
        ctx.fillText(highScores[gridSize].toLocaleString(), 300, 52);

        // Timer
        ctx.textAlign = 'right';
        ctx.fillStyle = '#8888a0';
        ctx.font = '11px "Orbitron", monospace';
        ctx.fillText('ELAPSED TIME', 520, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Orbitron", monospace';
        ctx.fillText(`${elapsedTimeRef.current.toFixed(2)}s`, 520, 52);

        // Divider
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 78);
        ctx.lineTo(CANVAS_SIZE, 78);
        ctx.stroke();

        // Draw cells
        const sz = gridSize;
        const cellW = GRID_SIZE_PX / sz;
        const cellH = GRID_SIZE_PX / sz;
        const cursor = gridCursorRef.current;
        const currentGrid = gridRef.current;

        for (let r = 0; r < sz; r++) {
          for (let c = 0; c < sz; c++) {
            const idx = r * sz + c;
            if (idx >= currentGrid.length) continue;

            const cell = currentGrid[idx];
            const x = GRID_X_START + c * cellW;
            const y = GRID_Y_START + r * cellH;

            // Determine borders and fills
            let fillStyle = 'rgba(0, 212, 255, 0.03)';
            let strokeStyle = 'rgba(0, 212, 255, 0.2)';
            let textStyle = '#ffffff';

            if (cell.status === 'correct') {
              fillStyle = 'rgba(0, 255, 136, 0.08)';
              strokeStyle = 'rgba(0, 255, 136, 0.4)';
              textStyle = '#00ff88';
            }

            if (wrongCellIdxRef.current === idx) {
              fillStyle = 'rgba(255, 0, 85, 0.2)';
              strokeStyle = '#ff0055';
              textStyle = '#ff0055';
            }

            // Draw bounding rect
            ctx.fillStyle = fillStyle;
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, cellW - 8, cellH - 8, 6);
            ctx.fill();
            ctx.stroke();

            // Draw value text
            ctx.fillStyle = textStyle;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Dynamic text sizes depending on grid dimensions
            const fontSize = sz === 3 ? 34 : sz === 5 ? 24 : 16;
            ctx.font = `bold ${fontSize}px "Orbitron", monospace`;
            ctx.fillText(String(cell.value), x + cellW / 2, y + cellH / 2);

            // Draw selection box outline if cursor matches
            if (cursor.row === r && cursor.col === c && gameStateRef.current === 'GAMEPLAY') {
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 8;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 6);
              ctx.stroke();
              ctx.shadowBlur = 0; // reset
            }
          }
        }
        ctx.textBaseline = 'alphabetic'; // reset
      }

      // Draw Global Speaker Icon
      drawSpeakerIcon(ctx);

      requestRef.current = requestAnimationFrame(render);
    };

    // Helper: Draw global speaker mute toggler button
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
  }, [gameState, target, grid, elapsedTime, score, muted, submitStatus, rewards, menuIndex, gridSize, gridCursor, wrongCellIdx, highScores]);

  return (
    <div className="schulte-page-wrapper">
      {/* Floating circular back button (Only visible in Lobby, GameOver or Pause) */}
            {gameState === 'LOBBY' || gameState === 'GAMEOVER' || gameState === 'PAUSE' ? (
        <Link to="/UODGaming" className="floating-back-btn" title="Back to Games">
          <ArrowLeft size={20} />
        </Link>
      ) : gameState === 'GAMEPLAY' ? (
        <button 
          onClick={() => { playSound('click', mutedRef.current); setGameState('PAUSE'); setMenuIndex && typeof setMenuIndex === 'function' ? setMenuIndex(0) : null; }} 
          className="floating-back-btn" 
          style={{ cursor: 'pointer' }}
          title="Pause Game"
        >
          <Pause size={20} color="white" />
        </button>
      ) : null}



      <div className="game-content-card">
        <div 
          className="cabinet-screen crt-screen"
        >
          {/* CRT scanlines, reflection and flicker overlay */}
          <div className="crt-scanlines"></div>
          <div className="crt-reflection"></div>
          <div className="crt-flicker"></div>

          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ display: 'block', background: '#020205', width: '100%', height: 'auto', maxWidth: '650px' }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />
          
          {/* DOM OVERLAYS */}
          {gameState === 'LOBBY' && (
            <div className="schultegrid-overlay">
              <h1 className="schultegrid-title">SCHULTE GRID</h1>
              <p className="schultegrid-subtitle">PERIPHERAL VISION CALIBRATION</p>
              <p className="schultegrid-subtitle" style={{ marginTop: '-30px', color: '#00d4ff' }}>CURRENT HIGH SCORE: {highScores[gridSize].toLocaleString()} POINTS</p>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                {[3, 5, 7].map(sz => (
                  <button 
                    key={sz}
                    className={`schultegrid-btn ${gridSize === sz ? 'selected' : ''}`}
                    style={{ minWidth: '60px' }}
                    onClick={() => { playSound('change', mutedRef.current); setGridSize(sz); }}
                  >
                    {sz}x{sz}
                  </button>
                ))}
              </div>
              
              <div className="schultegrid-menu">
                <button 
                  className={`schultegrid-btn ${menuIndex === 1 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(1)}
                  onClick={() => { playSound('click', mutedRef.current); startGame(); }}
                >
                  START RUN
                </button>
                <button 
                  className={`schultegrid-btn ${menuIndex === 2 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(2)}
                  onClick={() => { playSound('click', mutedRef.current); window.location.href = '/UODGaming'; }}
                >
                  EXIT TO MENU
                </button>
              </div>
            </div>
          )}

          {gameState === 'PAUSE' && (
            <div className="schultegrid-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
              <h1 className="schultegrid-title" style={{ color: '#00d4ff', textShadow: '0 0 15px rgba(0, 212, 255, 0.8)' }}>SYSTEM PAUSED</h1>
              <p className="schultegrid-subtitle" style={{ marginBottom: '60px' }}></p>
              
              <div className="schultegrid-menu">
                {['RESUME', 'RESTART', 'BACK TO MENU'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`schultegrid-btn ${menuIndex === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuIndex(idx)}
                    onClick={() => {
                      playSound('click', mutedRef.current);
                      if (idx === 0) { startTimeRef.current += (performance.now() - pauseStartTimeRef.current); setGameState('GAMEPLAY'); }
                      else if (idx === 1) startGame();
                      else { setGameState('LOBBY'); setMenuIndex(0); }
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="schultegrid-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
              <h1 className="schultegrid-title" style={{ color: '#00ff88', textShadow: '0 0 20px rgba(0, 255, 136, 0.8)' }}>YOU WIN</h1>
              <p className="schultegrid-subtitle" style={{ color: '#00d4ff', fontSize: '20px', marginBottom: '5px' }}>CURRENT SCORE: {score}</p>
              <p className="schultegrid-subtitle" style={{ color: '#00ff88', fontSize: '16px', marginBottom: '40px' }}>BEST SCORE: {highScores[gridSize]}</p>
              
              <div className="schultegrid-menu">
                <button 
                  className={`schultegrid-btn ${menuIndex === 0 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(0)}
                  onClick={() => { playSound('click', mutedRef.current); startGame(); }}
                >
                  PLAY AGAIN
                </button>
                <button 
                  className={`schultegrid-btn ${menuIndex === 1 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(1)}
                  onClick={() => { playSound('click', mutedRef.current); setGameState('LOBBY'); setMenuIndex(0); }}
                >
                  QUIT TO MENU
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchulteGrid;
