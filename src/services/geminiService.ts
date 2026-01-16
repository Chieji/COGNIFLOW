// FIX: Removed FunctionDeclarationSchema from import as it is not an exported member.
import { GoogleGenAI, Type, FunctionDeclaration, Modality, GenerateContentResponse } from '@google/genai';
import { Note, Connection, Citation, AiAction, Folder } from '../types';
import { sanitizeAIPrompt, validateApiKey, validateNoteContent, aiCallLimiter } from '../utils/validation';
import { mcpService } from './mcpService';

interface SummaryAndTags {
    summary: string;
    tags: string[];
}

export const summarizeAndTagNote = async (content: string, apiKey: string): Promise<SummaryAndTags | null> => {
    if (!apiKey) {
        throw new Error("API key for Gemini is not configured.");
    }

    const apiKeyValidation = validateApiKey(apiKey, 'gemini');
    if (!apiKeyValidation.valid) {
        throw new Error(apiKeyValidation.error);
    }

    const contentValidation = validateNoteContent(content);
    if (!contentValidation.valid) {
        throw new Error(contentValidation.error);
    }

    const sanitizedContent = sanitizeAIPrompt(content);

    if (!aiCallLimiter.isAllowed('summarizeAndTagNote')) {
        throw new Error('Rate limit exceeded. Please try again later.');
    }

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the following note content. Provide a concise, one-sentence summary and generate between 3 to 5 relevant tags (as single words or short phrases).

      Content: "${sanitizedContent}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: "A concise, one-sentence summary of the note."
                        },
                        tags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 3 to 5 relevant tags."
                        }
                    },
                    required: ["summary", "tags"],
                }
            }
        });

        const jsonString = response.text;
        if (!jsonString) {
            throw new Error('No response text from AI');
        }
        const result: SummaryAndTags = JSON.parse(jsonString);
        return result;

    } catch (error) {
        console.error("Error generating summary and tags:", error);
        throw error;
    }
};

interface FoundConnections {
    connections: {
        reason: string;
        note1_id: string;
        note2_id: string;
    }[]
}

export const findConnections = async (notes: Note[], apiKey: string): Promise<Connection[]> => {
    if (!apiKey) {
        throw new Error("API key for Gemini is not configured.");
    }

    const apiKeyValidation = validateApiKey(apiKey, 'gemini');
    if (!apiKeyValidation.valid) {
        throw new Error(apiKeyValidation.error);
    }

    if (notes.length < 2) return [];

    if (!aiCallLimiter.isAllowed('findConnections')) {
        throw new Error('Rate limit exceeded. Please try again later.');
    }

    const notesForPrompt = notes.map(note => ({ id: note.id, title: note.title, summary: note.summary || note.content.substring(0, 100) }));
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Given the following list of notes, identify meaningful connections between them based on shared concepts, themes, or direct relationships. Only identify a connection if it's strong and relevant.

      Notes: ${JSON.stringify(notesForPrompt)}

      For each connection you find, specify the IDs of the two connected notes.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        connections: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    reason: {
                                        type: Type.STRING,
                                        description: "A brief explanation of why the two notes are connected."
                                    },
                                    note1_id: {
                                        type: Type.STRING,
                                        description: "The ID of the first note in the connection."
                                    },
                                    note2_id: {
                                        type: Type.STRING,
                                        description: "The ID of the second note in the connection."
                                    }
                                },
                                required: ["reason", "note1_id", "note2_id"],
                            }
                        }
                    }
                }
            }
        });

        const jsonString = response.text;
        if (!jsonString) {
            throw new Error('No response text from AI');
        }
        const result: FoundConnections = JSON.parse(jsonString);

        const validNoteIds = new Set(notes.map(n => n.id));

        if (result.connections) {
            return result.connections
                .filter(c => validNoteIds.has(c.note1_id) && validNoteIds.has(c.note2_id))
                .map(c => ({ source: c.note1_id, target: c.note2_id }));
        }
        return [];

    } catch (error) {
        console.error("Error finding connections:", error);
        throw error;
    }
};

