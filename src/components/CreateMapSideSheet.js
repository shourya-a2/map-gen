import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CreateMapSideSheet.css';
import { MOCK_THUMBNAILS, EXAMPLE_PROMPTS } from '../data/mockData';
import { useMapStore } from '../hooks/useMapStore';
import {
  THEME_PALETTES,
  CHIP_PREVIEWS,
  BUILDING_STAGES,
  calculateRarity,
  detectTheme,
  isLowEndDevice,
  soundManager,
  InputSparkle,
  FloatingParticle,
  BurstParticle,
  BuildingAnimation,
  MapIcon,
  SparklesIcon,
  CloseIcon,
  TrashIcon,
  LockIcon,
  SoundOnIcon,
  SoundOffIcon,
  CheckIcon,
  MAX_CHARS,
  MAX_SLOTS,
} from '../utils/mapCreatorUtils';

const CreateMapSideSheet = ({ onClose, onMapGenerated, getMapButtonPosition, onFlyComplete, initialTab = 'create' }) => {
  const { maps, addMap, deleteMap, isAtLimit, maxMaps } = useMapStore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('idle'); // idle, building, tension, burst, reveal, complete
  const [buildingStage, setBuildingStage] = useState(0);
  const [buildingProgress, setBuildingProgress] = useState(0);
  const [mapToDelete, setMapToDelete] = useState(null);
  const [localWarning, setLocalWarning] = useState(null);
  const [detectedTheme, setDetectedTheme] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isTypewriting, setIsTypewriting] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [burstParticles, setBurstParticles] = useState([]);
  const [particlePhase, setParticlePhase] = useState('burst');
  const [generatedMap, setGeneratedMap] = useState(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
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
      if (e.key === 'Escape' && !isGenerating && !isClosing) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, isClosing]);

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
    if (isGenerating || isTypewriting) return;
    
    soundManager.playPillClick();
    setIsTypewriting(true);
    setPrompt('');
    
    for (let i = 0; i <= example.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setPrompt(example.slice(0, i));
    }
    
    setIsTypewriting(false);
  };

  const createBurstParticles = () => {
    const particles = [];
    const colors = THEME_PALETTES[detectedTheme] || THEME_PALETTES.default;
    for (let i = 0; i < 30; i++) {
      particles.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setBurstParticles(particles);
  };

  const handleGenerateClick = async (e) => {
    if (!prompt.trim() || isGenerating) return;
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();
    setRipples(prev => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);
    
    if (isAtLimit) {
      setLocalWarning(`You've reached the maximum of ${maxMaps} maps! Delete some to create more.`);
      setTimeout(() => setLocalWarning(null), 4000);
      return;
    }

    setIsGenerating(true);
    setGenerationPhase('building');
    setBuildingStage(0);
    setBuildingProgress(0);
    
    // Start sounds
    soundManager.playGenerationStart();
    soundManager.startAmbientHum();

    // Building animation stages
    for (let stage = 0; stage < BUILDING_STAGES.length; stage++) {
      setBuildingStage(stage);
      const stageDuration = BUILDING_STAGES[stage].duration;
      const steps = 20;
      
      for (let step = 0; step <= steps; step++) {
        setBuildingProgress(step / steps);
        await new Promise(resolve => setTimeout(resolve, stageDuration / steps));
      }
    }

    // Rise ambient pitch during final stage
    soundManager.riseAmbientPitch(0.5);

    // Tension buildup
    setGenerationPhase('tension');
    soundManager.playTensionBuildup();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Stop ambient
    soundManager.stopAmbientHum();

    // Simulate potential failure (for demo)
    if (simulateFailure()) {
      // Error phase
      setGenerationPhase('error');
      soundManager.playError();
      setSuggestedPrompts(generateSuggestions(prompt));
      setGenerationError({
        message: "Oops! Our map maker got confused 🤔",
        subtext: "Try describing your map differently"
      });
      return;
    }
    
    // Burst phase
    setGenerationPhase('burst');
    createBurstParticles();
    setParticlePhase('burst');
    soundManager.playBurst();
    await new Promise(resolve => setTimeout(resolve, 400));

    // Create the map
    const newMap = {
      id: crypto.randomUUID(),
      prompt: prompt.trim(),
      thumbnailUrl: MOCK_THUMBNAILS[Math.floor(Math.random() * MOCK_THUMBNAILS.length)],
      createdAt: Date.now(),
      rarity: calculateRarity(prompt),
    };
    setGeneratedMap(newMap);

    // Reveal phase
    setGenerationPhase('reveal');
    setParticlePhase('return');
    soundManager.playRevealSuccess();
    await new Promise(resolve => setTimeout(resolve, 700));

    // Settle
    soundManager.playSettleClick();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Complete
    setGenerationPhase('complete');
    setBurstParticles([]);
    
    // Add to store
    const success = addMap(newMap);
    
    if (success) {
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 2000);
      
      if (onMapGenerated) {
        onMapGenerated(newMap);
      }
    }
  };

  // Close animation - side sheet slides out while thumbnail flies to button
  const handleClose = useCallback(async () => {
    if (isClosing || isGenerating) return;
    
    setIsClosing(true);
    soundManager.playPillClick();
    
    // If we have a generated map, trigger the fly complete for button effect
    if (generatedMap || maps.length > 0) {
      // Small delay for the sheet to start closing
      setTimeout(() => {
        onFlyComplete?.();
      }, 200);
    }
    
    // Wait for slide out animation (0.3s)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onClose();
  }, [isClosing, isGenerating, generatedMap, maps.length, onFlyComplete, onClose]);

  const handleUseMap = () => {
    setIsGenerating(false);
    setGenerationPhase('idle');
    setPrompt('');
    setGeneratedMap(null);
    handleClose();
  };

  const handleCreateAnother = () => {
    setIsGenerating(false);
    setGenerationPhase('idle');
    setPrompt('');
    setGeneratedMap(null);
    setGenerationError(null);
  };

  // Generate alternative suggestions based on prompt
  const generateSuggestions = (originalPrompt) => {
    const words = originalPrompt.toLowerCase().split(/\s+/);
    const suggestions = [];
    
    // Find related prompts from EXAMPLE_PROMPTS
    EXAMPLE_PROMPTS.forEach(example => {
      if (words.some(word => example.toLowerCase().includes(word))) {
        suggestions.push(example);
      }
    });
    
    // Add some generic alternatives if we don't have enough
    if (suggestions.length < 3) {
      const alternatives = [
        `${words[0] || 'magical'} kingdom`,
        `mysterious ${words[words.length - 1] || 'island'}`,
        `enchanted ${words[0] || 'forest'} realm`
      ];
      alternatives.forEach(alt => {
        if (suggestions.length < 3) suggestions.push(alt);
      });
    }
    
    return suggestions.slice(0, 3);
  };

  // Simulate random failure (for demo purposes - 10% chance)
  const simulateFailure = () => {
    return Math.random() < 0.1; // 10% failure rate for demo
  };

  const handleRetry = () => {
    setGenerationError(null);
    setGenerationPhase('idle');
    setIsGenerating(false);
  };

  const handleUseSuggestion = (suggestion) => {
    setPrompt(suggestion);
    setGenerationError(null);
    setGenerationPhase('idle');
    setIsGenerating(false);
  };

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

  // Render generation experience
  const renderGenerationExperience = () => {
    if (generationPhase === 'building') {
      return (
        <motion.div 
          className="generation-experience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="building-container"
            animate={{ 
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <BuildingAnimation 
              theme={detectedTheme} 
              stage={buildingStage} 
              progress={buildingProgress}
            />
          </motion.div>
          <motion.p 
            key={buildingStage}
            className="generation-label"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {BUILDING_STAGES[buildingStage]?.label || 'Creating...'}
          </motion.p>
          <div className="generation-progress-bar">
            <motion.div 
              className="generation-progress-fill"
              animate={{ width: `${((buildingStage + buildingProgress) / BUILDING_STAGES.length) * 100}%` }}
            />
          </div>
        </motion.div>
      );
    }

    if (generationPhase === 'tension' || generationPhase === 'burst') {
      return (
        <motion.div 
          className="generation-experience"
          initial={{ opacity: 1 }}
        >
          <motion.div 
            className="building-container"
            animate={generationPhase === 'tension' ? {
              scale: [1, 1.05, 1, 1.05, 1],
              filter: ['saturate(1)', 'saturate(1.5)', 'saturate(1)', 'saturate(1.5)', 'saturate(1)'],
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <BuildingAnimation 
              theme={detectedTheme} 
              stage={2} 
              progress={1}
            />
            {/* Burst particles */}
            <div className="burst-particles-container">
              {burstParticles.map(particle => (
                <BurstParticle
                  key={particle.id}
                  id={particle.id}
                  x={160}
                  y={100}
                  color={particle.color}
                  phase={particlePhase}
                  centerX={160}
                  centerY={100}
                />
              ))}
            </div>
          </motion.div>
          {generationPhase === 'burst' && (
            <motion.div 
              className="screen-flash"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.div>
      );
    }

    if (generationPhase === 'reveal' || generationPhase === 'complete') {
      return (
        <motion.div 
          className="generation-experience reveal-phase"
          initial={{ opacity: 1 }}
        >
          {/* Returning particles */}
          {generationPhase === 'reveal' && (
            <div className="burst-particles-container">
              {burstParticles.map(particle => (
                <BurstParticle
                  key={particle.id}
                  id={particle.id}
                  x={160}
                  y={100}
                  color={particle.color}
                  phase="return"
                  centerX={160}
                  centerY={100}
                />
              ))}
            </div>
          )}
          
          {/* Revealed map */}
          <motion.div
            className="revealed-map"
            initial={{ scale: 0.3, rotate: 5, opacity: 0 }}
            animate={{ 
              scale: generationPhase === 'complete' ? 1 : [0.3, 1.15, 1],
              rotate: 0,
              opacity: 1,
            }}
            transition={{ 
              type: 'spring',
              damping: 12,
              stiffness: 200,
            }}
            style={{ background: generatedMap?.thumbnailUrl }}
          >
            <div className="revealed-map__glow" />
            {generatedMap?.rarity && (
              <span className={`revealed-map__rarity revealed-map__rarity--${generatedMap.rarity}`}>
                {generatedMap.rarity}
              </span>
            )}
          </motion.div>

          {generationPhase === 'complete' && (
            <motion.div
              className="reveal-complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="reveal-message">🗺️ Your map is ready! ✨</p>
              <p className="reveal-prompt">"{generatedMap?.prompt}"</p>
              
              <div className="reveal-actions">
                <motion.button
                  className="reveal-btn reveal-btn--submit"
                  onClick={handleUseMap}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  ✓ Submit Map
                </motion.button>
                <motion.button
                  className="reveal-btn reveal-btn--secondary"
                  onClick={handleCreateAnother}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Create Another
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      );
    }

    // Error state
    if (generationPhase === 'error') {
      return (
        <motion.div 
          className="generation-experience error-phase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Broken/glitched canvas effect */}
          <motion.div 
            className="error-canvas-container"
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.02, 0.98, 1],
              filter: ['grayscale(0)', 'grayscale(0.8)', 'grayscale(0.5)', 'grayscale(0.8)']
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="error-canvas">
              <div className="error-crack error-crack--1" />
              <div className="error-crack error-crack--2" />
              <div className="error-crack error-crack--3" />
              <div className="error-glitch-overlay" />
            </div>
          </motion.div>

          <motion.div
            className="error-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="error-message">{generationError?.message}</p>
            <p className="error-subtext">{generationError?.subtext}</p>

            {suggestedPrompts.length > 0 && (
              <div className="error-suggestions">
                <p className="error-suggestions__label">Did you mean:</p>
                <div className="error-suggestions__list">
                  {suggestedPrompts.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      className="error-suggestion-chip"
                      onClick={() => handleUseSuggestion(suggestion)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <motion.button
              className="reveal-btn reveal-btn--primary"
              onClick={handleRetry}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Try Again
            </motion.button>
          </motion.div>
        </motion.div>
      );
    }

    return null;
  };

  // Handle overlay click
  const handleOverlayClick = () => {
    if (isGenerating || isClosing) return;
    handleClose();
  };

  return (
    <div className="side-sheet-overlay" onClick={handleOverlayClick}>
      <motion.div
        ref={sheetRef}
        className={`side-sheet ${generationPhase === 'tension' ? 'side-sheet--generating' : ''}`}
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

        {/* Save indicator */}
        <AnimatePresence>
          {showSaveIndicator && (
            <motion.div
              className="save-indicator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CheckIcon /> Saved to My Maps
            </motion.div>
          )}
        </AnimatePresence>

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
            {!isGenerating && !isClosing && (
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

        {/* Tabs - hidden during generation */}
        {!isGenerating && (
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
          {isGenerating ? (
            renderGenerationExperience()
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'create' ? (
                <motion.div
                  key="create"
                  className="create-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
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
                        disabled={isGenerating || isTypewriting}
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

                  {/* Generate Button */}
                  <motion.button
                    className="generate-btn"
                    onClick={handleGenerateClick}
                    disabled={!prompt.trim() || isGenerating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {ripples.map(ripple => (
                      <span
                        key={ripple.id}
                        className="ripple"
                        style={{ left: ripple.x, top: ripple.y }}
                      />
                    ))}
                    <SparklesIcon />
                    Generate Map
                  </motion.button>

                  {/* Example Prompts with previews */}
                  <div className="example-prompts">
                    <span className="example-prompts__label">Need inspiration? Try these:</span>
                    <div className="example-prompts__list">
                      {EXAMPLE_PROMPTS.map((example, index) => (
                        <div key={index} className="example-chip-wrapper">
                          <motion.button
                            className="example-chip"
                            onClick={() => handleExampleClick(example)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isGenerating || isTypewriting}
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
          )}
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
