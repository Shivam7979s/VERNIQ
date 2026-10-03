import React from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import { App } from './App';
import './styles/index.css';

inject();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root DOM element #root not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
