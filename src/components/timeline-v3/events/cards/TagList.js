import React, { useState, useEffect } from 'react';
import { Chip, Box, useTheme, Tooltip, Typography } from '@mui/material';
import { Label as TagIcon, People as CommunityIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import api from '../../../../utils/api';
import TimelineNameDisplay from '../../TimelineNameDisplay';

const TagList = ({ tags, associatedTimelines = [], removedTimelineIds = [] }) => {
  const theme = useTheme();
  // Seed timeline classification from associatedTimelines (optimistic, reduces flicker)
  const seedTimelineData = React.useMemo(() => {
    try {
      const seed = {};
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.tag_name || '');
          if (!tagName) return;
          // If this tag matches any associated community timeline by name, seed as community
          const match = (associatedTimelines || []).find((tl) => tl && tl.name && String(tl.name).toLowerCase() === String(tagName).toLowerCase() && (String(tl.type || tl.timeline_type).toLowerCase() === 'community'));
          if (match) {
            seed[tagName] = { id: match.id, type: 'community', visibility: match.visibility || 'public' };
            seed[String(tagName).toLowerCase()] = { id: match.id, type: 'community', visibility: match.visibility || 'public' };
          }
        });
      }
      return seed;
    } catch (_) {
      return {};
    }
  }, [tags, associatedTimelines]);

  const [timelineData, setTimelineData] = useState(seedTimelineData);
  
  // Build a case-insensitive set of currently associated community timeline names
  const associatedCommunityNames = React.useMemo(() => {
    try {
      const set = new Set();
      if (Array.isArray(associatedTimelines)) {
        associatedTimelines.forEach((tl) => {
          if (!tl || !tl.name) return;
          // Only track community timelines for validation
          const type = tl.type || tl.timeline_type || 'hashtag';
          if (String(type).toLowerCase() === 'community') {
            set.add(String(tl.name).toLowerCase());
          }
        });
      }
      return set;
    } catch (_) {
      return new Set();
    }
  }, [associatedTimelines]);
  
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
  
  // Fetch timeline data for tags that are not already seeded
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        // Extract unique tag names that are not already known from seed
        const uniqueTags = new Set();
        tagsArray.forEach(tag => {
          const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.tag_name || '');
          if (!tagName) return;
          const hasSeed = !!(seedTimelineData[tagName] || seedTimelineData[String(tagName).toLowerCase()] || seedTimelineData[String(tagName).toUpperCase()]);
          if (!hasSeed) uniqueTags.add(tagName);
        });

        if (uniqueTags.size === 0) {
          // Nothing to fetch; ensure state is at least seed
          setTimelineData((prev) => ({ ...seedTimelineData, ...prev }));
          return;
        }

        // Fetch timeline data for each remaining unique tag
        const timelineInfo = {};
        for (const tagName of uniqueTags) {
          try {
            // Always query the API with uppercase tag name as that's how timelines are stored
            const response = await api.get(`/api/timeline-v3/name/${encodeURIComponent(tagName.toUpperCase())}`);
            if (response.data && response.data.id) {
              const type = response.data.timeline_type || 'hashtag';
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
            // If timeline not found, assume it's a regular hashtag
            timelineInfo[tagName] = { type: 'hashtag' };
            timelineInfo[tagName.toLowerCase()] = { type: 'hashtag' };
          }
        }
        // Merge seed + fetched info to avoid flicker for seeded entries
        setTimelineData((prev) => ({ ...seedTimelineData, ...prev, ...timelineInfo }));
      } catch (error) {
        console.error('Error fetching timeline data for tags:', error);
      }
    };
    
    fetchTimelineData();
  }, [tagsArray, seedTimelineData]);

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
        
        // Try to find the timeline info using different case variations
        let timelineInfo;
        if (timelineData[tagName]) {
          // Try exact match first
          timelineInfo = timelineData[tagName];
        } else if (timelineData[tagName.toLowerCase()]) {
          // Try lowercase
          timelineInfo = timelineData[tagName.toLowerCase()];
        } else if (timelineData[tagName.toUpperCase()]) {
          // Try uppercase
          timelineInfo = timelineData[tagName.toUpperCase()];
        } else {
          // Default to hashtag if not found
          timelineInfo = { type: 'hashtag' };
        }
        
        const isCommunityTimeline = timelineInfo.type === 'community';
        const tagNameLower = String(tagName).toLowerCase();
        let isCurrentlyAssociated = isCommunityTimeline
          ? associatedCommunityNames.has(tagNameLower)
          : false;
        
        // Override: if this community chip corresponds to a timeline ID explicitly marked as removed,
        // force it to be treated as not associated, regardless of associatedCommunityNames.
        if (isCommunityTimeline && Array.isArray(removedTimelineIds) && removedTimelineIds.length > 0) {
          const tlId = timelineInfo?.id;
          if (tlId && removedTimelineIds.includes(tlId)) {
            isCurrentlyAssociated = false;
          }
        }
        
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
              title={isCurrentlyAssociated ? "Community Timeline" : "No longer associated with this event"}
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
                      sx: { fontSize: '0.75rem', textDecoration: isCurrentlyAssociated ? 'none' : 'line-through' }
                    }}
                  />
                }
                size="small"
                onClick={isCurrentlyAssociated ? (e) => handleTagClick(e, tagName) : undefined}
                sx={{
                  height: '24px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(chipColor, isCurrentlyAssociated ? 0.2 : 0.08)
                    : alpha(chipColor, isCurrentlyAssociated ? 0.1 : 0.05),
                  color: theme.palette.mode === 'dark' 
                    ? theme.palette.common.white 
                    : chipColor,
                  border: `1px solid ${alpha(chipColor, isCurrentlyAssociated ? 0.3 : 0.15)}`,
                  borderRadius: '6px',
                  transition: theme.transitions.create(
                    ['background-color', 'box-shadow', 'transform'],
                    { duration: 200 }
                  ),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(chipColor, isCurrentlyAssociated ? 0.3 : 0.08)
                      : alpha(chipColor, isCurrentlyAssociated ? 0.2 : 0.05),
                    transform: isCurrentlyAssociated ? 'translateY(-1px)' : 'none',
                    boxShadow: isCurrentlyAssociated ? `0 4px 8px ${alpha(chipColor, 0.2)}` : 'none',
                    cursor: isCurrentlyAssociated ? 'pointer' : 'not-allowed',
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
                  opacity: isCurrentlyAssociated ? 1 : 0.6,
                  pointerEvents: isCurrentlyAssociated ? 'auto' : 'none',
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
