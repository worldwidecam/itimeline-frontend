import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
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
  Collapse,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';

const AUTH_RETURN_TO_KEY = 'auth_return_to';

const consumeAuthReturnTo = () => {
  const raw = localStorage.getItem(AUTH_RETURN_TO_KEY);
  if (!raw) return '';
  localStorage.removeItem(AUTH_RETURN_TO_KEY);
  if (raw === '/login' || raw === '/register') return '';
  return raw;
};

const Login = () => {
  const navigate = useNavigate();
  const { login, loginAsGuest } = useAuth();
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const [loginExpanded, setLoginExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await login(formData.email, formData.password);
      setFormData({ email: '', password: '' });
      const returnTo = consumeAuthReturnTo();
      if (loggedInUser?.is_suspended) {
        navigate('/suspended', { replace: true });
      } else {
        navigate(loggedInUser?.must_change_username ? '/account/required-username-change' : (returnTo || '/home'));
      }
    } catch (error) {
      const errorData = error.response?.data?.error;
      const errorCode = typeof errorData === 'string' ? errorData : errorData?.code;
      const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || '');
      const status = error.response?.status;
      
      const isSuspended = 
        errorCode === 'SUSPENDED' || 
        status === 403 || 
        errorMessage.toLowerCase().includes('suspended') ||
        (typeof errorData === 'string' && errorData.toLowerCase().includes('suspended'));
      
      if (isSuspended) {
        navigate('/suspended');
      } else {
        setError(errorMessage || 'Failed to login');
        setErrorField('all');
        setTimeout(() => setErrorField(''), 1000);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <GlobalStyles styles={{ 'html, body': { background: appCanvasBackground } }} />
      <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: appCanvasBackground,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '-64px',
        pt: 8,
        pb: 6,
        px: 3,
        zIndex: 0,
        gap: 3,
      }}
    >
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <Typography
        variant="h4"
        component="h1"
        align="center"
        sx={{
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        Choose Your Path
      </Typography>

      {/* ── Login card (collapsible) ──────────────────────────────────────── */}
      <Box
        sx={{
          width: 190,
          borderRadius: 3,
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'dark'
              ? 'rgba(147,197,253,0.25)'
              : 'rgba(30,64,175,0.18)',
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(30,58,138,0.35)'
              : 'rgba(219,234,254,0.45)',
          backdropFilter: 'blur(8px)',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 86,
            height: 86,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(147,197,253,0.2)' : 'rgba(30,64,175,0.1)',
            color: theme.palette.mode === 'dark' ? '#93c5fd' : '#1e40af',
            fontSize: 40,
            border: '2px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(147,197,253,0.35)' : 'rgba(30,64,175,0.25)',
          }}
        >
          👤
        </Avatar>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setLoginExpanded(!loginExpanded)}
          sx={{
            borderRadius: 99,
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: 1.5,
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(147,197,253,0.4)' : 'rgba(30,64,175,0.3)',
            color: theme.palette.mode === 'dark' ? '#93c5fd' : '#1e40af',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#93c5fd' : '#1e40af',
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(147,197,253,0.08)'
                  : 'rgba(30,64,175,0.05)',
            },
          }}
        >
          Login First
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ lineHeight: 1.45 }}
        >
          for full access & posting
        </Typography>
      </Box>

      {/* ── Login form (expandable) ────────────────────────────────────────── */}
      <Collapse in={loginExpanded} sx={{ width: '100%', maxWidth: 'sm' }}>
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
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={formData.email} onChange={handleChange}
              margin="normal" required autoComplete="email"
              InputLabelProps={{ shrink: true }}
              error={errorField === 'all'}
            />
            <TextField
              fullWidth label="Password" name="password" type="password"
              value={formData.password} onChange={handleChange}
              margin="normal" required autoComplete="current-password"
              InputLabelProps={{ shrink: true }}
              error={errorField === 'all'}
            />
            <Typography align="right" sx={{ mt: 1, mb: 1 }}>
              <Link component={RouterLink} to="/recover" sx={{ fontSize: '0.85rem' }}>
                Forgot Password?
              </Link>
            </Typography>
            <Button
              type="submit" fullWidth variant="outlined"
              sx={{ ...getGlassPillActionButtonSx(theme), mt: 2, mb: 2 }}
            >
              Login
            </Button>
            <Typography align="center">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register">Register here</Link>
            </Typography>
          </Box>
        </Paper>
      </Collapse>

      {/* ── "OR" divider (prominent) ──────────────────────────────────────── */}
      <Divider
        sx={{
          width: '100%',
          maxWidth: 'sm',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'text.secondary',
          '&::before, &::after': {
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          },
        }}
      >
        OR
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
          sx={{ width: 86, height: 86, border: '2px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(134,239,172,0.35)' : 'rgba(22,101,52,0.25)' }}
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
          view-only as a guest
        </Typography>
      </Box>
    </Box>
    </>
  );
};

export default Login;
