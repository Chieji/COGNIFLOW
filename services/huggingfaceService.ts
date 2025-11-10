import { Note } from '../types';

interface HuggingFaceResponse {
    generated_text: string;
}

const formatHistoryForHuggingFace = (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string
): string => {
    // Many HF models expect a single string with roles. We'll format it simply.
    let formattedPrompt = history.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n');
    formattedPrompt += `\nuser: ${newMessage}\nmodel:`;
    return formattedPrompt;
};

export const processHuggingFaceChat = async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string,
    apiKey: string,
    modelId: string
): Promise<{ text: string }> => {
    if (!apiKey) {
        throw new Error("API key for Hugging Face is not configured.");
    }
     if (!modelId) {
        throw new Error("Model ID for Hugging Face is not configured.");
    }
    
    const API_URL = `https://api-inference.huggingface.co/models/${modelId}`;

    const formattedPrompt = formatHistoryForHuggingFace(history, newMessage);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: formattedPrompt,
                parameters: {
                    return_full_text: false, // Only return the generated part
                    max_new_tokens: 500,
                }
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Hugging Face API Error: ${errorBody.error || response.statusText}`);
        }

        const result: HuggingFaceResponse[] = await response.json();
        const generatedText = result[0]?.generated_text || "Sorry, I couldn't generate a response.";

        return { text: generatedText.trim() };

    } catch (error) {
        console.error("Error in Hugging Face conversation:", error);
        throw error;
    }
};
