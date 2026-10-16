import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Alert,
  Link,
  IconButton,
  Tooltip,
  useTheme,
  Collapse,
  keyframes,
  GlobalStyles,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Event as EventIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  AccountTree as HierarchyIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Public as PublicIcon,
  Place as PlaceIcon,
  Campaign as CampaignIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { motion, useAnimation } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api, { getLandingRotatorSettings, getSiteUserCount } from '../utils/api';
import LandingTimelineV3 from './LandingTimelineV3';
import LandingCommunityShowcase from './landing/LandingCommunityShowcase';
import LandingHeatmapShowcase from './landing/LandingHeatmapShowcase';
import DonationButtons from './DonationButtons';
import AnimatedTagline from './AnimatedTagline';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import UserCountChip from './common/UserCountChip';

// Main Landing Page Component
const LandingPage = () => {
  const theme = useTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [badgeText, setBadgeText] = useState('Coming Soon!');
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [siteUserCount, setSiteUserCount] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 'document',
      title: 'A social media for the Working Class',
      subtitle: 'Every movement begins with a shared record of what happened.',
      buttonLabel: '1. Document',
      buttonSub: 'Visual History',
      features: [
        {
          icon: <TimelineIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
          title: 'Infinite Timeline',
          desc: 'Create chronological records with unlimited events extending in both directions.'
        },
        {
          icon: <EventIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
          title: 'Rich Event Cards',
          desc: 'Document moments with media, links, remarks, and genuine community upvotes.'
        },
        {
          icon: <SearchIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
          title: 'Smart Filtering',
          desc: 'Filter history by hashtags, categories, or date ranges without algorithmic suppression.'
        },
        {
          icon: <ShareIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
          title: 'Easy Sharing',
          desc: 'Share verified timelines anywhere with instant previews for articles, videos, and news.'
        }
      ]
    },
    {
      id: 'organize',
      title: 'Tools to Build Real Community Power',
      subtitle: 'Help unions and join communities.',
      buttonLabel: '2. Organize',
      buttonSub: 'Community Power',
      features: [
        {
          icon: <HierarchyIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
          title: 'Workplace Branches',
          desc: 'Connect big general communities down to your specific company and local store.'
        },
        {
          icon: <TrophyIcon sx={{ fontSize: 44, color: '#ffd700' }} />,
          title: 'Goals We Vote On',
          desc: 'Bronze, Silver, and Gold milestones with real progress bars and group voting.'
        },
        {
          icon: <InfoIcon sx={{ fontSize: 44, color: 'info.main' }} />,
          title: 'Helpful Notes & Info',
          desc: 'Keep worker rights, shift notes, and meeting dates pinned for everyone.'
        },
        {
          icon: <SecurityIcon sx={{ fontSize: 44, color: 'success.main' }} />,
          title: 'Real Coworkers Only',
          desc: 'Vetted member approvals keep private workplace organizing safe from outsiders.'
        }
      ]
    },
    {
      id: 'mobilize',
      title: 'See Where Your Community Has Real Impact',
      subtitle: 'Taking digital solidarity into the physical world.',
      buttonLabel: '3. Mobilize',
      buttonSub: 'Impact Heat-Map',
      features: [
        {
          icon: <PublicIcon sx={{ fontSize: 44, color: 'primary.main' }} />,
          title: 'Geographic Density',
          desc: 'Visualize where your community has physical presence from nations down to counties.'
        },
        {
          icon: <GroupsIcon sx={{ fontSize: 44, color: '#ff5722' }} />,
          title: 'Live Member Indexes',
          desc: 'Track verified member concentrations to direct organizing resources where needed most.'
        },
        {
          icon: <CampaignIcon sx={{ fontSize: 44, color: 'secondary.main' }} />,
          title: 'Coordinated Actions',
          desc: 'Turn online momentum into real boots on the ground with scheduled rallies and pickets.'
        },
        {
          icon: <PlaceIcon sx={{ fontSize: 44, color: 'error.main' }} />,
          title: 'Local Autonomy',
          desc: 'Empower municipal chapters while keeping everyone united under the larger movement.'
        }
      ]
    }
  ];

  useEffect(() => {
    let active = true;
    const loadBadgeSettings = async () => {
      try {
        const data = await getLandingRotatorSettings();
        if (!active) return;
        const settings = data?.landing_rotator || {};
        setBadgeText(settings.badge_text || 'Coming Soon!');
        setBadgeEnabled(Boolean(settings.badge_enabled));
      } catch (error) {
        if (!active) return;
        setBadgeText('Coming Soon!');
        setBadgeEnabled(true);
      }
    };

    loadBadgeSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadUserCount = async () => {
      try {
        const data = await getSiteUserCount();
        if (!active) return;
        if (typeof data?.count === 'number') {
          setSiteUserCount(data.count);
        }
      } catch (error) {
        if (!active) return;
        setSiteUserCount(null);
      }
    };
    loadUserCount();
    return () => {
      active = false;
    };
  }, []);

  // Define neon effect styles
  const neonEffect = {
    textShadow: theme.palette.mode === 'dark'
      ? '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff9a9e, 0 0 30px #ff9a9e, 0 0 40px #ff9a9e, 0 0 55px #ff9a9e, 0 0 75px #ff9a9e'
      : '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #4568dc, 0 0 30px #4568dc, 0 0 40px #4568dc, 0 0 55px #4568dc, 0 0 75px #4568dc',
    color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #ff9a9e, 0 0 30px #ff9a9e, 0 0 40px #ff9a9e'
      : '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #4568dc, 0 0 30px #4568dc, 0 0 40px #4568dc'
  };

  // Define neon flicker animation
  const neonFlicker = keyframes`
    0%, 18%, 22%, 25%, 53%, 57%, 100% {
      text-shadow: ${neonEffect.textShadow};
      box-shadow: ${neonEffect.boxShadow};
    }
    
    20%, 24%, 55% {
      text-shadow: none;
      box-shadow: none;
    }
  `;

  const bubblePulse = keyframes`
    0% {
      transform: translateY(-50%) rotate(-6deg) scale(1);
    }
    50% {
      transform: translateY(-50%) rotate(-6deg) scale(1.06);
    }
    100% {
      transform: translateY(-50%) rotate(-6deg) scale(1);
    }
  `;

  return (
    <>
      <GlobalStyles styles={{ 'html, body': { background: appCanvasBackground, overflowY: 'auto !important' } }} />
      <Box 
        sx={{ 
          minHeight: 'calc(100vh - 64px)',
          background: appCanvasBackground,
          pt: 6,
          pb: 8,
          position: 'relative',
          overflowX: 'hidden' // Prevent horizontal scrolling
        }}
      >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h1" 
            component="h1"
            sx={{ 
              fontFamily: "'Lobster', cursive",
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              mb: 2,
              padding: '0.5rem 1.5rem',
              background: theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.6)'
                : 'rgba(255, 255, 255, 0.6)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#fff',
              borderRadius: '8px',
              border: '2px solid',
              borderColor: theme.palette.mode === 'dark' ? '#ff9a9e' : '#4568dc',
              position: 'relative',
              display: 'inline-block',
              textShadow: neonEffect.textShadow,
              boxShadow: neonEffect.boxShadow,
              animation: `${neonFlicker} 5s infinite alternate-reverse`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '6px',
                padding: '2px',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)'
                  : 'linear-gradient(45deg, #4568dc 0%, #b06ab3 100%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none'
              },
              '&::after': {
                content: '""'
              }
            }}
          >
            iTimeline
            {badgeEnabled && (
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  top: { xs: '105%', sm: '105%', md: '55%' },
                  left: { xs: '65%', sm: '75%', md: '100%' },
                  marginLeft: { xs: '0px', md: '12px' },
                  transform: 'translateY(-50%) rotate(-6deg)',
                  fontSize: { xs: '0.65rem', sm: '0.85rem' },
                  fontFamily: '"Comic Sans MS", "Comic Neue", sans-serif',
                  fontWeight: 800,
                  color: '#1f1f1f',
                  background: 'linear-gradient(140deg, #ffffff 0%, #fff2d6 100%)',
                  padding: '8px 12px',
                  borderRadius: '16px',
                  border: '3px solid #1f1f1f',
                  boxShadow: '4px 4px 0 #1f1f1f',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  animation: `${bubblePulse} 2.2s ease-in-out infinite`,
                  // Integrated tail using a single clip-path or robust positioning
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: { xs: '15px', md: '-14px' },
                    bottom: { xs: 'auto', md: '8px' },
                    top: { xs: '-14px', md: 'auto' },
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#1f1f1f',
                    clipPath: { xs: 'polygon(50% 0, 0 100%, 100% 100%)', md: 'polygon(100% 0, 0 50%, 100% 100%)' },
                    zIndex: -1
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: { xs: '17px', md: '-10px' },
                    bottom: { xs: 'auto', md: '9px' },
                    top: { xs: '-10px', md: 'auto' },
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#fff7e6',
                    clipPath: { xs: 'polygon(50% 0, 0 100%, 100% 100%)', md: 'polygon(100% 0, 0 50%, 100% 100%)' },
                    zIndex: 1
                  }
                }}
              >
                {badgeText}
              </Box>
            )}
          </Typography>
          
          <AnimatedTagline />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {user && !isGuest ? (
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => navigate('/home')}
                startIcon={<TimelineIcon />}
              >
                Enter
              </Button>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  component={RouterLink}
                  to="/login"
                >
                  Sign In
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  component={RouterLink}
                  to="/register"
                >
                  Create Account
                </Button>
              </>
            )}
          </Box>
          {typeof siteUserCount === 'number' && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
              <UserCountChip count={siteUserCount} />
            </Box>
          )}
        </Box>
        
        {/* Interactive Timeline Demo */}
        <Box 
          sx={{ 
            mt: 8,
            mb: 8,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography variant="h4" component="h2" sx={{ mb: 1.5, textAlign: 'center', fontWeight: 800 }}>
            {slides[activeSlide].title}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3.5, textAlign: 'center', maxWidth: '800px', color: 'text.secondary' }}>
            {slides[activeSlide].subtitle}
          </Typography>

          {/* 3-Button Slide Switcher */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 1, sm: 2 }, mb: 4, flexWrap: 'wrap' }}>
            {slides.map((s, index) => (
              <Button
                key={s.id}
                variant={activeSlide === index ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setActiveSlide(index)}
                sx={{
                  borderRadius: 2,
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  textTransform: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  boxShadow: activeSlide === index ? '0 4px 14px rgba(69, 104, 220, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <span>{s.buttonLabel}</span>
                <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.72rem', fontWeight: 500 }}>
                  {s.buttonSub}
                </Typography>
              </Button>
            ))}
          </Box>
          
          <Box sx={{ width: '100%', maxWidth: '100%' }}>
            {activeSlide === 0 && <LandingTimelineV3 />}
            {activeSlide === 1 && <LandingCommunityShowcase />}
            {activeSlide === 2 && <LandingHeatmapShowcase />}
          </Box>
        </Box>
        
        {/* Features Section */}
        <Box sx={{ mb: 6, mt: 4 }}>
          
          <Grid container spacing={3}>
            {slides[activeSlide]?.features?.map((feat, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-3px)' } }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {feat.icon}
                    </Box>
                    <Typography variant="h6" component="h4" gutterBottom sx={{ fontWeight: 700 }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feat.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
      
      {/* Donation Floating Action Buttons */}
      <DonationButtons />

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: 6,
          py: 3,
          px: 2,
          textAlign: 'center',
          borderTop: theme.palette.mode === 'dark'
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <Link
            component={RouterLink}
            to="/terms"
            underline="hover"
            sx={{
              fontSize: '0.8rem',
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
              '&:hover': { color: 'primary.main' },
              transition: 'color 0.2s',
            }}
          >
            Terms of Service
          </Link>
          <Box
            component="span"
            sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', fontSize: '0.75rem' }}
          >
            ·
          </Box>
          <Link
            component={RouterLink}
            to="/privacy-policy"
            underline="hover"
            sx={{
              fontSize: '0.8rem',
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
              '&:hover': { color: 'primary.main' },
              transition: 'color 0.2s',
            }}
          >
            Privacy Policy
          </Link>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
            fontSize: '0.72rem',
          }}
        >
          © {new Date().getFullYear()} iTimeline. All rights reserved.
        </Typography>
      </Box>
    </Box>
    </>
  );
};

export default LandingPage;
