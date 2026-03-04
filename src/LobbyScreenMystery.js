import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenMystery.css';
import MysteryMapChallenge from './components/MysteryMapChallenge';
import mapPreview from './assets/wayarena-map-preview.png';
import MockupMapImage from './assets/mockup-map.png';

const LobbyScreenMystery = () => {
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState('create');

  const handlePlayWayarena = useCallback(() => {
    // Play the default Wayarena map
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
    console.log('Map submitted to Mystery Box:', map);
  }, []);

  return (
    <div className="mystery-lobby">
      {/* Maps Section */}
      <div className="maps-section">
        <h2 className="maps-section-title">MAPS</h2>
        
        <div className="maps-grid">
          {/* Wayarena Default Map Card */}
          <motion.div 
            className="map-card map-card-wayarena"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlayWayarena}
          >
            <div className="map-card-preview">
              <img src={mapPreview} alt="Wayarena Map" />
              <div className="map-card-badge">DEFAULT</div>
            </div>
            <div className="map-card-info">
              <h3 className="map-card-title">Wayarena</h3>
              <p className="map-card-desc">Classic battle arena</p>
            </div>
          </motion.div>

          {/* Create My Own Map Card */}
          <motion.div 
            className="map-card map-card-create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateMap}
          >
            <div className="map-card-preview map-card-preview-create">
              <div className="create-icon">
                <span className="create-icon-plus">+</span>
                <span className="create-icon-sparkle">✨</span>
              </div>
            </div>
            <div className="map-card-info">
              <h3 className="map-card-title">Create Map</h3>
              <p className="map-card-desc">Design your own</p>
            </div>
          </motion.div>

          {/* My Maps Card */}
          <motion.div 
            className="map-card map-card-mymaps"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMyMaps}
          >
            <div className="map-card-preview">
              <img src={MockupMapImage} alt="My Maps" />
              <div className="map-card-count">2</div>
            </div>
            <div className="map-card-info">
              <h3 className="map-card-title">My Maps</h3>
              <p className="map-card-desc">Your creations</p>
            </div>
          </motion.div>
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
