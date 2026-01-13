import { useState, useCallback } from 'react';
import {
  analyzeImage,
  extractImageText,
  classifyImage,
  detectObjects,
} from '../services/imageAnalysisService';

interface UseImageAnalysisResult {
  isAnalyzing: boolean;
  analysis: any | null;
  error: string | null;
  analyzeImage: (imageData: string, imageType: string) => Promise<void>;
  extractText: (imageData: string, imageType: string) => Promise<void>;
  classifyImage: (imageData: string, categories: string[]) => Promise<void>;
  detectObjects: (imageData: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Hook for image analysis operations
 * Handles all image-related AI processing
 */
export function useImageAnalysis(apiKey: string): UseImageAnalysisResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeImage = useCallback(
    async (imageData: string, imageType: string = 'image/jpeg') => {
      if (!apiKey) {
        setError('Gemini API key is not configured');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await analyzeImage(
          imageData,
          apiKey,
          imageType as any
        );
        setAnalysis(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to analyze image';
        setError(errorMsg);
        console.error('Image analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [apiKey]
  );

  const handleExtractText = useCallback(
    async (imageData: string, imageType: string = 'image/jpeg') => {
      if (!apiKey) {
        setError('Gemini API key is not configured');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await extractImageText(
          imageData,
          apiKey,
          imageType as any
        );
        setAnalysis(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to extract text';
        setError(errorMsg);
        console.error('Text extraction error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [apiKey]
  );

  const handleClassifyImage = useCallback(
    async (imageData: string, categories: string[]) => {
      if (!apiKey) {
        setError('Gemini API key is not configured');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await classifyImage(
          imageData,
          apiKey,
          categories
        );
        setAnalysis(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to classify image';
        setError(errorMsg);
        console.error('Image classification error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [apiKey]
  );

  const handleDetectObjects = useCallback(
    async (imageData: string) => {
      if (!apiKey) {
        setError('Gemini API key is not configured');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await detectObjects(imageData, apiKey);
        setAnalysis(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to detect objects';
        setError(errorMsg);
        console.error('Object detection error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [apiKey]
  );

  const clearResults = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    analysis,
    error,
    analyzeImage: handleAnalyzeImage,
    extractText: handleExtractText,
    classifyImage: handleClassifyImage,
    detectObjects: handleDetectObjects,
    clearResults,
  };
}

/**
 * Hook for quick image analysis with auto-processing
 */
interface UseQuickImageAnalysisOptions {
  autoAnalyze?: boolean;
  apiKey: string;
}

export function useQuickImageAnalysis(options: UseQuickImageAnalysisOptions) {
  const { apiKey, autoAnalyze = true } = options;
  const imageAnalysis = useImageAnalysis(apiKey);

  const analyzeImageFile = useCallback(
    async (file: File): Promise<any> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
          try {
            const imageData = event.target?.result as string;
            const base64 = imageData.split(',')[1];

            if (autoAnalyze) {
              await imageAnalysis.analyzeImage(base64, file.type);
            }

            resolve({
              base64,
              file,
              analysis: imageAnalysis.analysis,
            });
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      });
    },
    [imageAnalysis, autoAnalyze]
  );

  return {
    ...imageAnalysis,
    analyzeImageFile,
  };
}
