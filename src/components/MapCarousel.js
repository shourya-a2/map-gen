import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Carousel arrow icons
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
    <path d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

// Map tile icons (simple representations)
const SusIcon = () => (
  <span style={{ fontSize: '20px', fontWeight: '900', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
    SUS
  </span>
);

const CreatureIcon = () => (
  <span style={{ fontSize: '28px' }}>🐱</span>
);

const OpIcon = () => (
  <span style={{ fontSize: '20px', fontWeight: '900', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
    OP
  </span>
);

const BagIcon = () => (
  <span style={{ fontSize: '28px' }}>💰</span>
);

const getDefaultMapIcon = (mapId) => {
  switch (mapId) {
    case 'sus': return <SusIcon />;
    case 'creature': return <CreatureIcon />;
    case 'op': return <OpIcon />;
    case 'bag': return <BagIcon />;
    default: return <span style={{ fontSize: '28px' }}>🗺️</span>;
  }
};

const MapCarousel = ({ defaultMaps = [], customMaps = [], onMapClick }) => {
  const [newMapId, setNewMapId] = useState(null);
  
  // Track newly added maps for animation
  useEffect(() => {
    if (customMaps.length > 0) {
      const latestMap = customMaps[0];
      setNewMapId(latestMap.id);
      const timer = setTimeout(() => setNewMapId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [customMaps.length]);

  // Combine default and custom maps
  const leftCarouselMaps = [...defaultMaps.slice(0, 4)];
  const rightCarouselMaps = [...defaultMaps.slice(0, 3), ...customMaps.slice(0, 5)];

  return (
    <section className="map-carousel-section">
      {/* Left carousel (default maps) */}
      <div className="map-carousel">
        <button className="carousel-arrow">
          <ChevronLeft />
        </button>
        <div className="map-tiles">
          {leftCarouselMaps.map((map, index) => (
            <motion.div
              key={map.id}
              className="map-tile"
              style={{ background: map.thumbnail || map.thumbnailUrl }}
              onClick={() => onMapClick(map)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ 
                scale: 1.08, 
                y: -4,
                boxShadow: '0 12px 30px rgba(236, 72, 153, 0.5)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              {getDefaultMapIcon(map.id)}
            </motion.div>
          ))}
        </div>
        <button className="carousel-arrow">
          <ChevronRight />
        </button>
      </div>

      {/* Right carousel (with custom maps) */}
      <div className="map-carousel">
        <button className="carousel-arrow">
          <ChevronLeft />
        </button>
        <div className="map-tiles">
          <AnimatePresence mode="popLayout">
            {rightCarouselMaps.map((map, index) => {
              const isCustom = !map.thumbnail;
              const isNew = map.id === newMapId;
              
              return (
                <motion.div
                  key={map.id}
                  className="map-tile"
                  style={{ background: map.thumbnail || map.thumbnailUrl }}
                  onClick={() => onMapClick(map)}
                  initial={isNew ? { 
                    opacity: 0, 
                    scale: 0,
                    x: 200,
                    y: -100,
                  } : { 
                    opacity: 0, 
                    scale: 0.8 
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: 0,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={isNew ? {
                    type: 'spring',
                    damping: 15,
                    stiffness: 200,
                    delay: 0.2,
                  } : {
                    delay: index * 0.1,
                    duration: 0.3,
                  }}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -4,
                    boxShadow: '0 12px 30px rgba(236, 72, 153, 0.5)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  layout
                >
                  {isCustom ? (
                    <>
                      {/* Custom map shows first letter or emoji */}
                      <span className="map-tile__text">
                        {map.prompt.charAt(0).toUpperCase()}
                      </span>
                      {/* Rarity badge */}
                      {map.rarity && (
                        <span className={`rarity-badge rarity-badge--${map.rarity}`}>
                          {map.rarity === 'legendary' ? '★' : map.rarity === 'rare' ? '◆' : '●'}
                        </span>
                      )}
                    </>
                  ) : (
                    getDefaultMapIcon(map.id)
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <button className="carousel-arrow">
          <ChevronRight />
        </button>
      </div>
    </section>
  );
};

export default MapCarousel;
