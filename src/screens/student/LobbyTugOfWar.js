import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyTugOfWar.css';
import TugOfWarChallenge from '../../components/student/TugOfWarChallenge';
import TowLogo from '../../assets/StudentSide_Thumbnail_TOW_Logo.png';
import TowGif from '../../assets/Idle animation-TOW.gif';

const PLAYER_COUNT = 28;

// Rotating scene thumbnails — same map slides reused
const SCENE_SLIDES = [
  `${process.env.PUBLIC_URL}/map-lava.png`,
  `${process.env.PUBLIC_URL}/map-purple.png`,
  `${process.env.PUBLIC_URL}/map-crystal.png`,
];

const LOBBY_EVENTS = [
  { icon: '⚔️', text: 'Someone just painted a VOLCANO backdrop!' },
  { icon: '🏴‍☠️', text: 'Jordan designed "Pirate Beach Showdown"' },
  { icon: '🌊', text: 'A jungle canopy scene just went in!' },
  { icon: '🏆', text: '28 players are pulling right now' },
  { icon: '🔥', text: 'Riley painted "Storm Cliffs"' },
  { icon: '✨', text: 'New battlefield entered the queue!' },
];

const WAITING_STATUSES = [
  '⏳ Waiting to be chosen…',
  '👀 Teacher is reviewing battlefields…',
  '📋 Your scene is in the queue…',
  '⚔️ Choosing the best battlefield…',
  '⏳ Almost time…',
];

const SCENE_COLORS = {
  pirate:  '#b45309',
  castle:  '#7c3aed',
  volcano: '#dc2626',
  arctic:  '#0ea5e9',
  jungle:  '#15803d',
  default: '#2563eb',
};

const LobbyTugOfWar = ({ challengeVariant = 'sheet' }) => {
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [defaultTab,      setDefaultTab]      = useState('create');
  const [activeSlide,     setActiveSlide]     = useState(0);
  const [lobbyEvent,      setLobbyEvent]      = useState(null);
  const [submittedBg,     setSubmittedBg]     = useState(null);
  const [waitingStatus,   setWaitingStatus]   = useState(0);
  const [otherCount,      setOtherCount]      = useState(4);
  const lobbyTidRef       = useRef(null);

  // slide cycler
  useEffect(() => {
    const id = setInterval(() => setActiveSlide(p => (p + 1) % SCENE_SLIDES.length), 3000);
    return () => clearInterval(id);
  }, []);

  // lobby feed
  useEffect(() => {
    if (submittedBg) { setLobbyEvent(null); return; }
    let tid;
    const schedule = () => {
      const next = LOBBY_EVENTS[Math.floor(Math.random() * LOBBY_EVENTS.length)];
      setLobbyEvent(next);
      setTimeout(() => setLobbyEvent(null), 3500);
      tid = setTimeout(schedule, 5500 + Math.random() * 5000);
    };
    lobbyTidRef.current = setTimeout(schedule, 3000);
    return () => clearTimeout(tid || lobbyTidRef.current);
  }, [submittedBg]);

  // waiting room status + counter
  useEffect(() => {
    if (!submittedBg) return;
    const sId = setInterval(() => setWaitingStatus(p => (p + 1) % WAITING_STATUSES.length), 4000);
    const cId = setInterval(() => setOtherCount(p => Math.min(p + 1, PLAYER_COUNT - 1)), 12000);
    return () => { clearInterval(sId); clearInterval(cId); };
  }, [submittedBg]);

  const handleCreate   = useCallback(() => { setDefaultTab('create');  setIsChallengeOpen(true); }, []);
  const handleMyDesigns = useCallback(() => { setDefaultTab('mybgs');   setIsChallengeOpen(true); }, []);
  const handleClose    = useCallback(() => setIsChallengeOpen(false), []);

  const handleBgSubmitted = useCallback((bg) => {
    setSubmittedBg(bg);
    setWaitingStatus(0);
    setOtherCount(4);
  }, []);

  const thumbColor = submittedBg ? (SCENE_COLORS[submittedBg.theme] || SCENE_COLORS.default) : null;

  return (
    <div className="tow-lobby">
      <div className="tow-lobby-panel">

        {/* Logo */}
        <motion.img
          src={TowLogo}
          alt="Tug of War"
          className="tow-lobby-logo"
          initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35 }}
        />

        {/* GIF — context preview of the game */}
        <motion.div className="tow-lobby-gif-wrap"
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.35, delay:0.1 }}
        >
          <img src={TowGif} alt="Tug of War gameplay" className="tow-lobby-gif" />
          <div className="tow-lobby-gif__live">
            <span className="tow-lobby-gif__live-dot" />
            <span>{PLAYER_COUNT} playing</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── WAITING ROOM ── */}
          {submittedBg ? (
            <motion.div key="waiting"
              className="tow-waiting-room"
              style={{ '--scene-color': thumbColor }}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.4, type:'spring', stiffness:280, damping:22 }}
            >
              {/* thumb */}
              <div className="tow-waiting-room__thumb" style={{ borderColor: thumbColor }}>
                <div className="tow-waiting-room__grid">
                  {(submittedBg.colors || []).slice(0,16).map((c, i) => (
                    <div key={i} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="tow-waiting-room__info">
                <span className="tow-waiting-room__name">{submittedBg.name}</span>

                <AnimatePresence mode="wait">
                  <motion.span key={waitingStatus} className="tow-waiting-room__status"
                    initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:-4 }} transition={{ duration:0.28 }}
                  >{WAITING_STATUSES[waitingStatus]}</motion.span>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.span key={otherCount} className="tow-waiting-room__others"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.4 }}
                  >{otherCount} other{otherCount!==1?'s':''} submitted</motion.span>
                </AnimatePresence>
              </div>

              <motion.button className="tow-waiting-room__edit"
                onClick={handleCreate}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                title="Replace your submission with a new one"
              >Replace</motion.button>
            </motion.div>

          ) : (

            /* ── PRE-SUBMIT ── */
            <motion.div key="pre-submit"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.3 }}
              style={{ display:'flex', flexDirection:'column', gap:10 }}
            >
              <motion.p className="tow-lobby-hint"
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.3, delay:0.08 }}
              >
                Paint the stage — your battlefield could be chosen for the whole class!
              </motion.p>

              <div className="tow-lobby-actions">
                <motion.button className="tow-lobby-btn"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.3, delay:0.1 }}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleCreate}
                >⚔️ Paint Your Battlefield</motion.button>

                <motion.button className="tow-lobby-btn tow-lobby-btn--secondary"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.3, delay:0.15 }}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleMyDesigns}
                >My Designs</motion.button>
              </div>

              <div className="tow-lobby-feed">
                <AnimatePresence mode="wait">
                  {lobbyEvent && (
                    <motion.div key={lobbyEvent.text} className="tow-lobby-feed__event"
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                    >
                      <span className="tow-lobby-feed__icon">{lobbyEvent.icon}</span>
                      <span className="tow-lobby-feed__text">{lobbyEvent.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sheet */}
      <AnimatePresence>
        {isChallengeOpen && (
          <TugOfWarChallenge
            isOpen={isChallengeOpen}
            variant={challengeVariant}
            onClose={handleClose}
            onBgSubmitted={handleBgSubmitted}
            playerCount={PLAYER_COUNT}
            defaultTab={defaultTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyTugOfWar;
