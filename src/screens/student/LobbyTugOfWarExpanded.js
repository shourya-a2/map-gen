import React from 'react';
import { motion } from 'framer-motion';
import LobbyTugOfWar from './LobbyTugOfWar';
import './LobbyTugOfWarExpanded.css';

// Expanded view — same prototype, extended canvas. Layout work TBD.
const LobbyTugOfWarExpanded = () => {
  return (
    <div className="tow-expanded-wrapper">
      <motion.div
        className="tow-expanded-badge"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        EXPANDED VIEW
      </motion.div>
      <LobbyTugOfWar challengeVariant="modal" />
    </div>
  );
};

export default LobbyTugOfWarExpanded;
