import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
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
  keyframes
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Event as EventIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  BugReport as BugReportIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion, useAnimation } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import LandingTimelineV3 from './LandingTimelineV3';
import DonationButtons from './DonationButtons';
import AnimatedTagline from './AnimatedTagline';

// API Health Check Component
const ApiHealthCheck = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const checkApiHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/health');
      setHealthData(response.data);
    } catch (err) {
      console.error('API Health check failed:', err);
      setError(err.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mt: 2, overflow: 'visible' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <BugReportIcon sx={{ mr: 1 }} /> API Diagnostics
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={checkApiHealth}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Check Connection
          </Button>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {healthData && (
          <>
            <Alert 
              severity={healthData.status === 'ok' ? 'success' : 'warning'}
              sx={{ mb: 2 }}
              action={
                <Button size="small" onClick={() => setExpanded(!expanded)}>
                  {expanded ? 'Hide' : 'Details'}
                </Button>
              }
            >
              {healthData.status === 'ok' ? 'API is connected and healthy' : 'API connected with issues'}
            </Alert>
            
            <Collapse in={expanded}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                maxHeight: 300,
                overflow: 'auto'
              }}>
                <pre>{JSON.stringify(healthData, null, 2)}</pre>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Main Landing Page Component
const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

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

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)' 
          : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
        pt: 6,
        pb: 8,
        position: 'relative'
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
                content: '"Not Yet Available, Seeking Funding!"',
                position: 'absolute',
                bottom: '-15px',
                right: '-20px',
                transform: 'rotate(-15deg)',
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                fontFamily: '"Courier New", monospace',
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow: `
                  2px 2px 0px #B8860B,
                  -1px -1px 0px #B8860B,
                  1px -1px 0px #B8860B,
                  -1px 1px 0px #B8860B,
                  1px 1px 0px #B8860B,
                  0 0 10px rgba(255, 215, 0, 0.8),
                  0 0 20px rgba(255, 215, 0, 0.6)
                `,
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '2px solid #FFD700',
                whiteSpace: 'nowrap',
                zIndex: 10,
                animation: 'pulse 2s ease-in-out infinite alternate'
              }
            }}
          >
            iTimeline
          </Typography>
          
          <AnimatedTagline />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {user ? (
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => navigate('/timeline-v3/new')}
                startIcon={<TimelineIcon />}
              >
                Create Timeline
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
          <Typography variant="h4" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
            Try Our Interactive Timeline
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', maxWidth: '800px' }}>
            Drag the timeline left and right to explore events. This is just a preview of what you can create!
          </Typography>
          
          <Box sx={{ width: '100%', maxWidth: '100%' }}>
            <LandingTimelineV3 />
          </Box>
        </Box>
        
        {/* Features Section */}
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h4" 
            component="h3" 
            gutterBottom
            sx={{ 
              textAlign: 'center',
              mb: 4
            }}
          >
            Key Features
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <TimelineIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" component="h4" gutterBottom textAlign="center">
                    Infinite Timeline
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create timelines with unlimited events that can extend infinitely in both directions.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <EventIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" component="h4" gutterBottom textAlign="center">
                    Rich Event Cards
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add media, links, and formatted text to create engaging event cards.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <SearchIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" component="h4" gutterBottom textAlign="center">
                    Smart Filtering
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use hashtags and search to quickly find and filter events in your timeline.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <ShareIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" component="h4" gutterBottom textAlign="center">
                    Easy Sharing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Share your timelines with others and collaborate on event creation.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        {/* Developer Tools Section */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Button 
            variant="text" 
            color="inherit" 
            size="small"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            sx={{ opacity: 0.7 }}
          >
            {showDiagnostics ? 'Hide Developer Tools' : 'Developer Tools'}
          </Button>
          
          <Collapse in={showDiagnostics}>
            <ApiHealthCheck />
          </Collapse>
        </Box>
      </Container>
      
      {/* Donation Floating Action Buttons */}
      <DonationButtons />
    </Box>
  );
};

export default LandingPage;
