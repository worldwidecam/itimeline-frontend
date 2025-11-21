import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PersonalTimelineLock = ({ username, slug }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleGoHome = () => {
    navigate('/home');
  };

  const title = username && slug
    ? `@${username}'s personal timeline`
    : 'Personal timeline';

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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            position: 'relative',
            overflow: 'hidden',
            px: 3,
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
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(255, 255, 255, 0.2)',
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
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(255, 255, 255, 0.15)',
              filter: 'blur(60px)',
              animation: 'float 10s ease-in-out infinite reverse',
            }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              zIndex: 1,
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <LockIcon
                  sx={{
                    fontSize: 64,
                    color: '#fff',
                  }}
                />
              </Box>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#fff',
                  textShadow: theme.palette.mode === 'dark'
                    ? '0 2px 20px rgba(0, 0, 0, 0.5)'
                    : '0 2px 20px rgba(0, 0, 0, 0.2)',
                  mb: 2,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#fff',
                  textShadow: theme.palette.mode === 'dark'
                    ? '0 2px 10px rgba(0, 0, 0, 0.3)'
                    : '0 2px 10px rgba(0, 0, 0, 0.15)',
                }}
              >
                Access Restricted
              </Typography>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.95)',
                  fontSize: '1.1rem',
                  maxWidth: '500px',
                  lineHeight: 1.6,
                }}
              >
                This personal timeline is only visible to the creator and the viewers they have explicitly invited.
              </Typography>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<HomeIcon />}
                onClick={handleGoHome}
                sx={{
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '50px',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(255, 255, 255, 0.35)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 30px rgba(0, 0, 0, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                Go to Home
              </Button>
            </motion.div>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default PersonalTimelineLock;
