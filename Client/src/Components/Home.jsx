import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import '../styles/Home.css';
import Foote from './Foote';

// Magnetic Button Wrapper for premium interactive pointer attraction
const MagneticButton = ({ children, to, className }) => {
  const btnRef = useRef(null);

  const handleMouseMove = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate3d(${x * 0.3}px, ${y * 0.3}px, 0)`;
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.transform = 'translate3d(0, 0, 0)';
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="magnetic-btn-container"
    >
      <Link 
        ref={btnRef} 
        to={to} 
        className={className}
        style={{ transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)' }}
      >
        {children}
      </Link>
    </div>
  );
};

const Home = () => {
  // Lusion-inspired text reveal animations (word by word sliding up)
  const titleWords = ["THE", "ULTIMATE", "NEON", "GAMING", "SPHERE"];
  
  const wordRevealVariants = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const platformShowcase = [
    {
      index: "01",
      title: "9 NEON CABINETS",
      desc: "Play fully integrated Retro arcade games from Tetris to Stackers directly in your browser."
    },
    {
      index: "02",
      title: "SYNTHESIZED AUDIO",
      desc: "Immerse in soundscapes generated in real-time using native browser Web Audio Osc synths."
    },
    {
      index: "03",
      title: "OFFLINE PWA HUB",
      desc: "Install the gaming cabinet to your desktop. Play offline anytime with Workbox caching."
    },
    {
      index: "04",
      title: "SECURE ACCOUNT",
      desc: "Save highscores and synchronize progression settings locally and through unified sessions."
    }
  ];

  return (
    <div className="home-wrapper">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="ambient-spotlight"></div>
        
        <div className="hero-content container">
          <div className="hero-left">
            
            {/* Kinetic Masked Title */}
            <h1 className="hero-title">
              {titleWords.map((word, i) => (
                <span key={i} className="title-word-mask">
                  <motion.span 
                    variants={wordRevealVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: i * 0.1 }}
                    className={`title-word-text ${word === 'ULTIMATE' || word === 'NEON' ? 'text-neon-cyan' : ''}`}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>


            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="hero-actions"
            >
              <MagneticButton to="/UODGaming" className="btn btn-primary">
                <Play className="btn-icon" size={16} />
                <span>Play Games</span>
              </MagneticButton>
            </motion.div>
          </div>

          {/* Interactive Showroom Deck */}
          <div className="hero-right">
            <div className="showroom-deck-wrapper">
              {platformShowcase.map((card, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.15 }}
                  className="showroom-card"
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="showroom-card-header">
                    <span className="card-index-dot">{card.index}</span>
                    <div className="glow-bar"></div>
                  </div>
                  <h3 className="showroom-card-title">{card.title}</h3>
                  <p className="showroom-card-desc">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Foote />
    </div>
  );
};

export default Home;
