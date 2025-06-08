import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useParams } from 'react-router-dom';
import CommunityDotTabs from './CommunityDotTabs';

const AdminPanel = () => {
  const { id } = useParams();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, pb: 4 }}>
      {/* Community Dot Tabs - Always visible at the top */}
      <CommunityDotTabs 
        timelineId={id} 
      />
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mt: 2, 
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
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
        
        <Divider sx={{ my: 2 }} />
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Manage Members" />
          <Tab label="Settings" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              This is a placeholder for the Member Management panel.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              In the future, this will allow adding, removing, and managing community members.
            </Typography>
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              This is a placeholder for the Timeline Settings panel.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              In the future, this will allow changing timeline visibility, name, and other settings.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminPanel;
