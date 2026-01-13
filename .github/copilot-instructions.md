# COGNIFLOW Copilot Instructions

## Project Overview
COGNIFLOW is a React + TypeScript application built with Vite, featuring AI-powered knowledge graphs and development studio. It uses Zustand for state management, Dexie for IndexedDB storage, and integrates multiple AI providers (Gemini, OpenAI, Anthropic, Hugging Face).

## Architecture
- **State Management**: Zustand with slices (`notesSlice`, `uiSlice`, `chatSlice`) in `/src/store/`
- **Components**: Modular structure in `/src/components/` with views in `views/`, layout in `layout/`
- **AI Services**: Provider-agnostic services in `/services/` (e.g., `geminiService.ts`, `universalService.ts`)
- **Data Flow**: Notes → AI analysis → Knowledge graph visualization with D3.js
- **Build Tool**: Vite with TypeScript, runs on port 1477 in dev

## Development Workflow
- **Install**: `npm ci` for reproducible installs
- **Dev Server**: `npm run dev` (port 1477, not 3000)
- **Build**: `npm run build` → outputs to `dist/`
- **Test**: `npm test` (Vitest with UI support via `npm run test:ui`)
- **Type Check**: `npm run type-check` (noEmit mode)
- **Lint**: Placeholder script - add ESLint when implementing

## Environment Setup
- Copy `.env.example` to `.env.local`
- Required: `VITE_GEMINI_API_KEY` for AI features
- Optional: `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_HUGGINGFACE_API_KEY`
- Never commit `.env.local` or expose keys in client code

## Key Patterns
- **State Updates**: Use Zustand actions, avoid direct mutations
- **AI Integration**: Wrap API calls in try/catch, handle missing keys gracefully
- **Components**: Use `ErrorBoundary` for resilience, memoize heavy renders
- **Database**: Dexie queries in async functions, use indices for performance
- **Styling**: Tailwind CSS with custom accent colors via CSS variables

## Code Examples
- **Adding AI Feature**: Import from `/services/`, call with apiKey from `import.meta.env`
- **New Component**: Place in `/src/components/`, export from appropriate index
- **State Slice**: Follow pattern in `store/` - create slice function returning actions + state

## Validation Checks
- Dev server responds on port 1477
- Build succeeds and `dist/` contains expected files
- Type checking passes without errors
- Tests run and pass (expand test coverage as implemented)
- No API keys in git diff

## Priorities
- **Must**: Secure API keys, validate builds, maintain type safety
- **Should**: Use `npm ci`, implement error boundaries, add tests for new features
- **Could**: Optimize bundle size, add performance monitoring
- **Won't**: Expose secrets, make breaking changes without review

## Commands Reference
- Install: `npm ci`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Typecheck: `npm run type-check`
- Docker Dev: `docker-compose up --build`