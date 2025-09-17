import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  Paper,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from 'state/AuthContext';
import GoogleLoginButton from 'components/auth/GoogleLoginButton';
import BrandLogo from 'components/BrandLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({
    email: location.state?.email || '',
    password: '',
    remember: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.email) {
      setError('Email is required');
      return;
    }
    
    if (!form.password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      await login({
        email: form.email,
        password: form.password,
        remember: form.remember,
      });
      
      // Redirect to the previous page or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (user) => {
    // Redirect to the previous page or home
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  const handleGoogleError = (error) => {
    setError(error || 'Failed to sign in with Google');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <BrandLogo size={48} withWordmark sx={{ mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back
        </Typography>
        <Typography color="text.secondary">
          Sign in to your account to continue
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <GoogleLoginButton 
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ my: 3 }}>OR</Divider>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              fullWidth
              margin="normal"
              autoComplete="email"
              disabled={loading}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              fullWidth
              margin="normal"
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.remember}
                    onChange={(e) =>
                      setForm({ ...form, remember: e.target.checked })
                    }
                    disabled={loading}
                  />
                }
                label="Remember me"
              />
              <Button
                component={Link}
                to="/forgot-password"
                size="small"
                disabled={loading}
              >
                Forgot password?
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Button
              component={Link}
              to={
                form.email
                  ? { pathname: '/signup', state: { email: form.email } }
                  : '/signup'
              }
              size="small"
              disabled={loading}
            >
              Sign up
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
