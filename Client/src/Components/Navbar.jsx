import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import axios from 'axios';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadUser = () => {
    const token = 'cookie-token';
    const storedUser = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('user-stats-changed', loadUser);
    window.addEventListener('storage', loadUser);
    return () => {
      window.removeEventListener('user-stats-changed', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-stats-changed'));
    setIsOpen(false);
  };

  const navItems = [
    { path: '/', indexLabel: '01', label: 'Home' },
    { path: '/UODGaming', indexLabel: '02', label: 'Games' },
    ...(isLoggedIn 
      ? [
          { path: '/Leaderboard', indexLabel: '03', label: 'Leaderboard' },
          { path: '/logout', indexLabel: '04', label: 'Logout' }
        ] 
      : [{ path: '/login', indexLabel: '03', label: 'Login' }]
    )
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Play subtle click synthesizer tone
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isOpen ? 220 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context fallback
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    window.dispatchEvent(new CustomEvent('global-mute-toggle', { detail: { muted: soundEnabled } }));
  };

  return (
    <>
      <motion.nav 
        className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${isOpen ? 'navbar-menu-open' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/" className="logo-link" onClick={() => setIsOpen(false)}>
              <Zap className="logo-icon" />
              <span className="logo-text">
                <span className="logo-primary">UOD</span>
                <span className="logo-secondary">Gaming</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="navbar-desktop-links">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              if (item.path === '/logout') {
                return (
                  <Link 
                    key={item.path}
                    to="/" 
                    className="desktop-nav-link"
                    onClick={handleLogout}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`desktop-nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Controls Wrapper */}
          <div className="navbar-controls-wrapper">
            <button 
              className={`menu-hamburger-btn ${isOpen ? 'active' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle Menu"
            >
              <span className="hamburger-line line-1"></span>
              <span className="hamburger-line line-2"></span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Full-Screen Glassmorphic Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fullscreen-nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="overlay-bg-blobs">
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
            </div>

            <div className="overlay-container">
              {/* Vertical Menu Links */}
              <div className="overlay-menu-links">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <div className="overlay-link-row" key={item.path}>
                      <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ 
                          duration: 0.6, 
                          ease: [0.16, 1, 0.3, 1],
                          delay: index * 0.08 
                        }}
                        className="link-row-masked"
                      >
                        <span className="link-index">{item.indexLabel}</span>
                        {item.path === '/logout' ? (
                          <Link 
                            to="/" 
                            className="overlay-link"
                            onClick={handleLogout}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <Link 
                            to={item.path} 
                            className={`overlay-link ${isActive ? 'active' : ''}`}
                            onClick={toggleMenu}
                          >
                            {item.label}
                          </Link>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>

              {/* Side Metadata Details & Controls */}
              <motion.div 
                className="overlay-side-meta"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {isLoggedIn && user && (
                  <div className="meta-block">
                    <h4 className="meta-title">Player Info</h4>
                    <p className="meta-text text-highlight font-orbitron" style={{ color: 'var(--primary-neon)' }}>
                      @{user.username}
                    </p>
                    <p className="meta-text">
                      Level: <span className="font-orbitron" style={{ color: 'var(--accent-green)' }}>{user.gameStats?.level || 1}</span>
                    </p>
                    <p className="meta-text">
                      Coins: <span className="font-orbitron text-gold">🪙 {user.coins || 0}</span>
                    </p>
                  </div>
                )}

                <div className="meta-block">
                  <h4 className="meta-title">Navigation Info</h4>
                  <p className="meta-text">UOD Gaming Platform — Explore 9 neon interactive Web Audio arcade cabinets.</p>
                </div>

                <div className="meta-block">
                  <h4 className="meta-title">Interactive Sound</h4>
                  <button className="sound-toggle-btn" onClick={toggleSound}>
                    {soundEnabled ? (
                      <>
                        <Volume2 className="sound-icon neon-text-blue" size={18} />
                        <span>System Sounds Active</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="sound-icon text-muted" size={18} />
                        <span>System Sounds Muted</span>
                      </>
                    )}
                  </button>
                </div>



                <div className="meta-block footer-meta">
                  <span>© 2024 UOD Gaming. Managed by aryasurkar.</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
