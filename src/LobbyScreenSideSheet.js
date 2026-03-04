import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreen.css';
import { MOCK_PLAYERS, HOST_PLAYER, DEFAULT_MAPS } from './data/mockData';
import CreateMapSideSheet from './components/CreateMapSideSheet';
import MapCarousel from './components/MapCarousel';
import CharacterStage from './components/CharacterStage';
import { useMapStore } from './hooks/useMapStore';

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
  const scale = size / 80;
  
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 80 100" style={{ imageRendering: 'auto' }}>
      {/* Hair/Head top */}
      <ellipse cx="40" cy="25" rx="22" ry="18" fill={colors.hair} />
      {/* Face */}
      <ellipse cx="40" cy="32" rx="18" ry="15" fill={colors.skin} />
      {/* Eyes */}
      <ellipse cx="34" cy="30" rx="3" ry="4" fill="#333" />
      <ellipse cx="46" cy="30" rx="3" ry="4" fill="#333" />
      {/* Body */}
      <rect x="25" y="45" width="30" height="35" rx="8" fill={colors.outfit} />
      {/* Arms */}
      <rect x="15" y="48" width="12" height="8" rx="4" fill={colors.skin} />
      <rect x="53" y="48" width="12" height="8" rx="4" fill={colors.skin} />
      {/* Legs */}
      <rect x="28" y="78" width="10" height="18" rx="4" fill={colors.outfit} />
      <rect x="42" y="78" width="10" height="18" rx="4" fill={colors.outfit} />
      {/* Accessory (hat/glasses indicator) */}
      <circle cx="40" cy="12" r="6" fill={colors.accessory} opacity="0.8" />
    </svg>
  );
};

// Player avatar component
const PlayerAvatar = ({ player, index }) => {
  return (
    <motion.div 
      className="player-avatar"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="player-avatar__sprite">
        <CharacterSprite style={player.avatar} size={70} />
      </div>
      <span className="player-avatar__name">{player.name}</span>
    </motion.div>
  );
};

// Icons
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

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

