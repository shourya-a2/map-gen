import React from 'react';
import { motion } from 'framer-motion';

// Host character sprite (ghost-like character from the screenshot)
const HostCharacterSprite = ({ size = 160 }) => {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 160 208" style={{ imageRendering: 'auto' }}>
      {/* Hat */}
      <ellipse cx="80" cy="25" rx="45" ry="20" fill="#FFFFFF" />
      <rect x="35" y="20" width="90" height="35" fill="#FFFFFF" />
      <ellipse cx="80" cy="55" rx="45" ry="12" fill="#FFFFFF" />
      {/* Hat band */}
      <rect x="35" y="45" width="90" height="8" fill="#333" />
      {/* Hat decoration (smiley) */}
      <circle cx="80" cy="35" r="12" fill="#FFD700" />
      <circle cx="76" cy="33" r="2" fill="#333" />
      <circle cx="84" cy="33" r="2" fill="#333" />
      <path d="M 75 38 Q 80 42 85 38" stroke="#333" strokeWidth="1.5" fill="none" />
      
      {/* Hair (blue ponytail) */}
      <ellipse cx="80" cy="65" rx="35" ry="25" fill="#00CED1" />
      <path d="M 45 65 Q 30 90 35 130" stroke="#00CED1" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d="M 115 65 Q 130 90 125 130" stroke="#00CED1" strokeWidth="20" fill="none" strokeLinecap="round" />
      
      {/* Face */}
      <ellipse cx="80" cy="85" rx="32" ry="28" fill="#FFE4E1" />
      
      {/* Eyes */}
      <ellipse cx="68" cy="82" rx="6" ry="8" fill="#333" />
      <ellipse cx="92" cy="82" rx="6" ry="8" fill="#333" />
      <ellipse cx="70" cy="80" rx="2" ry="2" fill="#FFF" />
      <ellipse cx="94" cy="80" rx="2" ry="2" fill="#FFF" />
      
      {/* Mask/bandana */}
      <path d="M 50 95 Q 80 110 110 95 L 110 105 Q 80 120 50 105 Z" fill="#008B8B" />
      
      {/* Body (white robe/cloak) */}
      <path d="M 50 110 Q 30 130 35 180 L 55 185 L 60 150 L 80 155 L 100 150 L 105 185 L 125 180 Q 130 130 110 110 Z" fill="#FFFFFF" />
      
      {/* Arms */}
      <ellipse cx="35" cy="140" rx="15" ry="12" fill="#FFE4E1" />
      <ellipse cx="125" cy="140" rx="15" ry="12" fill="#FFE4E1" />
      
      {/* Yellow scarf/accessory */}
      <path d="M 100 115 Q 130 125 125 160" stroke="#FFD700" strokeWidth="12" fill="none" strokeLinecap="round" />
      
      {/* Money bag */}
      <ellipse cx="130" cy="175" rx="20" ry="25" fill="#DAA520" />
      <ellipse cx="130" cy="155" rx="12" ry="8" fill="#B8860B" />
      <text x="130" y="180" textAnchor="middle" fill="#8B4513" fontSize="16" fontWeight="bold">$</text>
      
      {/* Legs */}
      <rect x="55" y="180" width="18" height="25" rx="6" fill="#1C1C1C" />
      <rect x="87" y="180" width="18" height="25" rx="6" fill="#1C1C1C" />
      
      {/* Shoes */}
      <ellipse cx="64" cy="205" rx="12" ry="6" fill="#333" />
      <ellipse cx="96" cy="205" rx="12" ry="6" fill="#333" />
    </svg>
  );
};

const CharacterStage = ({ host }) => {
  return (
    <div className="character-stage">
      {/* Main character */}
      <motion.div 
        className="host-character"
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: 'spring',
          damping: 15,
          stiffness: 100,
          delay: 0.3,
        }}
      >
        <motion.div
          animate={{ 
            y: [0, -5, 0, 5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <HostCharacterSprite size={180} />
        </motion.div>
      </motion.div>

      {/* Stage platform */}
      <motion.div 
        className="stage-platform"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="stage-name">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {host.name}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            {host.name}
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
};

export default CharacterStage;
