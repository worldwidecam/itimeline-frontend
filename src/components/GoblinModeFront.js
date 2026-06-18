import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const AUTH_RETURN_TO_KEY = 'auth_return_to';

const consumeAuthReturnTo = () => {
  const raw = localStorage.getItem(AUTH_RETURN_TO_KEY);
  if (!raw) return '';
  localStorage.removeItem(AUTH_RETURN_TO_KEY);
  if (raw === '/login' || raw === '/register') return '';
  return raw;
};

const GoblinModeFront = ({ theme, active }) => {
  const [countdown, setCountdown] = useState(5);
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!active) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          loginAsGuest().then(() => {
            const returnTo = consumeAuthReturnTo();
            navigate(returnTo || '/home');
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [active, loginAsGuest, navigate]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1.5, sm: 2.5, md: 3 },
        textAlign: 'center',
        background: theme.palette.mode === 'dark' ? 'rgba(20, 50, 20, 0.55)' : 'rgba(220, 252, 231, 0.55)',
        border: '3px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(134, 239, 172, 0.45)' : 'rgba(22, 101, 52, 0.4)',
        borderRadius: '10px',
        backdropFilter: 'blur(16px)',
        gap: 2.5,
      }}
    >
      <Avatar
        src="/images/GUEST_img.png"
        alt="Goblin guest"
        sx={{
          width: 86,
          height: 86,
          border: '2px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(134, 239, 172, 0.35)' : 'rgba(22, 101, 52, 0.25)',
        }}
      />
      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
        Entering as an Anonymous Goblin
      </Typography>
      
      {/* Circular Timer Display */}
      <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
        <CircularProgress
          variant="determinate"
          value={(countdown / 5) * 100}
          color="success"
          size={70}
          thickness={4}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" component="div" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            {countdown}
          </Typography>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Click outside to cancel
      </Typography>
    </Box>
  );
};

export default GoblinModeFront;
