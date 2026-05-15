import React from 'react';
import { Box, Typography, useTheme, Button } from '@mui/material';
import GppBadIcon from '@mui/icons-material/GppBad';
import LogoutIcon from '@mui/icons-material/Logout';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const SuspendedPage = () => {
  const theme = useTheme();
  const { logout } = useAuth();

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
              ? 'linear-gradient(135deg, #2a0c0c 0%, #4a1212 50%, #1f0000 100%)'
              : 'linear-gradient(135deg, #ffb3b3 0%, #ff7a7a 45%, #d72626 100%)',
          }}
        >
          {/* Animated Background Elements */}
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
              animation: 'float 12s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translate(0px, 0px)' },
                '50%': { transform: 'translate(-40px, 40px)' },
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
              animation: 'float 15s ease-in-out infinite',
              animationDelay: '2s',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: '100%', maxWidth: 620, zIndex: 1 }}
          >
            <Box
              sx={{
                borderRadius: 5,
                p: { xs: 4, sm: 6 },
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }}
              >
                <GppBadIcon sx={{ fontSize: 72, color: '#fff' }} />
              </Box>

              <Box>
                <Typography
                  variant="h2"
                  sx={{
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: { xs: '3rem', sm: '4.5rem' },
                    textShadow: '0 4px 25px rgba(0,0,0,0.5)',
                    mb: 1,
                    letterSpacing: '-2px',
                    textTransform: 'uppercase',
                  }}
                >
                  YOU ARE BANNED
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 600,
                    maxWidth: '520px',
                    margin: '0 auto',
                    lineHeight: 1.4,
                  }}
                >
                  Your access has been permanently revoked due to severe platform violations.
                </Typography>
              </Box>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '1.2rem',
                  maxWidth: '520px',
                  background: 'rgba(0,0,0,0.3)',
                  p: 4,
                  borderRadius: 4,
                  border: '2px solid rgba(255,255,255,0.15)',
                  fontStyle: 'italic',
                }}
              >
                "This account is no longer allowed to sign in or interact with the platform. No further appeals will be considered."
              </Typography>

              <Button
                variant="contained"
                size="large"
                href="https://www.youtube.com/watch?v=9c_Bv_FBE-c"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  mt: 2,
                  px: 8,
                  py: 2.5,
                  borderRadius: '100px',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#d72626',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: '#fff',
                    transform: 'scale(1.05)',
                    boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
                  },
                }}
              >
                I'M SORRY
              </Button>

            </Box>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
};

export default SuspendedPage;
