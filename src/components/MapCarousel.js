import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MapCarousel.css';

const MAP_IMAGES = [
  '/map-purple.png',
  '/map-lava.png',
  '/map-crystal.png',
];

const MOCK_SUBMISSIONS = [
  { id: 1, studentName: 'Alex Chen', mapTitle: 'Volcanic Island', mapImage: MAP_IMAGES[0] },
  { id: 2, studentName: 'Sarah Miller', mapTitle: 'Lava Fortress', mapImage: MAP_IMAGES[1] },
  { id: 3, studentName: 'Emma Davis', mapTitle: 'Crystal Caverns', mapImage: MAP_IMAGES[2] },
  { id: 4, studentName: 'James Wilson', mapTitle: 'Shadow Realm', mapImage: MAP_IMAGES[0] },
  { id: 5, studentName: 'Marcus Johnson', mapTitle: 'Inferno Peak', mapImage: MAP_IMAGES[1] },
  { id: 6, studentName: 'Olivia Brown', mapTitle: 'Frozen Tundra', mapImage: MAP_IMAGES[2] },
  { id: 7, studentName: 'Liam Garcia', mapTitle: 'Forest Gum', mapImage: MAP_IMAGES[0] },
  { id: 8, studentName: 'Sophia Martinez', mapTitle: 'Magma Maze', mapImage: MAP_IMAGES[1] },
  { id: 9, studentName: 'Noah Anderson', mapTitle: 'Diamond Den', mapImage: MAP_IMAGES[2] },
  { id: 10, studentName: 'Isabella Thomas', mapTitle: 'Mystic Garden', mapImage: MAP_IMAGES[0] },
  { id: 11, studentName: 'Ethan Jackson', mapTitle: 'Fire Mountain', mapImage: MAP_IMAGES[1] },
  { id: 12, studentName: 'Mia White', mapTitle: 'Ice Palace', mapImage: MAP_IMAGES[2] },
  { id: 13, studentName: 'Lucas Brown', mapTitle: 'Enchanted Woods', mapImage: MAP_IMAGES[0] },
  { id: 14, studentName: 'Ava Taylor', mapTitle: 'Burning Sands', mapImage: MAP_IMAGES[1] },
  { id: 15, studentName: 'Mason Lee', mapTitle: 'Starlight Cave', mapImage: MAP_IMAGES[2] },
  { id: 16, studentName: 'Charlotte Harris', mapTitle: 'Neon City', mapImage: MAP_IMAGES[0] },
  { id: 17, studentName: 'Logan Clark', mapTitle: 'Molten Core', mapImage: MAP_IMAGES[1] },
  { id: 18, studentName: 'Amelia Lewis', mapTitle: 'Aurora Falls', mapImage: MAP_IMAGES[2] },
  { id: 19, studentName: 'Oliver Walker', mapTitle: 'Jungle Temple', mapImage: MAP_IMAGES[0] },
  { id: 20, studentName: 'Harper Hall', mapTitle: 'Dragon Lair', mapImage: MAP_IMAGES[1] },
  { id: 21, studentName: 'Elijah Young', mapTitle: 'Gem Grotto', mapImage: MAP_IMAGES[2] },
  { id: 22, studentName: 'Evelyn King', mapTitle: 'Twilight Zone', mapImage: MAP_IMAGES[0] },
  { id: 23, studentName: 'William Wright', mapTitle: 'Ember Valley', mapImage: MAP_IMAGES[1] },
  { id: 24, studentName: 'Abigail Scott', mapTitle: 'Prism Peak', mapImage: MAP_IMAGES[2] },
];

const CONFETTI_COLORS = ['#fec739', '#fde447', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];

