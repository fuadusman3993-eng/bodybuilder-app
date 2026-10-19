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
   * Speak using Amharic text with best available voice
   * Falls back to any available voice if no Amharic voice found
   */
  public speak(text: string, options: { rate?: number; pitch?: number } = {}) {
    if (!this.isEnabled) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate ?? 0.9; // Slightly slower for Amharic clarity
        utterance.pitch = options.pitch ?? 1.05;
        utterance.lang = 'am-ET'; // Amharic (Ethiopia)

        const voices = window.speechSynthesis.getVoices();

        // Try Amharic voice first, then any Ethiopian locale, then fallback to any
        const amharicVoice =
          voices.find(v => v.lang === 'am-ET') ||
          voices.find(v => v.lang.startsWith('am')) ||
          voices.find(v => v.lang === 'en-US') ||
          voices.find(v => v.lang.startsWith('en')) ||
          voices[0];

        if (amharicVoice) {
          utterance.voice = amharicVoice;
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
   * 3-2-1 Countdown — Amharic numbers
   */
  public announceCountdownStep(count: number) {
    if (!this.isEnabled) return;

    if (count === 3) {
      this.playTone(660, 150);
      this.speak('ሦስት'); // "Sost" = 3
    } else if (count === 2) {
      this.playTone(660, 150);
      this.speak('ሁለት'); // "Hulet" = 2
    } else if (count === 1) {
      this.playTone(660, 150);
      this.speak('አንድ'); // "And" = 1
    } else if (count === 0) {
      this.playTone(1050, 280);
      this.speak('ጀምር!'); // "Jemr!" = Start / Go!
    }
  }

  /**
   * Announce upcoming exercise — Amharic
   */
  public announceExercise(exerciseName: string) {
    if (!this.isEnabled) return;
    this.speak(`ቀጣይ እንቅስቃሴ: ${exerciseName}`); // "Next exercise: ..."
  }

  /**
   * Halfway encouragement — Amharic
   */
  public announceHalfway() {
    if (!this.isEnabled) return;
    this.playTone(740, 180);
    this.speak('እኩሌታ ደርሰሃል! ቀጥል!'); // "You've reached halfway! Keep going!"
  }

  /**
   * Rest Screen — Amharic
   */
  public announceRest(nextExerciseName?: string) {
    if (!this.isEnabled) return;
    this.playTone(520, 250);
    if (nextExerciseName) {
      this.speak(`አርፍ! ቀጣዩ ${nextExerciseName} ነው።`); // "Rest! Next is ..."
    } else {
      this.speak('አርፍ!'); // "Rest!"
    }
  }

  /**
   * Workout Complete — Amharic
   */
  public announceComplete() {
    if (!this.isEnabled) return;
    this.playTone(980, 400);
    this.speak('እንኳን ደስ አለህ! ዛሬ አሸነፍክ!'); // "Congratulations! You won today!"
  }
}

export const voiceCoach = new VoiceCoach();
