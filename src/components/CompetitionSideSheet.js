import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CompetitionSideSheet.css';

const QUICK_THEMES = [
  { id: 'volcano', emoji: '🌋', label: 'Volcano', prompt: 'underwater volcano' },
  { id: 'candy', emoji: '🍭', label: 'Candy', prompt: 'candy kingdom' },
  { id: 'haunted', emoji: '👻', label: 'Haunted', prompt: 'haunted castle' },
  { id: 'space', emoji: '🚀', label: 'Space', prompt: 'space station' },
  { id: 'ocean', emoji: '🌊', label: 'Ocean', prompt: 'ocean depths' },
  { id: 'jungle', emoji: '🌴', label: 'Jungle', prompt: 'jungle temple' },
];

/**
 * CompetitionSideSheet - Simplified single-screen competition UI
 * 
 * Features:
 * - Prominent timer
 * - "Generations left" counter
 * - Quick themes for one-click generation
 * - Inline map preview (doesn't replace creation UI)
 * - Fast 0.8s generation
 */
const CompetitionSideSheet = ({
  isOpen,
  competition,
  onClose,
  playSound,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMap, setGeneratedMap] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  
  const inputRef = useRef(null);
  const generationTimeoutRef = useRef(null);

  const {
    state,
    formattedTime,
    progress,
    timerState,
    generationsLeft,
    submissionCount,
    hasSubmitted,
    submittedMap,
    currentDraft,
    generate,
    submit,
  } = competition;

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setIsGenerating(false);
      setGeneratedMap(null);
      setStatusMessage(null);
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (isOpen && inputRef.current && !hasSubmitted && !isGenerating) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, hasSubmitted, isGenerating]);

  // Show auto-submit message when time ends
  useEffect(() => {
    if (state === 'review' && !hasSubmitted && currentDraft) {
      setStatusMessage({ type: 'auto', text: 'Auto-submitted!' });
    } else if (state === 'review' && !hasSubmitted && !currentDraft) {
      setStatusMessage({ type: 'none', text: 'No map submitted' });
    }
  }, [state, hasSubmitted, currentDraft]);

  // Handle generation
  const doGenerate = useCallback((promptText) => {
    if (!promptText.trim() || isGenerating || hasSubmitted || generationsLeft <= 0) return;
    
    setIsGenerating(true);
    playSound?.('generate');
    
    // Fast 0.8s generation
    generationTimeoutRef.current = setTimeout(() => {
      const map = generate(promptText);
      if (map) {
        setGeneratedMap(map);
        playSound?.('reveal');
      }
      setIsGenerating(false);
    }, 800);
  }, [isGenerating, hasSubmitted, generationsLeft, generate, playSound]);

  // Handle quick theme click
  const handleQuickTheme = useCallback((theme) => {
    if (hasSubmitted || isGenerating || generationsLeft <= 0) return;
    setPrompt(theme.prompt);
    playSound?.('click');
    doGenerate(theme.prompt);
  }, [hasSubmitted, isGenerating, generationsLeft, playSound, doGenerate]);

  // Handle generate button click
  const handleGenerateClick = useCallback(() => {
    doGenerate(prompt);
  }, [prompt, doGenerate]);

  // Handle try again
  const handleTryAgain = useCallback(() => {
    if (generationsLeft <= 0) return;
    setGeneratedMap(null);
    setPrompt('');
    playSound?.('click');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [generationsLeft, playSound]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!generatedMap || hasSubmitted) return;
    const success = submit(generatedMap);
    if (success) {
      playSound?.('submit');
      setStatusMessage({ type: 'success', text: 'Submitted!' });
    }
  }, [generatedMap, hasSubmitted, submit, playSound]);

  // Handle Enter key
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && prompt.trim() && !isGenerating && !hasSubmitted && generationsLeft > 0) {
      doGenerate(prompt);
    }
  }, [prompt, isGenerating, hasSubmitted, generationsLeft, doGenerate]);

  // Timer bar class
  const getTimerBarClass = () => {
    let classes = 'comp-timer-bar';
    if (timerState === 'warning') classes += ' warning';
    if (timerState === 'critical') classes += ' critical';
    if (timerState === 'ended') classes += ' ended';
    return classes;
  };

  const canGenerate = !isGenerating && !hasSubmitted && generationsLeft > 0 && state === 'active';
  const showNudge = generationsLeft === 0 && generatedMap && !hasSubmitted && state === 'active';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="comp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={state !== 'active' ? onClose : undefined}
          />
          
          <motion.div
            className={`comp-side-sheet ${timerState === 'critical' ? 'urgent' : ''}`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            {/* Timer Bar */}
            <div className={getTimerBarClass()}>
              <div className="timer-row">
                <span className="timer-label">TIME</span>
                <span className={`timer-value ${timerState}`}>
                  {timerState === 'ended' ? "TIME'S UP" : formattedTime}
                </span>
              </div>
              <div className="timer-bar-track">
                <motion.div 
                  className="timer-bar-fill"
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Generations Counter */}
            <div className="generations-counter">
              <span className="gen-label">Generations:</span>
              <div className="gen-badges">
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className={`gen-badge ${i < generationsLeft ? 'active' : 'used'}`}
                    animate={i === generationsLeft - 1 && generationsLeft > 0 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
              <span className="gen-text">{generationsLeft} left</span>
            </div>

            {/* Status Bar */}
            <div className="comp-status">
              <span className="status-count">{submissionCount}</span> students submitted
            </div>

            {/* Main Content */}
            <div className="comp-content">
              {/* Status Message (submitted, auto-submitted, no submission) */}
              <AnimatePresence>
                {(hasSubmitted || statusMessage) && (
                  <motion.div
                    className={`status-banner ${statusMessage?.type || 'success'}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {hasSubmitted ? '✓ Submitted! Waiting for results...' : statusMessage?.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Section */}
              <div className="input-section">
                <label className="input-label">Your map idea:</label>
                <input
                  ref={inputRef}
                  type="text"
                  className="prompt-input"
                  placeholder="Type an idea or pick a theme..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={50}
                  disabled={!canGenerate}
                />
              </div>

              {/* Quick Themes */}
              <div className="quick-themes">
                {QUICK_THEMES.map((theme) => (
                  <motion.button
                    key={theme.id}
                    className="theme-btn"
                    onClick={() => handleQuickTheme(theme)}
                    disabled={!canGenerate}
                    whileHover={canGenerate ? { scale: 1.05 } : {}}
                    whileTap={canGenerate ? { scale: 0.95 } : {}}
                  >
                    <span className="theme-emoji">{theme.emoji}</span>
                    <span className="theme-name">{theme.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Generate Button */}
              <motion.button
                className="generate-btn"
                onClick={handleGenerateClick}
                disabled={!prompt.trim() || !canGenerate}
                whileHover={prompt.trim() && canGenerate ? { scale: 1.02 } : {}}
                whileTap={prompt.trim() && canGenerate ? { scale: 0.98 } : {}}
              >
                {isGenerating ? (
                  <span className="generating-text">
                    <span className="spinner-small" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <span className="btn-icon">⚡</span>
                    GENERATE ({generationsLeft} left)
                  </>
                )}
              </motion.button>

              {/* Nudge when out of generations */}
              {showNudge && (
                <motion.div
                  className="submit-nudge"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ⬇️ No more tries! Submit your map below!
                </motion.div>
              )}

              {/* Generated Map Preview */}
              <AnimatePresence>
                {(generatedMap || isGenerating) && (
                  <motion.div
                    className="preview-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="preview-header">Your Map:</div>
                    
                    <div className={`map-card ${isGenerating ? 'generating' : ''}`}>
                      {isGenerating ? (
                        <div className="map-shimmer" />
                      ) : (
                        <>
                          <div 
                            className="map-image"
                            style={{ background: generatedMap?.imageUrl }}
                          />
                          <div className="map-prompt">{generatedMap?.prompt}</div>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    {!isGenerating && generatedMap && !hasSubmitted && state === 'active' && (
                      <div className="action-row">
                        <motion.button
                          className="try-again-btn"
                          onClick={handleTryAgain}
                          disabled={generationsLeft <= 0}
                          whileHover={generationsLeft > 0 ? { scale: 1.02 } : {}}
                          whileTap={generationsLeft > 0 ? { scale: 0.98 } : {}}
                        >
                          {generationsLeft > 0 ? `🔄 Try Again (${generationsLeft})` : '🔒 No tries left'}
                        </motion.button>
                        <motion.button
                          className="submit-btn"
                          onClick={handleSubmit}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ✅ SUBMIT
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submitted Map Display */}
              {hasSubmitted && submittedMap && (
                <motion.div
                  className="submitted-preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="preview-header">Your Submitted Map:</div>
                  <div className="map-card submitted">
                    <div 
                      className="map-image"
                      style={{ background: submittedMap.imageUrl }}
                    />
                    <div className="map-prompt">"{submittedMap.prompt}"</div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CompetitionSideSheet;
