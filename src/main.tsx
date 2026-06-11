import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ait-co/polyfill/auto';
import '@ait-co/devtools/in-app/auto';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
