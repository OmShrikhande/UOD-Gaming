import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/ColorG.css';

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
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
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

const ColorG = () => {
  // Game states: 'LOBBY' | 'GAMEPLAY' | 'GAMEOVER'
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

  // Game metrics
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  const [bestStreak, setBestStreak] = useState(() => {
    return parseInt(localStorage.getItem('colorg_beststreak') || '0', 10);
  });

  const [lives, setLives] = useState(5);
  const livesRef = useRef(5);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // Menu navigation index
  const [menuIndex, setMenuIndex] = useState(0); // Lobby: 0=START, 1=EXIT. GameOver: 0=PLAY AGAIN, 1=LOBBY
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);

  // Grid cursor navigation
  const [gridCursor, setGridCursor] = useState({ row: 0, col: 0 }); // 3 rows, 2 columns
  const gridCursorRef = useRef({ row: 0, col: 0 });
  useEffect(() => { gridCursorRef.current = gridCursor; }, [gridCursor]);

  // Colors state
  const colorsRef = useRef([]);
  const pickedColorRef = useRef('');
  const showingResultRef = useRef(false);
  const selectedIdxRef = useRef(null);

  // API sync states
  const [gameId, setGameId] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [rewards, setRewards] = useState(null);

  

  // Canvas Refs & Loops
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const CANVAS_SIZE = 600;

  // Grid positioning
  const GRID_ROWS = 3;
  const GRID_COLS = 1;
  const CELL_WIDTH = 440;
  const CELL_HEIGHT = 80;
  const GRID_X_START = 80;
  const GRID_Y_START = 220;
  const HORIZ_GAP = 0;
  const VERT_GAP = 20;

  // Retrieve game info on mount
  useEffect(() => {
    axios.get('/api/v1/games')
      .then(res => {
        const game = res.data.games?.find(g => g.title === "Color Guesser RGB");
        if (game) setGameId(game._id);
      })
      .catch(err => console.error("Failed to load game info:", err));
  }, []);

  // Submit high score
  const submitColorScore = async (finalScore) => {
    const token = 'cookie-token';
    if (gameId && token && finalScore > 0) {
      setSubmitStatus('submitting');
      try {
        const res = await axios.post(`/api/v1/games/${gameId}/score`, {
          score: finalScore
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

  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `rgb(${Math.round(f(0) * 255)}, ${Math.round(f(8) * 255)}, ${Math.round(f(4) * 255)})`;
  };

  const generateNewRound = () => {
    const arr = [];
    const baseHue = Math.floor(Math.random() * 360);
    for (let i = 0; i < 3; i++) {
      const h = (baseHue + i * 120 + Math.floor(Math.random() * 30 - 15)) % 360;
      const s = 60 + Math.floor(Math.random() * 40);
      const l = 40 + Math.floor(Math.random() * 30);
      arr.push(hslToRgb(h, s, l));
    }
    // Shuffle options
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    colorsRef.current = arr;
    pickedColorRef.current = arr[Math.floor(Math.random() * arr.length)];
  };

  // Start fresh game
  const startGame = () => {
    setScore(0);
    setStreak(0);
    setLives(5);
    setRewards(null);
    setSubmitStatus('');
    setMenuIndex(0);
    setGridCursor({ row: 0, col: 0 });

    playSound('start', mutedRef.current);
    generateNewRound();
    setGameState('GAMEPLAY');
  };

  // Process guess at grid index
  const selectChoice = (idx) => {
    if (gameStateRef.current !== 'GAMEPLAY' || showingResultRef.current) return;

    const chosenColor = colorsRef.current[idx];
    const targetColor = pickedColorRef.current;

    if (chosenColor === targetColor) {
      playSound('correct', mutedRef.current);
      setScore(prev => prev + 1);
      
      const newStreak = streakRef.current + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
        localStorage.setItem('colorg_beststreak', newStreak.toString());
      }
      generateNewRound();
    } else {
      playSound('wrong', mutedRef.current);
      setStreak(0);
      const remainingLives = livesRef.current - 1;
      setLives(remainingLives);
      showingResultRef.current = true;
      selectedIdxRef.current = idx;

      setTimeout(() => {
        showingResultRef.current = false;
        if (remainingLives <= 0) {
          playSound('wrong', mutedRef.current);
          setGameState('GAMEOVER');
          setMenuIndex(0);
          submitColorScore(scoreRef.current);
        } else {
          generateNewRound();
        }
      }, 1500);
    }
  };

  // Keyboard navigation mapping
  const handleKeyboardNav = (code) => {
    const curState = gameStateRef.current;
    if (curState === 'LOBBY') {
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => (prev === 0 ? 1 : 0));
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 0) startGame();
        else window.location.href = '/UODGaming';
      }
    } else if (curState === 'GAMEPLAY') {
      const cursor = gridCursorRef.current;
      if (code === 'ArrowUp' || code === 'KeyW') {
        setGridCursor(prev => ({ ...prev, row: (prev.row - 1 + GRID_ROWS) % GRID_ROWS }));
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        setGridCursor(prev => ({ ...prev, row: (prev.row + 1) % GRID_ROWS }));
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        setGridCursor(prev => ({ ...prev, col: (prev.col - 1 + GRID_COLS) % GRID_COLS }));
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        setGridCursor(prev => ({ ...prev, col: (prev.col + 1) % GRID_COLS }));
      } else if (code === 'Space' || code === 'Enter') {
        const idx = cursor.row * GRID_COLS + cursor.col;
        selectChoice(idx);
      } else if (code === 'Escape') {
        playSound('click', mutedRef.current);
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
          setGameState('GAMEPLAY');
        } else if (menuIndexRef.current === 1) {
          startGame();
        } else {
          setGameState('LOBBY');
          setMenuIndex(0);
        }
      } else if (code === 'Escape') {
        playSound('click', mutedRef.current);
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

  // Keyboard hooks
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

    // Speaker mute toggle
    if (clickX >= 540 && clickX <= 590 && clickY >= 10 && clickY <= 50) {
      playSound('click', !muted);
      setMuted(prev => !prev);
      return;
    }

    const curState = gameState;
    if (curState === 'GAMEPLAY') {
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const x = GRID_X_START + c * (CELL_WIDTH + HORIZ_GAP);
          const y = GRID_Y_START + r * (CELL_HEIGHT + VERT_GAP);

          if (clickX >= x && clickX <= x + CELL_WIDTH && clickY >= y && clickY <= y + CELL_HEIGHT) {
            setGridCursor({ row: r, col: c });
            const idx = r * GRID_COLS + c;
            selectChoice(idx);
            return;
          }
        }
      }
    }
  };

  // Canvas Mouse Move to sync selector ring
  const handleCanvasMouseMove = (e) => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_X_START + c * (CELL_WIDTH + HORIZ_GAP);
        const y = GRID_Y_START + r * (CELL_HEIGHT + VERT_GAP);

        if (mouseX >= x && mouseX <= x + CELL_WIDTH && mouseY >= y && mouseY <= y + CELL_HEIGHT) {
          if (gridCursorRef.current.row !== r || gridCursorRef.current.col !== c) {
            setGridCursor({ row: r, col: c });
          }
          return;
        }
      }
    }
  };

  // Render & Timing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      

      // Render backgrounds
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.shadowBlur = 0;

      // Draw Grid line space
      ctx.strokeStyle = '#0a050f';
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
      // STATE: GAMEPLAY
      // ----------------------------------------------------
      if (curState === 'GAMEPLAY') {
        // Draw HUD details
        ctx.textAlign = 'left';
        ctx.fillStyle = '#8888a0';
        ctx.font = '11px "Orbitron", monospace';
        ctx.fillText('CORRECT MATCHES', 40, 30);
        ctx.fillText('STREAK', 220, 30);
        ctx.fillText('ENERGY LIFE', 380, 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Orbitron", monospace';
        ctx.fillText(String(scoreRef.current), 40, 52);

        ctx.fillStyle = '#d946ef';
        ctx.fillText(`${streakRef.current} / ${bestStreak}`, 220, 52);

        // Draw Lives (Energy Batteries)
        const currentLives = livesRef.current;
        for (let l = 0; l < 5; l++) {
          const lx = 380 + l * 20;
          ctx.strokeStyle = l < currentLives ? '#00ff88' : '#333340';
          ctx.fillStyle = l < currentLives ? 'rgba(0, 255, 136, 0.6)' : 'transparent';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.rect(lx, 40, 14, 14);
          ctx.fill();
          ctx.stroke();
          // Battery tip
          ctx.fillStyle = l < currentLives ? '#00ff88' : '#333340';
          ctx.fillRect(lx + 14, 44, 2, 6);
        }

        // Divider
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 78);
        ctx.lineTo(CANVAS_SIZE, 78);
        ctx.stroke();

        // Target RGB Display Banner
        ctx.fillStyle = '#100a1c';
        ctx.fillRect(80, 100, 440, 70);
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(80, 100, 440, 70);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#8888a0';
        ctx.font = '11px "Orbitron", monospace';
        ctx.fillText('IDENTIFY THIS RGB SIGNATURE:', CANVAS_SIZE / 2, 122);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Orbitron", monospace';
        ctx.fillText(pickedColorRef.current.toUpperCase(), CANVAS_SIZE / 2, 150);



        // Render swatches options
        const cursor = gridCursorRef.current;
        const currentColors = colorsRef.current;

        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const idx = r * GRID_COLS + c;
            if (idx >= currentColors.length) continue;

            const x = GRID_X_START + c * (CELL_WIDTH + HORIZ_GAP);
            const y = GRID_Y_START + r * (CELL_HEIGHT + VERT_GAP);

            // Draw color swatch rect
            ctx.fillStyle = currentColors[idx];
            ctx.beginPath();
            ctx.roundRect(x, y, CELL_WIDTH, CELL_HEIGHT, 6);
            ctx.fill();

            // Draw a subtle border outline
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;

            if (showingResultRef.current) {
              if (currentColors[idx] === pickedColorRef.current) {
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 15;
              } else if (idx === selectedIdxRef.current) {
                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = 15;
              }
            }

            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw selection ring cursor
            if (cursor.row === r && cursor.col === c) {
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 10;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          }
        }
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
  }, [gameState, score, streak, lives, muted, submitStatus, rewards, menuIndex, gridCursor, bestStreak]);

  return (
    <div className="color-g-container">
      {/* Floating back button */}
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
          <div className="colorg-overlay">
            <h1 className="colorg-title">SPECTRAL RGB SCAN</h1>
            <p className="colorg-subtitle">RGB CONTEXTUAL MATCHING MATRIX</p>
            <p className="colorg-subtitle" style={{ marginTop: '-30px', color: '#00ff88' }}>BEST STREAK RECORD: {bestStreak} ROUNDS</p>
            
            <div className="colorg-menu">
              <button 
                className={`colorg-btn ${menuIndex === 0 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(0)}
                onClick={() => { playSound('click', mutedRef.current); startGame(); }}
              >
                START RUN
              </button>
              <button 
                className={`colorg-btn ${menuIndex === 1 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(1)}
                onClick={() => { playSound('click', mutedRef.current); window.location.href = '/UODGaming'; }}
              >
                EXIT TO MENU
              </button>
            </div>
          </div>
        )}

        {gameState === 'PAUSE' && (
          <div className="colorg-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
            <h1 className="colorg-title" style={{ color: '#ff007f', textShadow: '0 0 15px rgba(255, 0, 127, 0.8)' }}>SYSTEM PAUSED</h1>
            <p className="colorg-subtitle" style={{ marginBottom: '60px' }}></p>
            
            <div className="colorg-menu">
              {['RESUME', 'RESTART', 'QUIT TO MENU'].map((text, idx) => (
                <button 
                  key={idx}
                  className={`colorg-btn ${menuIndex === idx ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(idx)}
                  onClick={() => {
                    playSound('click', mutedRef.current);
                    if (idx === 0) { setGameState('GAMEPLAY'); }
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
          <div className="colorg-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
            <h1 className="colorg-title" style={{ color: '#ff007f', textShadow: '0 0 20px rgba(255, 0, 127, 0.8)' }}>GAME OVER</h1>
            <p className="colorg-subtitle" style={{ color: '#00d4ff', fontSize: '20px', marginBottom: '5px' }}>CURRENT SCORE: {score}</p>
            <p className="colorg-subtitle" style={{ color: '#00ff88', fontSize: '16px', marginBottom: '40px' }}>BEST SCORE: {bestStreak}</p>

            <div className="colorg-menu">
              <button 
                className={`colorg-btn ${menuIndex === 0 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(0)}
                onClick={() => { playSound('click', mutedRef.current); startGame(); }}
              >
                PLAY AGAIN
              </button>
              <button 
                className={`colorg-btn ${menuIndex === 1 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(1)}
                onClick={() => { playSound('click', mutedRef.current); setGameState('LOBBY'); }}
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

export default ColorG;
