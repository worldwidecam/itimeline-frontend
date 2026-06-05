import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, Box, useTheme, Tooltip, Typography } from '@mui/material';
import { Label as TagIcon, People as CommunityIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import api from '../../../../utils/api';
import TimelineNameDisplay from '../../TimelineNameDisplay';

const TagList = ({ tags, associatedTimelines = [], removedTimelineIds = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
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
            // Use slug-based lookup for timeline by tag name
            const slug = tagName.toUpperCase();
            const response = await api.get(`/api/v1/timelines/by-slug/${encodeURIComponent(slug)}`);
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

  // Function to handle tag click - opens the respective timeline in same tab by default
  const handleTagClick = async (e, tagName) => {
    e.stopPropagation(); // Prevent event bubbling to parent components
    
    try {
      // First try to get the timeline ID by slug
      const slug = tagName.toUpperCase();
      const response = await api.get(`/api/v1/timelines/by-slug/${encodeURIComponent(slug)}`);
      
      const route = response.data && response.data.id
        ? `/timeline-v3/${response.data.id}`
        : `/timeline-v3/new?name=${encodeURIComponent(slug)}`;
      
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
        window.open(route, '_blank');
      } else {
        navigate(route);
      }
    } catch (error) {
      console.error('Error fetching timeline for tag:', tagName, error);
      const timelineName = tagName.toUpperCase();
      const route = `/timeline-v3/new?name=${encodeURIComponent(timelineName)}`;
      
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
        window.open(route, '_blank');
      } else {
        navigate(route);
      }
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
        const hslToHex = (h, s, l) => {
          l /= 100;
          const a = (s * Math.min(l, 1 - l)) / 100;
          const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
          };
          return `#${f(0)}${f(8)}${f(4)}`;
        };

        const stringToColor = (str, isDarkMode) => {
          if (typeof str !== 'string') str = String(str || '');
          let hash = 0;
          for (let i = 0; i < str.length; i += 1) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          // Multiply by 137 to perfectly scatter adjacent hashes far apart in the hue space!
          const hue = Math.abs((hash * 137) % 360);
          // Glowing text on dark mode (85% saturation, 65% lightness), high contrast text on light mode (75% saturation, 40% lightness)
          const s = isDarkMode ? 85 : 75;
          const l = isDarkMode ? 65 : 40;
          return hslToHex(hue, s, l);
        };

        const getMedalColors = (idx, isDarkMode) => {
          if (idx === 0) {
            // Gold: Brilliant, glowing sunlit yellow-gold
            return {
              bg: isDarkMode ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.18)',
              text: isDarkMode ? '#FFE066' : '#A37D00',
              border: isDarkMode ? 'rgba(255, 215, 0, 0.4)' : 'rgba(163, 125, 0, 0.35)',
            };
          }
          if (idx === 1) {
            // Silver: Sleek, clean polished slate-silver
            return {
              bg: isDarkMode ? 'rgba(226, 232, 240, 0.15)' : 'rgba(148, 163, 184, 0.15)',
              text: isDarkMode ? '#F1F5F9' : '#475569',
              border: isDarkMode ? 'rgba(226, 232, 240, 0.4)' : 'rgba(71, 85, 105, 0.4)',
            };
          }
          if (idx === 2) {
            // Bronze: Vibrant, fiery metallic copper-orange (highly distinct from Gold)
            return {
              bg: isDarkMode ? 'rgba(205, 127, 50, 0.15)' : 'rgba(249, 115, 22, 0.15)',
              text: isDarkMode ? '#FFB077' : '#D84B06',
              border: isDarkMode ? 'rgba(205, 127, 50, 0.4)' : 'rgba(216, 75, 6, 0.35)',
            };
          }
          return null;
        };
        
        const isDarkMode = theme.palette.mode === 'dark';
        const medalColors = getMedalColors(index, isDarkMode);
        const tagColor = medalColors ? medalColors.text : stringToColor(tagName, isDarkMode);
        
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
                    name={tagName ? tagName.charAt(0).toUpperCase() + tagName.slice(1) : ''}
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
          const bg = medalColors ? medalColors.bg : (isDarkMode ? alpha(chipColor, 0.15) : alpha(chipColor, 0.08));
          const border = medalColors ? medalColors.border : alpha(chipColor, 0.25);
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
                      color: chipColor,
                    }} 
                  />
                }
                label={tagName ? tagName.charAt(0).toUpperCase() + tagName.slice(1) : ''}
                size="small"
                onClick={(e) => handleTagClick(e, tagName)}
                sx={{
                  height: '24px',
                  backgroundColor: bg,
                  color: chipColor,
                  border: `1px solid ${border}`,
                  borderRadius: '6px',
                  transition: theme.transitions.create(
                    ['background-color', 'box-shadow', 'transform'],
                    { duration: 200 }
                  ),
                  '&:hover': {
                    backgroundColor: medalColors 
                      ? (isDarkMode ? alpha(chipColor, 0.25) : alpha(chipColor, 0.14))
                      : (isDarkMode ? alpha(chipColor, 0.25) : alpha(chipColor, 0.16)),
                    borderColor: medalColors ? border : alpha(chipColor, 0.45),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 8px ${alpha(chipColor, 0.2)}`,
                    cursor: 'pointer',
                  },
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem',
                    fontWeight: medalColors ? 600 : 500,
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
