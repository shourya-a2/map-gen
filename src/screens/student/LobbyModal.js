import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LobbyScreen.css';
import { MOCK_PLAYERS, HOST_PLAYER, DEFAULT_MAPS } from '../../data/mockData';
import CreateMapModal from '../../components/student/CreateMapModal';
import MapCarousel from '../../components/teacher/MapCarousel';
import CharacterStage from '../../components/shared/CharacterStage';
import PlayerAvatar from '../../components/shared/PlayerAvatar';
import { PlusIcon, UsersIcon, MenuIcon, ExpandIcon, InfoIcon } from '../../components/shared/icons';
import { useMapStore } from '../../hooks/useMapStore';

const LobbyScreen = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartTab, setModalStartTab] = useState('create');
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

  const handleOpenModal = (tab = 'create') => {
    setModalStartTab(tab);
    setIsModalOpen(true);
    setIsButtonPulsing(false);
    setShowBadge(false);
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Called when modal flies to button
  const handleModalFlyComplete = useCallback(() => {
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

  // Get Create Custom Map button position for modal fly animation
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
    handleOpenModal(tab);
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

      {/* Create Map Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CreateMapModal 
            onClose={handleCloseModal}
            onMapGenerated={handleMapGenerated}
            getMapButtonPosition={getCreateMapButtonPosition}
            onFlyComplete={handleModalFlyComplete}
            initialTab={modalStartTab}
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

export default LobbyScreen;
