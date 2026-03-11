import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MapCarousel.css';

const MAP_IMAGES = [
  '/map-purple.png',
  '/map-lava.png',
  '/map-crystal.png',
];

const MOCK_SUBMISSIONS = [
  { id: 1, studentName: 'Alex Chen', mapImage: MAP_IMAGES[0] },
  { id: 2, studentName: 'Sarah Miller', mapImage: MAP_IMAGES[1] },
  { id: 3, studentName: 'Emma Davis', mapImage: MAP_IMAGES[2] },
  { id: 4, studentName: 'James Wilson', mapImage: MAP_IMAGES[0] },
  { id: 5, studentName: 'Marcus Johnson', mapImage: MAP_IMAGES[1] },
  { id: 6, studentName: 'Olivia Brown', mapImage: MAP_IMAGES[2] },
  { id: 7, studentName: 'Liam Garcia', mapImage: MAP_IMAGES[0] },
  { id: 8, studentName: 'Sophia Martinez', mapImage: MAP_IMAGES[1] },
  { id: 9, studentName: 'Noah Anderson', mapImage: MAP_IMAGES[2] },
  { id: 10, studentName: 'Isabella Thomas', mapImage: MAP_IMAGES[0] },
  { id: 11, studentName: 'Ethan Jackson', mapImage: MAP_IMAGES[1] },
  { id: 12, studentName: 'Mia White', mapImage: MAP_IMAGES[2] },
];

const MapCarousel = ({
  isVisible,
  onMapConfirmed,
  onClose,
  currentWinner,
  joinCode = '420042',
  initialSubmissions = MOCK_SUBMISSIONS
}) => {
  const [submissions] = useState(initialSubmissions);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const rollIntervalRef = useRef(null);

  const getVisibleMaps = () => {
    const maps = [];
    for (let i = -2; i <= 2; i++) {
      let idx = activeIndex + i;
      if (idx < 0) idx = submissions.length + idx;
      if (idx >= submissions.length) idx = idx % submissions.length;
      maps.push({ ...submissions[idx], position: i });
    }
    return maps;
  };

  const navigateCarousel = (direction) => {
    if (isRolling) return;
    setActiveIndex(prev => {
      if (direction === 'left') {
        return prev > 0 ? prev - 1 : submissions.length - 1;
      } else {
        return prev < submissions.length - 1 ? prev + 1 : 0;
      }
    });
  };

  const handleRandomPick = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    let iterations = 0;
    const maxIterations = 20;
    let delay = 50;
    
    const roll = () => {
      const randomIndex = Math.floor(Math.random() * submissions.length);
      setActiveIndex(randomIndex);
      iterations++;
      
      if (iterations < maxIterations) {
        delay += 20;
        rollIntervalRef.current = setTimeout(roll, delay);
      } else {
        const finalIndex = Math.floor(Math.random() * submissions.length);
        setActiveIndex(finalIndex);
        setIsRolling(false);
      }
    };
    
    roll();
  };

  const handleConfirm = () => {
    if (onMapConfirmed) {
      onMapConfirmed(submissions[activeIndex]);
    }
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
      const index = submissions.findIndex(s => s.id === currentWinner.id);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  }, [currentWinner, submissions]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;
      if (e.key === 'ArrowLeft') navigateCarousel('left');
      if (e.key === 'ArrowRight') navigateCarousel('right');
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const visibleMaps = getVisibleMaps();
  const currentMap = submissions[activeIndex];

  return (
    <motion.div
      className="map-overlay"
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

      {/* Close button */}
      <button className="map-overlay__close" onClick={onClose}>
        ✕
      </button>

      {/* Header */}
      <div className="map-overlay__header">
        <h2 className="map-overlay__title">🗺️ Select a Map</h2>
        <div className="map-overlay__counter">
          {activeIndex + 1} of {submissions.length}
        </div>
      </div>

      {/* Carousel */}
      <div className="map-overlay__carousel">
        <button 
          className="map-overlay__arrow map-overlay__arrow--left"
          onClick={() => navigateCarousel('left')}
          disabled={isRolling}
        >
          ‹
        </button>

        <div className="map-overlay__track">
          <AnimatePresence mode="popLayout">
            {visibleMaps.map((map) => {
              const isCenter = map.position === 0;
              const absPos = Math.abs(map.position);
              
              return (
                <motion.div
                  key={`${map.id}-${map.position}`}
                  className={`map-overlay__card ${isCenter ? 'center' : 'side'}`}
                  data-position={map.position}
                  layout
                  initial={{ 
                    opacity: 0,
                    scale: 0.8,
                    x: map.position * 50
                  }}
                  animate={{ 
                    opacity: isCenter ? 1 : (absPos === 1 ? 0.5 : 0.25),
                    scale: isCenter ? 1 : (absPos === 1 ? 0.75 : 0.55),
                    x: 0,
                    zIndex: isCenter ? 10 : (5 - absPos)
                  }}
                  exit={{ 
                    opacity: 0,
                    scale: 0.8
                  }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30 
                  }}
                  onClick={() => {
                    if (!isCenter && !isRolling) {
                      navigateCarousel(map.position > 0 ? 'right' : 'left');
                    }
                  }}
                >
                  <div className="map-overlay__card-name">
                    {map.studentName}
                  </div>
                  <div className="map-overlay__card-preview">
                    <img 
                      src={map.mapImage} 
                      alt={`${map.studentName}'s map`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button 
          className="map-overlay__arrow map-overlay__arrow--right"
          onClick={() => navigateCarousel('right')}
          disabled={isRolling}
        >
          ›
        </button>
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
          disabled={isRolling}
        >
          ✓ Select This Map
        </button>
      </div>
    </motion.div>
  );
};

export default MapCarousel;
