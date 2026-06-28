import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Grid, 
  Play,
  Gamepad2,
  Trophy,
  Zap,
  Heart
} from 'lucide-react';
import Foote from './Foote';
import axios from 'axios';
import '../styles/UODGaming.css';

// GameIcon component renders inline minimalist glowing SVGs for games
const GameIcon = ({ title }) => {
  const glowFilter = (
    <defs>
      <filter id="icon-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );

  switch (title) {
    case "Snake Arcade":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <path 
            d="M 20 80 L 20 50 L 50 50 L 50 20 L 80 20" 
            stroke="#00ff88" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
            filter="url(#icon-glow)"
          />
          <circle cx="80" cy="20" r="4.5" fill="#00ff88" filter="url(#icon-glow)" />
          <circle cx="80" cy="50" r="3.5" fill="#ff006e" filter="url(#icon-glow)" />
        </svg>
      );
    case "Tic Tac Toe Duo":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <line x1="38" y1="15" x2="38" y2="85" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <line x1="62" y1="15" x2="62" y2="85" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <line x1="15" y1="38" x2="85" y2="38" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <line x1="15" y1="62" x2="85" y2="62" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <path d="M 22 22 L 30 30 M 30 22 L 22 30" stroke="#00d4ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#icon-glow)" />
          <circle cx="50" cy="50" r="6" stroke="#ff006e" strokeWidth="3.5" fill="none" filter="url(#icon-glow)" />
          <path d="M 70 70 L 78 78 M 78 70 L 70 78" stroke="#00d4ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#icon-glow)" />
        </svg>
      );
    case "Color Guesser RGB":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <circle cx="42" cy="45" r="16" stroke="#ff006e" strokeWidth="2.5" fill="rgba(255, 0, 110, 0.05)" filter="url(#icon-glow)" />
          <circle cx="58" cy="45" r="16" stroke="#00ff88" strokeWidth="2.5" fill="rgba(0, 255, 136, 0.05)" filter="url(#icon-glow)" />
          <circle cx="50" cy="59" r="16" stroke="#00d4ff" strokeWidth="2.5" fill="rgba(0, 212, 255, 0.05)" filter="url(#icon-glow)" />
        </svg>
      );
    case "Memory Card Match":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <rect x="18" y="22" width="26" height="38" rx="4" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2.5" fill="rgba(255,255,255,0.01)" />
          <text x="31" y="47" fill="rgba(255, 255, 255, 0.4)" fontSize="18" fontWeight="bold" textAnchor="middle">?</text>
          <rect x="52" y="32" width="28" height="42" rx="4" stroke="#00d4ff" strokeWidth="3" fill="rgba(0, 212, 255, 0.03)" filter="url(#icon-glow)" />
          <path d="M 66 43 L 68 49 L 74 49 L 69 53 L 71 59 L 66 55 L 61 59 L 63 53 L 58 49 L 64 49 Z" fill="#00d4ff" filter="url(#icon-glow)" />
        </svg>
      );
    case "Cyber Block Stacker":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <path d="M 30 35 L 30 65 L 50 65" stroke="#00d4ff" strokeWidth="4.5" strokeLinecap="square" fill="none" filter="url(#icon-glow)" />
          <path d="M 45 45 L 75 45 M 60 45 L 60 65" stroke="#8b5cf6" strokeWidth="4.5" strokeLinecap="square" fill="none" filter="url(#icon-glow)" />
        </svg>
      );
    case "Neon Brick Breaker":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <rect x="20" y="25" width="20" height="8" rx="2" stroke="#00d4ff" strokeWidth="2.5" fill="rgba(0,212,255,0.1)" filter="url(#icon-glow)" />
          <rect x="44" y="25" width="20" height="8" rx="2" stroke="#ff007f" strokeWidth="2.5" fill="rgba(255,0,127,0.1)" filter="url(#icon-glow)" />
          <rect x="68" y="25" width="20" height="8" rx="2" stroke="#00ff88" strokeWidth="2.5" fill="rgba(0,255,136,0.1)" filter="url(#icon-glow)" />
          <rect x="32" y="38" width="20" height="8" rx="2" stroke="#ffff00" strokeWidth="2.5" fill="rgba(255,255,0,0.1)" filter="url(#icon-glow)" />
          <rect x="56" y="38" width="20" height="8" rx="2" stroke="#8b5cf6" strokeWidth="2.5" fill="rgba(139,92,246,0.1)" filter="url(#icon-glow)" />
          <line x1="30" y1="75" x2="70" y2="75" stroke="#00d4ff" strokeWidth="5" strokeLinecap="round" filter="url(#icon-glow)" />
          <circle cx="50" cy="60" r="4" fill="#ffffff" filter="url(#icon-glow)" />
          <path d="M 50 60 L 55 46" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3,2" />
        </svg>
      );

    case "Cyber Falcon":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <line x1="30" y1="15" x2="30" y2="45" stroke="#ff006e" strokeWidth="3" strokeLinecap="round" filter="url(#icon-glow)" />
          <line x1="65" y1="55" x2="65" y2="85" stroke="#ff006e" strokeWidth="3" strokeLinecap="round" filter="url(#icon-glow)" />
          <g transform="translate(42, 45) rotate(-15)">
            <path d="M 8 0 L 15 15 L 8 11 L 1 15 Z" fill="#00d4ff" filter="url(#icon-glow)" />
            <path d="M 8 11 L 6 16 L 10 16 Z" fill="#ff6b35" opacity="0.8" />
          </g>
        </svg>
      );
    case "Neon Stack Tower":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <rect x="25" y="70" width="50" height="10" rx="1.5" stroke="#8b5cf6" strokeWidth="2.5" fill="rgba(139, 92, 246, 0.05)" filter="url(#icon-glow)" />
          <rect x="28" y="56" width="44" height="10" rx="1.5" stroke="#00ff88" strokeWidth="2.5" fill="rgba(0, 255, 136, 0.05)" filter="url(#icon-glow)" />
          <rect x="35" y="42" width="40" height="10" rx="1.5" stroke="#00d4ff" strokeWidth="3" fill="rgba(0, 212, 255, 0.05)" filter="url(#icon-glow)" />
        </svg>
      );
    case "Cyber Grid 1-25":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <rect x="18" y="18" width="64" height="64" rx="4" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" fill="none" />
          <line x1="39.3" y1="18" x2="39.3" y2="82" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          <line x1="60.6" y1="18" x2="60.6" y2="82" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          <line x1="18" y1="39.3" x2="82" y2="39.3" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          <line x1="18" y1="60.6" x2="82" y2="60.6" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          <rect x="20" y="20" width="17" height="17" rx="2" fill="rgba(0,255,136,0.05)" stroke="#00ff88" strokeWidth="2.5" filter="url(#icon-glow)" />
          <text x="28.5" y="32.5" fill="#00ff88" fontSize="12" fontWeight="bold" textAnchor="middle" filter="url(#icon-glow)">1</text>
          
          <text x="50" y="32.5" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">14</text>
          <text x="71.5" y="32.5" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">9</text>
          
          <text x="28.5" y="53.8" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">23</text>
          <text x="50" y="53.8" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">2</text>
          <text x="71.5" y="53.8" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">11</text>
          
          <text x="28.5" y="75" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">6</text>
          <text x="50" y="75" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">18</text>
          <text x="71.5" y="75" fill="rgba(255,255,255,0.3)" fontSize="11" textAnchor="middle">5</text>
        </svg>
      );
    case "Space Obstacle":
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <polygon points="50,20 20,80 50,65 80,80" fill="#00ff88" filter="url(#icon-glow)" />
          <circle cx="20" cy="30" r="8" fill="none" stroke="#ea580c" strokeWidth="2" filter="url(#icon-glow)" />
          <circle cx="80" cy="40" r="12" fill="none" stroke="#ea580c" strokeWidth="2" filter="url(#icon-glow)" />
          <circle cx="30" cy="15" r="5" fill="none" stroke="#ea580c" strokeWidth="2" filter="url(#icon-glow)" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className="game-icon-svg">
          {glowFilter}
          <circle cx="50" cy="50" r="20" stroke="#00d4ff" strokeWidth="3" fill="none" filter="url(#icon-glow)" />
        </svg>
      );
  }
};

