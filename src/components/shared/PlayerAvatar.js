import React from 'react';
import { motion } from 'framer-motion';
import CharacterSprite from './CharacterSprite';

const PlayerAvatar = ({ player, index, isWinner }) => {
  return (
    <motion.div
      className="player-avatar"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {isWinner && (
        <motion.div
          className="winner-crown"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          👑
        </motion.div>
      )}
      <div className="player-avatar__sprite">
        <CharacterSprite style={player.avatar} size={70} />
      </div>
      <span className="player-avatar__name">{player.name}</span>
    </motion.div>
  );
};

export default PlayerAvatar;
