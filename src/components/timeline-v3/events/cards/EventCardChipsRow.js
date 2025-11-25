import React, { useMemo } from 'react';
import { Box, Chip, Tooltip, useTheme } from '@mui/material';
import { Label as TagIcon, People as CommunityIcon, FavoriteBorder as HeartIcon, Lock as LockIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import api from '../../../../utils/api';

const EventCardChipsRow = ({ tags, associatedTimelines = [], removedTimelineIds = [] }) => {
  const theme = useTheme();

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

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 30%, 50%)`;
  };

  const handleTagClick = async (e, tagName) => {
    e.stopPropagation();
    try {
      // Strip any leading # so we resolve to the canonical hashtag timeline name
      const baseName = (tagName || '').replace(/^#+/, '');
      const timelineName = baseName.toUpperCase();
      const response = await api.get(`/api/timeline-v3/name/${encodeURIComponent(timelineName)}`);
      if (response.data && response.data.id) {
        window.open(`/timeline-v3/${response.data.id}`, '_blank');
      } else {
        const fallbackName = timelineName;
        window.open(`/timeline-v3/new?name=${encodeURIComponent(fallbackName)}`, '_blank');
      }
    } catch (error) {
      console.error('Error fetching timeline for tag:', tagName, error);
      const baseName = (tagName || '').replace(/^#+/, '');
      const fallbackName = baseName.toUpperCase();
      window.open(`/timeline-v3/new?name=${encodeURIComponent(fallbackName)}`, '_blank');
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

  const renderHashtagChips = () => {
    if (!hashtagTags.length) return null;

    const visible = hashtagTags.slice(0, 5);
    const extraCount = hashtagTags.length > 5 ? hashtagTags.length - 5 : 0;

    return (
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {visible.map((tagName, index) => {
          const tagColor = stringToColor(tagName);
          return (
            <Tooltip key={`${tagName}-${index}`} title="Hashtag Timeline" arrow>
              <Chip
                icon={(
                  <TagIcon
                    sx={{
                      fontSize: 14,
                      color: theme.palette.mode === 'dark' ? 'inherit' : tagColor,
                    }}
                  />
                )}
                label={tagName}
                size="small"
                onClick={(e) => handleTagClick(e, tagName)}
                sx={{
                  height: 24,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(tagColor, 0.2)
                    : alpha(tagColor, 0.1),
                  color: theme.palette.mode === 'dark'
                    ? theme.palette.common.white
                    : tagColor,
                  borderRadius: 1.5,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  },
                  '& .MuiChip-icon': {
                    mr: 0.5,
                    ml: 0.5,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(tagColor, 0.3)
                      : alpha(tagColor, 0.2),
                    cursor: 'pointer',
                  },
                }}
              />
            </Tooltip>
          );
        })}
        {extraCount > 0 && (
          <Chip
            label={`+${extraCount}`}
            size="small"
            sx={{
              height: 24,
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.2)
                : alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.mode === 'dark'
                ? theme.palette.common.white
                : theme.palette.primary.main,
              borderRadius: 1.5,
              '& .MuiChip-label': {
                px: 1,
                fontSize: '0.75rem',
                fontWeight: 500,
              },
            }}
          />
        )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        mt: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{renderHashtagChips()}</Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          ml: 1,
          flexShrink: 0,
        }}
      >
        {renderCommunitiesPill()}
        {renderPersonalsPill()}
      </Box>
    </Box>
  );
};

export default EventCardChipsRow;
