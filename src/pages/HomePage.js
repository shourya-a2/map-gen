import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './HomePage.css';

// Icons
const ModalIcon = () => (
  <svg viewBox="0 0 100 80" fill="none" className="preview-icon">
    {/* Background */}
    <rect x="0" y="0" width="100" height="80" rx="8" fill="#1a0533" />
    {/* Modal box */}
    <rect x="20" y="15" width="60" height="50" rx="8" fill="#2d0a4e" stroke="#ec4899" strokeWidth="2" />
    {/* Modal content lines */}
    <rect x="28" y="25" width="30" height="4" rx="2" fill="#ec4899" opacity="0.6" />
    <rect x="28" y="33" width="44" height="3" rx="1.5" fill="white" opacity="0.3" />
    <rect x="28" y="40" width="44" height="3" rx="1.5" fill="white" opacity="0.3" />
    {/* Button */}
    <rect x="28" y="50" width="44" height="8" rx="4" fill="#ec4899" />
  </svg>
);

const SideSheetIcon = () => (
  <svg viewBox="0 0 100 80" fill="none" className="preview-icon">
    {/* Background - lobby visible */}
    <rect x="0" y="0" width="100" height="80" rx="8" fill="#1a0533" />
    {/* Lobby elements (dimmed) */}
    <circle cx="20" cy="40" r="8" fill="#4a1a6b" opacity="0.5" />
    <circle cx="20" cy="60" r="6" fill="#4a1a6b" opacity="0.5" />
    <rect x="10" y="10" width="25" height="6" rx="3" fill="#4a1a6b" opacity="0.5" />
    {/* Side sheet */}
    <rect x="50" y="0" width="50" height="80" rx="0" fill="#2d0a4e" />
    <rect x="50" y="0" width="2" height="80" fill="#ec4899" opacity="0.5" />
    {/* Side sheet content */}
    <rect x="58" y="12" width="25" height="4" rx="2" fill="#ec4899" opacity="0.6" />
    <rect x="58" y="22" width="34" height="3" rx="1.5" fill="white" opacity="0.3" />
    <rect x="58" y="29" width="34" height="3" rx="1.5" fill="white" opacity="0.3" />
    {/* Button */}
    <rect x="58" y="40" width="34" height="8" rx="4" fill="#ec4899" />
  </svg>
);

const CompetitionIcon = () => (
  <svg viewBox="0 0 100 80" fill="none" className="preview-icon">
    {/* Background */}
    <rect x="0" y="0" width="100" height="80" rx="8" fill="#1a0533" />
    {/* Timer bar at top */}
    <rect x="0" y="0" width="100" height="16" rx="8" fill="#dc2626" />
    <rect x="8" y="5" width="40" height="6" rx="3" fill="white" opacity="0.3" />
    <text x="80" y="12" fontSize="10" fill="white" fontWeight="bold">0:15</text>
    {/* Side sheet */}
    <rect x="0" y="16" width="45" height="64" fill="#312e81" />
    {/* Quick theme buttons grid */}
    <rect x="4" y="24" width="18" height="12" rx="3" fill="#4a1a6b" />
    <rect x="24" y="24" width="18" height="12" rx="3" fill="#4a1a6b" />
    <rect x="4" y="40" width="18" height="12" rx="3" fill="#4a1a6b" />
    <rect x="24" y="40" width="18" height="12" rx="3" fill="#4a1a6b" />
    {/* Generate button */}
    <rect x="4" y="56" width="38" height="10" rx="5" fill="#ec4899" />
    {/* Lobby (dimmed) */}
    <circle cx="65" cy="45" r="12" fill="#4a1a6b" opacity="0.4" />
    <circle cx="85" cy="35" r="8" fill="#4a1a6b" opacity="0.3" />
    <circle cx="85" cy="55" r="6" fill="#4a1a6b" opacity="0.3" />
    {/* Trophy hint */}
    <text x="62" y="50" fontSize="16">🏆</text>
  </svg>
);

