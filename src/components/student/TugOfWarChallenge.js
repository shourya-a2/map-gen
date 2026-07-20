import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import './TugOfWarChallenge.css';

import CoinIcon from '../../assets/coin-icon.svg';
import MockupMapPirate from '../../assets/tow-bg-pirate.png';
import TowLogo from '../../assets/StudentSide_Thumbnail_TOW_Logo.png';
import TowGif       from '../../assets/Idle animation-TOW.gif';
import TowGifActive from '../../assets/active animation-tow.gif';
import MockupMapCastle from '../../assets/tow-bg-castle.png';
import { detectTheme, THEME_PALETTES } from '../../utils/mapCreatorUtils';

const MAX_CHARS = 150;
const BG_GENERATION_COST = 10000;
const COINS_PER_ROUND = 5000;

const GRID_COLS = 8;
const GRID_ROWS = 8;
const GRID_CELLS = GRID_COLS * GRID_ROWS;

// Scene palettes — rows represent sky → midground → ground, like the illustrated backgrounds
// Each scene has sky, far, mid, near, ground layers + accent colours
const SCENES = {
  pirate: {
    sky:    ['#5bb8f5','#7ec8e3','#a8dff0'],        // tropical blue sky
    far:    ['#2d8a4e','#3a9e5f','#1a5c32'],        // distant jungle
    mid:    ['#c8955a','#d4a76a','#b07840'],        // sandy beach
    near:   ['#8b6914','#a07830','#6b4f10'],        // wood/dock
    ground: ['#d4a76a','#c09050','#b8803a'],        // sand
    accent: ['#1a6e9f','#e8c040'],                  // ocean, gold coins
  },
  castle: {
    sky:    ['#2d1b69','#3d2880','#1a0f45'],        // purple night sky
    far:    ['#4a3580','#5a4090','#382870'],        // distant castle
    mid:    ['#6b5a9a','#7a6ab0','#5a4888'],        // castle walls
    near:   ['#2a2040','#3a3055','#1a1530'],        // dark foreground
    ground: ['#3d3060','#4a3870','#2d2250'],        // magic floor
    accent: ['#00e5ff','#7fff00'],                  // magic teal, potion green
  },
  volcano: {
    sky:    ['#7f1d1d','#991b1b','#450a0a'],        // red smoky sky
    far:    ['#292524','#3c3533','#1c1a19'],        // dark rocks
    mid:    ['#dc2626','#ea580c','#b91c1c'],        // lava flows
    near:   ['#1c1917','#292524','#111110'],        // dark stone
    ground: ['#dc2626','#f97316','#b45309'],        // lava ground
    accent: ['#fbbf24','#f97316'],                  // ember yellow, orange
  },
  arctic: {
    sky:    ['#bfdbfe','#dbeafe','#93c5fd'],        // pale blue sky
    far:    ['#e0f2fe','#f0f9ff','#bae6fd'],        // distant ice
    mid:    ['#7dd3fc','#38bdf8','#0ea5e9'],        // ice formations
    near:   ['#e2e8f0','#f1f5f9','#cbd5e1'],        // snow foreground
    ground: ['#f8fafc','#e2e8f0','#cbd5e1'],        // white snow
    accent: ['#06b6d4','#a5f3fc'],                  // cyan ice
  },
  jungle: {
    sky:    ['#166534','#15803d','#14532d'],        // deep canopy green
    far:    ['#365314','#4d7c0f','#3f6212'],        // distant trees
    mid:    ['#84cc16','#65a30d','#a3e635'],        // foliage
    near:   ['#713f12','#92400e','#57330a'],        // tree trunks
    ground: ['#78350f','#92400e','#6b2d0a'],        // jungle floor
    accent: ['#facc15','#f97316'],                  // sunlight, fruits
  },
  default: {
    sky:    ['#1e3a5f','#2563eb','#1d4ed8'],        // blue sky
    far:    ['#065f46','#047857','#064e3b'],        // green hills
    mid:    ['#b45309','#d97706','#92400e'],        // sandy mid
    near:   ['#78350f','#92400e','#6b2d0a'],        // brown near
    ground: ['#d97706','#b45309','#92400e'],        // earthy ground
    accent: ['#dc2626','#16a34a'],                  // red/green teams
  },
};

// Pick the best matching scene image for preview — cycle between available ones
const getMockupForTheme = (theme) => {
  // castle theme gets castle, everything else gets pirate (beach/adventure feel)
  return theme === 'castle' ? MockupMapCastle : MockupMapPirate;
};

const detectTowTheme = (text) => {
  const t = text.toLowerCase();
  if (t.includes('pirate') || t.includes('beach') || t.includes('treasure') || t.includes('island') || t.includes('ship')) return 'pirate';
  if (t.includes('castle') || t.includes('wizard') || t.includes('magic') || t.includes('potion') || t.includes('spell')) return 'castle';
  if (t.includes('volcano') || t.includes('lava') || t.includes('fire'))  return 'volcano';
  if (t.includes('arctic') || t.includes('snow') || t.includes('ice') || t.includes('frozen')) return 'arctic';
  if (t.includes('jungle') || t.includes('forest') || t.includes('canopy')) return 'jungle';
  return 'default';
};

