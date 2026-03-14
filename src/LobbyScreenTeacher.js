import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenTeacher.css';
import MapCarousel from './components/MapCarousel';

const LobbyScreenTeacher = () => {
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);
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

  const openCarousel = useCallback(() => {
    setIsCarouselVisible(true);
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

      {/* Fixed position map action card - bottom left */}
      <motion.div 
        className={`map-action-card ${!winnerMap ? 'map-action-card--pulse' : 'map-action-card--selected'}`}
        onClick={!winnerMap ? openCarousel : undefined}
        whileHover={!winnerMap ? { scale: 1.03 } : {}}
        whileTap={!winnerMap ? { scale: 0.97 } : {}}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{ cursor: !winnerMap ? 'pointer' : 'default' }}
      >
        {!winnerMap ? (
          <>
            <div className="map-action-card__icon-wrapper">
              <span className="map-action-card__icon">🗺️</span>
            </div>
            <div className="map-action-card__content">
              <span className="map-action-card__label">SELECT MAP</span>
              <span className="map-action-card__hint">Choose today's arena</span>
            </div>
            <span className="map-action-card__arrow">→</span>
          </>
        ) : (
          <>
            <div className="map-action-card__thumb-wrapper">
              <img 
                src={winnerMap.mapImage} 
                alt={winnerMap.mapTitle}
                className="map-action-card__thumb"
              />
            </div>
            <div className="map-action-card__content">
              <span className="map-action-card__label">TODAY'S MAP</span>
              <span className="map-action-card__title">{winnerMap.mapTitle}</span>
              <span className="map-action-card__author">by {winnerMap.studentName}</span>
            </div>
            <button 
              className="map-action-card__change-btn"
              onClick={(e) => {
                e.stopPropagation();
                openCarousel();
              }}
            >
              Change
            </button>
          </>
        )}
      </motion.div>

      {/* Main content area - empty, no overlay */}
      <div className="teacher-lobby__content">
        {/* Content area is now clear for other elements */}
      </div>

      <AnimatePresence>
        {isCarouselVisible && (
          <MapCarousel
            isVisible={isCarouselVisible}
            onMapConfirmed={handleMapConfirmed}
            onClose={() => setIsCarouselVisible(false)}
            currentWinner={winnerMap}
            joinCode="420042"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyScreenTeacher;
