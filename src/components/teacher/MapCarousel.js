import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MapCarousel.css';

const MAP_IMAGES = [
  '/map-purple.png',
  '/map-lava.png',
  '/map-crystal.png',
];

export const MOCK_SUBMISSIONS = [
  { id: 0, studentName: 'Default', mapTitle: 'Desert Dunes', mapImage: '/default-map.png' },
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
  initialSubmissions = MOCK_SUBMISSIONS,
  isIntercepted = false,
  onSkipAndStart,
  showInterceptText = false,
  onInterceptDone,
}) => {
  const [submissions] = useState(initialSubmissions);
  const [selectedMapId, setSelectedMapId] = useState(
    () => initialSubmissions.length > 0 ? initialSubmissions[0].id : null
  );
  const [celebrationMode, setCelebrationMode] = useState(false);
  const [confirmedMap, setConfirmedMap] = useState(null);
  const [flyingBack, setFlyingBack] = useState(false);
  const [skipForever, setSkipForever] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [showRollOverlay, setShowRollOverlay] = useState(false);
  const [rollSlots, setRollSlots] = useState([]);
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
    if (celebrationMode) return;
    setSelectedMapId(map.id);
  };

  const handleConfirm = () => {
    if (celebrationMode) return;
    const selected = submissions.find(s => s.id === selectedMapId);
    if (selected) {
      setConfirmedMap(selected);
      setCelebrationMode(true);
      if (onMapConfirmed) {
        onMapConfirmed(selected);
      }
    }
  };

  const handleRandomPick = () => {
    if (isRolling || celebrationMode) return;
    setIsRolling(true);
    setSelectedMapId(null);

    // Seed 4 random slots for the spinner wheel display
    const shuffled = [...submissions].sort(() => Math.random() - 0.5);
    setRollSlots(shuffled.slice(0, Math.min(4, shuffled.length)));
    setShowRollOverlay(true);

    // Cycle highlighted card in the background grid
    let iterations = 0;
    const maxIterations = 22;
    let delay = 40;

    const roll = () => {
      const randomIndex = Math.floor(Math.random() * submissions.length);
      setHighlightedId(submissions[randomIndex].id);
      iterations++;

      if (iterations < maxIterations) {
        delay += 12;
        rollIntervalRef.current = setTimeout(roll, delay);
      } else {
        const finalIndex = Math.floor(Math.random() * submissions.length);
        const winner = submissions[finalIndex];
        setHighlightedId(null);
        setIsRolling(false);
        // Hold the spinner on the winner for 900ms then go to celebration
        rollIntervalRef.current = setTimeout(() => {
          setShowRollOverlay(false);
          setSelectedMapId(winner.id);
          setConfirmedMap(winner);
          setCelebrationMode(true);
          if (onMapConfirmed) onMapConfirmed(winner);
        }, 900);
      }
    };

    roll();
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

  useEffect(() => {
    if (celebrationMode && !flyingBack) {
      const timer = setTimeout(() => {
        setFlyingBack(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [celebrationMode, flyingBack]);

  useEffect(() => {
    if (showInterceptText) {
      const timer = setTimeout(() => {
        onInterceptDone?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showInterceptText, onInterceptDone]);

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

      {/* Back to Lobby button - hidden in celebration mode and intercept phase */}
      <AnimatePresence>
        {!celebrationMode && !showInterceptText && !showRollOverlay && (
          <motion.button
            className="map-overlay__close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            ← Back to Lobby
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showInterceptText ? (
          <motion.div
            key="intercept-text"
            className="map-overlay__intercept-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.92 }}
            transition={{ duration: 0.5, ease: "easeIn" }}
          >
            <motion.p
              className="map-overlay__intercept-text"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              Hold up! You haven't picked any arena — let's pick some first!
              <br />
              <span className="map-overlay__intercept-sub">Your students' creations are waiting.</span>
            </motion.p>
          </motion.div>
        ) : showRollOverlay ? (
          <motion.div
            key="roll-overlay"
            className="random-spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="random-spinner__content">
              <motion.div
                className="random-spinner__wheel"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              >
                {rollSlots.slice(0, 6).map((map, index) => (
                  <div
                    key={map.id}
                    className="random-spinner__map-slot"
                    style={{ transform: `rotate(${index * 60}deg) translateY(-120px)` }}
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
                Picking a random arena...
              </motion.p>
            </div>
          </motion.div>
        ) : !celebrationMode ? (
          <motion.div
            key="grid-view"
            className="map-overlay__grid-container"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <motion.div
              className="map-overlay__header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <h2 className="map-overlay__title">
                Select an Arena
              </h2>
              <div className="map-overlay__counter">
                {submissions.length === 0
                  ? 'Waiting for students to submit arenas...'
                  : submissions.length < 3
                    ? <>{submissions.length} map{submissions.length > 1 ? 's' : ''} submitted <span className="map-overlay__counter-dot" /> More coming in...</>
                    : `${submissions.length} maps submitted`
                }
              </div>
            </motion.div>

            {/* Grid with scroll fade wrapper */}
            <div className="map-overlay__grid-wrapper">
              <div className={`map-overlay__grid ${submissions.length < 4 ? 'map-overlay__grid--centered' : ''}`} ref={gridRef}>
                {submissions.length === 0 ? (
                  <div className="map-overlay__empty-state">

                    <div className="map-overlay__empty-teacher-bar">
                      <span className="map-overlay__empty-waiting-dot" />
                      Ask your students to submit a map to get started
                    </div>

                    <div className="map-overlay__guide-row">

                      <div className="map-overlay__guide-step">
                        <span className="map-overlay__guide-step-label">Students tap</span>
                        <div className="map-overlay__guide-map-mockup">
                          <img
                            src={`${process.env.PUBLIC_URL}/Map.png`}
                            alt="Map widget"
                            className="map-overlay__guide-map-img"
                          />
                        </div>
                      </div>

                      <div className="map-overlay__guide-arrow">
                        <span className="map-overlay__guide-arrow-line" />
                        <span className="map-overlay__guide-arrow-head">&#9654;</span>
                      </div>

                      <div className="map-overlay__guide-step">
                        <span className="map-overlay__guide-step-label">Students type to submit</span>
                        <div className="map-overlay__guide-input-mockup">
                          <span className="map-overlay__guide-input-placeholder">Describe your arena...</span>
                        </div>
                      </div>

                    </div>

                    <p className="map-overlay__empty-tip">
                      Tip: Ask students to think about obstacles, terrain, and tricky spots.
                    </p>

                  </div>
                ) : (
                  <>
                    {/* Random Pick card — only with 2+ student maps */}
                    {submissions.length > 2 && (
                    <motion.div
                      className={`map-overlay__grid-card map-overlay__grid-card--random ${isRolling ? 'rolling' : ''}`}
                      onClick={handleRandomPick}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      whileHover={!isRolling ? { scale: 1.03 } : {}}
                      whileTap={!isRolling ? { scale: 0.98 } : {}}
                    >
                      <div className="map-overlay__grid-card-preview map-overlay__grid-card-preview--random">
                        <div className="map-overlay__random-content">
                          <span className="map-overlay__random-dice-icon">
                            {isRolling ? '🎲' : '🎲'}
                          </span>
                          <span className="map-overlay__random-label">
                            {isRolling ? 'Picking...' : 'Randomly pick an arena'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                    )}

                    {submissions.map((map, index) => {
                      const isSelected = selectedMapId === map.id;
                      const isHighlighted = highlightedId === map.id;

                      return (
                        <motion.div
                          key={map.id}
                          data-map-id={map.id}
                          className={`map-overlay__grid-card ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                          onClick={() => handleMapClick(map)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(index, 16) * 0.03, ease: "easeOut" }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="map-overlay__grid-card-preview">
                            <img
                              src={map.mapImage}
                              alt={`${map.studentName}'s map`}
                            />
                            <div className="map-overlay__grid-card-name">{map.studentName}</div>
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
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <motion.div
              className="map-overlay__actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <div className="map-overlay__cta-wrap">
                <button
                  className="map-overlay__btn map-overlay__btn--begin"
                  onClick={handleConfirm}
                  disabled={selectedMapId == null || submissions.length === 0 || isRolling}
                >
                  ▶ Begin Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="celebration-view"
            className="celebration"
            initial={{ opacity: 0 }}
            animate={flyingBack ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: flyingBack ? 0.4 : 0.3 }}
            onAnimationComplete={() => {
              if (flyingBack) {
                onClose();
              }
            }}
          >
            {/* Confetti */}
            {!flyingBack && (
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
            )}

            {/* Winner Card */}
            <motion.div
              className="celebration__card"
              initial={{ scale: 0, rotate: -10 }}
              animate={flyingBack 
                ? { 
                    scale: 0.12,
                    x: '-42vw',
                    y: '38vh',
                    rotate: -6,
                    opacity: 0,
                  } 
                : { scale: 1, rotate: 0 }
              }
              transition={flyingBack 
                ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                : { type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }
              }
            >
              <motion.div 
                className="celebration__badge"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: flyingBack ? 0 : 1 }}
                transition={{ delay: flyingBack ? 0 : 0.3, duration: flyingBack ? 0.15 : 0.3 }}
              >
                <span className="celebration__label">{confirmedMap?.studentName}'s map is selected</span>
              </motion.div>

              <motion.div 
                className="celebration__map"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <img src={confirmedMap?.mapImage} alt={confirmedMap?.mapTitle} />
              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MapCarousel;
