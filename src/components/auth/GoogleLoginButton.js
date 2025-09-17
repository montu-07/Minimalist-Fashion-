import React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import GoogleIcon from '@mui/icons-material/Google';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from 'state/AuthContext';

/**
 * GoogleLoginButton: triggers Google OAuth flow using @react-oauth/google.
 * On success, fetches profile from Google UserInfo endpoint with the access token,
 * persists to AuthContext via oauthLogin, and calls onSuccess callback.
 */
export default function GoogleLoginButton({ onSuccess, onError }) {
  const { oauthLogin } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        // Use the oauthLogin function from AuthContext to handle the token
        const user = await oauthLogin('google', tokenResponse);
        onSuccess?.(user);
      } catch (error) {
        const errorMessage = error?.message || 'Failed to sign in with Google';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      const errorMessage = error?.error_description || 'Google sign in was cancelled';
      setError(errorMessage);
      onError?.(errorMessage);
    },
    scope: 'profile email',
  });

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={loading ? <CircularProgress size={16} /> : <GoogleIcon />}
        onClick={() => {
          setError('');
          login();
        }}
        disabled={loading}
        fullWidth
        sx={{
          textTransform: 'none',
          py: 1.5,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        Continue with Google
      </Button>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}
