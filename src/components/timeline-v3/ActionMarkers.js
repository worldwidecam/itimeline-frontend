import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import calculateMarkerValue from './events/markerPosition';

const ActionMarkers = ({
  actions = [],
  timelineOffset = 0,
  markerSpacing = 100,
  viewMode = 'position',
  theme,
  workspaceWidth = null,
  onActionClick,
}) => {
  const currentTheme = useTheme();
  
  if (viewMode === 'position' || !actions || actions.length === 0) return null;

  // 1. Filter out actions without due_date, inactive, or past due
  const now = new Date();
  const futureActions = actions.filter((action) => {
    if (!action?.due_date || action?.is_active === false) return false;
    const dueDate = new Date(action.due_date);
    return !isNaN(dueDate.getTime()) && dueDate >= now;
  });

  if (futureActions.length === 0) return null;

  // 2. Compute exact marker value coordinate for each action
  const positionedActions = futureActions.map((action) => {
    const val = calculateMarkerValue(action.due_date, viewMode);
    return { ...action, markerValue: val };
  });

  // 3. Handle overlap prevention (Gold > Silver > Bronze) within 30px threshold
  const tierPriority = { gold: 3, silver: 2, bronze: 1 };
  const sortedByPriority = [...positionedActions].sort((a, b) => {
    const pA = tierPriority[a.action_type] || 0;
    const pB = tierPriority[b.action_type] || 0;
    return pB - pA; // High priority first
  });

  const visibleActions = [];
  sortedByPriority.forEach((action) => {
    const x = action.markerValue * markerSpacing;
    const isOverlapping = visibleActions.some(
      (v) => Math.abs(v.markerValue * markerSpacing - x) < 30
    );
    if (!isOverlapping) {
      visibleActions.push(action);
    }
  });

  const centerX = (workspaceWidth || window.innerWidth) / 2;

  const medalEmojis = {
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
  };

  const actionColors = {
    gold: '#d4af37',
    silver: '#9e9e9e',
    bronze: '#cd7f32',
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        transform: `translateX(${timelineOffset}px)`,
        transition: 'transform 0.1s ease-out',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 1210, // Higher than regular TimeMarkers (1200) so they stand out
      }}
    >
      {visibleActions.map((action) => {
        const color = actionColors[action.action_type] || '#64748b';
        const medal = medalEmojis[action.action_type] || '🚩';
        const displayTitle = action.title
          ? action.title.length > 20
            ? `${action.title.substring(0, 18)}...`
            : action.title
          : 'Action';

        return (
          <Box
            key={`action-marker-${action.id}`}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={() => {
              if (onActionClick) {
                onActionClick(action);
              }
            }}
            sx={{
              position: 'absolute',
              left: `${centerX + action.markerValue * markerSpacing}px`,
              display: 'flex',
              flexDirection: 'column-reverse', // stem is at the bottom, emoji/label bubble floats above
              alignItems: 'center',
              transform: 'translateX(-50%)',
              bottom: '25%', // sitting exactly on the TimelineBar top: '75%' baseline
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: 10,
              '&:hover': {
                '& .action-stem': {
                  height: '42px',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
                },
                '& .action-emoji-large': {
                  transform: 'scale(0.7) translateY(12px)',
                  opacity: 0,
                },
                '& .action-label-bubble': {
                  opacity: 1,
                  transform: 'scale(1) translateY(-6px)',
                  visibility: 'visible',
                },
              },
            }}
          >
            {/* Glowing Vertical Stem */}
            <Box
              className="action-stem"
              sx={{
                width: '3px',
                height: '35px',
                backgroundColor: color,
                borderRadius: '99px',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: `0 0 6px ${color}`,
              }}
            />

            {/* Resting state: double size medal emoji ONLY */}
            <Typography
              className="action-emoji-large"
              sx={{
                fontSize: '2rem', // Double size resting emoji
                lineHeight: 1,
                mb: 0.5,
                userSelect: 'none',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                opacity: 1,
              }}
            >
              {medal}
            </Typography>

            {/* Hover state: beautiful detailed card title bubble */}
            <Typography
              className="action-label-bubble"
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: '40px', // float above the stem
                fontWeight: 700,
                fontSize: '0.75rem',
                color: color,
                whiteSpace: 'nowrap',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                opacity: 0,
                visibility: 'hidden',
                transform: 'scale(0.8) translateY(12px)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                background: currentTheme.palette.mode === 'dark' ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.92)',
                border: `1px solid ${currentTheme.palette.divider}`,
                borderRadius: '8px',
                px: 1.15,
                py: 0.6,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
              }}
            >
              <span>{medal}</span>
              <span style={{ color: currentTheme.palette.text.primary }}>{displayTitle}</span>
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default ActionMarkers;
