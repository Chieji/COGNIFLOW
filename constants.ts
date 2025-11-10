import { Note, Folder, PatchProposal, FeatureFlag, AuditLogEntry } from './types';

export const initialFolders: Folder[] = [
    {
        id: 'folder-1',
        name: 'Getting Started',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        description: 'Your first folder containing introductory notes about Cogniflow.',
    },
    {
        id: 'folder-2',
        name: 'Technical Notes',
        createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        description: 'A place for code snippets, architectural ideas, and development logs.',
    }
]

export const initialNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Welcome to Cogniflow',
    content: `Cogniflow is your intelligent second brain, an AI-powered memory and workflow engine. Here's how to get started:

1.  **Create Notes**: Use the '+' button in the sidebar to capture anything on your mind. You can now add images, take pictures, and record voice notes using the toolbar in the editor!
2.  **AI Analysis**: Once you've written a note, click the "Analyze Note" button. Our AI will automatically generate a concise summary and relevant tags. You'll need to set your API Key in Settings first!
3.  **Discover Connections**: Switch to the 'Graph' view in the sidebar. Click "Discover Connections" to see how your ideas relate to each other visually.
4.  **Chat with your Brain**: Go to the 'Chat' view. The AI is now an active assistant that can read your notes. You can ask it to perform tasks for you. Try prompts like:
    - "Explain my 'Welcome to Cogniflow' note."
    - "Create a note about the Pomodoro Technique and put it in the 'Getting Started' folder."
    - "Change the 'React State Management' note to be a 'javascript' code file."
    - "Search the web for the latest news on AI."
5.  **Evolve with AI**: Navigate to the 'Dev Studio'. Here, you can ask the AI to improve itself. Try a prompt in the Chat view like: "Propose a patch to make the note cards have a gradient background." The AI will generate a code proposal that you can review and approve in the studio.
6.  **Export Your Data**: Use the "Export Notes" button in the sidebar to download all your data as a JSON file.

This system is designed to help students, freelancers, and teams think better, organize tasks, and build a powerful, interconnected knowledge base. Enjoy exploring!`,
    summary: 'A guide on using Cogniflow for note-taking, AI analysis, and exploring connections in the knowledge graph.',
    tags: ['welcome', 'guide', 'getting-started', 'AI', 'knowledge-management'],
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    folderId: 'folder-1',
    type: 'text',
    attachments: [],
  },
  {
    id: 'note-2',
    title: 'The Power of Atomic Notes',
    content: `The concept of "atomic notes" is central to building an effective second brain. An atomic note is a single, self-contained idea. It should be brief and focused on one concept.

Why is this powerful?
-   **Reusability**: Small, focused notes can be easily linked and combined in various contexts.
-   **Clarity**: Writing atomically forces you to clarify your thinking.
-   **Connectivity**: It's much easier to form meaningful links between granular ideas than between long, monolithic documents.

Each note in your Cogniflow should strive to be an atomic. This will make the AI's connection discovery much more effective and your knowledge graph more insightful.`,
    summary: 'Atomic notes are single, self-contained ideas that enhance reusability, clarity, and connectivity, making AI connection discovery more effective.',
    tags: ['productivity', 'note-taking', 'zettelkasten', 'learning'],
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    folderId: 'folder-1',
    type: 'text',
    attachments: [],
  },
    {
    id: 'note-3',
    title: 'React State Management',
    content: `When building complex React applications, managing state is a crucial challenge. There are several popular approaches:
    
- **useState & useReducer**: Built-in hooks for local and component-level state. Great for simple to moderately complex scenarios.
- **Context API**: Provides a way to pass data through the component tree without having to pass props down manually at every level. Often paired with useReducer for a lightweight global state solution.
- **External Libraries**: For large-scale applications, libraries like Redux, Zustand, or Jotai offer more powerful features, including middleware, devtools integration, and performance optimizations. Zustand is known for its simplicity and minimal boilerplate.`,
    summary: 'An overview of React state management techniques, including built-in hooks like useState and Context API, and external libraries like Redux and Zustand for different application scales.',
    tags: ['react', 'frontend', 'state-management', 'web-development'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folderId: 'folder-2',
    type: 'code',
    language: 'javascript',
    attachments: [],
  },
];


