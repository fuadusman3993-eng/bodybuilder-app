import { Platform } from 'react-native';

class VoiceCoach {
  private isEnabled: boolean = true;
  private audioContext: any = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      } catch (_) {}
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled && Platform.OS === 'web' && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Speak using English text with best available voice
   */
  public speak(text: string, options: { rate?: number; pitch?: number } = {}) {
    if (!this.isEnabled) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate ?? 1.0;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        const englishVoice =
          voices.find(v => v.lang === 'en-US' && !v.name.includes('Bad')) ||
          voices.find(v => v.lang.startsWith('en')) ||
          voices[0];

        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    }
  }

  /**
   * Play studio digital tone for countdowns
   */
  public playTone(frequency: number = 880, durationMs: number = 150, type: OscillatorType = 'sine') {
    if (!this.isEnabled) return;

    if (Platform.OS === 'web' && this.audioContext) {
      try {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gain.gain.setValueAtTime(0.18, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + durationMs / 1000);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + durationMs / 1000);
      } catch (_) {}
    }
  }

  /**
   * 3-2-1 Countdown — English with clean tone/speech stagger to prevent mobile audio collision
   */
  public announceCountdownStep(count: number) {
    if (!this.isEnabled) return;

    if (count === 3) {
      this.playTone(660, 120);
      setTimeout(() => this.speak('Three'), 130);
    } else if (count === 2) {
      this.playTone(660, 120);
      setTimeout(() => this.speak('Two'), 130);
    } else if (count === 1) {
      this.playTone(660, 120);
      setTimeout(() => this.speak('One'), 130);
    } else if (count === 0) {
      this.playTone(1050, 200);
      setTimeout(() => this.speak('Go!'), 140);
    }
  }

  /**
   * Announce upcoming exercise — English
   */
  public announceExercise(exerciseName: string) {
    if (!this.isEnabled) return;
    this.speak(`Next exercise: ${exerciseName}`);
  }

  /**
   * Halfway encouragement — English
   */
  public announceHalfway() {
    if (!this.isEnabled) return;
    this.playTone(740, 150);
    setTimeout(() => this.speak('Halfway there! Keep pushing!'), 160);
  }

  /**
   * Rest Screen — English
   */
  public announceRest(nextExerciseName?: string) {
    if (!this.isEnabled) return;
    this.playTone(520, 180);
    const msg = nextExerciseName ? `Take a rest. Next is ${nextExerciseName}.` : 'Take a rest.';
    setTimeout(() => this.speak(msg), 190);
  }

  /**
   * Workout Complete — English
   */
  public announceComplete() {
    if (!this.isEnabled) return;
    this.playTone(980, 250);
    setTimeout(() => this.speak('Workout completed! Fantastic work!'), 260);
  }
}

export const voiceCoach = new VoiceCoach();
