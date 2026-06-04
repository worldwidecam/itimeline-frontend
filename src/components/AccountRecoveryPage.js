import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  useTheme,
  IconButton,
  InputAdornment,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { recoverAccount } from '../utils/api';
import {
  getGlassInputSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';

const AccountRecoveryPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    backupPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setShake(false);

    const email = formData.email.trim();
    const backupPassword = formData.backupPassword.trim();
    const newPassword = formData.newPassword;
    const confirmPassword = formData.confirmPassword;

    if (!email || !backupPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      triggerErrorShake();
      return;
    }

    const isEmail = email.includes('@');
    const isNumericId = /^\d+$/.test(email);
    if (!isEmail && !isNumericId) {
      setError('Please enter a valid email address or User ID number.');
      triggerErrorShake();
      return;
    }

    if (newPassword.length < 12) {
      setError('New password must be at least 12 characters long.');
      triggerErrorShake();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      triggerErrorShake();
      return;
    }

    try {
      setSubmitting(true);
      const response = await recoverAccount(email, backupPassword, newPassword);
      
      // Store session tokens in localStorage for automatic login
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      // Clear stale user info to force AuthContext to fetch fresh data
      localStorage.removeItem('user');
      
      // Set a temporary nudge flag so settings page displays the backup reminder alert
      localStorage.setItem('itl_recovery_nudge', 'true');
      
      // Clean redirect to trigger session rehydration in AuthContext
      window.location.href = '/home';
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Failed to recover account';
      setError(message);
      triggerErrorShake();
    } finally {
      setSubmitting(false);
    }
  };

  const triggerErrorShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        overflow: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%', minHeight: '100vh' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            px: { xs: 2, sm: 3 },
            py: 4,
            position: 'relative',
            overflow: 'hidden',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f0c20 0%, #15102a 50%, #201235 100%)'
              : 'linear-gradient(135deg, #ffb199 0%, #ffd5c8 50%, #ffeae0 100%)',
          }}
        >
          {/* Floating background design elements */}
          <Box
            sx={{
              position: 'absolute',
              top: '-10%',
              right: '-5%',
              width: '40%',
              height: '40%',
              borderRadius: '50%',
              background: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.12)' : 'rgba(255, 255, 255, 0.4)',
              filter: 'blur(60px)',
              animation: 'float 8s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-30px)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-10%',
              left: '-5%',
              width: '35%',
              height: '35%',
              borderRadius: '50%',
              background: theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.12)' : 'rgba(255, 255, 255, 0.3)',
              filter: 'blur(60px)',
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '1.5s',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ width: '100%', maxWidth: 540, zIndex: 1 }}
          >
            <Stack
              spacing={2.5}
              className={shake ? 'animate-shake' : ''}
              sx={{
                borderRadius: 4,
                p: { xs: 3, sm: 4 },
                background: theme.palette.mode === 'dark' ? 'rgba(15, 12, 32, 0.65)' : 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(16px)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 20px 45px rgba(0, 0, 0, 0.45)'
                  : '0 20px 45px rgba(255, 177, 153, 0.25)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark' ? '#c084fc' : '#d35c3d',
                    '&:hover': {
                      background: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.08)' : 'rgba(211, 92, 61, 0.05)',
                    }
                  }}
                >
                  Back to Login
                </Button>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    background: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.12)' : 'rgba(211, 92, 61, 0.1)',
                    border: '2px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.24)' : 'rgba(211, 92, 61, 0.2)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <LockOpenIcon sx={{ fontSize: 44, color: theme.palette.mode === 'dark' ? '#c084fc' : '#d35c3d' }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: theme.palette.mode === 'dark' ? '#fff' : '#1a0c08',
                    mb: 1,
                  }}
                >
                  Account Recovery
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}
                >
                  Enter your registered email and the emergency backup password to reset your account credentials.
                </Typography>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: 2,
                    border: '1px solid rgba(239, 83, 80, 0.2)'
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    required
                    label="Registered Email or User ID"
                    name="email"
                    type="text"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="username"
                    placeholder="you@example.com or User ID..."
                  />

                  <TextField
                    fullWidth
                    required
                    label="Emergency Backup Password"
                    name="backupPassword"
                    type={showBackupPassword ? 'text' : 'password'}
                    value={formData.backupPassword}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="Enter your written recovery key..."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowBackupPassword(!showBackupPassword)}
                            edge="end"
                            sx={{ color: 'text.secondary' }}
                          >
                            {showBackupPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    required
                    label="New Password"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Min 12 characters..."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            sx={{ color: 'text.secondary' }}
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    required
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Repeat new password..."
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting || !formData.email || !formData.backupPassword || !formData.newPassword || !formData.confirmPassword}
                    startIcon={<CheckCircleOutlineIcon />}
                    fullWidth
                    sx={{
                      ...getGlassPillActionButtonSx(theme),
                      mt: 1.5,
                      py: 1.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '1rem',
                      borderRadius: '50px',
                    }}
                  >
                    {submitting ? 'Recovering Account…' : 'Recover Account'}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default AccountRecoveryPage;
