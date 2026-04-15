import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CreateMapSideSheet.css';
import { MOCK_THUMBNAILS, EXAMPLE_PROMPTS } from '../../data/mockData';
import { useMapStore } from '../../hooks/useMapStore';
import {
  CHIP_PREVIEWS,
  calculateRarity,
  detectTheme,
  soundManager,
  InputSparkle,
  FloatingParticle,
  MapIcon,
  SparklesIcon,
  CloseIcon,
  TrashIcon,
  LockIcon,
  SoundOnIcon,
  SoundOffIcon,
  MAX_CHARS,
  MAX_SLOTS,
} from '../../utils/mapCreatorUtils';

const TICKER_MESSAGES = [
  "Generating map\u2026",
  "Creating terrain\u2026",
  "Adding challenges\u2026",
  "Placing treasures\u2026",
];

const CreateMapSideSheet = ({ onClose, onMapGenerated, getMapButtonPosition, onFlyComplete, initialTab = 'create' }) => {
  const { maps, addMap, deleteMap, isAtLimit, maxMaps } = useMapStore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [prompt, setPrompt] = useState('');
  const [generationPhase, setGenerationPhase] = useState('idle'); // idle, generating, complete
  const [tickerIndex, setTickerIndex] = useState(0);
  const [generatedMap, setGeneratedMap] = useState(null);
  const [mapToDelete, setMapToDelete] = useState(null);
  const [localWarning, setLocalWarning] = useState(null);
  const [detectedTheme, setDetectedTheme] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isTypewriting, setIsTypewriting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const tabRefs = useRef({});
  const inputRef = useRef(null);
  const sheetRef = useRef(null);
  const sparkleIdRef = useRef(0);
  const typingThrottleRef = useRef(null);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  // Initialize sound on first interaction
  useEffect(() => {
    const initSound = () => {
      soundManager.init();
      document.removeEventListener('click', initSound);
    };
    document.addEventListener('click', initSound);
    return () => document.removeEventListener('click', initSound);
  }, []);

  // Update tab indicator position
  useEffect(() => {
    const activeTabEl = tabRefs.current[activeTab];
    if (activeTabEl) {
      setTabIndicator({
        left: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
      });
    }
  }, [activeTab]);

  // Detect theme from prompt
  useEffect(() => {
    const theme = detectTheme(prompt);
    setDetectedTheme(theme);
  }, [prompt]);

  // Cleanup sparkles
  useEffect(() => {
    if (sparkles.length > 20) {
      setSparkles(prev => prev.slice(-10));
    }
  }, [sparkles.length]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && generationPhase === 'idle' && !isClosing) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [generationPhase, isClosing]);

  // Ticker cycling
  useEffect(() => {
    if (generationPhase !== 'generating') return;
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [generationPhase]);

  const addSparkle = useCallback((x, y) => {
    const id = sparkleIdRef.current++;
    setSparkles(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== id));
    }, 800);
  }, []);

  const handlePromptChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS && !isTypewriting) {
      setPrompt(value);

      if (!typingThrottleRef.current && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        addSparkle(x, y);
        soundManager.playTypingChime();

        typingThrottleRef.current = setTimeout(() => {
          typingThrottleRef.current = null;
        }, 150);
      }
    }
  };

  const handleExampleClick = async (example) => {
    if (generationPhase !== 'idle' || isTypewriting) return;

    soundManager.playPillClick();
    setIsTypewriting(true);
    setPrompt('');

    for (let i = 0; i <= example.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setPrompt(example.slice(0, i));
    }

    setIsTypewriting(false);
  };

  const handleGenerateClick = async () => {
    if (!prompt.trim() || generationPhase !== 'idle') return;

    if (isAtLimit) {
      setLocalWarning(`You've reached the maximum of ${maxMaps} maps! Delete some to create more.`);
      setTimeout(() => setLocalWarning(null), 4000);
      return;
    }

    setGenerationPhase('generating');
    setTickerIndex(0);

    soundManager.playGenerationStart();
    soundManager.startAmbientHum();

    await new Promise(resolve => setTimeout(resolve, 3000));

    soundManager.stopAmbientHum();
    soundManager.playSettleClick();

    const newMap = {
      id: crypto.randomUUID(),
      prompt: prompt.trim(),
      thumbnailUrl: MOCK_THUMBNAILS[Math.floor(Math.random() * MOCK_THUMBNAILS.length)],
      createdAt: Date.now(),
      rarity: calculateRarity(prompt),
    };

    const success = addMap(newMap);
    if (success) {
      setGeneratedMap(newMap);
      if (onMapGenerated) {
        onMapGenerated(newMap);
      }
    }

    setGenerationPhase('complete');
  };

  const handleSubmit = () => {
    handleClose();
  };

  const handleReset = () => {
    setGenerationPhase('idle');
    setGeneratedMap(null);
    setPrompt('');
    setTickerIndex(0);
  };

  const handleClose = useCallback(async () => {
    if (isClosing || generationPhase === 'generating') return;

    setIsClosing(true);
    soundManager.playPillClick();

    if (generatedMap || maps.length > 0) {
      setTimeout(() => {
        onFlyComplete?.();
      }, 200);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    onClose();
  }, [isClosing, generationPhase, generatedMap, maps.length, onFlyComplete, onClose]);

  const handleDeleteClick = (e, map) => {
    e.stopPropagation();
    setMapToDelete(map);
  };

  const handleConfirmDelete = () => {
    if (mapToDelete) {
      deleteMap(mapToDelete.id);
      setMapToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setMapToDelete(null);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
  };

  const charCountClass = prompt.length >= MAX_CHARS
    ? 'char-counter--limit'
    : prompt.length >= MAX_CHARS - 10
      ? 'char-counter--warning'
      : '';

  const inputThemeClass = detectedTheme ? `prompt-input--${detectedTheme}` : '';
  const lockedSlots = Array.from({ length: MAX_SLOTS }, (_, i) => i);

  const handleOverlayClick = () => {
    if (generationPhase === 'generating' || isClosing) return;
    handleClose();
  };

  return (
    <div className="side-sheet-overlay" onClick={handleOverlayClick}>
      <motion.div
        ref={sheetRef}
        className="side-sheet"
        initial={{ x: '-100%' }}
        animate={{ x: isClosing ? '-100%' : 0 }}
        exit={{ x: '-100%' }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          duration: 0.3
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: 'transform' }}
      >
        {/* Dynamic background overlay */}
        <div className={`sheet-background-overlay ${detectedTheme ? `sheet-background-overlay--${detectedTheme}` : ''}`}>
          {detectedTheme && !isClosing && (
            <div className="particle-container">
              {Array.from({ length: 8 }).map((_, i) => (
                <FloatingParticle key={i} theme={detectedTheme} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Header */}
        <div className="sheet-header">
          <h2 className="sheet-title">
            <MapIcon />
            Custom Map Creator
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              className={`sound-toggle-btn ${isMuted ? 'sound-toggle-btn--muted' : ''}`}
              onClick={toggleMute}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
            </motion.button>
            {generationPhase !== 'generating' && !isClosing && (
              <motion.button
                className="sheet-close-btn"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <CloseIcon />
              </motion.button>
            )}
          </div>
        </div>

        {/* Tabs — hidden during generation/complete */}
        {generationPhase === 'idle' && (
          <div className="sheet-tabs">
            <button
              ref={(el) => (tabRefs.current['create'] = el)}
              className={`sheet-tab ${activeTab === 'create' ? 'sheet-tab--active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create New Map
            </button>
            <button
              ref={(el) => (tabRefs.current['my-maps'] = el)}
              className={`sheet-tab ${activeTab === 'my-maps' ? 'sheet-tab--active' : ''}`}
              onClick={() => setActiveTab('my-maps')}
            >
              My Maps ({maps.length})
            </button>
            <motion.div
              className="tab-indicator"
              animate={{
                left: tabIndicator.left,
                width: tabIndicator.width,
              }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            />
          </div>
        )}

        {/* Content */}
        <div className="sheet-content">
          <AnimatePresence mode="wait">
            {(activeTab === 'create' || generationPhase !== 'idle') ? (
              <motion.div
                key="create"
                className="create-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Upper region — prompt area or feedback box */}
                <div className="create-tab__upper">
                  <AnimatePresence mode="wait">
                    {generationPhase === 'idle' && (
                      <motion.div
                        key="prompt-area"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Prompt Input with particles */}
                        <div className="prompt-input-wrapper">
                          <div className="prompt-input-container" ref={inputRef}>
                            <div className="input-particles">
                              {sparkles.map(sparkle => (
                                <InputSparkle key={sparkle.id} x={sparkle.x} y={sparkle.y} />
                              ))}
                            </div>
                            <textarea
                              className={`prompt-input ${inputThemeClass}`}
                              placeholder="Describe your dream map... e.g. 'underwater volcano' or 'candy kingdom'"
                              value={prompt}
                              onChange={handlePromptChange}
                              disabled={isTypewriting}
                            />
                          </div>
                          <motion.span
                            className={`char-counter ${charCountClass}`}
                            key={prompt.length}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {prompt.length}/{MAX_CHARS}
                          </motion.span>
                        </div>

                        {/* Example Prompts with previews */}
                        <div className="example-prompts" style={{ marginTop: 20 }}>
                          <span className="example-prompts__label">Need inspiration? Try these:</span>
                          <div className="example-prompts__list">
                            {EXAMPLE_PROMPTS.map((example, index) => (
                              <div key={index} className="example-chip-wrapper">
                                <motion.button
                                  className="example-chip"
                                  onClick={() => handleExampleClick(example)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={isTypewriting}
                                  style={{ animationDelay: `${index * 0.5}s` }}
                                >
                                  {example}
                                </motion.button>
                                <div
                                  className="chip-preview"
                                  style={{ background: CHIP_PREVIEWS[example] || '#333' }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {generationPhase !== 'idle' && (
                      <motion.div
                        key="feedback-box"
                        className="gen-feedback-box"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="gen-feedback-box__ring">
                          <div className="gen-feedback-box__icon">
                            <MapIcon />
                          </div>
                        </div>
                        <p className="gen-feedback-box__label">
                          {generationPhase === 'complete' ? 'Map ready!' : 'Creating your map'}
                        </p>
                        {generationPhase === 'generating' && (
                          <div className="gen-feedback-box__progress">
                            <div className="gen-feedback-box__progress-fill" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Lower region — button area stays fixed */}
                <div className="gen-btn-area">
                  <AnimatePresence mode="wait">
                    {generationPhase === 'idle' && (
                      <motion.button
                        key="generate"
                        className="generate-btn"
                        onClick={handleGenerateClick}
                        disabled={!prompt.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SparklesIcon />
                        Generate Map
                      </motion.button>
                    )}

                    {generationPhase === 'generating' && (
                      <motion.div
                        key="ticker"
                        className="gen-ticker"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={tickerIndex}
                            className="gen-ticker__message"
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

                    {generationPhase === 'complete' && (
                      <motion.button
                        key="submit"
                        className="gen-submit-btn"
                        onClick={handleSubmit}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        Submit to Teacher
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {generationPhase === 'complete' && (
                      <motion.button
                        className="gen-reset-link"
                        onClick={handleReset}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
                        Create a different map
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="my-maps"
                className="my-maps-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {maps.length === 0 ? (
                  <div className="empty-state">
                    <div className="locked-slots-grid">
                      {lockedSlots.map((_, index) => (
                        <motion.div
                          key={index}
                          className="locked-slot"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="locked-slot__silhouette" />
                          <LockIcon />
                        </motion.div>
                      ))}
                    </div>
                    <h3 className="empty-state__title">Unlock Your Collection!</h3>
                    <p className="empty-state__text">
                      Create maps to fill these slots.<br />
                      Each map you generate unlocks a new space!
                    </p>
                  </div>
                ) : (
                  <div className="maps-grid">
                    {maps.map((map, index) => (
                      <motion.div
                        key={map.id}
                        className="map-card"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div
                          className="map-card__thumbnail"
                          style={{ background: map.thumbnailUrl }}
                        />
                        <div className="map-card__overlay">
                          <span className="map-card__prompt">{map.prompt}</span>
                          <span className="map-card__date">
                            {new Date(map.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`map-card__rarity map-card__rarity--${map.rarity}`}>
                          {map.rarity}
                        </span>
                        <motion.button
                          className="map-card__delete-btn"
                          onClick={(e) => handleDeleteClick(e, map)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <TrashIcon />
                        </motion.button>
                      </motion.div>
                    ))}
                    {maps.length < MAX_SLOTS &&
                      Array.from({ length: MAX_SLOTS - maps.length }).map((_, index) => (
                        <motion.div
                          key={`locked-${index}`}
                          className="locked-slot"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: (maps.length + index) * 0.05 }}
                          style={{ aspectRatio: '1' }}
                        >
                          <div className="locked-slot__silhouette" />
                          <LockIcon />
                        </motion.div>
                      ))
                    }
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {mapToDelete && (
          <motion.div
            className="confirm-dialog-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelDelete}
          >
            <motion.div
              className="confirm-dialog"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="confirm-dialog__title">Delete this map?</h3>
              <p className="confirm-dialog__text">
                "{mapToDelete.prompt}" will be gone forever!
              </p>
              <div className="confirm-dialog__actions">
                <button
                  className="confirm-dialog__btn confirm-dialog__btn--cancel"
                  onClick={handleCancelDelete}
                >
                  Keep it
                </button>
                <button
                  className="confirm-dialog__btn confirm-dialog__btn--delete"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Toast */}
      <AnimatePresence>
        {localWarning && (
          <motion.div
            className="warning-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {localWarning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateMapSideSheet;
