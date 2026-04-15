import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WinnerCelebration.css';

/**
 * WinnerCelebration - Full-screen winner announcement
 * 
 * Shows when current user wins the competition
 */
const WinnerCelebration = ({ isVisible, winningMap, onClose, playSound }) => {
  const [confettiPieces, setConfettiPieces] = useState([]);

  // Generate confetti on mount
  useEffect(() => {
    if (isVisible) {
      playSound?.('winner');
      
      // Generate confetti pieces
      const pieces = [];
      for (let i = 0; i < 100; i++) {
        pieces.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 3 + Math.random() * 2,
          color: ['#ec4899', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
          size: 8 + Math.random() * 12,
          rotation: Math.random() * 360,
        });
      }
      setConfettiPieces(pieces);
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose?.();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, playSound, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="winner-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Confetti */}
          <div className="confetti-container">
            {confettiPieces.map((piece) => (
              <motion.div
                key={piece.id}
                className="confetti-piece"
                initial={{ 
                  x: `${piece.x}vw`,
                  y: -20,
                  rotate: piece.rotation,
                  opacity: 1
                }}
                animate={{ 
                  y: '110vh',
                  rotate: piece.rotation + 720,
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: 'linear'
                }}
                style={{
                  backgroundColor: piece.color,
                  width: piece.size,
                  height: piece.size * 0.6,
                }}
              />
            ))}
          </div>
          
          {/* Content */}
          <div className="celebration-content">
            {/* Trophy Icon */}
            <motion.div 
              className="trophy-icon"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 10,
                delay: 0.2
              }}
            >
              🏆
            </motion.div>
            
            {/* Title */}
            <motion.h1 
              className="winner-title"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              YOU WON!
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className="winner-subtitle"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Your map was chosen!
            </motion.p>
            
            {/* Winning Map */}
            {winningMap && (
              <motion.div 
                className="winning-map"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div 
                  className="winning-map-image"
                  style={{ background: winningMap.imageUrl }}
                />
                <p className="map-name">"{winningMap.prompt}"</p>
              </motion.div>
            )}
            
            {/* Message */}
            <motion.p 
              className="winner-message"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Everyone will play on YOUR map!
            </motion.p>
          </div>
          
          {/* Sparkle effects */}
          <div className="sparkle-container">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="sparkle"
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: Math.random() * 3,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * CompetitionResult - Non-winner result overlay
 * 
 * Shows when another student wins
 */
const CompetitionResult = ({ isVisible, winningMap, onClose, playSound }) => {
  useEffect(() => {
    if (isVisible) {
      playSound?.('result');
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose?.();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, playSound, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="competition-result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
        >
          <motion.div 
            className="result-content"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="result-icon">🎨</div>
            
            {/* Title */}
            <h2>Map Selected!</h2>
            
            {/* Subtitle */}
            <p>Another student's map was chosen.</p>
            
            {/* Winning Map Preview */}
            {winningMap && (
              <div className="winning-map-preview">
                <div 
                  className="preview-image"
                  style={{ background: winningMap.imageUrl }}
                />
                <p className="preview-prompt">"{winningMap.prompt}"</p>
                <p className="preview-creator">by {winningMap.name}</p>
              </div>
            )}
            
            {/* Encouragement */}
            <p className="encouragement">Try again in the next competition!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { WinnerCelebration, CompetitionResult };
export default WinnerCelebration;