// Paint the grid as a layered scene: sky top, scene middle, ground bottom
const generateBgColors = (promptText) => {
  const theme  = detectTowTheme(promptText);
  const scene  = SCENES[theme];
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const seed = (col * 3 + row) % 3;
    if (row <= 1) return scene.sky[seed];
    if (row === 2) return scene.far[seed];
    if (row === 3) return scene.mid[seed];
    if (row === 4) return scene.near[seed];
    if (row === 5) {
      // rope line — alternating accent
      return col % 2 === 0 ? scene.accent[0] : scene.mid[seed];
    }
    return scene.ground[seed];
  });
};

// 12s total generation — messages spread across the wait
const TICKER_SEQUENCE = [
  { ms: 0,    text: 'Setting the stage…' },
  { ms: 1500, text: 'Painting team colours…' },
  { ms: 3000, text: 'Placing the rope…' },
  { ms: 5000, text: 'Adding the crowd…' },
  { ms: 7000, text: 'Sculpting the terrain…' },
  { ms: 9000, text: 'Almost battle-ready…' },
  { ms: 11200, text: '' }, // silence before zoom
];

const BG_SUGGESTIONS = [
  'Volcanic Crater',
  'Frozen Tundra',
];

const PLACEHOLDER_EXAMPLES = [
  'Two teams on a crumbling cliff edge',
  'Red team vs blue team in a lava field',
  'A rope bridge over a jungle canyon',
  'Storm clouds and lightning in the background',
  'Arctic wasteland with blizzard winds',
];

const SOCIAL_MESSAGES = [
  'Alex just designed a LAVA backdrop!',
  'Jordan\'s storm scene is incredible',
  'Sam is describing their battlefield…',
  'Riley\'s frozen tundra got picked!',
  'Morgan designed the jungle canopy',
];

const springTransition = { type: 'spring', stiffness: 400, damping: 17 };
const sheetSpring      = { type: 'spring', damping: 22, stiffness: 170, mass: 0.8 };

// ─── audio ────────────────────────────────────────────────────────────────────
// All sounds are designed for classroom use — short, soft, sine-only.
// Max vol 0.05. No loops, no sustained tones.
const createAudioContext = () => {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  return Ctx ? new Ctx() : null;
};

let _sharedCtx = null;
const getSharedCtx = () => {
  if (!_sharedCtx) _sharedCtx = createAudioContext();
  if (_sharedCtx && _sharedCtx.state === 'suspended') _sharedCtx.resume();
  return _sharedCtx;
};

// Single soft chime helper
const chime = (ctx, freq, delay, dur, vol = 0.04) => {
  try {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    g.gain.setValueAtTime(0, ctx.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.02);
  } catch (e) {}
};

// Sheet open — two soft ascending tones, barely audible
const playSheetOpen = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  chime(ctx, 440, 0,    0.18, 0.03);
  chime(ctx, 660, 0.1,  0.18, 0.03);
};

// Intro "WELCOME TO" — single soft high note
const playIntroWelcome = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  chime(ctx, 523, 0, 0.2, 0.04);
};

// Intro "WORLD CREATION" — two-note soft resolve
const playIntroBoom = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  chime(ctx, 392, 0,    0.25, 0.04);
  chime(ctx, 523, 0.12, 0.25, 0.04);
};

// Chip tap — single soft tick
const playChipTap = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  chime(ctx, 880, 0, 0.08, 0.03);
};

// Generation — electronic "something being created" texture.
// Rising filtered noise burst + modulated sine sweep + digital artefact pops.
const playGenerationStart = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  try {
    // White noise burst filtered to a swoosh
    const bufSize = ctx.sampleRate * 0.4;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1) * Math.exp(-i/(bufSize*0.35));
    const noise = ctx.createBufferSource();
    const bandpass = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noise.buffer = buf;
    noise.connect(bandpass); bandpass.connect(noiseGain); noiseGain.connect(ctx.destination);
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(800, ctx.currentTime);
    bandpass.frequency.linearRampToValueAtTime(3200, ctx.currentTime + 0.35);
    bandpass.Q.value = 1.2;
    noiseGain.gain.setValueAtTime(0.06, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noise.start(ctx.currentTime);

    // Electronic sweep — sine rising fast then holding
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.55);

    // Digital pops — 3 quick blips spaced out
    [0.05, 0.18, 0.32].forEach((t, i) => {
      const p = ctx.createOscillator();
      const pg = ctx.createGain();
      p.connect(pg); pg.connect(ctx.destination);
      p.type = 'square';
      p.frequency.value = 1200 + i*400;
      pg.gain.setValueAtTime(0.03, ctx.currentTime+t);
      pg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+0.04);
      p.start(ctx.currentTime+t); p.stop(ctx.currentTime+t+0.05);
    });
  } catch(e) {}
};

// Generation complete — watery resolution: filtered noise fade + high chime
const playGenerationDone = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  try {
    // Watery noise fade-in
    const bufSize = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1);
    const noise = ctx.createBufferSource();
    const lp = ctx.createBiquadFilter();
    const ng = ctx.createGain();
    noise.buffer = buf;
    noise.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, ctx.currentTime);
    lp.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.2);
    lp.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
    ng.gain.setValueAtTime(0, ctx.currentTime);
    ng.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.15);
    ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    noise.start(ctx.currentTime);

    // Bright resolution chime pair
    chime(ctx, 1047, 0.1,  0.4, 0.04);
    chime(ctx, 1319, 0.22, 0.45, 0.04);
  } catch(e) {}
};

