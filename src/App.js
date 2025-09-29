import React from 'react';
import { useLocation, useRoutes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Layout from './components/layout/Layout';
import appRoutes from './routes';
import { AuthProvider } from './state/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { OrderProvider } from './contexts/OrderContext';
import SupportChatWidget from './components/support/SupportChatWidget';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const element = useRoutes(appRoutes);
  
  return isAdminPath ? (
    <React.Suspense fallback={<Box sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
      {element}
    </React.Suspense>
  ) : (
    <Layout>
      <Box component="main" sx={{ py: 2 }}>
        <Container maxWidth="lg">
          <React.Suspense fallback={<Box sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
            {element}
          </React.Suspense>
        </Container>
        <SupportChatWidget />
      </Box>
    </Layout>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <NotificationProvider>
          <OrderProvider>
            <AppContent />
          </OrderProvider>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
