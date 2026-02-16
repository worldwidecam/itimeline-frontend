import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Stack,
  useTheme,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion } from 'framer-motion';
import { completeRequiredUsernameChange } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const RequiredUsernameChangePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmed = (username || '').trim();
    if (!trimmed) {
      setError('Please enter a new username.');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await completeRequiredUsernameChange(trimmed);
      await updateProfile({
        username: updated.username,
        must_change_username: Boolean(updated.must_change_username),
        is_restricted: Boolean(updated.is_restricted),
        restricted_until: updated.restricted_until || null,
        can_post_or_report: Boolean(updated.can_post_or_report),
      });
      navigate('/home', { replace: true });
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Failed to update username';
      setError(message);
    } finally {
      setSubmitting(false);
    }
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
              ? 'linear-gradient(135deg, #1d1d2a 0%, #28313d 50%, #184054 100%)'
              : 'linear-gradient(135deg, #4fa8ff 0%, #3d74d3 45%, #1f97a9 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '-10%',
              right: '-5%',
              width: '40%',
              height: '40%',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.16)',
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
              background: 'rgba(255, 255, 255, 0.12)',
              filter: 'blur(60px)',
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '1.5s',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: '100%', maxWidth: 620, zIndex: 1 }}
          >
            <Stack
              spacing={2.5}
              sx={{
                borderRadius: 4,
                p: { xs: 2.5, sm: 4 },
                background: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.24)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    background: 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.24)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
                  }}
                >
                  <EditNoteIcon sx={{ fontSize: 64, color: '#fff' }} />
                </Box>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    textAlign: 'center',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                  }}
                >
                  Username Change Required
                </Typography>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    textAlign: 'center',
                  }}
                >
                  The system redirected you here because your account must choose a new username before continuing.
                </Typography>
              </motion.div>

              {user?.username && (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                  }}
                >
                  Current username: <strong>{user.username}</strong>
                </Typography>
              )}

              {error && <Alert severity="error">{error}</Alert>}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    required
                    label="New Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.92)',
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<CheckCircleOutlineIcon />}
                    disabled={submitting}
                    fullWidth
                    sx={{
                      mt: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      borderRadius: '50px',
                      textTransform: 'none',
                      background: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.35)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.32)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 30px rgba(0, 0, 0, 0.3)',
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255, 255, 255, 0.65)',
                        borderColor: 'rgba(255, 255, 255, 0.22)',
                        background: 'rgba(255, 255, 255, 0.18)',
                      },
                    }}
                  >
                    {submitting ? 'Updating…' : 'Update Username'}
                  </Button>
                </Box>
              </motion.div>
            </Stack>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default RequiredUsernameChangePage;
