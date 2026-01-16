import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/assistant-ui.css';
import { registerSW } from 'virtual:pwa-register';

// Import global styles
console.log("index.tsx executing...");
const rootElement = document.getElementById('root');
console.log("Root element found:", !!rootElement);
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log("Root created, rendering...");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log("Render call complete.");

registerSW({ immediate: true });
