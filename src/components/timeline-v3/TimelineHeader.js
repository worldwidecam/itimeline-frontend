import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const TimelineHeader = ({
  timelineInfo,
  zoomLevel,
  setZoomLevel,
  isReferenceVisible,
  snapToReference,
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
            {timelineInfo?.name || "Timeline V3"}
          </Typography>
          {!isReferenceVisible && (
            <Button
              variant="outlined"
              size="small"
              onClick={snapToReference}
              startIcon={<NavigateNextIcon sx={{ transform: 'rotate(-90deg)' }} />}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                ml: 2
              }}
            >
              Return to Reference
            </Button>
          )}
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
          <Box>
            <Typography variant="body1" color="text.secondary">
              Coordinate View
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Reference point is position 0
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1 
            }}>
              {['Day', 'Week', 'Month', 'Year'].map((level) => (
                <Button
                  key={level}
                  variant={zoomLevel === level.toLowerCase() ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setZoomLevel(level.toLowerCase())}
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    minWidth: '80px',
                    bgcolor: zoomLevel === level.toLowerCase() ? 'primary.main' : 'transparent',
                    color: zoomLevel === level.toLowerCase() ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: zoomLevel === level.toLowerCase() ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  {level}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default TimelineHeader;
