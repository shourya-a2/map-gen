import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MysteryMapChallenge.css';

import HeroVideo from '../../assets/Animated_Game_Background_Video_Loop.mp4';
import CoinIcon from '../../assets/coin-icon.svg';
import MockupMap from '../../assets/wayarena-map-preview.png';
import { detectTheme, THEME_PALETTES } from '../../utils/mapCreatorUtils';

const MAX_CHARS = 150;
const MAP_GENERATION_COST = 10000;
const COINS_PER_ROUND = 5000;

const GRID_COLS = 8;
const GRID_ROWS = 8;
const GRID_CELLS = GRID_COLS * GRID_ROWS;


// ─── ticker sequence (narrative arc, timed in ms) ─────────────────────────────
const TICKER_SEQUENCE = [
  { ms: 0,    text: 'Something stirs in the deep…' },
  { ms: 700,  text: 'The ground begins to shift…' },
  { ms: 1400, text: 'Terrain is taking shape…' },
  { ms: 2000, text: 'Secrets are being buried…' },
  { ms: 2600, text: 'Almost ready…' },
  { ms: 2900, text: '' },  // silence before the reveal
];

const PROMPT_SUGGESTIONS = [
  'Medieval Castle',
  'Volcanic Island',
  'Desert Ruins',
  'Underwater City',
];

const PLACEHOLDER_EXAMPLES = [
  'A haunted castle with lava moat',
  'Sunken pirate ship in a coral reef',
  'Floating islands connected by bridges',
  'A maze inside an active volcano',
  'Frozen tundra with hidden caves',
];

// ─── social proof messages ─────────────────────────────────────────────────────
const SOCIAL_MESSAGES = [
  'Alex just submitted a map!',
  'Jordan generated a LEGENDARY arena!',
  'Sam is describing their arena…',
  'Riley just created Underwater City',
  'Morgan earned a RARE map!',
  'Chris is in the lobby…',
  'Taylor just submitted a map!',
];

const springTransition = { type: 'spring', stiffness: 400, damping: 17 };
const sheetSpring     = { type: 'spring', damping: 22, stiffness: 170, mass: 0.8 };

// ─── audio helpers ─────────────────────────────────────────────────────────────
const createAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  return Ctx ? new Ctx() : null;
};

const tone = (ctx, freq, startOffset, dur, type = 'triangle', vol = 0.08) => {
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
    gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startOffset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + dur);
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + dur + 0.05);
  } catch (e) { /* ignore */ }
};

// Low hum that rises in pitch over `duration` seconds
const startRisingHum = (ctx) => {
  if (!ctx) return () => {};
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 2.8);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2.4);
    gain.gain.linearRampToValueAtTime(0,    ctx.currentTime + 3.0);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3.1);
    return () => { try { osc.stop(); } catch (e) {} };
  } catch (e) { return () => {}; }
};

// Rapid ascending arpeggio (gets faster): the "processing" texture
const startArpeggio = (ctx) => {
  if (!ctx) return () => {};
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
  let stopped = false;
  let interval = 600;
  let timerId;
  const loop = () => {
    if (stopped) return;
    notes.forEach((f, i) => tone(ctx, f, i * 0.12, 0.3, 'triangle', 0.04));
    interval = Math.max(300, interval - 40);
    timerId = setTimeout(loop, interval);
  };
  loop();
  return () => { stopped = true; clearTimeout(timerId); };
};

// Absolute silence-snap before reveal — just schedules nothing; stop the arpeggio
const stopAll = (stopFn) => { if (stopFn) stopFn(); };

// Reveal fanfare
const playRevealFanfare = (ctx) => {
  if (!ctx) return;
  tone(ctx, 80,     0,    0.4, 'sine',     0.20);
  tone(ctx, 120,    0,    0.3, 'sine',     0.12);
  [[261.63,0.05],[329.63,0.10],[392.00,0.15],[523.25,0.20]].forEach(([f,d]) =>
    tone(ctx, f, d, 1.2, 'triangle', 0.10)
  );
};

