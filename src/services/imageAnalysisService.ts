/**
 * Image Analysis Service
 * Leverages Gemini 2.5 Vision capabilities for intelligent image processing
 * Premium feature for COGNIFLOW - monetization via image analysis credits
 */

import { GoogleGenAI, Type } from '@google/genai';

interface ImageAnalysisResult {
  description: string;
  tags: string[];
  objects: string[];
  colors: string[];
  confidence: number;
}

interface ImageTextExtractionResult {
  text: string;
  language: string;
  confidence: number;
}

/**
 * Analyze an image and extract detailed information
 * Supports JPG, PNG, WebP, GIF formats
 */
export const analyzeImage = async (
  imageData: string, // base64 encoded image
  apiKey: string,
  imageType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ImageAnalysisResult | null> => {
  if (!apiKey) {
    throw new Error('API key for Gemini is not configured');
  }

  if (!imageData) {
    throw new Error('Image data is required');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageType,
                data: imageData,
              },
            },
            {
              text: `Analyze this image in detail. Provide:
1. A comprehensive description of what you see (2-3 sentences)
2. 5-8 relevant tags/keywords
3. List of main objects/subjects detected
4. Color palette (3-5 dominant colors)
5. Your confidence level (0-1) about your analysis

Respond in JSON format:
{
  "description": "...",
  "tags": [...],
  "objects": [...],
  "colors": [...],
  "confidence": 0.95
}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: 'Detailed description of the image',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Relevant tags and keywords',
            },
            objects: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Main objects detected in the image',
            },
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Dominant colors in the image',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score for the analysis',
            },
          },
          required: ['description', 'tags', 'objects', 'colors', 'confidence'],
        },
      },
    });

    const jsonString = response.text;
    const result: ImageAnalysisResult = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

/**
 * Extract text from an image (OCR)
 * Useful for scanning documents, screenshots, whiteboards, etc.
 */
export const extractImageText = async (
  imageData: string,
  apiKey: string,
  imageType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ImageTextExtractionResult | null> => {
  if (!apiKey) {
    throw new Error('API key for Gemini is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageType,
                data: imageData,
              },
            },
            {
              text: `Extract all text visible in this image. Preserve formatting where possible.
Also identify the language(s) used and provide your confidence level.

Respond in JSON format:
{
  "text": "extracted text...",
  "language": "en",
  "confidence": 0.98
}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'Extracted text from the image',
            },
            language: {
              type: Type.STRING,
              description: 'Detected language code (e.g., en, es, fr)',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score for text extraction (0-1)',
            },
          },
          required: ['text', 'language', 'confidence'],
        },
      },
    });

    const jsonString = response.text;
    const result: ImageTextExtractionResult = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
};

/**
 * Classify an image into predefined categories
 */
export const classifyImage = async (
  imageData: string,
  apiKey: string,
  categories: string[],
  imageType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<{ category: string; confidence: number } | null> => {
  if (!apiKey) {
    throw new Error('API key for Gemini is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageType,
                data: imageData,
              },
            },
            {
              text: `Classify this image into one of these categories: ${categories.join(', ')}
Also provide your confidence level.

Respond in JSON format:
{
  "category": "...",
  "confidence": 0.95
}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'The classified category',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score (0-1)',
            },
          },
          required: ['category', 'confidence'],
        },
      },
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error('Error classifying image:', error);
    throw error;
  }
};

/**
 * Detect and identify objects in an image
 */
export const detectObjects = async (
  imageData: string,
  apiKey: string,
  imageType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<Array<{ name: string; confidence: number; description: string }> | null> => {
  if (!apiKey) {
    throw new Error('API key for Gemini is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: imageType,
                data: imageData,
              },
            },
            {
              text: `Detect all objects in this image. For each object, provide:
- Object name
- Confidence level (0-1)
- Brief description

Respond in JSON format:
{
  "objects": [
    { "name": "...", "confidence": 0.95, "description": "..." },
    ...
  ]
}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                },
                required: ['name', 'confidence', 'description'],
              },
              description: 'Detected objects in the image',
            },
          },
          required: ['objects'],
        },
      },
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    return result.objects;
  } catch (error) {
    console.error('Error detecting objects:', error);
    throw error;
  }
};
