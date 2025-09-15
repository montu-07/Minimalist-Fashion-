import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import App from './App';
import { AppThemeProvider } from './theme';
import { CartProvider } from './state/CartContext';
import { WishlistProvider } from './state/WishlistContext';
import { UIProvider } from './state/UIContext';
import { AuthProvider } from './state/AuthContext';
import { NotificationsProvider } from './state/NotificationsContext';
import brandLogo from 'assests/images/BrandLogo.png';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ENV } from 'core/config/env';

// Start MSW in development to mock API endpoints
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line global-require
  const { worker } = require('./mocks/browser');
  worker.start();
}

const container = document.getElementById('root');
const root = createRoot(container);

// Ensure favicon uses the same brand logo asset bundle URL
try {
  const setIcon = (rel, href) => {
    let link = document.querySelector(`link[rel="${rel}"]`);
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', rel); document.head.appendChild(link); }
    link.setAttribute('href', href);
  };
  if (brandLogo) {
    setIcon('icon', brandLogo);
    setIcon('apple-touch-icon', brandLogo);
  }
} catch {}

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID || ''}>
      <AppThemeProvider>
        <CssBaseline />
        <UIProvider>
          <AuthProvider>
            <NotificationsProvider>
              <CartProvider>
                <WishlistProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </WishlistProvider>
              </CartProvider>
            </NotificationsProvider>
          </AuthProvider>
        </UIProvider>
      </AppThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
