import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView } from 'framer-motion';
import { 
  Play, 
  Gamepad2, 
  Trophy, 
  Users, 
  Zap, 
  Star,
  ArrowRight,
  Download,
  Shield,
  Globe
} from 'lucide-react';
import '../styles/Home.css';
import Foote from './Foote';

const Home = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const staggerChildren = {
    visible: {
      transition: { staggerChildren: 0.2 }
    }
  };

  const features = [
    {
      icon: Gamepad2,
      title: "Epic Gaming Experience",
      description: "Immerse yourself in cutting-edge games with stunning graphics and responsive gameplay."
    },
    {
      icon: Trophy,
      title: "Competitive Tournaments",
      description: "Join global tournaments, climb leaderboards, and earn exclusive rewards."
    },
    {
      icon: Users,
      title: "Gaming Community",
      description: "Connect with millions of gamers worldwide and build lasting friendships."
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Advanced security measures to protect your account and gaming progress."
    }
  ];

  const stats = [
    { value: "10M+", label: "Active Players" },
    { value: "500+", label: "Games Available" },
    { value: "50+", label: "Countries" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="background-animation">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="floating-particle"
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        </div>

        <div className="hero-content container">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="hero-text"
          >
            <motion.h1 variants={fadeInUp} className="hero-title">
              <span className="title-line">
                <span className="text-gaming text-neon">ULTIMATE</span>
              </span>
              <span className="title-line">
                <span className="text-gaming">GAMING</span>
              </span>
              <span className="title-line">
                <span className="text-gaming text-neon">EXPERIENCE</span>
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="hero-subtitle">
              Join millions of players in the most advanced gaming platform ever created.
              Compete, connect, and conquer in epic battles across multiple universes.
            </motion.p>

            <motion.div variants={fadeInUp} className="hero-actions">
              <Link to="/sign" className="btn btn-primary">
                <Play className="btn-icon" />
                Start Gaming
                <ArrowRight className="btn-icon" />
              </Link>
              <Link to="/UODGaming" className="btn btn-ghost">
                <Gamepad2 className="btn-icon" />
                Browse Games
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hero-visual"
          >
            <div className="gaming-controller">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="controller-glow"
              >
                <Gamepad2 size={120} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="scroll-indicator">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="scroll-arrow"
          >
            ↓
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={ref} className="features-section">
        <div className="container">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={staggerChildren}
            className="features-content"
          >
            <motion.div variants={fadeInUp} className="section-header">
              <h2 className="section-title text-gaming">
                <Zap className="title-icon" />
                Why Choose UOD Gaming?
              </h2>
              <p className="section-subtitle">
                Experience gaming like never before with our cutting-edge platform
              </p>
            </motion.div>

            <div className="features-grid">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="feature-card glass-card"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="feature-icon">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="cta-content"
          >
            <h2 className="cta-title text-gaming">
              Ready to Start Your Gaming Journey?
            </h2>
            <p className="cta-subtitle">
              Join the revolution and become part of the ultimate gaming community
            </p>
            <div className="cta-actions">
              <Link to="/sign" className="btn btn-primary btn-lg">
                <Star className="btn-icon" />
                Create Account
              </Link>
              <Link to="/Download" className="btn btn-secondary btn-lg">
                <Download className="btn-icon" />
                Download Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Foote />
    </div>
  );
};

export default Home;
