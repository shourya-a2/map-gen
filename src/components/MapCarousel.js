import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  { id: 3, studentName: 'Sarah Miller', mapImage: MAP_IMAGES[2] },
  { id: 4, studentName: 'Sarah Miller', mapImage: MAP_IMAGES[0] },
  { id: 5, studentName: 'Marcus Johnson', mapImage: MAP_IMAGES[1] },
  { id: 6, studentName: 'Emma Davis', mapImage: MAP_IMAGES[2] },
  { id: 7, studentName: 'Emma Davis', mapImage: MAP_IMAGES[0] },
  { id: 8, studentName: 'James Wilson', mapImage: MAP_IMAGES[1] },
  { id: 9, studentName: 'Olivia Brown', mapImage: MAP_IMAGES[2] },
  { id: 10, studentName: 'Liam Garcia', mapImage: MAP_IMAGES[0] },
  { id: 11, studentName: 'Liam Garcia', mapImage: MAP_IMAGES[1] },
  { id: 12, studentName: 'Sophia Martinez', mapImage: MAP_IMAGES[2] },
  { id: 13, studentName: 'Noah Anderson', mapImage: MAP_IMAGES[0] },
  { id: 14, studentName: 'Isabella Thomas', mapImage: MAP_IMAGES[1] },
  { id: 15, studentName: 'Ethan Jackson', mapImage: MAP_IMAGES[2] },
  { id: 16, studentName: 'Ethan Jackson', mapImage: MAP_IMAGES[0] },
  { id: 17, studentName: 'Ethan Jackson', mapImage: MAP_IMAGES[1] },
  { id: 18, studentName: 'Mia White', mapImage: MAP_IMAGES[2] },
  { id: 19, studentName: 'Aiden Harris', mapImage: MAP_IMAGES[0] },
  { id: 20, studentName: 'Charlotte Clark', mapImage: MAP_IMAGES[1] },
  { id: 21, studentName: 'Lucas Lewis', mapImage: MAP_IMAGES[2] },
  { id: 22, studentName: 'Amelia Robinson', mapImage: MAP_IMAGES[0] },
  { id: 23, studentName: 'Mason Walker', mapImage: MAP_IMAGES[1] },
  { id: 24, studentName: 'Harper Young', mapImage: MAP_IMAGES[2] },
];

const MapCarousel = ({
  isVisible,
  onMapConfirmed,
  currentWinner,
  mapEnabled = true,
  initialSubmissions = MOCK_SUBMISSIONS
}) => {
  const [submissions] = useState(initialSubmissions);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMapId, setSelectedMapId] = useState(currentWinner?.id || null);
  const [isRolling, setIsRolling] = useState(false);
  const rollIntervalRef = useRef(null);

  const studentCounts = useMemo(() => {
    const counts = {};
    submissions.forEach(s => {
      counts[s.studentName] = (counts[s.studentName] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  const handleCardClick = (index) => {
    if (isRolling) return;
    
    if (index === activeIndex) {
      const submission = submissions[index];
      setSelectedMapId(prev => prev === submission.id ? null : submission.id);
    } else {
      setActiveIndex(index);
    }
  };

  const handleConfirmSelection = () => {
    const selectedMap = submissions.find(s => s.id === selectedMapId);
    if (selectedMap && onMapConfirmed) {
      onMapConfirmed(selectedMap);
    }
  };

  const handleRandomPick = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setSelectedMapId(null);
    
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
        setSelectedMapId(submissions[finalIndex].id);
        setIsRolling(false);
      }
    };
    
    roll();
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
        setSelectedMapId(currentWinner.id);
      }
    }
  }, [currentWinner, submissions]);

  const selectedMap = submissions.find(s => s.id === selectedMapId);

  const getVisibleIndices = () => {
    const indices = [];
    for (let i = -2; i <= 2; i++) {
      let idx = activeIndex + i;
      if (idx < 0) idx = submissions.length + idx;
      if (idx >= submissions.length) idx = idx % submissions.length;
      indices.push({ realIndex: idx, position: i });
    }
    return indices;
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="map-carousel"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="map-carousel__row">
        <button 
          className="map-carousel__arrow"
          onClick={() => navigateCarousel('left')}
        >
          ◀
        </button>

        <div className="map-carousel__track">
          {getVisibleIndices().map(({ realIndex, position }) => {
            const submission = submissions[realIndex];
            const isCenter = position === 0;
            const isSelected = selectedMapId === submission.id && isCenter;
            const isLowActivity = studentCounts[submission.studentName] === 1;
            const absPosition = Math.abs(position);

            return (
              <motion.div
                key={`card-${position}`}
                className={`map-carousel__card ${isCenter ? 'center' : 'side'} ${isSelected ? 'selected' : ''}`}
                data-position={position}
                onClick={() => handleCardClick(realIndex)}
                layout
                initial={false}
                animate={{
                  opacity: isCenter ? 1 : 0.25,
                  scale: isCenter ? 1 : (absPosition === 1 ? 0.85 : 0.7),
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {isLowActivity && isCenter && (
                  <div className="map-carousel__badge">1st</div>
                )}
                <p className="map-carousel__name">{submission.studentName}</p>
                <div className="map-carousel__preview">
                  <img 
                    src={submission.mapImage} 
                    alt={`${submission.studentName}'s map`}
                    className="map-carousel__image"
                  />
                </div>
                {isSelected && (
                  <motion.div 
                    className="map-carousel__check"
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

        <button 
          className="map-carousel__arrow"
          onClick={() => navigateCarousel('right')}
        >
          ▶
        </button>
      </div>

      <div className="map-carousel__actions">
        <motion.button
          className={`map-carousel__btn map-carousel__btn--random ${isRolling ? 'rolling' : ''}`}
          onClick={handleRandomPick}
          disabled={isRolling}
          whileHover={!isRolling ? { scale: 1.05 } : {}}
          whileTap={!isRolling ? { scale: 0.95 } : {}}
        >
          <span>🎲</span>
          <span>{isRolling ? 'Picking...' : 'Random'}</span>
        </motion.button>

        <AnimatePresence>
          {selectedMapId && (
            <motion.button
              className="map-carousel__btn map-carousel__btn--confirm"
              onClick={handleConfirmSelection}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>✓</span>
              <span>Confirm {selectedMap?.studentName}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MapCarousel;
