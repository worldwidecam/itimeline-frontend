import React from 'react';
import { Box, Container, useTheme } from '@mui/material';
import TimelinePosts from '../TimelinePosts';

const TimelinePostsSection = ({ timelineId }) => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        backgroundColor: theme.palette.mode === 'light' 
          ? 'background.default' 
          : '#121212', 
        py: 4 
      }}
    >
      <Container maxWidth="lg">
        <TimelinePosts timelineId={timelineId} />
      </Container>
    </Box>
  );
};

export default TimelinePostsSection;
