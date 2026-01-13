<div align="center">
  <img width="1200" alt="COGNIFLOW Banner" src="./new_banner.png" />
  
  <h1>COGNIFLOW</h1>
  <p><strong>The Intelligent Second Brain & Development Studio</strong></p>
  
  [![NPM Version](https://img.shields.io/npm/v/@chieji/cogniflow?color=red&style=flat-square)](https://www.npmjs.com/package/@chieji/cogniflow)
  [![License](https://img.shields.io/github/license/Chieji/COGNIFLOW?style=flat-square&color=black)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-red.svg?style=flat-square)](CONTRIBUTING.md)
</div>

---

## 🚀 Overview

**COGNIFLOW** is a professional-grade application designed for developers, researchers, and power users to organize thoughts, code snippets, and research into an interconnected, AI-enhanced knowledge graph. It bridges the gap between structured note-taking and active development, providing a seamless environment for discovery and creation.

## 📋 Project Status & Roadmap

COGNIFLOW is currently in **Phase 3: Production Readiness**. See our [ROADMAP.md](ROADMAP.md) for detailed development plans and upcoming features.

**Recent Achievements:**

- ✅ **PWA & Offline Mode**: Installable as a native app with full offline support.
- ✅ **Voice-to-Note**: Real-time speech recognition for dictating notes.
- ✅ **Visual Intelligence**: AI-powered image analysis and object detection.
- ✅ **Smart Recommendations**: AI suggests tags, related notes, and next steps.
- ✅ **Version History**: Auto-save and restore previous versions of notes.
- ✅ **AI Chat Interface**: Professional UX with streaming responses.
- ✅ **Knowledge Graph**: Interactive visualization of semantic connections.

**Next Priorities:**

- 🔄 Cloud Backup Integration (Box.com/Drive)
- 🔄 PDF Export
- 🔄 Advanced Performance Monitoring

## ✨ Latest Updates

- **Progressive Web App (PWA)**: COGNIFLOW is now installable on desktop and mobile! It works offline, caching your notes and interface for zero-latency access anywhere.
- **Voice & Vision**: We've added multimodal capabilities. You can now dictate notes using your microphone and analyze images using Gemini Vision.
- **Smart Recommendations**: The AI now proactively helps you organize by suggesting tags and finding connections between your notes automatically.
- **Professional AI Interface**: Integrated `assistant-ui` for a sophisticated, streaming chat experience with real-time feedback and advanced message threading.
- **Modern Visual Identity**: Complete brand overhaul featuring a new high-fidelity logo, synchronized favicon, and a refined UI aesthetic.
- **Customizable Themes**: Introducing a premium **Red & Black** dark mode and **White & Red** light mode with custom accent colors.

## 🛠 Key Features

| Feature | Description | AI Integration |
| :--- | :--- | :--- |
| **PWA & Offline** | Works without internet, installable on devices. | Local AI caching for continued operation. |
| **Voice-to-Note** | Dictate thoughts directly into notes. | Speech-to-text with auto-punctuation. |
| **Visual Analysis** | Analyze attached images and diagrams. | Gemini Vision for object/text detection. |
| **Knowledge Graph** | Interactive visualization of semantic connections. | Auto-discovery of relationships. |
| **Dev Studio** | Integrated environment for code snippets. | AI-powered code completion & debugging. |
| **Smart Suggestions**| Context-aware recommendations for your notes. | Proactive tagging and linking. |
| **Professional Chat** | Sophisticated conversational interface. | Real-time streaming with multiple providers. |

## 💻 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, assistant-ui
- **State & DB**: Zustand, Dexie.js (IndexedDB)
- **Visualization**: D3.js
- **AI Runtimes**: Google Gemini, OpenAI, Anthropic, Hugging Face

## 📥 Installation

### NPM Package

```bash
npm install @chieji/cogniflow
```

### Development Setup

#### Option 1: Local Development

1. **Clone & Install**:

   ```bash
   git clone https://github.com/Chieji/COGNIFLOW.git
   cd COGNIFLOW
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your API keys:

   ```bash
   cp .env.example .env
   ```

3. **Run Development Server**:

   ```bash
   npm run dev
   ```

#### Option 2: Docker Development

1. **Prerequisites**: Install Docker and Docker Compose
2. **Clone & Run**:

   ```bash
   git clone https://github.com/Chieji/COGNIFLOW.git
   cd COGNIFLOW
   docker-compose up --build
   ```

3. **Access**: Open <http://localhost:5173>

#### Optional: Local AI with Ollama

To use local AI models, start Ollama in the Docker environment:

```bash
docker-compose up ollama
```

Then pull models:

```bash
docker-compose exec ollama ollama pull llama2
```

#### Testing

COGNIFLOW includes a comprehensive test suite using Vitest:

```bash
# Run tests once
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with UI for better debugging
npm run test:ui
```

## 🛡 Security

COGNIFLOW uses a **Secure API Proxy** architecture. Your API keys are never exposed to the client-side. Ensure your keys are set as server-side environment variables on your deployment platform.

## 🤝 Contributing

We welcome contributions from the community! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  Built with ❤️ by the COGNIFLOW Team
</div>
