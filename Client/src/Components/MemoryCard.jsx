import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pause } from 'lucide-react';
import axios from 'axios';
import '../Css/MemoryCard.css';

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
    } else if (type === 'flip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'match') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'mismatch') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.5);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.6);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  } catch (e) {
    console.warn("Audio Context init failed:", e);
  }
};

const NEON_DECK = ['Zap', 'Flame', 'Trophy', 'Star', 'Gamepad2', 'Heart', 'Eye', 'Music', 'Anchor', 'Crown', 'Moon', 'Bomb'];
const EMOJI_DECK = ['👾', '🚀', '💎', '🍕', '👑', '👽', '🦄', '🎸', '🦖', '🎈', '⚽', '🍔'];

// Custom Neon Vector Drawing functions centered at (x, y)
const drawSymbolMap = {
  Zap: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + size / 4, y - size / 2);
    ctx.lineTo(x - size / 3, y + size / 12);
    ctx.lineTo(x + size / 12, y + size / 12);
    ctx.lineTo(x - size / 4, y + size / 2);
    ctx.lineTo(x + size / 3, y - size / 12);
    ctx.lineTo(x - size / 12, y - size / 12);
    ctx.closePath();
    ctx.stroke();
  },
  Flame: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.quadraticCurveTo(x - size / 2, y + size / 4, x - size / 4, y - size / 6);
    ctx.quadraticCurveTo(x, y - size / 2, x, y - size / 2.5);
    ctx.quadraticCurveTo(x + size / 6, y - size / 2, x + size / 6, y - size / 6);
    ctx.quadraticCurveTo(x + size / 2, y + size / 4, x, y + size / 2);
    ctx.closePath();
    ctx.stroke();
  },
  Trophy: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size / 3, y - size / 3);
    ctx.lineTo(x + size / 3, y - size / 3);
    ctx.lineTo(x + size / 4, y + size / 8);
    ctx.lineTo(x - size / 4, y + size / 8);
    ctx.closePath();
    ctx.stroke();
    // Stand
    ctx.beginPath();
    ctx.moveTo(x, y + size / 8);
    ctx.lineTo(x, y + size / 2.5);
    ctx.moveTo(x - size / 4, y + size / 2.5);
    ctx.lineTo(x + size / 4, y + size / 2.5);
    ctx.stroke();
  },
  Star: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? size / 2 : size / 4;
      ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.stroke();
  },
  Gamepad2: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Simple controller shape rounded rect
    ctx.roundRect(x - size / 2, y - size / 4, size, size / 2, 6);
    ctx.stroke();
    // D-pad
    ctx.beginPath();
    ctx.moveTo(x - size / 3, y);
    ctx.lineTo(x - size / 6, y);
    ctx.moveTo(x - size / 4, y - size / 12);
    ctx.lineTo(x - size / 4, y + size / 12);
    ctx.stroke();
    // Buttons
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + size / 4, y - size / 12, 2.5, 0, Math.PI * 2);
    ctx.arc(x + size / 3, y + size / 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  },
  Heart: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 6);
    ctx.bezierCurveTo(x - size / 2, y - size / 4, x - size / 4, y - size / 2, x, y - size / 6);
    ctx.bezierCurveTo(x + size / 4, y - size / 2, x + size / 2, y - size / 4, x, y + size / 6);
    ctx.closePath();
    ctx.stroke();
  },
  Eye: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size / 2, y);
    ctx.quadraticCurveTo(x, y - size / 3, x + size / 2, y);
    ctx.quadraticCurveTo(x, y + size / 3, x - size / 2, y);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, size / 6, 0, Math.PI * 2);
    ctx.stroke();
  },
  Music: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    // Music note body
    ctx.beginPath();
    ctx.arc(x - size / 6, y + size / 6, size / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size / 24, y - size / 3);
    ctx.lineTo(x - size / 24, y + size / 6);
    ctx.stroke();
    // flag
    ctx.beginPath();
    ctx.moveTo(x - size / 24, y - size / 3);
    ctx.quadraticCurveTo(x + size / 6, y - size / 4, x + size / 8, y - size / 12);
    ctx.stroke();
  },
  Anchor: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x, y + size / 4);
    ctx.stroke();
    // crossbar
    ctx.beginPath();
    ctx.moveTo(x - size / 4, y - size / 6);
    ctx.lineTo(x + size / 4, y - size / 6);
    ctx.stroke();
    // curve
    ctx.beginPath();
    ctx.arc(x, y, size / 2.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  },
  Crown: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size / 2, y + size / 3);
    ctx.lineTo(x - size / 2, y - size / 6);
    ctx.lineTo(x - size / 4, y + size / 12);
    ctx.lineTo(x, y - size / 3);
    ctx.lineTo(x + size / 4, y + size / 12);
    ctx.lineTo(x + size / 2, y - size / 6);
    ctx.lineTo(x + size / 2, y + size / 3);
    ctx.closePath();
    ctx.stroke();
  },
  Moon: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x - size / 8, y, size / 2.2, -Math.PI / 2, Math.PI / 2, false);
    ctx.arc(x + size / 8, y, size / 2.2, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath();
    ctx.stroke();
  },
  Bomb: (ctx, x, y, size, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    // Bomb body
    ctx.beginPath();
    ctx.arc(x, y + size / 8, size / 2.5, 0, Math.PI * 2);
    ctx.stroke();
    // fuse
    ctx.beginPath();
    ctx.moveTo(x + size / 4, y - size / 4);
    ctx.quadraticCurveTo(x + size / 2, y - size / 2, x + size / 2.5, y - size / 2.5);
    ctx.stroke();
    // spark dot
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(x + size / 2.5 - 2, y - size / 2.5 - 2, 4, 4);
  }
};

