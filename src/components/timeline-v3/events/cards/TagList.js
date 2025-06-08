import React, { useState, useEffect } from 'react';
import { Chip, Box, useTheme, Tooltip, Typography } from '@mui/material';
import { Label as TagIcon, People as CommunityIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import api from '../../../../utils/api';
import TimelineNameDisplay from '../../TimelineNameDisplay';

const TagList = ({ tags }) => {
  const theme = useTheme();
  const [timelineData, setTimelineData] = useState({});
  
  // Handle various potential issues with tags data
  if (!tags) {
    return null;
  }
  
  // Ensure tags is an array
  const tagsArray = Array.isArray(tags) ? tags : 
                   (typeof tags === 'string' ? [tags] : 
                   (tags && typeof tags === 'object' ? [tags] : []));
  
  if (tagsArray.length === 0) {
    return null;
  }
  
  // Fetch timeline data for all tags when component mounts
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        // Extract unique tag names
        const uniqueTags = new Set();
        tagsArray.forEach(tag => {
          // Extract tag name from different possible formats
          const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.tag_name || '');
          // Store the original tag name for reference
          if (tagName) uniqueTags.add(tagName);
        });
        
        console.log('Unique tags to fetch:', Array.from(uniqueTags));
        
        // Fetch timeline data for each unique tag
        const timelineInfo = {};
        for (const tagName of uniqueTags) {
          try {
            console.log(`Fetching timeline data for tag: ${tagName}`);
            // Always query the API with uppercase tag name as that's how timelines are stored
            const response = await api.get(`/api/timeline-v3/name/${encodeURIComponent(tagName.toUpperCase())}`);
            
            console.log(`API response for ${tagName}:`, response.data);
            
            if (response.data && response.data.id) {
              // Log the raw timeline_type value from the API
              console.log(`Raw timeline_type for ${tagName}:`, response.data.timeline_type);
              
              const type = response.data.timeline_type || 'hashtag';
              console.log(`Determined type for ${tagName}:`, type);
              console.log(`Is type === 'community'?`, type === 'community');
              console.log(`Found timeline for ${tagName}:`, {
                id: response.data.id,
                type: type,
                visibility: response.data.visibility || 'public'
              });
              
              // Store the timeline info using both original case and lowercase versions
              // This ensures we can look it up regardless of case
              timelineInfo[tagName] = {
                id: response.data.id,
                type: type,
                visibility: response.data.visibility || 'public'
              };
              
              // Also store with lowercase key for case-insensitive lookup
              timelineInfo[tagName.toLowerCase()] = {
                id: response.data.id,
                type: type,
                visibility: response.data.visibility || 'public'
              };
            }
          } catch (error) {
            console.log(`No timeline found for tag: ${tagName}, assuming hashtag`);
            // If timeline not found, assume it's a regular hashtag
            timelineInfo[tagName] = { type: 'hashtag' };
            timelineInfo[tagName.toLowerCase()] = { type: 'hashtag' };
          }
        }
        
        console.log('Final timeline data:', timelineInfo);
        setTimelineData(timelineInfo);
      } catch (error) {
        console.error('Error fetching timeline data for tags:', error);
      }
    };
    
    fetchTimelineData();
  }, [tagsArray]);

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
      {tagsArray.map((tag, index) => {
        // Handle different tag formats
        let tagName, tagId;
        
        if (typeof tag === 'string') {
          tagName = tag;
          tagId = tag;
        } else if (tag && typeof tag === 'object') {
          tagName = tag.name || tag.tag_name || '';
          tagId = tag.id || tag.tag_id || `tag-${index}`;
        } else {
          // Skip invalid tags
          return null;
        }
        
        // Skip empty tag names
        if (!tagName) {
          return null;
        }
        
        // Get timeline info for this tag - try multiple ways to look it up
        console.log(`Rendering tag: ${tagName}`);
        console.log('Available timeline data keys:', Object.keys(timelineData));
        
        // Try to find the timeline info using different case variations
        let timelineInfo;
        if (timelineData[tagName]) {
          // Try exact match first
          timelineInfo = timelineData[tagName];
          console.log(`Found timeline info for exact match: ${tagName}`);
        } else if (timelineData[tagName.toLowerCase()]) {
          // Try lowercase
          timelineInfo = timelineData[tagName.toLowerCase()];
          console.log(`Found timeline info for lowercase: ${tagName.toLowerCase()}`);
        } else if (timelineData[tagName.toUpperCase()]) {
          // Try uppercase
          timelineInfo = timelineData[tagName.toUpperCase()];
          console.log(`Found timeline info for uppercase: ${tagName.toUpperCase()}`);
        } else {
          // Default to hashtag if not found
          timelineInfo = { type: 'hashtag' };
          console.log(`No timeline info found for ${tagName}, defaulting to hashtag`);
        }
        
        console.log(`Timeline info for ${tagName}:`, timelineInfo);
        const isCommunityTimeline = timelineInfo.type === 'community';
        console.log(`Is ${tagName} a community timeline?`, isCommunityTimeline);
        
        // Generate a unique color based on the tag name
        const stringToColor = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          const hue = Math.abs(hash % 360);
          return `hsl(${hue}, 30%, 50%)`;
        };
        
        const tagColor = stringToColor(tagName);
        
        // Different styling for community vs hashtag timelines
        const communityColor = theme.palette.secondary.main;
        const chipColor = isCommunityTimeline ? communityColor : tagColor;
        
        // Render different chip based on timeline type
        if (isCommunityTimeline) {
          return (
            <Tooltip 
              key={`${tagId}-${index}`}
              title="Community Timeline" 
              arrow
            >
              <Chip
                icon={
                  <CommunityIcon 
                    sx={{ 
                      fontSize: 14,
                      color: theme.palette.mode === 'dark' ? 'inherit' : chipColor,
                    }} 
                  />
                }
                label={
                  <TimelineNameDisplay
                    name={tagName}
                    type="community"
                    visibility={timelineInfo.visibility || 'public'}
                    typographyProps={{
                      variant: 'body2',
                      sx: { fontSize: '0.75rem' }
                    }}
                  />
                }
                size="small"
                onClick={(e) => handleTagClick(e, tagName)}
                sx={{
                  height: '24px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(chipColor, 0.2)
                    : alpha(chipColor, 0.1),
                  color: theme.palette.mode === 'dark' 
                    ? theme.palette.common.white 
                    : chipColor,
                  border: `1px solid ${alpha(chipColor, 0.3)}`,
                  borderRadius: '6px',
                  transition: theme.transitions.create(
                    ['background-color', 'box-shadow', 'transform'],
                    { duration: 200 }
                  ),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(chipColor, 0.3)
                      : alpha(chipColor, 0.2),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 8px ${alpha(chipColor, 0.2)}`,
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
            </Tooltip>
          );
        } else {
          // Standard hashtag timeline chip
          return (
            <Tooltip 
              key={`${tagId}-${index}`}
              title="Hashtag Timeline" 
              arrow
            >
              <Chip
                icon={
                  <TagIcon 
                    sx={{ 
                      fontSize: 14,
                      color: theme.palette.mode === 'dark' ? 'inherit' : chipColor,
                    }} 
                  />
                }
                label={tagName}
                size="small"
                onClick={(e) => handleTagClick(e, tagName)}
                sx={{
                  height: '24px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(chipColor, 0.2)
                    : alpha(chipColor, 0.1),
                  color: theme.palette.mode === 'dark' 
                    ? theme.palette.common.white 
                    : chipColor,
                  border: 'none',
                  borderRadius: '6px',
                  transition: theme.transitions.create(
                    ['background-color', 'box-shadow', 'transform'],
                    { duration: 200 }
                  ),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(chipColor, 0.3)
                      : alpha(chipColor, 0.2),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 8px ${alpha(chipColor, 0.2)}`,
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
            </Tooltip>
          );
        }
      })}
    </Box>
  );
};

export default TagList;
