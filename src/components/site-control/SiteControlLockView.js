import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SiteControlLockView = ({ title = 'Access Restricted', description = ' ', backLabel = 'Back' }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
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
                ? 'rgba(102, 126, 234, 0.1)'
                : 'rgba(255, 255, 255, 0.1)',
              filter: 'blur(60px)',
              animation: 'float 8s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-30px)' }
              }
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
                ? 'rgba(118, 75, 162, 0.1)'
                : 'rgba(255, 255, 255, 0.15)',
              filter: 'blur(60px)',
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '2s'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ zIndex: 1, textAlign: 'center', maxWidth: '600px' }}
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
                  margin: '0 auto 2rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <LockIcon sx={{ fontSize: 60, color: '#fff' }} />
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
                  mb: 2,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                }}
              >
                {title}
              </Typography>
            </motion.div>

            {!!description.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 4,
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  {description}
                </Typography>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '50px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
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
                {backLabel}
              </Button>
            </motion.div>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default SiteControlLockView;