const MapCarousel = ({
  isVisible,
  onMapConfirmed,
  onClose,
  currentWinner,
  joinCode = '420042',
  initialSubmissions = MOCK_SUBMISSIONS
}) => {
  const [submissions] = useState(initialSubmissions);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [spinnerMaps, setSpinnerMaps] = useState([]);
  const [celebrationMode, setCelebrationMode] = useState(false);
  const [confirmedMap, setConfirmedMap] = useState(null);
  const rollIntervalRef = useRef(null);
  const gridRef = useRef(null);

  const confettiParticles = useMemo(() => 
    [...Array(50)].map((_, i) => ({
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
      startX: Math.random() * 100,
      endX: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 0.5,
      rotation: Math.random() * 720 - 360,
    })), []);

  const handleMapClick = (map) => {
    if (isRolling || celebrationMode) return;
    setSelectedMapId(map.id);
  };

  const handleRandomPick = () => {
    if (isRolling || celebrationMode || showSpinner) return;
    
    setIsRolling(true);
    setShowSpinner(true);
    
    const shuffledMaps = [...submissions].sort(() => Math.random() - 0.5).slice(0, 8);
    setSpinnerMaps(shuffledMaps);
    
    const finalIndex = Math.floor(Math.random() * submissions.length);
    const finalMap = submissions[finalIndex];
    
    setTimeout(() => {
      setShowSpinner(false);
      setIsRolling(false);
      setConfirmedMap(finalMap);
      setSelectedMapId(finalMap.id);
      setCelebrationMode(true);
    }, 3000);
  };

  const handleConfirm = () => {
    if (celebrationMode) return;
    const selectedMap = submissions.find(s => s.id === selectedMapId);
    if (selectedMap) {
      setConfirmedMap(selectedMap);
      setCelebrationMode(true);
    }
  };

  const handleUseThisMap = () => {
    if (confirmedMap && onMapConfirmed) {
      onMapConfirmed(confirmedMap);
    }
    onClose();
  };


  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) {
        clearTimeout(rollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentWinner?.id) {
      setSelectedMapId(currentWinner.id);
    }
  }, [currentWinner]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const selectedMap = submissions.find(s => s.id === selectedMapId);

  return (
    <motion.div
      className={`map-overlay ${celebrationMode ? 'map-overlay--celebration' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Join Code - Top Left */}
      <div className="map-overlay__join-code">
        <span className="map-overlay__join-label">JOIN CODE</span>
        <span className="map-overlay__join-value">{joinCode}</span>
      </div>

      {/* Back to Lobby button - hidden in celebration mode */}
      {!celebrationMode && (
        <button className="map-overlay__close" onClick={onClose}>
          ← Back to Lobby
        </button>
      )}

      {/* Spinner Overlay */}
      <AnimatePresence>
        {showSpinner && (
          <motion.div
            className="random-spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="random-spinner__content">
              <motion.div 
                className="random-spinner__wheel"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              >
                {spinnerMaps.slice(0, 6).map((map, index) => (
                  <div 
                    key={map.id} 
                    className="random-spinner__map-slot"
                    style={{ 
                      transform: `rotate(${index * 60}deg) translateY(-120px)` 
                    }}
                  >
                    <img src={map.mapImage} alt={map.mapTitle} />
                  </div>
                ))}
              </motion.div>
              <div className="random-spinner__center">
                <span className="random-spinner__dice">🎲</span>
              </div>
              <motion.p 
                className="random-spinner__text"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Picking a random map...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!celebrationMode ? (
          <motion.div
            key="grid-view"
            className="map-overlay__grid-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="map-overlay__header">
              <h2 className="map-overlay__title">🗺️ Select a Map</h2>
              <div className="map-overlay__counter">
                {submissions.length} maps submitted
              </div>
            </div>

            {/* Grid with scroll fade wrapper */}
            <div className="map-overlay__grid-wrapper">
              <div className="map-overlay__grid" ref={gridRef}>
                {submissions.map((map) => {
                  const isSelected = selectedMapId === map.id;
                  
                  return (
                    <motion.div
                      key={map.id}
                      data-map-id={map.id}
                      className={`map-overlay__grid-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleMapClick(map)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      animate={isSelected ? { 
                        boxShadow: '0 0 30px rgba(254, 199, 57, 0.6)' 
                      } : {}}
                    >
                      <div className="map-overlay__grid-card-preview">
                        <img 
                          src={map.mapImage} 
                          alt={`${map.studentName}'s map`}
                        />
                      </div>
                      <div className="map-overlay__grid-card-info">
                        <span className="map-overlay__grid-card-title">{map.mapTitle}</span>
                        <span className="map-overlay__grid-card-author">by {map.studentName}</span>
                      </div>
                      {isSelected && (
                        <motion.div 
                          className="map-overlay__grid-card-check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="map-overlay__actions">
              <button 
                className={`map-overlay__btn map-overlay__btn--random ${isRolling ? 'rolling' : ''}`}
                onClick={handleRandomPick}
                disabled={isRolling}
              >
                🎲 {isRolling ? 'Picking...' : 'Random Pick'}
              </button>
              <button 
                className="map-overlay__btn map-overlay__btn--confirm"
                onClick={handleConfirm}
                disabled={isRolling || !selectedMapId}
              >
                ✓ {selectedMap ? `Select "${selectedMap.mapTitle}"` : 'Select a Map'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="celebration-view"
            className="celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Confetti */}
            <div className="celebration__confetti">
              {confettiParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="celebration__particle"
                  initial={{ 
                    top: '-5%',
                    left: `${particle.startX}%`,
                    rotate: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    top: '110%',
                    left: `${particle.endX}%`,
                    rotate: particle.rotation,
                    opacity: [1, 1, 0]
                  }}
                  transition={{ 
                    duration: particle.duration,
                    delay: particle.delay,
                    ease: "easeOut"
                  }}
                  style={{
                    backgroundColor: particle.color,
                    width: particle.size,
                    height: particle.size,
                  }}
                />
              ))}
            </div>

            {/* Winner Card */}
            <motion.div
              className="celebration__card"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            >
              <motion.div 
                className="celebration__badge"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="celebration__label">MAP SELECTED!</span>
              </motion.div>

              <motion.div 
                className="celebration__map"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <img src={confirmedMap?.mapImage} alt={confirmedMap?.mapTitle} />
              </motion.div>

              <motion.div 
                className="celebration__info"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="celebration__title">{confirmedMap?.mapTitle}</h3>
                <p className="celebration__author">by {confirmedMap?.studentName}</p>
              </motion.div>

              <motion.div 
                className="celebration__actions"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <button 
                  className="celebration__btn celebration__btn--confirm"
                  onClick={handleUseThisMap}
                >
                  ✓ Use This Map
                </button>
                <button 
                  className="celebration__back-link"
                  onClick={() => {
                    setCelebrationMode(false);
                    setConfirmedMap(null);
                  }}
                >
                  ← Choose a different map
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MapCarousel;
