import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Keyword color themes for dynamic input styling
export const KEYWORD_THEMES = {
  ocean: { keywords: ['ocean', 'underwater', 'sea', 'water', 'aqua', 'marine', 'coral', 'fish'], color: '#4A90E2' },
  volcano: { keywords: ['volcano', 'fire', 'lava', 'flame', 'burn', 'magma', 'inferno', 'ember'], color: '#E2724A' },
  space: { keywords: ['space', 'galaxy', 'star', 'cosmic', 'nebula', 'planet', 'moon', 'asteroid'], color: '#6B4AE2' },
  candy: { keywords: ['candy', 'sweet', 'sugar', 'chocolate', 'cake', 'dessert', 'cookie', 'ice cream'], color: '#EC4899' },
  jungle: { keywords: ['jungle', 'forest', 'tree', 'nature', 'wild', 'tropical', 'amazon', 'vine'], color: '#4AE272' },
  haunted: { keywords: ['haunted', 'ghost', 'spooky', 'castle', 'dark', 'scary', 'horror'], color: '#4a0e4e' },
};

// Theme color palettes for building animation
export const THEME_PALETTES = {
  ocean: ['#1e3c72', '#2a5298', '#4A90E2', '#00d4ff'],
  volcano: ['#8B0000', '#E2724A', '#ff6b35', '#ffcc00'],
  space: ['#0f0c29', '#302b63', '#6B4AE2', '#24243e'],
  candy: ['#ff9a9e', '#fecfef', '#EC4899', '#fad0c4'],
  jungle: ['#134e5e', '#4AE272', '#71b280', '#2d5016'],
  haunted: ['#1a1a2e', '#4a0e4e', '#16213e', '#0f3460'],
  default: ['#2d0a4e', '#ec4899', '#f472b6', '#1a0533'],
};

// Preview images for suggestion chips (using gradient placeholders)
export const CHIP_PREVIEWS = {
  'Haunted castle': 'linear-gradient(135deg, #1a1a2e 0%, #4a0e4e 50%, #1a1a2e 100%)',
  'Space station': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'Jungle temple': 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  'Underwater volcano': 'linear-gradient(135deg, #1e3c72 0%, #e74c3c 100%)',
  'Candy kingdom': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
};

// Building animation stages
export const BUILDING_STAGES = [
  { duration: 800, label: "Creating landscape...", layer: 'terrain' },
  { duration: 800, label: "Adding your theme...", layer: 'color' },
  { duration: 800, label: "Finishing touches...", layer: 'details' },
];

// Calculate rarity based on prompt
export const calculateRarity = (prompt) => {
  const words = prompt.trim().split(/\s+/).length;
  const lowerPrompt = prompt.toLowerCase();
  
  const legendaryKeywords = ['magical', 'ancient', 'crystal', 'legendary', 'mythical', 'enchanted forest', 'dragon'];
  if (words >= 5 || legendaryKeywords.some(kw => lowerPrompt.includes(kw))) {
    return 'legendary';
  }
  
  const rareKeywords = ['dark', 'golden', 'enchanted', 'mystic', 'haunted', 'secret', 'hidden'];
  if (words >= 3 || rareKeywords.some(kw => lowerPrompt.includes(kw))) {
    return 'rare';
  }
  
  return 'common';
};

// Detect theme from prompt text
export const detectTheme = (text) => {
  const lowerText = text.toLowerCase();
  for (const [theme, config] of Object.entries(KEYWORD_THEMES)) {
    if (config.keywords.some(kw => lowerText.includes(kw))) {
      return theme;
    }
  }
  return null;
};

// Detect low-end device (Chromebooks, etc.)
export const isLowEndDevice = () => {
  return navigator.hardwareConcurrency <= 4 || 
         /CrOS/.test(navigator.userAgent);
};

