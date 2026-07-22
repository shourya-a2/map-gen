import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenTeacherTugOfWar.css';
import MapCarousel, { TOW_SUBMISSIONS } from '../../components/teacher/MapCarousel';
import TeacherCarouselBg from '../../assets/teacher background.png';
import TeacherBg from '../../assets/teacher background.png';

const PARTICLE_COLORS = ['#ffe430', '#22d3ee', '#a78bfa', '#f97316'];

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

let towAudioCtx = null;
function getTowAudioCtx() {
  if (!towAudioCtx || towAudioCtx.state === 'closed') {
    towAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (towAudioCtx.state === 'suspended') towAudioCtx.resume();
  return towAudioCtx;
}

function playSubmissionChime(isSoundOn) {
  if (!isSoundOn) return;
  try {
    const ctx = getTowAudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator(); const g1 = ctx.createGain();
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.type = 'sine'; osc1.frequency.setValueAtTime(523, now);
    g1.gain.setValueAtTime(0.08, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.start(now); osc1.stop(now + 0.28);
    const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.type = 'sine'; osc2.frequency.setValueAtTime(659, now + 0.08);
    g2.gain.setValueAtTime(0, now); g2.gain.linearRampToValueAtTime(0.08, now + 0.08);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.start(now + 0.08); osc2.stop(now + 0.35);
  } catch (e) {}
}

const TeacherLobbyTugOfWar = () => {
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);
  const [winnerMap,          setWinnerMap]          = useState(null);
  const [timer,              setTimer]              = useState(5 * 60);
  const [isSoundOn,          setIsSoundOn]          = useState(true);
  const [mapEnabledForKids,  setMapEnabledForKids]  = useState(true);
  const [isFlashing,         setIsFlashing]         = useState(false);
  const [devSubmissionCount, setDevSubmissionCount] = useState(TOW_SUBMISSIONS.length);
  const [badgeCount,         setBadgeCount]         = useState(0);
  const [badgePop,           setBadgePop]           = useState(false);
  const [flyingMap,          setFlyingMap]          = useState(null);
  const [skipReminder] = useState(
    () => localStorage.getItem('tow-skip-map-reminder') === 'true'
  );

  const cardRef        = useRef(null);
  const mapFrameRef    = useRef(null);
  const sparkIntervalRef = useRef(null);

  const DEV_STATES = [
    { label: '0 maps', count: 0 },
    { label: '1 map',  count: 2 },
    { label: '2 maps', count: 3 },
    { label: 'Many',   count: TOW_SUBMISSIONS.length },
  ];

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => setTimer(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(id);
  }, []);

  // Simulate live submissions
  useEffect(() => {
    setBadgeCount(0);
    setFlyingMap(null);
    if (devSubmissionCount === 0 || isCarouselVisible) return;
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      if (current > devSubmissionCount) { clearInterval(id); return; }
      const student = TOW_SUBMISSIONS[current - 1];
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
    return () => clearInterval(id);
  }, [devSubmissionCount, isCarouselVisible, isSoundOn]);

  const formatTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const openCarousel   = useCallback(() => setIsCarouselVisible(true),  []);
  const handleMapConfirmed = useCallback(m => setWinnerMap(m),          []);
  const handleCarouselClose = useCallback(() => setIsCarouselVisible(false), []);
  const proceedToGame  = useCallback(() => console.log('[ToW] Starting game…'), []);

  const handleCardClick = useCallback(() => {
    setIsFlashing(true);
    spawnClickBurst(mapFrameRef.current);
    setTimeout(() => setIsFlashing(false), 300);
    setTimeout(() => openCarousel(), 150);
  }, [openCarousel]);

  const handleMouseEnter = useCallback(() => {
    spawnCornerSparks(mapFrameRef.current);
    sparkIntervalRef.current = setInterval(() => spawnCornerSparks(mapFrameRef.current), 800);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (sparkIntervalRef.current) { clearInterval(sparkIntervalRef.current); sparkIntervalRef.current = null; }
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
      className="tow-teacher-lobby"
      style={{ backgroundImage: `url(${TeacherBg})` }}
    >
      {/* Navbar */}
      <nav className="teacher-navbar">
        <div className="teacher-navbar__left">
          <div className="teacher-navbar__logo">
            <span className="teacher-navbar__logo-icon">⚔️</span>
            <span className="teacher-navbar__logo-text tow-teacher-logo-text">TUG OF WAR</span>
          </div>
          <div className="teacher-navbar__timer">
            <span className="teacher-navbar__timer-icon">⏱️</span>
            <span className="teacher-navbar__timer-value">{formatTime(timer)}</span>
          </div>
        </div>

        <div className="teacher-navbar__right">
          <div className="teacher-navbar__toggle">
            <span className="teacher-navbar__toggle-label">
              {mapEnabledForKids ? 'Scenes On' : 'Scenes Off'}
            </span>
            <button
              className={`teacher-navbar__toggle-switch ${mapEnabledForKids ? 'active' : ''}`}
              onClick={() => setMapEnabledForKids(!mapEnabledForKids)}
            >
              <span className="teacher-navbar__toggle-knob" />
            </button>
          </div>
          <button className="teacher-navbar__sound-btn" onClick={() => setIsSoundOn(!isSoundOn)}>
            {isSoundOn ? '🔊' : '🔇'}
          </button>
          <button className="teacher-navbar__end-btn">End Game</button>
        </div>
      </nav>

      {/* Map card — bottom left */}
      <motion.div
        ref={cardRef}
        className="map-ui-card"
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.4, delay:0.2 }}
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`map-ui-card__flash ${isFlashing ? 'map-ui-card__flash--active' : ''}`} />
        <div className="map-ui-card__map-wrapper">
          <div ref={mapFrameRef} className="map-ui-card__map-frame">
            <img
              src={winnerMap ? winnerMap.mapImage : `${process.env.PUBLIC_URL}/Map.png`}
              alt={winnerMap ? winnerMap.mapTitle : 'Default Battlefield'}
              className="map-ui-card__img"
            />
            <AnimatePresence>
              {badgeCount > 0 && (
                <motion.div className="map-ui-card__badge" key="badge"
                  initial={{ scale:0, opacity:0 }}
                  animate={{ scale: badgePop ? 1.35 : 1, opacity:1 }}
                  exit={{ scale:0, opacity:0 }}
                  transition={{ type:'spring', stiffness:400, damping:15 }}
                >
                  {badgeCount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {flyingMap && (
            <motion.div key={flyingMap.image + badgeCount} className="map-ui-card__fly-thumb"
              initial={{ x:250, y:-30, scale:1, opacity:1 }}
              animate={{ x:[250,250,0], y:[-30,-30,0], scale:[1,1,0.3], opacity:[1,1,0] }}
              transition={{ duration:1.6, times:[0,0.6,1], ease:'easeInOut' }}
            >
              <img src={flyingMap.image} alt="" className="map-ui-card__fly-thumb-img" />
              <span className="map-ui-card__fly-thumb-label">{flyingMap.name} submitted!</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="map-ui-card__btn-wrapper">
          <button className="map-ui-card__btn tow-teacher-select-btn">Select Battlefield</button>
        </div>
      </motion.div>

      <div className="teacher-lobby__content" />

      {/* MapCarousel */}
      <AnimatePresence>
        {isCarouselVisible && (
          <MapCarousel
            isVisible={isCarouselVisible}
            onMapConfirmed={handleMapConfirmed}
            onClose={handleCarouselClose}
            currentWinner={winnerMap}
            joinCode="TOW001"
            initialSubmissions={TOW_SUBMISSIONS.slice(0, devSubmissionCount)}
            isIntercepted={!winnerMap && badgeCount > 0}
            onSkipAndStart={proceedToGame}
            showInterceptText={false}
            onInterceptDone={() => {}}
            overlayTitle="Select a Battlefield"
            overlayBackground={TeacherCarouselBg}
            overlayClassName="map-overlay--tow"
          />
        )}
      </AnimatePresence>

      {/* Dev controls */}
      <div className="teacher-lobby__dev-controls">
        <span className="teacher-lobby__dev-label">Preview state:</span>
        {DEV_STATES.map(({ label, count }) => (
          <button key={label}
            className={`teacher-lobby__dev-btn ${devSubmissionCount === count ? 'active' : ''}`}
            onClick={() => setDevSubmissionCount(count)}
          >
            {label}
          </button>
        ))}
        <span className="teacher-lobby__dev-divider" />
        <button className="teacher-lobby__dev-btn teacher-lobby__dev-start-btn" onClick={handleStartGame}>
          ▶ Start
        </button>
      </div>
    </div>
  );
};

export default TeacherLobbyTugOfWar;
