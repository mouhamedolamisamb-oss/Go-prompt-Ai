import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AuthProvider } from './context/AuthContext';
import { CreditsProvider } from './context/CreditsContext';
import { NotificationProvider } from './context/NotificationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CreditsProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </CreditsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
