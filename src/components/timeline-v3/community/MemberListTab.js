import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Divider
} from '@mui/material';
import { useParams } from 'react-router-dom';
import CommunityDotTabs from './CommunityDotTabs';

const MemberListTab = () => {
  const { id } = useParams();

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
        <Typography variant="h5" component="h1" gutterBottom>
          Community Members
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Members of this community timeline
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            This is a placeholder for the Members tab content.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            In the future, this will display a list of community members with their roles and join dates.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default MemberListTab;
