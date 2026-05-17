import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Box,
  Divider,
  Avatar,
  Alert,
  useTheme,
  GlobalStyles,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';

const AUTH_RETURN_TO_KEY = 'auth_return_to';

const consumeAuthReturnTo = () => {
  const raw = localStorage.getItem(AUTH_RETURN_TO_KEY);
  if (!raw) return '';
  localStorage.removeItem(AUTH_RETURN_TO_KEY);
  if (raw === '/login' || raw === '/register') return '';
  return raw;
};

const Register = () => {
  const navigate = useNavigate();
  const { register, loginAsGuest } = useAuth();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    window.onloadTurnstileCallback = () => {
      if (window.turnstile) {
        window.turnstile.render('#turnstile-container', {
          sitekey: '1x00000000000000000000AA',
          callback: (token) => {
            setTurnstileToken(token);
          },
          'error-callback': () => {
            console.error('Turnstile verification error');
          }
        });
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (_e) {}
      delete window.onloadTurnstileCallback;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedUsername = String(formData.username || '').trim();

    if (!trimmedUsername || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.password.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the Terms of Service to create an account');
      return;
    }

    try {
      const response = await register(trimmedUsername, formData.email, formData.password, turnstileToken);
      console.log('Registration successful:', response);
      const returnTo = consumeAuthReturnTo();
      navigate(response?.must_change_username ? '/account/required-username-change' : (returnTo || '/home'));
    } catch (error) {
      console.error('Registration error:', error);
      let errorMsg = 'Failed to register';
      const apiError = error?.response?.data?.error;
      if (apiError) {
        if (typeof apiError === 'string') {
          errorMsg = apiError;
        } else if (apiError.message) {
          errorMsg = apiError.message;
        } else {
          errorMsg = JSON.stringify(apiError);
        }
      } else if (error?.message) {
        errorMsg = error.message;
      }
      setError(errorMsg);
      
      // Map error message to field for shake animation
      if (errorMsg.toLowerCase().includes('username')) setErrorField('username');
      else if (errorMsg.toLowerCase().includes('email')) setErrorField('email');
      else if (errorMsg.toLowerCase().includes('password')) setErrorField('password');
      
      setTimeout(() => setErrorField(''), 1000);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const pageBackground = theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
    : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)';

  return (
    <>
      <GlobalStyles styles={{ 'html, body': { background: pageBackground } }} />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: pageBackground,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mt: '-64px',
          pt: 8,
          pb: 6,
          px: 3,
          zIndex: 0,
        }}
    >
      {/* ── Register card ───────────────────────────────────────────────── */}
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            ...getGlassDialogPaperSx(theme),
            p: 4,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 8px 32px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 1,
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Register
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
            <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} margin="normal" required error={errorField === 'username'} />
            <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} margin="normal" required error={errorField === 'email'} />
            <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} margin="normal" required error={errorField === 'password'} />
            <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} margin="normal" required error={errorField === 'password'} />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  color="primary"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    '&.Mui-checked': {
                      color: 'primary.main',
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I accept the{' '}
                  <Link component={RouterLink} to="/terms" target="_blank" rel="noopener" sx={{ fontWeight: 'bold' }}>
                    Terms of Service
                  </Link>{' '}
                  &{' '}
                  <span style={{ fontWeight: 'bold' }}>
                    Privacy Policy
                  </span>
                </Typography>
              }
              sx={{ mt: 1.5, mb: 1, display: 'flex', alignItems: 'center' }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 1.5,
                mb: 1.5,
                width: '100%',
                minHeight: '65px',
              }}
            >
              <div id="turnstile-container"></div>
            </Box>

            <Button
              type="submit" fullWidth variant="outlined"
              sx={{ ...getGlassPillActionButtonSx(theme), mt: 2, mb: 2 }}
            >
              Register
            </Button>
            <Typography align="center">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">Login here</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* ── "or" divider ────────────────────────────────────────────────── */}
      <Divider
        sx={{
          width: '100%',
          maxWidth: 'sm',
          mt: 3,
          mb: 2,
          fontSize: '0.75rem',
          color: 'text.disabled',
        }}
      >
        or
      </Divider>

      {/* ── Goblin Mode portrait card ────────────────────────────────────── */}
      <Box
        sx={{
          width: 190,
          borderRadius: 3,
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'dark'
              ? 'rgba(134,239,172,0.25)'
              : 'rgba(22,101,52,0.18)',
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(20,50,20,0.35)'
              : 'rgba(220,252,231,0.45)',
          backdropFilter: 'blur(8px)',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          src="/images/GUEST_img.png"
          alt="Goblin guest"
          sx={{
            width: 86,
            height: 86,
            border: '2px solid',
            borderColor:
              theme.palette.mode === 'dark'
                ? 'rgba(134,239,172,0.35)'
                : 'rgba(22,101,52,0.25)',
          }}
        />
        <Button
          fullWidth
          variant="outlined"
          onClick={async () => {
            await loginAsGuest();
            const returnTo = consumeAuthReturnTo();
            navigate(returnTo || '/home');
          }}
          sx={{
            borderRadius: 99,
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: 1.5,
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(134,239,172,0.4)' : 'rgba(22,101,52,0.3)',
            color: theme.palette.mode === 'dark' ? '#86efac' : '#166534',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#86efac' : '#166534',
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(134,239,172,0.08)'
                  : 'rgba(22,101,52,0.05)',
            },
          }}
        >
          Goblin Mode
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ lineHeight: 1.45 }}
        >
          choose to login as a Guest with viewing-only
        </Typography>
      </Box>
    </Box>
    </>
  );
};

export default Register;