// Submit celebration fanfare
const playSubmitFanfare = (ctx) => {
  if (!ctx) return;
  [[523.25,0],[659.25,0.1],[783.99,0.2],[1046.5,0.3],[1318.5,0.42]].forEach(([f,d]) =>
    tone(ctx, f, d, 0.7, 'sine', 0.12)
  );
  // Percussive hit
  tone(ctx, 200, 0, 0.15, 'sawtooth', 0.08);
};

// Short impact on Generate button press
const playGenerateImpact = (ctx) => {
  if (!ctx) return;
  tone(ctx, 150, 0,    0.15, 'sawtooth', 0.15);
  tone(ctx, 300, 0.05, 0.25, 'triangle', 0.08);
};

// ─── colour generation ─────────────────────────────────────────────────────────
const generateMapColors = (promptText) => {
  const theme   = detectTheme(promptText) || 'default';
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.default;
  // pseudo-random but deterministic from prompt length
  const seed = promptText.length;
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const idx = (i * 7 + seed) % palette.length;
    return palette[idx];
  });
};

// ─── confetti particle ────────────────────────────────────────────────────────
const ConfettiParticle = ({ color, x, vy, vx, rotate, delay }) => (
  <motion.div
    className="aura-confetti"
    style={{ background: color, left: `${x}%` }}
    initial={{ y: 0, opacity: 1, rotate: 0 }}
    animate={{ y: 320, opacity: 0, rotate: rotate }}
    transition={{ duration: 1.4 + Math.random() * 0.6, delay, ease: 'easeIn' }}
  />
);

const CONFETTI_COLORS = ['#FFD700','#a78bfa','#FF69B4','#00BFFF','#22C55E','#ff6b35','#fff'];
const makeConfetti = (count = 40) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: 5 + (i / count) * 90,
    rotate: -360 + i * 18,
    delay: (i / count) * 0.5,
  }));

// ─── Map grid (preview & fog) ─────────────────────────────────────────────────
const MapGrid = ({ colors, size = 'normal' }) => (
  <div className={`aura-map-grid aura-map-grid--${size}`}>
    {colors.map((color, i) => (
      <div key={i} className="aura-map-grid__cell" style={{ backgroundColor: color }} />
    ))}
  </div>
);

// Animated fog-of-war reveal
const FogGrid = ({ colors, progress }) => {
  const revealed = Math.floor(progress * GRID_CELLS);
  return (
    <div className="aura-fog-grid">
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="aura-fog-grid__cell"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={i < revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18 }}
        />
      ))}
    </div>
  );
};


