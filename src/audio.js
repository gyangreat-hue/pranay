class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmInterval = null;
    this.analyser = null;
    
    // Core calm Happy Birthday chime sequence
    this.notes = [
      261.63, 261.63, 293.66, 261.63, 349.23, 329.63,
      261.63, 261.63, 293.66, 261.63, 392.00, 349.23,
      261.63, 261.63, 523.25, 440.00, 349.23, 329.63, 293.66,
      466.16, 466.16, 440.00, 349.23, 392.00, 349.23
    ];
    this.durations = [
      0.5, 0.5, 1, 1, 1, 2,
      0.5, 0.5, 1, 1, 1, 2,
      0.5, 0.5, 1, 1, 1, 1, 2,
      0.5, 0.5, 1, 1, 1, 2
    ];
    this.currentNoteIndex = 0;
    this.bgmVolume = null;
    this.sfxVolume = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create Analyser for visualizer drawing (Spherical Waves Style)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.connect(this.ctx.destination);
    
    this.bgmVolume = this.ctx.createGain();
    this.sfxVolume = this.ctx.createGain();
    
    this.bgmVolume.gain.setValueAtTime(0.06, this.ctx.currentTime); // Soft BGM
    this.sfxVolume.gain.setValueAtTime(0.22, this.ctx.currentTime); // SFX
    
    this.bgmVolume.connect(this.analyser);
    this.sfxVolume.connect(this.analyser);
    
    this.startBGM();
  }

  startBGM() {
    if (this.muted) return;
    if (this.bgmInterval) return;
    this.currentNoteIndex = 0;
    
    const playNextNote = () => {
      if (this.muted || !this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const freq = this.notes[this.currentNoteIndex];
      const duration = this.durations[this.currentNoteIndex] * 0.8;

      this.playMusicBoxNote(freq, duration);
      
      const nextDelay = this.durations[this.currentNoteIndex] * 620; // Tempo
      this.currentNoteIndex = (this.currentNoteIndex + 1) % this.notes.length;
      
      this.bgmInterval = setTimeout(playNextNote, nextDelay);
    };

    playNextNote();
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  playMusicBoxNote(freq, duration) {
    if (!this.ctx || this.muted) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine'; // pure bell tone
    osc.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);
    
    const osc2 = this.ctx.createOscillator();
    const gainNode2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 3, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    gainNode2.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration * 0.4);
    
    osc.connect(gainNode);
    gainNode.connect(this.bgmVolume);
    
    osc2.connect(gainNode2);
    gainNode2.connect(this.bgmVolume);
    
    osc.start();
    osc2.start();
    
    osc.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
  }

  playChime() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    // Ascending arpeggio
    const freqs = [329.63, 392.00, 523.25, 659.25, 783.99];
    
    freqs.forEach((freq, index) => {
      const time = now + index * 0.06;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.5, time);
      
      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume);
      
      osc.start(time);
      osc.stop(time + 0.7);
    });
  }

  playBlow() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const duration = 1.5;
    
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.0;
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + duration);
    
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.6, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxVolume);
    
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  playCelebration() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    
    chord.forEach((freq, index) => {
      const time = now + index * 0.1;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, time + 1.2);
      
      gainNode.gain.setValueAtTime(0.15, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.4);
      
      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume);
      
      osc.start(time);
      osc.stop(time + 1.5);
    });
  }

  getFrequencies() {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      if (this.ctx) {
        this.startBGM();
      }
    }
    return this.muted;
  }

  setTheme(themeName) {
    // No-op to avoid breaking theme-switching code, since we stay in genesis theme
  }

  speak(text) {
    if (this.muted) return;
    if (!('speechSynthesis' in window)) return;

    try {
      // Cancel any ongoing speech to avoid overlap
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN'; // Indian Hindi/Hinglish accent context

      // Find appropriate Indian English / Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const inVoice = voices.find(v => v.lang.includes('IN') || v.lang.startsWith('hi'));
      if (inVoice) {
        utterance.voice = inVoice;
      }

      utterance.pitch = 1.0;
      utterance.rate = 0.92; // Slightly slower speed for warm maternal narration
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed:", e);
    }
  }
}

export const audioManager = new AudioManager();
