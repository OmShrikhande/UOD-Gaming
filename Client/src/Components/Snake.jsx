import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/Snake.css';

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
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'eat') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'golden') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // D6
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(55, now + 0.5);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Audio Context init failed:", e);
  }
};

const Snake = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameId, setGameId] = useState(null);

  // Fetch Game ID
  useEffect(() => {
    if (location.state?.gameId) {
      setGameId(location.state.gameId);
    } else {
      axios.get('/api/v1/games')
        .then(res => {
          const game = res.data.games?.find(g => g.title === "Snake Arcade");
          if (game) setGameId(game._id);
        })
        .catch(err => console.error("Failed to load game info:", err));
    }
  }, [location.state]);

  // Main game state: 'LOBBY' | 'GAMEPLAY' | 'LEADERBOARD' | 'PAUSE' | 'GAMEOVER'
  const [gameState, setGameState] = useState('LOBBY');
  const gameStateRef = useRef('LOBBY');
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snake_highscore') || '0', 10);
  });

  // Settings
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [isMuted, setIsMuted] = useState(false);

  // API scores & rewards status
  const [submitStatus, setSubmitStatus] = useState(''); // 'submitting' | 'submitted' | 'failed' | 'offline'
  const [rewards, setRewards] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Menu items selection
  const [menuIndex, setMenuIndex] = useState(0);
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);

  // Canvas Refs & Game Objects
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const lastTickRef = useRef(0);

  // Physics states
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const directionRef = useRef('right');
  const nextDirectionRef = useRef('right');
  const inputQueueRef = useRef([]);
  const fruitRef = useRef({ x: 15, y: 15 });
  const goldenFruitRef = useRef(null); // { x, y, duration }
  const particlesRef = useRef([]); // particles generated on eating food

  // Constants
  const GRID_SIZE = 20; // 20px cell
  const CELL_COUNT = 30; // 30x30 cells
  const CANVAS_SIZE = GRID_SIZE * CELL_COUNT; // 600px

  // Speed mapping based on difficulty
  const getSpeed = () => {
    if (difficulty === 'easy') return 140;
    if (difficulty === 'hard') return 70;
    return 100; // medium
  };

  // Fetch online leaderboard
  const fetchLeaderboard = async () => {
    if (!gameId) return;
    try {
      setLeaderboardLoading(true);
      const res = await axios.get(`/api/v1/leaderboard/game/${gameId}?limit=6`);
      setLeaderboard(res.data.leaderboardWithRanks || res.data.leaderboard || []);
    } catch (err) {
      console.error("Failed to load rankings:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (gameId && gameState === 'LEADERBOARD') {
      fetchLeaderboard();
    }
  }, [gameId, gameState]);

  // Submit high score
  const submitScore = async (finalScore) => {
    const token = 'cookie-token';
    if (gameId && token) {
      setSubmitStatus('submitting');
      try {
        const res = await axios.post(`/api/v1/games/${gameId}/score`, {
          score: finalScore,
          level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
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

        // Sync local storage user profile coins
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
            console.error(e);
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

  // Generate random empty coordinate
  const generateRandomFood = () => {
    let attempts = 0;
    while (attempts < 100) {
      const rx = Math.floor(Math.random() * CELL_COUNT);
      const ry = Math.floor(Math.random() * CELL_COUNT);
      // Ensure food is not inside snake body
      const collides = snakeRef.current.some(part => part.x === rx && part.y === ry);
      if (!collides) {
        return { x: rx, y: ry };
      }
      attempts++;
    }
    return { x: 5, y: 5 };
  };

  // Spark Particles Generator
  const emitParticles = (x, y, color) => {
    const cx = x * GRID_SIZE + GRID_SIZE / 2;
    const cy = y * GRID_SIZE + GRID_SIZE / 2;
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        color: color,
        size: Math.random() * 2 + 1
      });
    }
  };

  // Start new game run
  const launchGameplay = () => {
    snakeRef.current = [
      { x: 12, y: 15 },
      { x: 11, y: 15 },
      { x: 10, y: 15 }
    ];
    directionRef.current = 'right';
    nextDirectionRef.current = 'right';
    inputQueueRef.current = [];
    setScore(0);
    setRewards(null);
    setSubmitStatus('');
    fruitRef.current = generateRandomFood();
    goldenFruitRef.current = null;
    particlesRef.current = [];
    lastTickRef.current = 0;
    setGameState('GAMEPLAY');
  };

  // Handle game over crash
  const triggerGameOver = (finalScore) => {
    playSound('fail', isMuted);
    setGameState('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('snake_highscore', finalScore.toString());
    }
    submitScore(finalScore);
  };

  // Game Loop Ticking & Rendering
  const updatePhysics = () => {
    if (inputQueueRef.current.length > 0) {
      const nextDir = inputQueueRef.current.shift();
      const currentDir = directionRef.current;
      if (
        (nextDir === 'up' && currentDir !== 'down') ||
        (nextDir === 'down' && currentDir !== 'up') ||
        (nextDir === 'left' && currentDir !== 'right') ||
        (nextDir === 'right' && currentDir !== 'left')
      ) {
        directionRef.current = nextDir;
      }
    }

    const head = { ...snakeRef.current[0] };
    const dir = directionRef.current;
    if (dir === 'up') head.y -= 1;
    else if (dir === 'down') head.y += 1;
    else if (dir === 'left') head.x -= 1;
    else if (dir === 'right') head.x += 1;

    // Boundary wall collision check
    if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
      triggerGameOver(snakeRef.current.length - 3); // Score is length - initial length
      return;
    }

    // Body self-collision check
    const selfCollision = snakeRef.current.some(part => part.x === head.x && part.y === head.y);
    if (selfCollision) {
      triggerGameOver(snakeRef.current.length - 3);
      return;
    }

    // Move body
    snakeRef.current.unshift(head);

    // Food collision
    let eaten = false;
    if (head.x === fruitRef.current.x && head.y === fruitRef.current.y) {
      eaten = true;
      setScore(prev => prev + 1);
      emitParticles(fruitRef.current.x, fruitRef.current.y, '#00ff88');
      playSound('eat', isMuted);
      fruitRef.current = generateRandomFood();

      // Chance to spawn golden fruit (15% chance)
      if (Math.random() < 0.15 && !goldenFruitRef.current) {
        goldenFruitRef.current = {
          ...generateRandomFood(),
          duration: 40 // ticks remaining
        };
      }
    }

    // Golden food collision
    if (goldenFruitRef.current && head.x === goldenFruitRef.current.x && head.y === goldenFruitRef.current.y) {
      eaten = true;
      setScore(prev => prev + 3);
      emitParticles(goldenFruitRef.current.x, goldenFruitRef.current.y, '#ffd700');
      playSound('golden', isMuted);
      goldenFruitRef.current = null;
    }

    if (!eaten) {
      snakeRef.current.pop();
    }

    // Golden fruit timeout countdown
    if (goldenFruitRef.current) {
      goldenFruitRef.current.duration -= 1;
      if (goldenFruitRef.current.duration <= 0) {
        goldenFruitRef.current = null;
      }
    }
  };

  // Keyboard controls state navigators
  const handleKeyboardNav = (code) => {
    const curState = gameStateRef.current;
    if (curState === 'LOBBY') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', isMuted);
        setMenuIndex(prev => {
          const next = prev === 0 ? 4 : prev - 1;
          menuIndexRef.current = next;
          return next;
        });
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', isMuted);
        setMenuIndex(prev => {
          const next = prev === 4 ? 0 : prev + 1;
          menuIndexRef.current = next;
          return next;
        });
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        playSound('click', isMuted);
        if (menuIndexRef.current === 1) {
          setDifficulty(prev => prev === 'hard' ? 'medium' : prev === 'medium' ? 'easy' : 'hard');
        } else if (menuIndexRef.current === 2) {
          setIsMuted(prev => !prev);
        }
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        playSound('click', isMuted);
        if (menuIndexRef.current === 1) {
          setDifficulty(prev => prev === 'easy' ? 'medium' : prev === 'medium' ? 'hard' : 'easy');
        } else if (menuIndexRef.current === 2) {
          setIsMuted(prev => !prev);
        }
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', isMuted);
        if (menuIndexRef.current === 0) {
          launchGameplay();
        } else if (menuIndexRef.current === 3) {
          setGameState('LEADERBOARD');
        } else if (menuIndexRef.current === 4) {
          window.location.href = '/UODGaming';
        }
      }
    } else if (curState === 'LEADERBOARD') {
      if (code === 'Space' || code === 'Enter' || code === 'Escape') {
        playSound('click', isMuted);
        setGameState('LOBBY');
        setMenuIndex(3);
      }
    } else if (curState === 'PAUSE') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', isMuted);
        setMenuIndex(prev => (prev === 0 ? 2 : prev - 1));
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', isMuted);
        setMenuIndex(prev => (prev === 2 ? 0 : prev + 1));
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', isMuted);
        if (menuIndexRef.current === 0) {
          setGameState('GAMEPLAY');
        } else if (menuIndexRef.current === 1) {
          launchGameplay();
        } else if (menuIndexRef.current === 2) {
          navigate('/UODGaming');
        }
      } else if (code === 'Escape') {
        playSound('click', isMuted);
        setGameState('GAMEPLAY');
      }
    } else if (curState === 'GAMEOVER') {
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', isMuted);
        setMenuIndex(prev => (prev === 0 ? 1 : 0));
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', isMuted);
        if (menuIndexRef.current === 0) {
          launchGameplay();
        } else {
          navigate('/UODGaming');
        }
      }
    } else if (curState === 'GAMEPLAY') {
      if (code === 'Escape' || code === 'KeyP') {
        playSound('click', isMuted);
        setGameState('PAUSE');
        setMenuIndex(0);
      } else if ((code === 'ArrowUp' || code === 'KeyW') && nextDirectionRef.current !== 'down') {
        inputQueueRef.current.push('up');
        nextDirectionRef.current = 'up';
      } else if ((code === 'ArrowDown' || code === 'KeyS') && nextDirectionRef.current !== 'up') {
        inputQueueRef.current.push('down');
        nextDirectionRef.current = 'down';
      } else if ((code === 'ArrowLeft' || code === 'KeyA') && nextDirectionRef.current !== 'right') {
        inputQueueRef.current.push('left');
        nextDirectionRef.current = 'left';
      } else if ((code === 'ArrowRight' || code === 'KeyD') && nextDirectionRef.current !== 'left') {
        inputQueueRef.current.push('right');
        nextDirectionRef.current = 'right';
      }
    }
  };

  // Keyboard keydown listener hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeStates = ['LOBBY', 'LEADERBOARD', 'PAUSE', 'GAMEOVER', 'GAMEPLAY'];
      if (activeStates.includes(gameStateRef.current)) {
        // Prevent scrolling with arrows/spacebar
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
        handleKeyboardNav(e.code);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse hover & click triggers on Canvas
  const handleCanvasClick = (e) => {
    const curState = gameStateRef.current;
    if (curState === 'GAMEPLAY') {
      playSound('click', isMuted);
      setGameState('PAUSE');
      setMenuIndex(0);
    }
  };

  // Main rendering & physics update hook
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      // 1. Clear Screen
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.shadowBlur = 0; // reset glows

      // Draw background space grids
      ctx.strokeStyle = '#060610';
      ctx.lineWidth = 1;
      for (let i = 0; i <= CELL_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
        ctx.stroke();
      }

      const curState = gameStateRef.current;

      // ----------------------------------------------------
      // STATE HANDLING
      // ----------------------------------------------------
      if (curState === 'PAUSE' || curState === 'GAMEOVER') {
        // Draw standard gameplay frame behind the DOM overlays
        drawActiveGameplay(ctx, time);
      } else if (curState === 'GAMEPLAY') {
        // Ticking logic
        const speed = getSpeed();
        if (time - lastTickRef.current > speed) {
          updatePhysics();
          lastTickRef.current = time;
        }

        drawActiveGameplay(ctx, time);
      }

      // request next frame
      requestRef.current = requestAnimationFrame(render);
    };

    // Helper to draw the actual snake and board
    const drawActiveGameplay = (c, time) => {
      // 1. Draw boundary glowing border
      c.shadowColor = '#00ff88';
      c.shadowBlur = 12;
      c.strokeStyle = '#00ff88';
      c.lineWidth = 4;
      c.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Faint neon inner grid dots for enhanced cyber graphics
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(0, 255, 136, 0.05)';
      for (let i = 1; i < CELL_COUNT; i++) {
        for (let j = 1; j < CELL_COUNT; j++) {
          c.fillRect(i * GRID_SIZE - 1, j * GRID_SIZE - 1, 2, 2);
        }
      }

      // 2. Draw Food (Neon pink pulsing apple with stem and leaf)
      const pulse = 1 + 0.15 * Math.sin(time * 0.007);
      const fx = fruitRef.current.x * GRID_SIZE + GRID_SIZE / 2;
      const fy = fruitRef.current.y * GRID_SIZE + GRID_SIZE / 2;
      const fRadius = (GRID_SIZE / 2 - 2) * pulse;

      c.shadowColor = '#ff007f';
      c.shadowBlur = 15;
      c.fillStyle = '#ff007f';
      c.beginPath();
      c.arc(fx, fy, fRadius, 0, Math.PI * 2);
      c.fill();

      // Stem & Leaf
      c.shadowBlur = 0;
      c.strokeStyle = '#8b5a2b'; // brown stem
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(fx, fy - fRadius);
      c.quadraticCurveTo(fx + 2, fy - fRadius - 4, fx + 4, fy - fRadius - 5);
      c.stroke();
      
      c.fillStyle = '#00ff88'; // green leaf
      c.beginPath();
      c.ellipse(fx + 3, fy - fRadius - 3, 2, 4, Math.PI / 4, 0, Math.PI * 2);
      c.fill();

      // 3. Draw Golden Food if active (Glowing Diamond Star)
      if (goldenFruitRef.current) {
        c.shadowColor = '#ffd700';
        c.shadowBlur = 20;
        c.fillStyle = '#ffd700';
        const gx = goldenFruitRef.current.x * GRID_SIZE + GRID_SIZE / 2;
        const gy = goldenFruitRef.current.y * GRID_SIZE + GRID_SIZE / 2;
        const gSize = (GRID_SIZE / 2) * (1 + 0.2 * Math.sin(time * 0.01));

        c.beginPath();
        c.moveTo(gx, gy - gSize);
        c.lineTo(gx + gSize / 2, gy - gSize / 2);
        c.lineTo(gx + gSize, gy);
        c.lineTo(gx + gSize / 2, gy + gSize / 2);
        c.lineTo(gx, gy + gSize);
        c.lineTo(gx - gSize / 2, gy + gSize / 2);
        c.lineTo(gx - gSize, gy);
        c.lineTo(gx - gSize / 2, gy - gSize / 2);
        c.closePath();
        c.fill();
      }

      // 4. Draw Snake with tapered tail, rounded parts, and directional eyes
      const snake = snakeRef.current;
      snake.forEach((part, index) => {
        const isHead = index === 0;
        const px = part.x * GRID_SIZE;
        const py = part.y * GRID_SIZE;
        
        // Taper segments slightly towards the tail
        const maxTaper = 6;
        const taper = Math.min(maxTaper, index * 0.3);
        const size = GRID_SIZE - taper;
        const offset = taper / 2;

        if (isHead) {
          c.shadowColor = '#00ff88';
          c.shadowBlur = 12;
          c.fillStyle = '#ffffff'; // white core head for high contrast
          c.beginPath();
          c.roundRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2, 6);
          c.fill();

          // Draw neon green eyes based on direction
          c.shadowBlur = 0;
          c.fillStyle = '#00ff88';
          const eyeSize = 3;
          let e1x = 0, e1y = 0, e2x = 0, e2y = 0;
          const dir = directionRef.current;

          if (dir === 'right') {
            e1x = px + GRID_SIZE - 6; e1y = py + 5;
            e2x = px + GRID_SIZE - 6; e2y = py + GRID_SIZE - 8;
          } else if (dir === 'left') {
            e1x = px + 4; e1y = py + 5;
            e2x = px + 4; e2y = py + GRID_SIZE - 8;
          } else if (dir === 'up') {
            e1x = px + 5; e1y = py + 4;
            e2x = px + GRID_SIZE - 8; e2y = py + 4;
          } else if (dir === 'down') {
            e1x = px + 5; e1y = py + GRID_SIZE - 6;
            e2x = px + GRID_SIZE - 8; e2y = py + GRID_SIZE - 6;
          }

          c.beginPath();
          c.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
          c.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
          c.fill();

          // Dark pupil centers
          c.fillStyle = '#000000';
          c.beginPath();
          c.arc(e1x, e1y, 1.2, 0, Math.PI * 2);
          c.arc(e2x, e2y, 1.2, 0, Math.PI * 2);
          c.fill();
        } else {
          c.shadowColor = '#00bb66';
          c.shadowBlur = 6;
          // Gradient fading from bright green to dark forest green towards tail
          const greenVal = Math.max(100, 255 - index * 6);
          c.fillStyle = `rgb(0, ${greenVal}, ${Math.floor(greenVal * 0.5)})`;
          
          c.beginPath();
          c.roundRect(px + offset, py + offset, size, size, 4);
          c.fill();
        }
      });

      // 5. Draw and update particles
      particlesRef.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        
        if (p.alpha <= 0) {
          particlesRef.current.splice(index, 1);
        } else {
          c.shadowColor = p.color;
          c.shadowBlur = 8;
          c.fillStyle = p.color;
          c.globalAlpha = p.alpha;
          c.beginPath();
          c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          c.fill();
        }
      });
      c.globalAlpha = 1.0; // reset
    };

    // start drawing loop
    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, difficulty, menuIndex, isMuted, leaderboard, leaderboardLoading, submitStatus, rewards]);

  return (
    <div className="snake-container">
      {/* Centered Logo-Aligned Floating Circular Back Button */}
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
        <div className="cabinet-screen crt-screen" onClick={handleCanvasClick}>
          {/* CRT scanlines, reflection and flicker overlay */}
          <div className="crt-scanlines"></div>
          <div className="crt-reflection"></div>
          <div className="crt-flicker"></div>

          {/* DOM OVERLAYS */}
          {gameState === 'LOBBY' && (
            <div className="snake-overlay">
              <h1 className="snake-title">SNAKE PROTOCOL</h1>
              <p className="snake-subtitle">RETRO ARCADE TERMINAL V1.0.4</p>
              
              <div className="snake-menu">
                <button 
                  className={`snake-btn ${menuIndex === 0 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(0)}
                  onClick={() => { playSound('click', isMuted); launchGameplay(); }}
                >
                  START RUN
                </button>
                <button 
                  className={`snake-btn ${menuIndex === 1 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(1)}
                  onClick={() => { playSound('click', isMuted); setDifficulty(prev => prev === 'easy' ? 'medium' : prev === 'medium' ? 'hard' : 'easy'); }}
                >
                  DIFFICULTY: {difficulty}
                </button>
                <button 
                  className={`snake-btn ${menuIndex === 2 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(2)}
                  onClick={() => { playSound('click', isMuted); setIsMuted(prev => !prev); }}
                >
                  AUDIO: {isMuted ? 'OFF' : 'ON'}
                </button>
                <button 
                  className={`snake-btn ${menuIndex === 3 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(3)}
                  onClick={() => { playSound('click', isMuted); setGameState('LEADERBOARD'); }}
                >
                  LEADERBOARD
                </button>
                <button 
                  className={`snake-btn ${menuIndex === 4 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(4)}
                  onClick={() => { playSound('click', isMuted); window.location.href = '/UODGaming'; }}
                >
                  EXIT TO MENU
                </button>
              </div>
            </div>
          )}

          {gameState === 'LEADERBOARD' && (
            <div className="snake-overlay">
              <h1 className="snake-title" style={{ fontSize: '28px' }}>SYSTEM RANKINGS</h1>
              <p className="snake-subtitle">TOP CYBERNETIC COGNITION RUNNERS</p>

              <div className="snake-leaderboard-container">
                {leaderboardLoading ? (
                  <div className="snake-leaderboard-item" style={{ justifyContent: 'center', color: '#8888a0' }}>QUERYING NET NODES...</div>
                ) : (
                  (leaderboard.length > 0 ? leaderboard : [
                    { username: "CYBER_NINJA", score: 450 },
                    { username: "NEON_RIDER", score: 380 },
                    { username: "RETRO_BOY", score: 310 },
                    { username: "GRID_RUNNER", score: 260 },
                    { username: "SNAKE_MASTER", score: 210 }
                  ]).slice(0, 15).map((entry, idx) => (
                    <div className="snake-leaderboard-item" key={idx}>
                      <span style={{ color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#b4b4c8', width: '30px' }}>{String(idx + 1).padStart(2, '0')}</span>
                      <span style={{ flex: 1, textAlign: 'left', color: '#fff' }}>{entry.username || (entry.user && entry.user.username) || "PLAYER"}</span>
                      <span style={{ color: '#00ff88' }}>{entry.score}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="snake-menu">
                <button 
                  className={`snake-btn selected`}
                  onClick={() => { playSound('click', isMuted); setGameState('LOBBY'); setMenuIndex(3); }}
                >
                  BACK TO LOBBY
                </button>
              </div>
            </div>
          )}

          {gameState === 'PAUSE' && (
            <div className="snake-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
              <h1 className="snake-title" style={{ color: '#ff007f', textShadow: '0 0 15px rgba(255, 0, 127, 0.8)' }}>SYSTEM PAUSED</h1>
              <p className="snake-subtitle" style={{ marginBottom: '60px' }}></p>
              
              <div className="snake-menu">
                {['RESUME', 'RESTART', 'QUIT TO MENU'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`snake-btn ${menuIndex === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuIndex(idx)}
                    onClick={() => {
                      playSound('click', isMuted);
                      if (idx === 0) setGameState('GAMEPLAY');
                      else if (idx === 1) launchGameplay();
                      else setGameState('LOBBY');
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="snake-overlay" style={{ background: 'rgba(10, 5, 8, 0.96)' }}>
              <h1 className="snake-title" style={{ color: '#ff007f', textShadow: '0 0 20px rgba(255, 0, 127, 0.8)', fontSize: '42px' }}>GAME OVER</h1>
              <p className="snake-subtitle" style={{ color: '#00d4ff', fontSize: '20px', marginBottom: '5px' }}>CURRENT SCORE: {score}</p>
              <p className="snake-subtitle" style={{ color: '#00ff88', fontSize: '16px', marginBottom: '40px' }}>BEST SCORE: {highScore}</p>
              
              <div className="snake-menu">
                {['PLAY AGAIN', 'QUIT TO MENU'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`snake-btn ${menuIndex === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuIndex(idx)}
                    onClick={() => {
                      playSound('click', isMuted);
                      if (idx === 0) launchGameplay();
                      else setGameState('LOBBY');
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simple HUD on Canvas or as relative header block */}
          {gameState === 'GAMEPLAY' && (
            <div className="game-hud-container">
              <div className="game-hud-item">
                <span className="game-hud-label">Score</span>
                <span className="game-hud-value">{String(score).padStart(3, '0')}</span>
              </div>
              <div className="game-hud-item">
                <span className="game-hud-label">Diff</span>
                <span className="game-hud-value" style={{ color: 'var(--primary-neon)' }}>{difficulty.toUpperCase()}</span>
              </div>
              <div className="game-hud-item">
                <span className="game-hud-label">Best</span>
                <span className="game-hud-value" style={{ color: 'var(--accent-yellow)', textShadow: '0 0 8px rgba(255, 255, 0, 0.4)' }}>
                  {String(highScore).padStart(3, '0')}
                </span>
              </div>
            </div>
          )}

          <canvas 
            ref={canvasRef} 
            width={CANVAS_SIZE} 
            height={CANVAS_SIZE}
            style={{ display: 'block', background: '#020205', width: '100%', height: 'auto', maxWidth: '650px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Snake;