// ─── main component ────────────────────────────────────────────────────────────
const MysteryMapChallenge = ({
  isOpen,
  onClose,
  onMapSubmitted,
  initialCoins = 10000,
  defaultTab   = 'create',
  playerCount  = 0,
}) => {
  const [activeTab,      setActiveTab]      = useState(defaultTab);
  const [prompt,         setPrompt]         = useState('');
  const [coins,          setCoins]          = useState(initialCoins);
  const [myMaps,         setMyMaps]         = useState([]);

  // phases: idle | generating | preview | submitted
  const [creatorPhase,   setCreatorPhase]   = useState('idle');
  const [currentMapData, setCurrentMapData] = useState(null);
  const [tickerText,     setTickerText]     = useState('');
  const [revealProgress, setRevealProgress] = useState(0);
  const [shaking,        setShaking]        = useState(false);
  const [confetti,       setConfetti]       = useState(null);
  const [flyCoins,       setFlyCoins]       = useState(null);
  const [socialMsg,      setSocialMsg]      = useState('');
  const [placeholderText,setPlaceholderText]= useState('');

  const placeholderRef    = useRef({ exampleIdx:0, charIdx:0, deleting:false, timeout:null });
  const audioCtxRef       = useRef(null);
  const arpeggioStopRef   = useRef(null);
  const humStopRef        = useRef(null);
  const revealIntervalRef = useRef(null);
  const tickerTimersRef   = useRef([]);
  const socialTimerRef    = useRef(null);

  const ensureAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioContext();
    return audioCtxRef.current;
  };

  // ── sync tab with prop ──────────────────────────────────────────────────────
  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  // ── typewriter placeholder ──────────────────────────────────────────────────
  useEffect(() => {
    const ref = placeholderRef.current;
    const tick = () => {
      const ex = PLACEHOLDER_EXAMPLES[ref.exampleIdx];
      if (!ref.deleting) {
        ref.charIdx++;
        setPlaceholderText(ex.slice(0, ref.charIdx));
        if (ref.charIdx >= ex.length) { ref.timeout = setTimeout(() => { ref.deleting = true; tick(); }, 2000); return; }
        ref.timeout = setTimeout(tick, 60 + Math.random() * 40);
      } else {
        ref.charIdx--;
        setPlaceholderText(ex.slice(0, ref.charIdx));
        if (ref.charIdx <= 0) {
          ref.deleting = false;
          ref.exampleIdx = (ref.exampleIdx + 1) % PLACEHOLDER_EXAMPLES.length;
          ref.timeout = setTimeout(tick, 400); return;
        }
        ref.timeout = setTimeout(tick, 30);
      }
    };
    tick();
    return () => clearTimeout(ref.timeout);
  }, []);

  // ── social proof ticker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!playerCount) return;
    let idx = 0;
    const cycle = () => {
      setSocialMsg(SOCIAL_MESSAGES[idx % SOCIAL_MESSAGES.length]);
      idx++;
      socialTimerRef.current = setTimeout(cycle, 4000 + Math.random() * 3000);
    };
    socialTimerRef.current = setTimeout(cycle, 2000);
    return () => clearTimeout(socialTimerRef.current);
  }, [playerCount]);

  const canGenerate = prompt.trim().length > 0 && coins >= MAP_GENERATION_COST;
  const generationsLeft = Math.floor(coins / MAP_GENERATION_COST);
  const tabsLocked = creatorPhase !== 'idle';

  // ── fly-coins helper ────────────────────────────────────────────────────────
  const spawnFlyCoins = () =>
    Array.from({ length: 8 }, (_, i) => {
      const angleDeg = -200 + (i / 7) * 160;
      const angleRad = (angleDeg * Math.PI) / 180;
      const dist = 50 + Math.random() * 35;
      return { id: i, x: Math.cos(angleRad)*dist, y: Math.sin(angleRad)*dist,
               rotate: (Math.random()-0.5)*360, delay: i*0.04 };
    });

  // ── prompt handlers ─────────────────────────────────────────────────────────
  const handlePromptChange = useCallback((e) => {
    if (e.target.value.length <= MAX_CHARS) setPrompt(e.target.value);
  }, []);

  const handleSuggestionClick = useCallback((text) => {
    setPrompt(prev => {
      const t = prev.trimEnd();
      if (!t) return text;
      if (t.toLowerCase().endsWith(text.toLowerCase())) return prev;
      const next = t + ', ' + text;
      return next.length <= MAX_CHARS ? next : prev;
    });
  }, []);

  // ── GENERATE ────────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    const ctx = ensureAudio();

    const colors  = generateMapColors(prompt.trim());
    const theme   = detectTheme(prompt.trim()) || 'default';
    const mapData = {
      id: Date.now(),
      name: prompt.trim() || 'Mystery Map',
      prompt: prompt.trim(),
      theme, colors,
      difficulty: 'medium',
      submitted: false,
    };
    setCurrentMapData(mapData);
    setCoins(prev => prev - MAP_GENERATION_COST);
    setFlyCoins(spawnFlyCoins());

    // ── physical feedback: shake ──────────────────────────────────────────────
    setShaking(true);
    setTimeout(() => setShaking(false), 500);

    // ── audio: impact → rising hum → accelerating arpeggio ───────────────────
    playGenerateImpact(ctx);
    setTimeout(() => { humStopRef.current    = startRisingHum(ctx);  }, 150);
    setTimeout(() => { arpeggioStopRef.current = startArpeggio(ctx); }, 200);

    setCreatorPhase('generating');
    setRevealProgress(0);

    // ── narrative ticker sequence ─────────────────────────────────────────────
    tickerTimersRef.current.forEach(clearTimeout);
    tickerTimersRef.current = TICKER_SEQUENCE.map(({ ms, text }) =>
      setTimeout(() => setTickerText(text), ms)
    );

    // ── fog-of-war progress ───────────────────────────────────────────────────
    const TOTAL_MS = 2850;
    const TICK_MS  = 40;
    const steps    = TOTAL_MS / TICK_MS;
    let step = 0;
    if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    revealIntervalRef.current = setInterval(() => {
      step++;
      setRevealProgress(Math.min(step / steps, 1));
      if (step >= steps) clearInterval(revealIntervalRef.current);
    }, TICK_MS);

    // ── stop arpeggio at silence beat, then fire reveal ───────────────────────
    setTimeout(() => {
      stopAll(arpeggioStopRef.current); arpeggioStopRef.current = null;
      stopAll(humStopRef.current);      humStopRef.current      = null;
    }, 2900);

    setTimeout(() => {
      playRevealFanfare(ctx);
      setCreatorPhase('preview');
    }, 3050);
  }, [canGenerate, prompt]); // eslint-disable-line


  // ── CLOSE ────────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    stopAll(arpeggioStopRef.current);
    arpeggioStopRef.current = null;
    if (onClose) onClose();
  }, [onClose]);

  // ── SUBMIT ────────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback((mapToSubmit = null) => {
    const mapData = mapToSubmit || currentMapData;
    if (!mapData) return;

    const ctx = ensureAudio();
    playSubmitFanfare(ctx);

    const submitted = { ...mapData, submitted: true };
    if (mapToSubmit) {
      setMyMaps(prev => prev.map(m => m.id === mapToSubmit.id ? submitted : m));
    } else {
      setMyMaps(prev => [submitted, ...prev]);
      setConfetti(makeConfetti(50));
      setCreatorPhase('submitted');
    }
    if (onMapSubmitted) onMapSubmitted(submitted);

    if (mapToSubmit) {
      handleClose();
    }
    // from create flow — stay open so user sees the success state and leaves on their own
  }, [currentMapData, onMapSubmitted, handleClose]); // eslint-disable-line

  // ── RESET ────────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setCreatorPhase('idle');
    setCurrentMapData(null);
    setPrompt('');
    setTickerText('');
    setRevealProgress(0);
    setConfetti(null);
    setCoins(prev => Math.min(prev + COINS_PER_ROUND, initialCoins));
  }, [initialCoins]);

  if (!isOpen) return null;

  return (
    <>
      {/* ── scrim ── */}
      <motion.div className="aura-scrim"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.3 }} onClick={handleClose}
      />

      {/* ── floating close ── */}
      <motion.button className="aura-close aura-close--floating"
        onClick={handleClose}
        initial={{ x:'-100%', opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:'-100%', opacity:0 }}
        transition={sheetSpring} whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
      >✕</motion.button>

      {/* ── side sheet ── */}
      <motion.div
        className="aura-sheet"
        animate={shaking
          ? { x: [0,-6,6,-4,4,-2,2,0] }
          : { x: 0 }}
        transition={shaking ? { duration:0.45, ease:'easeInOut' } : sheetSpring}
        initial={{ x: '-100%' }}
        exit={{ x: '-100%' }}
      >
        {/* confetti */}
        <AnimatePresence>
          {confetti && (
            <div className="aura-confetti-layer" onAnimationEnd={() => setConfetti(null)}>
              {confetti.map(p => <ConfettiParticle key={p.id} {...p} />)}
            </div>
          )}
        </AnimatePresence>

        {/* video bg */}
        <motion.div className="aura-video-bg"
          animate={
            creatorPhase === 'generating'
              ? { scale:1.10, filter:'brightness(1.5) saturate(1.4)' }
              : creatorPhase === 'submitted'
              ? { scale:1.05, filter:'brightness(1.2) hue-rotate(30deg)' }
              : { scale:1.0,  filter:'brightness(1)' }
          }
          transition={{ duration:1.2, ease:'easeInOut' }}
        >
          <video className="aura-video-bg__video" autoPlay loop muted playsInline>
            <source src={HeroVideo} type="video/mp4" />
          </video>
        </motion.div>

        {/* flicker during generation */}
        <AnimatePresence>
          {creatorPhase === 'generating' && (
            <motion.div className="aura-flicker"
              initial={{ opacity:0 }}
              animate={{ opacity:[0,0.45,0,0.3,0] }}
              exit={{ opacity:0 }}
              transition={{ duration:0.38, repeat:Infinity }}
            />
          )}
        </AnimatePresence>

        {/* ── header ── */}
        <div className="aura-header">
          <div className="aura-header__left">
            <div className={`aura-tabs ${tabsLocked ? 'aura-tabs--locked' : ''}`}>
              {['create','mymaps'].map(tab => (
                <motion.button key={tab}
                  className={`aura-tab ${activeTab===tab?'active':''} ${tabsLocked?'aura-tab--locked':''}`}
                  onClick={() => !tabsLocked && setActiveTab(tab)}
                  whileHover={!tabsLocked ? { scale:1.05 } : {}}
                  whileTap={!tabsLocked  ? { scale:0.95 } : {}}
                  transition={springTransition}
                >
                  {tab === 'create' ? 'CREATE' : 'MY MAPS'}
                  {tab === 'create' && creatorPhase === 'generating' && (
                    <span className="aura-tab__generating-dot" />
                  )}
                  {tab === 'mymaps' && myMaps.length > 0 && (
                    <span className="aura-tab-badge">{myMaps.length}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="aura-header__right">
            {playerCount > 0 && (
              <div className="aura-player-count">
                <span className="aura-player-count__dot" />
                <span className="aura-player-count__text">{playerCount} ONLINE</span>
              </div>
            )}
            <div className="aura-coins">
              <img src={CoinIcon} alt="" className="aura-coins__icon" />
              <motion.span
                className="aura-coins__value"
                key={coins}
                animate={{ scale:[1.3,1] }}
                transition={{ duration:0.25 }}
              >{coins.toLocaleString()}</motion.span>
              <AnimatePresence>
                {flyCoins && flyCoins.map((coin,i) => (
                  <motion.img src={CoinIcon} alt="" className="aura-coins__fly-coin"
                    key={`fly-${coin.id}`}
                    initial={{ opacity:1, y:0, x:0, scale:1, rotate:0 }}
                    animate={{ opacity:0, y:coin.y, x:coin.x, scale:1.2, rotate:coin.rotate }}
                    transition={{ duration:0.65, delay:coin.delay, ease:'easeOut' }}
                    onAnimationComplete={i===flyCoins.length-1 ? ()=>setFlyCoins(null) : undefined}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── social feed — fixed footer, never overlaps content ── */}
        <AnimatePresence mode="wait">
          {creatorPhase === 'idle' && socialMsg && (
            <motion.div key={socialMsg} className="aura-social-feed"
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-6 }} transition={{ duration:0.35 }}
            >
              <span className="aura-social-feed__dot" />
              <span className="aura-social-feed__text">{socialMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── body ── */}
        <div className="aura-body">
          <AnimatePresence mode="wait">

            {/* ════ CREATE TAB ════ */}
            {activeTab === 'create' && (
              <motion.div key="create" className="aura-create"
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:20 }} transition={{ duration:0.25 }}
              >
                {/* title block */}
                <div className="aura-title-block">
                  <motion.span
                    className="aura-title__text"
                    key={creatorPhase}
                    initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.3 }}
                  >
                    {creatorPhase === 'idle'      && 'Describe the arena you want to play'}
                    {creatorPhase === 'generating' && 'Forging your arena…'}
                    {creatorPhase === 'preview'    && '✨ Your arena is ready!'}
                    {creatorPhase === 'submitted'  && '🎉 Entered the arena!'}
                  </motion.span>
                </div>

                <div className="aura-phase-content">

                  {/* upper region */}
                  <div className="aura-upper-region">
                    <AnimatePresence mode="wait">

                      {/* IDLE */}
                      {creatorPhase === 'idle' && (
                        <motion.div key="idle" className="aura-idle"
                          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                          transition={{ duration:0.3 }}
                        >
                          <div className="aura-input-wrap">
                            <label className="aura-input-label" htmlFor="arena-prompt">
                              Type your idea below
                            </label>
                            <textarea
                              id="arena-prompt"
                              className="aura-input"
                              placeholder={placeholderText}
                              value={prompt}
                              onChange={handlePromptChange}
                              rows={3}
                              autoFocus
                            />
                            {!prompt && <span className="aura-input-cursor" />}
                            <span className="aura-input-wc">{prompt.length}/{MAX_CHARS}</span>
                          </div>
                          <div className="aura-suggestions">
                            <span className="aura-suggestions__label">Or pick a quick idea:</span>
                            <div className="aura-suggestions__list">
                              {PROMPT_SUGGESTIONS.map((text,i) => (
                                <motion.button key={i} className="aura-pill"
                                  onClick={() => handleSuggestionClick(text)}
                                  whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.96 }}
                                  transition={springTransition}
                                >{text}</motion.button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* GENERATING — mockup image blurred while forging */}
                      {creatorPhase === 'generating' && (
                        <motion.div key="generating" className="aura-feedback-box"
                          initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                          exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.35 }}
                        >
                          <motion.img
                            src={MockupMap}
                            alt="Map generating"
                            className="aura-mockup-img"
                            animate={{ filter: `blur(${(1 - revealProgress) * 10}px) saturate(${0.4 + revealProgress * 0.6})` }}
                            transition={{ duration: 0.05 }}
                          />
                          <div className="aura-feedback-box__progress">
                            <motion.div className="aura-feedback-box__progress-fill"
                              initial={{ width:'0%' }} animate={{ width:'100%' }}
                              transition={{ duration:3, ease:'linear' }}
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* PREVIEW — mockup fully sharp */}
                      {creatorPhase === 'preview' && currentMapData && (
                        <motion.div key="preview" className="aura-preview-area"
                          initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                          exit={{ opacity:0 }}
                          transition={{ type:'spring', stiffness:280, damping:20 }}
                        >
                          <div className="aura-map-preview">
                            <motion.img
                              src={MockupMap}
                              alt={currentMapData.name}
                              className="aura-mockup-img aura-mockup-img--preview"
                              initial={{ filter:'blur(4px)' }}
                              animate={{ filter:'blur(0px)' }}
                              transition={{ duration:0.5 }}
                            />
                            <div className="aura-map-preview__label">
                              <span className="aura-map-preview__name">{currentMapData.name}</span>
                              <span className="aura-map-preview__theme">
                                {currentMapData.theme.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* SUBMITTED */}
                      {creatorPhase === 'submitted' && currentMapData && (
                        <motion.div key="submitted" className="aura-submitted-area"
                          initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                          exit={{ opacity:0 }} transition={{ duration:0.4 }}
                        >
                          <motion.div className="aura-submitted-check"
                            initial={{ scale:0 }} animate={{ scale:1 }}
                            transition={{ type:'spring', stiffness:400, damping:15, delay:0.1 }}
                          >✓</motion.div>
                          <p className="aura-submitted-message">
                            "{currentMapData.name}" is with your teacher!
                          </p>
                          {playerCount > 0 && (
                            <p className="aura-submitted-context">
                              {playerCount} players are waiting to see which map gets chosen.
                            </p>
                          )}
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>

                  {/* lower region */}
                  <div className="aura-lower-region">
                    <AnimatePresence mode="wait">

                      {creatorPhase === 'idle' && (
                        <motion.div key="idle-btns" className="aura-actions"
                          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                          transition={{ duration:0.25 }}
                        >
                          <motion.button
                            className={`wa-btn-primary ${canGenerate?'':'disabled'}`}
                            onClick={() => canGenerate && handleGenerate()}
                            disabled={!canGenerate}
                            whileHover={canGenerate ? { scale:1.02 } : {}}
                            whileTap={canGenerate  ? { scale:0.97 } : {}}
                            transition={springTransition}
                          >
                            <span className="wa-btn-primary__text">CREATE MAP</span>
                            <span className="wa-btn-primary__cost">
                              <img src={CoinIcon} alt="" className="wa-btn-primary__coin" />
                              <span>{MAP_GENERATION_COST.toLocaleString()}</span>
                            </span>
                          </motion.button>
                          {coins < MAP_GENERATION_COST && prompt.trim().length > 0 && (
                            <span className="aura-coins-warning">
                              NOT ENOUGH COINS — {MAP_GENERATION_COST.toLocaleString()} needed
                            </span>
                          )}
                        </motion.div>
                      )}

                      {creatorPhase === 'generating' && (
                        <motion.div key="ticker" className="aura-ticker"
                          initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                          exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.3 }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.span key={tickerText} className="aura-ticker__message"
                              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                              exit={{ opacity:0, y:-8 }} transition={{ duration:0.28 }}
                            >{tickerText}</motion.span>
                          </AnimatePresence>
                        </motion.div>
                      )}

                      {creatorPhase === 'preview' && (
                        <motion.div key="preview-btns" className="aura-actions"
                          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                          exit={{ opacity:0 }} transition={{ duration:0.3 }}
                        >
                          <motion.button className="wa-btn-primary"
                            onClick={() => handleSubmit()}
                            whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                            transition={springTransition}
                          >ENTER THE ARENA</motion.button>
                          <motion.button className="aura-reset-link"
                            onClick={handleReset} whileHover={{ opacity:1 }}
                          >
                            ↩ Create a different map
                            {generationsLeft > 0 && (
                              <span className="aura-reset-link__coins"> (+{COINS_PER_ROUND.toLocaleString()} coins)</span>
                            )}
                          </motion.button>
                        </motion.div>
                      )}

                      {creatorPhase === 'submitted' && (
                        <motion.div key="submitted-btns" className="aura-actions"
                          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                          exit={{ opacity:0 }} transition={{ duration:0.35 }}
                        >
                          <motion.button className="wa-btn-primary"
                            onClick={handleClose}
                            whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                            transition={springTransition}
                          >BACK TO LOBBY</motion.button>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ════ MY MAPS TAB ════ */}
            {activeTab === 'mymaps' && (
              <motion.div key="mymaps" className="aura-mymaps"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}
              >
                {myMaps.length === 0 ? (
                  <div className="aura-mymaps-empty">
                    <p className="aura-mymaps-empty__title">NO MAPS YET</p>
                    <span className="aura-mymaps-empty__hint">Create your first map!</span>
                    <div className="aura-mymaps-placeholders">
                      {[1,2,3].map(i => (
                        <div key={i} className="aura-map-card aura-map-card--placeholder">
                          <div className="aura-map-card__grid aura-map-card__grid--placeholder">
                            {Array.from({length:16}).map((_,j) => <div key={j} />)}
                          </div>
                          <div className="aura-map-card__info">
                            <span className="aura-map-card__name aura-map-card__name--placeholder" />
                            <div className="aura-map-card__meta">
                              <span className="aura-map-card__theme aura-map-card__theme--placeholder" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <motion.button className="wa-btn-primary aura-mymaps-empty__cta"
                      onClick={() => setActiveTab('create')}
                      whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      transition={springTransition}
                    >CREATE YOUR FIRST MAP</motion.button>
                  </div>
                ) : (
                  <>
                    <div className="aura-mymaps-list">
                      {myMaps.map(map => (
                          <motion.div key={map.id}
                            className={`aura-map-card ${map.submitted?'submitted':''}`}
                            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                            whileHover={{ scale:1.01 }} transition={springTransition}
                          >
                            <div className="aura-map-card__grid">
                              {(map.colors||[]).slice(0,16).map((color,i) => (
                                <div key={i} style={{ backgroundColor:color }} />
                              ))}
                            </div>
                            <div className="aura-map-card__info">
                              <span className="aura-map-card__name">{map.name}</span>
                              <div className="aura-map-card__meta">
                                <span className="aura-map-card__theme">{map.theme}</span>
                              </div>
                              {map.submitted && <span className="aura-map-card__status">✓ SUBMITTED</span>}
                            </div>
                            <div className="aura-map-card__actions">
                              <motion.button
                                className={`aura-map-card__submit ${map.submitted?'resubmit':''}`}
                                onClick={() => handleSubmit(map)}
                                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                              >{map.submitted ? 'RE-SUBMIT' : 'SUBMIT'}</motion.button>
                            </div>
                          </motion.div>
                      ))}
                    </div>
                    <div className="aura-mymaps-footer">
                      <span>{myMaps.length} MAP{myMaps.length!==1?'S':''}</span>
                      <span className="aura-mymaps-footer__submitted">
                        {myMaps.filter(m=>m.submitted).length} SUBMITTED
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

export default MysteryMapChallenge;
