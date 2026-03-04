import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import './LobbyScreen.css';
import './LobbyScreenCompetition.css';
import { MOCK_PLAYERS, HOST_PLAYER, DEFAULT_MAPS } from './data/mockData';
import MapCarousel from './components/MapCarousel';
import CharacterStage from './components/CharacterStage';
import CompetitionSideSheet from './components/CompetitionSideSheet';
import { WinnerCelebration, CompetitionResult } from './components/WinnerCelebration';
import { useCompetition } from './hooks/useCompetition';
import { competitionSoundManager } from './utils/competitionSounds';

// Simple character sprite component
const CharacterSprite = ({ style = 'ghost', size = 80 }) => {
  const styles = {
    ghost: { hair: '#00CED1', skin: '#FFFFFF', outfit: '#FFFFFF', accessory: '#FFD700' },
    explorer: { hair: '#8B4513', skin: '#FFDAB9', outfit: '#D2691E', accessory: '#FFD700' },
    nerd: { hair: '#4A4A4A', skin: '#F5DEB3', outfit: '#2F4F4F', accessory: '#87CEEB' },
    punk: { hair: '#00CED1', skin: '#FFE4E1', outfit: '#2F4F4F', accessory: '#FF69B4' },
    schoolgirl: { hair: '#00CED1', skin: '#FFE4E1', outfit: '#FFFFFF', accessory: '#FF6347' },
    cowboy: { hair: '#DAA520', skin: '#DEB887', outfit: '#8B4513', accessory: '#FFD700' },
    cowgirl: { hair: '#DAA520', skin: '#FFDAB9', outfit: '#D2691E', accessory: '#FF69B4' },
    ninja: { hair: '#1C1C1C', skin: '#F5DEB3', outfit: '#1C1C1C', accessory: '#FF0000' },
  };
  
  const colors = styles[style] || styles.ghost;
  
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 80 100" style={{ imageRendering: 'auto' }}>
      <ellipse cx="40" cy="25" rx="22" ry="18" fill={colors.hair} />
      <ellipse cx="40" cy="32" rx="18" ry="15" fill={colors.skin} />
      <ellipse cx="34" cy="30" rx="3" ry="4" fill="#333" />
      <ellipse cx="46" cy="30" rx="3" ry="4" fill="#333" />
      <rect x="25" y="45" width="30" height="35" rx="8" fill={colors.outfit} />
      <rect x="15" y="48" width="12" height="8" rx="4" fill={colors.skin} />
      <rect x="53" y="48" width="12" height="8" rx="4" fill={colors.skin} />
      <rect x="28" y="78" width="10" height="18" rx="4" fill={colors.outfit} />
      <rect x="42" y="78" width="10" height="18" rx="4" fill={colors.outfit} />
      <circle cx="40" cy="12" r="6" fill={colors.accessory} opacity="0.8" />
    </svg>
  );
};

// Player avatar component with winner crown support
const PlayerAvatar = ({ player, index, isWinner }) => {
  return (
    <motion.div 
      className="player-avatar"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {isWinner && (
        <motion.div 
          className="winner-crown"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          👑
        </motion.div>
      )}
      <div className="player-avatar__sprite">
        <CharacterSprite style={player.avatar} size={70} />
      </div>
      <span className="player-avatar__name">{player.name}</span>
    </motion.div>
  );
};

// Icons
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

/**
 * LobbyScreenCompetition - Simplified competition lobby
 * 
 * Uses single useCompetition hook that handles everything
 */
const LobbyScreenCompetition = ({ onStartCompetition, onSelectWinner }) => {
  // Single unified competition hook
  const competition = useCompetition();
  
  // UI state
  const [showSideSheet, setShowSideSheet] = useState(false);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const [showCompetitionResult, setShowCompetitionResult] = useState(false);
  const [winnerId, setWinnerId] = useState(null);
  
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
    competitionSoundManager.play(soundName);
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

  // Handle competition start - instantly opens side sheet
  const handleStartCompetition = useCallback(() => {
    competition.start();
    setShowSideSheet(true);
  }, [competition]);

  // Handle winner selection
  const handleSelectWinner = useCallback((forceCurrentUser = false) => {
    if (forceCurrentUser && competition.hasSubmitted) {
      competition.selectCurrentUserAsWinner();
    } else {
      competition.selectWinner();
    }
  }, [competition]);

  // Handle celebration/result close
  const handleCelebrationClose = useCallback(() => {
    setShowWinnerCelebration(false);
    setShowCompetitionResult(false);
    competition.reset();
    setWinnerId(null);
  }, [competition]);

  // Close side sheet
  const handleCloseSideSheet = useCallback(() => {
    if (competition.state === 'active') return;
    setShowSideSheet(false);
  }, [competition.state]);

  // Expose controls for external use
  useEffect(() => {
    if (onStartCompetition) {
      onStartCompetition.current = handleStartCompetition;
    }
    if (onSelectWinner) {
      onSelectWinner.current = handleSelectWinner;
    }
  }, [handleStartCompetition, handleSelectWinner, onStartCompetition, onSelectWinner]);

  return (
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
    </div>
  );
};

export default LobbyScreenCompetition;