// Sound manager using Web Audio API
export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.muted = false;
    this.volume = 0.25;
    this.ambientOscillator = null;
    this.ambientGain = null;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(frequency, duration, type = 'sine', volume = this.volume) {
    if (this.muted || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playTypingChime() {
    this.playTone(800 + Math.random() * 400, 0.1, 'sine');
  }

  playPillClick() {
    this.playTone(600, 0.15, 'sine');
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 50);
  }

  playGenerationStart() {
    // Activation chime
    this.playTone(440, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(554.37, 0.15, 'sine', 0.2), 100);
  }

  startAmbientHum() {
    if (this.muted || !this.audioContext) return;
    
    this.ambientOscillator = this.audioContext.createOscillator();
    this.ambientGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    this.ambientOscillator.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.audioContext.destination);
    
    this.ambientOscillator.type = 'sine';
    this.ambientOscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.5);
    
    this.ambientOscillator.start();
  }

  riseAmbientPitch(duration = 2) {
    if (!this.ambientOscillator || !this.audioContext) return;
    this.ambientOscillator.frequency.linearRampToValueAtTime(300, this.audioContext.currentTime + duration);
    this.ambientGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + duration);
  }

  stopAmbientHum() {
    if (this.ambientGain && this.audioContext) {
      this.ambientGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
      setTimeout(() => {
        if (this.ambientOscillator) {
          this.ambientOscillator.stop();
          this.ambientOscillator = null;
        }
      }, 300);
    }
  }

  playTensionBuildup() {
    if (this.muted || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.35);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.35);
  }

  playBurst() {
    if (this.muted || !this.audioContext) return;
    
    // Create noise burst
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    const noise = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);
    
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;
    
    noiseGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    noise.start();
    
    // Add a "pop" tone
    this.playTone(800, 0.1, 'sine', 0.3);
  }

  playRevealSuccess() {
    // Triumphant arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 80);
    });
  }

  playSettleClick() {
    this.playTone(1200, 0.05, 'square', 0.15);
  }

  playError() {
    this.playTone(200, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.1), 150);
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.stopAmbientHum();
    }
  }
}

// Create a singleton instance
export const soundManager = new SoundManager();

// Input sparkle particle component
export const InputSparkle = ({ x, y }) => {
  const dx = (Math.random() - 0.5) * 60;
  const dy = -20 - Math.random() * 30;
  
  return (
    <div 
      className="input-sparkle"
      style={{
        left: x,
        top: y,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
      }}
    />
  );
};

