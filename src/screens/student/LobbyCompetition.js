import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CompetitionDemoPage.css';
import './LobbyScreen.css';
import './LobbyScreenCompetition.css';
import { MOCK_PLAYERS, HOST_PLAYER, DEFAULT_MAPS } from '../../data/mockData';
import MapCarousel from '../../components/teacher/MapCarousel';
import CharacterStage from '../../components/shared/CharacterStage';
import PlayerAvatar from '../../components/shared/PlayerAvatar';
import { UsersIcon, MenuIcon, ExpandIcon, InfoIcon } from '../../components/shared/icons';
import CompetitionSideSheet from '../../components/student/CompetitionSideSheet';
import { WinnerCelebration, CompetitionResult } from '../../components/shared/WinnerCelebration';
import { useCompetition } from '../../hooks/useCompetition';
import { competitionSoundManager } from '../../utils/competitionSounds';

/**
 * CompetitionDemoPage - Simplified demo page
 * 
 * Uses single useCompetition hook that handles everything
 */
const CompetitionDemoPage = () => {
  // Single unified competition hook
  const competition = useCompetition();
  
  // UI state
  const [showSideSheet, setShowSideSheet] = useState(false);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const [showCompetitionResult, setShowCompetitionResult] = useState(false);
  const [winnerId, setWinnerId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Player layout
  const leftPlayers = MOCK_PLAYERS.slice(0, 5);
  const centerLeftPlayers = MOCK_PLAYERS.slice(5, 8);
  const centerRightPlayers = MOCK_PLAYERS.slice(8, 11);
  const rightPlayers = MOCK_PLAYERS.slice(11, 17);
  const farRightPlayers = MOCK_PLAYERS.slice(17);

  // Initialize sound on first interaction
  useEffect(() => {
    const initSound = () => {
      competitionSoundManager.init();
      document.removeEventListener('click', initSound);
    };
    document.addEventListener('click', initSound);
    return () => document.removeEventListener('click', initSound);
  }, []);

  // Play sound helper
  const playSound = useCallback((soundName) => {
    if (!isMuted) {
      competitionSoundManager.play(soundName);
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      competitionSoundManager.setMuted(!prev);
      return !prev;
    });
  }, []);

  // Play sounds based on timer state changes
  useEffect(() => {
    if (competition.state !== 'active') return;
    
    if (competition.timerState === 'warning') {
      playSound('warning');
    }
    if (competition.remaining <= 5 && competition.remaining > 0) {
      playSound('tick');
    }
  }, [competition.timerState, competition.remaining, competition.state, playSound]);

  // Handle timer ending
  useEffect(() => {
    if (competition.state === 'review') {
      playSound('timesUp');
    }
  }, [competition.state, playSound]);

  // Handle competition ending (winner selected)
  useEffect(() => {
    if (competition.state === 'ended' && competition.winner) {
      setShowSideSheet(false);
      setWinnerId(competition.winner.id);
      
      if (competition.isCurrentUserWinner) {
        setShowWinnerCelebration(true);
        playSound('winner');
      } else {
        setShowCompetitionResult(true);
        playSound('result');
      }
    }
  }, [competition.state, competition.winner, competition.isCurrentUserWinner, playSound]);

  // Start competition - instantly opens side sheet
  const handleStartCompetition = useCallback(() => {
    if (competition.state !== 'idle') return;
    competition.start();
    setShowSideSheet(true);
  }, [competition]);

  // Select random winner
  const handleSelectRandomWinner = useCallback(() => {
    if (competition.state !== 'review') return;
    competition.selectWinner();
  }, [competition]);

  // Select current user as winner
  const handleSelectCurrentUserWinner = useCallback(() => {
    if (competition.state !== 'review' || !competition.hasSubmitted) return;
    competition.selectCurrentUserAsWinner();
  }, [competition]);

  // Handle celebration close
  const handleCelebrationClose = useCallback(() => {
    setShowWinnerCelebration(false);
    setShowCompetitionResult(false);
    competition.reset();
    setWinnerId(null);
  }, [competition]);

  // Close side sheet (only when not active)
  const handleCloseSideSheet = useCallback(() => {
    if (competition.state === 'active') return;
    setShowSideSheet(false);
  }, [competition.state]);

  // Reset everything
  const handleReset = useCallback(() => {
    competition.reset();
    setShowSideSheet(false);
    setShowWinnerCelebration(false);
    setShowCompetitionResult(false);
    setWinnerId(null);
  }, [competition]);

  return (
    <div className="competition-demo-page">
      {/* Lobby Screen */}
      <div className={`lobby-screen ${competition.state !== 'idle' ? 'competition-active' : ''}`}>
        {/* Header */}
        <header className="lobby-header">
          <div className="lobby-header__left">
            {competition.state !== 'idle' && (
              <motion.div 
                className="competition-indicator"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="competition-indicator__dot" />
                <span className="competition-indicator__text">
                  {competition.state === 'active' ? 'COMPETITION LIVE' : 
                   competition.state === 'review' ? 'UNDER REVIEW' : 'ENDED'}
                </span>
              </motion.div>
            )}
          </div>

          <div className="lobby-header__center">
            <span className="lobby-status">
              {competition.state === 'idle' 
                ? 'Waiting for the host to start...'
                : competition.state === 'active'
                ? 'Map Competition in Progress!'
                : 'Selecting Winner...'}
            </span>
            <div className="player-count">
              <UsersIcon />
              <span>22</span>
            </div>
          </div>

          <div className="lobby-header__right">
            <div className="coins-display">
              <span className="coins-icon">💰</span>
              <span>938 402</span>
            </div>
            <motion.button 
              className="theme-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎨 Theme
            </motion.button>
            
            <button className="icon-btn">
              <MenuIcon />
            </button>
            <button className="icon-btn">
              <ExpandIcon />
            </button>
          </div>
        </header>

        {/* Answer explanation banner */}
        <div className="answer-banner">
          Your teacher has enabled Answer Explanation
          <InfoIcon />
        </div>

        {/* Main content with players and stage */}
        <main className="lobby-content">
          <div className="players-grid">
            <div className="players-column players-column--left">
              {leftPlayers.map((player, i) => (
                <PlayerAvatar 
                  key={player.id} 
                  player={player} 
                  index={i}
                  isWinner={winnerId === player.id}
                />
              ))}
            </div>

            <div className="players-column">
              {centerLeftPlayers.map((player, i) => (
                <PlayerAvatar 
                  key={player.id} 
                  player={player} 
                  index={i + 5}
                  isWinner={winnerId === player.id}
                />
              ))}
            </div>

            <CharacterStage host={HOST_PLAYER} />

            <div className="players-column">
              {centerRightPlayers.map((player, i) => (
                <PlayerAvatar 
                  key={player.id} 
                  player={player} 
                  index={i + 8}
                  isWinner={winnerId === player.id}
                />
              ))}
            </div>

            <div className="players-column players-column--right">
              {rightPlayers.map((player, i) => (
                <PlayerAvatar 
                  key={player.id} 
                  player={player} 
                  index={i + 11}
                  isWinner={winnerId === player.id}
                />
              ))}
            </div>

            <div className="players-column">
              {farRightPlayers.map((player, i) => (
                <PlayerAvatar 
                  key={player.id} 
                  player={player} 
                  index={i + 17}
                  isWinner={winnerId === player.id}
                />
              ))}
            </div>
          </div>
        </main>

        <MapCarousel 
          defaultMaps={DEFAULT_MAPS}
          customMaps={[]}
          onMapClick={() => {}}
        />
      </div>

      {/* Competition Side Sheet */}
      <CompetitionSideSheet
        isOpen={showSideSheet}
        competition={competition}
        onClose={handleCloseSideSheet}
        playSound={playSound}
      />

      {/* Winner Celebration */}
      <WinnerCelebration
        isVisible={showWinnerCelebration}
        winningMap={competition.winner}
        onClose={handleCelebrationClose}
        playSound={playSound}
      />

      {/* Competition Result (non-winner) */}
      <CompetitionResult
        isVisible={showCompetitionResult}
        winningMap={competition.winner}
        onClose={handleCelebrationClose}
        playSound={playSound}
      />

      {/* Demo Control Panel */}
      <motion.div 
        className="demo-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="demo-panel__header">
          <div className="demo-panel__title">
            🎮 Teacher Controls
            <span className="demo-panel__badge">DEMO</span>
          </div>
          <button 
            className="demo-panel__mute"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Status Display */}
        <div className="demo-panel__status">
          <div className="demo-panel__status-item">
            <span className="demo-panel__status-label">State</span>
            <span className={`demo-panel__status-value ${competition.state}`}>
              {competition.state.toUpperCase()}
            </span>
          </div>
          <div className="demo-panel__status-item">
            <span className="demo-panel__status-label">Time</span>
            <span className="demo-panel__status-value">
              {competition.formattedTime}
            </span>
          </div>
          <div className="demo-panel__status-item">
            <span className="demo-panel__status-label">Submissions</span>
            <span className="demo-panel__status-value">
              {competition.submissionCount}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="demo-panel__actions">
          {competition.state === 'idle' && (
            <button
              className="demo-btn demo-btn--primary"
              onClick={handleStartCompetition}
            >
              <span className="demo-btn__icon">🚀</span>
              Start Competition
            </button>
          )}

          {competition.state === 'review' && (
            <>
              <button
                className="demo-btn demo-btn--success"
                onClick={handleSelectRandomWinner}
              >
                <span className="demo-btn__icon">🎲</span>
                Select Random Winner
              </button>
              
              {competition.hasSubmitted && (
                <button
                  className="demo-btn demo-btn--secondary"
                  onClick={handleSelectCurrentUserWinner}
                >
                  <span className="demo-btn__icon">👑</span>
                  Make Me Win (Demo)
                </button>
              )}
            </>
          )}

          {competition.state !== 'idle' && (
            <button
              className="demo-btn demo-btn--secondary"
              onClick={handleReset}
            >
              <span className="demo-btn__icon">🔄</span>
              Reset
            </button>
          )}
        </div>

        {/* Back Link */}
        <Link to="/" className="demo-panel__back">
          ← Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default CompetitionDemoPage;
