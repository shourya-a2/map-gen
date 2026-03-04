import React from 'react';
import { motion } from 'framer-motion';
import './ControlsScreenFull.css';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.2,
    },
  },
};

const keyVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const labelVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.6,
      ease: 'easeOut',
    },
  },
};

const labelVariantsRight = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.6,
      ease: 'easeOut',
    },
  },
};

// Key component
const Key = ({ children, highlighted = false, wide = false, extraWide = false, className = '' }) => {
  return (
    <motion.div
      className={`kb-key ${highlighted ? 'kb-key--highlighted' : ''} ${wide ? 'kb-key--wide' : ''} ${extraWide ? 'kb-key--extra-wide' : ''} ${className}`}
      variants={keyVariants}
      whileHover={highlighted ? {
        scale: 1.08,
        boxShadow: '0 0 25px rgba(0, 200, 255, 0.7), inset 0 0 20px rgba(0, 200, 255, 0.4)',
      } : {}}
      whileTap={highlighted ? { scale: 0.95 } : {}}
    >
      {children}
    </motion.div>
  );
};

// Label with connector line
const ControlLabel = ({ children, position = 'left', style = {} }) => {
  const isLeft = position === 'left';
  
  return (
    <motion.div
      className={`control-label control-label--${position}`}
      style={style}
      variants={isLeft ? labelVariants : labelVariantsRight}
      initial="hidden"
      animate="visible"
    >
      <div className="control-label__box">
        {children}
      </div>
      <svg className="control-label__connector" style={{
        position: 'absolute',
        top: '50%',
        [isLeft ? 'right' : 'left']: '-50px',
        transform: 'translateY(-50%)',
        width: '50px',
        height: '20px',
        overflow: 'visible',
      }}>
        <line
          x1={isLeft ? 0 : 50}
          y1="10"
          x2={isLeft ? 50 : 0}
          y2="10"
          stroke="#00c8ff"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        <circle
          cx={isLeft ? 50 : 0}
          cy="10"
          r="4"
          fill="#00c8ff"
        />
      </svg>
    </motion.div>
  );
};

const ControlsScreenFull = () => {
  // Define which keys are highlighted
  const highlightedKeys = new Set([
    '1', '2', '3',
    'w', 'a', 's', 'd',
    'up', 'down', 'left', 'right',
    'space'
  ]);

  return (
    <div className="controls-screen-full">
      {/* Title */}
      <motion.h1 
        className="controls-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        KEYBOARD CONTROLS
      </motion.h1>

      <div className="controls-layout">
        {/* Left Labels */}
        <div className="labels-left">
          <ControlLabel position="left" style={{ top: '85px' }}>
            CHANGE SPELLS
          </ControlLabel>
          
          <ControlLabel position="left" style={{ top: '195px' }}>
            MOVE AROUND
          </ControlLabel>
        </div>

        {/* Keyboard + Arrow Keys */}
        <div className="keyboard-wrapper">
          <motion.div 
            className="keyboard-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="keyboard">
              {/* Row 1: Function keys */}
              <div className="keyboard-row">
                <Key>ESC</Key>
                <div className="key-spacer" />
                <Key>F1</Key>
                <Key>F2</Key>
                <Key>F3</Key>
                <Key>F4</Key>
                <div className="key-spacer-small" />
                <Key>F5</Key>
                <Key>F6</Key>
                <Key>F7</Key>
                <Key>F8</Key>
                <div className="key-spacer-small" />
                <Key>F9</Key>
                <Key>F10</Key>
                <Key>F11</Key>
                <Key>F12</Key>
              </div>

              {/* Row 2: Numbers */}
              <div className="keyboard-row">
                <Key>`</Key>
                <Key highlighted={highlightedKeys.has('1')}>1</Key>
                <Key highlighted={highlightedKeys.has('2')}>2</Key>
                <Key highlighted={highlightedKeys.has('3')}>3</Key>
                <Key>4</Key>
                <Key>5</Key>
                <Key>6</Key>
                <Key>7</Key>
                <Key>8</Key>
                <Key>9</Key>
                <Key>0</Key>
                <Key>-</Key>
                <Key>=</Key>
                <Key wide>⌫</Key>
              </div>

              {/* Row 3: QWERTY */}
              <div className="keyboard-row">
                <Key wide>TAB</Key>
                <Key>Q</Key>
                <Key highlighted={highlightedKeys.has('w')}>W</Key>
                <Key>E</Key>
                <Key>R</Key>
                <Key>T</Key>
                <Key>Y</Key>
                <Key>U</Key>
                <Key>I</Key>
                <Key>O</Key>
                <Key>P</Key>
                <Key>[</Key>
                <Key>]</Key>
                <Key>\</Key>
              </div>

              {/* Row 4: ASDF */}
              <div className="keyboard-row">
                <Key wide>CAPS</Key>
                <Key highlighted={highlightedKeys.has('a')}>A</Key>
                <Key highlighted={highlightedKeys.has('s')}>S</Key>
                <Key highlighted={highlightedKeys.has('d')}>D</Key>
                <Key>F</Key>
                <Key>G</Key>
                <Key>H</Key>
                <Key>J</Key>
                <Key>K</Key>
                <Key>L</Key>
                <Key>;</Key>
                <Key>'</Key>
                <Key wide>ENTER</Key>
              </div>

              {/* Row 5: ZXCV */}
              <div className="keyboard-row">
                <Key extraWide>SHIFT</Key>
                <Key>Z</Key>
                <Key>X</Key>
                <Key>C</Key>
                <Key>V</Key>
                <Key>B</Key>
                <Key>N</Key>
                <Key>M</Key>
                <Key>,</Key>
                <Key>.</Key>
                <Key>/</Key>
                <Key extraWide>SHIFT</Key>
              </div>

              {/* Row 6: Space */}
              <div className="keyboard-row">
                <Key wide>CTRL</Key>
                <Key>⌥</Key>
                <Key wide>⌘</Key>
                <Key highlighted={highlightedKeys.has('space')} className="kb-key--space">SPACE</Key>
                <Key wide>⌘</Key>
                <Key>⌥</Key>
                <Key>FN</Key>
                <Key wide>CTRL</Key>
              </div>
            </div>
          </motion.div>

          {/* Arrow Keys */}
          <motion.div 
            className="arrow-keys-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="arrow-keys">
              <div className="arrow-keys-row arrow-keys-row--top">
                <Key highlighted={highlightedKeys.has('up')}>↑</Key>
              </div>
              <div className="arrow-keys-row">
                <Key highlighted={highlightedKeys.has('left')}>←</Key>
                <Key highlighted={highlightedKeys.has('down')}>↓</Key>
                <Key highlighted={highlightedKeys.has('right')}>→</Key>
              </div>
            </div>
          </motion.div>

          {/* Bottom Label for Space */}
          <motion.div 
            className="bottom-label"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
          >
            <svg className="control-label__connector-up" width="20" height="40">
              <line x1="10" y1="40" x2="10" y2="0" stroke="#00c8ff" strokeWidth="2" strokeDasharray="4 2" />
              <circle cx="10" cy="40" r="4" fill="#00c8ff" />
            </svg>
            <div className="control-label__box">
              CAST SPELL
            </div>
          </motion.div>
        </div>

        {/* Right Labels */}
        <div className="labels-right">
          <ControlLabel position="right" style={{ top: '195px' }}>
            MOVE AROUND
          </ControlLabel>
        </div>
      </div>
    </div>
  );
};

export default ControlsScreenFull;
