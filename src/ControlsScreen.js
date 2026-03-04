import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './ControlsScreen.css';

// Pixel art sprite components using inline SVG for authentic pixel look
const CharacterSprite = ({ variant = 'idle' }) => (
  <svg width="64" height="64" viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
    {/* Body - white ghost-like character */}
    <rect x="12" y="6" width="8" height="2" fill="#ffffff" />
    <rect x="10" y="8" width="12" height="2" fill="#ffffff" />
    <rect x="9" y="10" width="14" height="8" fill="#ffffff" />
    <rect x="9" y="18" width="14" height="4" fill="#ffffff" />
    <rect x="9" y="22" width="3" height="2" fill="#ffffff" />
    <rect x="14" y="22" width="4" height="2" fill="#ffffff" />
    <rect x="20" y="22" width="3" height="2" fill="#ffffff" />
    
    {/* Outline */}
    <rect x="12" y="5" width="8" height="1" fill="#333333" />
    <rect x="10" y="6" width="2" height="2" fill="#333333" />
    <rect x="20" y="6" width="2" height="2" fill="#333333" />
    <rect x="9" y="8" width="1" height="2" fill="#333333" />
    <rect x="22" y="8" width="1" height="2" fill="#333333" />
    <rect x="8" y="10" width="1" height="12" fill="#333333" />
    <rect x="23" y="10" width="1" height="12" fill="#333333" />
    <rect x="9" y="22" width="3" height="1" fill="#333333" />
    <rect x="12" y="23" width="2" height="1" fill="#333333" />
    <rect x="14" y="22" width="4" height="1" fill="#333333" />
    <rect x="14" y="24" width="4" height="1" fill="#333333" />
    <rect x="18" y="23" width="2" height="1" fill="#333333" />
    <rect x="20" y="22" width="3" height="1" fill="#333333" />
    
    {/* Eyes */}
    <rect x="12" y="12" width="2" height="3" fill="#333333" />
    <rect x="18" y="12" width="2" height="3" fill="#333333" />
    
    {/* Wand/Staff */}
    <rect x="23" y="14" width="6" height="2" fill="#8B4513" />
    <rect x="28" y="12" width="3" height="6" fill="#CD853F" />
    <rect x="29" y="11" width="2" height="2" fill="#FF6B35" />
    <rect x="30" y="10" width="2" height="2" fill="#FFD700" />
    <rect x="29" y="16" width="2" height="2" fill="#FF6B35" />
  </svg>
);

const ShootingSprite = () => (
  <svg width="96" height="64" viewBox="0 0 48 32" style={{ imageRendering: 'pixelated' }}>
    {/* Character body */}
    <rect x="12" y="6" width="8" height="2" fill="#ffffff" />
    <rect x="10" y="8" width="12" height="2" fill="#ffffff" />
    <rect x="9" y="10" width="14" height="8" fill="#ffffff" />
    <rect x="9" y="18" width="14" height="4" fill="#ffffff" />
    <rect x="9" y="22" width="3" height="2" fill="#ffffff" />
    <rect x="14" y="22" width="4" height="2" fill="#ffffff" />
    <rect x="20" y="22" width="3" height="2" fill="#ffffff" />
    
    {/* Outline */}
    <rect x="12" y="5" width="8" height="1" fill="#333333" />
    <rect x="10" y="6" width="2" height="2" fill="#333333" />
    <rect x="20" y="6" width="2" height="2" fill="#333333" />
    <rect x="9" y="8" width="1" height="2" fill="#333333" />
    <rect x="22" y="8" width="1" height="2" fill="#333333" />
    <rect x="8" y="10" width="1" height="12" fill="#333333" />
    <rect x="23" y="10" width="1" height="12" fill="#333333" />
    <rect x="9" y="22" width="3" height="1" fill="#333333" />
    <rect x="12" y="23" width="2" height="1" fill="#333333" />
    <rect x="14" y="22" width="4" height="1" fill="#333333" />
    <rect x="14" y="24" width="4" height="1" fill="#333333" />
    <rect x="18" y="23" width="2" height="1" fill="#333333" />
    <rect x="20" y="22" width="3" height="1" fill="#333333" />
    
    {/* Eyes */}
    <rect x="12" y="12" width="2" height="3" fill="#333333" />
    <rect x="18" y="12" width="2" height="3" fill="#333333" />
    
    {/* Wand */}
    <rect x="23" y="14" width="6" height="2" fill="#8B4513" />
    <rect x="28" y="12" width="3" height="6" fill="#CD853F" />
    <rect x="29" y="11" width="2" height="2" fill="#FF6B35" />
    <rect x="30" y="10" width="2" height="2" fill="#FFD700" />
    
    {/* Projectiles - blue magic */}
    <rect x="34" y="10" width="4" height="4" fill="#00BFFF" />
    <rect x="35" y="9" width="2" height="1" fill="#87CEEB" />
    <rect x="35" y="14" width="2" height="1" fill="#87CEEB" />
    <rect x="33" y="11" width="1" height="2" fill="#87CEEB" />
    <rect x="38" y="11" width="1" height="2" fill="#87CEEB" />
    
    <rect x="40" y="8" width="3" height="3" fill="#00BFFF" />
    <rect x="41" y="7" width="1" height="1" fill="#87CEEB" />
    <rect x="41" y="11" width="1" height="1" fill="#87CEEB" />
    
    <rect x="44" y="6" width="2" height="2" fill="#00BFFF" />
    <rect x="44" y="5" width="1" height="1" fill="#87CEEB" />
  </svg>
);

