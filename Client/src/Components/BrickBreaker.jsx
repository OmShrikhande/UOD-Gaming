import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/BrickBreaker.css';

// Audio Synthesis setup
let audioCtx = null;
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playSound = (type, isMuted) => {
  if (isMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'paddle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'brick') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'wall') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'lose') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(20, now + 1.0);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0, now + 1.0);
      osc.start(now);
      osc.stop(now + 1.0);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Audio Context init failed:", e);
  }
};

const BRICK_COLORS = ['#ff007f', '#ea580c', '#00d4ff', '#00ff88', '#8b5cf6'];
const CANVAS_SIZE = 600;

const LEVEL_LAYOUTS = [
  // Level 1: "The Wall"
  [
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1]
  ],
  // Level 2: "Space Invader"
  [
    [0,0,1,0,0,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,0,1],
    [1,0,1,0,0,1,0,1],
    [0,0,0,1,1,0,0,0]
  ],
  // Level 3: "The Fortress"
  [
    [2,2,2,2,2,2,2,2],
    [2,0,0,0,0,0,0,2],
    [2,0,1,1,1,1,0,2],
    [2,0,1,1,1,1,0,2],
    [2,0,0,0,0,0,0,2],
    [2,2,2,2,2,2,2,2]
  ],
  // Level 4: "Arrowhead"
  [
    [2,2,2,2,2,2,2,2],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,2,2,0,0,0],
    [0,0,0,1,1,0,0,0]
  ],
  // Level 5: "Checkerboard"
  [
    [2,0,2,0,2,0,2,0],
    [0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,0],
    [0,2,0,2,0,2,0,2],
    [2,0,2,0,2,0,2,0]
  ]
];

