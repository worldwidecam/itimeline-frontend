import React, { useMemo } from 'react';
import { Box, Tooltip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  People as CommunityIcon,
  FavoriteBorder as PersonalIcon,
} from '@mui/icons-material';
import HashtagIcon from '../../../common/HashtagIcon';

const normalizeTimelineType = (rawType = '') => {
  const normalized = String(rawType || '').trim().toLowerCase();
  if (normalized === 'community' || normalized === 'personal' || normalized === 'hashtag') {
    return normalized;
  }
  return '';
};

const resolveOriginTimeline = (event = {}) => {
  const timelineId = Number(event?.timeline_id || event?.origin_timeline_id || 0);

  let timelineName = String(
    event?.timeline_name
    || event?.origin_timeline_name
    || event?.timeline?.name
    || '',
  ).trim();

  let timelineType = normalizeTimelineType(
    event?.timeline_type
    || event?.origin_timeline_type
    || event?.timeline?.type
    || event?.timeline?.timeline_type,
  );

  const sourceAssociations = [];
  if (Array.isArray(event?.associated_timelines)) {
    sourceAssociations.push(...event.associated_timelines);
  }
  if (Array.isArray(event?.associatedTimelines)) {
    sourceAssociations.push(...event.associatedTimelines);
  }

  if (sourceAssociations.length > 0) {
    const ownerAssociation = sourceAssociations.find((timeline) => Number(timeline?.id || timeline?.timeline_id || 0) === timelineId);
    if (ownerAssociation) {
      if (!timelineName) {
        timelineName = String(ownerAssociation?.name || ownerAssociation?.timeline_name || '').trim();
      }
      if (!timelineType) {
        timelineType = normalizeTimelineType(ownerAssociation?.type || ownerAssociation?.timeline_type);
      }
    }
  }

  if (!timelineName) return null;

  if (!timelineType) {
    if (/^i-/i.test(timelineName)) timelineType = 'community';
    else if (/^my-/i.test(timelineName)) timelineType = 'personal';
    else timelineType = 'hashtag';
  }

  const baseName = String(timelineName)
    .replace(/^i-/i, '')
    .replace(/^my-/i, '')
    .replace(/^#+/, '')
    .replace(/'s\s+personal$/i, '')
    .replace(/\s+personal$/i, '')
    .trim();

  if (!baseName) return null;

  return {
    id: timelineId || null,
    type: timelineType,
    name: baseName,
    label: (timelineType === 'personal' && (event?.owner_username || event?.creator_username)) 
      ? (event?.owner_username || event?.creator_username) 
      : baseName,
  };
};

const EventOriginTimelineBadge = ({ event }) => {
  const theme = useTheme();
  const origin = useMemo(() => resolveOriginTimeline(event), [event]);

  if (!origin) return null;

  const accentColor = origin.type === 'community'
    ? theme.palette.secondary.main
    : (origin.type === 'personal' ? theme.palette.primary.main : theme.palette.success.main);

  const icon = origin.type === 'community'
    ? <CommunityIcon sx={{ fontSize: '1.02rem' }} />
    : (origin.type === 'personal'
      ? <PersonalIcon sx={{ fontSize: '1.02rem' }} />
      : <HashtagIcon sx={{ fontSize: '0.84rem' }} />);

  const backgroundColor = theme.palette.mode === 'dark'
    ? alpha(accentColor, 0.22)
    : alpha(accentColor, 0.12);

  const borderColor = theme.palette.mode === 'dark'
    ? alpha(accentColor, 0.52)
    : alpha(accentColor, 0.45);

  return (
    <Tooltip title={`Created on ${origin.type}: ${origin.name}`} arrow>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: '4px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          fontSize: '0.82rem',
          bgcolor: backgroundColor,
          border: `1px solid ${borderColor}`,
          color: accentColor,
          flexShrink: 0,
          maxWidth: { xs: 122, sm: 190 },
        }}
      >
        {icon}
        <Box
          component="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            lineHeight: 1.2,
          }}
        >
          {origin.label}
        </Box>
      </Box>
    </Tooltip>
  );
};

export default EventOriginTimelineBadge;
