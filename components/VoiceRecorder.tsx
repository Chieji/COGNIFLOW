import React, { useCallback } from 'react';
import { useVoiceInput } from '../hooks/useVoiceRecorder';
import { MicIcon, LoaderIcon, XCircleIcon } from './icons';

interface VoiceRecorderProps {
  onAddContent: (text: string) => void;
  disabled?: boolean;
}

/**
 * VoiceRecorder Component
 * Provides UI for voice-to-note recording with real-time transcript display
 * Premium feature for COGNIFLOW app
 */
export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onAddContent, disabled = false }) => {
  const voice = useVoiceInput(onAddContent);

  const handleStartRecording = useCallback(async () => {
    await voice.startRecording();
  }, [voice]);

  const handleStopRecording = useCallback(async () => {
    await voice.stopRecording();
  }, [voice]);

  if (!voice.isSupported) {
    return (
      <div className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-sm text-red-600 dark:text-red-400">
          Voice recording not supported in your browser
        </span>
      </div>
    );
  }

  const displayText = voice.transcript
    ? `${voice.transcript}${voice.interimTranscript ? ` ${voice.interimTranscript}` : ''}`
    : voice.interimTranscript;

  return (
    <div className="space-y-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      {/* Recording Control */}
      <div className="flex items-center gap-2">
        {!voice.isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            <MicIcon className="w-5 h-5" />
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={handleStopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium animate-pulse"
            >
              <MicIcon className="w-5 h-5" />
              Stop Recording
            </button>
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <LoaderIcon className="w-4 h-4 animate-spin" />
              <span>Listening...</span>
            </div>
          </>
        )}
      </div>

      {/* Transcript Display */}
      {displayText && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Real-time Transcript:</p>
          <div className="p-3 bg-white dark:bg-dark-secondary rounded border border-blue-300 dark:border-blue-700">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {voice.transcript}
              {voice.interimTranscript && (
                <span className="italic text-gray-400 dark:text-gray-500">
                  {' '}{voice.interimTranscript}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Command Indicator */}
      {voice.processedCommand && (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Command detected: <code className="bg-green-100 dark:bg-green-800 px-2 py-0.5 rounded">{voice.processedCommand}</code>
          </span>
        </div>
      )}

      {/* Error Display */}
      {voice.error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{voice.error}</p>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: Speak naturally. Try commands like "save", "analyze", or "clear" to control the app.
      </p>
    </div>
  );
};

export default VoiceRecorder;
