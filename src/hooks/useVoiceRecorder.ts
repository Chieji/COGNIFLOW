import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceRecognizer, startAudioRecording, stopAudioRecording, processVoiceInput } from '../services/voiceService';

interface UseVoiceRecorderResult {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  clearTranscript: () => void;
  isSupported: boolean;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize voice recognizer on component mount
  useEffect(() => {
    try {
      voiceRecognizerRef.current = new VoiceRecognizer();
    } catch (err) {
      setIsSupported(false);
      setError('Voice recognition not supported in your browser');
      console.warn('Voice recognition not available:', err);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!voiceRecognizerRef.current) {
      setError('Voice recognition not initialized');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      setIsRecording(true);

      // Start speech recognition
      voiceRecognizerRef.current.start(
        (fullTranscript, isFinal) => {
          if (isFinal) {
            setTranscript(fullTranscript);
            setInterimTranscript('');
          } else {
            // Extract interim vs final parts for display
            const lastFinalIndex = fullTranscript.lastIndexOf(' ');
            if (lastFinalIndex > 0) {
              setTranscript(fullTranscript.substring(0, lastFinalIndex));
              setInterimTranscript(fullTranscript.substring(lastFinalIndex + 1));
            } else {
              setInterimTranscript(fullTranscript);
            }
          }
        },
        (err) => {
          setError(err);
          setIsRecording(false);
        }
      );

      // Optionally also capture audio data for backup
      try {
        mediaRecorderRef.current = await startAudioRecording();
        mediaRecorderRef.current.start();
      } catch (err) {
        console.warn('Audio recording not available:', err);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMsg);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    if (!voiceRecognizerRef.current) {
      return '';
    }

    try {
      const finalTranscript = voiceRecognizerRef.current.stop();
      setIsRecording(false);
      setInterimTranscript('');

      // Stop audio recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await stopAudioRecording(mediaRecorderRef.current);
      }

      return finalTranscript;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMsg);
      return transcript;
    }
  }, [transcript]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported,
  };
}

/**
 * Hook to handle voice input with AI processing
 */
interface UseVoiceInputResult extends UseVoiceRecorderResult {
  processedCommand?: string;
  addToNote: (text: string) => void;
}

export function useVoiceInput(onContentAdd?: (text: string) => void): UseVoiceInputResult {
  const voiceRecorder = useVoiceRecorder();
  const [processedCommand, setProcessedCommand] = useState<string | undefined>();

  const addToNote = useCallback((text: string) => {
    onContentAdd?.(text);
    voiceRecorder.clearTranscript();
  }, [onContentAdd, voiceRecorder]);

  // Process voice input when transcript changes
  useEffect(() => {
    if (voiceRecorder.transcript && !voiceRecorder.isRecording) {
      const processed = processVoiceInput(voiceRecorder.transcript);
      setProcessedCommand(processed.command);

      // Auto-add to note after short delay
      if (processed.content && processed.command !== 'save') {
        setTimeout(() => {
          addToNote(processed.content);
        }, 500);
      }
    }
  }, [voiceRecorder.transcript, voiceRecorder.isRecording, addToNote]);

  return {
    ...voiceRecorder,
    processedCommand,
    addToNote,
  };
}
