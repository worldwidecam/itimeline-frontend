import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Chip, Tooltip, useTheme } from '@mui/material';
import { People as CommunityIcon, FavoriteBorder as HeartIcon, Lock as LockIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import api from '../../../../utils/api';
import HashtagIcon from '../../../common/HashtagIcon';

const EventCardChipsRow = ({ tags, associatedTimelines = [], removedTimelineIds = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname.startsWith('/home');

  // Normalize removed IDs into a Set for quick lookup
  const removedIdsSet = useMemo(() => new Set(removedTimelineIds || []), [removedTimelineIds]);

  // Derive communities and personals from associatedTimelines
  const { communityNamesSet, communitiesCount, personalsCount } = useMemo(() => {
    const communityNames = new Set();
    let communityCounter = 0;
    let personalCounter = 0;

    if (Array.isArray(associatedTimelines)) {
      associatedTimelines.forEach((tl) => {
        if (!tl || !tl.id) return;
        if (removedIdsSet.has(tl.id)) return;

        const type = (tl.type || tl.timeline_type || 'hashtag').toLowerCase();
        const name = (tl.name || '').toString();
        if (!name) return;

        if (type === 'community') {
          communityCounter += 1;
          communityNames.add(name.toLowerCase());
        } else if (type === 'personal') {
          personalCounter += 1;
        }
      });
    }

    return {
      communityNamesSet: communityNames,
      communitiesCount: communityCounter,
      personalsCount: personalCounter,
    };
  }, [associatedTimelines, removedIdsSet]);

  // Normalize tags array
  const tagsArray = useMemo(() => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return [tags];
    if (typeof tags === 'object') return [tags];
    return [];
  }, [tags]);

  // Derive hashtag tags. Under V2 semantics, hashtag chips should be shown even when
  // a community timeline shares the same base name, so we no longer filter them out
  // based on communityNamesSet.
  const hashtagTags = useMemo(() => {
    const results = [];
    tagsArray.forEach((tag) => {
      const tagName = typeof tag === 'string'
        ? tag
        : (tag?.name || tag?.tag_name || '');
      if (!tagName) return;
      results.push(tagName);
    });
    return results;
  }, [tagsArray]);

  if (hashtagTags.length === 0 && communitiesCount === 0 && personalsCount === 0) {
    return null;
  }

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

  const handleTagClick = async (e, tagName) => {
    e.stopPropagation();
    const openTimelineRoute = (route) => {
      if (!route) return;
      if (isHomePage) {
        navigate(route);
        return;
      }
      window.open(route, '_blank');
    };

    try {
      // Strip any leading # so we resolve to the canonical hashtag timeline name
      const baseName = (tagName || '').replace(/^#+/, '');
      const slug = baseName.toUpperCase();
      const response = await api.get(`/api/v1/timelines/by-slug/${encodeURIComponent(slug)}`);
      if (response.data && response.data.id) {
        openTimelineRoute(`/timeline-v3/${response.data.id}`);
      } else {
        openTimelineRoute(`/timeline-v3/new?name=${encodeURIComponent(slug)}`);
      }
    } catch (error) {
      console.error('Error fetching timeline for tag:', tagName, error);
      const baseName = (tagName || '').replace(/^#+/, '');
      const fallbackName = baseName.toUpperCase();
      openTimelineRoute(`/timeline-v3/new?name=${encodeURIComponent(fallbackName)}`);
    }
  };

  // Composite icon for personals (heart outline with small lock)
  const PersonalIcon = () => (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <HeartIcon sx={{ fontSize: 16 }} />
      <LockIcon
        sx={{
          fontSize: 10,
          position: 'absolute',
          bottom: -1,
          right: -1,
        }}
      />
    </Box>
  );

  const getMedalColors = (index, isDarkMode) => {
    if (index === 0) {
      // Gold: Brilliant, glowing sunlit yellow-gold
      return {
        bg: isDarkMode ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.18)',
        text: isDarkMode ? '#FFE066' : '#A37D00',
        border: isDarkMode ? 'rgba(255, 215, 0, 0.4)' : 'rgba(163, 125, 0, 0.35)',
      };
    }
    if (index === 1) {
      // Silver: Sleek, clean polished slate-silver
      return {
        bg: isDarkMode ? 'rgba(226, 232, 240, 0.15)' : 'rgba(148, 163, 184, 0.15)',
        text: isDarkMode ? '#F1F5F9' : '#475569',
        border: isDarkMode ? 'rgba(226, 232, 240, 0.4)' : 'rgba(71, 85, 105, 0.4)',
      };
    }
    if (index === 2) {
      // Bronze: Vibrant, fiery metallic copper-orange (highly distinct from Gold)
      return {
        bg: isDarkMode ? 'rgba(205, 127, 50, 0.15)' : 'rgba(249, 115, 22, 0.15)',
        text: isDarkMode ? '#FFB077' : '#D84B06',
        border: isDarkMode ? 'rgba(205, 127, 50, 0.4)' : 'rgba(216, 75, 6, 0.35)',
      };
    }
    return null;
  };

  const renderHashtagChips = () => {
    if (!hashtagTags.length) return null;

    const visible = hashtagTags.slice(0, 3);
    const isDarkMode = theme.palette.mode === 'dark';

    return (
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {visible.map((tagName, index) => {
          const medalColors = getMedalColors(index, isDarkMode);
          const tagColor = medalColors ? medalColors.text : stringToColor(tagName, isDarkMode);
          const bg = medalColors ? medalColors.bg : (isDarkMode ? alpha(tagColor, 0.15) : alpha(tagColor, 0.08));
          const border = medalColors ? medalColors.border : alpha(tagColor, 0.25);

          return (
            <Tooltip key={`${tagName}-${index}`} title="Hashtag Timeline" arrow>
              <Chip
                icon={(
                  <HashtagIcon
                    fontSize="small"
                    sx={{
                      color: tagColor,
                      marginLeft: 0,
                    }}
                  />
                )}
                label={tagName}
                size="small"
                onClick={(e) => handleTagClick(e, tagName)}
                sx={{
                  height: 24,
                  backgroundColor: bg,
                  color: tagColor,
                  border: `1px solid ${border}`,
                  borderRadius: 1.5,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem',
                    fontWeight: medalColors ? 600 : 500,
                  },
                  '& .MuiChip-icon': {
                    mr: 0.5,
                    ml: 0.5,
                  },
                  '&:hover': {
                    backgroundColor: medalColors 
                      ? (isDarkMode ? alpha(tagColor, 0.25) : alpha(tagColor, 0.14))
                      : (isDarkMode ? alpha(tagColor, 0.25) : alpha(tagColor, 0.16)),
                    borderColor: medalColors ? border : alpha(tagColor, 0.45),
                    cursor: 'pointer',
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  const renderCommunitiesPill = () => {
    if (!communitiesCount) return null;

    const chipColor = theme.palette.secondary.main;

    return (
      <Chip
        icon={(
          <CommunityIcon
            sx={{
              fontSize: 16,
              color: theme.palette.mode === 'dark' ? 'inherit' : chipColor,
            }}
          />
        )}
        label="Communities"
        size="small"
        sx={{
          height: 24,
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(chipColor, 0.2)
            : alpha(chipColor, 0.08),
          color: theme.palette.mode === 'dark'
            ? theme.palette.common.white
            : chipColor,
          borderRadius: 1.5,
          position: 'relative',
          '& .MuiChip-label': {
            px: 1.5,
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'Lobster, cursive',
          },
          '& .MuiChip-icon': {
            mr: 0.5,
            ml: 0.5,
          },
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(chipColor, 0.25)
              : alpha(chipColor, 0.12),
            cursor: 'default',
          },
          '&::after': {
            content: '"' + communitiesCount + '"',
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 14,
            height: 14,
            borderRadius: '999px',
            backgroundColor: chipColor,
            color: theme.palette.common.white,
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          },
        }}
      />
    );
  };

  const renderPersonalsPill = () => {
    if (!personalsCount) return null;

    const chipColor = theme.palette.primary.main;

    return (
      <Chip
        icon={<PersonalIcon />}
        label="Personals"
        size="small"
        sx={{
          height: 24,
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(chipColor, 0.2)
            : alpha(chipColor, 0.08),
          color: theme.palette.mode === 'dark'
            ? theme.palette.common.white
            : chipColor,
          borderRadius: 1.5,
          position: 'relative',
          '& .MuiChip-label': {
            px: 1.5,
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'Lobster, cursive',
          },
          '& .MuiChip-icon': {
            mr: 0.5,
            ml: 0.5,
          },
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(chipColor, 0.25)
              : alpha(chipColor, 0.12),
            cursor: 'default',
          },
          '&::after': {
            content: '"' + personalsCount + '"',
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 14,
            height: 14,
            borderRadius: '999px',
            backgroundColor: chipColor,
            color: theme.palette.common.white,
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          },
        }}
      />
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
        mt: 2,
      }}
    >
      <Box sx={{ flex: { xs: 'none', sm: 1 }, minWidth: 0, width: '100%' }}>{renderHashtagChips()}</Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          ml: { xs: 0, sm: 1 },
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {renderCommunitiesPill()}
        {renderPersonalsPill()}
      </Box>
    </Box>
  );
};

export default EventCardChipsRow;
