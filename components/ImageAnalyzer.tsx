import React, { useRef, useState } from 'react';
import { useImageAnalysis } from '../hooks/useImageAnalysis';
import { LoaderIcon, XCircleIcon, BrainCircuitIcon } from './icons';

interface ImageAnalyzerProps {
  apiKey: string;
  onAnalysisComplete?: (analysis: any) => void;
  disabled?: boolean;
}

/**
 * ImageAnalyzer Component
 * Provides UI for uploading and analyzing images
 * Premium feature leveraging Gemini 2.5 Vision
 */
export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({
  apiKey,
  onAnalysisComplete,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'full' | 'text' | 'objects'>('full');

  const analysis = useImageAnalysis(apiKey);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      const base64 = imageData.split(',')[1];
      setSelectedImage(imageData);

      // Auto-analyze based on mode
      switch (analysisMode) {
        case 'text':
          await analysis.extractText(base64, file.type);
          break;
        case 'objects':
          await analysis.detectObjects(base64);
          break;
        case 'full':
        default:
          await analysis.analyzeImage(base64, file.type);
      }

      if (analysis.analysis) {
        onAnalysisComplete?.(analysis.analysis);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setSelectedImage(null);
    analysis.clearResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      {/* Mode Selection */}
      <div className="flex gap-2">
        {(['full', 'text', 'objects'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setAnalysisMode(mode)}
            disabled={disabled || analysis.isAnalyzing}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              analysisMode === mode
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-dark-secondary text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-secondary/80'
            } disabled:opacity-50`}
          >
            {mode === 'full' && 'Full Analysis'}
            {mode === 'text' && 'Extract Text'}
            {mode === 'objects' && 'Detect Objects'}
          </button>
        ))}
      </div>

      {/* File Input */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={disabled || analysis.isAnalyzing}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || analysis.isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
        >
          <BrainCircuitIcon className="w-5 h-5" />
          Choose Image
        </button>
        {selectedImage && (
          <button
            onClick={handleClear}
            className="p-2 hover:bg-white/50 dark:hover:bg-dark-secondary rounded transition-colors"
            title="Clear image"
          >
            <XCircleIcon className="w-5 h-5 text-red-500" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {analysis.isAnalyzing && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <LoaderIcon className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700 dark:text-blue-400">Analyzing image...</span>
        </div>
      )}

      {/* Error Display */}
      {analysis.error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-400">Analysis Error</p>
            <p className="text-sm text-red-600 dark:text-red-300">{analysis.error}</p>
          </div>
        </div>
      )}

      {/* Preview and Results */}
      {selectedImage && (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-full max-h-64 object-cover rounded border border-purple-300 dark:border-purple-700"
            />
          </div>

          {/* Analysis Results */}
          {analysis.analysis && (
            <div className="space-y-3">
              {analysisMode === 'full' && analysis.analysis.description && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Description</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {analysis.analysis.description}
                  </p>
                </div>
              )}

              {analysis.analysis.tags && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Tags</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.analysis.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.analysis.text && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Extracted Text</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-2 bg-white dark:bg-dark-secondary rounded border border-purple-300 dark:border-purple-700">
                    {analysis.analysis.text}
                  </p>
                </div>
              )}

              {analysis.analysis.objects && Array.isArray(analysis.analysis.objects) && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Detected Objects</h4>
                  <div className="space-y-1 mt-2">
                    {analysis.analysis.objects.map((obj: any, i: number) => (
                      <div
                        key={i}
                        className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between p-2 bg-white dark:bg-dark-secondary rounded"
                      >
                        <span>{obj.name}</span>
                        <span className="text-xs text-gray-500">
                          {(obj.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.analysis.confidence !== undefined && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Analysis Confidence: {(analysis.analysis.confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Supported formats: JPG, PNG, WebP, GIF. Max size: 20MB
      </p>
    </div>
  );
};

export default ImageAnalyzer;
