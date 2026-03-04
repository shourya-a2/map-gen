import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MysteryMapChallenge.css';

import MockupMapImage from '../assets/mockup-map.png';
import HeroVideo from '../assets/Animated_Game_Background_Video_Loop.mp4';

const MAX_CHARS = 150;
const GENERATION_COST = 50;
const MAX_GENERATIONS = 3;
const PIXEL_GRID_SIZE = 8;
const TOTAL_PIXELS = PIXEL_GRID_SIZE * PIXEL_GRID_SIZE;

const PROMPT_SUGGESTIONS = [
  'Medieval Castle',
  'Volcanic Island',
  'Desert Ruins',
  'Underwater City',
  'Enchanted Forest',
];

const PLACEHOLDER_EXAMPLES = [
  'A haunted castle with lava moat',
  'Sunken pirate ship in a coral reef',
  'Floating islands connected by bridges',
  'A maze inside an active volcano',
  'Frozen tundra with hidden caves',
];

const FORGE_MESSAGES = [
  'Summoning terrain...',
  'Placing obstacles...',
  'Adding secret paths...',
  'Hiding treasures...',
  'Finalizing layout...',
];

const generatePixelColors = () => {
  const colors = [
    '#1a1a2e', '#16213e', '#0f3460', '#1a1a1a',
    '#2d2d44', '#1f1f2e', '#252540', '#1e1e32',
    '#3d3d5c', '#2a2a44', '#1c1c2e', '#333355'
  ];
  return Array.from({ length: TOTAL_PIXELS }, () =>
    colors[Math.floor(Math.random() * colors.length)]
  );
};

const generateSpiralOrder = (size) => {
  const order = [];
  let top = 0, bottom = size - 1, left = 0, right = size - 1;
  while (top <= bottom && left <= right) {
    for (let i = left; i <= right; i++) order.push(top * size + i);
    top++;
    for (let i = top; i <= bottom; i++) order.push(i * size + right);
    right--;
    if (top <= bottom) {
      for (let i = right; i >= left; i--) order.push(bottom * size + i);
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) order.push(i * size + left);
      left++;
    }
  }
  return order;
};

const SPIRAL_ORDER = generateSpiralOrder(PIXEL_GRID_SIZE);

const springTransition = { type: 'spring', stiffness: 400, damping: 17 };
const sheetSpring = { type: 'spring', damping: 22, stiffness: 170, mass: 0.8 };

const createAudioContext = () => {
  if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
    return new (window.AudioContext || window.webkitAudioContext)();
  }
  return null;
};

const playForgeSound = (audioCtx, progress) => {
  if (!audioCtx) return;
  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200 + (progress * 4), audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.08);
  } catch (e) { /* Audio not supported */ }
};

const playScanSound = (audioCtx) => {
  if (!audioCtx) return;
  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 1.5);
    gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.8);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 1.5);
  } catch (e) { /* Audio not supported */ }
};

const playCompleteSound = (audioCtx) => {
  if (!audioCtx) return;
  try {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + i * 0.12 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.4);
      oscillator.start(audioCtx.currentTime + i * 0.12);
      oscillator.stop(audioCtx.currentTime + i * 0.12 + 0.4);
    });
  } catch (e) { /* Audio not supported */ }
};

