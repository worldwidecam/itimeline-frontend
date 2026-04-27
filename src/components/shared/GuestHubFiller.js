import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useTheme, alpha, keyframes } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const GuestHubFiller = ({ tabLabel }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isDark = theme.palette.mode === 'dark';
  
  const handleJoin = async () => {
    await logout();
    navigate('/register');
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: isDark 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        p: 3,
        borderRadius: 4,
      }}
    >
      {/* Animal Crossing style bubbly blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(56, 189, 248, 0.15)',
          filter: 'blur(60px)',
          animation: `${float} 12s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-5%',
          left: '-10%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: isDark ? 'rgba(236, 72, 153, 0.1)' : 'rgba(251, 146, 60, 0.12)',
          filter: 'blur(50px)',
          animation: `${float} 10s ease-in-out infinite reverse`,
        }}
      />

      <Stack
        spacing={3}
        alignItems="center"
        sx={{
          textAlign: 'center',
          zIndex: 1,
          maxWidth: 400,
        }}
      >
        {/* Floating Goblin Image */}
        <Box
          component="img"
          src="/images/GUEST_img.png"
          alt="Goblin Guest"
          sx={{
            width: 160,
            height: 160,
            borderRadius: 99,
            border: '6px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            animation: `${float} 6s ease-in-out infinite`,
            backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : '#fff',
            objectFit: 'cover',
          }}
        />

        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Lobster', cursive",
              color: isDark ? '#fff' : '#1e293b',
              mb: 1.5,
              textShadow: isDark ? '0 0 15px rgba(255,255,255,0.2)' : 'none',
            }}
          >
            Want this feature?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.7)' : '#475569',
              fontWeight: 600,
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            Then make an account, you <Box component="span" sx={{ color: isDark ? '#fbbf24' : '#d97706', fontWeight: 800 }}>Goblin</Box>!
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={handleJoin}
          sx={{
            py: 1.5,
            px: 6,
            borderRadius: 99,
            fontSize: '1.1rem',
            fontWeight: 800,
            textTransform: 'none',
            letterSpacing: 0.5,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            '&:hover': {
              transform: 'scale(1.08) translateY(-2px)',
              boxShadow: '0 15px 30px rgba(37, 99, 235, 0.4)',
              background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          Join iTimeline
        </Button>
      </Stack>
    </Box>
  );
};

export default GuestHubFiller;