export const analyzeVisualMedia = async (
    prompt: string,
    media: { mimeType: string, data: string }[],
    apiKey: string,
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro'
): Promise<string> => {
    if (!apiKey) throw new Error("API key for Gemini is not configured.");

    const apiKeyValidation = validateApiKey(apiKey, 'gemini');
    if (!apiKeyValidation.valid) {
        throw new Error(apiKeyValidation.error);
    }

    const sanitizedPrompt = sanitizeAIPrompt(prompt);

    if (!aiCallLimiter.isAllowed('analyzeVisualMedia')) {
        throw new Error('Rate limit exceeded. Please try again later.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const parts = [
        { text: sanitizedPrompt },
        ...media.map(m => ({
            inlineData: {
                mimeType: m.mimeType,
                data: m.data,
            }
        }))
    ];

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts as any },
        });
        const text = response.text;
        if (!text) {
            throw new Error('No response text from AI');
        }
        return text;
    } catch (error) {
        console.error("Error analyzing visual media:", error);
        throw error;
    }
};

export const generateSpeech = async (text: string, apiKey: string): Promise<string | null> => {
    if (!apiKey) throw new Error("API key for Gemini is not configured for TTS.");

    const apiKeyValidation = validateApiKey(apiKey, 'gemini');
    if (!apiKeyValidation.valid) {
        throw new Error(apiKeyValidation.error);
    }

    if (!text || text.trim().length === 0) {
        throw new Error('Text is required for speech generation');
    }

    if (text.length > 1000) {
        throw new Error('Text for speech generation cannot exceed 1000 characters');
    }

    const sanitizedText = sanitizeAIPrompt(text);

    if (!aiCallLimiter.isAllowed('generateSpeech')) {
        throw new Error('Rate limit exceeded. Please try again later.');
    }

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say: ${sanitizedText}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
};

