export interface UniversalChatResponse {
  text: string;
}

export const processUniversalChat = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  apiKey: string,
  baseUrl: string,
  modelId: string,
  onChunk?: (chunk: string) => void
): Promise<UniversalChatResponse> => {
  if (!baseUrl) {
    throw new Error("Base URL for Universal Provider is not configured.");
  }
  if (!modelId) {
    throw new Error("Model ID for Universal Provider is not configured.");
  }

  // Format history for OpenAI-compatible API
  const messages = history.map((msg) => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.parts[0].text,
  }));
  messages.push({ role: 'user', content: newMessage });

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Universal API Error: ${errorBody.error?.message || response.statusText}`);
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
      }
      return { text: fullText };
    } else {
      const result = await response.json();
      return { text: result.choices[0]?.message?.content || '' };
    }
  } catch (error) {
    console.error("Error in Universal Provider conversation:", error);
    throw error;
  }
};