const SpellVariantSprite = ({ variant = 1 }) => {
  const colors = {
    1: { primary: '#FF6B35', secondary: '#FFD700' },
    2: { primary: '#FF6B35', secondary: '#FFD700' },
    3: { primary: '#FF6B35', secondary: '#FFD700' },
  };
  const color = colors[variant];
  
  return (
    <svg width="56" height="56" viewBox="0 0 28 28" style={{ imageRendering: 'pixelated' }}>
      {/* Character body - smaller */}
      <rect x="10" y="5" width="6" height="2" fill="#ffffff" />
      <rect x="8" y="7" width="10" height="2" fill="#ffffff" />
      <rect x="7" y="9" width="12" height="6" fill="#ffffff" />
      <rect x="7" y="15" width="12" height="3" fill="#ffffff" />
      <rect x="7" y="18" width="3" height="2" fill="#ffffff" />
      <rect x="11" y="18" width="4" height="2" fill="#ffffff" />
      <rect x="16" y="18" width="3" height="2" fill="#ffffff" />
      
      {/* Outline */}
      <rect x="10" y="4" width="6" height="1" fill="#333333" />
      <rect x="8" y="5" width="2" height="2" fill="#333333" />
      <rect x="16" y="5" width="2" height="2" fill="#333333" />
      <rect x="7" y="7" width="1" height="2" fill="#333333" />
      <rect x="18" y="7" width="1" height="2" fill="#333333" />
      <rect x="6" y="9" width="1" height="9" fill="#333333" />
      <rect x="19" y="9" width="1" height="9" fill="#333333" />
      <rect x="7" y="18" width="3" height="1" fill="#333333" />
      <rect x="10" y="19" width="1" height="1" fill="#333333" />
      <rect x="11" y="18" width="4" height="1" fill="#333333" />
      <rect x="11" y="20" width="4" height="1" fill="#333333" />
      <rect x="15" y="19" width="1" height="1" fill="#333333" />
      <rect x="16" y="18" width="3" height="1" fill="#333333" />
      
      {/* Eyes */}
      <rect x="10" y="10" width="2" height="2" fill="#333333" />
      <rect x="14" y="10" width="2" height="2" fill="#333333" />
      
      {/* Wand */}
      <rect x="19" y="11" width="5" height="2" fill="#8B4513" />
      <rect x="23" y="9" width="3" height="5" fill="#CD853F" />
      <rect x="24" y="8" width="2" height="2" fill={color.primary} />
      <rect x="25" y="7" width="2" height="2" fill={color.secondary} />
      <rect x="24" y="13" width="2" height="2" fill={color.primary} />
    </svg>
  );
};

