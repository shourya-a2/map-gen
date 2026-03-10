import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenTeacher.css';
import MapCarousel from './components/MapCarousel';

const LobbyScreenTeacher = () => {
  const [isCarouselVisible, setIsCarouselVisible] = useState(true);
  const [winnerMap, setWinnerMap] = useState(null);
  const [timer, setTimer] = useState(5 * 60);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [mapEnabledForKids, setMapEnabledForKids] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCarousel = useCallback(() => {
    setIsCarouselVisible(prev => !prev);
  }, []);

  const handleMapConfirmed = useCallback((selectedMap) => {
    setWinnerMap(selectedMap);
    setIsCarouselVisible(false);
  }, []);

  return (
    <div 
      className="teacher-lobby"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/teacher-lobby-bg.png)` }}
    >
      <nav className="teacher-navbar">
        <div className="teacher-navbar__left">
          <div className="teacher-navbar__logo">
            <span className="teacher-navbar__logo-icon">🏟️</span>
            <span className="teacher-navbar__logo-text">WAYARENA</span>
          </div>
          <div className="teacher-navbar__timer">
            <span className="teacher-navbar__timer-icon">⏱️</span>
            <span className="teacher-navbar__timer-value">{formatTime(timer)}</span>
          </div>
        </div>

        <div className="teacher-navbar__center">
          <motion.button
            className={`teacher-navbar__map-btn ${winnerMap ? 'has-winner' : ''} ${isCarouselVisible ? 'active' : ''}`}
            onClick={toggleCarousel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🗺️</span>
            <span>{isCarouselVisible ? 'Hide Maps' : (winnerMap ? 'Change Map' : 'Select Map')}</span>
          </motion.button>
        </div>

        <div className="teacher-navbar__right">
          <div className="teacher-navbar__toggle">
            <span className="teacher-navbar__toggle-label">
              {mapEnabledForKids ? 'Maps On' : 'Maps Off'}
            </span>
            <button 
              className={`teacher-navbar__toggle-switch ${mapEnabledForKids ? 'active' : ''}`}
              onClick={() => setMapEnabledForKids(!mapEnabledForKids)}
            >
              <span className="teacher-navbar__toggle-knob" />
            </button>
          </div>
          <button 
            className="teacher-navbar__sound-btn"
            onClick={() => setIsSoundOn(!isSoundOn)}
          >
            {isSoundOn ? '🔊' : '🔇'}
          </button>
          <button className="teacher-navbar__end-btn">
            End Game
          </button>
        </div>
      </nav>

      <div className="teacher-lobby__content">
        <AnimatePresence>
          {winnerMap && (
            <motion.div
              className="teacher-lobby__winner"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className="teacher-lobby__winner-badge">
                <span className="teacher-lobby__winner-icon">🏆</span>
                <span className="teacher-lobby__winner-label">WINNER</span>
              </div>
              <div className="teacher-lobby__winner-card">
                <div className="teacher-lobby__winner-preview">
                  <img 
                    src={winnerMap.mapImage} 
                    alt={`${winnerMap.studentName}'s map`}
                    className="teacher-lobby__winner-image"
                  />
                </div>
                <div className="teacher-lobby__winner-info">
                  <span className="teacher-lobby__winner-name">{winnerMap.studentName}'s map</span>
                  <span className="teacher-lobby__winner-check">✓</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isCarouselVisible && (
          <MapCarousel
            isVisible={isCarouselVisible}
            onMapConfirmed={handleMapConfirmed}
            currentWinner={winnerMap}
            mapEnabled={mapEnabledForKids}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyScreenTeacher;