const MemoryCard = () => {
  // Game state configurations
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [deckType, setDeckType] = useState('neon'); // neon, emoji
  const [muted, setMuted] = useState(() => localStorage.getItem('arcade_muted') === 'true');

  const difficultyRef = useRef('medium');
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  const deckTypeRef = useRef('neon');
  useEffect(() => { deckTypeRef.current = deckType; }, [deckType]);
  const mutedRef = useRef(false);
  useEffect(() => {
    mutedRef.current = muted;
    localStorage.setItem('arcade_muted', muted.toString());
  }, [muted]);

  // Screen State: 'LOBBY' | 'GAMEPLAY' | 'PAUSE' | 'GAMEOVER'
  const [gameState, setGameState] = useState('LOBBY');
  const gameStateRef = useRef('LOBBY');
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Game metrics
  const [moves, setMoves] = useState(0);
  const movesRef = useRef(0);
  useEffect(() => { movesRef.current = moves; }, [moves]);

  const [matches, setMatches] = useState(0);
  const matchesRef = useRef(0);
  useEffect(() => { matchesRef.current = matches; }, [matches]);

  const [bestMoves, setBestMoves] = useState('-');
  const [gameResult, setGameResult] = useState(''); // 'win' | 'lose' | ''
  const gameResultRef = useRef('');
  useEffect(() => { gameResultRef.current = gameResult; }, [gameResult]);

  // Card deck arrays
  const [cards, setCards] = useState([]);
  const cardsRef = useRef([]);
  useEffect(() => { cardsRef.current = cards; }, [cards]);

  const [flippedIndices, setFlippedIndices] = useState([]);
  const flippedIndicesRef = useRef([]);
  useEffect(() => { flippedIndicesRef.current = flippedIndices; }, [flippedIndices]);

  // API sync states
  const [gameId, setGameId] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [rewards, setRewards] = useState(null);

  // Menu navigation index (Lobby settings grid)
  const [menuRow, setMenuRow] = useState(0); // LOBBY: 0=Diff, 1=Deck, 2=Audio, 3=Start, 4=Exit. PAUSE: 0=Resume. GAMEOVER: 0=Play Again
  const menuRowRef = useRef(0);
  useEffect(() => { menuRowRef.current = menuRow; }, [menuRow]);
  const [menuCol, setMenuCol] = useState(0); // For multiple buttons in a row (e.g. PAUSE 0=Resume, 1=Restart, 2=Quit)
  const menuColRef = useRef(0);
  useEffect(() => { menuColRef.current = menuCol; }, [menuCol]);

  // Gameplay Cursor (card indices)
  const [gridCursor, setGridCursor] = useState(0);
  const gridCursorRef = useRef(0);
  useEffect(() => { gridCursorRef.current = gridCursor; }, [gridCursor]);

  // Canvas Refs & Time ticks
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  const initialLimitRef = useRef(60);
  const timeLeftRef = useRef(60000);
  const timerElapsedRef = useRef(0);
  const isTimerRunningRef = useRef(false);
  const lastTickSecondRef = useRef(-1);

  // Constants
  const CANVAS_SIZE = 600;

  // Retrieve Best Record from Storage
  const loadBestRecord = () => {
    const key = `memory_best_${difficultyRef.current}_${deckTypeRef.current}_normal`;
    const saved = localStorage.getItem(key);
    setBestMoves(saved ? saved : '-');
  };

  useEffect(() => {
    loadBestRecord();
  }, [difficulty, deckType, gameState]);

  // Load game info from db
  useEffect(() => {
    axios.get('/api/v1/games')
      .then(res => {
        const game = res.data.games?.find(g => g.title === "Memory Card Match");
        if (game) setGameId(game._id);
      })
      .catch(err => console.error("Failed to load game info:", err));
  }, []);

  // Submit high score
  const submitMemoryScore = async (finalMoves) => {
    const token = 'cookie-token';
    if (gameId && token) {
      setSubmitStatus('submitting');
      try {
        const elapsedSecs = Math.floor(timerElapsedRef.current / 1000);
        const baseScore = difficultyRef.current === 'easy' ? 500 : difficultyRef.current === 'medium' ? 1000 : 2000;
        const calculatedScore = Math.max(50, baseScore - finalMoves * 10 - elapsedSecs * 2);

        const res = await axios.post(`/api/v1/games/${gameId}/score`, {
          score: calculatedScore,
          level: difficultyRef.current === 'easy' ? 1 : difficultyRef.current === 'medium' ? 2 : 3
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

        // Sync local storage user profile
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

  // Start new gameplay session
  const startGame = () => {
    let pairsCount = 8; // medium
    if (difficultyRef.current === 'easy') pairsCount = 4;
    else if (difficultyRef.current === 'hard') pairsCount = 12;

    const baseDeck = deckTypeRef.current === 'neon' ? NEON_DECK : EMOJI_DECK;
    const selectedPairs = baseDeck.slice(0, pairsCount);
    const duplicateDeck = [...selectedPairs, ...selectedPairs];

    // Shuffle
    const shuffled = duplicateDeck
      .map((icon, idx) => ({ id: idx, icon, isMatched: false, flipProgress: 0 }))
      .sort(() => Math.random() - 0.5);

    // Initial limit values
    let limit = 60;
    if (difficultyRef.current === 'easy') limit = 30;
    else if (difficultyRef.current === 'hard') limit = 45;

    initialLimitRef.current = limit;
    timeLeftRef.current = limit * 1000;
    timerElapsedRef.current = 0;
    isTimerRunningRef.current = true;
    lastTickSecondRef.current = -1;

    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setGameResult('');
    setRewards(null);
    setSubmitStatus('');
    setGridCursor(0);
    setGameState('GAMEPLAY');
  };

  // Card Flip Activations
  const handleCardFlip = (index) => {
    if (gameStateRef.current !== 'GAMEPLAY') return;
    const currentCards = cardsRef.current;
    const currentFlipped = flippedIndicesRef.current;

    // Ignore clicks if matches, already flipped, or processing a pair mismatch
    if (currentCards[index].isMatched || currentFlipped.includes(index) || currentFlipped.length >= 2) {
      return;
    }

    playSound('flip', mutedRef.current);
    const nextFlipped = [...currentFlipped, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const nextMovesCount = movesRef.current + 1;
      setMoves(nextMovesCount);

      const [firstIdx, secondIdx] = nextFlipped;
      if (currentCards[firstIdx].icon === currentCards[secondIdx].icon) {
        // MATCH FOUND
        setTimeout(() => {
          if (gameStateRef.current !== 'GAMEPLAY') return;
          playSound('match', mutedRef.current);

          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });

          const totalPairs = difficultyRef.current === 'easy' ? 4 : difficultyRef.current === 'medium' ? 8 : 12;
          const nextMatches = matchesRef.current + 1;
          setMatches(nextMatches);

          if (nextMatches === totalPairs) {
            // Victory Loop
            isTimerRunningRef.current = false;
            playSound('win', mutedRef.current);
            setGameResult('win');
            setGameState('GAMEOVER');
            setMenuIndex(0);

            // Record Best
            const key = `memory_best_${difficultyRef.current}_${deckTypeRef.current}_normal`;
            const currentBest = localStorage.getItem(key);
            if (!currentBest || nextMovesCount < parseInt(currentBest, 10)) {
              localStorage.setItem(key, nextMovesCount.toString());
              setBestMoves(nextMovesCount);
            }

            submitMemoryScore(nextMovesCount);
          }
          setFlippedIndices([]);
        }, 500);
      } else {
        // MISMATCH
        setTimeout(() => {
          if (gameStateRef.current !== 'GAMEPLAY') return;
          playSound('mismatch', mutedRef.current);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Keyboard navigation controls
  const handleKeyboardNav = (code) => {
    const curState = gameStateRef.current;
    if (curState === 'LOBBY') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', mutedRef.current);
        setMenuRow(prev => { const next = prev === 0 ? 4 : prev - 1; menuRowRef.current = next; return next; });
        setMenuCol(0); menuColRef.current = 0;
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuRow(prev => { const next = prev === 4 ? 0 : prev + 1; menuRowRef.current = next; return next; });
        setMenuCol(0); menuColRef.current = 0;
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        playSound('click', mutedRef.current);
        if (menuRowRef.current === 0) {
          // Difficulty: easy, medium, hard
          setDifficulty(prev => {
            const next = prev === 'easy' ? 'hard' : prev === 'medium' ? 'easy' : 'medium';
            difficultyRef.current = next;
            return next;
          });
        } else if (menuRowRef.current === 1) {
          setDeckType(prev => {
            const next = prev === 'neon' ? 'emoji' : 'neon';
            deckTypeRef.current = next;
            return next;
          });
        } else if (menuRowRef.current === 2) {
          setMuted(prev => {
            mutedRef.current = !prev;
            return !prev;
          });
        }
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        playSound('click', mutedRef.current);
        if (menuRowRef.current === 0) {
          setDifficulty(prev => {
            const next = prev === 'easy' ? 'medium' : prev === 'medium' ? 'hard' : 'easy';
            difficultyRef.current = next;
            return next;
          });
        } else if (menuRowRef.current === 1) {
          setDeckType(prev => {
            const next = prev === 'neon' ? 'emoji' : 'neon';
            deckTypeRef.current = next;
            return next;
          });
        } else if (menuRowRef.current === 2) {
          setMuted(prev => {
            mutedRef.current = !prev;
            return !prev;
          });
        }
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuRowRef.current === 3) {
          startGame();
        } else if (menuRowRef.current === 4) {
          window.location.href = '/UODGaming';
        } else if (menuRowRef.current === 2) {
          setMuted(prev => {
            mutedRef.current = !prev;
            return !prev;
          });
        }
      }
    } else if (curState === 'PAUSE') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('click', mutedRef.current);
        setMenuCol(prev => { const next = prev === 0 ? 2 : prev - 1; menuColRef.current = next; return next; });
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuCol(prev => { const next = prev === 2 ? 0 : prev + 1; menuColRef.current = next; return next; });
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuColRef.current === 0) {
          lastFrameTimeRef.current = performance.now();
          isTimerRunningRef.current = true;
          setGameState('GAMEPLAY');
        } else if (menuColRef.current === 1) {
          startGame();
        } else {
          setGameState('LOBBY');
          setMenuRow(0); menuRowRef.current = 0;
          setMenuCol(0); menuColRef.current = 0;
        }
      } else if (code === 'Escape') {
        playSound('click', mutedRef.current);
        lastFrameTimeRef.current = performance.now();
        isTimerRunningRef.current = true;
        setGameState('GAMEPLAY');
      }
    } else if (curState === 'GAMEOVER') {
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') {
        playSound('click', mutedRef.current);
        setMenuCol(prev => { const next = prev === 0 ? 1 : 0; menuColRef.current = next; return next; });
      } else if (code === 'Space' || code === 'Enter') {
        playSound('click', mutedRef.current);
        if (menuColRef.current === 0) {
          startGame();
        } else {
          setGameState('LOBBY');
          setMenuRow(0); menuRowRef.current = 0;
          setMenuCol(0); menuColRef.current = 0;
        }
      }
    } else if (curState === 'GAMEPLAY') {
      if (code === 'Escape') {
        playSound('click', mutedRef.current);
        isTimerRunningRef.current = false;
        setGameState('PAUSE');
        setMenuCol(0); // focus on RESUME
      }

      // Matrix cursor movements
      const cols = difficultyRef.current === 'hard' ? 6 : 4;
      const rows = difficultyRef.current === 'easy' ? 2 : 4;
      let r = Math.floor(gridCursorRef.current / cols);
      let c = gridCursorRef.current % cols;

      if (code === 'ArrowLeft' || code === 'KeyA') {
        playSound('move', mutedRef.current);
        c = (c === 0) ? cols - 1 : c - 1;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        playSound('move', mutedRef.current);
        c = (c === cols - 1) ? 0 : c + 1;
      } else if (code === 'ArrowUp' || code === 'KeyW') {
        playSound('move', mutedRef.current);
        r = (r === 0) ? rows - 1 : r - 1;
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        playSound('move', mutedRef.current);
        r = (r === rows - 1) ? 0 : r + 1;
      } else if (code === 'Space' || code === 'Enter') {
        handleCardFlip(r * cols + c);
      }

      setGridCursor(r * cols + c);
    }
  };

  // Keyboard hooks
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

  // Card coordinate lookups
  const getCardCoords = (idx) => {
    const diff = difficultyRef.current;
    const cols = diff === 'hard' ? 6 : 4;
    const rows = diff === 'easy' ? 2 : 4;

    const col = idx % cols;
    const row = Math.floor(idx / cols);

    let w = 80, h = 95, gap = 15, offY = 125;
    if (diff === 'easy') {
      w = 90; h = 120; gap = 20; offY = 185;
    } else if (diff === 'hard') {
      w = 68; h = 84; gap = 10; offY = 145;
    }

    const totalWidth = cols * w + (cols - 1) * gap;
    const offX = (CANVAS_SIZE - totalWidth) / 2;

    return {
      x: offX + col * (w + gap) + w / 2,
      y: offY + row * (h + gap) + h / 2,
      width: w,
      height: h
    };
  };

  // Canvas clicks
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Speaker toggle click check
    if (clickX >= 540 && clickX <= 590 && clickY >= 10 && clickY <= 50) {
      playSound('click', !muted);
      setMuted(prev => !prev);
      return;
    }

    const curState = gameState;
    if (curState === 'GAMEPLAY') {
      const limit = difficultyRef.current === 'hard' ? 24 : difficultyRef.current === 'easy' ? 8 : 16;
      for (let i = 0; i < limit; i++) {
        const bounds = getCardCoords(i);
        if (
          clickX >= bounds.x - bounds.width / 2 &&
          clickX <= bounds.x + bounds.width / 2 &&
          clickY >= bounds.y - bounds.height / 2 &&
          clickY <= bounds.y + bounds.height / 2
        ) {
          handleCardFlip(i);
          break;
        }
      }
    }
  };

  // Mouse hover tracks keyboard matrix selection
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || gameStateRef.current !== 'GAMEPLAY') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const limit = difficultyRef.current === 'hard' ? 24 : difficultyRef.current === 'easy' ? 8 : 16;
    for (let i = 0; i < limit; i++) {
      const bounds = getCardCoords(i);
      if (
        mouseX >= bounds.x - bounds.width / 2 &&
        mouseX <= bounds.x + bounds.width / 2 &&
        mouseY >= bounds.y - bounds.height / 2 &&
        mouseY <= bounds.y + bounds.height / 2
      ) {
        if (gridCursorRef.current !== i) {
          playSound('move', mutedRef.current);
          setGridCursor(i);
        }
        break;
      }
    }
  };

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
      const dt = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      // Handle card flip physics inside state arrays
      const currentCards = cardsRef.current;
      if (gameStateRef.current === 'GAMEPLAY' || gameStateRef.current === 'PAUSE' || gameStateRef.current === 'GAMEOVER') {
        currentCards.forEach((card, idx) => {
          const isFlipped = card.isMatched || flippedIndicesRef.current.includes(idx);
          if (isFlipped) {
            card.flipProgress = Math.min(1, card.flipProgress + dt * 0.005);
          } else {
            card.flipProgress = Math.max(0, card.flipProgress - dt * 0.005);
          }
        });
      }

      // Handle Timer subtraction
      if (gameStateRef.current === 'GAMEPLAY' && isTimerRunningRef.current) {
        timerElapsedRef.current += dt;
      }

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.shadowBlur = 0;

      // Space grid background line fills
      ctx.strokeStyle = '#0a0812';
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
        drawGameplayHUD(ctx);
        drawGridCards(ctx);
      }

      // Draw Global Speaker symbol
      drawSpeakerIcon(ctx);

      requestRef.current = requestAnimationFrame(render);
    };

    // Helper: Draw settings button outline & glowing fills
    const drawOptionButton = (c, text, x, y, w, h, isActive, isFocused) => {
      c.save();
      c.lineWidth = 1.5;
      if (isActive) {
        c.fillStyle = 'rgba(168, 85, 247, 0.15)';
        c.fillRect(x, y, w, h);
        c.strokeStyle = '#a855f7';
        c.strokeRect(x, y, w, h);
      } else {
        c.strokeStyle = 'rgba(255,255,255,0.08)';
        c.strokeRect(x, y, w, h);
      }

      if (isFocused) {
        c.strokeStyle = '#00d4ff';
        c.shadowColor = '#00d4ff';
        c.shadowBlur = 6;
        c.strokeRect(x - 2, y - 2, w + 4, h + 4);
      }

      c.shadowBlur = 0;
      c.textAlign = 'center';
      c.font = isActive ? 'bold 11px "Orbitron", monospace' : '10px "Orbitron", monospace';
      c.fillStyle = isActive ? '#ffffff' : '#6b7280';
      c.fillText(text, x + w / 2, y + h / 2 + 4);
      c.restore();
    };

    // Helper: Draw gameplay top header panel items
    const drawGameplayHUD = (c) => {
      c.textAlign = 'left';
      c.fillStyle = '#8888a0';
      c.font = '11px "Orbitron", monospace';
      c.fillText('TIME ELAPSED', 50, 30);
      c.fillText('MOVES', 220, 30);
      c.fillText('MATCHES', 330, 30);
      c.fillText('BEST', 460, 30);

      c.fillStyle = '#ffffff';
      c.font = 'bold 15px "Orbitron", monospace';

      // Format time elapsed/left
      let displayedSecs = Math.floor(timerElapsedRef.current / 1000);
      const mins = Math.floor(displayedSecs / 60);
      const remainingSecs = displayedSecs % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;

      c.fillText(formatted, 50, 50);
      c.shadowBlur = 0;
      c.fillStyle = '#ffffff';

      c.fillText(String(movesRef.current), 220, 50);

      // Matches count
      const totalPairs = difficultyRef.current === 'easy' ? 4 : difficultyRef.current === 'medium' ? 8 : 12;
      c.fillText(`${matchesRef.current} / ${totalPairs}`, 330, 50);

      c.fillStyle = '#ffd700';
      c.fillText(String(bestMoves), 460, 50);

      // Draw neon grid boundary outline divider
      c.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(40, 68);
      c.lineTo(560, 68);
      c.stroke();
    };

    // Helper: Draw cards grid inside 3D scale flip boundaries
    const drawGridCards = (c) => {
      const list = cardsRef.current;
      if (!list || list.length === 0) return;

      list.forEach((card, idx) => {
        const bounds = getCardCoords(idx);
        const progress = card.flipProgress;
        const scaleX = Math.abs(2 * progress - 1);

        c.save();
        // Translate to card center and apply 3D scale transition
        c.translate(bounds.x, bounds.y);
        c.scale(scaleX, 1);

        // Outer shape rounded boundary
        c.lineWidth = 2;
        if (progress > 0.5) {
          // FACE UP STATE
          c.fillStyle = '#100f1c';
          c.strokeStyle = card.isMatched ? '#00ff88' : 'rgba(255,255,255,0.12)';
          if (card.isMatched) {
            c.shadowColor = '#00ff88';
            c.shadowBlur = 8;
          }
          c.beginPath();
          c.roundRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height, 6);
          c.fill();
          c.stroke();
          c.shadowBlur = 0;

          // Render symbol details
          const color = card.isMatched ? '#00ff88' : '#a855f7';
          if (deckTypeRef.current === 'neon') {
            const drawFunc = drawSymbolMap[card.icon];
            const symSize = difficultyRef.current === 'hard' ? 26 : 32;
            if (drawFunc) {
              c.save();
              c.shadowColor = color;
              c.shadowBlur = card.isMatched ? 15 : 6;
              drawFunc(c, 0, 0, symSize, color);
              c.restore();
            }
          } else {
            // Emoji text fills
            c.fillStyle = '#ffffff';
            c.textAlign = 'center';
            c.font = difficultyRef.current === 'hard' ? '24px sans-serif' : '30px sans-serif';
            c.fillText(card.icon, 0, 8);
          }
        } else {
          // FACE DOWN STATE
          c.fillStyle = '#06050c';
          c.strokeStyle = 'rgba(168,85,247,0.3)';
          c.beginPath();
          c.roundRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height, 6);
          c.fill();
          c.stroke();

          // Retro inner circuit stripe details
          c.strokeStyle = 'rgba(168,85,247,0.15)';
          c.lineWidth = 1;
          c.strokeRect(-bounds.width / 3, -bounds.height / 3, (bounds.width * 2) / 3, (bounds.height * 2) / 3);

          // Center glowing question mark
          c.fillStyle = 'rgba(168,85,247,0.4)';
          c.font = 'bold 22px "Orbitron", monospace';
          c.textAlign = 'center';
          c.fillText('?', 0, 7);
        }

        c.restore();

        // Keyboard grid selector border outline (always drawn unscaled)
        if (gameStateRef.current === 'GAMEPLAY' && gridCursorRef.current === idx && !card.isMatched) {
          c.save();
          c.strokeStyle = '#00d4ff';
          c.lineWidth = 2.5;
          c.shadowColor = '#00d4ff';
          c.shadowBlur = 8;
          c.beginPath();
          c.roundRect(
            bounds.x - bounds.width / 2 - 3,
            bounds.y - bounds.height / 2 - 3,
            bounds.width + 6,
            bounds.height + 6,
            8
          );
          c.stroke();
          c.restore();
        }
      });
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
  }, [gameState, menuRow, menuCol, gridCursor, cards, flippedIndices, moves, matches, muted, gameResult, submitStatus, rewards]);

  return (
    <div className="memory-page-wrapper">
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
        <div className="cabinet-screen crt-screen" onClick={handleCanvasClick} onMouseMove={handleCanvasMouseMove}>
          {/* CRT scanlines, reflection and flicker overlay */}
          <div className="crt-scanlines"></div>
          <div className="crt-reflection"></div>
          <div className="crt-flicker"></div>

          <canvas 
            ref={canvasRef} 
            width={CANVAS_SIZE} 
            height={CANVAS_SIZE} 
            style={{ display: 'block', background: '#020205', width: '100%', height: 'auto', maxWidth: '650px' }}
          />

          {/* DOM OVERLAYS */}
          {gameState === 'LOBBY' && (
            <div className="memorycard-overlay">
              <h1 className="memorycard-title" style={{ color: '#a855f7', textShadow: '0 0 15px #a855f7' }}>MEMORY MATCH</h1>
              <p className="memorycard-subtitle">NEON MATRIX CALIBRATION</p>
              
              <div style={{ width: '100%', maxWidth: '450px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: '#ffffff', fontFamily: 'Orbitron', fontSize: '14px', fontWeight: 'bold' }}>GRID MATRIX:</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`memorycard-btn ${difficulty === 'easy' ? 'selected' : ''}`} style={{ padding: '8px 12px', fontSize: '12px', color: difficulty === 'easy' ? '#fff' : '#6b7280', borderColor: difficulty === 'easy' ? '#a855f7' : 'rgba(255,255,255,0.1)', background: difficulty === 'easy' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', boxShadow: difficulty === 'easy' ? '0 0 10px #a855f7' : 'none' }} onClick={() => { playSound('click', muted); setDifficulty('easy'); }}>EASY</button>
                    <button className={`memorycard-btn ${difficulty === 'medium' ? 'selected' : ''}`} style={{ padding: '8px 12px', fontSize: '12px', color: difficulty === 'medium' ? '#fff' : '#6b7280', borderColor: difficulty === 'medium' ? '#a855f7' : 'rgba(255,255,255,0.1)', background: difficulty === 'medium' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', boxShadow: difficulty === 'medium' ? '0 0 10px #a855f7' : 'none' }} onClick={() => { playSound('click', muted); setDifficulty('medium'); }}>MEDIUM</button>
                    <button className={`memorycard-btn ${difficulty === 'hard' ? 'selected' : ''}`} style={{ padding: '8px 12px', fontSize: '12px', color: difficulty === 'hard' ? '#fff' : '#6b7280', borderColor: difficulty === 'hard' ? '#a855f7' : 'rgba(255,255,255,0.1)', background: difficulty === 'hard' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', boxShadow: difficulty === 'hard' ? '0 0 10px #a855f7' : 'none' }} onClick={() => { playSound('click', muted); setDifficulty('hard'); }}>HARD</button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: '#ffffff', fontFamily: 'Orbitron', fontSize: '14px', fontWeight: 'bold' }}>SYMBOL DECK:</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`memorycard-btn ${deckType === 'neon' ? 'selected' : ''}`} style={{ padding: '8px 12px', fontSize: '12px', color: deckType === 'neon' ? '#fff' : '#6b7280', borderColor: deckType === 'neon' ? '#a855f7' : 'rgba(255,255,255,0.1)', background: deckType === 'neon' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', boxShadow: deckType === 'neon' ? '0 0 10px #a855f7' : 'none' }} onClick={() => { playSound('click', muted); setDeckType('neon'); }}>NEON ICONS</button>
                    <button className={`memorycard-btn ${deckType === 'emoji' ? 'selected' : ''}`} style={{ padding: '8px 12px', fontSize: '12px', color: deckType === 'emoji' ? '#fff' : '#6b7280', borderColor: deckType === 'emoji' ? '#a855f7' : 'rgba(255,255,255,0.1)', background: deckType === 'emoji' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', boxShadow: deckType === 'emoji' ? '0 0 10px #a855f7' : 'none' }} onClick={() => { playSound('click', muted); setDeckType('emoji'); }}>SPACE EMOJIS</button>
                  </div>
                </div>



                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                  <span style={{ color: '#ffffff', fontFamily: 'Orbitron', fontSize: '14px', fontWeight: 'bold' }}>SOUND SYNTH:</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`memorycard-btn ${muted ? 'selected' : ''}`} style={{ padding: '8px 12px', fontSize: '12px', color: muted ? '#fff' : '#6b7280', borderColor: muted ? '#a855f7' : 'rgba(255,255,255,0.1)', background: muted ? 'rgba(168, 85, 247, 0.15)' : 'transparent', boxShadow: muted ? '0 0 10px #a855f7' : 'none' }} onClick={() => { playSound('click', !muted); setMuted(true); }}>MUTED</button>
                    <button className={`memorycard-btn ${!muted ? 'selected' : ''}`} style={{ padding: '8px 12px', fontSize: '12px', color: !muted ? '#fff' : '#6b7280', borderColor: !muted ? '#a855f7' : 'rgba(255,255,255,0.1)', background: !muted ? 'rgba(168, 85, 247, 0.15)' : 'transparent', boxShadow: !muted ? '0 0 10px #a855f7' : 'none' }} onClick={() => { playSound('click', false); setMuted(false); }}>ENABLED</button>
                  </div>
                </div>
              </div>
              
              <div className="memorycard-menu">
                <button 
                  className={`memorycard-btn ${menuRow === 3 ? 'selected' : ''}`}
                  onMouseEnter={() => { setMenuRow(3); setMenuCol(0); }}
                  style={menuRow === 3 ? { borderColor: '#a855f7', color: '#fff', boxShadow: '0 0 15px #a855f7', textShadow: '0 0 8px #a855f7' } : {}}
                  onClick={() => { playSound('click', muted); startGame(); }}
                >
                  LAUNCH SIMULATION
                </button>
                <button 
                  className={`memorycard-btn ${menuRow === 4 ? 'selected' : ''}`}
                  onMouseEnter={() => { setMenuRow(4); setMenuCol(0); }}
                  style={menuRow === 4 ? { borderColor: '#a855f7', color: '#fff', boxShadow: '0 0 15px #a855f7', textShadow: '0 0 8px #a855f7' } : {}}
                  onClick={() => { playSound('click', muted); window.location.href = '/UODGaming'; }}
                >
                  EXIT TO MENU
                </button>
              </div>
            </div>
          )}

          {gameState === 'PAUSE' && (
            <div className="memorycard-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
              <h1 className="memorycard-title" style={{ color: '#a855f7', textShadow: '0 0 15px #a855f7' }}>SIMULATION PAUSED</h1>
              <p className="memorycard-subtitle" style={{ marginBottom: '60px' }}></p>
              
              <div className="memorycard-menu">
                {['RESUME', 'RESTART', 'BACK TO MENU'].map((text, idx) => (
                  <button 
                    key={idx}
                    className={`memorycard-btn ${menuCol === idx ? 'selected' : ''}`}
                    onMouseEnter={() => setMenuCol(idx)}
                    onClick={() => {
                      playSound('click', muted);
                      if (idx === 0) { lastFrameTimeRef.current = performance.now(); isTimerRunningRef.current = true; setGameState('GAMEPLAY'); }
                      else if (idx === 1) startGame();
                      else { setGameState('LOBBY'); }
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="memorycard-overlay" style={{ background: 'rgba(5, 5, 10, 0.96)' }}>
              <h1 className="memorycard-title" style={{ color: gameResultRef.current === 'win' ? '#00ff88' : '#ff0055', textShadow: `0 0 20px ${gameResultRef.current === 'win' ? '#00ff88' : '#ff0055'}` }}>
                {gameResultRef.current === 'win' ? 'YOU WIN' : 'GAME OVER'}
              </h1>
              <p className="memorycard-subtitle" style={{ color: '#00d4ff', fontSize: '20px', marginBottom: '5px' }}>CURRENT MOVES: {movesRef.current}</p>
              <p className="memorycard-subtitle" style={{ color: '#00ff88', fontSize: '16px', marginBottom: '40px' }}>BEST MOVES: {bestMoves}</p>
              
              <div className="memorycard-menu">
                <button 
                  className={`memorycard-btn ${menuCol === 0 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuCol(0)}
                  onClick={() => { playSound('click', muted); startGame(); }}
                >
                  {gameResultRef.current === 'win' ? 'PLAY AGAIN' : 'RE-LAUNCH'}
                </button>
                <button 
                  className={`memorycard-btn ${menuCol === 1 ? 'selected' : ''}`}
                  onMouseEnter={() => setMenuCol(1)}
                  onClick={() => { playSound('click', muted); setGameState('LOBBY'); }}
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

export default MemoryCard;