// Initial data for Dev Studio
export const initialPatches: PatchProposal[] = [
     {
        id: 'patch-6',
        title: "AI Content Awareness & Multimedia Capture",
        description: "CRITICAL UPGRADE: This patch introduces the essential `get_note_content` tool, allowing the AI to read and understand the user's notes. It also adds the `set_note_metadata` tool for managing note types and languages. The Note Editor is upgraded with a multimedia toolbar for file uploads, camera capture, and voice recording.",
        codeDiff: `--- a/src/types.ts
+++ b/src/types.ts
+ export type AiTool = '...' | 'get_note_content' | 'set_note_metadata';

--- a/src/App.tsx
+++ b/src/App.tsx
+ case 'get_note_content': {
+   const { note_id } = action.args;
+   const note = notes.find(n => n.id === note_id);
+   return note ? note.content : 'Error: Note not found.';
+ }
+ case 'set_note_metadata': {
+   const { note_id, language, type } = action.args;
+   // ... logic to update note metadata
+   return 'Successfully updated metadata.';
+ }
--- a/components/NoteEditor.tsx
+++ b/components/NoteEditor.tsx
+ // Adds toolbar for file, camera, and voice inputs
+ // Adds logic for handling attachments
`,
        tests: "1. Ask the AI to 'explain my welcome note'. Verify it responds with the note's content.\n2. Add an image to a note using the new button.\n3. Verify the image appears in the note.",
        status: 'approved',
        createdAt: new Date().toISOString(),
        modelUsed: 'gemini-architect',
    },
    {
        id: 'patch-5',
        title: "Add 'create_folder' Tool for AI",
        description: "This patch introduces a 'create_folder' tool for the AI. It allows the AI to create a new folder by name when requested by the user, enhancing its organizational capabilities.",
        codeDiff: `--- a/src/types.ts
+++ b/src/types.ts
- export type AiTool = 'create_note' | 'update_note' | 'add_tags_to_note' | 'propose_code_patch' | 'update_folder_description' | 'delete_folder';
+ export type AiTool = 'create_note' | 'update_note' | 'add_tags_to_note' | 'propose_code_patch' | 'create_folder' | 'update_folder_description' | 'delete_folder';
`,
        tests: "1. Ask the AI to 'create a folder named Test Folder'.\n2. Verify the folder appears in the sidebar.\n3. Ask the AI to create a folder with a name that already exists.\n4. Verify the AI returns an error message.",
        status: 'approved',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        modelUsed: 'gemini',
    },
     {
        id: 'patch-4',
        title: 'Add Folder Deletion Tool',
        description: "This patch introduces a 'delete_folder' tool for the AI. It allows the AI to delete a folder by its ID. Any notes within the deleted folder will be reassigned to 'Uncategorized'.",
        codeDiff: `--- a/src/types.ts
+++ b/src/types.ts
- export type AiTool = '...' | 'create_folder' | 'update_folder_description';
+ export type AiTool = '...' | 'create_folder' | 'update_folder_description' | 'delete_folder';
`,
        tests: "1. Ask the AI to create a new folder.\n2. Ask the AI to create a new note and place it in the new folder.\n3. Verify the note is in the folder.\n4. Ask the AI to delete the folder.\n5. Verify the folder is gone and the note is now in 'Uncategorized'.",
        status: 'approved',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        modelUsed: 'gemini',
    },
    {
        id: 'patch-3',
        title: 'Add Description Field to Folders',
        description: "This patch introduces a `description` field to folders and adds a tool for the AI to update it.",
        codeDiff: `--- a/types.ts
+++ b/types.ts
export interface Folder {
+ description: string;
}
`,
        tests: "1. Create a new folder.\n2. Ask the AI to add a description to the new folder.\n3. Verify that the folder's description is updated with the provided text.",
        status: 'approved',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        modelUsed: 'gemini',
    },
    {
        id: 'patch-1',
        title: 'Enhance Note Card Styling',
        description: 'This patch updates the styling for note cards in the list view. It adds a subtle gradient background and a hover effect to make the UI more dynamic and visually appealing.',
        codeDiff: `--- a/components/NoteList.tsx
+++ b/components/NoteList.tsx
- className={\`...\`}
+ className={\`... bg-gradient-to-r from-light-accent/20 ...\`}
`,
        tests: "1. Verify note cards have a gradient background when active.\n2. Verify note cards have a shadow effect on hover.",
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        modelUsed: 'gemini',
    },
    {
        id: 'patch-2',
        title: 'Add Confirmation for Note Deletion',
        description: 'To prevent accidental data loss, this patch implements a browser confirmation dialog (`window.confirm`) that appears before a note is permanently deleted.',
        codeDiff: `--- a/components/NoteList.tsx
+++ b/components/NoteList.tsx
- deleteNote(noteId);
+ if(window.confirm("Are you sure?")) { deleteNote(noteId); }
`,
        tests: "1. Click delete button on a note.\n2. Verify confirmation dialog appears.\n3. Click 'Cancel' and verify note is not deleted.\n4. Click 'OK' and verify note is deleted.",
        status: 'approved',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        modelUsed: 'gemini',
    }
];

export const initialFeatureFlags: FeatureFlag[] = [
    {
        id: 'flag-1',
        name: 'Real-time Collaboration',
        description: 'Enable real-time synchronization of notes for collaborative editing (requires backend).',
        isEnabled: false,
    },
    {
        id: 'flag-2',
        name: 'Daily Insights Dashboard',
        description: 'Show a new dashboard view summarizing daily activity and surfacing interesting connections.',
        isEnabled: true,
    }
];

export const initialAuditLog: AuditLogEntry[] = [
    {
        id: 'log-5',
        patchId: 'patch-6',
        timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
        status: 'approved',
    },
    {
        id: 'log-4',
        patchId: 'patch-5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        status: 'approved',
    },
    {
        id: 'log-3',
        patchId: 'patch-4',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        status: 'approved',
    },
    {
        id: 'log-2',
        patchId: 'patch-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        status: 'approved',
    },
    {
        id: 'log-1',
        patchId: 'patch-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        status: 'approved',
    }
];