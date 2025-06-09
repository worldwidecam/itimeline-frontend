import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs,
  Tab,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  Skeleton,
  useTheme
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CommunityDotTabs from './CommunityDotTabs';

const AdminPanel = () => {
  const { id } = useParams();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const theme = useTheme();

  // Simulated data loading
  useEffect(() => {
    // In a real implementation, this would be an API call
    const loadTimelineData = () => {
      setTimeout(() => {
        setTimelineData({
          name: 'USC',
          description: 'University of Southern California community timeline',
          visibility: 'public',
          createdAt: '2025-01-10',
          memberCount: 42
        });
        setIsLoading(false);
      }, 1000); // Simulate network delay
    };

    loadTimelineData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleVisibilityChange = (event) => {
    const newValue = event.target.checked;
    setIsPrivate(newValue);
    
    // Show warning when switching to private
    if (newValue) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Tab content components with animations
  const MemberManagementTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
    >
      {isLoading ? (
        // Loading skeleton
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ mb: 3 }}>
              <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      ) : (
        // Member management content
        <>
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Member Roles</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Assign roles to members to grant them different permissions
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography>{timelineData?.memberCount || 0} Members</Typography>
                </Box>
                <Button variant="outlined" size="small">Manage Roles</Button>
              </Box>
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Pending Requests</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review and approve membership requests
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="text.secondary">
                  No pending membership requests
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </motion.div>
  );

  const SettingsTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: 20 }}
    >
      {isLoading ? (
        // Loading skeleton
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3, borderRadius: 1 }} />
          
          <Skeleton variant="text" width="30%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 3, borderRadius: 1 }} />
          
          <Skeleton variant="text" width="50%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
        </Box>
      ) : (
        // Settings content
        <>
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Timeline Name</Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={timelineData?.name || ''}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ 
                    fontFamily: 'Lobster, cursive',
                    mr: 0.5,
                    opacity: 0.8
                  }}>i-</Box>
                }}
              />
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>Description</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={timelineData?.description || ''}
              />
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Visibility</Typography>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 1,
              }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={isPrivate}
                      onChange={handleVisibilityChange}
                      color="primary"
                    />
                  }
                  label="Private Timeline"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isPrivate ? 
                    "Only approved members can view and contribute to this timeline." : 
                    "Anyone can view this timeline, but only members can contribute."}
                </Typography>
                
                <AnimatePresence>
                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Switching to private mode has a 10-day cooldown period before you can switch back.
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary">
                Save Changes
              </Button>
            </Box>
          </motion.div>
        </>
      )}
    </motion.div>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4 }}>
      {/* Community Dot Tabs - Always visible at the top */}
      <CommunityDotTabs 
        timelineId={id} 
      />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mt: 2, 
            borderRadius: 2,
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h5" component="h1">
                Admin Panel
              </Typography>
            </Box>
            
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Manage community timeline settings
            </Typography>
          </motion.div>
          
          <Divider sx={{ my: 2 }} />
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ mb: 3 }}
            TabIndicatorProps={{
              style: {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }
            }}
          >
            <Tab 
              label="Manage Members" 
              icon={<PeopleIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
            <Tab 
              label="Settings" 
              icon={<SettingsIcon />} 
              iconPosition="start"
              sx={{ 
                transition: 'all 0.3s ease',
                minHeight: 48,
                '&.Mui-selected': {
                  fontWeight: 'bold'
                }
              }}
            />
          </Tabs>
          
          <Box sx={{ p: 1 }}>
            <AnimatePresence mode="wait">
              {tabValue === 0 && <MemberManagementTab key="members" />}
              {tabValue === 1 && <SettingsTab key="settings" />}
            </AnimatePresence>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default AdminPanel;
