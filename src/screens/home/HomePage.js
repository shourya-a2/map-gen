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

const TeacherIcon = () => (
  <svg viewBox="0 0 100 80" fill="none" className="preview-icon">
    {/* Background */}
    <rect x="0" y="0" width="100" height="80" rx="8" fill="#0f172a" />
    {/* Dashboard grid */}
    <rect x="8" y="12" width="40" height="28" rx="4" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
    <rect x="52" y="12" width="40" height="28" rx="4" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
    <rect x="8" y="44" width="40" height="28" rx="4" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
    <rect x="52" y="44" width="40" height="28" rx="4" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
    {/* Card 1 - Map preview */}
    <rect x="12" y="18" width="14" height="10" rx="2" fill="#3b82f6" opacity="0.4" />
    <rect x="28" y="18" width="16" height="3" rx="1" fill="#64748b" />
    <rect x="28" y="24" width="12" height="2" rx="1" fill="#475569" />
    {/* Card 2 - Stats */}
    <rect x="56" y="18" width="8" height="16" rx="2" fill="#22c55e" opacity="0.6" />
    <rect x="66" y="22" width="8" height="12" rx="2" fill="#3b82f6" opacity="0.6" />
    <rect x="76" y="26" width="8" height="8" rx="2" fill="#f59e0b" opacity="0.6" />
    {/* Card 3 - Map preview */}
    <rect x="12" y="50" width="14" height="10" rx="2" fill="#f59e0b" opacity="0.4" />
    <rect x="28" y="50" width="16" height="3" rx="1" fill="#64748b" />
    <rect x="28" y="56" width="12" height="2" rx="1" fill="#475569" />
    {/* Card 4 - Checkmarks */}
    <circle cx="62" cy="54" r="4" fill="#22c55e" opacity="0.3" />
    <path d="M60 54 L61.5 55.5 L64 52.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="74" cy="54" r="4" fill="#22c55e" opacity="0.3" />
    <path d="M72 54 L73.5 55.5 L76 52.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="86" cy="54" r="4" fill="#64748b" opacity="0.3" />
    {/* Crown/teacher indicator */}
    <path d="M46 6 L50 2 L54 6 L52 6 L50 4 L48 6 Z" fill="#f59e0b" />
  </svg>
);