const tools: FunctionDeclaration[] = [
    {
        name: "get_note_content",
        description: "Retrieves the full text content of a single note, given its ID. This is essential for answering user questions about a specific note.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to read." },
            },
            required: ["note_id"],
        },
    },
    {
        name: "set_note_metadata",
        description: "Updates the metadata of a note, such as its type or programming language.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to update." },
                language: { type: Type.STRING, description: "The programming language for a code note (e.g., 'javascript', 'python')." },
                type: { type: Type.STRING, description: "The type of the note ('text', 'code', 'link')." },
            },
            required: ["note_id"],
        },
    },
    {
        name: "create_note",
        description: "Creates a new note. The user can optionally specify a folder to place the note in.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title of the note." },
                content: { type: Type.STRING, description: "The content of the note." },
                folder_id: { type: Type.STRING, description: "Optional. The ID of the folder to create the note in. If not provided, the note will be uncategorized." },
            },
            required: ["title", "content"],
        },
    },
    {
        name: "create_folder",
        description: "Creates a new folder for organizing notes.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "The name of the new folder." },
            },
            required: ["name"],
        },
    },
    {
        name: "delete_folder",
        description: "Deletes a folder. Any notes inside will become uncategorized.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                folder_id: { type: Type.STRING, description: "The ID of the folder to delete." },
            },
            required: ["folder_id"],
        },
    },
    {
        name: "explain_note_connections",
        description: "Explains the connections a specific note has to other notes in the knowledge graph.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to analyze connections for." },
            },
            required: ["note_id"],
        },
    },
    {
        name: "update_note",
        description: "Appends new content to an existing note identified by its ID.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to update." },
                content: { type: Type.STRING, description: "The content to append to the note." },
            },
            required: ["note_id", "content"],
        },
    },
    {
        name: "write_file",
        description: "Overwrites the entire content of an existing note with new content. Use this for refactoring code, rewriting text, or replacing placeholder content.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to write to." },
                content: { type: Type.STRING, description: "The new content to write into the note." },
            },
            required: ["note_id", "content"],
        },
    },
    {
        name: "add_tags_to_note",
        description: "Adds a list of tags to an existing note identified by its ID.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to add tags to." },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of tags to add." },
            },
            required: ["note_id", "tags"],
        },
    },
    {
        name: "update_folder_description",
        description: "Updates the description of an existing folder identified by its ID.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                folder_id: { type: Type.STRING, description: "The ID of the folder to update." },
                description: { type: Type.STRING, description: "The new description for the folder." },
            },
            required: ["folder_id", "description"],
        },
    },
    {
        name: "propose_code_patch",
        description: "Proposes a code modification to the application itself. This should be used for suggesting improvements, fixing bugs, or adding new features. The user will review and approve the patch in the Dev Studio.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "A concise, descriptive title for the patch proposal." },
                description: { type: Type.STRING, description: "A detailed explanation of what the patch does and why it's needed." },
                code_diff: { type: Type.STRING, description: "The code change in standard 'diff' format. Use '--- a/path/to/file.tsx' for the original and '+++ b/path/to/file.tsx' for the new version." },
                tests: { type: Type.STRING, description: "A brief, human-readable description of the manual tests needed to verify this patch works as expected." },
            },
            required: ["title", "description", "code_diff", "tests"],
        },
    },
    {
        name: "update_note_title",
        description: "Updates the title of an existing note.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to rename." },
                new_title: { type: Type.STRING, description: "The new title for the note." },
            },
            required: ["note_id", "new_title"],
        },
    },
    {
        name: "move_note_to_folder",
        description: "Moves a note to a different folder. To move a note to 'Uncategorized', do not provide a folder_id.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to move." },
                folder_id: { type: Type.STRING, description: "Optional. The ID of the destination folder. Omit to move to Uncategorized." },
            },
            required: ["note_id"],
        },
    },
    {
        name: "list_folders",
        description: "Provides a list of all available folders with their names and IDs. Useful when the user wants to move a note or create a note in a specific folder.",
        parameters: {
            type: Type.OBJECT,
            properties: {},
        },
    },
    {
        name: "cleanup_note_content",
        description: "Cleans up and organizes the content of a note by removing duplicates, improving formatting, fixing grammar, and making it more readable.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_id: { type: Type.STRING, description: "The ID of the note to clean up." },
            },
            required: ["note_id"],
        },
    },
    {
        name: "organize_notes_by_topic",
        description: "Analyzes multiple notes and suggests how to organize them by creating appropriate folders and moving notes to those folders.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                note_ids: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of note IDs to organize." },
            },
            required: ["note_ids"],
        },
    },
    {
        name: "create_note_from_conversation",
        description: "Creates a new note based on the current conversation context. Useful when users describe ideas, tasks, or information that should be saved.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "A descriptive title for the note." },
                content: { type: Type.STRING, description: "The content to save in the note." },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional tags for the note." },
                folder_id: { type: Type.STRING, description: "Optional folder to place the note in." },
            },
            required: ["title", "content"],
        },
    },
    {
        name: "execute_browseros_action",
        description: "Execute an action through BrowserOS MCP integration. Use this when user wants to interact with the browser, visit websites, or perform web-based tasks.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, description: "The action to perform (e.g., 'visit_url', 'click_element', 'extract_content')" },
                parameters: { type: Type.OBJECT, description: "Parameters for the action" },
            },
            required: ["action", "parameters"],
        },
    }
];

