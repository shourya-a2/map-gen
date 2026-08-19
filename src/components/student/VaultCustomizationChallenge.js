import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import './VaultCustomizationChallenge.css';

import CoinIcon from '../../assets/coin-icon.svg';
import VaultReveal   from '../../assets/vault-reveal.png';
import DeviceFrame  from '../../assets/device.png';
import { readVaultStorage, writeVaultStorage, VAULT_STORAGE_KEYS } from '../../utils/vaultStorage';

const MAX_CHARS = 60;
const SKIN_GENERATION_COST = 10000;
const COINS_PER_ROUND = 5000;

const GRID_COLS = 8;
const GRID_ROWS = 8;
const GRID_CELLS = GRID_COLS * GRID_ROWS;

// Scene palettes — same grid colour system as TugOfWarChallenge
const SCENES = {
  pirate: {
    sky:    ['#5bb8f5','#7ec8e3','#a8dff0'],
    far:    ['#2d8a4e','#3a9e5f','#1a5c32'],
    mid:    ['#c8955a','#d4a76a','#b07840'],
    near:   ['#8b6914','#a07830','#6b4f10'],
    ground: ['#d4a76a','#c09050','#b8803a'],
    accent: ['#1a6e9f','#e8c040'],
  },
  castle: {
    sky:    ['#2d1b69','#3d2880','#1a0f45'],
    far:    ['#4a3580','#5a4090','#382870'],
    mid:    ['#6b5a9a','#7a6ab0','#5a4888'],
    near:   ['#2a2040','#3a3055','#1a1530'],
    ground: ['#3d3060','#4a3870','#2d2250'],
    accent: ['#00e5ff','#7fff00'],
  },
  volcano: {
    sky:    ['#7f1d1d','#991b1b','#450a0a'],
    far:    ['#292524','#3c3533','#1c1a19'],
    mid:    ['#dc2626','#ea580c','#b91c1c'],
    near:   ['#1c1917','#292524','#111110'],
    ground: ['#dc2626','#f97316','#b45309'],
    accent: ['#fbbf24','#f97316'],
  },
  arctic: {
    sky:    ['#bfdbfe','#dbeafe','#93c5fd'],
    far:    ['#e0f2fe','#f0f9ff','#bae6fd'],
    mid:    ['#7dd3fc','#38bdf8','#0ea5e9'],
    near:   ['#e2e8f0','#f1f5f9','#cbd5e1'],
    ground: ['#f8fafc','#e2e8f0','#cbd5e1'],
    accent: ['#06b6d4','#a5f3fc'],
  },
  jungle: {
    sky:    ['#166534','#15803d','#14532d'],
    far:    ['#365314','#4d7c0f','#3f6212'],
    mid:    ['#84cc16','#65a30d','#a3e635'],
    near:   ['#713f12','#92400e','#57330a'],
    ground: ['#78350f','#92400e','#6b2d0a'],
    accent: ['#facc15','#f97316'],
  },
  default: {
    sky:    ['#1e1a4f','#2d1b69','#1a0f45'],
    far:    ['#3d2880','#4c35a0','#2a1e60'],
    mid:    ['#7c3aed','#6d28d9','#5b21b6'],
    near:   ['#2d1b69','#3d2880','#1e1050'],
    ground: ['#4c1d95','#5b21b6','#3b1275'],
    accent: ['#f59e0b','#a78bfa'],
  },
};

const detectVaultTheme = (text) => {
  const t = text.toLowerCase();
  if (t.includes('pirate') || t.includes('beach') || t.includes('treasure') || t.includes('island') || t.includes('ship')) return 'pirate';
  if (t.includes('castle') || t.includes('wizard') || t.includes('magic') || t.includes('potion') || t.includes('spell') || t.includes('dungeon')) return 'castle';
  if (t.includes('volcano') || t.includes('lava') || t.includes('fire'))  return 'volcano';
  if (t.includes('arctic') || t.includes('snow') || t.includes('ice') || t.includes('frozen')) return 'arctic';
  if (t.includes('jungle') || t.includes('forest') || t.includes('canopy') || t.includes('temple')) return 'jungle';
  if (t.includes('cyber') || t.includes('neon') || t.includes('space') || t.includes('tech') || t.includes('station') || t.includes('robot')) return 'default';
  return 'default';
};

const generateSkinColors = (promptText) => {
  const theme = detectVaultTheme(promptText);
  const scene = SCENES[theme];
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const row  = Math.floor(i / GRID_COLS);
    const col  = i % GRID_COLS;
    const seed = (col * 3 + row) % 3;
    if (row <= 1) return scene.sky[seed];
    if (row === 2) return scene.far[seed];
    if (row === 3) return scene.mid[seed];
    if (row === 4) return scene.near[seed];
    if (row === 5) return col % 2 === 0 ? scene.accent[0] : scene.mid[seed];
    return scene.ground[seed];
  });
};

const getMockupForTheme = (_theme) => VaultReveal;

// Generation ticker messages
const TICKER_SEQUENCE = [
  { ms: 0,    text: 'Preparing your vault preview...' },
  { ms: 1800, text: 'Matching your prompt to a theme...' },
  { ms: 3600, text: 'Building the vault preview...' },
  { ms: 5600, text: 'Adding the finishing touches...' },
  { ms: 7600, text: 'Rendering the final details...' },
  { ms: 9200, text: 'Almost ready...' },
  { ms: 10000, text: '' },
];

