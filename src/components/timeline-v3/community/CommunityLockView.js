import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * CommunityLockView
 * Simple lock/CTA view shown when user lacks membership or role for a community timeline page.
 * Props:
 * - title: string (optional)
 * - description: string (optional)
 * - timelineId: string | number (optional; if not provided, will read from route param `id`)
 */
const CommunityLockView = ({ title = "Access restricted", description = "You're not a member of this community yet. Please request to join from the timeline page.", timelineId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = timelineId || params.id;

  const handleGoToTimeline = () => {
    if (id) navigate(`/timeline-v3/${id}`);
    else navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: 2,
        px: 3
      }}
    >
      <Alert icon={<LockIcon />} severity="info" sx={{ maxWidth: 700, width: '100%' }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body1">
          {description}
        </Typography>
      </Alert>

      <Button variant="contained" color="primary" onClick={handleGoToTimeline}>
        Go to timeline
      </Button>
    </Box>
  );
};

export default CommunityLockView;
