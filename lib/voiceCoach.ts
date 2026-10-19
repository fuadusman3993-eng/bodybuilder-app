import { Platform } from 'react-native';
import { Audio } from 'expo-av';

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
   * Speak a motivational trainer phrase using natural energetic English speech
   */
  public speak(text: string, options: { rate?: number; pitch?: number } = {}) {
    if (!this.isEnabled) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Stop any pending utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate ?? 1.05; // Slightly upbeat trainer pace
        utterance.pitch = options.pitch ?? 1.0;
        utterance.lang = 'en-US';

        // Select the most natural English voice available in the browser
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          v =>
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Guy')) &&
            v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
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
   * 3-2-1 Countdown Audio & Vocal Cue
   */
  public announceCountdownStep(count: number) {
    if (!this.isEnabled) return;

    if (count === 3) {
      this.playTone(660, 150);
      this.speak('3');
    } else if (count === 2) {
      this.playTone(660, 150);
      this.speak('2');
    } else if (count === 1) {
      this.playTone(660, 150);
      this.speak('1');
    } else if (count === 0) {
      // GO! High energy chime
      this.playTone(1050, 280);
      this.speak('Go!');
    }
  }

  /**
   * Announce upcoming exercise
   */
  public announceExercise(exerciseName: string) {
    if (!this.isEnabled) return;
    this.speak(`Next exercise: ${exerciseName}.`);
  }

  /**
   * Halfway encouragement
   */
  public announceHalfway() {
    if (!this.isEnabled) return;
    this.playTone(740, 180);
    this.speak('Halfway there! Keep it up!');
  }

  /**
   * Rest Screen Trigger
   */
  public announceRest(nextExerciseName?: string) {
    if (!this.isEnabled) return;
    this.playTone(520, 250);
    if (nextExerciseName) {
      this.speak(`Take a rest! Next is ${nextExerciseName}.`);
    } else {
      this.speak('Take a rest!');
    }
  }

  /**
   * Workout Complete celebration
   */
  public announceComplete() {
    if (!this.isEnabled) return;
    this.playTone(980, 400);
    this.speak('Awesome workout! You crushed it!');
  }
}

export const voiceCoach = new VoiceCoach();
