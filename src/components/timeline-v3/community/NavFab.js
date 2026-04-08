import React from 'react';
import { Box, ClickAwayListener, Fab, Tooltip, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import EventIcon from '@mui/icons-material/Event';
import SvgIcon from '@mui/material/SvgIcon';

const TimelineMarkerIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M2.2 14H21.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M13.5 14V7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="13.5" cy="5" r="2.2" fill="currentColor" />
  </SvgIcon>
);

const NavFab = ({
  timelineId,
  pathname,
  expanded,
  onToggleExpanded,
  onCollapse,
  onNavigate,
  actions,
  showReport = false,
  onReport,
  showCreate = false,
  onCreate,
  canOpen = true,
  bottom = 32,
  right = 32,
  containerZIndex = 1500,
  mainTooltipClosed = 'Show Event Options',
  mainTooltipOpen = 'Hide Options',
  mainTooltipDisabled = 'Posting Restricted',
  createEmphasis = false,
  showMembersNav = true,
  showAdminNav = true,
  showMainFab = true,
  mainFabDisabled = false,
  mainFabSx,
  enableClickAway = true,
}) => {
  const theme = useTheme();

  if (!canOpen) {
    return null;
  }

  const normalizedPath = String(pathname || '');
  const isMembersPath = normalizedPath.includes('/members');
  const isAdminPath = normalizedPath.includes('/admin');
  const isTimelinePath = !isMembersPath && !isAdminPath;

  const compactCreateStep = createEmphasis ? 40 : 48;
  const miniStep = 58;
  const createToMiniBuffer = showCreate ? 14 : 0;

  const defaultActionItems = [];

  if (showCreate && typeof onCreate === 'function') {
    defaultActionItems.push({
      key: 'create',
      tooltip: 'Create Event',
      icon: <EventIcon />,
      onClick: onCreate,
      step: compactCreateStep,
      size: createEmphasis ? 'large' : 'medium',
      accent: {
        dark: '#69F0AE',
        light: '#00CFA1',
      },
    });
  }

  if (timelineId && typeof onNavigate === 'function' && !isTimelinePath) {
    defaultActionItems.push({
      key: 'timeline',
      tooltip: 'Go to Timeline',
      icon: <TimelineMarkerIcon />,
      onClick: () => onNavigate(`/timeline-v3/${timelineId}`),
      step: miniStep,
      size: 'medium',
      accent: {
        dark: '#4FC3F7',
        light: '#039BE5',
      },
    });
  }

  if (timelineId && typeof onNavigate === 'function' && showMembersNav && !isMembersPath) {
    defaultActionItems.push({
      key: 'members',
      tooltip: 'Go to Members',
      icon: <PeopleAltIcon />,
      onClick: () => onNavigate(`/timeline-v3/${timelineId}/members`),
      step: miniStep,
      size: 'medium',
      accent: {
        dark: '#FFD54F',
        light: '#F9A825',
      },
    });
  }

  if (timelineId && typeof onNavigate === 'function' && showAdminNav && !isAdminPath) {
    defaultActionItems.push({
      key: 'admin',
      tooltip: 'Go to Admin',
      icon: <SettingsIcon />,
      onClick: () => onNavigate(`/timeline-v3/${timelineId}/admin`),
      step: miniStep,
      size: 'medium',
      accent: {
        dark: '#CE93D8',
        light: '#AB47BC',
      },
    });
  }

  if (showReport && typeof onReport === 'function') {
    defaultActionItems.push({
      key: 'report',
      tooltip: 'Report Timeline',
      icon: <OutlinedFlagIcon />,
      onClick: onReport,
      step: miniStep,
      size: 'medium',
      accent: {
        dark: '#EF5350',
        light: '#D32F2F',
      },
    });
  }

  const actionItems = Array.isArray(actions) ? actions : defaultActionItems;

  let cumulativeBottom = 0;
  const positionedItems = actionItems
    .filter((item) => item && typeof item.onClick === 'function')
    .map((item, index) => {
      const step = Number(item.step) > 0 ? Number(item.step) : miniStep;
      cumulativeBottom += step;
      if (index === 1 && actionItems[0]?.key === 'create') {
        cumulativeBottom += createToMiniBuffer;
      }
      return {
        ...item,
        step,
        size: item.size || 'medium',
        accent: item.accent || { dark: '#94A3B8', light: '#64748B' },
        bottomOffset: cumulativeBottom,
        delay: typeof item.delay === 'number' ? item.delay : (0.05 + index * 0.03),
      };
    });

  const actionFabSx = (accent, delay) => ({
    bgcolor: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.82)' : 'rgba(255, 255, 255, 0.88)',
    border: `2px solid ${theme.palette.mode === 'dark' ? accent.dark : accent.light}`,
    color: theme.palette.mode === 'dark' ? accent.dark : accent.light,
    '&:hover': {
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(23, 31, 46, 0.9)' : 'rgba(255, 255, 255, 1)',
      boxShadow: theme.palette.mode === 'dark'
        ? `0 0 18px color-mix(in srgb, ${accent.dark} 60%, transparent)`
        : `0 0 18px color-mix(in srgb, ${accent.light} 50%, transparent)`,
    },
    boxShadow: theme.palette.mode === 'dark'
      ? `0 0 12px color-mix(in srgb, ${accent.dark} 46%, transparent)`
      : `0 0 12px color-mix(in srgb, ${accent.light} 35%, transparent)`,
    transform: expanded ? 'scale(1)' : 'scale(0.5)',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transitionDelay: expanded ? `${delay.toFixed(2)}s` : '0s',
  });

  const rootContent = (
    <Box
      sx={{
        position: 'fixed',
        right,
        bottom,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        zIndex: containerZIndex,
        transition: 'bottom 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
        {positionedItems.map((item) => (
          <Box
            key={item.key}
            sx={{
              position: 'absolute',
              bottom: expanded ? item.bottomOffset : 0,
              right: 0,
              opacity: expanded ? 1 : 0,
              pointerEvents: expanded ? 'auto' : 'none',
              transition: 'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
              transitionDelay: expanded ? `${item.delay.toFixed(2)}s` : '0s',
              zIndex: 1530,
            }}
          >
            <Tooltip title={item.tooltip || ''} placement="left">
              <Fab onClick={item.onClick} size={item.size} sx={actionFabSx(item.accent, item.delay)}>
                {item.icon}
              </Fab>
            </Tooltip>
          </Box>
        ))}
      </Box>

      {showMainFab ? (
        <Tooltip title={mainFabDisabled ? mainTooltipDisabled : (expanded ? mainTooltipOpen : mainTooltipClosed)}>
          <span>
            <Fab
              onClick={onToggleExpanded}
              disabled={mainFabDisabled}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.success.light,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.success.main,
                },
                boxShadow: 3,
                transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease, background-color 0.2s ease',
                zIndex: 1540,
                ...(mainFabSx || {}),
              }}
            >
              <AddIcon />
            </Fab>
          </span>
        </Tooltip>
      ) : null}
    </Box>
  );

  if (enableClickAway) {
    return <ClickAwayListener onClickAway={onCollapse}>{rootContent}</ClickAwayListener>;
  }

  return rootContent;
};

export default NavFab;
