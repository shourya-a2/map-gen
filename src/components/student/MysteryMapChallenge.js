import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MysteryMapChallenge.css';

import HeroVideo from '../../assets/Animated_Game_Background_Video_Loop.mp4';
import CoinIcon from '../../assets/coin-icon.svg';

const MAX_CHARS = 150;
const MAP_GENERATION_COST = 10000;

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

const TICKER_MESSAGES = [
  'Generating map...',
  'Creating terrain...',
  'Adding challenges...',
  'Placing treasures...',
];

const springTransition = { type: 'spring', stiffness: 400, damping: 17 };
const sheetSpring = { type: 'spring', damping: 22, stiffness: 170, mass: 0.8 };

const createAudioContext = () => {
  if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
    return new (window.AudioContext || window.webkitAudioContext)();
  }
  return null;
};

// Looping ascending arpeggio (C4 E4 G4 C5) using warm triangle waves.
// Returns a stop function to call when generation ends.
const playArpeggioSound = (audioCtx) => {
  if (!audioCtx) return () => {};
  const notes = [261.63, 329.63, 392.0, 523.25];
  let stopped = false;
  const playLoop = () => {
    if (stopped) return;
    try {
      notes.forEach((freq, i) => {
        const t = audioCtx.currentTime + i * 0.18;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) { /* Audio not supported */ }
  };
  playLoop();
  const id = setInterval(playLoop, 1500);
  return () => { stopped = true; clearInterval(id); };
};

// Three-note level-up fanfare (G4 B4 D5) with triangle waves and longer sustain.
const playLevelUpSound = (audioCtx) => {
  if (!audioCtx) return;
  try {
    [[392.0, 0], [493.88, 0.2], [587.33, 0.38]].forEach(([freq, delay]) => {
      const t = audioCtx.currentTime + delay;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  } catch (e) { /* Audio not supported */ }
};


const MysteryMapChallenge = ({
  isOpen,
  onClose,
  onMapSubmitted,
  initialCoins = 10000,
  defaultTab = 'create'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [prompt, setPrompt] = useState('');
  const [coins, setCoins] = useState(initialCoins);
  const [myMaps, setMyMaps] = useState([]);

  // Phases: 'idle' | 'generating' | 'complete'
  const [creatorPhase, setCreatorPhase] = useState('idle');
  const [currentMapData, setCurrentMapData] = useState(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const [placeholderText, setPlaceholderText] = useState('');
  const placeholderRef = useRef({ exampleIdx: 0, charIdx: 0, deleting: false, timeout: null });
  const audioCtxRef = useRef(null);
  const arpeggioStopRef = useRef(null);
  const [flyCoins, setFlyCoins] = useState(null);

  const spawnFlyCoins = () => {
    const count = 7;
    return Array.from({ length: count }, (_, i) => {
      const angleDeg = -200 + (i / (count - 1)) * 160;
      const angleRad = (angleDeg * Math.PI) / 180;
      const dist = 45 + Math.random() * 30;
      return {
        id: i,
        x: Math.cos(angleRad) * dist,
        y: Math.sin(angleRad) * dist,
        rotate: (Math.random() - 0.5) * 360,
        delay: i * 0.04,
      };
    });
  };

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Typewriter placeholder animation
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

  // Ticker cycling during generation
  useEffect(() => {
    if (creatorPhase !== 'generating') return;
    setTickerIndex(0);
    const id = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_MESSAGES.length);
    }, 1500);
    return () => clearInterval(id);
  }, [creatorPhase]);

  const canGenerate = prompt.trim().length > 0 &&
    coins >= MAP_GENERATION_COST;

  const handlePromptChange = useCallback((e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) setPrompt(value);
  }, []);

  const handleSuggestionClick = useCallback((text) => {
    setPrompt(text);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;

    setCoins(prev => prev - MAP_GENERATION_COST);
    setFlyCoins(spawnFlyCoins());

    setCreatorPhase('generating');
    setTickerIndex(0);

    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    arpeggioStopRef.current = playArpeggioSound(audioCtxRef.current);

    setTimeout(() => {
      if (arpeggioStopRef.current) {
        arpeggioStopRef.current();
        arpeggioStopRef.current = null;
      }
      playLevelUpSound(audioCtxRef.current);
      setCreatorPhase('complete');
      setCurrentMapData({
        id: Date.now(),
        name: prompt.trim() || 'Mystery Map',
        prompt: prompt.trim(),
        theme: 'dungeon',
        difficulty: 'medium',
        submitted: false
      });
    }, 3000);
  }, [canGenerate, prompt]);

  const handleClose = useCallback(() => {
    if (arpeggioStopRef.current) {
      arpeggioStopRef.current();
      arpeggioStopRef.current = null;
    }
    if (onClose) onClose();
  }, [onClose]);

  const handleSubmit = useCallback((mapToSubmit = null) => {
    const mapData = mapToSubmit || currentMapData;
    if (!mapData) return;

    const submittedMap = { ...mapData, submitted: true };
    if (mapToSubmit) {
      setMyMaps(prev => prev.map(m =>
        m.id === mapToSubmit.id ? submittedMap : m
      ));
    } else {
      setMyMaps(prev => [submittedMap, ...prev]);
    }
    if (onMapSubmitted) onMapSubmitted(submittedMap);
    handleClose();
  }, [currentMapData, onMapSubmitted, handleClose]);

  const handleReset = useCallback(() => {
    setCreatorPhase('idle');
    setCurrentMapData(null);
    setPrompt('');
    setTickerIndex(0);
  }, []);

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

      {/* Close button - floating outside sheet */}
      <motion.button
        className="aura-close aura-close--floating"
        onClick={handleClose}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0 }}
        transition={sheetSpring}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        ✕
      </motion.button>

      <motion.div
        className="aura-sheet"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={sheetSpring}
      >
        {/* Video Background */}
        <motion.div
          className="aura-video-bg"
          animate={
            creatorPhase === 'generating'
              ? { scale: 1.08, filter: 'brightness(1.2)' }
              : { scale: 1.0, y: 0, filter: 'brightness(1)' }
          }
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <video
            className="aura-video-bg__video"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={HeroVideo} type="video/mp4" />
          </video>
        </motion.div>

        {/* Flicker overlay during generation */}
        <AnimatePresence>
          {creatorPhase === 'generating' && (
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
              <div className="aura-coins">
                <img src={CoinIcon} alt="" className="aura-coins__icon" />
                <span className="aura-coins__value">{coins.toLocaleString()}</span>
                <AnimatePresence>
                  {flyCoins && flyCoins.map((coin, i) => (
                    <motion.img
                      src={CoinIcon}
                      alt=""
                      className="aura-coins__fly-coin"
                      key={`fly-${coin.id}`}
                      initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
                      animate={{ opacity: 0, y: coin.y, x: coin.x, scale: 1.2, rotate: coin.rotate }}
                      transition={{ duration: 0.65, delay: coin.delay, ease: 'easeOut' }}
                      onAnimationComplete={i === flyCoins.length - 1 ? () => setFlyCoins(null) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
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
                <div className="aura-title-block">
                  <span className="aura-title__text">
                    {creatorPhase === 'idle' ? 'Describe the arena you want to play'
                      : creatorPhase === 'generating' ? 'Crafting your arena...'
                      : creatorPhase === 'complete' ? 'Map Generated!'
                      : 'Describe the arena you want to play'}
                  </span>
                </div>

                {/* Phase content — upper + lower regions, no layout shift */}
                <div className="aura-phase-content">

                  {/* UPPER REGION — crossfade between prompt and feedback box */}
                  <div className="aura-upper-region">
                    <AnimatePresence mode="wait">
                      {creatorPhase === 'idle' && (
                        <motion.div
                          key="prompt-area"
                          className="aura-idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
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
                          {/* Suggestion chips */}
                          <div className="aura-suggestions">
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
                        </motion.div>
                      )}

                      {creatorPhase !== 'idle' && (
                        <motion.div
                          key="feedback-box"
                          className="aura-feedback-box"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4 }}
                        >
                          <div className="aura-feedback-box__icon-wrap">
                            <motion.span
                              className="aura-feedback-box__icon"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            >
                              &#x2699;&#xFE0F;
                            </motion.span>
                            <div className="aura-feedback-box__ring" />
                          </div>
                          {creatorPhase === 'generating' && (
                            <div className="aura-feedback-box__progress">
                              <motion.div
                                className="aura-feedback-box__progress-fill"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 3, ease: 'linear' }}
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* LOWER REGION — button area, stays fixed */}
                  <div className="aura-lower-region">
                    <AnimatePresence mode="wait">
                      {creatorPhase === 'idle' && (
                        <motion.div
                          key="generate-area"
                          className="aura-actions"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="aura-generate-row">
                            <motion.button
                              className={`wa-btn-primary ${canGenerate ? '' : 'disabled'}`}
                              onClick={() => canGenerate && handleGenerate()}
                              disabled={!canGenerate}
                              whileHover={canGenerate ? { scale: 1.02 } : {}}
                              whileTap={canGenerate ? { scale: 0.98 } : {}}
                              transition={springTransition}
                            >
                              <span className="wa-btn-primary__text">CREATE</span>
                              <span className="wa-btn-primary__cost">
                                <img src={CoinIcon} alt="" className="wa-btn-primary__coin" />
                                <span>{MAP_GENERATION_COST.toLocaleString()}</span>
                              </span>
                            </motion.button>
                          </div>
                          <span className="aura-coins-disclaimer">
                            Coins once used cannot be refunded.
                          </span>
                          {coins < MAP_GENERATION_COST && prompt.trim().length > 0 && (
                            <span className="aura-coins-warning">
                              NOT ENOUGH COINS &mdash; {MAP_GENERATION_COST.toLocaleString()} needed
                            </span>
                          )}
                        </motion.div>
                      )}

                      {creatorPhase === 'generating' && (
                        <motion.div
                          key="ticker"
                          className="aura-ticker"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={tickerIndex}
                              className="aura-ticker__message"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.3 }}
                            >
                              {TICKER_MESSAGES[tickerIndex]}
                            </motion.span>
                          </AnimatePresence>
                        </motion.div>
                      )}

                      {creatorPhase === 'complete' && (
                        <motion.div
                          key="complete-area"
                          className="aura-actions"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.button
                            className="wa-btn-primary"
                            onClick={() => handleSubmit()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={springTransition}
                          >
                            SEND TO TEACHER
                          </motion.button>
                          <motion.button
                            className="aura-reset-link"
                            onClick={handleReset}
                            whileHover={{ opacity: 1 }}
                          >
                            &#x21A9; Create a different map
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

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
                      className="wa-btn-primary aura-mymaps-empty__cta"
                      onClick={() => setActiveTab('create')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={springTransition}
                    >
                      CREATE YOUR FIRST MAP
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
                            {(map.colors || []).slice(0, 16).map((color, i) => (
                              <div key={i} style={{ backgroundColor: color }} />
                            ))}
                          </div>
                          <div className="aura-map-card__info">
                            <span className="aura-map-card__name">{map.name}</span>
                            <div className="aura-map-card__meta">
                              <span className="aura-map-card__theme">{map.theme}</span>
                            </div>
                            {map.submitted && (
                              <span className="aura-map-card__status">&#x2713; SUBMITTED</span>
                            )}
                          </div>
                          <div className="aura-map-card__actions">
                            <motion.button
                              className={`aura-map-card__submit ${map.submitted ? 'resubmit' : ''}`}
                              onClick={() => handleSubmit(map)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {map.submitted ? 'RE-SUBMIT' : 'SUBMIT'}
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
