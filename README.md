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

## ✨ Latest Updates

- **Professional AI Interface**: Integrated `assistant-ui` for a sophisticated, streaming chat experience with real-time feedback and advanced message threading.
- **Modern Visual Identity**: Complete brand overhaul featuring a new high-fidelity logo, synchronized favicon, and a refined UI aesthetic.
- **Customizable Themes**: Introducing a premium **Red & Black** dark mode and **White & Red** light mode. Users can now personalize their experience with a custom **Accent Color Picker**.
- **Enhanced Performance**: Refactored core components and services for faster streaming and improved state management.

## 🛠 Key Features

| Feature | Description | AI Integration |
| :--- | :--- | :--- |
| **Knowledge Graph** | Interactive visualization of semantic connections between notes and code. | Auto-discovery of relationships and connection suggestions. |
| **Dev Studio** | Integrated environment for managing code snippets with full syntax highlighting. | AI-powered code completion, debugging, and diff analysis. |
| **Professional Chat** | Sophisticated conversational interface powered by `assistant-ui`. | Real-time streaming with Gemini, OpenAI, and Hugging Face. |
| **Multimodal Engine** | Native support for image analysis and text-to-speech generation. | Leverages state-of-the-art multimodal LLMs. |
| **Customization** | Full control over the UI theme and accent colors. | Dynamic CSS variable injection for personalized branding. |

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
1. **Clone & Install**:
   ```bash
   git clone https://github.com/Chieji/COGNIFLOW.git
   cd COGNIFLOW
   npm install
   ```
2. **Configure Environment**:
   Create `.env.local` for the client-side proxy URL:
   ```env
   VITE_API_PROXY_URL="http://localhost:3001/api/proxy"
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
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
