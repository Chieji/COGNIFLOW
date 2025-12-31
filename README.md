<div align="center">
  <img width="1200" alt="COGNIFLOW Banner" src="./new_banner.png" />
</div>
# COGNIFLOW: The AI-Powered Knowledge Graph and Development Studio
**COGNIFLOW** is a cutting-edge application designed to help developers and researchers organize their thoughts, code snippets, and research findings into an interconnected, AI-enhanced knowledge graph. It combines a powerful note-taking interface with a dedicated development studio and utilizes large language models (LLMs) for intelligent analysis, connection discovery, and code assistance.
Now available as an **NPM package**: [`@chieji/cogniflow`](https://www.npmjs.com/package/@chieji/cogniflow)
## Key Features
| Feature | Description | AI Integration |
| :--- | :--- | :--- |
| **Knowledge Graph** | Visualize and explore the semantic connections between your notes, code, and ideas. | Automatically discovers and suggests new connections between notes. |
| **Dev Studio** | A dedicated environment for writing, testing, and managing code snippets with syntax highlighting and version control. | Provides code completion, debugging assistance, and code diff analysis. |
| **AI Chat & Tools** | Interact with a conversational AI to summarize notes, generate tags, and perform complex data analysis. | Uses Gemini and Hugging Face models for various cognitive tasks. |
| **Multimodal Analysis** | Analyze visual media (images) and generate speech from text directly within the application. | Leverages Gemini's multimodal capabilities. |
| **Note Management** | Organize notes into folders, apply tags, and easily search through your entire knowledge base. | AI-powered summarization and automatic tagging. |
## Technology Stack
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | Fast, modern user interface development. |
| **State Management** | Zustand, Dexie.js | Lightweight, persistent state management. |
| **Graph Visualization** | D3.js | Rendering the interactive knowledge graph. |
| **AI Services** | Gemini, OpenAI, Anthropic (via Secure Proxy) | Integration with multiple LLMs for core AI features. |
| **Styling** | Tailwind CSS (Assumed) | Utility-first CSS framework for rapid styling. |
## Installation
### As an NPM Package
```bash
npm install @chieji/cogniflow
```
### For Development
#### Prerequisites
- **Node.js** (LTS version recommended)
- **npm** (Node Package Manager)
#### Setup
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Chieji/COGNIFLOW.git
    cd COGNIFLOW
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    The application now uses a **Secure API Proxy** to protect your API keys.
    Create a file named `.env.local` in the root of the project and configure your proxy endpoint:
    ```
    # Example for a local proxy running on port 3001
    VITE_API_PROXY_URL="http://localhost:3001/api/proxy"
    
    # For production, use your deployed Vercel/Cloudflare endpoint
    # VITE_API_PROXY_URL="https://your-cogniflow-proxy.vercel.app/api/proxy"
    ```
    **CRITICAL SECURITY NOTE:** Your actual API keys (e.g., `GEMINI_API_KEY`) must be set as **server-side environment variables** on your proxy deployment platform (Vercel, Cloudflare, etc.). They should **NEVER** be stored in the client-side `.env.local` file.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.
5.  **Build the library:**
    ```bash
    npm run build
    ```
    Outputs optimized ES and UMD bundles to the `dist/` directory.

## Quick Start for Ubuntu/UserLAnd Environments

If you are running COGNIFLOW in a Linux environment (like a cloud VM or UserLAnd on Android), you can quickly set up a local proxy for testing:

1.  **Install Dependencies for Proxy:**
    ```bash
    npm install express cors dotenv
    npm install -D @types/express @types/node
    ```
2.  **Create Server File (`server.ts`):**
    Create a file named `server.ts` in the root directory and add the following content:
    ```typescript
    import express from 'express';
    import cors from 'cors';
    import dotenv from 'dotenv';
    import handler from './api/proxy'; // Your secure proxy handler

    dotenv.config();

    const app = express();
    app.use(express.json());
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    }));

    app.post('/api/proxy', (req, res) => {
      // The proxy.ts handler expects Vercel/Next.js request/response objects, 
      // so we cast the Express objects for compatibility.
      handler(req as any, res as any);
    });

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`API Proxy running on port ${PORT}`);
    });
    ```
3.  **Configure Server-Side Keys:**
    Create a file named `.env` (NOT `.env.local`) in the root directory for your server-side keys. **Ensure this file is in `.gitignore`!**
    ```
    # Server-side keys for the proxy
    GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_KEY"
    OPENAI_API_KEY="YOUR_ACTUAL_OPENAI_KEY"
    ALLOWED_ORIGINS="http://localhost:3000"
    ```
4.  **Run the Proxy and Frontend:**
    ```bash
    # In one terminal, run the proxy
    ts-node server.ts &
    
    # In a second terminal, run the frontend
    npm run dev
    ```
    The frontend will connect to the local proxy, which will use your secure server-side keys.

## Contributing
We welcome contributions! Please feel free to submit issues and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
