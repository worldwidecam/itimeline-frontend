import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const TimelineHeader = ({
  timelineInfo,
  zoomLevel,
  setZoomLevel,
  isPresentVisible,
  snapToPresent,
  user,
  theme,
  id,
  navigate
}) => {
  return (
    <>
      <Box my={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            <Box component="span" sx={{ 
              fontWeight: 'bold',
              color: theme.palette.mode === 'light' ? 'primary.main' : '#ce93d8',
              mr: 1
            }}>
              #
            </Box>
            {timelineInfo?.name || "new timeline"}
          </Typography>
          {!isPresentVisible && (
            <Button
              variant="outlined"
              size="small"
              onClick={snapToPresent}
              startIcon={<NavigateNextIcon sx={{ transform: 'rotate(-90deg)' }} />}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                ml: 2
              }}
            >
              Return to Present
            </Button>
          )}
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Timeline View
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ 
              display: 'flex', 
              bgcolor: theme.palette.mode === 'light' ? 'background.paper' : '#2c1b47',
              borderRadius: '20px',
              padding: '4px',
              border: theme.palette.mode === 'light' 
                ? `1px solid ${theme.palette.primary.main}` 
                : `1px solid #ce93d8`
            }}>
              {['day', 'week', 'month', 'year'].map((level) => (
                <Button
                  key={level}
                  size="small"
                  onClick={() => setZoomLevel(level)}
                  sx={{
                    minWidth: '60px',
                    color: zoomLevel === level ? '#fff' : theme.palette.mode === 'light' ? 'primary.main' : '#ce93d8',
                    backgroundColor: zoomLevel === level ? theme.palette.mode === 'light' ? 'primary.main' : '#9c27b0' : 'transparent',
                    borderRadius: '16px',
                    textTransform: 'capitalize',
                    '&:hover': {
                      backgroundColor: zoomLevel === level ? theme.palette.mode === 'light' ? 'primary.main' : '#9c27b0' : 'rgba(156, 39, 176, 0.1)'
                    }
                  }}
                >
                  {level}
                </Button>
              ))}
            </Box>
            {user ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/timeline/${id}/event/create`)}
              >
                Create Event
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/login"
                sx={{ color: '#fff' }}
              >
                Login to Create Event
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default TimelineHeader;
