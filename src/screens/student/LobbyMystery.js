import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreenMystery.css';
import MysteryMapChallenge from '../../components/student/MysteryMapChallenge';

const MAP_SLIDES = [
  `${process.env.PUBLIC_URL}/map-purple.png`,
  `${process.env.PUBLIC_URL}/map-lava.png`,
  `${process.env.PUBLIC_URL}/map-crystal.png`,
];

const PLAYER_COUNT = 28;

const LOBBY_EVENTS = [
  { icon: '⚡', text: 'Someone just generated a LEGENDARY map!' },
  { icon: '🗺️', text: 'Jordan submitted "Volcanic Fortress"' },
  { icon: '✨', text: 'A rare map was just created!' },
  { icon: '🏆', text: '28 players are competing right now' },
  { icon: '🔥', text: 'Riley created "Sunken Ruins"' },
  { icon: '⚡', text: 'New map just entered the arena!' },
];

// Status messages that tick while waiting
const WAITING_STATUSES = [
  '⏳ Waiting to be chosen…',
  '👀 Teacher is reviewing maps…',
  '📋 Your arena is in the queue…',
  '🎲 Choosing the best arena…',
  '⏳ Almost time…',
];

const RARITY_COLORS = {
  legendary: '#FFD700',
  rare: '#a78bfa',
  common: '#d4a96a',
};

const LobbyScreenMystery = () => {
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [defaultTab,      setDefaultTab]      = useState('create');
  const [activeMap,       setActiveMap]       = useState(0);
  const [lobbyEvent,      setLobbyEvent]      = useState(null);
  const [submittedMap,    setSubmittedMap]    = useState(null); // the waiting room card
  const [waitingStatus,   setWaitingStatus]   = useState(0);
  const [otherCount,      setOtherCount]      = useState(3);   // fake "X others submitted"
  const lobbyEventTidRef  = useRef(null);

  // map slide cycler
  useEffect(() => {
    const id = setInterval(() => setActiveMap(p => (p + 1) % MAP_SLIDES.length), 2800);
    return () => clearInterval(id);
  }, []);

  // lobby activity feed — only when no submitted map
  useEffect(() => {
    if (submittedMap) {
      setLobbyEvent(null);
      return;
    }
    const fire = () => {
      setLobbyEvent(ev => {
        const events = LOBBY_EVENTS;
        const next = events[Math.floor(Math.random() * events.length)];
        setTimeout(() => setLobbyEvent(null), 3500);
        return next;
      });
    };
    let tid;
    const schedule = () => {
      fire();
      tid = setTimeout(schedule, 5000 + Math.random() * 5000);
    };
    lobbyEventTidRef.current = setTimeout(schedule, 3000);
    return () => clearTimeout(tid || lobbyEventTidRef.current);
  }, [submittedMap]);

  // Waiting room: cycle status text + increment other submitters
  useEffect(() => {
    if (!submittedMap) return;
    const statusId = setInterval(() => {
      setWaitingStatus(p => (p + 1) % WAITING_STATUSES.length);
    }, 4000);
    // every ~15s another "player" submits
    const countId = setInterval(() => {
      setOtherCount(p => Math.min(p + 1, PLAYER_COUNT - 1));
    }, 15000);
    return () => { clearInterval(statusId); clearInterval(countId); };
  }, [submittedMap]);

  const handleCreateMap = useCallback(() => {
    setDefaultTab('create');
    setIsChallengeOpen(true);
  }, []);

  const handleMyMaps = useCallback(() => {
    setDefaultTab('mymaps');
    setIsChallengeOpen(true);
  }, []);

  const handleCloseChallenge = useCallback(() => setIsChallengeOpen(false), []);

  const handleMapSubmitted = useCallback((map) => {
    setSubmittedMap(map);
    setWaitingStatus(0);
    setOtherCount(3);
  }, []);

  const rarityColor = submittedMap ? (RARITY_COLORS[submittedMap.rarity] || RARITY_COLORS.common) : null;

  return (
    <div className="mystery-lobby">
      <div className="maps-panel">

        {/* Hero card */}
        <motion.div
          className="hero-map-card"
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.3 }}
        >
          <div className="hero-map-card__preview">
            {MAP_SLIDES.map((src, i) => (
              <img key={src} src={src} alt={`Map ${i+1}`}
                className={`hero-map-card__map-slide ${i===activeMap?'active':''}`}
              />
            ))}
            <div className="hero-map-char"><div className="hero-map-char__sprite" /></div>
          </div>
          <div className="hero-map-card__info">
            <span className="hero-map-card__label">DEFAULT MAP</span>
            <h3 className="hero-map-card__title">Wayarena</h3>
          </div>
          <div className="hero-map-card__live-badge">
            <span className="hero-map-card__live-dot" />
            <span>{PLAYER_COUNT} playing</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── WAITING ROOM — shown after submitting ── */}
          {submittedMap ? (
            <motion.div
              key="waiting-room"
              className="waiting-room"
              style={{ '--rarity-color': rarityColor }}
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.4, type:'spring', stiffness:280, damping:22 }}
            >
              {/* map thumbnail */}
              <div className="waiting-room__map-thumb" style={{ borderColor: rarityColor }}>
                <div className="waiting-room__grid">
                  {(submittedMap.colors || []).slice(0, 16).map((c, i) => (
                    <div key={i} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* info */}
              <div className="waiting-room__info">
                <span className="waiting-room__map-name">{submittedMap.name}</span>

                {/* cycling status */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={waitingStatus}
                    className="waiting-room__status"
                    initial={{ opacity:0, y:4 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:-4 }}
                    transition={{ duration:0.3 }}
                  >
                    {WAITING_STATUSES[waitingStatus]}
                  </motion.span>
                </AnimatePresence>

                {/* other submitters */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={otherCount}
                    className="waiting-room__others"
                    initial={{ opacity:0 }}
                    animate={{ opacity:1 }}
                    transition={{ duration:0.4 }}
                  >
                    {otherCount} other{otherCount !== 1 ? 's' : ''} submitted
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* edit button */}
              <motion.button
                className="waiting-room__edit-btn"
                onClick={handleCreateMap}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              >Edit</motion.button>
            </motion.div>

          ) : (

            /* ── PRE-SUBMIT: context hint + action buttons ── */
            <motion.div
              key="pre-submit"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.3 }}
              style={{ display:'flex', flexDirection:'column', gap:12 }}
            >
              <motion.p className="maps-context-hint"
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.3, delay:0.08 }}
              >
                Describe an arena — your map could be chosen for the class!
              </motion.p>

              <div className="maps-actions">
                <motion.button className="maps-action-btn"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.3, delay:0.1 }}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleCreateMap}
                >✦ Create Your Map</motion.button>

                <motion.button className="maps-action-btn maps-action-btn--secondary"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.3, delay:0.15 }}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleMyMaps}
                >My Maps</motion.button>
              </div>

              {/* activity feed */}
              <div className="maps-activity">
                <AnimatePresence mode="wait">
                  {lobbyEvent && (
                    <motion.div key={lobbyEvent.text} className="maps-activity__event"
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                    >
                      <span className="maps-activity__icon">{lobbyEvent.icon}</span>
                      <span className="maps-activity__text">{lobbyEvent.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Side sheet */}
      <AnimatePresence>
        {isChallengeOpen && (
          <MysteryMapChallenge
            isOpen={isChallengeOpen}
            onClose={handleCloseChallenge}
            onMapSubmitted={handleMapSubmitted}
            playerCount={PLAYER_COUNT}
            defaultTab={defaultTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyScreenMystery;