const MouseIcon = () => (
  <svg width="48" height="64" viewBox="0 0 24 32">
    {/* Mouse body - rounded rectangle */}
    <rect x="4" y="4" width="16" height="24" rx="8" fill="#ffffff" stroke="#333333" strokeWidth="2" />
    {/* Divider line */}
    <line x1="12" y1="4" x2="12" y2="16" stroke="#e0e0e0" strokeWidth="1" />
    {/* Left click area - green */}
    <path d="M 4 12 Q 4 4 12 4 L 12 16 L 4 16 Z" fill="#4CAF50" />
    {/* Right click area - white/light */}
    <path d="M 12 4 Q 20 4 20 12 L 20 16 L 12 16 Z" fill="#f5f5f5" />
    {/* Scroll wheel */}
    <rect x="10" y="8" width="4" height="6" rx="2" fill="#e0e0e0" stroke="#bbb" strokeWidth="1" />
  </svg>
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const floatAnimation = {
  y: [0, -2, 0, 2, 0],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const spriteIdleAnimation = {
  y: [0, -3, 0, 3, 0],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const spriteHoverAnimation = {
  y: [0, -5, 0, 5, 0],
  rotate: [0, -5, 0, 5, 0],
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const KeyCap = ({ children, wide = false, className = '' }) => {
  return (
    <motion.div
      className={`key-cap ${wide ? 'key-cap--wide' : ''} ${className}`}
      animate={floatAnimation}
      whileHover={{
        scale: 0.92,
        filter: 'brightness(0.85)',
        transition: { duration: 0.1 },
      }}
      whileTap={{
        scale: 0.88,
        filter: 'brightness(0.75)',
      }}
    >
      {children}
    </motion.div>
  );
};

const ControlSection = ({ children, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="control-section"
      variants={sectionVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-hovered={isHovered}
    >
      {React.Children.map(children, (child) => {
        if (child?.props?.className?.includes('sprite-container')) {
          return React.cloneElement(child, { isHovered });
        }
        return child;
      })}
    </motion.div>
  );
};

const SpriteContainer = ({ children, isHovered = false }) => {
  return (
    <motion.div
      className="sprite-container"
      animate={isHovered ? spriteHoverAnimation : spriteIdleAnimation}
    >
      {children}
    </motion.div>
  );
};

const ControlsScreen = () => {
  return (
    <motion.div
      className="controls-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section 1: Movement */}
      <ControlSection>
        <SpriteContainer className="sprite-container">
          <CharacterSprite />
        </SpriteContainer>
        
        <div className="controls-row">
          {/* WASD Cluster */}
          <div className="key-cluster">
            <div className="key-row key-row--centered">
              <KeyCap>W</KeyCap>
            </div>
            <div className="key-row">
              <KeyCap>A</KeyCap>
              <KeyCap>S</KeyCap>
              <KeyCap>D</KeyCap>
            </div>
          </div>

          <span className="or-divider">OR</span>

          {/* Arrow Keys Cluster */}
          <div className="key-cluster">
            <div className="key-row key-row--centered">
              <KeyCap className="arrow-key">↑</KeyCap>
            </div>
            <div className="key-row">
              <KeyCap className="arrow-key">←</KeyCap>
              <KeyCap className="arrow-key">↓</KeyCap>
              <KeyCap className="arrow-key">→</KeyCap>
            </div>
          </div>
        </div>
      </ControlSection>

      {/* Section 2: Cast Spell */}
      <ControlSection>
        <SpriteContainer className="sprite-container">
          <ShootingSprite />
        </SpriteContainer>
        
        <div className="controls-row">
          <motion.div
            className="mouse-icon-container"
            animate={floatAnimation}
            whileHover={{
              scale: 0.95,
              transition: { duration: 0.1 },
            }}
          >
            <MouseIcon />
          </motion.div>

          <span className="or-divider">OR</span>

          <KeyCap wide>Space</KeyCap>
        </div>
      </ControlSection>

      {/* Section 3: Change Spell */}
      <ControlSection>
        <SpriteContainer className="sprite-container">
          <div className="sprite-row">
            <SpellVariantSprite variant={1} />
            <SpellVariantSprite variant={2} />
            <SpellVariantSprite variant={3} />
          </div>
        </SpriteContainer>
        
        <div className="controls-row">
          <div className="key-row key-row--spaced">
            <KeyCap>1</KeyCap>
            <KeyCap>2</KeyCap>
            <KeyCap>3</KeyCap>
          </div>
        </div>
      </ControlSection>
    </motion.div>
  );
};

export default ControlsScreen;
