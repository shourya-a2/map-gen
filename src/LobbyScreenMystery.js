import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenMystery.css';
import MysteryMapChallenge from './components/MysteryMapChallenge';
import mapPreview from './assets/wayarena-map-preview.png';

const LobbyScreenMystery = () => {
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState('create');

  const handlePlayWayarena = useCallback(() => {
    console.log('Playing Wayarena default map');
  }, []);

  const handleCreateMap = useCallback(() => {
    setDefaultTab('create');
    setIsChallengeOpen(true);
  }, []);

  const handleMyMaps = useCallback(() => {
    setDefaultTab('mymaps');
    setIsChallengeOpen(true);
  }, []);

  const handleCloseChallenge = useCallback(() => {
    setIsChallengeOpen(false);
  }, []);

  const handleMapSubmitted = useCallback((map) => {
    console.log('Map submitted:', map);
  }, []);

  return (
    <div className="mystery-lobby">
      <div className="maps-panel">
        {/* Hero Card - Square Wayarena Map */}
        <motion.div 
          className="hero-map-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePlayWayarena}
        >
          <div className="hero-map-card__preview">
            <img src={mapPreview} alt="Wayarena" />
          </div>
          <div className="hero-map-card__info">
            <span className="hero-map-card__label">DEFAULT MAP</span>
            <h3 className="hero-map-card__title">Wayarena</h3>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="maps-actions">
          <motion.button 
            className="maps-action-btn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateMap}
          >
            Create Your Own Map
          </motion.button>
          <motion.button 
            className="maps-action-btn maps-action-btn--secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMyMaps}
          >
            My Maps
          </motion.button>
        </div>
      </div>

      {/* Side Sheet */}
      <AnimatePresence>
        {isChallengeOpen && (
          <MysteryMapChallenge
            isOpen={isChallengeOpen}
            onClose={handleCloseChallenge}
            onMapSubmitted={handleMapSubmitted}
            playerCount={28}
            defaultTab={defaultTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyScreenMystery;
