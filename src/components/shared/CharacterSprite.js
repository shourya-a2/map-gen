import React from 'react';

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

export default CharacterSprite;