const LobbyScreenSideSheet = () => {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetStartTab, setSideSheetStartTab] = useState('create');
  const [selectedMapForPreview, setSelectedMapForPreview] = useState(null);
  const [isButtonPulsing, setIsButtonPulsing] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [badgeText, setBadgeText] = useState('');
  const { maps } = useMapStore();
  const createMapButtonRef = useRef(null);
  const prevMapCount = useRef(maps.length);
  
  // Split players into columns for display
  const leftPlayers = MOCK_PLAYERS.slice(0, 5);
  const centerLeftPlayers = MOCK_PLAYERS.slice(5, 8);
  const centerRightPlayers = MOCK_PLAYERS.slice(8, 11);
  const rightPlayers = MOCK_PLAYERS.slice(11, 17);
  const farRightPlayers = MOCK_PLAYERS.slice(17);

  // Track map count changes for badge
  useEffect(() => {
    prevMapCount.current = maps.length;
  }, [maps.length]);

  const handleOpenSideSheet = (tab = 'create') => {
    setSideSheetStartTab(tab);
    setIsSideSheetOpen(true);
    setIsButtonPulsing(false);
    setShowBadge(false);
  };

  const handleCloseSideSheet = useCallback(() => {
    setIsSideSheetOpen(false);
  }, []);

  // Called when side sheet closes after creating a map
  const handleSideSheetFlyComplete = useCallback(() => {
    // Trigger button catch animation
    setIsButtonPulsing(true);
    
    // Show badge with map count
    const count = maps.length;
    setBadgeText(count === 1 ? '+1' : `${count} maps`);
    setShowBadge(true);
    
    // Stop pulsing after 3 seconds
    setTimeout(() => {
      setIsButtonPulsing(false);
    }, 3000);
    
    // Fade badge after 5 seconds
    setTimeout(() => {
      setShowBadge(false);
    }, 5000);
  }, [maps.length]);

  const handleMapGenerated = (newMap) => {
    console.log('New map created:', newMap.prompt);
  };

  const handleMapClick = (map) => {
    setSelectedMapForPreview(map);
  };

  const handleClosePreview = () => {
    setSelectedMapForPreview(null);
  };

  // Get Create Custom Map button position for fly animation
  const getCreateMapButtonPosition = useCallback(() => {
    if (createMapButtonRef.current) {
      const rect = createMapButtonRef.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      };
    }
    return null;
  }, []);

  // When button is clicked after catching animation, open to My Maps tab
  const handleCreateMapClick = () => {
    // If we just caught a map (button is pulsing), open to My Maps tab
    // Otherwise open to Create tab
    const tab = isButtonPulsing ? 'my-maps' : 'create';
    handleOpenSideSheet(tab);
  };

  return (
    <div className="lobby-screen">
      {/* Header */}
      <header className="lobby-header">
        <div className="lobby-header__left">
          {/* Create Custom Map Button - Target for fly animation */}
          <motion.button 
            ref={createMapButtonRef}
            className={`create-map-btn ${isButtonPulsing ? 'create-map-btn--pulsing' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateMapClick}
            animate={isButtonPulsing ? {
              scale: [1, 1.15, 1],
              boxShadow: [
                '0 4px 16px rgba(236, 72, 153, 0.4)',
                '0 0 30px 8px rgba(236, 72, 153, 0.8)',
                '0 4px 16px rgba(236, 72, 153, 0.4)',
              ]
            } : {}}
            transition={isButtonPulsing ? {
              duration: 1,
              repeat: 3,
              ease: 'easeInOut'
            } : {}}
          >
            <PlusIcon />
            Create Custom Map
            
            {/* Notification Badge */}
            <AnimatePresence>
              {showBadge && (
                <motion.span 
                  className="create-map-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 500, 
                    damping: 15,
                    exit: { duration: 0.3 }
                  }}
                >
                  {badgeText}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="lobby-header__center">
          <span className="lobby-status">Waiting for the host to start...</span>
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
          {/* Left column */}
          <div className="players-column players-column--left">
            {leftPlayers.map((player, i) => (
              <PlayerAvatar key={player.id} player={player} index={i} />
            ))}
          </div>

          {/* Center-left column */}
          <div className="players-column">
            {centerLeftPlayers.map((player, i) => (
              <PlayerAvatar key={player.id} player={player} index={i + 5} />
            ))}
          </div>

          {/* Character Stage */}
          <CharacterStage host={HOST_PLAYER} />

          {/* Center-right column */}
          <div className="players-column">
            {centerRightPlayers.map((player, i) => (
              <PlayerAvatar key={player.id} player={player} index={i + 8} />
            ))}
          </div>

          {/* Right column */}
          <div className="players-column players-column--right">
            {rightPlayers.map((player, i) => (
              <PlayerAvatar key={player.id} player={player} index={i + 11} />
            ))}
          </div>

          {/* Far right column */}
          <div className="players-column">
            {farRightPlayers.map((player, i) => (
              <PlayerAvatar key={player.id} player={player} index={i + 17} />
            ))}
          </div>
        </div>
      </main>

      {/* Map Carousel */}
      <MapCarousel 
        defaultMaps={DEFAULT_MAPS}
        customMaps={maps}
        onMapClick={handleMapClick}
      />

      {/* Create Map Side Sheet */}
      <AnimatePresence>
        {isSideSheetOpen && (
          <CreateMapSideSheet 
            onClose={handleCloseSideSheet}
            onMapGenerated={handleMapGenerated}
            getMapButtonPosition={getCreateMapButtonPosition}
            onFlyComplete={handleSideSheetFlyComplete}
            initialTab={sideSheetStartTab}
          />
        )}
      </AnimatePresence>

      {/* Map Preview Modal */}
      <AnimatePresence>
        {selectedMapForPreview && (
          <motion.div 
            className="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClosePreview}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '24px',
                background: selectedMapForPreview.thumbnail || selectedMapForPreview.thumbnailUrl,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <p style={{ 
                color: 'white', 
                fontSize: '18px', 
                fontWeight: '700',
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                marginBottom: '12px',
              }}>
                {selectedMapForPreview.prompt || selectedMapForPreview.name}
              </p>
              {selectedMapForPreview.createdAt && (
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '12px',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                }}>
                  Created {new Date(selectedMapForPreview.createdAt).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LobbyScreenSideSheet;
