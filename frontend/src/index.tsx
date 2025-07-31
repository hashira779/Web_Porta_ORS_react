import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    // 👇 Comment out these two lines to stop the double-rendering effect
    // <React.StrictMode>
    <App />
    // </React.StrictMode>
);