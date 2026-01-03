import { useCallback, useRef } from 'react';

type SoundType = 'cardDeal' | 'cardFlip' | 'chipsBet' | 'chipsWin' | 'fold' | 'check' | 'call' | 'raise' | 'allIn' | 'turn' | 'yourTurn';

export function usePokerSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'cardDeal': {
        // Quick swoosh sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'cardFlip': {
        // Snap sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'chipsBet': {
        // Chip clinking sound
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2000 + Math.random() * 500, now + i * 0.03);
          
          gain.gain.setValueAtTime(0.08, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.03 + 0.08);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + i * 0.03);
          osc.stop(now + i * 0.03 + 0.08);
        }
        break;
      }

      case 'chipsWin': {
        // Multiple chips falling
        for (let i = 0; i < 8; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1500 + Math.random() * 1000, now + i * 0.05);
          
          gain.gain.setValueAtTime(0.06, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.1);
        }
        break;
      }

      case 'fold': {
        // Soft thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'check': {
        // Double tap
        for (let i = 0; i < 2; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now + i * 0.08);
          
          gain.gain.setValueAtTime(0.1, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.05);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.05);
        }
        break;
      }

      case 'call': {
        // Chip slide
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
        
        // Add chip clink at end
        setTimeout(() => playSound('chipsBet'), 150);
        break;
      }

      case 'raise': {
        // Ascending tone + chips
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
        
        setTimeout(() => playSound('chipsBet'), 100);
        break;
      }

      case 'allIn': {
        // Dramatic sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, now);
        osc1.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(400, now);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
        
        setTimeout(() => playSound('chipsWin'), 200);
        break;
      }

      case 'yourTurn': {
        // Notification bell
        const frequencies = [523, 659, 784]; // C5, E5, G5
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          
          gain.gain.setValueAtTime(0.1, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.3);
        });
        break;
      }

      case 'turn': {
        // Phase change sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(400, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
    }
  }, [getAudioContext]);

  return { playSound };
}