const GENERATION_DURATION_MS = 10000;

const LOADER_CODE_LINES = [
  '> reading vault prompt...',
  '> scanning theme patterns...',
  '> mapping visual layers...',
  '> compiling vault geometry...',
  '> encrypting vault signature...',
  '> rendering final surface...',
  '> validating vault build...',
];

const SKIN_SUGGESTIONS = [
  'spider vault',
  'superman',
];

const PLACEHOLDER_EXAMPLES = [
  'interspace galaxy with aliens',
  'underground lava fortress',
  'icy tundra bunker',
  'haunted castle vault',
  'neon cyber stronghold',
];

const springTransition = { type: 'spring', stiffness: 400, damping: 17 };
const sheetSpring      = { type: 'spring', damping: 22, stiffness: 170, mass: 0.8 };

const useViewportSheetScale = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(1, window.innerWidth / 440, window.innerHeight / 720));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return scale;
};

// ─── audio (same approach as TugOfWarChallenge — soft, classroom-safe) ─────────
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

const playIntroWelcome = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  chime(ctx, 523, 0, 0.2, 0.04);
};

const playIntroBoom = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  chime(ctx, 392, 0,    0.25, 0.04);
  chime(ctx, 523, 0.12, 0.25, 0.04);
};

const playChipTap = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  chime(ctx, 880, 0, 0.08, 0.03);
};

const playGenerationStart = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  try {
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

const playGenerationDone = () => {
  const ctx = getSharedCtx(); if (!ctx) return;
  try {
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

const playApplyFanfare = (ctx) => {
  if (!ctx) return;
  [[330,0],[440,0.1],[523,0.2],[659,0.32],[880,0.45]].forEach(([f,d]) =>
    tone(ctx, f, d, 0.7, 'triangle', 0.11)
  );
  tone(ctx, 110, 0, 0.2, 'sawtooth', 0.10);
};

const playRevealFanfare = (ctx) => {
  if (!ctx) return;
  tone(ctx, 110,    0,    0.5, 'sawtooth', 0.18);
  tone(ctx, 165,    0,    0.4, 'sawtooth', 0.10);
  [[220,0.1],[277,0.2],[330,0.3],[440,0.42]].forEach(([f,d]) =>
    tone(ctx, f, d, 1.0, 'triangle', 0.09)
  );
};

// ─── confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#7c3aed','#a78bfa','#f59e0b','#fbbf24','#fff','#22d3ee'];
const makeConfetti = (n = 40) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: 5 + (i / n) * 90,
    rotate: -360 + i * 18,
    delay: (i / n) * 0.5,
  }));

const ConfettiParticle = ({ color, x, rotate, delay }) => (
  <motion.div className="vc-confetti"
    style={{ background: color, left: `${x}%` }}
    initial={{ y: 0, opacity: 1, rotate: 0 }}
    animate={{ y: 320, opacity: 0, rotate }}
    transition={{ duration: 1.4 + Math.random() * 0.6, delay, ease: 'easeIn' }}
  />
);

// ─── matrix rain (cyan digital rain backdrop for the welcome intro) ───────────
const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテト01アイウエオ01ｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾂﾃﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';

const MatrixRain = ({ scope }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const fontSize = 16;
    let width = 0, height = 0, columns = 0, drops = [];

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      width  = canvas.width  = rect.width;
      height = canvas.height = rect.height;
      columns = Math.max(1, Math.floor(width / fontSize));
      drops = Array.from({ length: columns }, () => Math.random() * -40);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);

    const draw = () => {
      if (!width || !height) return;
      ctx.fillStyle = 'rgba(5, 3, 15, 0.16)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillStyle = '#e4fbff';
        ctx.fillText(char, x, y);
        ctx.fillStyle = 'rgba(122,223,227,0.55)';
        ctx.fillText(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)], x, y - fontSize);
        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
    };
    const intervalId = setInterval(draw, 45);

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={`vc-matrix-rain vc-matrix-rain--${scope}`} />;
};

// ─── welcome intro ────────────────────────────────────────────────────────────
const WelcomeIntro = ({ onDone, scope = 'viewport' }) => {
  const [stage, setStage] = useState(0);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    const t1 = setTimeout(() => { setStage(1); playIntroWelcome(); }, 150);
    const t2 = setTimeout(() => { setStage(2); playIntroBoom();    }, 480);
    const t3 = setTimeout(() => setStage(3), 580);
    const t4 = setTimeout(() => setStage(4), 720);
    const t5 = setTimeout(() => setStage(5), 2100);
    const t6 = setTimeout(() => onDoneRef.current(), 2700);
    return () => [t1,t2,t3,t4,t5,t6].forEach(clearTimeout);
  }, []); // eslint-disable-line

  return (
    <motion.div
      className={`vc-welcome-intro vc-welcome-intro--${scope}`}
      animate={stage >= 5
        ? scope === 'sheet'
          ? { opacity: 0, scale: 0.58, x: 0, y: '18vh' }
          : { opacity: 0, scale: 0.34, x: '-2vw', y: '18vh' }
        : { opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      <MatrixRain scope={scope} />
      <motion.div
        className="vc-welcome-intro__flash"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 3 ? 1 : 0 }}
        transition={{ duration: 0.12 }}
      />
      <motion.p
        className="vc-welcome-intro__sub"
        initial={{ opacity: 0, y: -50 }}
        animate={stage >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
        transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
      >
        WELCOME TO
      </motion.p>
      <motion.h2
        className="vc-welcome-intro__title"
        initial={{ opacity: 0, y: 70, scale: 1.15 }}
        animate={stage >= 2
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 70, scale: 1.15 }}
        transition={{ duration: 0.18, ease: [0.0, 0.0, 0.2, 1] }}
      >
        VAULT FORGER<br/>STUDIO
      </motion.h2>
      <motion.div
        className="vc-welcome-intro__strike"
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
  color: ['#f59e0b','#a78bfa','#22d3ee','#fbbf24','#ffffff'][i % 5],
  delay: i * 0.03,
}));

