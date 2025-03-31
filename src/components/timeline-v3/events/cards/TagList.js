import React from 'react';
import { Chip, Box, useTheme } from '@mui/material';
import { Label as TagIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import api from '../../../../utils/api';

const TagList = ({ tags }) => {
  const theme = useTheme();
  
  // Add debugging to understand the tags data
  console.log('TagList received tags:', tags);
  
  if (!tags || tags.length === 0) {
    console.log('No tags to display');
    return null;
  }

  // Function to handle tag click - opens the respective timeline in a new tab
  const handleTagClick = async (e, tagName) => {
    e.stopPropagation(); // Prevent event bubbling to parent components
    
    try {
      // First try to get the timeline ID by name
      const timelineName = tagName.toUpperCase();
      const response = await api.get(`/api/timeline-v3/name/${encodeURIComponent(timelineName)}`);
      
      if (response.data && response.data.id) {
        // If we found the timeline, open it in a new tab
        window.open(`/timeline-v3/${response.data.id}`, '_blank');
      } else {
        console.error('Timeline not found for tag:', tagName);
      }
    } catch (error) {
      console.error('Error fetching timeline for tag:', tagName, error);
      // If there's an error, we can still try to open the timeline by name
      // This is a fallback in case the API call fails
      const timelineName = tagName.toUpperCase();
      window.open(`/timeline-v3/new?name=${encodeURIComponent(timelineName)}`, '_blank');
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 0.75, 
        flexWrap: 'wrap', 
        mt: 2,
      }}
    >
      {tags.map((tag, index) => {
        console.log(`Rendering tag ${index}:`, tag);
        
        // Generate a unique color based on the tag name
        const stringToColor = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          const hue = Math.abs(hash % 360);
          return `hsl(${hue}, 30%, 50%)`;
        };

        // Handle potential issues with tag format
        const tagName = typeof tag === 'string' ? tag : (tag && tag.name ? tag.name : 'unknown');
        const tagId = typeof tag === 'string' ? tag : (tag && tag.id ? tag.id : 'unknown-id');
        
        const tagColor = stringToColor(tagName);

        return (
          <Chip
            key={tagId}
            icon={
              <TagIcon 
                sx={{ 
                  fontSize: 14,
                  color: theme.palette.mode === 'dark' ? 'inherit' : `${tagColor}`,
                }} 
              />
            }
            label={tagName}
            size="small"
            onClick={(e) => handleTagClick(e, tagName)}
            sx={{
              height: '24px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha(tagColor, 0.2)
                : alpha(tagColor, 0.1),
              color: theme.palette.mode === 'dark' 
                ? theme.palette.common.white 
                : tagColor,
              border: 'none',
              borderRadius: '6px',
              transition: theme.transitions.create(
                ['background-color', 'box-shadow', 'transform'],
                { duration: 200 }
              ),
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(tagColor, 0.3)
                  : alpha(tagColor, 0.2),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 8px ${alpha(tagColor, 0.2)}`,
                cursor: 'pointer',
              },
              '& .MuiChip-label': {
                px: 1,
                fontSize: '0.75rem',
                fontWeight: 500,
              },
              '& .MuiChip-icon': {
                mr: 0.5,
                ml: 0.5,
              },
            }}
          />
        );
      })}
    </Box>
  );
};

export default TagList;
