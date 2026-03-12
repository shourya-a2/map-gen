import React, { useState, useRef, useEffect } from 'react';
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
  const rollIntervalRef = useRef(null);
  const gridRef = useRef(null);

  const handleMapClick = (map) => {
    if (isRolling) return;
    setSelectedMapId(map.id);
  };

  const handleRandomPick = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    let iterations = 0;
    const maxIterations = 20;
    let delay = 50;
    
    const roll = () => {
      const randomIndex = Math.floor(Math.random() * submissions.length);
      setSelectedMapId(submissions[randomIndex].id);
      iterations++;
      
      if (iterations < maxIterations) {
        delay += 20;
        rollIntervalRef.current = setTimeout(roll, delay);
      } else {
        const finalIndex = Math.floor(Math.random() * submissions.length);
        const finalMap = submissions[finalIndex];
        setSelectedMapId(finalMap.id);
        setIsRolling(false);
        
        // Scroll the selected map into view
        if (gridRef.current) {
          const selectedCard = gridRef.current.querySelector(`[data-map-id="${finalMap.id}"]`);
          if (selectedCard) {
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };
    
    roll();
  };

  const handleConfirm = () => {
    const selectedMap = submissions.find(s => s.id === selectedMapId);
    if (selectedMap && onMapConfirmed) {
      onMapConfirmed(selectedMap);
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
      setSelectedMapId(currentWinner.id);
    }
  }, [currentWinner]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible) return;
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const selectedMap = submissions.find(s => s.id === selectedMapId);

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
          {submissions.length} maps submitted
        </div>
      </div>

      {/* Grid */}
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
  );
};

export default MapCarousel;
