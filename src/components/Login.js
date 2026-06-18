import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  Alert,
  useTheme,
  GlobalStyles,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  getGlassInputSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import TradingCard from './TradingCard';
import GoblinModeFront from './GoblinModeFront';

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
  const { login } = useAuth();
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const [activeCard, setActiveCard] = useState(null);
  const anyCardActive = !!activeCard;
  const [isEntering, setIsEntering] = useState(true);

  const containerRef = React.useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const cardRefs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];

  React.useEffect(() => {
    if (window.innerWidth < 900 && cardRefs[0].current) {
      cardRefs[0].current.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }

    const timer1 = setTimeout(() => {
      setActiveCard('login');
    }, 50);

    const timer2 = setTimeout(() => {
      setIsEntering(false);
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleCardClick = (cardType, index) => {
    setActiveCard(cardType);
    if (window.innerWidth < 900 && cardRefs[index].current) {
      cardRefs[index].current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleCardNavigation = (targetPath, targetIndex) => {
    setActiveCard(null);
    if (window.innerWidth < 900 && cardRefs[targetIndex].current) {
      cardRefs[targetIndex].current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(() => {
      navigate(targetPath);
    }, 220);
  };

  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (e) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const getCardProps = (index) => {
    const isMobile = window.innerWidth < 900;
    if (!isMobile) {
      const angles = [-4, -1.5, 1.5, 4];
      const offsets = [0, -12, -12, 0];
      return { tiltAngle: angles[index], fanningY: offsets[index] };
    }

    const cardWidth = Math.max(300, Math.min(window.innerWidth * 0.85, 340));
    const gap = 16;
    const paddingLeft = 24;

    // Position of card center relative to scroll container
    const cardCenter = paddingLeft + index * (cardWidth + gap) + cardWidth / 2;
    // Position of viewport center relative to scroll container
    const viewportCenter = scrollLeft + window.innerWidth / 2;

    const distance = cardCenter - viewportCenter;
    const maxTilt = 8;
    const tilt = (distance / window.innerWidth) * maxTilt;

    return {
      tiltAngle: Math.max(-10, Math.min(10, tilt)),
      fanningY: 0
    };
  };

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
      <GlobalStyles styles={{ 'html, body': { background: appCanvasBackground, overflow: 'hidden' } }} />
      <Box
        onClick={() => setActiveCard(null)}
        sx={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: appCanvasBackground,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: { xs: '72px', md: '88px' }, // Offset for the fixed top AppBar height to prevent visual leak
          pb: { xs: 2, md: 3 },
          px: 0, // Zero padding for edge-to-edge scrolling on mobile
          zIndex: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
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
            pointerEvents: 'none',
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
            pointerEvents: 'none',
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '1.5s',
          }}
        />

        {/* ── Medieval Hanging Scroll Title Banner ────────────────────────── */}
        <Box
          onClick={(e) => {
            e.stopPropagation();
            if (activeCard) setActiveCard(null);
          }}
          sx={{
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: { xs: 1.5, md: 3 },
            flexShrink: 0,
            cursor: activeCard ? 'pointer' : 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            msUserSelect: 'none',
            transition: 'transform 0.2s ease',
            '&:active': activeCard ? {
              transform: 'scale(0.98)',
            } : {},
          }}
        >
          {/* Wooden Peg / Nail */}
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#5c4033',
              border: '1px solid rgba(0,0,0,0.4)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              zIndex: 3,
              mb: -0.25,
            }}
          />

          {/* Hanging Ropes Wrapper */}
          <Box
            sx={{
              width: 120,
              height: 25,
              position: 'relative',
              mb: -0.25,
            }}
          >
            {/* Left rope line */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: '2px',
                height: '30px',
                background: theme.palette.mode === 'dark' ? '#bf9553' : '#5c4033',
                transform: 'rotate(-32deg)',
                transformOrigin: 'top center',
              }}
            />
            {/* Right rope line */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: '50%',
                width: '2px',
                height: '30px',
                background: theme.palette.mode === 'dark' ? '#bf9553' : '#5c4033',
                transform: 'rotate(32deg)',
                transformOrigin: 'top center',
              }}
            />
          </Box>

          {/* Scroll banner cylinder body */}
          <Box
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, #3a3227 0%, #241e16 100%)'
                : 'linear-gradient(180deg, #faefe0 0%, #ebdcb9 100%)',
              border: `2px solid ${theme.palette.mode === 'dark' ? '#bfa36f' : '#5c4033'}`,
              borderRadius: '10px',
              px: { xs: 4, md: 7 },
              py: { xs: 1, md: 1.25 },
              boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
              position: 'relative',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                bottom: '-6px',
                width: '16px',
                height: '100%',
                background: theme.palette.mode === 'dark' ? '#211a11' : '#d2bca0',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#bfa36f' : '#5c4033'}`,
                zIndex: -1,
              },
              '&::before': {
                left: '-10px',
                transform: 'skewY(-6deg)',
                borderRight: 'none',
                borderTopLeftRadius: '6px',
                borderBottomLeftRadius: '6px',
              },
              '&::after': {
                right: '-10px',
                transform: 'skewY(6deg)',
                borderLeft: 'none',
                borderTopRightRadius: '6px',
                borderBottomRightRadius: '6px',
              },
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{
                color: theme.palette.mode === 'dark' ? '#fff5e6' : '#3d2b1f',
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontSize: { xs: '1.05rem', md: '1.35rem' },
                textAlign: 'center',
                fontFamily: 'serif',
                textShadow: theme.palette.mode === 'dark'
                  ? '0 2px 3px rgba(0,0,0,0.9)'
                  : '0 1px 1px rgba(255,255,255,0.7)',
              }}
            >
              Choose Your Path
            </Typography>
          </Box>
        </Box>

        {/* ── Trading Cards Horizontal Container ────────────────────────── */}
        <Box
          ref={containerRef}
          onScroll={handleScroll}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'center' },
            gap: { xs: 2, md: 3 },
            width: '100%',
            maxWidth: '100vw', // Bleed edge-to-edge
            flexGrow: 1,
            height: '100%',
            overflowX: { xs: 'auto', md: 'visible' },
            overflowY: 'visible',
            mt: { xs: '-36px', md: 0 },
            pt: { xs: 4, md: 5 },
            pb: { xs: 4, md: 5 },
            px: { xs: 3, md: 4 }, // Padding inside the scroll container for mobile and PC view consistent wide margin
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {/* Card 1: Login First */}
          <TradingCard
            ref={cardRefs[0]}
            active={activeCard === 'login'}
            onClick={() => handleCardClick('login', 0)}
            cardType="login"
            tiltAngle={getCardProps(0).tiltAngle}
            fanningY={getCardProps(0).fanningY}
            anyCardActive={anyCardActive}
            preHovered={isEntering && !activeCard}
            back={
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: theme.palette.mode === 'dark' ? 'rgba(30,58,138,0.35)' : 'rgba(219,234,254,0.45)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  p: { xs: 1.5, sm: 2.5, md: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2.5,
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
                <Typography variant="h6" color={theme.palette.mode === 'dark' ? '#93c5fd' : '#1e40af'} sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Login First
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ px: 2, minHeight: 40 }}>
                  for full access & posting
                </Typography>
              </Box>
            }
            front={
              <Box
                component="form"
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  width: '100%',
                  height: '100%',
                  p: { xs: 1.5, sm: 2.5 },
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'transparent',
                  border: '3px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(147, 197, 253, 0.45)' : 'rgba(30, 64, 175, 0.4)',
                  borderRadius: '10px',
                  boxShadow: theme.palette.mode === 'dark' ? '0 20px 45px rgba(0, 0, 0, 0.45)' : '0 20px 45px rgba(255, 177, 153, 0.25)',
                  '& .MuiTextField-root': getGlassInputSx(theme),
                }}
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCard(null);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 1.5,
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { opacity: 0.8 },
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'rgba(147,197,253,0.1)',
                      color: '#93c5fd',
                      fontSize: 20,
                    }}
                  >
                    👤
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Login</Typography>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 1.5, py: 0 }}>
                      {error}
                    </Alert>
                  )}
                  <TextField
                    fullWidth label="Email" name="email" type="email"
                    value={formData.email} onChange={handleChange}
                    margin="dense" required autoComplete="email"
                    InputLabelProps={{ shrink: true }}
                    error={errorField === 'all'}
                  />
                  <TextField
                    fullWidth label="Password" name="password" type="password"
                    value={formData.password} onChange={handleChange}
                    margin="dense" required autoComplete="current-password"
                    InputLabelProps={{ shrink: true }}
                    error={errorField === 'all'}
                  />
                </Box>

                <Box sx={{ mt: 'auto', pt: 1.5 }}>
                  <Button
                    type="submit" fullWidth variant="outlined"
                    sx={getGlassPillActionButtonSx(theme)}
                  >
                    Login
                  </Button>
                </Box>
              </Box>
            }
          />

          {/* Card 2: Join Timeline */}
          <TradingCard
            ref={cardRefs[1]}
            active={activeCard === 'register'}
            onClick={() => handleCardNavigation('/register', 1)}
            cardType="register"
            tiltAngle={getCardProps(1).tiltAngle}
            fanningY={getCardProps(1).fanningY}
            anyCardActive={anyCardActive}
            back={
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: theme.palette.mode === 'dark' ? 'rgba(120, 80, 20, 0.35)' : 'rgba(254, 243, 199, 0.45)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  p: { xs: 1.5, sm: 2.5, md: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 86,
                    height: 86,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.1)',
                    color: theme.palette.mode === 'dark' ? '#f59e0b' : '#b45309',
                    fontSize: 40,
                    border: '2px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.25)',
                  }}
                >
                  📜
                </Avatar>
                <Typography variant="h6" color={theme.palette.mode === 'dark' ? '#f59e0b' : '#b45309'} sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Join Timeline
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ px: 2, minHeight: 40 }}>
                  claim your path
                </Typography>
              </Box>
            }
            front={
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Navigating...</Typography>
              </Box>
            }
          />

          {/* Card 3: Forgot Keys */}
          <TradingCard
            ref={cardRefs[2]}
            active={activeCard === 'recover'}
            onClick={() => handleCardNavigation('/recover', 2)}
            cardType="recover"
            tiltAngle={getCardProps(2).tiltAngle}
            fanningY={getCardProps(2).fanningY}
            anyCardActive={anyCardActive}
            back={
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: theme.palette.mode === 'dark' ? 'rgba(88, 28, 135, 0.35)' : 'rgba(243, 232, 255, 0.45)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  p: { xs: 1.5, sm: 2.5, md: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 86,
                    height: 86,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                    color: theme.palette.mode === 'dark' ? '#c084fc' : '#7c3aed',
                    border: '2px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.35)' : 'rgba(124, 58, 237, 0.25)',
                  }}
                >
                  <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '32px', zIndex: 1 }}>🚪</span>
                    <span style={{ fontSize: '20px', position: 'absolute', bottom: -5, right: -5, zIndex: 2 }}>🔑</span>
                  </Box>
                </Avatar>
                <Typography variant="h6" color={theme.palette.mode === 'dark' ? '#c084fc' : '#7c3aed'} sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Forgot Keys
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ px: 2, minHeight: 40 }}>
                  lost keys & recovery
                </Typography>
              </Box>
            }
            front={
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Navigating...</Typography>
              </Box>
            }
          />

          {/* Card 4: Goblin Mode */}
          <TradingCard
            ref={cardRefs[3]}
            active={activeCard === 'goblin'}
            onClick={() => handleCardClick('goblin', 3)}
            cardType="goblin"
            tiltAngle={getCardProps(3).tiltAngle}
            fanningY={getCardProps(3).fanningY}
            anyCardActive={anyCardActive}
            back={
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  background: theme.palette.mode === 'dark' ? 'rgba(20,50,20,0.35)' : 'rgba(220,252,231,0.45)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  p: { xs: 1.5, sm: 2.5, md: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                <Typography variant="h6" color={theme.palette.mode === 'dark' ? '#86efac' : '#166534'} sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Goblin Mode
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ px: 2, minHeight: 40 }}>
                  view-only as a guest
                </Typography>
              </Box>
            }
            front={<GoblinModeFront theme={theme} active={activeCard === 'goblin'} />}
          />
        </Box>
      </Box>
    </>
  );
};

export default Login;
