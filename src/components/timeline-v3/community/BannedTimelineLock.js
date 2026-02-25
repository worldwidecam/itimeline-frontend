import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import GppBadIcon from '@mui/icons-material/GppBad';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BannedTimelineLock = ({ timelineName = 'This Timeline' }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleGoHome = () => {
    navigate('/home');
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
        transition={{ duration: 0.5, ease: 'easeOut' }}
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
              ? 'linear-gradient(135deg, #2a0c0c 0%, #4a1212 50%, #1f0000 100%)'
              : 'linear-gradient(135deg, #ffb3b3 0%, #ff7a7a 45%, #d72626 100%)',
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
                ? 'rgba(255, 120, 120, 0.09)'
                : 'rgba(255, 255, 255, 0.22)',
              filter: 'blur(60px)',
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
                ? 'rgba(255, 80, 80, 0.08)'
                : 'rgba(255, 255, 255, 0.16)',
              filter: 'blur(60px)',
            }}
          />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '28px',
              zIndex: 1,
              maxWidth: '640px',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
              }}
            >
              <GppBadIcon sx={{ fontSize: 64, color: '#fff' }} />
            </Box>

            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 2px 18px rgba(0, 0, 0, 0.35)',
                  mb: 1.5,
                }}
              >
                {timelineName}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.96)',
                }}
              >
                Timeline Banned
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.92)',
                fontSize: '1.05rem',
                maxWidth: '520px',
                lineHeight: 1.65,
              }}
            >
              This timeline was removed by moderation and is no longer accessible.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                mt: 1,
                px: 4,
                py: 1.4,
                borderRadius: '50px',
                textTransform: 'none',
                fontWeight: 700,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.14)'
                  : 'rgba(255, 255, 255, 0.28)',
                border: '2px solid rgba(255, 255, 255, 0.35)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.24)'
                    : 'rgba(255, 255, 255, 0.38)',
                },
              }}
            >
              Go to Home
            </Button>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default BannedTimelineLock;
