/**
 * Competition Sound Manager
 * 
 * Generates synthesized sounds for competition events using Web Audio API
 * Simplified version - removed countdown alert sounds
 */

class CompetitionSoundManager {
  constructor() {
    this.audioContext = null;
    this.muted = false;
    this.volume = 0.3;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Play a synthesized tone
  playTone(frequency, duration, type = 'sine', volume = this.volume) {
    if (this.muted || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play a chord (multiple tones)
  playChord(frequencies, duration, type = 'sine', volume = this.volume) {
    frequencies.forEach((freq) => {
      this.playTone(freq, duration, type, volume / frequencies.length);
    });
  }

  // Warning sound - 10 seconds left
  playWarning() {
    if (this.muted || !this.audioContext) return;

    // Double beep warning
    this.playTone(440, 0.1, 'square', this.volume * 0.5);
    setTimeout(() => {
      this.playTone(440, 0.1, 'square', this.volume * 0.5);
    }, 150);
  }

  // Urgent tick - final 5 seconds
  playTick() {
    this.playTone(880, 0.05, 'square', this.volume * 0.7);
  }

  // Click sound - UI interaction
  playClick() {
    this.playTone(1200, 0.03, 'sine', this.volume * 0.4);
  }

  // Generate sound - map generation starts
  playGenerate() {
    if (this.muted || !this.audioContext) return;

    // Whoosh-like rising tone
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Reveal sound - map appears
  playReveal() {
    if (this.muted || !this.audioContext) return;

    // Sparkle effect
    [1047, 1319, 1568].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', this.volume * 0.5);
      }, i * 80);
    });
  }

  // Submit sound - map submitted
  playSubmit() {
    if (this.muted || !this.audioContext) return;

    // Success chime
    this.playChord([523, 659, 784, 1047], 0.3, 'triangle', this.volume * 0.6);
    
    setTimeout(() => {
      this.playTone(1047, 0.4, 'sine', this.volume * 0.4);
    }, 200);
  }

  // Winner fanfare
  playWinner() {
    if (this.muted || !this.audioContext) return;

    // Triumphant fanfare
    const notes = [
      { freq: 523, time: 0, duration: 0.15 },
      { freq: 659, time: 150, duration: 0.15 },
      { freq: 784, time: 300, duration: 0.15 },
      { freq: 1047, time: 450, duration: 0.4 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      setTimeout(() => {
        this.playTone(freq, duration, 'triangle', this.volume * 0.7);
      }, time);
    });

    // Add sparkle overtones
    setTimeout(() => {
      this.playChord([1319, 1568, 2093], 0.5, 'sine', this.volume * 0.3);
    }, 600);
  }

  // Result sound - for non-winners
  playResult() {
    if (this.muted || !this.audioContext) return;

    // Gentle reveal
    this.playChord([392, 494, 587], 0.4, 'sine', this.volume * 0.5);
  }

  // Times up sound
  playTimesUp() {
    if (this.muted || !this.audioContext) return;

    // Descending tone
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);

    gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.6);
  }

  // Play sound by name
  play(soundName) {
    this.init();
    
    switch (soundName) {
      case 'warning':
        this.playWarning();
        break;
      case 'tick':
        this.playTick();
        break;
      case 'click':
        this.playClick();
        break;
      case 'generate':
        this.playGenerate();
        break;
      case 'reveal':
        this.playReveal();
        break;
      case 'submit':
        this.playSubmit();
        break;
      case 'winner':
        this.playWinner();
        break;
      case 'result':
        this.playResult();
        break;
      case 'timesUp':
        this.playTimesUp();
        break;
      default:
        console.warn(`Unknown sound: ${soundName}`);
    }
  }
}

// Singleton instance
export const competitionSoundManager = new CompetitionSoundManager();

export default competitionSoundManager;
