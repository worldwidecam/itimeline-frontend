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
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { recoverAccount } from '../utils/api';
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
  const [activeCard, setActiveCard] = useState('recover');

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
            overflowY: 'hidden',
            pb: 2,
            px: { xs: 3, md: 4 }, // Padding inside the scroll container for mobile and PC view consistent wide margin
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {/* Card 1: Login First */}
          <TradingCard
            active={activeCard === 'login'}
            onClick={() => navigate('/login')}
            cardType="login"
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
            active={activeCard === 'register'}
            onClick={() => navigate('/register')}
            cardType="register"
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
            active={activeCard === 'recover'}
            onClick={() => setActiveCard('recover')}
            cardType="recover"
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
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  width: '100%',
                  height: '100%',
                  p: { xs: 1.5, sm: 2.5 },
                  display: 'flex',
                  flexDirection: 'column',
                  background: theme.palette.mode === 'dark' ? 'rgba(15, 12, 32, 0.65)' : 'rgba(255, 255, 255, 0.65)',
                  border: '3px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(192, 132, 252, 0.45)' : 'rgba(124, 58, 237, 0.4)',
                  borderRadius: '10px',
                  backdropFilter: 'blur(16px)',
                  boxShadow: theme.palette.mode === 'dark' ? '0 20px 45px rgba(0, 0, 0, 0.45)' : '0 20px 45px rgba(255, 177, 153, 0.25)',
                  '& .MuiTextField-root': getGlassInputSx(theme),
                }}
                className={shake ? 'animate-shake' : ''}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
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

                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, py: 0.5 }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 1.5, py: 0 }}>
                      {error}
                    </Alert>
                  )}
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
                </Box>

                <Box sx={{ mt: 'auto', pt: 1.5 }}>
                  <Button
                    type="submit" variant="outlined" size="large"
                    disabled={submitting || !formData.email || !formData.backupPassword || !formData.newPassword || !formData.confirmPassword}
                    fullWidth
                    sx={getGlassPillActionButtonSx(theme)}
                  >
                    {submitting ? 'Recovering…' : 'Recover'}
                  </Button>
                </Box>
              </Box>
            }
          />

          {/* Card 4: Goblin Mode */}
          <TradingCard
            active={activeCard === 'goblin'}
            onClick={() => setActiveCard('goblin')}
            cardType="goblin"
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
            front={<GoblinModeFront theme={theme} active={activeCard === 'goblin'} />}
          />
        </Box>
      </Box>
    </>
  );
};

export default AccountRecoveryPage;
