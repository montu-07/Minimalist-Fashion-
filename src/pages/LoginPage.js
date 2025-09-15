import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'state/AuthContext';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import BrandLogo from 'components/BrandLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, socialLogin } = useAuth();
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({ email: '', password: '', remember: true });

  const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validEmail(form.email)) { setError('Please enter a valid email.'); return; }
    if (!form.password) { setError('Password is required.'); return; }
    try {
      setLoading(true);
      await login({ email: form.email, password: form.password, remember: form.remember });
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <BrandLogo size={24} withWordmark />
      </Box>
      <Typography variant="h5" gutterBottom>Sign In</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <TextField label="Email" type="email" fullWidth size="small" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Password" type={showPass ? 'text' : 'password'} fullWidth size="small" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass((s) => !s)} edge="end">
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <FormControlLabel control={<Checkbox checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />} label="Remember me" />
          <Button type="submit" variant="contained" disabled={loading}>Login</Button>
          <Typography variant="body2">Don't have an account? <Button component={Link} to="/signup" size="small">Sign up</Button></Typography>
          <Typography variant="caption" color="text.secondary">or continue with</Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={async () => { setLoading(true); setError(''); try { await socialLogin('google'); navigate('/'); } catch (e) { setError('Google sign-in failed'); } finally { setLoading(false); } }}>Google</Button>
            <Button fullWidth variant="outlined" startIcon={<AppleIcon />} onClick={async () => { setLoading(true); setError(''); try { await socialLogin('apple'); navigate('/'); } catch (e) { setError('Apple sign-in failed'); } finally { setLoading(false); } }}>Apple</Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
