/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_HUGGINGFACE_API_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_GROQ_API_KEY?: string;
  readonly VITE_UNIVERSAL_BASE_URL?: string;
  readonly VITE_DEV_MODE?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_API_PROXY_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ANALYTICS_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