const BrickBreaker = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // Game states: LOBBY, GAMEPLAY, PAUSE, GAMEOVER
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

  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  useEffect(() => { levelRef.current = level; }, [level]);

  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('breakout_high_score') || '0', 10);
  });

  const [menuIndex, setMenuIndex] = useState(0);
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);

  const [isBallLaunched, setIsBallLaunched] = useState(false);
  const isBallLaunchedRef = useRef(false);
  useEffect(() => { isBallLaunchedRef.current = isBallLaunched; }, [isBallLaunched]);

  // Simulation references
  const paddleRef = useRef({ x: 255, width: 100, height: 12, lastX: 255, vx: 0 });
  const ballRef = useRef({ x: 300, y: 515, vx: 0, vy: 0, radius: 8, baseSpeed: 5.5, tail: [] });
  const bricksRef = useRef([]);
  const particlesRef = useRef([]);
  const keysRef = useRef({ left: false, right: false });
  const lastFrameTimeRef = useRef(0);
  const requestRef = useRef(null);
  const screenShakeRef = useRef(0);

  // Re-build bricks layout
  const buildBricks = () => {
    const list = [];
    const padding = 10;
    const brickW = 60;
    const brickH = 20;

    let layout = [];
    const currentLevelIndex = levelRef.current - 1;

    // Use predefined layout or procedurally generate
    if (currentLevelIndex < LEVEL_LAYOUTS.length) {
      layout = LEVEL_LAYOUTS[currentLevelIndex];
    } else {
      // Procedural Chaos for Level 6+
      const rows = 5 + Math.min(Math.floor((levelRef.current - 5) / 2), 4);
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < 4; c++) {
          // Symmetric generation
          const isGap = Math.random() > 0.7;
          let hp = 1;
          if (!isGap && Math.random() > 0.7) hp = 2;
          if (!isGap && Math.random() > 0.9) hp = 3; // Rare 3HP bricks
          row.push(isGap ? 0 : hp);
        }
        // Mirror the 4 columns to make 8 columns total
        const fullRow = [...row, ...[...row].reverse()];
        layout.push(fullRow);
      }
    }

    const cols = layout[0].length;
    const rows = layout.length;
    const totalGridWidth = cols * brickW + (cols - 1) * padding;
    const offsetLeft = (CANVAS_SIZE - totalGridWidth) / 2;
    const offsetTop = 100;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = layout[r][c];
        if (hp > 0) {
          list.push({
            x: c * (brickW + padding) + offsetLeft,
            y: r * (brickH + padding) + offsetTop,
            w: brickW,
            h: brickH,
            color: hp > 1 ? '#a0a0a0' : BRICK_COLORS[r % BRICK_COLORS.length],
            baseColor: BRICK_COLORS[r % BRICK_COLORS.length],
            active: true,
            hp: hp
          });
        }
      }
    }
    bricksRef.current = list;
  };

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color
      });
    }
  };

  const resetBall = () => {
    const paddle = paddleRef.current;
    const ball = ballRef.current;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = 515;
    ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -ball.baseSpeed;
    ball.tail = [];
    setIsBallLaunched(false);
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setIsBallLaunched(false);
    
    paddleRef.current.x = 250;
    paddleRef.current.width = 100;
    ballRef.current.baseSpeed = 5.5;
    particlesRef.current = [];
    
    buildBricks();
    resetBall();
    setGameState('GAMEPLAY');
    initAudio();
  };

  const triggerBallLaunch = () => {
    if (gameStateRef.current === 'GAMEPLAY' && !isBallLaunchedRef.current) {
      initAudio();
      setIsBallLaunched(true);
      playSound('paddle', mutedRef.current);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeStates = ['LOBBY', 'GAMEOVER', 'GAMEPLAY'];
      if (activeStates.includes(gameStateRef.current)) {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
      }

      if (gameStateRef.current === 'GAMEPLAY') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
        if (e.code === 'Space') triggerBallLaunch();
        if (e.code === 'Escape') setGameState('LOBBY'); // Simple exit back to lobby
      } else if (gameStateRef.current === 'LOBBY') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
          playSound('click', mutedRef.current);
          setMenuIndex(prev => (prev === 0 ? 1 : 0));
        } else if (e.code === 'Space' || e.code === 'Enter') {
          playSound('click', mutedRef.current);
          if (menuIndexRef.current === 0) startGame();
          else window.location.href = '/UODGaming';
        }
      } else if (gameStateRef.current === 'GAMEOVER') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
          playSound('click', mutedRef.current);
          setMenuIndex(prev => (prev === 0 ? 1 : 0));
        } else if (e.code === 'Space' || e.code === 'Enter') {
          playSound('click', mutedRef.current);
          if (menuIndexRef.current === 0) {
            startGame();
          } else {
            setGameState('LOBBY');
          }
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

  // Mouse Move tracking
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || gameStateRef.current !== 'GAMEPLAY') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    const paddle = paddleRef.current;
    paddle.x = Math.max(0, Math.min(CANVAS_SIZE - paddle.width, mouseX - paddle.width / 2));

    if (!isBallLaunchedRef.current) {
      ballRef.current.x = paddle.x + paddle.width / 2;
    }
  };

  const handleCanvasClick = (e) => {
    initAudio();
    if (gameStateRef.current === 'GAMEPLAY') {
      triggerBallLaunch();
    }
  };

  // Main Physics and Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
      const dt = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      // dt multiplier for 60fps baseline
      const dtMult = Math.min(dt / 16.666, 3);

      // --- PHYSICS UPDATE ---
      if (gameStateRef.current === 'GAMEPLAY') {
        const paddle = paddleRef.current;
        const ball = ballRef.current;
        const keys = keysRef.current;

        // Screen Shake decay
        if (screenShakeRef.current > 0) {
          screenShakeRef.current -= 1 * dtMult;
          if (screenShakeRef.current < 0) screenShakeRef.current = 0;
        }

        // Paddle Velocity Tracking
        if (paddle.lastX === undefined) paddle.lastX = paddle.x;
        
        if (keys.left) paddle.x = Math.max(0, paddle.x - 9 * dtMult);
        if (keys.right) paddle.x = Math.min(CANVAS_SIZE - paddle.width, paddle.x + 9 * dtMult);

        paddle.vx = (paddle.x - paddle.lastX) / dtMult;
        paddle.lastX = paddle.x;

        if (!isBallLaunchedRef.current) {
          ball.x = paddle.x + paddle.width / 2;
          ball.y = 515;
        } else {
          // Ball movement
          ball.x += ball.vx * dtMult;
          ball.y += ball.vy * dtMult;

          // Trail tracking
          ball.tail.push({ x: ball.x, y: ball.y });
          if (ball.tail.length > 7) ball.tail.shift();

          // Max velocity clamping
          const maxSpeed = 15;
          const currentSpeedSq = ball.vx * ball.vx + ball.vy * ball.vy;
          if (currentSpeedSq > maxSpeed * maxSpeed) {
             const currentSpeed = Math.sqrt(currentSpeedSq);
             ball.vx = (ball.vx / currentSpeed) * maxSpeed;
             ball.vy = (ball.vy / currentSpeed) * maxSpeed;
          }

          // Wall bounces
          if (ball.x + ball.radius >= CANVAS_SIZE) {
            ball.x = CANVAS_SIZE - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            playSound('wall', mutedRef.current);
            screenShakeRef.current = 2;
          } else if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            playSound('wall', mutedRef.current);
            screenShakeRef.current = 2;
          }

          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            playSound('wall', mutedRef.current);
            screenShakeRef.current = 2;
          }

          // Lose life
          if (ball.y + ball.radius >= CANVAS_SIZE) {
            if (livesRef.current > 1) {
              playSound('lose', mutedRef.current);
              setLives(livesRef.current - 1);
              resetBall();
              screenShakeRef.current = 10;
            } else if (livesRef.current === 1) {
              playSound('gameover', mutedRef.current);
              setLives(0);
              setGameState('GAMEOVER');
              gameStateRef.current = 'GAMEOVER'; // Stop physics loop immediately
              screenShakeRef.current = 20;
              
              // Trigger physical device vibration if supported
              if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
              }
            }
          }

          // Paddle bounce
          if (
            ball.y + ball.radius >= 530 &&
            ball.y - ball.radius <= 534 &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width &&
            ball.vy > 0
          ) {
            playSound('paddle', mutedRef.current);
            screenShakeRef.current = 3;
            
            // Progressive ball acceleration
            ball.baseSpeed = Math.min(ball.baseSpeed + 0.15, 12);
            
            // Dynamic angle math
            const relativeX = ball.x - (paddle.x + paddle.width / 2);
            const normalized = relativeX / (paddle.width / 2);
            const maxAngle = Math.PI / 2.5; // Slightly steeper than Math.PI/3
            const angle = normalized * maxAngle;
            
            const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy) || ball.baseSpeed;
            const newSpeed = Math.max(speed, ball.baseSpeed);
            
            // Transfer paddle momentum (spin) to horizontal velocity
            const spinAmount = paddle.vx * 0.35;
            
            ball.vx = newSpeed * Math.sin(angle) + spinAmount;
            ball.vy = -newSpeed * Math.cos(angle);
            ball.y = 530 - ball.radius;
          }

          // Bricks collision loop
          let activeCount = 0;
          const bricks = bricksRef.current;
          for (let i = 0; i < bricks.length; i++) {
            const brick = bricks[i];
            if (!brick.active) continue;
            activeCount++;

            const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
            const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));

            const distanceX = ball.x - closestX;
            const distanceY = ball.y - closestY;
            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            if (distanceSquared <= (ball.radius * ball.radius)) {
              playSound('brick', mutedRef.current);
              screenShakeRef.current = 5;
              
              brick.hp -= 1;
              if (brick.hp <= 0) {
                brick.active = false;
                spawnParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.baseColor);
                setScore(prev => {
                  const nextScore = prev + (levelRef.current * 10);
                  if (nextScore > highScore) {
                    localStorage.setItem('breakout_high_score', nextScore.toString());
                    setHighScore(nextScore);
                  }
                  return nextScore;
                });
                activeCount--;
              } else {
                // Change color if damaged (e.g., from 3 to 2, or 2 to 1)
                if (brick.hp === 2) {
                  brick.color = '#e0e0e0';
                  spawnParticles(closestX, closestY, '#e0e0e0');
                } else if (brick.hp === 1) {
                  brick.color = brick.baseColor;
                  spawnParticles(closestX, closestY, brick.baseColor);
                }
              }
              
              // Accurate AABB collision to flip vx or vy
              const overlapLeft = (ball.x + ball.radius) - brick.x;
              const overlapRight = (brick.x + brick.w) - (ball.x - ball.radius);
              const overlapTop = (ball.y + ball.radius) - brick.y;
              const overlapBottom = (brick.y + brick.h) - (ball.y - ball.radius);

              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

              // Add a slight variance to prevent infinite loop bouncing between two vertical bricks
              const variance = (Math.random() - 0.5) * 0.5;

              if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                ball.vx = -ball.vx + variance;
              } else {
                ball.vy = -ball.vy + variance;
              }

              break;
            }
          }

          // Level advanced
          if (activeCount === 0 && bricks.length > 0) {
            playSound('win', mutedRef.current);
            setLevel(prev => {
              const nextLvl = prev + 1;
              ball.baseSpeed += 0.8;
              buildBricks();
              resetBall();
              return nextLvl;
            });
          }
        }
      }

      // Update Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx * dtMult;
        p.y += p.vy * dtMult;
        p.life -= 0.02 * dtMult;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // --- RENDERING ---
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.save();

      // Apply screen shake
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
      }

      // Draw Grid Background
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 60, 0);
        ctx.lineTo(i * 60, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 60);
        ctx.lineTo(CANVAS_SIZE, i * 60);
        ctx.stroke();
      }

      // Draw Bricks
      const bricks = bricksRef.current;
      for (let i = 0; i < bricks.length; i++) {
        const brick = bricks[i];
        if (brick.active) {
          ctx.shadowColor = brick.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
          
          // Inner gloss
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(brick.x, brick.y, brick.w, brick.h / 3);
        }
      }

      // Draw Particles
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Draw Paddle
      const paddle = paddleRef.current;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.roundRect(paddle.x, 530, paddle.width, paddle.height, 6);
      ctx.fill();

      // Draw Ball Trail
      const ball = ballRef.current;
      if (ball.tail.length > 0) {
        ctx.beginPath();
        ctx.moveTo(ball.tail[0].x, ball.tail[0].y);
        for (let i = 1; i < ball.tail.length; i++) {
          ctx.lineTo(ball.tail[i].x, ball.tail[i].y);
        }
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.lineWidth = ball.radius * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';
        ctx.stroke();
      }

      // Draw Ball
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();



      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="brickbreaker-page-wrapper">
      {/* Floating Circular Back Button */}
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
          
          {gameState === 'GAMEPLAY' && (
            <div className="game-hud-container">
              <div className="game-hud-item">
                <span className="game-hud-label">Score</span>
                <span className="game-hud-value">{String(score).padStart(3, '0')}</span>
              </div>
              <div className="game-hud-item">
                <span className="game-hud-label">Lvl</span>
                <span className="game-hud-value" style={{ color: 'var(--primary-neon)' }}>{level}</span>
              </div>
              <div className="game-hud-item">
                <span className="game-hud-label">Lives</span>
                <span className="game-hud-value" style={{ color: '#ff0055' }}>{'❤️'.repeat(lives)}</span>
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
          className="brickbreaker-canvas"
          onMouseMove={handleCanvasMouseMove}
          onClick={handleCanvasClick}
        />

        {/* DOM OVERLAYS */}
        {gameState === 'LOBBY' && (
          <div className="brickbreaker-overlay">
            <h1 className="brickbreaker-title">NEON BRICK BREAKER</h1>
            <p className="brickbreaker-subtitle">SPACEBAR TO LAUNCH</p>
            
            <div className="brickbreaker-menu">
              <button 
                className={`brickbreaker-btn ${menuIndex === 0 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(0)}
                onClick={() => { playSound('click', mutedRef.current); startGame(); }}
              >
                INITIALIZE SEQUENCE
              </button>
              <button 
                className={`brickbreaker-btn ${menuIndex === 1 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(1)}
                onClick={() => { playSound('click', mutedRef.current); window.location.href = '/UODGaming'; }}
              >
                EXIT TO MENU
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="brickbreaker-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
            <h1 className="brickbreaker-title" style={{ color: '#ff007f', textShadow: '0 0 20px rgba(255, 0, 127, 0.8)' }}>GAME OVER</h1>
            <p className="brickbreaker-subtitle" style={{ color: '#00d4ff', fontSize: '20px', marginBottom: '5px' }}>CURRENT SCORE: {score}</p>
            <p className="brickbreaker-subtitle" style={{ color: '#00ff88', fontSize: '16px', marginBottom: '40px' }}>BEST SCORE: {highScore}</p>
            
            <div className="brickbreaker-menu">
              <button 
                className={`brickbreaker-btn ${menuIndex === 0 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(0)}
                onClick={() => { playSound('click', mutedRef.current); startGame(); }}
              >
                PLAY AGAIN
              </button>
              <button 
                className={`brickbreaker-btn ${menuIndex === 1 ? 'selected' : ''}`}
                onMouseEnter={() => setMenuIndex(1)}
                onClick={() => { playSound('click', mutedRef.current); setGameState('LOBBY'); }}
              >
                QUIT TO MENU
              </button>
            </div>
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );
};

export default BrickBreaker;
