import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './theme/ThemeProvider';
import { ReduxProvider } from './store/ReduxProvider';
import App from './App';
import './index.css';

// Get the root element with proper error handling
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Root element not found. Please ensure the HTML template includes a div with id="root".'
  );
}

// Create root and render the application
createRoot(rootElement).render(
  <StrictMode>
    <ReduxProvider>
      <ThemeProvider>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ReduxProvider>
  </StrictMode>
);