const UODGaming = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const categories = [
    { id: 'all', label: 'All Games', icon: Gamepad2 },
    { id: 'action', label: 'Action', icon: Zap },
    { id: 'puzzle', label: 'Puzzle', icon: Grid },
    { id: 'strategy', label: 'Strategy', icon: Trophy },
    { id: 'casual', label: 'Casual', icon: Heart },
  ];

  const [games, setGames] = useState([
    {
      id: 1,
      title: "Snake Arcade",
      category: "action",
      rating: 4.9,
      players: "1.2M",
      description: "Classic neon arcade Snake with dynamic difficulty speed scaling, audio synths, and particles!",
      downloads: "5.2M",
      lastUpdated: "Just now",
      featured: false,
      path: "/Snake",
      tags: ["Retro", "Arcade", "Singleplayer"]
    },
    {
      id: 2,
      title: "Tic Tac Toe Duo",
      category: "strategy",
      rating: 4.8,
      players: "890K",
      description: "Play Tic Tac Toe locally with custom names, round tracking, turn indicators, and neon animations!",
      downloads: "2.1M",
      lastUpdated: "1 day ago",
      featured: false,
      path: "/TTT",
      tags: ["Board", "Multiplayer", "Local"]
    },
    {
      id: 3,
      title: "Color Guesser RGB",
      category: "puzzle",
      rating: 4.7,
      players: "650K",
      description: "Test your quickness and luck by matching hex/RGB color codes to correct preview swatches!",
      downloads: "1.1M",
      lastUpdated: "3 days ago",
      featured: false,
      path: "/ColorG",
      tags: ["Logic", "Casual", "Trivia"]
    },
    {
      id: 4,
      title: "Memory Card Match",
      category: "puzzle",
      rating: 4.8,
      players: "1.1M",
      description: "Flip and match custom neon icons under active move counters, scoring multipliers, and visual feedback!",
      downloads: "2.5M",
      lastUpdated: "Just now",
      featured: false,
      path: "/MemoryCard",
      tags: ["Logic", "Memory", "Singleplayer"]
    },
    {
      id: 5,
      title: "Cyber Block Stacker",
      category: "puzzle",
      rating: 4.8,
      players: "2.5M",
      description: "Classic tetromino falling-block puzzle. Move, rotate, slide, and hard drop blocks to clear rows!",
      downloads: "6.2M",
      lastUpdated: "Just now",
      featured: false,
      path: "/Tetris",
      tags: ["Retro", "Puzzle", "Singleplayer"]

    },
    {
      id: 6,
      title: "Neon Brick Breaker",
      category: "action",
      rating: 4.9,
      players: "1.4M",
      description: "Completely redesigned physics breakout bouncer! Control the neon paddle to destroy glass bricks with particles and screen shake!",
      downloads: "3.5M",
      lastUpdated: "Just now",
      featured: false,
      path: "/Breakout",
      tags: ["Arcade", "Physics", "Singleplayer"]
    },
    {
      id: 7,
      title: "Cyber Falcon",
      category: "action",
      rating: 4.7,
      players: "1.8M",
      description: "Thrust-based gravity avoider. Guide the ship through gaps between scrolling laser pillar obstacles!",
      downloads: "4.2M",
      lastUpdated: "Just now",
      featured: false,
      path: "/Falcon",
      tags: ["Endless", "Survival", "Singleplayer"]
    },
    {
      id: 8,
      title: "Neon Stack Tower",
      category: "puzzle",
      rating: 4.8,
      players: "1.2M",
      description: "A precision timing block-stacker. Drop sliding blocks to build a tower—any offset portions are cut away!",
      downloads: "2.8M",
      lastUpdated: "Just now",
      featured: false,
      path: "/Stack",
      tags: ["Precision", "Reflex", "Singleplayer"]
    },
    {
      id: 9,
      title: "Cyber Grid 1-25",
      category: "casual",
      rating: 4.8,
      players: "980K",
      description: "A cognitive speed-finder grid game. Find and click numbers 1 through 25 in sequential order as fast as you can!",
      downloads: "1.9M",
      lastUpdated: "Just now",
      featured: false,
      path: "/GridRush",
      tags: ["Logic", "Reflex", "Casual"]
    },
    {
      id: 10,
      title: "Space Obstacle",
      category: "action",
      rating: 4.8,
      players: "500K",
      description: "Top-down endless space runner! Pilot a neon ship, dodge procedurally generated asteroids, and survive the scrolling starfield!",
      downloads: "1.2M",
      lastUpdated: "Just now",
      featured: true,
      path: "/SpaceObstacle",
      tags: ["Endless", "Survival", "Action"]
    }
  ]);

  useEffect(() => {
    // Fetch dynamic games list from backend API if available
    axios.get('/api/v1/games')
      .then(res => {
        if (res.data.games && res.data.games.length > 0) {
          const routeMap = {
            "Snake Arcade": "/Snake",
            "Tic Tac Toe Duo": "/TTT",
            "Color Guesser RGB": "/ColorG",
            "Memory Card Match": "/MemoryCard",
            "Cyber Block Stacker": "/Tetris",
            "Neon Brick Breaker": "/Breakout",
            "Cyber Falcon": "/Falcon",
            "Neon Stack Tower": "/Stack",
            "Cyber Grid 1-25": "/GridRush",
            "Space Obstacle": "/SpaceObstacle"
          };

          const mappedGames = res.data.games.map(game => ({
            id: game._id,
            _id: game._id,
            title: game.title,
            category: game.category,
            rating: game.statistics?.averageRating || 4.5,
            players: game.statistics?.uniquePlayers ? `${(game.statistics.uniquePlayers / 1000).toFixed(0)}K` : "10K",
            description: game.description,
            downloads: game.statistics?.totalDownloads ? `${(game.statistics.totalDownloads / 1000).toFixed(0)}K` : "5K",
            lastUpdated: game.publishedAt ? new Date(game.publishedAt).toLocaleDateString() : "Just now",
            featured: game.isFeatured,
            path: routeMap[game.title] || `/play/${game._id}`,
            tags: game.tags || [],
            isComingSoon: game.status === 'pending_review'
          }));
          setGames(mappedGames);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch games from backend, using offline local games catalog:", err);
      });
  }, []);

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'players':
        return parseFloat(b.players) - parseFloat(a.players);
      case 'downloads':
        return parseFloat(b.downloads) - parseFloat(a.downloads);
      case 'newest':
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      default:
        return a.id - b.id;
    }
  });

  const GameCard = ({ game, index }) => {
    const handlePlayClick = () => {
      if (game.isComingSoon) return;
      window.dispatchEvent(new CustomEvent('trigger-warp', { detail: { duration: 950 } }));
      setTimeout(() => {
        navigate(game.path, { state: { gameId: game._id || game.id } });
      }, 250);
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: index * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`game-card ${game.isComingSoon ? 'coming-soon-card' : ''}`}
      >
        <div className="game-image-container">
          <div className="game-image-svg-wrapper">
            <GameIcon title={game.title} />
          </div>
          {!game.isComingSoon && (
            <div className="game-overlay">
              <motion.button
                className="play-btn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePlayClick}
              >
                <Play size={24} />
              </motion.button>
            </div>
          )}

          {game.isComingSoon && (
            <div className="coming-soon-badge">
              Coming Soon
            </div>
          )}
        </div>
        
        <div className="game-content">
          <h3 className="game-title">{game.title}</h3>
          
          <div className="game-actions">
            <motion.button
              className={`btn btn-primary play-game-btn ${game.isComingSoon ? 'disabled' : ''}`}
              whileHover={game.isComingSoon ? {} : { scale: 1.02 }}
              whileTap={game.isComingSoon ? {} : { scale: 0.98 }}
              onClick={handlePlayClick}
              disabled={game.isComingSoon}
            >
              <Play size={18} />
              <span>{game.isComingSoon ? 'Coming Soon' : 'Play Now'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="uod-gaming-wrapper">
      {/* Hero Section */}
      <section className="games-hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">
              THE RETRO CABINETS
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="games-filters">
        <div className="filters-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search games by title or tag..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-section">
            <div className="category-filters">
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <button 
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Icon size={16} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="games-section">
        <div className="container">
          <div className="games-header-row">
            <h2 className="section-title">
              {selectedCategory === 'all' ? 'All Cabinets' : 
               categories.find(c => c.id === selectedCategory)?.label} 
              <span className="games-count">({sortedGames.length})</span>
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="games-grid"
            >
              {sortedGames.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>

          {sortedGames.length === 0 && (
            <motion.div
              className="no-games"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Gamepad2 size={64} className="text-muted" />
              <h3>No Cabinets Found</h3>
              <p>Try resetting the category filter or search input query.</p>
            </motion.div>
          )}
        </div>
      </section>

      <Foote />
    </div>
  );
};

export default UODGaming;