const MysteryReveal = ({ src, variant, onDone }) => {
  const controls  = useAnimation();
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    const run = async () => {
      const startX = variant === 'sheet' ? '-42vw' : '0vw';
      const startY = variant === 'sheet' ? '0vh'   : '20vh';
      await controls.set({ x: startX, y: startY, scale: 0.2, opacity: 0 });
      await controls.start({
        x: 0, y: 0, scale: 1, opacity: 1,
        transition: { type: 'spring', stiffness: 260, damping: 20 },
      });
      await new Promise(r => setTimeout(r, 4000));
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
      className="vc-mystery-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="vc-mystery-stage">
        <img src={require('../../assets/Rays_Thumbnail.png')} alt="" className="vc-mystery-rays" />
        <motion.img
          src={src}
          alt="Your vault skin"
          className="vc-mystery-image"
          animate={controls}
        />
        {REVEAL_PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="vc-mystery-particle"
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
const VaultCustomizationChallenge = ({
  isOpen,
  onClose,
  onVaultApplied,
  initialCoins = 10000,
  defaultTab   = 'create',
  variant      = 'sheet',
}) => {
  const [activeTab,        setActiveTab]        = useState(defaultTab);
  const [prompt,           setPrompt]           = useState('');
  const [coins,            setCoins]            = useState(() => {
    const storedCoins = readVaultStorage(VAULT_STORAGE_KEYS.coins, initialCoins);
    return storedCoins >= SKIN_GENERATION_COST ? storedCoins : initialCoins;
  });
  const [mySkins,          setMySkins]          = useState(() => readVaultStorage(VAULT_STORAGE_KEYS.vaults, []));

  const [showIntro,        setShowIntro]        = useState(true);

  // phases: idle | preGenerating | generating | revealing | preview | applied | error
  const [phase,            setPhase]            = useState('idle');
  // genStage: 'idle-gif' | 'crossfade' | 'zoomin' | 'flash'
  const [genStage,         setGenStage]         = useState('idle-gif');
  const [revealImgSrc,     setRevealImgSrc]     = useState(null);
  const [currentSkin,      setCurrentSkin]      = useState(null);
  const [tickerText,       setTickerText]       = useState('');
  const [revealProgress,   setRevealProgress]   = useState(0);
  const [shaking,          setShaking]          = useState(false);
  const [confetti,         setConfetti]         = useState(null);
  const [flyCoins,         setFlyCoins]         = useState(null);
  const [placeholder,      setPlaceholder]      = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [loaderLineIndex, setLoaderLineIndex] = useState(0);
  const [generationError, setGenerationError] = useState('');
  const [coinNotice,        setCoinNotice]        = useState(null);
  const sheetScale = useViewportSheetScale();

  const placeholderRef = useRef({ idx: 0, char: 0, deleting: false, tid: null });
  const audioRef       = useRef(null);
  const tickerTidsRef  = useRef([]);
  const generationTidsRef = useRef([]);
  const chargedRef = useRef(false);
  const demoMode = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('demo') === '1';
  const demoState = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('state')
    : null;

  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = createAudioContext();
    return audioRef.current;
  };

  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  useEffect(() => {
    if (demoMode && demoState === 'error') {
      setGenerationError('The preview service timed out. Your coins were returned.');
      setPhase('error');
    }
  }, [demoMode, demoState]);

  useEffect(() => {
    writeVaultStorage(VAULT_STORAGE_KEYS.coins, coins);
  }, [coins]);

  useEffect(() => {
    writeVaultStorage(VAULT_STORAGE_KEYS.vaults, mySkins);
  }, [mySkins]);

  useEffect(() => {
    if (phase !== 'generating') {
      setGenerationProgress(0);
      return undefined;
    }

    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setGenerationProgress(Math.min(100, Math.round((elapsed / GENERATION_DURATION_MS) * 100)));
    }, 100);

    return () => clearInterval(intervalId);
  }, [phase]);

  useEffect(() => () => {
    generationTidsRef.current.forEach(clearTimeout);
    tickerTidsRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase !== 'generating') {
      setLoaderLineIndex(0);
      return undefined;
    }

    const intervalId = setInterval(() => {
      setLoaderLineIndex(index => (index + 1) % LOADER_CODE_LINES.length);
    }, 900);

    return () => clearInterval(intervalId);
  }, [phase]);

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

  const canGenerate     = prompt.trim().length > 0 && coins >= SKIN_GENERATION_COST;
  const tabsLocked      = phase === 'preGenerating' || phase === 'generating' || phase === 'revealing';

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
    playChipTap();
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

    generationTidsRef.current.forEach(clearTimeout);
    generationTidsRef.current = [];
    tickerTidsRef.current.forEach(clearTimeout);
    tickerTidsRef.current = [];
    setGenerationError('');
    setCoins(prev => prev - SKIN_GENERATION_COST);
    chargedRef.current = true;
    setCoinNotice({ id: Date.now(), amount: `−${SKIN_GENERATION_COST.toLocaleString()} COINS` });
    setFlyCoins(spawnFlyCoins());
    setPhase('preGenerating');

    const startTimer = setTimeout(() => {
      const colors    = generateSkinColors(prompt.trim());
      const theme     = detectVaultTheme(prompt.trim());
      const skinData  = {
        id: Date.now(),
        name: prompt.trim() || 'Custom Vault',
        prompt: prompt.trim(),
        theme,
        colors,
        applied: false,
      };
      setCurrentSkin(skinData);
      setRevealImgSrc(VaultReveal);

      setShaking(true);
      generationTidsRef.current.push(setTimeout(() => setShaking(false), 500));

      playGenerationStart();

      setPhase('generating');
      setGenStage('idle-gif');
      setRevealProgress(0);
      setGenerationProgress(0);

      tickerTidsRef.current.forEach(clearTimeout);
      tickerTidsRef.current = TICKER_SEQUENCE.map(({ ms, text }) =>
        setTimeout(() => setTickerText(text), ms)
      );

      generationTidsRef.current.push(setTimeout(() => setGenStage('crossfade'), 6800));
      generationTidsRef.current.push(setTimeout(() => setGenStage('zoomin'),    8200));
      generationTidsRef.current.push(setTimeout(() => {
        setGenStage('flash');
        playGenerationDone();
      }, 9400));
      generationTidsRef.current.push(setTimeout(() => {
        setPhase('revealing');
        setGenStage('idle-gif');
      }, GENERATION_DURATION_MS));
    }, 800);
    generationTidsRef.current.push(startTimer);
  }, [canGenerate, prompt]); // eslint-disable-line

  const handleGenerationError = useCallback((message = 'We couldn’t finish building this vault.') => {
    generationTidsRef.current.forEach(clearTimeout);
    generationTidsRef.current = [];
    tickerTidsRef.current.forEach(clearTimeout);
    tickerTidsRef.current = [];
    if (chargedRef.current) {
      setCoins(prev => Math.min(initialCoins, prev + SKIN_GENERATION_COST));
      chargedRef.current = false;
    }
    setGenerationError(message);
    setPhase('error');
    setGenerationProgress(0);
    setTickerText('');
  }, [initialCoins]);

  const handleRetryGeneration = useCallback(() => {
    setGenerationError('');
    setPhase('idle');
  }, []);

  const handleCancelGeneration = useCallback(() => {
    generationTidsRef.current.forEach(clearTimeout);
    generationTidsRef.current = [];
    tickerTidsRef.current.forEach(clearTimeout);
    tickerTidsRef.current = [];
    if (chargedRef.current) {
      setCoins(prev => Math.min(initialCoins, prev + SKIN_GENERATION_COST));
      chargedRef.current = false;
    }
    setPhase('idle');
    setCurrentSkin(null);
    setRevealImgSrc(null);
    setGenStage('idle-gif');
    setTickerText('');
    setGenerationProgress(0);
    setShaking(false);
    setGenerationError('');
  }, [initialCoins]);

  const handleClose = useCallback(() => {
    if (phase === 'preGenerating' || phase === 'generating') {
      handleCancelGeneration();
      return;
    }
    if (onClose) onClose();
  }, [onClose, phase, handleCancelGeneration]);

  // Apply skin — instant, personal. No teacher, no submission.
  const handleApply = useCallback((skinToApply = null) => {
    const skin = skinToApply || currentSkin;
    if (!skin) return;
    const ctx = ensureAudio();

    const applied = { ...skin, applied: true };

    if (skinToApply) {
      // Apply from MY SKINS tab — update in list and close sheet
      setMySkins(prev => prev.map(s => s.id === skinToApply.id ? applied : s));
      if (onVaultApplied) onVaultApplied(applied);
      handleClose();
    } else {
      // Apply from preview phase — show applied state
      setMySkins(prev => [applied, ...prev]);
      setConfetti(makeConfetti(50));
      setPhase('applied');
      playApplyFanfare(ctx);
      if (onVaultApplied) onVaultApplied(applied);
    }
  }, [currentSkin, onVaultApplied, handleClose]); // eslint-disable-line

  const handleReset = useCallback(() => {
    setPhase('idle');
    setCurrentSkin(null);
    setRevealImgSrc(null);
    setGenStage('idle-gif');
    setPrompt('');
    setTickerText('');
    setRevealProgress(0);
    setConfetti(null);
    setCoins(prev => Math.min(prev + COINS_PER_ROUND, initialCoins));
  }, [initialCoins]);

  const handleCreateAnother = useCallback(() => {
    setPhase('idle');
    setCurrentSkin(null);
    setRevealImgSrc(null);
    setGenStage('idle-gif');
    setPrompt('');
    setTickerText('');
    setRevealProgress(0);
    setConfetti(null);
    setActiveTab('create');
    setShowIntro(false);
  }, []);

  const handleResetDemoCoins = useCallback(() => {
    setCoins(initialCoins);
  }, [initialCoins]);

  if (!isOpen) return null;

  // ── Screen content — what's rendered inside the LCD ────────────────────────
  const screenContent = (
    <div className="vc-screen-content">
      {/* Generation overlay — preparing the vault preview */}
      <AnimatePresence>
        {(phase === 'generating' || phase === 'preGenerating') && (
          <motion.div key="gen-overlay" className="vc-gen-stage"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            initial={{ opacity:0 }}
            animate={{ opacity: phase === 'preGenerating' ? 0 : 1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.5, ease:'easeInOut' }}
          >
            {/* Radio tower icon + pulse rings */}
            <div className="vc-gen-transmit">
              <div className="vc-gen-transmit__rings">
                <span className="vc-gen-transmit__ring vc-gen-transmit__ring--1" />
                <span className="vc-gen-transmit__ring vc-gen-transmit__ring--2" />
                <span className="vc-gen-transmit__ring vc-gen-transmit__ring--3" />
              </div>
              <div className="vc-gen-transmit__icon">📡</div>
            </div>

            <div className="vc-code-console" aria-label="Vault build activity">
              <div className="vc-code-console__header">
                <span>VAULT_STUDIO.SYS</span>
                <span className="vc-code-console__live">LIVE</span>
              </div>
              <div className="vc-code-console__lines">
                {[0, 1, 2, 3].map(offset => {
                  const line = LOADER_CODE_LINES[(loaderLineIndex + offset) % LOADER_CODE_LINES.length];
                  return (
                    <motion.div
                      key={`${loaderLineIndex}-${offset}`}
                      className={`vc-code-console__line ${offset === 0 ? 'vc-code-console__line--active' : ''}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: offset === 0 ? 1 : 0.55, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >{line}</motion.div>
                  );
                })}
              </div>
              <div className="vc-code-console__scan" aria-hidden="true" />
            </div>

            {/* Ticker */}
            <AnimatePresence mode="wait">
              {tickerText && (
                <motion.p className="vc-gen-stage__ticker" key={tickerText}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-6 }} transition={{ duration:0.3 }}
                >{tickerText}</motion.p>
              )}
            </AnimatePresence>

            <div className="vc-generation-loader" aria-label={`Vault generation ${generationProgress}% complete`}>
              <div className="vc-generation-loader__track">
                <motion.div
                  className="vc-generation-loader__fill"
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.15, ease: 'linear' }}
                />
              </div>
              <span className="vc-generation-loader__percent">{generationProgress}%</span>
            </div>

            {/* Echo the prompt back */}
            {currentSkin && (
              <motion.div className="vc-gen-prompt-echo"
                initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
              >
                {currentSkin.prompt}
              </motion.div>
            )}

            {/* Flash on complete */}
            <motion.div className="vc-gen-stage__flash"
              initial={{ opacity:0 }}
              animate={{ opacity: genStage === 'flash' ? 1 : 0 }}
              transition={{ duration: genStage === 'flash' ? 0.2 : 0.4 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ── CREATE tab content ── */}
        {activeTab !== 'myskins' && (
          <motion.div key="create-screen" style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}
          >
            <AnimatePresence mode="wait">
              {/* title */}
              <motion.p key={phase} className="vc-screen-title"
                initial={{ opacity:0, y:4 }}
                animate={{ opacity: phase === 'preGenerating' ? 0.4 : 1, y:0 }}
                transition={{ duration:0.2 }}
              >
                {(phase === 'idle' || phase === 'preGenerating') && 'Describe your dream vault'}
                {phase === 'generating' && 'Preparing your vault preview...'}
                {phase === 'preview'    && 'Your vault is ready!'}
                {phase === 'applied'    && 'VAULT CUSTOMIZED!'}
                {phase === 'error'      && 'Vault generation paused'}
              </motion.p>
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {(phase === 'idle' || phase === 'preGenerating') && (
                <motion.div key="idle" style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, gap:10 }}
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}
                >
                  <div className="vc-input-wrap">
                    <label htmlFor="vault-prompt" className="vc-sr-only">Describe your dream vault</label>
                    <textarea
                      id="vault-prompt"
                      className="vc-input"
                      placeholder={placeholder}
                      value={prompt}
                      onChange={handlePromptChange}
                      rows={4}
                      aria-describedby="vault-prompt-help"
                    />
                    {!prompt && <span className="vc-input-cursor" />}
                    <span id="vault-prompt-help" className="vc-input-wc">{prompt.length}/{MAX_CHARS} characters</span>
                  </div>
                  <AnimatePresence>
                    {phase === 'idle' && (
                      <motion.div className="vc-suggestions"
                        exit={{ opacity:0 }} transition={{ duration:0.2 }}
                      >
                        <span className="vc-suggestions__label">or pick a quick idea:</span>
                        <div className="vc-suggestions__list">
                          {SKIN_SUGGESTIONS.map((text, i) => (
                            <motion.button key={i} className="vc-pill"
                              onClick={() => handleSuggestionClick(text)}
                              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                              transition={springTransition}
                            >{text}</motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {phase === 'generating' && (
                <motion.div key="gen" className="vc-ticker"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span key={tickerText} className="vc-ticker__message"
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-6 }} transition={{ duration:0.25 }}
                    >{tickerText}</motion.span>
                  </AnimatePresence>
                </motion.div>
              )}

              {phase === 'preview' && currentSkin && (
                <motion.div key="preview" className="vc-preview-area"
                  initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
                  exit={{ opacity:0 }} transition={{ type:'spring', stiffness:280, damping:20 }}
                >
                  <div className="vc-bg-preview">
                    <img src={getMockupForTheme(currentSkin.theme)} alt={currentSkin.name} className="vc-mockup-img" />
                    <div className="vc-bg-preview__label">
                      <span className="vc-bg-preview__name">Your dream vault is ready!</span>
                      <span className="vc-bg-preview__theme">{currentSkin.theme.toUpperCase()}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === 'applied' && currentSkin && (
                <motion.div key="applied" className="vc-applied-area"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}
                >
                  <motion.div className="vc-applied-map"
                    initial={{ scale:0.88, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    transition={{ type:'spring', stiffness:300, damping:22 }}
                  >
                    <img src={revealImgSrc || getMockupForTheme(currentSkin.theme)} alt={currentSkin.name} className="vc-applied-map__img" />
                    <div className="vc-applied-map__label">
                      <span className="vc-applied-map__name">Your custom vault</span>
                      <span className="vc-applied-map__theme">{currentSkin.theme.toUpperCase()}</span>
                    </div>
                  </motion.div>
                  <motion.div className="vc-applied-status"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3, delay:0.2 }}
                  >
                    <motion.span
                      initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                      transition={{ duration:0.25 }}
                    >✓ ACTIVE VAULT</motion.span>
                  </motion.div>
                  <motion.p className="vc-applied-body"
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3, delay:0.35 }}
                  >Your vault now looks exactly how you designed it.</motion.p>
                </motion.div>
              )}

              {phase === 'error' && (
                <motion.div key="error" className="vc-error-state"
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                >
                  <div className="vc-error-state__icon">!</div>
                  <p className="vc-error-state__title">Vault generation didn’t finish</p>
                  <p className="vc-error-state__body">{generationError || 'Your coins were returned. Try again when you’re ready.'}</p>
                  <span className="vc-error-state__refund">✓ COINS RETURNED</span>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        )}

        {/* ── MY SKINS tab content ── */}
        {activeTab === 'myskins' && (
          <motion.div key="myskins" className="vc-myskins"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}
          >
            {mySkins.length === 0 ? (
              <div className="vc-myskins-empty">
                <p className="vc-myskins-empty__title">NO VAULTS YET</p>
                <span className="vc-myskins-empty__hint">Customize your first vault!</span>
                <div className="vc-myskins-placeholders">
                  {[1,2,3].map(i => (
                    <div key={i} className="vc-skin-card vc-skin-card--placeholder">
                      <div className="vc-skin-card__grid vc-skin-card__grid--placeholder">
                        {Array.from({length:16}).map((_,j) => <div key={j} />)}
                      </div>
                      <div className="vc-skin-card__info">
                        <span className="vc-skin-card__name vc-skin-card__name--placeholder" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="vc-myskins-list">
                  {mySkins.map(skin => (
                    <motion.div key={skin.id}
                      className={`vc-skin-card ${skin.applied?'applied':''}`}
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                      whileHover={{ scale:1.01 }} transition={springTransition}
                    >
                      <div className="vc-skin-card__grid">
                        {(skin.colors||[]).slice(0,16).map((c,i) => <div key={i} style={{ backgroundColor:c }} />)}
                      </div>
                      <div className="vc-skin-card__info">
                        <span className="vc-skin-card__name">{skin.name}</span>
                        <span className="vc-skin-card__theme">{skin.theme}</span>
                        {skin.applied && <span className="vc-skin-card__status">✓ APPLIED</span>}
                      </div>
                      <motion.button
                        className={`vc-skin-card__apply ${skin.applied?'reapply':''}`}
                        onClick={() => handleApply(skin)}
                        whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      >{skin.applied ? 'RE-APPLY' : 'APPLY'}</motion.button>
                    </motion.div>
                  ))}
                </div>
                <div className="vc-myskins-footer">
                  <span>{mySkins.length} SKIN{mySkins.length!==1?'S':''}</span>
                  <span>{mySkins.filter(s=>s.applied).length} APPLIED</span>
                </div>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );

  // ── Mystery reveal overlay ─────────────────────────────────────────────────
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

  // ── Device DOM ────────────────────────────────────────────────────────────
  // device.png is the sheet background-image (bottom-anchored, 100% wide).
  // All slots are % of sheet height/width — no pixel math.
  const isTiltedDevice = variant !== 'modal';

  const hudEl = (
    <div className="vc-device-hud">
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <motion.button
          type="button"
          aria-label={tabsLocked ? 'Vaults unavailable while preview is being prepared' : 'Open My Vaults'}
          className={`vc-tab-pill ${activeTab === 'myskins' ? 'vc-tab-pill--active' : ''}`}
          onClick={() => !tabsLocked && setActiveTab(activeTab === 'myskins' ? 'create' : 'myskins')}
          whileHover={!tabsLocked ? { scale:1.04 } : {}} whileTap={!tabsLocked ? { scale:0.95 } : {}}
          transition={springTransition}
          title={tabsLocked ? 'Wait for generation to finish' : undefined}
        >
          My Vaults
          {mySkins.length > 0 && <span className="vc-tab-badge">{mySkins.length}</span>}
        </motion.button>
        {phase === 'generating' && (
          <motion.span className="vc-tabs-locked-hint"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3, delay:0.5 }}
          >generating…</motion.span>
        )}
      </div>
      <div className="vc-coins">
        <img src={CoinIcon} alt="" className="vc-coins__icon" />
        <motion.span className="vc-coins__value" key={coins}
          animate={{ scale:[1.25,1] }} transition={{ duration:0.2 }}
        >{coins.toLocaleString()}</motion.span>
        <AnimatePresence>
          {flyCoins && flyCoins.map((coin,i) => (
            <motion.img src={CoinIcon} alt="" className="vc-coins__fly" key={`fly-${coin.id}`}
              initial={{ opacity:1, y:0, x:0, scale:1, rotate:0 }}
              animate={{ opacity:0, y:coin.y, x:coin.x, scale:1.2, rotate:coin.rotate }}
              transition={{ duration:0.65, delay:coin.delay, ease:'easeOut' }}
              onAnimationComplete={i===flyCoins.length-1 ? ()=>setFlyCoins(null) : undefined}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const coinNoticeEl = (
    <AnimatePresence>
      {coinNotice && (
        <motion.div
          key={coinNotice.id}
          className="vc-coin-notice"
          initial={{ opacity:0, y:-8, scale:0.92 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:-18, scale:1.04 }}
          transition={{ duration:0.25 }}
          onAnimationComplete={() => setTimeout(() => setCoinNotice(null), 1100)}
        >
          <img src={CoinIcon} alt="" />
          <span>{coinNotice.amount}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  {/* Screen slot: overlaid on black LCD region */}
  const screenSlotEl = (
    <div className={`vc-device-screen-slot ${isTiltedDevice ? 'vc-device-screen-slot--tilted' : ''}`}>
      {screenContent}
    </div>
  );

  {/* Action area: overlaid on gray body region — CREATE/APPLY/DONE buttons */}
  const actionAreaEl = (
    <div className={`vc-action-area ${isTiltedDevice ? 'vc-action-area--tilted' : ''}`}>
      <AnimatePresence mode="wait">

          {phase === 'idle' && activeTab !== 'myskins' && (
            <motion.div key="idle-action" style={{ width:'100%' }}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
              transition={{ duration:0.2 }}
            >
              <motion.button
                className={`vc-btn-primary ${canGenerate ? '' : 'disabled'}`}
                onClick={() => canGenerate && handleGenerate()}
                disabled={!canGenerate}
                whileHover={canGenerate ? { scale:1.02 } : {}}
                whileTap={canGenerate ? { scale:0.97 } : {}}
                transition={springTransition}
              >
                <span className="vc-btn-primary__text">CREATE</span>
                <span className="vc-btn-primary__cost">
                  <img src={CoinIcon} alt="" className="vc-btn-primary__coin" />
                  <span>{SKIN_GENERATION_COST.toLocaleString()}</span>
                </span>
              </motion.button>
              <span className="vc-coins-disclaimer">Coins are charged when generation starts.</span>
              {!prompt.trim() && <span className="vc-create-hint">Add a description to continue</span>}
              {prompt.trim() && coins < SKIN_GENERATION_COST && (
                <span className="vc-create-hint">You need {SKIN_GENERATION_COST.toLocaleString()} coins to generate</span>
              )}
              {demoMode && coins < SKIN_GENERATION_COST && (
                <button type="button" className="vc-reset-link vc-reset-coins" onClick={handleResetDemoCoins}>
                  RESET DEMO BALANCE TO {initialCoins.toLocaleString()}
                </button>
              )}
            </motion.div>
          )}

          {(phase === 'preGenerating' || phase === 'generating') && (
            <motion.div key="generating-action" className="vc-generating-action"
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            >
              <span className="vc-generating-action__hint">You can cancel and keep your coins.</span>
              <button type="button" className="vc-reset-link vc-cancel-generation" onClick={handleCancelGeneration}>
                CANCEL GENERATION
              </button>
            </motion.div>
          )}

          {phase === 'preview' && (
            <motion.div key="preview-action" style={{ width:'100%' }}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.25 }}
            >
              <motion.button type="button" className="vc-btn-primary"
                onClick={() => handleApply()}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                transition={springTransition}
              >USE THIS AS MY VAULT</motion.button>
              <button type="button" className="vc-reset-link" onClick={handleReset}>↩ START OVER</button>
            </motion.div>
          )}

          {phase === 'applied' && (
            <motion.div key="applied-action" style={{ width:'100%' }}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.25 }}
            >
              <motion.button type="button" className="vc-btn-primary"
                onClick={handleCreateAnother}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                transition={springTransition}
              >CREATE ANOTHER VAULT</motion.button>
              <button type="button" className="vc-reset-link" onClick={handleClose}>GO BACK TO LOBBY</button>
            </motion.div>
          )}

          {phase === 'error' && (
            <motion.div key="error-action" style={{ width:'100%' }}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            >
              <motion.button type="button" className="vc-btn-primary" onClick={handleRetryGeneration}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} transition={springTransition}
              >TRY AGAIN</motion.button>
              <button type="button" className="vc-reset-link" onClick={handleReset}>↩ START OVER</button>
            </motion.div>
          )}

          {activeTab === 'myskins' && phase === 'idle' && (
            <motion.div key="myskins-action" style={{ width:'100%' }}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.2 }}
            >
              <motion.button className="vc-btn-primary"
                onClick={() => setActiveTab('create')}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                transition={springTransition}
              >+ DESIGN NEW VAULT</motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
  );

  const deviceEl = (
    <div className="vc-device">
      {hudEl}
      {coinNoticeEl}
      {screenSlotEl}
      {actionAreaEl}
    </div>
  );

  const appliedSheetEl = currentSkin && (
    <motion.div
      className="vc-applied-sheet"
      style={{ scale: sheetScale, transformOrigin: 'top left' }}
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={sheetSpring}
    >
      <div className="vc-applied-sheet__content">
        <h2 className="vc-applied-sheet__title">Vault customized!</h2>
        <div className="vc-applied-sheet__card">
          <img src={revealImgSrc || getMockupForTheme(currentSkin.theme)} alt={currentSkin.name} />
          <div className="vc-applied-sheet__card-footer">
            <span>{currentSkin.prompt || 'Your custom vault'}</span>
            <strong>✓ SELECTED</strong>
          </div>
        </div>
        <motion.button
          type="button"
          className="vc-applied-sheet__primary"
          onClick={handleCreateAnother}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >Create another vault</motion.button>
        <button type="button" className="vc-applied-sheet__back" onClick={handleClose}>
          ← Go back to lobby
        </button>
      </div>
    </motion.div>
  );

  // ── SHEET VARIANT ──────────────────────────────────────────────────────────
  if (variant !== 'modal') {
    return (
      <>
        {mysteryRevealEl}
        <motion.div className="vc-scrim"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.3 }} onClick={handleClose}
        />
        <motion.button className="vc-close"
          type="button"
          aria-label="Close Vault Studio"
          style={{ left: `${452 * sheetScale}px`, scale: sheetScale, transformOrigin: 'top left' }}
          onClick={handleClose}
          initial={{ x:'-100%', opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:'-100%', opacity:0 }}
          transition={sheetSpring} whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
        >✕</motion.button>
        {phase === 'applied' ? appliedSheetEl : (
          <>
            <motion.div className="vc-sheet"
              style={{ scale: sheetScale, transformOrigin: 'top left' }}
              animate={shaking ? { x:[0,-6,6,-4,4,-2,2,0] } : { x:0 }}
              transition={shaking ? { duration:0.45 } : sheetSpring}
              initial={{ x:'-100%' }} exit={{ x:'-100%' }}
            >
              {showIntro && <WelcomeIntro scope="sheet" onDone={() => setShowIntro(false)} />}
              <AnimatePresence>
                {confetti && (
                  <div className="vc-confetti-layer">
                    {confetti.map(p => <ConfettiParticle key={p.id} {...p} />)}
                  </div>
                )}
              </AnimatePresence>
              {hudEl}
              {coinNoticeEl}
            </motion.div>
            <motion.div className="vc-device-tilt"
              style={{
                left: `${-58 * sheetScale}px`,
                top: `${111 * sheetScale}px`,
                scale: sheetScale, rotate: -2, transformOrigin: 'top left',
              }}
              animate={
                showIntro
                  ? { y: '100%', opacity: 0 }
                  : shaking
                    ? { x:[0,-6,6,-4,4,-2,2,0], y:0, opacity:1 }
                    : { x:0, y:0, opacity:1 }
              }
              transition={shaking ? { duration:0.45 } : sheetSpring}
              initial={{ y:'100%', opacity:0 }} exit={{ x:'-100%', opacity:0 }}
            >
              <img src={DeviceFrame} alt="" className="vc-device-tilt__art" />
              {screenSlotEl}
              {actionAreaEl}
            </motion.div>
          </>
        )}
      </>
    );
  }

  // ── MODAL VARIANT ──────────────────────────────────────────────────────────
  return (
    <>
      {showIntro && <WelcomeIntro onDone={() => setShowIntro(false)} />}
      {mysteryRevealEl}
      <motion.div className="vc-modal-overlay"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:0.2 }} onClick={handleClose}
      >
        <motion.div className="vc-modal"
          onClick={e => e.stopPropagation()}
          animate={shaking ? { x:[0,-6,6,-4,4,-2,2,0] } : { scale:1, opacity:1 }}
          initial={{ scale:0.95, opacity:0 }} exit={{ scale:0.95, opacity:0 }}
          transition={shaking ? { duration:0.45 } : { duration:0.2, ease:'easeOut' }}
        >
          <AnimatePresence>
            {confetti && (
              <div className="vc-confetti-layer">
                {confetti.map(p => <ConfettiParticle key={p.id} {...p} />)}
              </div>
            )}
          </AnimatePresence>
          <motion.button className="vc-close vc-close--modal"
            onClick={handleClose} whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
          >✕</motion.button>
          {deviceEl}
        </motion.div>
      </motion.div>
    </>
  );
};

export default VaultCustomizationChallenge;