const Teacher2Icon = () => (
  <svg viewBox="0 0 100 80" fill="none" className="preview-icon">
    {/* Background */}
    <rect x="0" y="0" width="100" height="80" rx="8" fill="#16161f" />
    {/* Join code card at top */}
    <rect x="15" y="8" width="70" height="30" rx="6" fill="#1f1f2e" stroke="#ec4899" strokeWidth="1" opacity="0.8" />
    <rect x="22" y="14" width="30" height="4" rx="2" fill="#ffffff" opacity="0.8" />
    <rect x="22" y="22" width="45" height="8" rx="2" fill="#ec4899" opacity="0.3" />
    <text x="30" y="29" fontSize="7" fill="white" fontWeight="bold">420042</text>
    {/* Bottom sheet */}
    <rect x="0" y="45" width="100" height="35" rx="12" fill="#1f1f2e" />
    <rect x="0" y="45" width="100" height="2" fill="#ec4899" opacity="0.5" />
    {/* Handle bar */}
    <rect x="42" y="48" width="16" height="3" rx="1.5" fill="#ffffff" opacity="0.3" />
    {/* Map cards in sheet */}
    <rect x="8" y="55" width="18" height="18" rx="3" fill="#2d0a4e" stroke="#ec4899" strokeWidth="1" />
    <rect x="30" y="55" width="18" height="18" rx="3" fill="#2d0a4e" stroke="#ec4899" strokeWidth="1" />
    <rect x="52" y="55" width="18" height="18" rx="3" fill="#2d0a4e" stroke="#ec4899" strokeWidth="1" />
    <rect x="74" y="55" width="18" height="18" rx="3" fill="#2d0a4e" stroke="#ec4899" strokeWidth="1" />
    {/* Arrow hint */}
    <path d="M48 64 L52 68 L48 72" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
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
            <span className="mystery-badge">STUDENT</span>
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

      {/* Tug of War Section */}
      <motion.div
        className="mystery-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <div className="mystery-card">
          <div className="mystery-card__content">
            <span className="mystery-badge" style={{ background:'#e63946' }}>TUG OF WAR</span>
            <h3>Battlefield Background Designer</h3>
            <p>
              Design the stage for the tug-of-war battle. Describe a scene —
              pirate beach, magic castle, volcano crater — and paint the battlefield
              your classmates will fight on.
            </p>
            <ul className="mystery-features">
              <li>⚔️ Scene-layered pixel backgrounds</li>
              <li>🎨 Theme detection from your description</li>
              <li>🏆 Waiting room after submission</li>
              <li>🎉 Battle fanfare on reveal</li>
            </ul>
            <Link to="/tug-of-war" className="test-button mystery-btn" style={{ background:'#e63946' }}>
              Paint the Battlefield
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Vault Customization Section */}
      <motion.div
        className="mystery-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.58 }}
      >
        <div className="mystery-card">
          <div className="mystery-card__content">
            <span className="mystery-badge" style={{ background:'#7c3aed' }}>VAULT</span>
            <h3>Vault Customization Studio</h3>
            <p>
              Design the look of your own vault. Describe a scene — crystal cave,
              neon cyber vault, ancient temple — and the skin is applied directly to
              your vault. No submission, no teacher — it's all yours.
            </p>
            <ul className="mystery-features">
              <li>🏛️ Prompt-driven vault skin generation</li>
              <li>✨ Instant apply — no teacher required</li>
              <li>🎨 My Skins library for switching looks</li>
              <li>🎉 Big reveal animation on completion</li>
            </ul>
            <Link to="/vault/side-sheet" className="test-button mystery-btn" style={{ background:'#7c3aed' }}>
              Customize Your Vault
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Teacher Dashboard Section */}
      <motion.div 
        className="teacher-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="teacher-card">
          <div className="teacher-card__preview">
            <TeacherIcon />
          </div>
          <div className="teacher-card__content">
            <span className="teacher-badge">TEACHER</span>
            <h3>Teacher Dashboard</h3>
            <p>
              Review and manage student map submissions. Approve maps, provide feedback,
              and select the winning map for your class challenge.
            </p>
            <ul className="teacher-features">
              <li>📋 View all student submissions</li>
              <li>✅ Approve or request revisions</li>
              <li>🏆 Select winning maps</li>
              <li>📊 Track submission stats</li>
            </ul>
            <Link to="/teacher" className="test-button teacher-btn">
              Open Dashboard
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Teacher Dashboard 2 Section */}
      <motion.div 
        className="teacher2-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <div className="teacher2-card">
          <div className="teacher2-card__preview">
            <Teacher2Icon />
          </div>
          <div className="teacher2-card__content">
            <span className="teacher2-badge">NEW</span>
            <h3>Teacher Dashboard 2</h3>
            <p>
              Bottom sheet map selection UI. Browse maps without losing sight of the join code.
              Features carousel view, grid view, search, and sorting.
            </p>
            <ul className="teacher2-features">
              <li>📱 Swipeable bottom sheet (peek/half/full)</li>
              <li>📷 Carousel & grid view modes</li>
              <li>🔍 Search and sort submissions</li>
              <li>🎲 Random selection with preview</li>
            </ul>
            <Link to="/teacher2" className="test-button teacher2-btn">
              Try Bottom Sheet UI
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <p>All versions optimized for low-grade Chromebooks</p>
        <p className="footer-sub">Enhanced features included: particles, sounds, animations</p>
      </motion.footer>
    </div>
  );
};

export default HomePage;
