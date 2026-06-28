import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/SpaceObstacle.css';

// Web Audio API Synth
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
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'crash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(100, now);
      osc2.frequency.exponentialRampToValueAtTime(20, now + 0.5);
      osc2.connect(gain);
      osc2.start(now);
      osc2.stop(now + 0.5);
      
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Audio Context init failed:", e);
  }
};

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

const SpaceObstacle = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // States
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('space_obstacle_high_score') || '0', 10));
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, GAMEPLAY, GAMEOVER
  const [menuIndex, setMenuIndex] = useState(0);
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);
  const [muted, setMuted] = useState(false);

  // Game Refs (mutated in animation frame)
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const mutedRef = useRef(muted);
  const keysRef = useRef({ left: false, right: false });

  const lastTimeRef = useRef(0);
  const requestRef = useRef(null);
  const screenShakeRef = useRef(0);
  
  // Game Entities
  const playerRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80, width: 30, height: 40, vx: 0, speed: 400 });
  const asteroidsRef = useRef([]);
  const starsRef = useRef([]);
  const particlesRef = useRef([]);
  
  const difficultyRef = useRef({ baseMulti: 1, speedMultiplier: 1, baseSpawn: 1200, spawnRate: 1500, lastSpawn: 0 });
  const currentDifficultyRef = useRef(1); // 0=Easy, 1=Medium, 2=Hard

  // Sync refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const initAudio = () => {
    playSound('init', true);
  };

  // Starfield initialization
  const initStars = () => {
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 50 + 20,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
    starsRef.current = stars;
  };

  useEffect(() => {
    initStars();
  }, []);

  const spawnAsteroid = () => {
    const size = Math.random() * 30 + 20; // 20 to 50
    const x = Math.random() * (CANVAS_WIDTH - size * 2) + size;
    const baseSpeed = 150;
    const speed = (baseSpeed + Math.random() * 100) * difficultyRef.current.speedMultiplier;
    
    // Generate a jagged polygon shape
    const points = [];
    const numPoints = Math.floor(Math.random() * 5) + 5; // 5 to 9 points
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = size * (0.7 + Math.random() * 0.3);
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }

    asteroidsRef.current.push({
      x,
      y: -size,
      size,
      speed,
      points,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 2 // radians per second
    });
  };

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 300,
        vy: (Math.random() - 0.5) * 300,
        life: 1.0,
        color
      });
    }
  };

  const startGame = () => {
    setScore(0);
    setGameState('GAMEPLAY');
    setMenuIndex(0);
    initAudio();
    
    playerRef.current.x = CANVAS_WIDTH / 2;
    playerRef.current.vx = 0;
    asteroidsRef.current = [];
    particlesRef.current = [];
    
    let baseMulti = 1.0;
    let baseSpawn = 1200;
    if (currentDifficultyRef.current === 0) {
      baseMulti = 0.8;
      baseSpawn = 1500;
    } else if (currentDifficultyRef.current === 2) {
      baseMulti = 1.4;
      baseSpawn = 800;
    }

    difficultyRef.current = { 
      baseMulti,
      speedMultiplier: baseMulti, 
      baseSpawn,
      spawnRate: baseSpawn, 
      lastSpawn: performance.now() 
    };
    lastTimeRef.current = performance.now();
  };

  const gameOver = () => {
    setGameState('GAMEOVER');
    playSound('crash', mutedRef.current);
    screenShakeRef.current = 20;
    
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    
    // Submit score
    if (scoreRef.current > highScore) {
      localStorage.setItem('space_obstacle_high_score', scoreRef.current.toString());
      setHighScore(scoreRef.current);
    }
    
    axios.post('/api/v1/games/score', {
      score: scoreRef.current
    }).catch(err => console.error("Score submit error", err));
  };

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeStates = ['LOBBY', 'GAMEOVER', 'GAMEPLAY', 'PAUSE'];
      if (!activeStates.includes(gameStateRef.current)) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      const curState = gameStateRef.current;
      if (curState === 'GAMEPLAY') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
        if (e.code === 'Escape' || e.code === 'KeyP') {
          setGameState('PAUSE');
          setMenuIndex(0);
        }
      } else if (curState === 'PAUSE') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          setGameState('GAMEPLAY');
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          playSound('click', mutedRef.current);
          setMenuIndex(prev => {
            const next = prev > 0 ? prev - 1 : 2;
            menuIndexRef.current = next;
            return next;
          });
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          playSound('click', mutedRef.current);
          setMenuIndex(prev => {
            const next = prev < 2 ? prev + 1 : 0;
            menuIndexRef.current = next;
            return next;
          });
        } else if (e.code === 'Space' || e.code === 'Enter') {
          playSound('click', mutedRef.current);
          if (menuIndexRef.current === 0) setGameState('GAMEPLAY');
          else if (menuIndexRef.current === 1) startGame();
          else setGameState('LOBBY');
        }
      } else if (curState === 'LOBBY') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          playSound('click', mutedRef.current);
          setMenuIndex(prev => {
            const next = prev > 0 ? prev - 1 : 3;
            menuIndexRef.current = next;
            return next;
          });
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          playSound('click', mutedRef.current);
          setMenuIndex(prev => {
            const next = prev < 3 ? prev + 1 : 0;
            menuIndexRef.current = next;
            return next;
          });
        } else if (e.code === 'Space' || e.code === 'Enter') {
          playSound('click', mutedRef.current);
          if (menuIndexRef.current === 3) {
            window.location.href = '/UODGaming';
          } else {
            currentDifficultyRef.current = menuIndexRef.current;
            startGame();
          }
        }
      } else if (curState === 'GAMEOVER') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
          playSound('click', mutedRef.current);
          setMenuIndex(prev => {
            const next = prev === 0 ? 1 : 0;
            menuIndexRef.current = next;
            return next;
          });
        } else if (e.code === 'Space' || e.code === 'Enter') {
          playSound('click', mutedRef.current);
          if (menuIndexRef.current === 0) startGame();
          else setGameState('LOBBY');
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    initAudio();
    const curState = gameState;
    if (curState === 'GAMEPLAY') {
      // Game loop handles touch events and keys, no clicks inside gameplay except maybe something custom
    }
  };

  // Mobile Touch Controls
  const handleTouchStart = (e) => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    if (touchX < rect.width / 2) {
      keysRef.current.left = true;
      keysRef.current.right = false;
    } else {
      keysRef.current.right = true;
      keysRef.current.left = false;
    }
  };

  const handleTouchEnd = () => {
    keysRef.current.left = false;
    keysRef.current.right = false;
  };

  // Main Loop
  useEffect(() => {
    const render = (time) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const dt = (time - (lastTimeRef.current || time)) / 1000;
      lastTimeRef.current = time;

      ctx.save();

      // Screen Shake
      if (screenShakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * screenShakeRef.current;
        const dy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(dx, dy);
        screenShakeRef.current *= 0.9;
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
      }

      // Draw Background
      ctx.fillStyle = '#020106';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update and Draw Stars
      ctx.fillStyle = '#ffffff';
      starsRef.current.forEach(star => {
        if (gameStateRef.current === 'GAMEPLAY') {
          // Speed up stars based on difficulty
          star.y += star.speed * dt * (1 + (difficultyRef.current.speedMultiplier - 1) * 2);
        } else {
          star.y += star.speed * dt * 0.2; // Slow idle scroll
        }

        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }

        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      if (gameStateRef.current === 'GAMEPLAY') {
        const player = playerRef.current;
        const diff = difficultyRef.current;

        // Player Movement
        if (keysRef.current.left) player.vx -= 1500 * dt;
        else if (keysRef.current.right) player.vx += 1500 * dt;
        else player.vx *= 0.85; // Friction

        // Limit speed
        if (player.vx > player.speed) player.vx = player.speed;
        if (player.vx < -player.speed) player.vx = -player.speed;

        player.x += player.vx * dt;

        // Screen bounds
        if (player.x - player.width / 2 < 0) {
          player.x = player.width / 2;
          player.vx = 0;
        }
        if (player.x + player.width / 2 > CANVAS_WIDTH) {
          player.x = CANVAS_WIDTH - player.width / 2;
          player.vx = 0;
        }

        // Score tracking
        setScore(prev => prev + 1);

        // Difficulty scaling
        diff.speedMultiplier = diff.baseMulti + (scoreRef.current / 5000);
        diff.spawnRate = Math.max(400, diff.baseSpawn - (scoreRef.current / 10));

        // Spawning
        if (time - diff.lastSpawn > diff.spawnRate) {
          spawnAsteroid();
          diff.lastSpawn = time;
        }

        // Update Asteroids
        for (let i = asteroidsRef.current.length - 1; i >= 0; i--) {
          const ast = asteroidsRef.current[i];
          ast.y += ast.speed * dt;
          ast.rotation += ast.rotSpeed * dt;

          // Collision Detection (Circle vs Circle approximation)
          const dx = player.x - ast.x;
          // Player visual center is slightly lower than y
          const dy = (player.y + 10) - ast.y; 
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < ast.size + (player.width / 2) - 5) {
            // CRASH!
            spawnParticles(player.x, player.y, '#00d4ff');
            spawnParticles(ast.x, ast.y, '#ea580c');
            gameOver();
            break;
          }

          if (ast.y - ast.size > CANVAS_HEIGHT) {
            asteroidsRef.current.splice(i, 1);
          }
        }
      }

      // Draw Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 1.0 * dt;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Draw Asteroids
      asteroidsRef.current.forEach(ast => {
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rotation);
        
        ctx.beginPath();
        ctx.moveTo(ast.points[0].x, ast.points[0].y);
        for (let i = 1; i < ast.points.length; i++) {
          ctx.lineTo(ast.points[i].x, ast.points[i].y);
        }
        ctx.closePath();
        
        ctx.strokeStyle = '#ea580c'; // Neon Orange
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 15;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(234, 88, 12, 0.1)';
        ctx.fill();
        ctx.restore();
      });

      // Draw Player (Only if not game over immediately, or draw explosion)
      if (gameStateRef.current !== 'GAMEOVER' || screenShakeRef.current === 0) {
        const player = playerRef.current;
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Tilt based on velocity
        const tilt = (player.vx / player.speed) * 0.3;
        ctx.rotate(tilt);

        // Thruster
        ctx.beginPath();
        ctx.moveTo(-10, 15);
        ctx.lineTo(0, 15 + Math.random() * 20 + 10);
        ctx.lineTo(10, 15);
        ctx.closePath();
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.fill();

        // Ship Body (Neon Triangle)
        ctx.beginPath();
        ctx.moveTo(0, -player.height / 2); // Nose
        ctx.lineTo(-player.width / 2, player.height / 2); // Bottom Left
        ctx.lineTo(player.width / 2, player.height / 2); // Bottom Right
        ctx.closePath();
        
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 15;
        ctx.stroke();
        
        ctx.fillStyle = '#050508';
        ctx.fill();
        
        ctx.restore();
      }

      ctx.restore();

      // UI overlays are now handled by DOM


      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
  }, [highScore, menuIndex]);

  return (
    <div className="spaceobstacle-page-wrapper">
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

      <motion.div 
        className="game-content-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="cabinet-screen crt-screen">
          <div className="crt-scanlines"></div>
          <div className="crt-reflection"></div>
          <div className="crt-flicker"></div>

          <div className="spaceobstacle-header" style={{ position: 'absolute', top: 0, width: '100%', boxSizing: 'border-box', zIndex: 11, padding: '15px' }}>
            <h1 className="so-title">SPACE OBSTACLE</h1>
            <div className="so-stats">
              <div className="so-stat-item"><span>DISTANCE</span>{score}</div>
              <div className="so-stat-item"><span>BEST</span>{highScore}</div>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="spaceobstacle-canvas"
            style={{ display: 'block', background: '#020106', width: '100%', height: 'auto' }}
            onClick={handleCanvasClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          
          {/* DOM OVERLAYS */}
          {gameState === 'LOBBY' && (
            <div className="spaceobstacle-overlay">
              <h1 className="spaceobstacle-title" style={{ color: '#00ff88', textShadow: '0 0 20px rgba(0, 255, 136, 0.8)' }}>SPACE OBSTACLE</h1>
              <p className="spaceobstacle-subtitle" style={{ marginBottom: '60px' }}></p>
              
              <div className="spaceobstacle-menu">
                {['EASY', 'MEDIUM', 'HARD'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`spaceobstacle-btn ${menuIndex === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuIndex(idx)}
                    onClick={() => { playSound('click', mutedRef.current); currentDifficultyRef.current = idx; startGame(); }}
                  >
                    {text}
                  </button>
                ))}
                <button 
                  className={`spaceobstacle-btn ${menuIndex === 3 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(3)}
                  onClick={() => { playSound('click', mutedRef.current); window.location.href = '/UODGaming'; }}
                >
                  EXIT TO MENU
                </button>
              </div>
              <p className="spaceobstacle-subtitle" style={{ marginTop: '40px', fontSize: '12px' }}>USE LEFT/RIGHT ARROWS OR TOUCH SIDES TO STEER</p>
            </div>
          )}

          {gameState === 'PAUSE' && (
            <div className="spaceobstacle-overlay" style={{ background: 'rgba(2, 1, 6, 0.96)' }}>
              <h1 className="spaceobstacle-title" style={{ color: '#00d4ff', textShadow: '0 0 20px rgba(0, 212, 255, 0.8)' }}>PAUSED</h1>
              <p className="spaceobstacle-subtitle" style={{ marginBottom: '60px' }}></p>
              
              <div className="spaceobstacle-menu">
                {['RESUME', 'RESTART', 'QUIT TO MENU'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`spaceobstacle-btn ${menuIndex === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuIndex(idx)}
                    onClick={() => {
                      playSound('click', mutedRef.current);
                      if (idx === 0) setGameState('GAMEPLAY');
                      else if (idx === 1) startGame();
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
            <div className="spaceobstacle-overlay" style={{ background: 'rgba(2, 1, 6, 0.96)' }}>
              <h1 className="spaceobstacle-title" style={{ color: '#ff007f', textShadow: '0 0 20px rgba(255, 0, 127, 0.8)' }}>GAME OVER</h1>
              <p className="spaceobstacle-subtitle" style={{ color: '#00d4ff', fontSize: '20px', marginBottom: '5px' }}>CURRENT SCORE: {score}</p>
              <p className="spaceobstacle-subtitle" style={{ color: '#00ff88', fontSize: '16px', marginBottom: '40px' }}>BEST SCORE: {highScore}</p>
              
              <div className="spaceobstacle-menu">
                {['PLAY AGAIN', 'QUIT TO MENU'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`spaceobstacle-btn ${menuIndex === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuIndex(idx)}
                    onClick={() => {
                      playSound('click', mutedRef.current);
                      if (idx === 0) startGame();
                      else setGameState('LOBBY');
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpaceObstacle;