// Floating particle for background themes
export const FloatingParticle = ({ theme, index }) => {
  const style = {
    left: `${Math.random() * 100}%`,
    bottom: `-10px`,
    animationDelay: `${index * 0.5}s`,
    animationDuration: `${3 + Math.random() * 2}s`,
  };

  const themeStyles = {
    ocean: { width: '8px', height: '8px', background: 'rgba(74, 144, 226, 0.6)', borderRadius: '50%' },
    space: { width: '4px', height: '4px', background: 'white', boxShadow: '0 0 4px white' },
    volcano: { width: '6px', height: '6px', background: 'linear-gradient(to top, #ff6b35, #ffcc00)', borderRadius: '2px' },
    candy: { width: '6px', height: '6px', background: `hsl(${Math.random() * 60 + 300}, 80%, 70%)`, borderRadius: '50%' },
    jungle: { width: '10px', height: '6px', background: 'rgba(74, 226, 114, 0.5)', borderRadius: '50%' },
    haunted: { width: '4px', height: '4px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '50%' },
  };

  return (
    <div 
      className={`floating-particle ${theme === 'space' ? 'star-particle' : ''} ${theme === 'volcano' ? 'ember-particle' : ''}`}
      style={{ ...style, ...themeStyles[theme] }}
    />
  );
};

// Burst particle for reveal animation
export const BurstParticle = ({ id, x, y, color, phase, centerX, centerY }) => {
  const angle = (id / 30) * Math.PI * 2;
  const velocity = 80 + Math.random() * 60;
  const targetX = x + Math.cos(angle) * velocity;
  const targetY = y + Math.sin(angle) * velocity;
  
  return (
    <motion.div
      className="burst-particle"
      initial={{ x, y, scale: 1, opacity: 1 }}
      animate={phase === 'burst' 
        ? { x: targetX, y: targetY, scale: 0.5, opacity: 0.8 }
        : { x: centerX, y: centerY, scale: 0, opacity: 0 }
      }
      transition={phase === 'burst' 
        ? { duration: 0.4, ease: 'easeOut' }
        : { duration: 0.5, ease: 'easeIn' }
      }
      style={{
        position: 'absolute',
        width: `${6 + Math.random() * 8}px`,
        height: `${6 + Math.random() * 8}px`,
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  );
};

// Building animation canvas component
export const BuildingAnimation = ({ theme, stage, progress }) => {
  const canvasRef = useRef(null);
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.default;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw base (always visible after stage 0)
    if (stage >= 0) {
      ctx.fillStyle = palette[0];
      ctx.fillRect(0, 0, width, height);
      
      // Draw terrain based on theme
      const terrainProgress = stage === 0 ? progress : 1;
      ctx.save();
      ctx.beginPath();
      
      if (theme === 'ocean' || theme === 'underwater') {
        // Wavy water
        ctx.moveTo(0, height * 0.6);
        for (let x = 0; x <= width * terrainProgress; x += 10) {
          const y = height * 0.6 + Math.sin(x * 0.05) * 20;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width * terrainProgress, height);
        ctx.lineTo(0, height);
        ctx.fillStyle = palette[1];
        ctx.fill();
      } else if (theme === 'volcano') {
        // Mountain/volcano shape
        ctx.moveTo(0, height);
        ctx.lineTo(width * 0.3 * terrainProgress, height * 0.7);
        ctx.lineTo(width * 0.5 * terrainProgress, height * 0.2);
        ctx.lineTo(width * 0.7 * terrainProgress, height * 0.6);
        ctx.lineTo(width * terrainProgress, height);
        ctx.fillStyle = palette[1];
        ctx.fill();
      } else if (theme === 'space') {
        // Stars
        ctx.fillStyle = 'white';
        for (let i = 0; i < 50 * terrainProgress; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height * 0.8;
          const size = Math.random() * 2 + 1;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (theme === 'jungle') {
        // Tree silhouettes
        for (let i = 0; i < 5 * terrainProgress; i++) {
          const x = (i / 5) * width + Math.random() * 50;
          const treeHeight = height * (0.4 + Math.random() * 0.3);
          ctx.beginPath();
          ctx.moveTo(x, height);
          ctx.lineTo(x - 30, height - treeHeight * 0.3);
          ctx.lineTo(x, height - treeHeight);
          ctx.lineTo(x + 30, height - treeHeight * 0.3);
          ctx.fillStyle = palette[2];
          ctx.fill();
        }
      } else if (theme === 'candy') {
        // Rolling hills
        ctx.moveTo(0, height * 0.7);
        for (let x = 0; x <= width * terrainProgress; x += 50) {
          ctx.quadraticCurveTo(x + 25, height * 0.5, x + 50, height * 0.7);
        }
        ctx.lineTo(width * terrainProgress, height);
        ctx.lineTo(0, height);
        ctx.fillStyle = palette[1];
        ctx.fill();
      } else if (theme === 'haunted') {
        // Castle silhouette
        ctx.moveTo(0, height);
        ctx.lineTo(width * 0.2 * terrainProgress, height * 0.6);
        ctx.lineTo(width * 0.25 * terrainProgress, height * 0.3);
        ctx.lineTo(width * 0.3 * terrainProgress, height * 0.6);
        ctx.lineTo(width * 0.5 * terrainProgress, height * 0.5);
        ctx.lineTo(width * 0.55 * terrainProgress, height * 0.2);
        ctx.lineTo(width * 0.6 * terrainProgress, height * 0.5);
        ctx.lineTo(width * 0.8 * terrainProgress, height * 0.4);
        ctx.lineTo(width * terrainProgress, height);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
      } else {
        // Default rolling hills
        ctx.moveTo(0, height * 0.6);
        ctx.quadraticCurveTo(width * 0.25 * terrainProgress, height * 0.4, width * 0.5 * terrainProgress, height * 0.5);
        ctx.quadraticCurveTo(width * 0.75 * terrainProgress, height * 0.6, width * terrainProgress, height * 0.4);
        ctx.lineTo(width * terrainProgress, height);
        ctx.lineTo(0, height);
        ctx.fillStyle = palette[1];
        ctx.fill();
      }
      ctx.restore();
    }
    
    // Draw color wash (stage 1)
    if (stage >= 1) {
      const colorProgress = stage === 1 ? progress : 1;
      const gradient = ctx.createLinearGradient(0, 0, width * colorProgress, height);
      gradient.addColorStop(0, `${palette[2]}80`);
      gradient.addColorStop(1, `${palette[3]}60`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width * colorProgress, height);
    }
    
    // Draw details (stage 2)
    if (stage >= 2) {
      const detailProgress = stage === 2 ? progress : 1;
      
      // Add sparkles/highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 20 * detailProgress; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add lighting sweep
      const sweepX = width * detailProgress;
      const gradient = ctx.createLinearGradient(sweepX - 100, 0, sweepX, 0);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(sweepX - 100, 0, 100, height);
    }
  }, [stage, progress, theme, palette]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={320} 
      height={200} 
      className="building-canvas"
    />
  );
};

// Icons
export const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

export const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="locked-slot__icon">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export const SoundOnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

export const SoundOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// Constants
export const MAX_CHARS = 100;
export const MAX_SLOTS = 8;
