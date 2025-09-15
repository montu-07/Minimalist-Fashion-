import React from 'react';
import Button from '@mui/material/Button';
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
export default function GoogleLoginButton({ onSuccess }) {
  const { oauthLogin } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const login = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const { access_token: accessToken } = tokenResponse;
        if (!accessToken) throw new Error('Missing access token');
        // Fetch Google userinfo
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch Google profile');
        const profile = await res.json();
        const user = oauthLogin({
          id: profile.sub,
          name: profile.name || profile.given_name || 'Google User',
          email: profile.email,
          avatar: profile.picture,
          provider: 'google',
          accessToken,
        });
        onSuccess && onSuccess(user);
      } catch (e) {
        setError(e?.message || 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google login failed'),
    scope: 'openid profile email',
  });

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Button
        variant="outlined"
        color="inherit"
        startIcon={loading ? <CircularProgress size={16} /> : <GoogleIcon />}
        onClick={() => { setError(''); login(); }}
        disabled={loading}
        fullWidth
      >
        Continue with Google
      </Button>
      {error && (
        <span role="alert" style={{ color: '#d32f2f', fontSize: 12 }}>{error}</span>
      )}
    </Stack>
  );
}