const MysteryMapChallenge = ({
  isOpen,
  onClose,
  onMapSubmitted,
  initialCoins = 1500,
  defaultTab = 'create'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [prompt, setPrompt] = useState('');
  const [coins, setCoins] = useState(initialCoins);
  const [generationsLeft, setGenerationsLeft] = useState(MAX_GENERATIONS);
  const [myMaps, setMyMaps] = useState([]);

  const [creatorPhase, setCreatorPhase] = useState('idle');
  const [revealedPixels, setRevealedPixels] = useState([]);
  const [forgeProgress, setForgeProgress] = useState(0);
  const [forgeMessage, setForgeMessage] = useState('');
  const [currentMapData, setCurrentMapData] = useState(null);
  const forgeIntervalRef = useRef(null);

  const [pixelColors] = useState(() => generatePixelColors());
  const [placeholderText, setPlaceholderText] = useState('');
  const placeholderRef = useRef({ exampleIdx: 0, charIdx: 0, deleting: false, timeout: null });
  const [scanPhase, setScanPhase] = useState(false);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    const ref = placeholderRef.current;
    const tick = () => {
      const example = PLACEHOLDER_EXAMPLES[ref.exampleIdx];
      if (!ref.deleting) {
        ref.charIdx++;
        setPlaceholderText(example.slice(0, ref.charIdx));
        if (ref.charIdx >= example.length) {
          ref.timeout = setTimeout(() => { ref.deleting = true; tick(); }, 2000);
          return;
        }
        ref.timeout = setTimeout(tick, 60 + Math.random() * 40);
      } else {
        ref.charIdx--;
        setPlaceholderText(example.slice(0, ref.charIdx));
        if (ref.charIdx <= 0) {
          ref.deleting = false;
          ref.exampleIdx = (ref.exampleIdx + 1) % PLACEHOLDER_EXAMPLES.length;
          ref.timeout = setTimeout(tick, 400);
          return;
        }
        ref.timeout = setTimeout(tick, 30);
      }
    };
    tick();
    return () => clearTimeout(ref.timeout);
  }, []);

  useEffect(() => {
    return () => {
      if (forgeIntervalRef.current) clearInterval(forgeIntervalRef.current);
    };
  }, []);

  const canGenerate = prompt.trim().length > 0 && generationsLeft > 0 && coins >= GENERATION_COST;

  const handlePromptChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) setPrompt(value);
  }, []);

  const handleSuggestionClick = useCallback((text) => {
    setPrompt(text);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    setCoins(prev => prev - GENERATION_COST);
    setGenerationsLeft(prev => prev - 1);
    setCreatorPhase('forging');
    setRevealedPixels([]);
    setForgeProgress(0);
    setForgeMessage(FORGE_MESSAGES[0]);
    setScanPhase(true);

    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    playScanSound(audioCtxRef.current);

    setTimeout(() => {
      setScanPhase(false);
      let pixelIndex = 0;
      forgeIntervalRef.current = setInterval(() => {
        if (pixelIndex < TOTAL_PIXELS) {
          setRevealedPixels(prev => [...prev, SPIRAL_ORDER[pixelIndex]]);
          const progress = ((pixelIndex + 1) / TOTAL_PIXELS) * 100;
          setForgeProgress(progress);
          const msgIdx = Math.min(
            Math.floor((progress / 100) * FORGE_MESSAGES.length),
            FORGE_MESSAGES.length - 1
          );
          setForgeMessage(FORGE_MESSAGES[msgIdx]);
          if (pixelIndex % 4 === 0) {
            playForgeSound(audioCtxRef.current, progress);
          }
          pixelIndex++;
        } else {
          clearInterval(forgeIntervalRef.current);
          forgeIntervalRef.current = null;
          playCompleteSound(audioCtxRef.current);
          setTimeout(() => {
            setCreatorPhase('complete');
            setCurrentMapData({
              id: Date.now(),
              name: prompt.trim() || 'Mystery Map',
              prompt: prompt.trim(),
              colors: pixelColors,
              theme: 'dungeon',
              difficulty: 'medium',
              submitted: false
            });
          }, 600);
        }
      }, 80);
    }, 1500);
  }, [canGenerate, prompt, pixelColors]);

  const handleRegenerate = useCallback(() => {
    if (generationsLeft <= 0 || coins < GENERATION_COST) return;
    setCreatorPhase('idle');
    setRevealedPixels([]);
    setForgeProgress(0);
    setCurrentMapData(null);
  }, [generationsLeft, coins]);

  const handleSubmit = useCallback((mapToSubmit = null) => {
    const mapData = mapToSubmit || currentMapData;
    if (!mapData) return;
    setCreatorPhase('submitting');

    setTimeout(() => {
      const submittedMap = { ...mapData, submitted: true };
      if (mapToSubmit) {
        setMyMaps(prev => prev.map(m =>
          m.id === mapToSubmit.id ? submittedMap : m
        ));
      } else {
        setMyMaps(prev => [submittedMap, ...prev]);
      }
      if (onMapSubmitted) onMapSubmitted(submittedMap);

      setCreatorPhase('idle');
      setPrompt('');
      setCurrentMapData(null);
      setRevealedPixels([]);
      setActiveTab('mymaps');
    }, 1500);
  }, [currentMapData, onMapSubmitted]);

  const handleDeleteMap = useCallback((mapId) => {
    setMyMaps(prev => prev.filter(m => m.id !== mapId));
  }, []);

  const handleResubmit = useCallback((map) => {
    setPrompt(map.prompt);
    setActiveTab('create');
    setCreatorPhase('idle');
  }, []);

  const handleClose = useCallback(() => {
    if (forgeIntervalRef.current) {
      clearInterval(forgeIntervalRef.current);
      forgeIntervalRef.current = null;
    }
    if (onClose) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className="aura-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleClose}
      />

      <motion.div
        className="aura-sheet"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={sheetSpring}
      >
        {/* Video Background */}
        <div className="aura-video-bg">
          <video
            className="aura-video-bg__video"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={HeroVideo} type="video/mp4" />
          </video>
        </div>

        {/* Flicker overlay during forging */}
        <AnimatePresence>
          {creatorPhase === 'forging' && (
            <motion.div
              className="aura-flicker"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0, 0.2, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </AnimatePresence>

        {/* Header: [Tabs on left] ... [Coins + Close on right] */}
        <div className="aura-header">
          <div className="aura-header__left">
            <div className="aura-tabs">
              <motion.button
                className={`aura-tab ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springTransition}
              >
                CREATE
              </motion.button>
              <motion.button
                className={`aura-tab ${activeTab === 'mymaps' ? 'active' : ''}`}
                onClick={() => setActiveTab('mymaps')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springTransition}
              >
                MY MAPS
              </motion.button>
            </div>
          </div>

          <div className="aura-header__right">
            <div className="aura-economy">
              <span className="aura-coins">🪙 {coins.toLocaleString()}</span>
            </div>
            <motion.button
              className="aura-close"
              onClick={handleClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✕
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div className="aura-body">
          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.div
                key="create"
                className="aura-create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Title */}
                <div className={`aura-title-block ${creatorPhase === 'forging' || creatorPhase === 'complete' ? 'aura-title-block--high' : ''}`}>
                  <span className="aura-title__text">
                    {creatorPhase === 'complete' ? 'Map Generated!' : creatorPhase === 'forging' ? 'Forging...' : 'Create your own Map'}
                  </span>
                </div>

                {/* Phase content */}
                <div className={`aura-phase-content ${creatorPhase === 'forging' || creatorPhase === 'complete' ? 'aura-phase-content--high' : ''}`}>
                  {/* IDLE */}
                  {creatorPhase === 'idle' && (
                    <motion.div
                      className="aura-idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Input */}
                      <div className="aura-input-wrap">
                        <textarea
                          className="aura-input"
                          placeholder={placeholderText}
                          value={prompt}
                          onChange={handlePromptChange}
                          rows={2}
                        />
                        {!prompt && (
                          <span className="aura-input-cursor" />
                        )}
                        <span className="aura-input-wc">
                          {prompt.length}/{MAX_CHARS}
                        </span>
                      </div>
                      <div className="aura-input-meta">
                        <span className="aura-gen-badge--inline">
                          {generationsLeft}/{MAX_GENERATIONS} generates left
                        </span>
                        <span className="aura-gen-badge--inline">
                          🪙 {GENERATION_COST} per map
                        </span>
                      </div>

                      {/* Suggestion chips — like Aura Lab pill buttons */}
                      <div className="aura-suggestions">
                        <span className="aura-suggestions__label">TRY A PROMPT</span>
                        <div className="aura-suggestions__list">
                          {PROMPT_SUGGESTIONS.map((text, i) => (
                            <motion.button
                              key={i}
                              className={`aura-pill ${prompt === text ? 'aura-pill--active' : ''}`}
                              onClick={() => handleSuggestionClick(text)}
                              whileHover={{ scale: 1.06, y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              transition={springTransition}
                            >
                              {text}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Generate button */}
                      <div className="aura-actions">
                        <motion.button
                          className={`aura-btn-primary ${canGenerate ? '' : 'disabled'}`}
                          onClick={handleGenerate}
                          disabled={!canGenerate}
                          whileHover={canGenerate ? { y: -2 } : {}}
                          whileTap={canGenerate ? { y: 0 } : {}}
                          transition={springTransition}
                        >
                          <span className="aura-btn-primary__glow" />
                          <span className="aura-btn-primary__face">
                            GENERATE MAP
                          </span>
                        </motion.button>
                        {!canGenerate && (
                          <p className="aura-hint--requirement">
                            {prompt.trim().length === 0
                              ? 'Type or pick a prompt above to generate'
                              : generationsLeft <= 0
                                ? 'No generations remaining'
                                : 'Not enough coins'}
                          </p>
                        )}
                        {canGenerate && (
                          <p className="aura-hint">The wilder the idea, the cooler the map.</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* FORGING + COMPLETE — shared frame */}
                  {(creatorPhase === 'forging' || creatorPhase === 'complete') && (
                    <motion.div
                      className="aura-forging"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="aura-map-frame">
                        {/* Map image — always present underneath, revealed progressively */}
                        <img
                          className="aura-map-frame__img"
                          src={MockupMapImage}
                          alt="Generated Map"
                        />

                        {/* Pixel grid overlay — reveals map underneath as pixels become transparent */}
                        <AnimatePresence>
                          {creatorPhase === 'forging' && (
                            <motion.div
                              className={`aura-pixel-grid ${scanPhase ? 'aura-pixel-grid--scanning' : ''}`}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.5 }}
                            >
                              {pixelColors.map((color, index) => {
                                const isRevealed = revealedPixels.includes(index);
                                const isRevealing = revealedPixels.length > 0 &&
                                  SPIRAL_ORDER.indexOf(index) === revealedPixels.length;
                                return (
                                  <div
                                    key={index}
                                    className={`aura-pixel ${isRevealed ? 'revealed' : ''} ${isRevealing ? 'revealing' : ''} ${scanPhase ? 'scanning' : ''}`}
                                  />
                                );
                              })}
                              <motion.div
                                className="aura-scanline"
                                animate={scanPhase 
                                  ? { top: ['0%', '100%', '0%'], opacity: [0.8, 1, 0.8] }
                                  : { top: ['0%', '100%'] }
                                }
                                transition={scanPhase 
                                  ? { duration: 1.5, ease: 'easeInOut' }
                                  : { duration: 2, repeat: Infinity, ease: 'linear' }
                                }
                              />
                              {scanPhase && (
                                <motion.div
                                  className="aura-scan-overlay"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                                  transition={{ duration: 0.75, repeat: 2 }}
                                />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Below the frame: progress during forging, buttons on complete */}
                      <AnimatePresence mode="wait">
                        {creatorPhase === 'forging' && (
                          <motion.div
                            key="forge-info"
                            className="aura-forge-below"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="aura-progress">
                              <div className="aura-progress__track">
                                <motion.div
                                  className="aura-progress__fill"
                                  style={{ width: `${forgeProgress}%` }}
                                />
                              </div>
                              <div className="aura-progress__labels">
                                <span>{forgeMessage}</span>
                                <span>{Math.round(forgeProgress)}%</span>
                              </div>
                            </div>
                            <div className="aura-forge-status">
                              <motion.span
                                className="aura-forge-status__icon"
                                animate={{ rotate: [0, -12, 12, -12, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                              >
                                ⚒️
                              </motion.span>
                              <span className="aura-forge-status__text">FORGING MAP...</span>
                            </div>
                          </motion.div>
                        )}

                        {creatorPhase === 'complete' && (
                          <motion.div
                            key="complete-actions"
                            className="aura-actions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                          >
                            <motion.button
                              className="aura-btn-primary"
                              onClick={() => handleSubmit()}
                              whileHover={{ y: -2 }}
                              whileTap={{ y: 0 }}
                              transition={springTransition}
                            >
                              <span className="aura-btn-primary__glow" />
                              <span className="aura-btn-primary__face">
                                Send to Teacher
                              </span>
                            </motion.button>
                            <motion.button
                              className={`aura-btn-secondary ${generationsLeft <= 0 || coins < GENERATION_COST ? 'disabled' : ''}`}
                              onClick={handleRegenerate}
                              disabled={generationsLeft <= 0 || coins < GENERATION_COST}
                              whileHover={generationsLeft > 0 ? { y: -2 } : {}}
                              whileTap={generationsLeft > 0 ? { y: 0 } : {}}
                              transition={springTransition}
                            >
                              RETRY × {generationsLeft} remaining
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* SUBMITTING */}
                  {creatorPhase === 'submitting' && (
                    <motion.div
                      className="aura-submitting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.span
                        className="aura-submitting__icon"
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        📦
                      </motion.span>
                      <p className="aura-submitting__text">SUBMITTING TO TEACHER...</p>
                      <div className="aura-submitting__bar">
                        <motion.div
                          className="aura-submitting__bar-fill"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.4, ease: 'easeInOut' }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mymaps"
                className="aura-mymaps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {myMaps.length === 0 ? (
                  <div className="aura-mymaps-empty">
                    <p className="aura-mymaps-empty__title">NO MAPS YET</p>
                    <span className="aura-mymaps-empty__hint">Create your first map!</span>
                    
                    {/* Placeholder cards showing what maps will look like */}
                    <div className="aura-mymaps-placeholders">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aura-map-card aura-map-card--placeholder">
                          <div className="aura-map-card__grid aura-map-card__grid--placeholder">
                            {Array.from({ length: 16 }).map((_, j) => (
                              <div key={j} />
                            ))}
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
                    
                    <motion.button
                      className="aura-btn-primary aura-mymaps-empty__cta"
                      onClick={() => setActiveTab('create')}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      transition={springTransition}
                    >
                      <span className="aura-btn-primary__glow" />
                      <span className="aura-btn-primary__face">
                        CREATE YOUR FIRST MAP
                      </span>
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <div className="aura-mymaps-list">
                      {myMaps.map((map) => (
                        <motion.div
                          key={map.id}
                          className={`aura-map-card ${map.submitted ? 'submitted' : ''}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          transition={springTransition}
                        >
                          <div className="aura-map-card__grid">
                            {map.colors.slice(0, 16).map((color, i) => (
                              <div key={i} style={{ backgroundColor: color }} />
                            ))}
                          </div>
                          <div className="aura-map-card__info">
                            <span className="aura-map-card__name">{map.name}</span>
                            <div className="aura-map-card__meta">
                              <span className="aura-map-card__theme">{map.theme}</span>
                            </div>
                            {map.submitted && (
                              <span className="aura-map-card__status">✓ SUBMITTED</span>
                            )}
                          </div>
                          <div className="aura-map-card__actions">
                            {!map.submitted ? (
                              <motion.button
                                className="aura-map-card__submit"
                                onClick={() => handleSubmit(map)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                SUBMIT
                              </motion.button>
                            ) : (
                              <motion.button
                                className="aura-map-card__submit resubmit"
                                onClick={() => handleResubmit(map)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                RESUBMIT
                              </motion.button>
                            )}
                            <motion.button
                              className="aura-map-card__delete"
                              onClick={() => handleDeleteMap(map.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              🗑️
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="aura-mymaps-footer">
                      <span>{myMaps.length} MAP{myMaps.length !== 1 ? 'S' : ''}</span>
                      <span className="aura-mymaps-footer__submitted">
                        {myMaps.filter(m => m.submitted).length} SUBMITTED
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