const tone = (ctx, freq, start, dur, type = 'triangle', vol = 0.08) => {
  try {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    g.gain.setValueAtTime(0, ctx.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  } catch (e) {}
};

const startRisingHum = (ctx) => {
  if (!ctx) return () => {};
  try {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 2.8);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.4);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 3.1);
    return () => { try { osc.stop(); } catch (e) {} };
  } catch (e) { return () => {}; }
};

const startArpeggio = (ctx) => {
  if (!ctx) return () => {};
  // war-drum-like descending pattern
  const notes = [220, 185, 165, 147, 220];
  let stopped = false; let interval = 500; let tid;
  const loop = () => {
    if (stopped) return;
    notes.forEach((f, i) => tone(ctx, f, i * 0.1, 0.28, 'sawtooth', 0.03));
    interval = Math.max(260, interval - 35);
    tid = setTimeout(loop, interval);
  };
  loop();
  return () => { stopped = true; clearTimeout(tid); };
};

const playRevealFanfare = (ctx) => {
  if (!ctx) return;
  // Tug-of-war "battle horn" fanfare
  tone(ctx, 110,    0,    0.5, 'sawtooth', 0.18);
  tone(ctx, 165,    0,    0.4, 'sawtooth', 0.10);
  [[220,0.1],[277,0.2],[330,0.3],[440,0.42]].forEach(([f,d]) =>
    tone(ctx, f, d, 1.0, 'triangle', 0.09)
  );
};

const playSubmitFanfare = (ctx) => {
  if (!ctx) return;
  [[330,0],[440,0.1],[523,0.2],[659,0.32],[880,0.45]].forEach(([f,d]) =>
    tone(ctx, f, d, 0.7, 'triangle', 0.11)
  );
  tone(ctx, 110, 0, 0.2, 'sawtooth', 0.10);
};

const playImpact = (ctx) => {
  if (!ctx) return;
  tone(ctx, 80, 0, 0.2, 'sawtooth', 0.18);
  tone(ctx, 120, 0.05, 0.2, 'sawtooth', 0.08);
};

// ─── confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#dc2626','#2563eb','#f97316','#a78bfa','#fff','#f59e0b'];
const makeConfetti = (n = 40) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: 5 + (i / n) * 90,
    rotate: -360 + i * 18,
    delay: (i / n) * 0.5,
  }));

const ConfettiParticle = ({ color, x, rotate, delay }) => (
  <motion.div className="tow-confetti"
    style={{ background: color, left: `${x}%` }}
    initial={{ y: 0, opacity: 1, rotate: 0 }}
    animate={{ y: 320, opacity: 0, rotate }}
    transition={{ duration: 1.4 + Math.random() * 0.6, delay, ease: 'easeIn' }}
  />
);

// ─── map grid ─────────────────────────────────────────────────────────────────
const BgGrid = ({ colors, size = 'normal' }) => (
  <div className={`tow-bg-grid tow-bg-grid--${size}`}>
    {colors.map((c, i) => (
      <div key={i} className="tow-bg-grid__cell" style={{ backgroundColor: c }} />
    ))}
  </div>
);

const FogGrid = ({ colors, progress }) => {
  const revealed = Math.floor(progress * GRID_CELLS);
  return (
    <div className="tow-fog-grid">
      {colors.map((c, i) => (
        <motion.div key={i} className="tow-fog-grid__cell" style={{ backgroundColor: c }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={i < revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18 }}
        />
      ))}
    </div>
  );
};

// ─── welcome intro ────────────────────────────────────────────────────────────
const WelcomeIntro = ({ onDone }) => {
  const [stage, setStage] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    const t1 = setTimeout(() => { setStage(1); playIntroWelcome(); }, 150);
    const t2 = setTimeout(() => { setStage(2); playIntroBoom();    }, 480);
    const t3 = setTimeout(() => setStage(3), 580);
    const t4 = setTimeout(() => setStage(4), 720);
    const t5 = setTimeout(() => setStage(5), 1900);
    const t6 = setTimeout(() => onDoneRef.current(), 2200);
    return () => [t1,t2,t3,t4,t5,t6].forEach(clearTimeout);
  }, []); // eslint-disable-line

  return (
    <motion.div
      className="tow-welcome-intro"
      animate={stage >= 5 ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeIn' }}
    >
      {/* impact flash */}
      <motion.div
        className="tow-welcome-intro__flash"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 3 ? 1 : 0 }}
        transition={{ duration: 0.12 }}
      />

      {/* WELCOME TO — hard cut from above */}
      <motion.p
        className="tow-welcome-intro__sub"
        initial={{ opacity: 0, y: -50 }}
        animate={stage >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
      >
        WELCOME TO
      </motion.p>

      {/* WORLD CREATION — punches up fast */}
      <motion.h2
        className="tow-welcome-intro__title"
        initial={{ opacity: 0, y: 70, scale: 1.15 }}
        animate={stage >= 2
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 70, scale: 1.15 }}
        transition={{ duration: 0.18, ease: [0.0, 0.0, 0.2, 1] }}
      >
        WORLD<br/>CREATION
      </motion.h2>

      {/* strike line draws across after title lands */}
      <motion.div
        className="tow-welcome-intro__strike"
        style={{ originX: 0 }}
        initial={{ scaleX: 0 }}
        animate={stage >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.18, delay: 0.12, ease: 'easeOut' }}
      />
    </motion.div>
  );
};

