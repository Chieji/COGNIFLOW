# COGNIFLOW TECHNICAL CONTEXT
**Last Updated**: 2026-01-12

## PROJECT STRUCTURE
```
COGNIFLOW/
├── components/          # React components
│   ├── AssistantChat.tsx       # AI chat interface
│   ├── DevStudioView*.tsx      # Code editor variants
│   ├── KnowledgeGraph*.tsx     # Graph visualization
│   ├── NoteEditor.tsx          # Note editing
│   ├── NoteList.tsx            # Note listing
│   ├── Sidebar.tsx             # Main navigation (32KB - NEEDS SPLIT)
│   └── ...
├── services/           # External service integrations
│   ├── geminiService.ts        # Google Gemini AI
│   ├── huggingfaceService.ts   # HuggingFace models
│   ├── secureGeminiService.ts  # Secure Gemini wrapper
│   └── universalService.ts     # Universal AI adapter
├── utils/              # Utility functions
│   ├── fileSystemBridge.ts     # File operations
│   └── validation.ts           # Input validation
├── App.tsx             # Main app (13KB - NEEDS REFACTOR)
├── store.ts            # Zustand state management
├── db.ts               # Dexie.js database
├── types.ts            # TypeScript type definitions
├── constants.ts        # App constants
└── ...

## TECH STACK

### Core
- **React** 18.3.1 - UI framework
- **TypeScript** 5.6.3 - Type safety
- **Vite** 6.0.7 - Build tool

### State & Data
- **Zustand** 5.0.2 - State management
- **Dexie** 4.0.11 - IndexedDB wrapper
- **D3** 7.9.0 - Graph visualization

### AI/ML
- **@assistant-ui/react** 0.6.4 - Chat UI components
- **@google/genai** 0.21.0 - Gemini AI SDK

### UI
- **lucide-react** 0.469.0 - Icons

## CRITICAL ISSUES (From Audit)

### HIGH Priority
1. **Race conditions** in Dexie.js initialization
2. **Missing input validation** for AI calls (prompt injection risk)
3. **Unhandled promise rejections** in ChatView
4. **Type safety** - extensive use of 'any'

### MEDIUM Priority
1. **Unsafe type casting** in KnowledgeGraph D3 operations
2. **Missing null checks** for optional properties
3. **Unnecessary re-renders** in NoteList
4. **Large components** (App.tsx 13KB, Sidebar.tsx 32KB)

### Security Concerns
- No rate limiting on API calls
- No Content Security Policy
- Missing CORS configuration
- No sanitization of user content

## CURRENT CONFIG

### tsconfig.json
- Target: ES2020
- Module: ESNext
- Strict: true (BUT many 'any' bypasses exist)
- JSX: react-jsx

### vite.config.ts
- React plugin
- No CSP headers (SECURITY ISSUE)

## DATABASE SCHEMA (Dexie)

```typescript
interface Note {
  id?: number;
  title: string;
  content: string;
  tags: string[];
  folderId?: number;
  createdAt: number;
  updatedAt: number;
  attachments?: string[];
}

interface Folder {
  id?: number;
  name: string;
  parentId?: number;
}

// MISSING: Chat message persistence
// MISSING: Conversation history
```

## KNOWN BOTTLENECKS
1. D3 graph re-renders on every state change
2. NoteList renders all notes (no virtualization)
3. Large bundle size (no code splitting)

## DEPENDENCIES TO ADD
- react-window (virtualization)
- vite-bundle-visualizer (bundle analysis)
- vitest + @testing-library/react (testing)

## CODING STANDARDS
- **Naming**: camelCase (props), PascalCase (components), snake_case (DB)
- **Max file size**: 250 lines
- **No 'any'**: Use strict TypeScript
- **Error handling**: Always catch and log
