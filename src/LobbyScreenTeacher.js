import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenTeacher.css';
import MapCarousel, { MOCK_SUBMISSIONS } from './components/MapCarousel';

const PARTICLE_COLORS = ['#FFD700', '#FFA500', '#FFE44D', '#FFCC00'];

function createParticle(container, x, y, type) {
  const el = document.createElement('span');
  el.className = `map-ui-card__particle map-ui-card__particle--${type}`;
  const angle = Math.random() * Math.PI * 2;
  const distance = type === 'burst' ? 30 + Math.random() * 50 : 8 + Math.random() * 16;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.setProperty('--px-dx', `${dx}px`);
  el.style.setProperty('--px-dy', `${dy}px`);
  el.style.background = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  container.appendChild(el);
  const duration = type === 'burst' ? 500 : 600;
  setTimeout(() => el.remove(), duration);
}

function spawnCornerSparks(mapFrame) {
  if (!mapFrame) return;
  const w = mapFrame.offsetWidth;
  const h = mapFrame.offsetHeight;
  const corners = [
    [4, 4], [w - 4, 4], [4, h - 4], [w - 4, h - 4]
  ];
  corners.forEach(([cx, cy]) => {
    createParticle(mapFrame, cx, cy, 'spark');
  });
}

function spawnClickBurst(mapFrame) {
  if (!mapFrame) return;
  const cx = mapFrame.offsetWidth / 2;
  const cy = mapFrame.offsetHeight / 2;
  for (let i = 0; i < 10; i++) {
    setTimeout(() => createParticle(mapFrame, cx, cy, 'burst'), i * 20);
  }
}

let sharedAudioCtx = null;
function getAudioCtx() {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playSubmissionChime(isSoundOn) {
  if (!isSoundOn) return;
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523, now);
    g1.gain.setValueAtTime(0.12, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.start(now);
    osc1.stop(now + 0.28);

    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659, now + 0.08);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.12, now + 0.08);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (e) {}
}

