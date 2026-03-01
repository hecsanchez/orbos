import * as Speech from 'expo-speech';

const TTS_LANGUAGE = 'es-MX';
const TTS_RATE = 0.9;
const TTS_PITCH = 1.0;

class TTSService {
  async speak(text: string): Promise<void> {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        Speech.stop();
      }
      return new Promise<void>((resolve, reject) => {
        Speech.speak(text, {
          language: TTS_LANGUAGE,
          rate: TTS_RATE,
          pitch: TTS_PITCH,
          onDone: () => resolve(),
          onError: (error) => {
            console.warn('TTS error:', error);
            resolve();
          },
        });
      });
    } catch (error) {
      console.warn('TTS unavailable:', error);
    }
  }

  stop(): void {
    try {
      Speech.stop();
    } catch (error) {
      console.warn('TTS stop error:', error);
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.warn('TTS isSpeaking error:', error);
      return false;
    }
  }
}

export const tts = new TTSService();