// ─── mystery reveal overlay ───────────────────────────────────────────────────
const REVEAL_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (i / 20) * Math.PI * 2,
  dist: 140 + (i % 4) * 40,
  color: ['#ffe430','#22d3ee','#f97316','#a78bfa','#ffffff'][i % 5],
  delay: i * 0.03,
}));

const MysteryReveal = ({ src, variant, onDone }) => {
  const controls   = useAnimation();
  const onDoneRef  = useRef(onDone);

  useEffect(() => {
    const run = async () => {
      // Start off-screen at the sheet's origin (left edge for sheet, bottom for modal)
      const startX = variant === 'sheet' ? '-42vw' : '0vw';
      const startY = variant === 'sheet' ? '0vh'   : '20vh';
      await controls.set({ x: startX, y: startY, scale: 0.2, opacity: 0 });

      // Spring to center
      await controls.start({
        x: 0, y: 0, scale: 1, opacity: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
      });

      // Hold 8 seconds
      await new Promise(r => setTimeout(r, 4000));

      // Fly back
      await controls.start({
        x: startX, y: startY, scale: 0.15, opacity: 0,
        transition: { duration: 0.55, ease: 'easeIn' },
      });

      onDoneRef.current();
    };
    run();
  }, []); // eslint-disable-line

  return (
    <motion.div
      className="tow-mystery-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="tow-mystery-stage">
        {/* Image */}
        <motion.img
          src={src}
          alt="Generated battlefield"
          className="tow-mystery-image"
          animate={controls}
        />

        {/* Burst particles — fire once on mount */}
        {REVEAL_PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="tow-mystery-particle"
            style={{ background: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(p.angle) * p.dist,
              y: Math.sin(p.angle) * p.dist,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{ duration: 0.7, delay: p.delay, ease: 'easeOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ─── main component ────────────────────────────────────────────────────────────
const TugOfWarChallenge = ({
  isOpen,
  onClose,
  onBgSubmitted,
  initialCoins = 10000,
  defaultTab   = 'create',
  playerCount  = 0,
  variant      = 'sheet',   // 'sheet' | 'modal'
}) => {
  const [activeTab,      setActiveTab]      = useState(defaultTab);
  const [prompt,         setPrompt]         = useState('');
  const [coins,          setCoins]          = useState(initialCoins);
  const [myBgs,          setMyBgs]          = useState([]);

  const [showIntro,      setShowIntro]      = useState(true);

  // phases: idle | preGenerating | generating | revealing | preview | submitted
  const [phase,          setPhase]          = useState('idle');
  // genStage: 'idle-gif' | 'crossfade' | 'zoomin' | 'flash'
  const [genStage,       setGenStage]       = useState('idle-gif');
  const [revealImgSrc,   setRevealImgSrc]   = useState(null);
  const [currentBg,      setCurrentBg]      = useState(null);
  const [tickerText,     setTickerText]     = useState('');
  const [revealProgress, setRevealProgress] = useState(0);
  const [shaking,        setShaking]        = useState(false);
  const [confetti,       setConfetti]       = useState(null);
  const [flyCoins,       setFlyCoins]       = useState(null);
  const [socialMsg,      setSocialMsg]      = useState('');
  const [placeholder,    setPlaceholder]    = useState('');

  const placeholderRef  = useRef({ idx: 0, char: 0, deleting: false, tid: null });
  const audioRef        = useRef(null);
  const arpStopRef      = useRef(null);
  const humStopRef      = useRef(null);
  const revealRef       = useRef(null);
  const videoRef        = useRef(null);
  const tickerTidsRef   = useRef([]);
  const socialTidRef    = useRef(null);

  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = createAudioContext();
    return audioRef.current;
  };

  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  // Sheet open SFX — fires on mount (isOpen is always true here since we guard above)
  useEffect(() => {
  }, []); // eslint-disable-line

  // typewriter placeholder
  useEffect(() => {
    const ref = placeholderRef.current;
    const tick = () => {
      const ex = PLACEHOLDER_EXAMPLES[ref.idx];
      if (!ref.deleting) {
        ref.char++;
        setPlaceholder(ex.slice(0, ref.char));
        if (ref.char >= ex.length) { ref.tid = setTimeout(() => { ref.deleting = true; tick(); }, 2000); return; }
        ref.tid = setTimeout(tick, 60 + Math.random() * 40);
      } else {
        ref.char--;
        setPlaceholder(ex.slice(0, ref.char));
        if (ref.char <= 0) {
          ref.deleting = false;
          ref.idx = (ref.idx + 1) % PLACEHOLDER_EXAMPLES.length;
          ref.tid = setTimeout(tick, 400); return;
        }
        ref.tid = setTimeout(tick, 30);
      }
    };
    tick();
    return () => clearTimeout(ref.tid);
  }, []);

  // social proof
  useEffect(() => {
    if (!playerCount) return;
    let i = 0;
    const cycle = () => {
      setSocialMsg(SOCIAL_MESSAGES[i % SOCIAL_MESSAGES.length]);
      i++;
      socialTidRef.current = setTimeout(cycle, 4500 + Math.random() * 3000);
    };
    socialTidRef.current = setTimeout(cycle, 2500);
    return () => clearTimeout(socialTidRef.current);
  }, [playerCount]);

  const canGenerate   = prompt.trim().length > 0 && coins >= BG_GENERATION_COST;
  const generationsLeft = Math.floor(coins / BG_GENERATION_COST);
  const tabsLocked    = phase !== 'idle';

  const spawnFlyCoins = () =>
    Array.from({ length: 8 }, (_, i) => {
      const ang = ((-200 + (i / 7) * 160) * Math.PI) / 180;
      const d = 50 + Math.random() * 35;
      return { id: i, x: Math.cos(ang)*d, y: Math.sin(ang)*d, rotate: (Math.random()-0.5)*360, delay: i*0.04 };
    });

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

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;

    // Step 1: pre-generating — animate out controls, zoom GIF, swap to active GIF
    setPhase('preGenerating');

    // Step 2: after 1500ms, start actual generation
    setTimeout(() => {
      const ctx = ensureAudio();

      const colors   = generateBgColors(prompt.trim());
      const towTheme = detectTowTheme(prompt.trim());
      const bgData  = {
        id: Date.now(),
        name: prompt.trim() || 'Battle Background',
        prompt: prompt.trim(),
        theme: towTheme,
        colors,
        submitted: false,
      };
      const imgSrc = getMockupForTheme(towTheme);
      setCurrentBg(bgData);
      setRevealImgSrc(imgSrc);
      setCoins(prev => prev - BG_GENERATION_COST);
      setFlyCoins(spawnFlyCoins());

      setShaking(true);
      setTimeout(() => setShaking(false), 500);

      playGenerationStart();

      setPhase('generating');
      setGenStage('idle-gif');   // Phase 1: idle GIF, gentle drift
      setRevealProgress(0);

      tickerTidsRef.current.forEach(clearTimeout);
      tickerTidsRef.current = TICKER_SEQUENCE.map(({ ms, text }) =>
        setTimeout(() => setTickerText(text), ms)
      );

      // t=+10s: crossfade active GIF over idle
      setTimeout(() => setGenStage('crossfade'), 10000);

      // t=+12.5s: zoom in hard
      setTimeout(() => setGenStage('zoomin'), 12500);

      // t=+14.5s: purple flash
      setTimeout(() => {
        setGenStage('flash');
        playGenerationDone();
      }, 14500);

      // t=+14.85s: revealing phase — MysteryReveal takes over full screen
      setTimeout(() => {
        setPhase('revealing');
        setGenStage('idle-gif'); // reset genStage
      }, 14850);
    }, 1500);
  }, [canGenerate, prompt]); // eslint-disable-line


  const handleClose = useCallback(() => {
    if (arpStopRef.current) { arpStopRef.current(); arpStopRef.current = null; }
    if (onClose) onClose();
  }, [onClose]);

  const handleSubmit = useCallback((bgToSubmit = null) => {
    const bg = bgToSubmit || currentBg;
    if (!bg) return;
    const ctx = ensureAudio();

    const submitted = { ...bg, submitted: true };
    if (bgToSubmit) {
      setMyBgs(prev => prev.map(b => b.id === bgToSubmit.id ? submitted : b));
    } else {
      setMyBgs(prev => [submitted, ...prev]);
      setConfetti(makeConfetti(50));
      setPhase('submitted');
    }
    if (onBgSubmitted) onBgSubmitted(submitted);
    if (bgToSubmit) handleClose();
  }, [currentBg, onBgSubmitted, handleClose]); // eslint-disable-line

  const handleReset = useCallback(() => {
    setPhase('idle');
    setCurrentBg(null);
    setRevealImgSrc(null);
    setGenStage('idle-gif');
    setPrompt('');
    setTickerText('');
    setRevealProgress(0);
    setConfetti(null);
    setCoins(prev => Math.min(prev + COINS_PER_ROUND, initialCoins));
  }, [initialCoins]);

  if (!isOpen) return null;

  // ── shared inner content (same for both variants) ──────────────────────────
  const sharedInner = (
    <>
      {/* confetti */}
      <AnimatePresence>
        {confetti && (
          <div className="tow-confetti-layer">
            {confetti.map(p => <ConfettiParticle key={p.id} {...p} />)}
          </div>
        )}
      </AnimatePresence>

      {/* animated bg */}
      <motion.div className="tow-sheet-bg"
        animate={
          phase === 'generating'
            ? { scale:1.08, filter:'brightness(1.4) saturate(1.3)' }
            : phase === 'submitted'
            ? { scale:1.04, filter:'brightness(1.15)' }
            : { scale:1.0,  filter:'brightness(1)' }
        }
        transition={{ duration:1.2, ease:'easeInOut' }}
      >
        <div className="tow-sheet-bg__left" />
        <div className="tow-sheet-bg__right" />
        <div className="tow-sheet-bg__rope" />
      </motion.div>

      {/* flicker during generation */}
      <AnimatePresence>
        {phase === 'generating' && (
          <motion.div className="tow-flicker"
            initial={{ opacity:0 }} animate={{ opacity:[0,0.45,0,0.3,0] }}
            exit={{ opacity:0 }} transition={{ duration:0.38, repeat:Infinity }}
          />
        )}
      </AnimatePresence>

      {/* ── header ── */}
      <div className="tow-header">
        <div className="tow-header__left">
          <div className={`tow-tabs ${tabsLocked ? 'tow-tabs--locked' : ''}`}>
            {['mybgs'].map(tab => (
              <motion.button key={tab}
                className={`tow-tab ${activeTab===tab?'active':''} ${tabsLocked?'tow-tab--locked':''}`}
                onClick={() => !tabsLocked && setActiveTab(tab)}
                whileHover={!tabsLocked ? { scale:1.05 } : {}} whileTap={!tabsLocked ? { scale:0.95 } : {}}
                transition={springTransition}
                title={tabsLocked ? 'Wait for generation to finish' : undefined}
              >
                {tab === 'create' ? 'CREATE' : 'MY DESIGNS'}
                {tab === 'create' && phase === 'generating' && (
                  <span className="tow-tab__dot" />
                )}
                {tab === 'mybgs' && myBgs.length > 0 && (
                  <span className="tow-tab-badge">{myBgs.length}</span>
                )}
              </motion.button>
            ))}
          </div>
          {phase === 'generating' && (
            <motion.span
              className="tow-tabs-locked-hint"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ duration:0.3, delay:0.5 }}
            >generating…</motion.span>
          )}
        </div>
        <div className="tow-header__right">
          <div className="tow-coins">
            <img src={CoinIcon} alt="" className="tow-coins__icon" />
            <motion.span className="tow-coins__value" key={coins}
              animate={{ scale:[1.3,1] }} transition={{ duration:0.25 }}
            >{coins.toLocaleString()}</motion.span>
            <AnimatePresence>
              {flyCoins && flyCoins.map((coin,i) => (
                <motion.img src={CoinIcon} alt="" className="tow-coins__fly" key={`fly-${coin.id}`}
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

      {/* ── social feed ── */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && socialMsg && (
          <motion.div key={socialMsg} className="tow-social-feed"
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-6 }} transition={{ duration:0.35 }}
          >
            <span className="tow-social-feed__dot" />
            <span className="tow-social-feed__text">{socialMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── body ── */}
      <div className="tow-body">
        {/* Generation overlay */}
        <AnimatePresence>
          {(phase === 'generating' || phase === 'preGenerating') && (
            <motion.div key="gen-overlay" className="tow-gen-stage"
              initial={{ opacity:0 }}
              animate={{ opacity: phase === 'preGenerating' ? 0 : 1 }}
              exit={{ opacity:0 }}
              transition={{ duration:0.6, ease:'easeInOut' }}
            >
              {/* Layer 1: Idle GIF — gentle drift for first 10s */}
              <motion.div
                className="tow-gen-stage__video-wrap"
                initial={{ scale:1.0 }}
                animate={{
                  scale: genStage === 'zoomin' || genStage === 'flash' ? 1.4 : 1.05
                }}
                transition={
                  genStage === 'zoomin' ? { duration:2.0, ease:'easeIn' }
                  : { duration:10.0, ease:'linear' }
                }
              >
                <img src={TowGif} alt="Generating" className="tow-gen-stage__video" />
              </motion.div>

              {/* Layer 2: Active GIF — crossfades in at 10s, zooms with Layer 1 */}
              <motion.div
                className="tow-gen-stage__video-wrap"
                initial={{ opacity:0, scale:1.0 }}
                animate={{
                  opacity: genStage === 'crossfade' || genStage === 'zoomin' || genStage === 'flash' ? 1 : 0,
                  scale:   genStage === 'zoomin' || genStage === 'flash' ? 1.4 : 1.0,
                }}
                transition={
                  genStage === 'crossfade' ? { duration:1.5, ease:'easeInOut' }
                  : genStage === 'zoomin'  ? { duration:2.0, ease:'easeIn' }
                  : { duration:0.3 }
                }
              >
                <img src={TowGifActive} alt="Active" className="tow-gen-stage__video" />
              </motion.div>

              {/* Purple flash */}
              <motion.div
                className="tow-gen-stage__flash"
                initial={{ opacity:0 }}
                animate={{ opacity: genStage === 'flash' ? 1 : 0 }}
                transition={{ duration: genStage === 'flash' ? 0.2 : 0.4 }}
              />

              {/* Ticker */}
              {tickerText && genStage !== 'flash' && (
                <motion.div className="tow-gen-stage__ticker"
                  key={tickerText}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-6 }} transition={{ duration:0.25 }}
                >
                  {tickerText}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ════ CREATE ════ */}
          {(activeTab === 'create' || activeTab !== 'mybgs') && (
            <motion.div key="create" className="tow-create"
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:20 }} transition={{ duration:0.25 }}
            >
              <div className="tow-title-block">
                <motion.span className="tow-title__text"
                  key={phase}
                  initial={{ opacity:0, y:6 }}
                  animate={{ opacity: phase === 'preGenerating' ? 0 : 1, y:0 }}
                  transition={{ duration:0.25 }}
                >
                  {(phase === 'idle' || phase === 'preGenerating') && 'Describe the world you want to create'}
                  {phase === 'generating' && 'Painting your battlefield…'}
                  {phase === 'preview'    && '⚔️ Battlefield ready!'}
                  {phase === 'submitted'  && '🏆 Battlefield submitted!'}
                </motion.span>
              </div>

              <div className="tow-phase-content">
                <div className="tow-upper-region">
                  <AnimatePresence mode="wait">

                    {(phase === 'idle' || phase === 'preGenerating') && (
                      <motion.div key="idle" className="tow-idle"
                        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        transition={{ duration:0.3 }}
                      >
                        {/* GIF — zooms up and swaps to active version during preGenerating */}
                        <motion.div
                          className="tow-sheet-gif-wrap"
                          animate={phase === 'preGenerating'
                            ? { scale:1.15, y:-16 }
                            : { scale:1,    y:0 }}
                          transition={{ duration:0.8, ease:'easeInOut' }}
                        >
                          <img
                            src={phase === 'preGenerating' ? TowGifActive : TowGif}
                            alt="Tug of War gameplay"
                            className="tow-sheet-gif"
                          />
                        </motion.div>

                        {/* Input + chips — fade out during preGenerating */}
                        <AnimatePresence>
                          {phase === 'idle' && (
                            <motion.div key="controls"
                              exit={{ opacity:0, y:10 }}
                              transition={{ duration:0.25 }}
                            >
                              <div className="tow-input-wrap">
                                <textarea
                                  id="tow-prompt"
                                  className="tow-input"
                                  placeholder={placeholder}
                                  value={prompt}
                                  onChange={handlePromptChange}
                                  rows={3}
                                />
                                {!prompt && <span className="tow-input-cursor" />}
                                <span className="tow-input-wc">{prompt.length}/{MAX_CHARS}</span>
                              </div>
                              <div className="tow-suggestions">
                                <span className="tow-suggestions__label">Or pick a quick idea:</span>
                                <div className="tow-suggestions__list">
                                  {BG_SUGGESTIONS.map((text, i) => (
                                    <motion.button key={i} className="tow-pill"
                                      onClick={() => handleSuggestionClick(text)}
                                      whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.96 }}
                                      transition={springTransition}
                                    >{text}</motion.button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {phase === 'preview' && currentBg && (
                      <motion.div key="preview" className="tow-preview-area"
                        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                        exit={{ opacity:0 }}
                        transition={{ type:'spring', stiffness:280, damping:20 }}
                      >
                        <div className="tow-bg-preview">
                          <motion.img
                            src={getMockupForTheme(currentBg.theme)}
                            alt={currentBg.name}
                            className="tow-mockup-img tow-mockup-img--preview"
                            initial={{ filter:'blur(4px)' }}
                            animate={{ filter:'blur(0px)' }}
                            transition={{ duration:0.5 }}
                          />
                          <div className="tow-bg-preview__label">
                            <span className="tow-bg-preview__name">{currentBg.name}</span>
                            <span className="tow-bg-preview__theme">{currentBg.theme.toUpperCase()}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {phase === 'submitted' && currentBg && (
                      <motion.div key="submitted" className="tow-submitted-area"
                        initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                        exit={{ opacity:0 }} transition={{ duration:0.4 }}
                      >
                        <motion.div className="tow-submitted-check"
                          initial={{ scale:0 }} animate={{ scale:1 }}
                          transition={{ type:'spring', stiffness:400, damping:15, delay:0.1 }}
                        >✓</motion.div>
                        <p className="tow-submitted-message">"{currentBg.name}" is in the battle queue!</p>
                        {playerCount > 0 && (
                          <p className="tow-submitted-context">
                            {playerCount} players are waiting to see which battlefield gets chosen.
                          </p>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                <div className="tow-lower-region">
                  <AnimatePresence mode="wait">

                    {phase === 'idle' && (
                      <motion.div key="idle-btns"
                        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        transition={{ duration:0.25 }}
                      >
                        <div className="tow-idle-bottom-row">
                          {/* Row 1: input + CREATE button */}
                          <div className="tow-input-row">
                            <div className="tow-input-wrap">
                              <textarea
                                id="tow-prompt-modal"
                                className="tow-input"
                                placeholder={placeholder}
                                value={prompt}
                                onChange={handlePromptChange}
                                rows={2}
                              />
                              {!prompt && <span className="tow-input-cursor" />}
                              <span className="tow-input-wc">{prompt.length}/{MAX_CHARS}</span>
                            </div>
                            <div className="tow-actions">
                              <motion.button
                                className={`tow-btn-primary ${canGenerate ? '' : 'disabled'}`}
                                onClick={() => canGenerate && handleGenerate()}
                                disabled={!canGenerate}
                                whileHover={canGenerate ? { scale:1.02 } : {}}
                                whileTap={canGenerate  ? { scale:0.97 } : {}}
                                transition={springTransition}
                              >
                                <span className="tow-btn-primary__text">CREATE</span>
                                <span className="tow-btn-primary__cost">
                                  <img src={CoinIcon} alt="" className="tow-btn-primary__coin" />
                                  <span>{BG_GENERATION_COST.toLocaleString()}</span>
                                </span>
                              </motion.button>
                              <span className="tow-coins-disclaimer">Coins once used cannot be refunded.</span>
                            </div>
                          </div>
                          {/* Row 2: chips below */}
                          <div className="tow-suggestions">
                            <span className="tow-suggestions__label">Or pick a quick idea:</span>
                            <div className="tow-suggestions__list">
                              {BG_SUGGESTIONS.map((text, i) => (
                                <motion.button key={i} className="tow-pill"
                                  onClick={() => handleSuggestionClick(text)}
                                  whileHover={{ scale:1.04, y:-1 }} whileTap={{ scale:0.96 }}
                                  transition={springTransition}
                                >{text}</motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {phase === 'generating' && (
                      <motion.div key="ticker" className="tow-ticker"
                        initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                        exit={{ opacity:0 }} transition={{ duration:0.3 }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.span key={tickerText} className="tow-ticker__message"
                            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                            exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}
                          >{tickerText}</motion.span>
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {phase === 'preview' && (
                      <motion.div key="preview-btns" className="tow-actions"
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                        exit={{ opacity:0 }} transition={{ duration:0.3 }}
                      >
                        <motion.button className="tow-btn-primary"
                          onClick={() => handleSubmit()}
                          whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                          transition={springTransition}
                        >ENTER THE BATTLE</motion.button>
                        <motion.button className="tow-reset-link"
                          onClick={handleReset} whileHover={{ opacity:1 }}
                        >↩ Try a different scene — this replaces your current design</motion.button>
                      </motion.div>
                    )}

                    {phase === 'submitted' && (
                      <motion.div key="submitted-btns" className="tow-actions"
                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                        exit={{ opacity:0 }} transition={{ duration:0.35 }}
                      >
                        <motion.button className="tow-btn-primary"
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

          {/* ════ MY DESIGNS ════ */}
          {activeTab === 'mybgs' && (
            <motion.div key="mybgs" className="tow-mybgs"
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}
            >
              {myBgs.length === 0 ? (
                <div className="tow-mybgs-empty">
                  <p className="tow-mybgs-empty__title">NO DESIGNS YET</p>
                  <span className="tow-mybgs-empty__hint">Paint your first battlefield!</span>
                  <div className="tow-mybgs-placeholders">
                    {[1,2,3].map(i => (
                      <div key={i} className="tow-bg-card tow-bg-card--placeholder">
                        <div className="tow-bg-card__grid tow-bg-card__grid--placeholder">
                          {Array.from({length:16}).map((_,j) => <div key={j} />)}
                        </div>
                        <div className="tow-bg-card__info">
                          <span className="tow-bg-card__name tow-bg-card__name--placeholder" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <motion.button className="tow-btn-primary tow-mybgs-empty__cta"
                    onClick={() => setActiveTab('create')}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    transition={springTransition}
                  >PAINT YOUR FIRST BATTLEFIELD</motion.button>
                </div>
              ) : (
                <>
                  <div className="tow-mybgs-list">
                    {myBgs.map(bg => (
                      <motion.div key={bg.id}
                        className={`tow-bg-card ${bg.submitted?'submitted':''}`}
                        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                        whileHover={{ scale:1.01 }} transition={springTransition}
                      >
                        <div className="tow-bg-card__grid">
                          {(bg.colors||[]).slice(0,16).map((c,i) => (
                            <div key={i} style={{ backgroundColor:c }} />
                          ))}
                        </div>
                        <div className="tow-bg-card__info">
                          <span className="tow-bg-card__name">{bg.name}</span>
                          <span className="tow-bg-card__theme">{bg.theme}</span>
                          {bg.submitted && <span className="tow-bg-card__status">✓ SUBMITTED</span>}
                        </div>
                        <motion.button
                          className={`tow-bg-card__submit ${bg.submitted?'resubmit':''}`}
                          onClick={() => handleSubmit(bg)}
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        >{bg.submitted ? 'RE-SUBMIT' : 'SUBMIT'}</motion.button>
                      </motion.div>
                    ))}
                  </div>
                  <div className="tow-mybgs-footer">
                    <span>{myBgs.length} DESIGN{myBgs.length!==1?'S':''}</span>
                    <span>{myBgs.filter(b=>b.submitted).length} SUBMITTED</span>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );

  // ── MYSTERY REVEAL — outside all sheets, z-index 9000 ─────────────────────
  const mysteryRevealEl = (
    <AnimatePresence>
      {phase === 'revealing' && revealImgSrc && (
        <MysteryReveal
          key="mystery-reveal"
          src={revealImgSrc}
          variant={variant}
          onDone={() => setPhase('preview')}
        />
      )}
    </AnimatePresence>
  );

  // ── SHEET VARIANT ──────────────────────────────────────────────────────────
  if (variant !== 'modal') {
    return (
      <>
        {mysteryRevealEl}
        <motion.div className="tow-scrim"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.3 }} onClick={handleClose}
        />
        <motion.button className="tow-close"
          onClick={handleClose}
          initial={{ x:'-100%', opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:'-100%', opacity:0 }}
          transition={sheetSpring} whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
        >✕</motion.button>
        <motion.div className="tow-sheet"
          animate={shaking ? { x:[0,-6,6,-4,4,-2,2,0] } : { x:0 }}
          transition={shaking ? { duration:0.45 } : sheetSpring}
          initial={{ x:'-100%' }} exit={{ x:'-100%' }}
        >
          <AnimatePresence>
            {showIntro && <WelcomeIntro onDone={() => setShowIntro(false)} />}
          </AnimatePresence>
          {sharedInner}
        </motion.div>
      </>
    );
  }

  // ── MODAL VARIANT ──────────────────────────────────────────────────────────
  return (
    <>
      {mysteryRevealEl}
      <motion.div className="tow-modal-overlay"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.2 }}
        onClick={handleClose}
      >
        <motion.div className="tow-modal"
          onClick={e => e.stopPropagation()}
          animate={shaking ? { x:[0,-6,6,-4,4,-2,2,0] } : { scale:1, opacity:1 }}
          initial={{ scale:0.95, opacity:0 }}
          exit={{ scale:0.95, opacity:0 }}
          transition={shaking ? { duration:0.45 } : { duration:0.2, ease:'easeOut' }}
        >
          <AnimatePresence>
            {showIntro && <WelcomeIntro onDone={() => setShowIntro(false)} />}
          </AnimatePresence>
          {/* Close button inside modal top-right */}
          <motion.button className="tow-close tow-close--modal"
            onClick={handleClose}
            whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
          >✕</motion.button>
          {sharedInner}
        </motion.div>
      </motion.div>
    </>
  );
};

export default TugOfWarChallenge;
