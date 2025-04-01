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

  // Define neon flicker animation
  const neonFlicker = keyframes`
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
      text-shadow: 
        ${theme.palette.mode === 'dark'
          ? '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #ff9a9e, 0 0 20px #ff9a9e, 0 0 25px #ff9a9e, 0 0 30px #ff9a9e, 0 0 35px #ff9a9e'
          : '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #4568dc, 0 0 20px #4568dc, 0 0 25px #4568dc, 0 0 30px #4568dc, 0 0 35px #4568dc'};
      opacity: 1;
    }
    20%, 24%, 55% {
      text-shadow: none;
      opacity: 0.8;
    }
    80%, 85% {
      text-shadow: none;
      opacity: 0.9;
    }
  `;

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(18, 18, 50, 0.9) 0%, rgba(33, 33, 78, 0.9) 100%)' 
          : 'linear-gradient(135deg, rgba(240, 245, 255, 0.9) 0%, rgba(220, 230, 255, 0.9) 100%)',
        pt: 6,
        pb: 8
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
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)'
                : 'linear-gradient(45deg, #4568dc 0%, #b06ab3 100%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: theme.palette.mode === 'dark'
                ? '0 0 30px rgba(255, 154, 158, 0.5)'
                : '0 0 30px rgba(69, 104, 220, 0.3)',
              border: '2px solid',
              borderColor: theme.palette.mode === 'dark' ? '#ff9a9e' : '#4568dc',
              borderRadius: 1,
              animation: `${neonFlicker} 5s infinite alternate-reverse`
            }}
          >
            iTimeline
          </Typography>
          
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              mb: 4,
              maxWidth: 700,
              mx: 'auto',
              color: theme.palette.text.secondary
            }}
          >
            Create beautiful, interactive timelines to visualize events and share your stories
          </Typography>
          
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
    </Box>
  );
};

export default LandingPage;
