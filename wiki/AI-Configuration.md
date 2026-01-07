# AI Configuration Guide

COGNIFLOW supports multiple AI providers to power its intelligent features.

## 🤖 Supported Providers

- **Google Gemini**: Recommended for multimodal analysis and high-speed streaming.
- **OpenAI**: Industry-standard models for general reasoning and code assistance.
- **Anthropic**: Excellent for long-context understanding.
- **Hugging Face**: Access to thousands of open-source models.
- **Universal**: Connect to any OpenAI-compatible API (e.g., Ollama, LocalAI).

## 🔑 Setting Up API Keys

To configure your AI providers:
1. Open **Settings**.
2. Select the task you want to configure (Chat, Summary, or Translation).
3. Choose your preferred **Provider**.
4. Enter your **API Key**.

## 🛡 Secure Proxy

For security, COGNIFLOW does not store API keys in the browser's local storage for production use. Instead, it uses a secure proxy.
- **Development**: You can use `.env.local` for local testing.
- **Production**: Set your keys as environment variables on your hosting provider (e.g., Vercel, Netlify).

## 💬 Professional Chat Interface

The chat interface is powered by `assistant-ui`, providing:
- **Streaming**: See the AI's response as it's being generated.
- **Context Awareness**: The AI has access to your current notes and folders to provide relevant answers.
- **Tool Use**: The AI can create notes, move folders, and propose code changes directly from the chat.