const MysteryIcon = () => (
  <svg viewBox="0 0 100 80" fill="none" className="preview-icon">
    {/* Background */}
    <rect x="0" y="0" width="100" height="80" rx="8" fill="#1e1040" />
    {/* Gift box base */}
    <rect x="25" y="40" width="50" height="30" rx="4" fill="#f59e0b" />
    <rect x="25" y="40" width="50" height="30" rx="4" stroke="#d97706" strokeWidth="2" />
    {/* Vertical ribbon */}
    <rect x="46" y="40" width="8" height="30" fill="#b45309" />
    {/* Box lid */}
    <rect x="22" y="32" width="56" height="12" rx="3" fill="#fbbf24" />
    <rect x="22" y="32" width="56" height="12" rx="3" stroke="#d97706" strokeWidth="2" />
    {/* Horizontal ribbon on lid */}
    <rect x="22" y="36" width="56" height="4" fill="#b45309" />
    {/* Ribbon bow */}
    <ellipse cx="50" cy="28" rx="10" ry="6" fill="#f59e0b" />
    <ellipse cx="42" cy="26" rx="6" ry="4" fill="#fbbf24" />
    <ellipse cx="58" cy="26" rx="6" ry="4" fill="#fbbf24" />
    <circle cx="50" cy="28" r="3" fill="#b45309" />
    {/* Question mark */}
    <text x="50" y="60" fontSize="16" fill="#1e1040" fontWeight="bold" textAnchor="middle">?</text>
    {/* Sparkles */}
    <circle cx="18" cy="20" r="2" fill="#fbbf24" opacity="0.8" />
    <circle cx="82" cy="25" r="1.5" fill="#fbbf24" opacity="0.6" />
    <circle cx="15" cy="55" r="1.5" fill="#fbbf24" opacity="0.7" />
    <circle cx="85" cy="60" r="2" fill="#fbbf24" opacity="0.5" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="check-icon">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const CrossIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="cross-icon">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const HomePage = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Custom Map Creator
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Choose which UI version to test
        </motion.p>
      </header>

      <div className="version-cards">
        {/* Version A: Modal */}
        <motion.div 
          className="version-card"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="card-preview">
            <ModalIcon />
          </div>
          <h2>Version A: Center Modal</h2>
          <p className="card-description">
            Traditional modal overlay that captures full attention. Blocks the lobby view while creating.
          </p>
          <ul className="pros-cons">
            <li className="pro"><CheckIcon /> Familiar pattern</li>
            <li className="pro"><CheckIcon /> Full attention focus</li>
            <li className="con"><CrossIcon /> Blocks game world</li>
            <li className="con"><CrossIcon /> Feels heavier</li>
          </ul>
          <Link to="/modal" className="test-button">
            Test Modal Version
          </Link>
        </motion.div>

        {/* Version B: Side Sheet */}
        <motion.div 
          className="version-card featured"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span className="badge">Recommended</span>
          <div className="card-preview">
            <SideSheetIcon />
          </div>
          <h2>Version B: Side Sheet</h2>
          <p className="card-description">
            Slides in from the right, keeping the lobby visible. More integrated and modern feel.
          </p>
          <ul className="pros-cons">
            <li className="pro"><CheckIcon /> Maintains context</li>
            <li className="pro"><CheckIcon /> Feels lighter</li>
            <li className="pro"><CheckIcon /> Faster animations</li>
            <li className="pro"><CheckIcon /> Modern pattern</li>
          </ul>
          <Link to="/side-sheet" className="test-button primary">
            Test Side Sheet Version
          </Link>
        </motion.div>
      </div>

      {/* Competition Mode Section */}
      <motion.div 
        className="competition-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="competition-card">
          <div className="competition-card__preview">
            <CompetitionIcon />
          </div>
          <div className="competition-card__content">
            <span className="competition-badge">NEW</span>
            <h3>20-Second Competition Mode</h3>
            <p>
              High-stakes speed challenge! Students have 20 seconds to create and submit a map idea. 
              Teacher picks a winner, and that map becomes the official game map.
            </p>
            <ul className="competition-features">
              <li>⏱️ 20-second timer with urgency states</li>
              <li>⚡ Quick theme buttons for instant generation</li>
              <li>🏆 Winner celebration with confetti</li>
              <li>🎮 Demo controls to simulate teacher actions</li>
            </ul>
            <Link to="/competition" className="test-button competition-btn">
              Try Competition Demo
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Mystery Map Challenge Section */}
      <motion.div 
        className="mystery-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="mystery-card">
          <div className="mystery-card__preview">
            <MysteryIcon />
          </div>
          <div className="mystery-card__content">
            <span className="mystery-badge">EXPLORE</span>
            <h3>The Mystery Map Challenge</h3>
            <p>
              Your teacher is looking for the next class map. Create yours and drop it in the 
              Mystery Box. Only the teacher knows who wins -- until reveal day!
            </p>
            <ul className="mystery-features">
              <li>🎯 Mission-driven entry with stakes</li>
              <li>😈 Contextual nudges for your classmates</li>
              <li>🎁 Mystery Box drop animation</li>
              <li>🔒 Sealed suspense until reveal</li>
            </ul>
            <Link to="/mystery" className="test-button mystery-btn">
              Enter the Challenge
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p>All versions optimized for low-grade Chromebooks</p>
        <p className="footer-sub">Enhanced features included: particles, sounds, animations</p>
      </motion.footer>
    </div>
  );
};

export default HomePage;
