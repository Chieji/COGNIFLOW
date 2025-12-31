# Contributing to COGNIFLOW

Thank you for your interest in contributing to COGNIFLOW! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Testing](#testing)
9. [Documentation](#documentation)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/COGNIFLOW.git
   cd COGNIFLOW
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Chieji/COGNIFLOW.git
   ```

---

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then, edit `.env.local` with your API keys:

```
VITE_API_PROXY_URL=http://localhost:3001/api
```

**Note:** For local development, you can use the proxy URL pointing to your local backend.

### 3. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

---

## Project Structure

```
COGNIFLOW/
├── api/                          # Backend API handlers (Vercel/Cloudflare)
│   └── proxy.ts                  # Secure API proxy for AI providers
├── components/                   # React components
│   ├── ChatView.tsx
│   ├── DevStudioView.tsx
│   ├── DevStudioViewEnhanced.tsx # New: File system integration
│   ├── KnowledgeGraph.tsx
│   ├── KnowledgeGraphOptimized.tsx # New: Performance optimized
│   ├── NoteEditor.tsx
│   ├── NoteList.tsx
│   ├── Sidebar.tsx
│   ├── SettingsModal.tsx
│   ├── CodeDiffViewer.tsx
│   ├── Tag.tsx
│   ├── icons.tsx
│   └── Spinner.tsx
├── services/                     # AI service integrations
│   ├── geminiService.ts          # Original Gemini service
│   ├── secureGeminiService.ts    # New: Proxy-based Gemini service
│   ├── huggingfaceService.ts
│   └── universalService.ts
├── utils/                        # Utility functions
│   ├── fileSystemBridge.ts       # New: File System Access API
│   └── (other utilities)
├── App.tsx                       # Main application component
├── store.ts                      # Zustand state management
├── db.ts                         # Dexie.js database configuration
├── types.ts                      # TypeScript type definitions
├── constants.ts                  # Application constants
├── index.tsx                     # React entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies
├── .env.example                  # Environment variable template
├── TECHNICAL_DEBT_AUDIT.md       # Technical debt documentation
└── README.md                     # Project README
```

---

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true` in `tsconfig.json`)
- Avoid `any` types; use proper type definitions
- Use interfaces for object types, types for unions/primitives
- Export types explicitly

```typescript
// ✅ Good
export interface Note {
  id: string;
  title: string;
  content: string;
}

export type NoteType = 'text' | 'code' | 'link';

// ❌ Avoid
export const createNote = (data: any): any => {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use `React.FC<Props>` for type safety
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `React.memo` for components that receive complex props

```typescript
// ✅ Good
interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = React.memo(({ note, isActive, onSelect }) => {
  return <div onClick={() => onSelect(note.id)}>{note.title}</div>;
});

// ❌ Avoid
const NoteItem = ({ note, isActive, onSelect }) => {
  return <div onClick={() => onSelect(note.id)}>{note.title}</div>;
};
```

### Styling

- Use Tailwind CSS utility classes
- Follow the existing color scheme (light/dark modes)
- Use semantic class names

```typescript
// ✅ Good
<button className="px-4 py-2 bg-light-accent text-white rounded-lg hover:opacity-90 transition-opacity">
  Submit
</button>

// ❌ Avoid
<button style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white' }}>
  Submit
</button>
```

### Error Handling

- Always wrap async operations in try-catch blocks
- Provide meaningful error messages
- Log errors for debugging

```typescript
// ✅ Good
try {
  const result = await fetchData();
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to fetch data:', error);
  throw new Error(`Data fetch failed: ${message}`);
}

// ❌ Avoid
const result = await fetchData();
return result;
```

---

## Commit Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

### Examples

```bash
git commit -m "feat(dev-studio): add file system access API integration"
git commit -m "fix(knowledge-graph): prevent race condition in simulation"
git commit -m "docs: update contributing guidelines"
git commit -m "refactor(store): improve type safety with explicit interfaces"
```

---

## Pull Request Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow coding standards
   - Add comments for complex logic
   - Update relevant documentation

3. **Test your changes:**
   ```bash
   npm run build
   ```

4. **Commit your changes:**
   ```bash
   git commit -m "feat(scope): description"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request:**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots/videos for UI changes
   - Ensure all checks pass

7. **Address review feedback:**
   - Make requested changes
   - Push updates to the same branch
   - Don't force-push unless requested

---

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for components
- Aim for >80% code coverage

```typescript
// ✅ Example test
describe('findConnections', () => {
  it('should find semantic connections between notes', async () => {
    const notes = [
      { id: '1', title: 'AI', content: 'Artificial Intelligence' },
      { id: '2', title: 'ML', content: 'Machine Learning' },
    ];

    const connections = await findConnections(notes, 'test-key');
    
    expect(connections).toHaveLength(1);
    expect(connections[0].source).toBe('1');
    expect(connections[0].target).toBe('2');
  });
});
```

---

## Documentation

### Code Comments

- Comment complex logic and non-obvious decisions
- Use JSDoc for public functions

```typescript
/**
 * Apply a unified diff to file content
 * @param content - The original file content
 * @param chunk - The parsed diff chunk
 * @returns The modified file content
 */
export function applyDiffToContent(content: string, chunk: DiffChunk): string {
  // Implementation
}
```

### README Updates

- Update README.md if adding new features
- Include usage examples
- Document new environment variables in `.env.example`

### CHANGELOG

- Update CHANGELOG.md with your changes
- Follow [Keep a Changelog](https://keepachangelog.com/) format

---

## Reporting Issues

When reporting bugs:

1. **Check existing issues** to avoid duplicates
2. **Provide a clear title** that describes the problem
3. **Include reproduction steps:**
   ```
   1. Open the application
   2. Click on "Create Note"
   3. Enter text and click "Save"
   4. Expected: Note is saved
   5. Actual: Error message appears
   ```
4. **Include environment details:**
   - OS and browser version
   - Node.js version
   - Steps to reproduce

---

## Getting Help

- **Questions:** Open a discussion on GitHub
- **Bugs:** Open an issue with reproduction steps
- **Features:** Open an issue with a detailed proposal

---

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- GitHub contributors page

---

## License

By contributing to COGNIFLOW, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to COGNIFLOW! 🚀