export const processChatTurn = async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string,
    apiKey: string,
    useWebSearch: boolean,
    contextNotes: Note[],
    contextFolders: Folder[],
    onExecuteAction: (action: AiAction) => string,
    model: string,
    thinkingBudget: number | null,
    onChunk: (text: string) => void,
    currentNote?: Note | null
): Promise<{ citations: Citation[] }> => {
    if (!apiKey) {
        throw new Error("API key for Gemini is not configured.");
    }

    const apiKeyValidation = validateApiKey(apiKey, 'gemini');
    if (!apiKeyValidation.valid) {
        throw new Error(apiKeyValidation.error);
    }

    if (!newMessage || newMessage.trim().length === 0) {
        throw new Error('Message is required');
    }

    if (newMessage.length > 5000) {
        throw new Error('Message cannot exceed 5000 characters');
    }

    const sanitizedMessage = sanitizeAIPrompt(newMessage);

    if (!aiCallLimiter.isAllowed('processChatTurn')) {
        throw new Error('Rate limit exceeded. Please try again later.');
    }

    const ai = new GoogleGenAI({ apiKey });

    const noteOptionsForPrompt = contextNotes.map(n => ({ id: n.id, title: n.title }));
    const folderOptionsForPrompt = contextFolders.map(f => ({ id: f.id, name: f.name }));

    const notesContext = contextNotes.length > 0
        ? `Here is a list of available notes user has. Use their IDs when a tool requires a note_id:\n${JSON.stringify(noteOptionsForPrompt)}\n\n`
        : "";

    const foldersContext = contextFolders.length > 0
        ? `Here is a list of available folders user has. Use their IDs when a tool requires a folder_id:\n${JSON.stringify(folderOptionsForPrompt)}\n\n`
        : "";

    const currentNoteContext = currentNote
        ? `CURRENT NOTE CONTEXT: You are currently helping with the note "${currentNote.title}" (ID: ${currentNote.id}). The note contains:\n\n${currentNote.content}\n\nWhen the user asks you to modify, organize, or work with "this note" or "the current note", refer to this note.\n\n`
        : "";

    const systemInstruction = `You are CogniFlow's Architect, a helpful AI assistant within a personal knowledge management app. Your mission is to be helpful, proactive, and capable of modifying the app's own functionality through code patches. You have access to a list of the user's notes and folders.

 ${currentNoteContext}
 ${notesContext}
 ${foldersContext}

 IMPORTANT CAPABILITIES:
 - You can CREATE, READ, UPDATE, and DELETE notes and folders
 - When users describe content that should be saved as a note, proactively offer to create it
 - When users ask you to organize, clean up, or arrange notes, use the available tools
 - When users want to remember something, suggest creating a note
 - You have full permissions to manage the user's knowledge base

 NATURAL LANGUAGE NOTE CREATION:
 - If a user describes content that would benefit from being saved (ideas, tasks, reminders, research, etc.), offer to create a note
 - When creating notes from conversation, give them descriptive titles and organize content logically
 - Suggest appropriate tags and folder organization

 NOTE MANAGEMENT:
 - Help users organize their thoughts by creating structured notes
 - Clean up and reorganize existing notes when requested
 - Create connections between related notes
 - Update note content, titles, and metadata as needed

 When asked to read notes, create or manage notes and folders, or propose code changes, you must use the provided tools. Be concise and helpful in your responses to the user. When searching the web, provide citations for your answers.`;

    try {
        const fullHistory = [...history, { role: 'user' as const, parts: [{ text: sanitizedMessage }] }];

        const modelTools: any[] = [];
        if (useWebSearch) {
            modelTools.push({ googleSearch: {} });
        } else {
            modelTools.push({ functionDeclarations: tools });
        }

        const config: any = {
            tools: modelTools,
        };

        if (thinkingBudget !== null) {
            config.thinkingConfig = { thinkingBudget };
        }

        if (useWebSearch) {
            const stream = await ai.models.generateContentStream({
                model: model,
                contents: fullHistory,
                systemInstruction: { parts: [{ text: systemInstruction }] },
                config,
            });
            for await (const chunk of stream) {
                onChunk(chunk.text);
            }
            const finalResponse = await stream.response;
            const citations: Citation[] = [];
            if (finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                for (const chunk of finalResponse.candidates[0].groundingMetadata.groundingChunks) {
                    if (chunk.web) {
                        citations.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
                    }
                }
            }
            return { citations };
        }

        // --- Tool usage flow ---
        let response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: fullHistory,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            config,
        });

        const functionCalls = response.functionCalls;

        if (!useWebSearch && functionCalls && functionCalls.length > 0) {
            const toolResponseParts = [];
            for (const call of functionCalls) {
                let result;

                // Handle MCP-specific tool calls
                if (call.name === 'execute_browseros_action') {
                    try {
                        // Initialize MCP service if not already connected
                        if (!mcpService.isConnectedToMCP()) {
                            await mcpService.initialize();
                        }

                        if (mcpService.isConnectedToMCP()) {
                            result = await mcpService.callTool(call.name, call.args);
                        } else {
                            result = "Error: Could not connect to BrowserOS MCP server";
                        }
                    } catch (error) {
                        console.error("Error calling MCP tool:", error);
                        result = `Error executing BrowserOS action: ${(error as Error).message}`;
                    }
                } else {
                    // Handle regular COGNIFLOW tools
                    result = onExecuteAction({ tool: call.name as any, args: call.args });
                }

                toolResponseParts.push({
                    toolResponse: {
                        id: call.id,
                        name: call.name,
                        response: { name: call.name, content: result },
                    },
                });
            }

            const historyWithToolResponses = [
                ...fullHistory,
                { role: 'model' as const, parts: functionCalls.map(fc => ({ functionCall: fc })) },
                { role: 'user' as const, parts: toolResponseParts },
            ];

            // Second call is streamed to the user
            const stream = await ai.models.generateContentStream({
                model: model,
                contents: historyWithToolResponses,
                systemInstruction: { parts: [{ text: systemInstruction }] },
                config,
            });
            for await (const chunk of stream) {
                onChunk(chunk.text);
            }
        } else {
            // No tool calls, AI responded directly. Send the text in one chunk.
            onChunk(response.text);
        }

        return { citations: [] };

    } catch (e) {
        console.error("Error processing chat turn:", e);
        if (e instanceof Error) {
            throw e;
        }
        throw new Error("An unknown error occurred during chat processing.");
    }
};

