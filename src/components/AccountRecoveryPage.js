import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  useTheme,
  IconButton,
  InputAdornment,
  GlobalStyles,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion, AnimatePresence } from 'framer-motion';
import api, { recoverAccount } from '../utils/api';
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
  const [activeCard, setActiveCard] = useState(null);
  const anyCardActive = !!activeCard;
  const [isEntering, setIsEntering] = useState(true);

  // Email Code Recovery States
  const [recoveryMethod, setRecoveryMethod] = useState(null); // null (selection) | 'email' | 'key'
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendCode = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setShake(false);

    const email = formData.email.trim();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      triggerErrorShake();
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/v1/auth/send-recovery-code', { email });
      setEmailCodeSent(true);
      setSuccessMessage('A 6-digit recovery code has been sent to your email!');
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Failed to send recovery code';
      setError(message);
      triggerErrorShake();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetWithCode = async (event) => {
    event.preventDefault();
    setError('');
    setShake(false);

    const email = formData.email.trim();
    const code = emailCode.trim();
    const newPassword = formData.newPassword;
    const confirmPassword = formData.confirmPassword;

    if (!email || !code || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      triggerErrorShake();
      return;
    }

    if (code.length !== 6) {
      setError('Please enter the 6-digit verification code.');
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
      const response = await api.post('/api/v1/auth/reset-password-with-code', {
        email,
        code,
        new_password: newPassword
      });

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }

      localStorage.removeItem('user');
      localStorage.setItem('itl_recovery_nudge', 'true');
      window.location.href = '/home';
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || 'Failed to reset password';
      setError(message);
      triggerErrorShake();
    } finally {
      setSubmitting(false);
    }
  };

  const getFormSubmitHandler = () => {
    if (recoveryMethod === 'key') return handleSubmit;
    return emailCodeSent ? handleResetWithCode : handleSendCode;
  };

  const getButtonText = () => {
    if (submitting) {
      return recoveryMethod === 'email' && !emailCodeSent ? 'Sending…' : 'Recovering…';
    }
    if (recoveryMethod === 'email' && !emailCodeSent) {
      return 'Send Recovery Code';
    }
    return 'Recover';
  };

  const isButtonDisabled = () => {
    if (submitting) return true;
    if (recoveryMethod === 'key') {
      return !formData.email || !formData.backupPassword || !formData.newPassword || !formData.confirmPassword;
    }
    if (!emailCodeSent) {
      return !formData.email;
    }
    return !formData.email || !emailCode || !formData.newPassword || !formData.confirmPassword;
  };

  const containerRef = React.useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const cardRefs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];

  React.useEffect(() => {
    if (window.innerWidth < 900 && cardRefs[2].current) {
      cardRefs[2].current.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }

    const timer1 = setTimeout(() => {
      setActiveCard('recover');
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

      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
      }
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }

      localStorage.removeItem('user');
      localStorage.setItem('itl_recovery_nudge', 'true');
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

  const pageBackground = getTimelineSurfaceTheme(theme).canvas;

  return (
    <>
      <GlobalStyles styles={{ 'html, body': { background: pageBackground, overflow: 'hidden' } }} />
      <Box
        onClick={() => setActiveCard(null)}
        sx={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: pageBackground,
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
            onClick={() => handleCardNavigation('/login', 0)}
            cardType="login"
            tiltAngle={getCardProps(0).tiltAngle}
            fanningY={getCardProps(0).fanningY}
            anyCardActive={anyCardActive}
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
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Navigating...</Typography>
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
            onClick={() => handleCardClick('recover', 2)}
            cardType="recover"
            tiltAngle={getCardProps(2).tiltAngle}
            fanningY={getCardProps(2).fanningY}
            anyCardActive={anyCardActive}
            preHovered={isEntering && !activeCard}
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
              <Box
                component="form"
                onSubmit={getFormSubmitHandler()}
                onClick={(e) => {
                  const isInteractive = e.target.closest(
                    'input, button, a, label, textarea, [role="button"], [role="checkbox"], .MuiAlert-root, .MuiInputBase-root, .MuiFormHelperText-root'
                  );
                  if (!isInteractive) {
                    setActiveCard(null);
                  } else {
                    e.stopPropagation();
                  }
                }}
                sx={{
                  width: '100%',
                  height: '100%',
                  p: { xs: 1.5, sm: 2.5 },
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'transparent',
                  border: '3px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.45)' : 'rgba(124, 58, 237, 0.4)',
                  borderRadius: '10px',
                  boxShadow: theme.palette.mode === 'dark' ? '0 20px 45px rgba(0, 0, 0, 0.45)' : '0 20px 45px rgba(255, 177, 153, 0.25)',
                  '& .MuiTextField-root': getGlassInputSx(theme),
                }}
                className={shake ? 'animate-shake' : ''}
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
                    mb: 1,
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
                      bgcolor: 'rgba(192, 132, 252, 0.1)',
                      color: '#c084fc',
                      fontSize: 20,
                    }}
                  >
                    🔑
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Recovery</Typography>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, py: 0.5, display: 'flex', flexDirection: 'column' }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 1.5, py: 0, flexShrink: 0 }}>
                      {error}
                    </Alert>
                  )}
                  {successMessage && (
                    <Alert severity="success" sx={{ mb: 1.5, py: 0, flexShrink: 0 }}>
                      {successMessage}
                    </Alert>
                  )}

                  <AnimatePresence mode="wait" initial={false}>
                    {recoveryMethod === null ? (
                      <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 24,
                          flexGrow: 1,
                          paddingTop: 32,
                          paddingBottom: 32,
                          width: '100%'
                        }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => setRecoveryMethod('email')}
                          sx={{
                            ...getGlassPillActionButtonSx(theme),
                            width: '80%',
                            maxWidth: '260px',
                            py: 1.85,
                            fontSize: '0.95rem',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 1.5,
                          }}
                        >
                          <span>📧</span> Email Yourself
                        </Button>

                        <Button
                          variant="outlined"
                          onClick={() => setRecoveryMethod('key')}
                          sx={{
                            ...getGlassPillActionButtonSx(theme),
                            width: '80%',
                            maxWidth: '260px',
                            py: 1.85,
                            fontSize: '0.95rem',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 1.5,
                          }}
                        >
                          <span>🔑</span> Recovery Key
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="form-fields"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}
                      >
                        {/* Active Method Floating Capsule Indicator (Entirely clickable to close) */}
                        <Box
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecoveryMethod(null);
                            setEmailCodeSent(false);
                            setError('');
                            setSuccessMessage('');
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            alignSelf: 'center',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.3)' : 'rgba(124, 58, 237, 0.2)',
                            borderRadius: '999px',
                            px: 3,
                            py: 0.75,
                            mb: 2,
                            width: 'fit-content',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.25)' : 'rgba(124, 58, 237, 0.15)',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.5)' : 'rgba(124, 58, 237, 0.4)',
                              transform: 'scale(1.02)'
                            },
                            '&:active': {
                              transform: 'scale(0.98)'
                            }
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#c084fc' : '#7c3aed', letterSpacing: '0.02em' }}>
                            {recoveryMethod === 'email' ? '📧 Email Yourself' : '🔑 Recovery Key'}
                          </Typography>
                        </Box>

                        {recoveryMethod === 'key' ? (
                          <>
                            <TextField
                              fullWidth size="small" required label="Registered Email or User ID" name="email" type="text"
                              value={formData.email} onChange={handleChange} autoComplete="username" margin="dense"
                            />
                            <TextField
                              fullWidth size="small" required label="Backup Password" name="backupPassword"
                              type={showBackupPassword ? 'text' : 'password'} value={formData.backupPassword} onChange={handleChange}
                              autoComplete="off" margin="dense"
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowBackupPassword(!showBackupPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                                      {showBackupPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                            <TextField
                              fullWidth size="small" required label="New Password" name="newPassword"
                              type={showNewPassword ? 'text' : 'password'} value={formData.newPassword} onChange={handleChange}
                              autoComplete="new-password" margin="dense"
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                            <TextField
                              fullWidth size="small" required label="Confirm New Password" name="confirmPassword"
                              type={showNewPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
                              autoComplete="new-password" margin="dense"
                            />
                          </>
                        ) : (
                          <>
                            <TextField
                              fullWidth size="small" required label="Registered Email" name="email" type="email"
                              value={formData.email} onChange={handleChange} autoComplete="email" margin="dense"
                              disabled={emailCodeSent}
                            />
                            {emailCodeSent && (
                              <>
                                <TextField
                                  fullWidth size="small" required label="6-Digit Verification Code" name="emailCode"
                                  value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  autoComplete="off" margin="dense"
                                />
                                <TextField
                                  fullWidth size="small" required label="New Password" name="newPassword"
                                  type={showNewPassword ? 'text' : 'password'} value={formData.newPassword} onChange={handleChange}
                                  autoComplete="new-password" margin="dense"
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                                <TextField
                                  fullWidth size="small" required label="Confirm New Password" name="confirmPassword"
                                  type={showNewPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange}
                                  autoComplete="new-password" margin="dense"
                                />
                              </>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {recoveryMethod !== null && (
                  <Box sx={{ mt: 'auto', pt: 1.5, flexShrink: 0 }}>
                    <Button
                      type="submit" variant="outlined" size="large"
                      disabled={isButtonDisabled()}
                      fullWidth
                      sx={getGlassPillActionButtonSx(theme)}
                    >
                      {getButtonText()}
                    </Button>
                  </Box>
                )}
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
                  choose to login as a Guest with viewing-only
                </Typography>
              </Box>
            }
            front={<GoblinModeFront theme={theme} active={activeCard === 'goblin'} onClose={() => setActiveCard(null)} />}
          />
        </Box>
      </Box>
    </>
  );
};

export default AccountRecoveryPage;
