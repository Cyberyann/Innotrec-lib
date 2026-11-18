import { InnotrecProvider } from '@innotrec/ui';
import '@innotrec/ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { config } from './config';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <InnotrecProvider apiBaseUrl={config.apiUrl} locale={config.locale}>
        <App />
      </InnotrecProvider>
    </BrowserRouter>
  </StrictMode>,
);
