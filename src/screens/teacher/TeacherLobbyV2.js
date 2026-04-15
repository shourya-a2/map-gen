import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenTeacher2.css';

const MOCK_MAPS = [
  { id: 1, studentName: 'Sarah Miller', imageUrl: '/map-lava.png' },
  { id: 2, studentName: 'Alex Chen', imageUrl: '/map-crystal.png' },
  { id: 3, studentName: 'Emma Davis', imageUrl: '/map-purple.png' },
  { id: 4, studentName: 'James Wilson', imageUrl: '/map-lava.png' },
  { id: 5, studentName: 'Olivia Brown', imageUrl: '/map-crystal.png' },
  { id: 6, studentName: 'Liam Garcia', imageUrl: '/map-purple.png' },
  { id: 7, studentName: 'Sophia Martinez', imageUrl: '/map-lava.png' },
  { id: 8, studentName: 'Noah Anderson', imageUrl: '/map-crystal.png' },
  { id: 9, studentName: 'Isabella Thomas', imageUrl: '/map-purple.png' },
  { id: 10, studentName: 'Ethan Jackson', imageUrl: '/map-lava.png' },
  { id: 11, studentName: 'Mia White', imageUrl: '/map-crystal.png' },
  { id: 12, studentName: 'Aiden Harris', imageUrl: '/map-purple.png' },
];

const ConfirmModal = ({ map, isRandom, onConfirm, onCancel }) => (
  <motion.div
    className="confirm-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={(e) => e.target === e.currentTarget && onCancel()}
  >
    <motion.div
      className="confirm-dialog"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
    >
      <div className="confirm-header">
        <span className="confirm-icon">{isRandom ? '🎲' : '✓'}</span>
        <h3>{isRandom ? 'Random Pick!' : 'Confirm Selection'}</h3>
      </div>
      
      <div className="confirm-body">
        <div className="confirm-preview">
          <img src={map.imageUrl} alt={`${map.studentName}'s map`} />
        </div>
        <div className="confirm-name">{map.studentName}'s Map</div>
        <p className="confirm-text">
          {isRandom 
            ? 'Use this randomly selected map?' 
            : 'Select this map for all students?'}
        </p>
      </div>
      
      <div className="confirm-buttons">
        <button className="confirm-btn cancel" onClick={onCancel}>Cancel</button>
        <button className="confirm-btn ok" onClick={onConfirm}>Confirm</button>
      </div>
    </motion.div>
  </motion.div>
);

const LobbyScreenTeacher2 = () => {
  const [showMaps, setShowMaps] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [winnerMap, setWinnerMap] = useState(null);
  const [confirmingMap, setConfirmingMap] = useState(null);
  const [isRandomPick, setIsRandomPick] = useState(false);
  const [timer, setTimer] = useState(5 * 60);
  const carouselRef = useRef(null);
  
  const joinCode = '847 291';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToIndex = (index) => {
    if (carouselRef.current) {
      const cardWidth = 220;
      const gap = 24;
      const scrollPosition = index * (cardWidth + gap);
      carouselRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
    setSelectedIndex(index);
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, selectedIndex - 1);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(MOCK_MAPS.length - 1, selectedIndex + 1);
    scrollToIndex(newIndex);
  };

  const handleSelectMap = (map, index) => {
    setSelectedIndex(index);
    setIsRandomPick(false);
    setConfirmingMap(map);
  };

  const handleRandomPick = () => {
    const randomIndex = Math.floor(Math.random() * MOCK_MAPS.length);
    scrollToIndex(randomIndex);
    setIsRandomPick(true);
    setTimeout(() => {
      setConfirmingMap(MOCK_MAPS[randomIndex]);
    }, 400);
  };

  const handleConfirm = () => {
    setWinnerMap(confirmingMap);
    setConfirmingMap(null);
    setShowMaps(false);
  };

  const handleCancel = () => {
    setConfirmingMap(null);
    setIsRandomPick(false);
  };

  return (
    <div 
      className="teacher2-lobby"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/teacher-lobby-bg.png)` }}
    >
      {/* Navbar */}
      <nav className="t2-navbar">
        <div className="t2-nav-left">
          <span className="t2-logo">🏟️ WAYARENA</span>
          <span className="t2-timer">⏱️ {formatTimer(timer)}</span>
        </div>

        <div className="t2-nav-center">
          <div className="t2-join-code">
            <span className="t2-join-label">JOIN CODE</span>
            <span className="t2-join-value">{joinCode}</span>
          </div>
        </div>

        <div className="t2-nav-right">
          <button className="t2-end-btn">End Game</button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="t2-main">
        {/* Winner Display */}
        <AnimatePresence>
          {winnerMap && !showMaps && (
            <motion.div
              className="t2-winner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="t2-winner-badge">🏆 SELECTED MAP</div>
              <div className="t2-winner-card">
                <img src={winnerMap.imageUrl} alt="Winner map" />
                <div className="t2-winner-name">{winnerMap.studentName}'s Map ✓</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Select Map Button (when maps hidden) */}
        {!showMaps && (
          <motion.button
            className="t2-select-map-btn"
            onClick={() => setShowMaps(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🗺️ {winnerMap ? 'Change Map' : 'Select Map'}
          </motion.button>
        )}
      </div>

      {/* Bottom Map Selector */}
      <AnimatePresence>
        {showMaps && (
          <motion.div
            className="t2-map-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Panel Header */}
            <div className="t2-panel-header">
              <h3>🗺️ Select a Map <span className="t2-count">({MOCK_MAPS.length} maps)</span></h3>
              <button className="t2-close-btn" onClick={() => setShowMaps(false)}>✕</button>
            </div>

            {/* Carousel */}
            <div className="t2-carousel">
              <button 
                className="t2-carousel-arrow left" 
                onClick={handlePrev}
                disabled={selectedIndex === 0}
              >
                ‹
              </button>

              <div className="t2-carousel-track" ref={carouselRef}>
                {MOCK_MAPS.map((map, index) => (
                  <div
                    key={map.id}
                    className={`t2-map-card ${index === selectedIndex ? 'active' : ''}`}
                    onClick={() => handleSelectMap(map, index)}
                  >
                    <div className="t2-map-img">
                      <img src={map.imageUrl} alt={`${map.studentName}'s map`} />
                    </div>
                    <div className="t2-map-name">{map.studentName}</div>
                  </div>
                ))}
              </div>

              <button 
                className="t2-carousel-arrow right" 
                onClick={handleNext}
                disabled={selectedIndex === MOCK_MAPS.length - 1}
              >
                ›
              </button>
            </div>

            {/* Action Buttons */}
            <div className="t2-panel-actions">
              <button className="t2-action-btn random" onClick={handleRandomPick}>
                🎲 Random Pick
              </button>
              <button 
                className="t2-action-btn select" 
                onClick={() => handleSelectMap(MOCK_MAPS[selectedIndex], selectedIndex)}
              >
                ✓ Select This Map
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmingMap && (
          <ConfirmModal
            map={confirmingMap}
            isRandom={isRandomPick}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyScreenTeacher2;
