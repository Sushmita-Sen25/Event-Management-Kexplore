import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Wake the API early — free hosting tiers sleep when idle.
fetch('/api/health', { cache: 'no-store' }).catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
