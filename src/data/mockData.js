// Mock data for the game lobby

// Pre-made map thumbnail gradients (CSS gradient strings)
export const MOCK_THUMBNAILS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple mystical
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink candy
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Ocean blue
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Jungle green
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Sunset
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Cotton candy
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Rose garden
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Desert sand
  'linear-gradient(135deg, #667eea 0%, #f093fb 100%)', // Galaxy
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Forest
];

// Example prompts for inspiration
export const EXAMPLE_PROMPTS = [
  'Haunted castle',
  'Space station',
  'Jungle temple',
  'Underwater volcano',
  'Candy kingdom',
];

// Mock player characters for the lobby
export const MOCK_PLAYERS = [
  { id: 1, name: 'Green A.', avatar: 'explorer', position: 'left-1' },
  { id: 2, name: 'Chris B.', avatar: 'nerd', position: 'left-2' },
  { id: 3, name: 'Jenny A.', avatar: 'punk', position: 'left-3' },
  { id: 4, name: 'Fred P.', avatar: 'explorer', position: 'left-4' },
  { id: 5, name: 'Amy J.', avatar: 'cowgirl', position: 'left-5' },
  { id: 6, name: 'Chen L.', avatar: 'schoolgirl', position: 'center-left-1' },
  { id: 7, name: 'Jay W.', avatar: 'cowboy', position: 'center-left-2' },
  { id: 8, name: 'David A.', avatar: 'ninja', position: 'center-left-3' },
  { id: 9, name: 'Jen L.', avatar: 'punk', position: 'center-1' },
  { id: 10, name: 'Angel H.', avatar: 'schoolgirl', position: 'center-2' },
  { id: 11, name: 'Patrick K.', avatar: 'nerd', position: 'center-3' },
  { id: 12, name: 'Katherine A.', avatar: 'punk', position: 'center-right-1' },
  { id: 13, name: 'Donna W.', avatar: 'schoolgirl', position: 'center-right-2' },
  { id: 14, name: 'Jack C.', avatar: 'nerd', position: 'center-right-3' },
  { id: 15, name: 'Henry P.', avatar: 'nerd', position: 'right-1' },
  { id: 16, name: 'Garry U.', avatar: 'explorer', position: 'right-2' },
  { id: 17, name: 'Wills J.', avatar: 'cowboy', position: 'right-3' },
  { id: 18, name: 'Jack O.', avatar: 'cowgirl', position: 'right-4' },
  { id: 19, name: 'Drek A.', avatar: 'nerd', position: 'right-5' },
  { id: 20, name: 'Leena D.', avatar: 'explorer', position: 'right-6' },
  { id: 21, name: 'Nat P.', avatar: 'punk', position: 'far-right-1' },
  { id: 22, name: 'Tiana M.', avatar: 'cowgirl', position: 'far-right-2' },
];

// Host/main player character
export const HOST_PLAYER = {
  id: 0,
  name: 'Aman Jain',
  avatar: 'ghost',
  isHost: true,
};

// Powerups available in the lobby
export const POWERUPS = [
  { id: 'gift', name: 'Gift', icon: '🎁', color: '#ff6b6b' },
  { id: 'immunity', name: 'Immunity', icon: '✓', color: '#4ecdc4' },
  { id: 'double-jeopardy', name: 'Double Jeopardy', icon: '🐱', color: '#9b59b6' },
];

// Default maps in the carousel (pink tiles at bottom)
export const DEFAULT_MAPS = [
  { id: 'sus', name: 'SUS', thumbnail: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' },
  { id: 'creature', name: 'Creature', thumbnail: 'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)' },
  { id: 'op', name: 'OP', thumbnail: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)' },
  { id: 'bag', name: 'Money Bag', thumbnail: 'linear-gradient(135deg, #ff9ff3 0%, #f368e0 100%)' },
];

// Avatar color schemes
export const AVATAR_STYLES = {
  explorer: {
    hair: '#8B4513',
    skin: '#FFDAB9',
    outfit: '#D2691E',
    accessory: '#FFD700',
  },
  nerd: {
    hair: '#4A4A4A',
    skin: '#F5DEB3',
    outfit: '#2F4F4F',
    accessory: '#87CEEB',
  },
  punk: {
    hair: '#00CED1',
    skin: '#FFE4E1',
    outfit: '#2F4F4F',
    accessory: '#FF69B4',
  },
  schoolgirl: {
    hair: '#00CED1',
    skin: '#FFE4E1',
    outfit: '#FFFFFF',
    accessory: '#FF6347',
  },
  cowboy: {
    hair: '#DAA520',
    skin: '#DEB887',
    outfit: '#8B4513',
    accessory: '#FFD700',
  },
  cowgirl: {
    hair: '#DAA520',
    skin: '#FFDAB9',
    outfit: '#D2691E',
    accessory: '#FF69B4',
  },
  ninja: {
    hair: '#1C1C1C',
    skin: '#F5DEB3',
    outfit: '#1C1C1C',
    accessory: '#FF0000',
  },
  ghost: {
    hair: '#00CED1',
    skin: '#FFFFFF',
    outfit: '#FFFFFF',
    accessory: '#FFD700',
  },
};