export const getSmartRecommendations = async (currentNote: Note, allNotes: Note[], apiKey: string): Promise<{ relatedNoteIds: string[], suggestedTags: string[], nextSteps: string[] }> => {
    if (!apiKey) throw new Error("Gemini API key is not configured.");

    const apiKeyValidation = validateApiKey(apiKey, 'gemini');
    if (!apiKeyValidation.valid) {
        throw new Error(apiKeyValidation.error);
    }

    if (!aiCallLimiter.isAllowed('getSmartRecommendations')) {
        throw new Error('Rate limit exceeded. Please try again later.');
    }

    const contentValidation = validateNoteContent(currentNote.content);
    if (!contentValidation.valid) {
        throw new Error(contentValidation.error);
    }

    const sanitizedContent = sanitizeAIPrompt(currentNote.content);

    const notesContext = allNotes
        .filter(n => n.id !== currentNote.id)
        .map(n => ({ id: n.id, title: n.title, tags: n.tags }));

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the current note and available notes to provide smart recommendations.

      Current Note:
      Title: ${currentNote.title}
      Content: ${sanitizedContent}
      Tags: ${currentNote.tags.join(', ')}

      Available Notes (ID, Title, Tags):
      ${JSON.stringify(notesContext)}

      Provide:
      1. relatedNoteIds: IDs of up to 3 most relevant existing notes.
      2. suggestedTags: 3-5 new tags that fit this note.
      3. nextSteps: 2-3 actionable next steps or questions to expand this note.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        relatedNoteIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["relatedNoteIds", "suggestedTags", "nextSteps"]
                }
            }
        });

        const text = response.text || '{}';
        return JSON.parse(text);
    } catch (error) {
        console.error("Error getting recommendations:", error);
        return { relatedNoteIds: [], suggestedTags: [], nextSteps: [] };
    }
};
