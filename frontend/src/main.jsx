import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Global Tailwind styles
import './App.css';   // Custom layout & component styles

/**
 * Root entry point of the application.
 * It renders the App component within React.StrictMode to help identify 
 * potential problems during development.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);