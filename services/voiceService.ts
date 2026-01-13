/**
 * Voice Recognition Service
 * Handles speech-to-text conversion using Web Speech API
 * and integration with Gemini for voice command processing
 */

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  isFinal: boolean;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionCallback = (transcript: string, isFinal: boolean) => void;
type SpeechErrorCallback = (error: string) => void;

export class VoiceRecognizer {
  private recognition: any;
  private isListening = false;
  private transcript = '';
  private onResultCallback?: SpeechRecognitionCallback;
  private onErrorCallback?: SpeechErrorCallback;

  constructor() {
    // Use browser's native speech recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech Recognition API not supported in this browser');
    }
    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }

  private setupRecognition() {
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.language = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.transcript = '';
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim_transcript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }

      const isFinal = event.results[event.results.length - 1].isFinal;
      this.onResultCallback?.(this.transcript + interim_transcript, isFinal);

      if (event.isFinal) {
        this.transcript = finalTranscript.trim();
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      this.onErrorCallback?.(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  public start(onResult: SpeechRecognitionCallback, onError: SpeechErrorCallback): void {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.transcript = '';
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      onError('Failed to start recording');
    }
  }

  public stop(): string {
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
    return this.transcript;
  }

  public abort(): void {
    try {
      this.recognition.abort();
    } catch (error) {
      console.error('Error aborting recognition:', error);
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setLanguage(language: string): void {
    this.recognition.language = language;
  }
}

/**
 * Enhanced voice recording with audio data capture
 */
export async function startAudioRecording(): Promise<MediaRecorder> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    return mediaRecorder;
  } catch (error) {
    throw new Error(`Failed to access microphone: ${error}`);
  }
}

export function stopAudioRecording(mediaRecorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      resolve(blob);
    };

    mediaRecorder.onerror = (event: ErrorEvent) => {
      reject(new Error(`Recording error: ${event.message}`));
    };

    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
}

/**
 * Convert audio blob to base64 for API transmission
 */
export function audioToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Process voice input to extract note content
 * Can be extended to support voice commands
 */
export function processVoiceInput(transcript: string): {
  content: string;
  command?: string;
} {
  // Check for voice commands
  const commandPatterns = {
    save: /^(save|done|finished)/i,
    analyze: /^(analyze|summarize|ai|smart)/i,
    clear: /^(clear|reset|delete all)/i,
  };

  let command: string | undefined;
  for (const [cmd, pattern] of Object.entries(commandPatterns)) {
    if (pattern.test(transcript)) {
      command = cmd;
      break;
    }
  }

  return {
    content: transcript.trim(),
    command,
  };
}
