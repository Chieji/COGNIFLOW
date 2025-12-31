/**
 * Secure Gemini Service
 * 
 * This service routes all Gemini API calls through a secure server-side proxy.
 * API keys are never exposed to the client.
 * 
 * The proxy can be deployed to:
 * - Vercel (serverless)
 * - Cloudflare Workers
 * - Self-hosted Node.js server
 */

import type { Note } from '../types';

export interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts: Array<{ text?: string; functionCall?: any }> };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { uri: string; title?: string };
      }>;
    };
  }>;
  text?: string;
  functionCalls?: Array<{ id: string; name: string; args: any }>;
}

export interface Citation {
  uri: string;
  title: string;
}

/**
 * Get the API proxy URL from environment or use default
 */
function getProxyUrl(): string {
  return import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001/api/proxy';
}

/**
 * Make a request through the secure proxy
 */
async function proxyRequest(
  payload: any,
  endpoint?: string
): Promise<GenerateContentResponse> {
  const proxyUrl = getProxyUrl();

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'gemini',
        payload,
        endpoint,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Proxy error: ${error.error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
}

/**
 * Find connections between notes using Gemini's semantic understanding
 */
export const findConnections = async (
  notes: Note[],
  _apiKey: string // Kept for backwards compatibility but not used
): Promise<Array<{ source: string; target: string }>> => {
  if (notes.length < 2) return [];

  const noteDescriptions = notes
    .map((n) => `ID: ${n.id}, Title: "${n.title}", Content: "${n.content.substring(0, 200)}"`)
    .join('\n');

  const prompt = `Analyze the following notes and identify semantic connections between them. Return a JSON array of connections with source and target note IDs.

Notes:
${noteDescriptions}

Return ONLY valid JSON in this format:
[
  { "source": "note-id-1", "target": "note-id-2" },
  ...
]`;

  try {
    const response = await proxyRequest(
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      },
      ':generateContent?key=unused' // Key is handled by proxy
    );

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const connections = JSON.parse(jsonMatch[0]);
    return Array.isArray(connections) ? connections : [];
  } catch (error) {
    console.error('Error finding connections:', error);
    return [];
  }
};

/**
 * Generate a summary and tags for a note
 */
export const generateInsights = async (
  content: string,
  _apiKey: string // Kept for backwards compatibility but not used
): Promise<{ summary: string; tags: string[] }> => {
  const prompt = `Analyze the following note content and provide:
1. A concise summary (1-2 sentences)
2. 3-5 relevant tags

Content:
${content}

Return ONLY valid JSON in this format:
{
  "summary": "...",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const response = await proxyRequest(
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 256 },
      },
      ':generateContent?key=unused'
    );

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { summary: '', tags: [] };

    const insights = JSON.parse(jsonMatch[0]);
    return {
      summary: insights.summary || '',
      tags: Array.isArray(insights.tags) ? insights.tags : [],
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return { summary: '', tags: [] };
  }
};

/**
 * Process multi-turn chat with function calling support
 */
export const processGeminiChat = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  _apiKey: string, // Kept for backwards compatibility but not used
  systemInstruction: string = '',
  tools?: any,
  useWebSearch: boolean = false,
  useThinkingMode: boolean = false,
  onChunk?: (chunk: string) => void,
  onExecuteAction?: (action: any) => any
): Promise<{ citations: Citation[] }> => {
  const fullHistory = [
    ...history,
    { role: 'user' as const, parts: [{ text: newMessage }] },
  ];

  const config: any = {
    temperature: 0.7,
    maxOutputTokens: 2048,
  };

  if (useThinkingMode) {
    config.thinking = { budgetTokens: 5000 };
  }

  if (useWebSearch) {
    config.tools = [
      {
        googleSearch: {},
      },
    ];
  }

  if (tools) {
    config.tools = config.tools || [];
    config.tools.push({ functionDeclarations: tools });
  }

  try {
    // Handle web search
    if (useWebSearch) {
      const response = await proxyRequest(
        {
          contents: fullHistory,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: config,
        },
        ':generateContent?key=unused'
      );

      const citations: Citation[] = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
          if (chunk.web) {
            citations.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
          }
        }
      }

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (onChunk) onChunk(text);

      return { citations };
    }

    // Handle tool usage
    if (tools && onExecuteAction) {
      const response = await proxyRequest(
        {
          contents: fullHistory,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: config,
        },
        ':generateContent?key=unused'
      );

      const functionCalls = response.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall);

      if (functionCalls && functionCalls.length > 0) {
        const toolResponseParts = [];
        for (const call of functionCalls) {
          const result = onExecuteAction({ tool: call.functionCall.name, args: call.functionCall.args });
          toolResponseParts.push({
            toolResponse: {
              name: call.functionCall.name,
              content: result,
            },
          });
        }

        const historyWithToolResponses = [
          ...fullHistory,
          { role: 'model' as const, parts: functionCalls },
          { role: 'user' as const, parts: toolResponseParts },
        ];

        // Second call for final response
        const finalResponse = await proxyRequest(
          {
            contents: historyWithToolResponses,
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            generationConfig: config,
          },
          ':generateContent?key=unused'
        );

        const finalText = finalResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (onChunk) onChunk(finalText);
      } else {
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (onChunk) onChunk(text);
      }

      return { citations: [] };
    }

    // Standard chat without tools
    const response = await proxyRequest(
      {
        contents: fullHistory,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: config,
      },
      ':generateContent?key=unused'
    );

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (onChunk) onChunk(text);

    return { citations: [] };
  } catch (error) {
    console.error('Error processing Gemini chat:', error);
    throw error;
  }
};