const LobbyScreenTeacher = () => {
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);
  const [winnerMap, setWinnerMap] = useState(null);
  const [timer, setTimer] = useState(5 * 60);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [mapEnabledForKids, setMapEnabledForKids] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [devSubmissionCount, setDevSubmissionCount] = useState(MOCK_SUBMISSIONS.length);
  const [badgeCount, setBadgeCount] = useState(0);
  const [badgePop, setBadgePop] = useState(false);
  const [flyingMap, setFlyingMap] = useState(null);
  const [showIntercept, setShowIntercept] = useState(false);
  const [skipReminder, setSkipReminder] = useState(
    () => localStorage.getItem('wa-skip-map-reminder') === 'true'
  );
  const cardRef = useRef(null);
  const mapFrameRef = useRef(null);
  const sparkIntervalRef = useRef(null);
  const prevCountRef = useRef(0);

  const DEV_STATES = [
    { label: '0 maps', count: 0 },
    { label: '1 map', count: 2 },
    { label: '2 maps', count: 3 },
    { label: 'Many', count: MOCK_SUBMISSIONS.length },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live submissions arriving one by one
  useEffect(() => {
    prevCountRef.current = 0;
    setBadgeCount(0);
    setFlyingMap(null);

    if (devSubmissionCount === 0 || isCarouselVisible) return;

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current > devSubmissionCount) {
        clearInterval(interval);
        return;
      }
      const student = MOCK_SUBMISSIONS[current - 1];
      const count = current;
      setFlyingMap({ image: student.mapImage, name: student.studentName.split(' ')[0] });
      playSubmissionChime(isSoundOn);
      setTimeout(() => {
        setBadgeCount(count);
        setBadgePop(true);
        setTimeout(() => setBadgePop(false), 400);
        setFlyingMap(null);
      }, 1600);
    }, 2500);

    return () => clearInterval(interval);
  }, [devSubmissionCount, isCarouselVisible, isSoundOn]);

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
  }, []);

  const handleCardClick = useCallback(() => {
    setIsFlashing(true);
    spawnClickBurst(mapFrameRef.current);
    setTimeout(() => setIsFlashing(false), 300);
    setTimeout(() => openCarousel(), 150);
  }, [openCarousel]);

  const handleMouseEnter = useCallback(() => {
    spawnCornerSparks(mapFrameRef.current);
    sparkIntervalRef.current = setInterval(() => {
      spawnCornerSparks(mapFrameRef.current);
    }, 800);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (sparkIntervalRef.current) {
      clearInterval(sparkIntervalRef.current);
      sparkIntervalRef.current = null;
    }
  }, []);

  const proceedToGame = useCallback(() => {
    // TODO: wire actual navigation/route to game screen here
    console.log('[WayArena] Proceeding to game screen…');
  }, []);

  const handleInterceptDone = useCallback(() => {
    setShowIntercept(false);
  }, []);

  const handleCarouselClose = useCallback(() => {
    setIsCarouselVisible(false);
  }, []);

  const handleStartGame = useCallback(() => {
    if (!skipReminder && badgeCount > 0 && !winnerMap) {
      setIsCarouselVisible(true);
    } else {
      proceedToGame();
    }
  }, [skipReminder, badgeCount, winnerMap, proceedToGame]);

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

      {/* Map UI Card - Bottom Left */}
      <motion.div 
        ref={cardRef}
        className="map-ui-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`map-ui-card__flash ${isFlashing ? 'map-ui-card__flash--active' : ''}`} />
        <div className="map-ui-card__map-wrapper">
          <div ref={mapFrameRef} className="map-ui-card__map-frame">
            <img 
              src={winnerMap ? winnerMap.mapImage : `${process.env.PUBLIC_URL}/Map.png`} 
              alt={winnerMap ? winnerMap.mapTitle : 'Default Map'}
              className="map-ui-card__img"
            />
            <AnimatePresence>
              {badgeCount > 0 && (
                <motion.div
                  className="map-ui-card__badge"
                  key="badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: badgePop ? 1.35 : 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {badgeCount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {flyingMap && (
            <motion.div
              key={flyingMap.image + badgeCount}
              className="map-ui-card__fly-thumb"
              initial={{ x: 250, y: -30, scale: 1, opacity: 1 }}
              animate={{ x: [250, 250, 0], y: [-30, -30, 0], scale: [1, 1, 0.3], opacity: [1, 1, 0] }}
              transition={{ duration: 1.6, times: [0, 0.6, 1], ease: 'easeInOut' }}
            >
              <img src={flyingMap.image} alt="" className="map-ui-card__fly-thumb-img" />
              <span className="map-ui-card__fly-thumb-label">{flyingMap.name} submitted!</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="map-ui-card__btn-wrapper">
          <button className="map-ui-card__btn">Select Map</button>
        </div>
      </motion.div>

      {/* Main content area */}
      <div className="teacher-lobby__content" />

      <AnimatePresence>
        {isCarouselVisible && (
          <MapCarousel
            isVisible={isCarouselVisible}
            onMapConfirmed={handleMapConfirmed}
            onClose={handleCarouselClose}
            currentWinner={winnerMap}
            joinCode="420042"
            initialSubmissions={MOCK_SUBMISSIONS.slice(0, devSubmissionCount)}
            isIntercepted={!winnerMap && badgeCount > 0}
            onSkipAndStart={proceedToGame}
            showInterceptText={false}
            onInterceptDone={handleInterceptDone}
          />
        )}
      </AnimatePresence>

      {/* Dev preview controls */}
      <div className="teacher-lobby__dev-controls">
        <span className="teacher-lobby__dev-label">Preview state:</span>
        {DEV_STATES.map(({ label, count }) => (
          <button
            key={label}
            className={`teacher-lobby__dev-btn ${devSubmissionCount === count ? 'active' : ''}`}
            onClick={() => setDevSubmissionCount(count)}
          >
            {label}
          </button>
        ))}
        <span className="teacher-lobby__dev-divider" />
        <button
          className="teacher-lobby__dev-btn teacher-lobby__dev-start-btn"
          onClick={handleStartGame}
        >
          ▶ Start
        </button>
      </div>
    </div>
  );
};

export default LobbyScreenTeacher;
