import React from 'react';
import { motion } from 'framer-motion';

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const MapCard = ({ 
  map, 
  onClick, 
  onDelete, 
  showDelete = true,
  size = 'medium',
  animationDelay = 0,
  isNew = false,
}) => {
  const sizeClasses = {
    small: { width: 60, height: 60 },
    medium: { width: 80, height: 80 },
    large: { width: 120, height: 120 },
  };

  const dimensions = sizeClasses[size] || sizeClasses.medium;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(map);
    }
  };

  return (
    <motion.div
      className="map-card-component"
      style={{
        width: dimensions.width,
        height: dimensions.height,
        background: map.thumbnailUrl || map.thumbnail,
        borderRadius: 16,
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.2)',
      }}
      onClick={() => onClick && onClick(map)}
      initial={isNew ? { 
        opacity: 0, 
        scale: 0,
        rotate: -10,
      } : { 
        opacity: 0, 
        scale: 0.8 
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotate: 0,
      }}
      transition={isNew ? {
        type: 'spring',
        damping: 12,
        stiffness: 200,
        delay: animationDelay,
      } : {
        delay: animationDelay,
        duration: 0.3,
      }}
      whileHover={{ 
        scale: 1.05, 
        y: -4,
        boxShadow: '0 12px 30px rgba(236, 72, 153, 0.5)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Overlay with info */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 8,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: size === 'small' ? 9 : 11,
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {map.prompt || map.name}
        </span>
      </div>

      {/* Rarity badge */}
      {map.rarity && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            padding: '2px 6px',
            borderRadius: 6,
            fontSize: 8,
            fontWeight: 800,
            textTransform: 'uppercase',
            background: map.rarity === 'legendary' 
              ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              : map.rarity === 'rare'
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                : 'rgba(156, 163, 175, 0.9)',
            color: map.rarity === 'legendary' ? '#1a1a1a' : 'white',
          }}
        >
          {map.rarity}
        </span>
      )}

      {/* Delete button */}
      {showDelete && onDelete && (
        <motion.button
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 24,
            height: 24,
            background: 'rgba(0, 0, 0, 0.6)',
            border: 'none',
            borderRadius: 6,
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
          }}
          onClick={handleDeleteClick}
          whileHover={{ 
            opacity: 1,
            background: '#ef4444',
            color: 'white',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0 }}
        >
          <TrashIcon />
        </motion.button>
      )}
    </motion.div>
  );
};

export default MapCard;
