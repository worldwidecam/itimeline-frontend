import React, { useState } from 'react';
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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginAsGuest } = useAuth();
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await login(formData.email, formData.password);
      setFormData({ email: '', password: '' });
      navigate(loggedInUser?.must_change_username ? '/account/required-username-change' : '/home');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to login');
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
      }}
    >
      {/* ── Login card ──────────────────────────────────────────────────── */}
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
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
            <TextField
              fullWidth label="Email" name="email" type="email"
              value={formData.email} onChange={handleChange}
              margin="normal" required autoComplete="username email"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth label="Password" name="password" type="password"
              value={formData.password} onChange={handleChange}
              margin="normal" required autoComplete="current-password"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              type="submit" fullWidth variant="outlined"
              sx={{ ...getGlassPillActionButtonSx(theme), mt: 3, mb: 2 }}
            >
              Login
            </Button>
            <Typography align="center">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register">Register here</Link>
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
          sx={{ width: 86, height: 86, border: '2px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(134,239,172,0.35)' : 'rgba(22,101,52,0.25)' }}
        />
        <Button
          fullWidth
          variant="outlined"
          onClick={() => { loginAsGuest(); navigate('/home'); }}
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

export default Login;
