import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Users, 
  Clock,
  Download,
  Play,
  Heart,
  Eye,
  Gamepad2,
  Trophy,
  Flame,
  Zap
} from 'lucide-react';
import Card from './Card';
import Foote from './Foote';
import Info from './Info';
import '../styles/UODGaming.css';

const UODGaming = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [likedGames, setLikedGames] = useState(new Set());

  const categories = [
    { id: 'all', label: 'All Games', icon: Gamepad2 },
    { id: 'action', label: 'Action', icon: Zap },
    { id: 'adventure', label: 'Adventure', icon: Search },
    { id: 'puzzle', label: 'Puzzle', icon: Grid },
    { id: 'strategy', label: 'Strategy', icon: Trophy },
    { id: 'casual', label: 'Casual', icon: Heart },
  ];

  const games = [
    {
      id: 1,
      title: "Cyber Racing Ultimate",
      category: "action",
      rating: 4.8,
      players: "2.1M",
      image: "/api/placeholder/400/250",
      description: "High-octane cyberpunk racing with customizable vehicles",
      downloads: "5.2M",
      lastUpdated: "2 days ago",
      featured: true,
      tags: ["Racing", "Cyberpunk", "Multiplayer"]
    },
    {
      id: 2,
      title: "Mystic Realms",
      category: "adventure",
      rating: 4.9,
      players: "1.8M",
      image: "/api/placeholder/400/250",
      description: "Epic fantasy adventure in mystical worlds",
      downloads: "3.7M",
      lastUpdated: "1 week ago",
      featured: true,
      tags: ["Fantasy", "RPG", "Adventure"]
    },
    {
      id: 3,
      title: "Neural Puzzle Matrix",
      category: "puzzle",
      rating: 4.6,
      players: "892K",
      image: "/api/placeholder/400/250",
      description: "Mind-bending puzzles in a futuristic setting",
      downloads: "1.2M",
      lastUpdated: "3 days ago",
      featured: false,
      tags: ["Puzzle", "Sci-Fi", "Logic"]
    },
    {
      id: 4,
      title: "Battle Commanders",
      category: "strategy",
      rating: 4.7,
      players: "1.5M",
      image: "/api/placeholder/400/250",
      description: "Real-time strategy with epic battles",
      downloads: "2.8M",
      lastUpdated: "5 days ago",
      featured: true,
      tags: ["Strategy", "War", "Multiplayer"]
    },
    {
      id: 5,
      title: "Zen Garden Builder",
      category: "casual",
      rating: 4.5,
      players: "654K",
      image: "/api/placeholder/400/250",
      description: "Relaxing garden creation and management",
      downloads: "980K",
      lastUpdated: "1 day ago",
      featured: false,
      tags: ["Casual", "Relaxing", "Creative"]
    },
    {
      id: 6,
      title: "Neon Ninja",
      category: "action",
      rating: 4.8,
      players: "2.3M",
      image: "/api/placeholder/400/250",
      description: "Fast-paced ninja action in neon-lit cities",
      downloads: "4.1M",
      lastUpdated: "4 hours ago",
      featured: true,
      tags: ["Action", "Ninja", "Platformer"]
    }
  ];

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
        return b.featured ? 1 : -1;
    }
  });

  const toggleLike = (gameId) => {
    const newLikedGames = new Set(likedGames);
    if (newLikedGames.has(gameId)) {
      newLikedGames.delete(gameId);
    } else {
      newLikedGames.add(gameId);
    }
    setLikedGames(newLikedGames);
  };

  const GameCard = ({ game, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.1 }}
      className={`game-card ${viewMode} ${game.featured ? 'featured' : ''}`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="game-image-container">
        <div className="game-image" style={{ backgroundImage: `url(${game.image})` }}>
          <div className="game-overlay">
            <motion.button
              className="play-btn"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play size={24} />
            </motion.button>
          </div>
          {game.featured && (
            <div className="featured-badge">
              <Flame size={16} />
              Featured
            </div>
          )}
          <button
            className={`like-btn ${likedGames.has(game.id) ? 'liked' : ''}`}
            onClick={() => toggleLike(game.id)}
          >
            <Heart size={20} fill={likedGames.has(game.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      
      <div className="game-content">
        <div className="game-header">
          <h3 className="game-title">{game.title}</h3>
          <div className="game-rating">
            <Star size={16} fill="currentColor" />
            {game.rating}
          </div>
        </div>
        
        <p className="game-description">{game.description}</p>
        
        <div className="game-tags">
          {game.tags.map(tag => (
            <span key={tag} className="game-tag">{tag}</span>
          ))}
        </div>
        
        <div className="game-stats">
          <div className="stat">
            <Users size={16} />
            {game.players}
          </div>
          <div className="stat">
            <Download size={16} />
            {game.downloads}
          </div>
          <div className="stat">
            <Clock size={16} />
            {game.lastUpdated}
          </div>
        </div>
        
        <div className="game-actions">
          <motion.button
            className="btn btn-primary play-game-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={18} />
            Play Now
          </motion.button>
          <motion.button
            className="btn btn-ghost download-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="uod-gaming-wrapper">
      {/* Hero Section */}
      <section className="games-hero">
        <div className="hero-bg-animation">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="bg-particle"
              animate={{
                y: [0, -50, 0],
                x: [0, Math.random() * 30 - 15, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title text-gaming">
              <Gamepad2 className="title-icon" />
              Epic Gaming Universe
            </h1>
            <p className="hero-subtitle">
              Discover thousands of games, from indie masterpieces to AAA blockbusters
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="games-filters">
        <div className="container">
          <div className="filters-container">
            <div className="search-section">
              <div className="search-input-wrapper">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="filter-section">
              <div className="category-filters">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <motion.button
                      key={category.id}
                      className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={18} />
                      {category.label}
                    </motion.button>
                  );
                })}
              </div>

              <div className="view-controls">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="players">Most Players</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="newest">Recently Updated</option>
                </select>

                <div className="view-toggle">
                  <button
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="games-section">
        <div className="container">
          <div className="games-header">
            <h2 className="section-title">
              {selectedCategory === 'all' ? 'All Games' : 
               categories.find(c => c.id === selectedCategory)?.label} 
              <span className="games-count">({sortedGames.length})</span>
            </h2>
          </div>

          <AnimatePresence>
            <div className={`games-grid ${viewMode}`}>
              {sortedGames.map((game, index) => (
                <GameCard key={game.id} game={game} index={index} />
              ))}
            </div>
          </AnimatePresence>

          {sortedGames.length === 0 && (
            <motion.div
              className="no-games"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Gamepad2 size={64} />
              <h3>No games found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      </section>

      <Card />
      <Info />
      <Foote />
    </div>
  );
};

export default UODGaming;