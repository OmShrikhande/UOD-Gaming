import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/TowerStack.css';

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
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.08);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'place') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'chop') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'perfect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'lose') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(55, now + 0.4);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'restart') {
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

const NEON_COLORS = ['#ff007f', '#ea580c', '#eab308', '#00ff88', '#00d4ff', '#a855f7'];

const TowerStack = () => {
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

  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('stack_high_score') || '0', 10);
  });

  // Menu navigation index
  const [menuIndex, setMenuIndex] = useState(0);
  const menuIndexRef = useRef(0);
  useEffect(() => { menuIndexRef.current = menuIndex; }, [menuIndex]);

  // API sync states
  const [gameId, setGameId] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [rewards, setRewards] = useState(null);

  // Canvas Refs & loops
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  // Simulation physics parameters
  const blocksRef = useRef([]); // { x, w, color, isPerfect }
  const debrisRef = useRef([]); // { x, y, w, color, vy, alpha }
  const slidingBlockRef = useRef({ x: 0, w: 160, direction: 1, baseSpeed: 3.5 });
  const cameraYRef = useRef(0);
  const targetCameraYRef = useRef(0);
  const perfectFlashRef = useRef(0);
  const perfectFlashXRef = useRef(0);
  const perfectFlashWRef = useRef(0);
  const debrisMissRef = useRef(null);

  // Constants
  const CANVAS_SIZE = 600;
  const STACK_HEIGHT = 560; // Bottom of stacks
  const BLOCK_HEIGHT = 24;

  // Retrieve game info
  useEffect(() => {
    axios.get('/api/v1/games')
      .then(res => {
        const game = res.data.games?.find(g => g.title === "Neon Stack Tower");
        if (game) setGameId(game._id);
      })
      .catch(err => console.error("Failed to load game info:", err));
  }, []);

  // Submit high score
  const submitStackScore = async (finalScore) => {
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

  // Launch fresh game
  const startGame = () => {
    setScore(0);
    setCombo(0);
    setRewards(null);
    setSubmitStatus('');
    setMenuIndex(0);

    playSound('restart', mutedRef.current);

    const baseWidth = 160;
    blocksRef.current = [
      {
        x: 100 + (400 - baseWidth) / 2, // Stack centers in x=100 to 500 area
        w: baseWidth,
        color: NEON_COLORS[0],
        isPerfect: false
      }
    ];
    debrisRef.current = [];
    slidingBlockRef.current = {
      x: 100 - baseWidth,
      w: baseWidth,
      direction: 1,
      baseSpeed: 3.5
    };
    cameraYRef.current = 0;
    targetCameraYRef.current = 0;
    perfectFlashRef.current = 0;
    debrisMissRef.current = null;

    setGameState('GAMEPLAY');
  };

  // Place block down
  const dropBlock = () => {
    if (gameStateRef.current !== 'GAMEPLAY') return;

    const stack = blocksRef.current;
    const topBlock = stack[stack.length - 1];
    const curr = slidingBlockRef.current;

    const topBlockY = STACK_HEIGHT - stack.length * BLOCK_HEIGHT + cameraYRef.current;
    const currentBlockY = topBlockY - BLOCK_HEIGHT;

    // Check overlap diff
    const diff = curr.x - topBlock.x;
    const perfectThreshold = 5;

    if (Math.abs(diff) <= perfectThreshold) {
      // PERFECT DROP
      const newX = topBlock.x;
      const newW = topBlock.w;

      stack.push({
        x: newX,
        w: newW,
        color: NEON_COLORS[stack.length % NEON_COLORS.length],
        isPerfect: true
      });

      const nextCombo = comboRef.current + 1;
      setCombo(nextCombo);
      playSound('perfect', mutedRef.current);

      perfectFlashRef.current = 1.0;
      perfectFlashXRef.current = newX;
      perfectFlashWRef.current = newW;

      // Expand slightly on combos
      let rewardedWidth = newW;
      let rewardedX = newX;
      if (nextCombo > 0 && nextCombo % 5 === 0) {
        rewardedWidth = Math.min(220, newW + 12);
        rewardedX = Math.max(100, Math.min(500 - rewardedWidth, newX - 6));
        stack[stack.length - 1].w = rewardedWidth;
        stack[stack.length - 1].x = rewardedX;
      }

      const nextDir = Math.random() > 0.5 ? 1 : -1;
      slidingBlockRef.current = {
        x: nextDir === 1 ? 100 - rewardedWidth : 500,
        w: rewardedWidth,
        direction: nextDir,
        baseSpeed: curr.baseSpeed
      };

      setScore(prev => {
        const nextScore = prev + 1;
        if (nextScore > highScore) {
          localStorage.setItem('stack_high_score', nextScore.toString());
          setHighScore(nextScore);
        }
        return nextScore;
      });

      targetCameraYRef.current = Math.max(0, (stack.length - 8) * BLOCK_HEIGHT);
    } else {
      // CUT DROP
      const left = Math.max(curr.x, topBlock.x);
      const right = Math.min(curr.x + curr.w, topBlock.x + topBlock.w);
      const overlapWidth = right - left;

      if (overlapWidth <= 0) {
        // MISSED TOWER COMPLETELY
        playSound('lose', mutedRef.current);
        debrisMissRef.current = {
          x: curr.x,
          y: currentBlockY - cameraYRef.current,
          w: curr.w,
          vy: 0,
          alpha: 1.0,
          color: NEON_COLORS[stack.length % NEON_COLORS.length]
        };
        setGameState('GAMEOVER');
        setMenuIndex(0);
        setCombo(0);
        submitStackScore(scoreRef.current);
      } else {
        // PLACED AND SLICED
        setCombo(0);
        playSound('chop', mutedRef.current);

        let debrisX = 0;
        let debrisWidth = 0;

        if (curr.x < topBlock.x) {
          debrisX = curr.x;
          debrisWidth = topBlock.x - curr.x;
        } else {
          debrisX = topBlock.x + topBlock.w;
          debrisWidth = (curr.x + curr.w) - (topBlock.x + topBlock.w);
        }

        if (debrisWidth > 0) {
          debrisRef.current.push({
            x: debrisX,
            y: currentBlockY - cameraYRef.current,
            w: debrisWidth,
            vy: 0,
            alpha: 1.0,
            color: NEON_COLORS[stack.length % NEON_COLORS.length]
          });
        }

        stack.push({
          x: left,
          w: overlapWidth,
          color: NEON_COLORS[stack.length % NEON_COLORS.length],
          isPerfect: false
        });

        const nextDir = Math.random() > 0.5 ? 1 : -1;
        slidingBlockRef.current = {
          x: nextDir === 1 ? 100 - overlapWidth : 500,
          w: overlapWidth,
          direction: nextDir,
          baseSpeed: curr.baseSpeed
        };

        setScore(prev => {
          const nextScore = prev + 1;
          if (nextScore > highScore) {
            localStorage.setItem('stack_high_score', nextScore.toString());
            setHighScore(nextScore);
          }
          return nextScore;
        });

        targetCameraYRef.current = Math.max(0, (stack.length - 8) * BLOCK_HEIGHT);
      }
    }
  };

  // Keyboard navigation controls
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
    } else if (curState === 'PAUSE') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', mutedRef.current);
        setMenuIndex(prev => (prev === 0 ? 2 : prev - 1));
        menuIndexRef.current = (menuIndexRef.current === 0 ? 2 : menuIndexRef.current - 1);
        setMenuIndex(menuIndexRef.current);
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        menuIndexRef.current = (menuIndexRef.current === 2 ? 0 : menuIndexRef.current + 1);
        setMenuIndex(menuIndexRef.current);
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuIndexRef.current === 0) {
          lastFrameTimeRef.current = performance.now();
          setGameState('GAMEPLAY');
        } else if (menuIndexRef.current === 1) {
          startGame();
        } else {
          setGameState('LOBBY');
          menuIndexRef.current = 0;
          setMenuIndex(0);
        }
      } else if (code === 'Escape') {
        playSound('click', mutedRef.current);
        lastFrameTimeRef.current = performance.now();
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
        }
      }
    } else if (curState === 'GAMEPLAY') {
      if (code === 'Escape') {
        playSound('click', mutedRef.current);
        setGameState('PAUSE');
        setMenuIndex(0);
      } else if (code === 'Space' || code === 'Enter' || code === 'ArrowDown' || code === 'KeyS') {
        dropBlock();
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
    if (curState === 'GAMEPLAY') {
      dropBlock();
    }
  };

  // Main Canvas render & physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
      const dt = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      // Update Physics
      if (gameStateRef.current === 'GAMEPLAY') {
        const stack = blocksRef.current;
        const curr = slidingBlockRef.current;

        // Smooth camera slide
        cameraYRef.current += (targetCameraYRef.current - cameraYRef.current) * 0.1;

        // Sliding block movement
        const speed = curr.baseSpeed + scoreRef.current * 0.12;
        curr.x += speed * curr.direction;

        // Bounce slide direction at limits (100 to 500 stack box shifted bounds)
        if (curr.direction === 1 && curr.x >= 500) {
          curr.direction = -1;
        } else if (curr.direction === -1 && curr.x <= 100 - curr.w) {
          curr.direction = 1;
        }

        // Falling debris particles
        const debris = debrisRef.current;
        for (let i = debris.length - 1; i >= 0; i--) {
          const d = debris[i];
          d.vy += 0.35; // gravity
          d.y += d.vy;
          d.alpha -= 0.02;
          if (d.alpha <= 0 || d.y > CANVAS_SIZE) {
            debris.splice(i, 1);
          }
        }

        // Perfect flash alpha
        if (perfectFlashRef.current > 0) {
          perfectFlashRef.current -= 0.05;
        }
      }

      // Drawing
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.shadowBlur = 0;

      // Space lines
      ctx.strokeStyle = '#060512';
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
        drawActiveGameElements(ctx);
      }

      // Draw global speaker speaker icon
      drawSpeakerIcon(ctx);

      requestRef.current = requestAnimationFrame(render);
    };

    // Helper: Draw stack blocks, falling debris, sliding layers, perfect flashes
    const drawActiveGameElements = (c) => {
      // 1. Draw top HUD panel
      c.textAlign = 'left';
      c.fillStyle = '#8888a0';
      c.font = '11px "Orbitron", monospace';
      c.fillText('STACKED', 50, 30);
      c.fillText('BEST STACK', 300, 30);

      c.fillStyle = '#ffffff';
      c.font = 'bold 16px "Orbitron", monospace';
      c.fillText(String(scoreRef.current), 50, 52);

      c.fillStyle = '#ffd700';
      c.fillText(highScore.toLocaleString(), 300, 52);

      // Draw active combo fire node
      if (comboRef.current > 0) {
        c.fillStyle = '#00ff88';
        c.font = 'bold 12px "Orbitron", monospace';
        c.fillText(`COMBO x${comboRef.current}`, 180, 52);
      }

      // Divider line
      c.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, 78);
      c.lineTo(CANVAS_SIZE, 78);
      c.stroke();

      // 2. Draw Stack Blocks (y shifting via cameraY)
      const stack = blocksRef.current;
      stack.forEach((block, index) => {
        const y = STACK_HEIGHT - (index + 1) * BLOCK_HEIGHT + cameraYRef.current;
        if (y > 590) return; // offscreen bottom

        c.fillStyle = block.color + '1c';
        c.strokeStyle = block.color;
        c.lineWidth = 2.5;

        c.beginPath();
        c.roundRect(block.x, y, block.w, BLOCK_HEIGHT, 4);
        c.fill();
        c.stroke();

        // White border highlight on perfect drop
        if (block.isPerfect) {
          c.strokeStyle = '#ffffff';
          c.lineWidth = 1.2;
          c.stroke();
        }
      });

      // 3. Render falling debris slice blocks
      const debris = debrisRef.current;
      debris.forEach(d => {
        const y = d.y + cameraYRef.current;
        c.fillStyle = d.color;
        c.globalAlpha = d.alpha;
        c.beginPath();
        c.rect(d.x, y, d.w, BLOCK_HEIGHT);
        c.fill();
      });
      c.globalAlpha = 1.0; // reset

      // 4. Render sliding block if game is active
      if (gameStateRef.current === 'GAMEPLAY') {
        const curr = slidingBlockRef.current;
        const y = STACK_HEIGHT - (stack.length + 1) * BLOCK_HEIGHT + cameraYRef.current;
        const color = NEON_COLORS[stack.length % NEON_COLORS.length];

        c.fillStyle = color + '2a';
        c.strokeStyle = color;
        c.lineWidth = 3;

        c.beginPath();
        c.roundRect(curr.x, y, curr.w, BLOCK_HEIGHT, 4);
        c.fill();
        c.stroke();
      }

      // 5. Miss completely falling animation
      if (gameStateRef.current === 'GAMEOVER' && debrisMissRef.current) {
        const d = debrisMissRef.current;
        d.vy += 0.35;
        d.y += d.vy;
        d.alpha -= 0.025;

        c.fillStyle = d.color;
        c.globalAlpha = Math.max(0, d.alpha);
        c.beginPath();
        c.rect(d.x, d.y + cameraYRef.current, d.w, BLOCK_HEIGHT);
        c.fill();
        c.globalAlpha = 1.0;
      }

      // 6. Perfect Hit flash animation
      if (perfectFlashRef.current > 0) {
        const flashY = STACK_HEIGHT - stack.length * BLOCK_HEIGHT + cameraYRef.current;
        c.strokeStyle = `rgba(255, 255, 255, ${perfectFlashRef.current})`;
        c.lineWidth = 8;
        c.beginPath();
        c.roundRect(perfectFlashXRef.current, flashY, perfectFlashWRef.current, BLOCK_HEIGHT, 4);
        c.stroke();

        // Floating 'PERFECT!' text
        c.fillStyle = `rgba(255, 255, 255, ${perfectFlashRef.current})`;
        c.font = 'bold 15px "Orbitron", monospace';
        c.textAlign = 'center';
        c.fillText('PERFECT!', CANVAS_SIZE / 2, flashY - 15);
      }
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
  }, [gameState, score, combo, muted, submitStatus, rewards, highScore, menuIndex]);

  return (
    <div className="stack-page-wrapper">
      {/* Floating circular navigation back button */}
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
          onClick={handleCanvasClick}
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
          />
          
          {/* DOM OVERLAYS */}
          {gameState === 'LOBBY' && (
            <div className="towerstack-overlay">
              <h1 className="towerstack-title" style={{ color: '#a855f7', textShadow: '0 0 15px #a855f7' }}>NEON TOWER</h1>
              <p className="towerstack-subtitle">SYNTHETIC ARCHITECTURE PROTOCOL</p>
              
              <div className="towerstack-menu">
                <button 
                  className={`towerstack-btn ${menuIndex === 0 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(0)}
                  style={menuIndex === 0 ? { borderColor: '#a855f7', color: '#fff', boxShadow: '0 0 15px #a855f7', textShadow: '0 0 8px #a855f7' } : {}}
                  onClick={() => { playSound('click', mutedRef.current); startGame(); }}
                >
                  START STACK
                </button>
                <button 
                  className={`towerstack-btn ${menuIndex === 1 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(1)}
                  style={menuIndex === 1 ? { borderColor: '#a855f7', color: '#fff', boxShadow: '0 0 15px #a855f7', textShadow: '0 0 8px #a855f7' } : {}}
                  onClick={() => { playSound('click', mutedRef.current); window.location.href = '/UODGaming'; }}
                >
                  EXIT TO MENU
                </button>
              </div>
              <p className="towerstack-subtitle" style={{ marginTop: '40px', fontSize: '12px' }}>PRESS SPACEBAR / TOUCH TO DROP THE BLOCK PRECISELY</p>
            </div>
          )}

          {gameState === 'PAUSE' && (
            <div className="towerstack-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
              <h1 className="towerstack-title" style={{ color: '#00d4ff', textShadow: '0 0 15px rgba(0, 212, 255, 0.8)' }}>SYSTEM PAUSED</h1>
              <p className="towerstack-subtitle" style={{ marginBottom: '60px' }}></p>
              
              <div className="towerstack-menu">
                {['RESUME', 'RESTART', 'BACK TO MENU'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`towerstack-btn ${menuIndex === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuIndex(idx)}
                    onClick={() => {
                      playSound('click', mutedRef.current);
                      if (idx === 0) { lastFrameTimeRef.current = performance.now(); setGameState('GAMEPLAY'); }
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
            <div className="towerstack-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
              <h1 className="towerstack-title" style={{ color: '#ff0055', textShadow: '0 0 20px rgba(255, 0, 85, 0.8)' }}>GAME OVER</h1>
              <p className="towerstack-subtitle" style={{ color: '#00d4ff', fontSize: '20px', marginBottom: '5px' }}>CURRENT SCORE: {score}</p>
              <p className="towerstack-subtitle" style={{ color: '#00ff88', fontSize: '16px', marginBottom: '40px' }}>BEST SCORE: {highScore}</p>
              
              <div className="towerstack-menu">
                <button 
                  className={`towerstack-btn ${menuIndex === 0 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuIndex(0)}
                  onClick={() => { playSound('click', mutedRef.current); startGame(); }}
                >
                  PLAY AGAIN
                </button>
                <button 
                  className={`towerstack-btn ${menuIndex === 1 ? 'selected' : ''}`}
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

export default TowerStack;
