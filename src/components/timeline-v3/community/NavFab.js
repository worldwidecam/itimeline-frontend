import React from 'react';
import { Box, ClickAwayListener, Fab, Tooltip, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import EventIcon from '@mui/icons-material/Event';
import SvgIcon from '@mui/material/SvgIcon';
import TradingCard from '../../common/TradingCard';

export const TimelineMarkerIcon = (props) => (
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
  left = null,
  position = 'right',
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
  // TradingCard share panel — pass a config object to enable, null to omit
  tradingCard = null,
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
      const tooltipPlacement = position === 'left' ? 'right' : 'left';
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
        tooltipPlacement,
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

  // Auto-wire hover effects from class names so callers don't have to
  const tradingCardHoverSx = tradingCard ? {
    ...(tradingCard.imageClassName ? {
      [`&:hover .${tradingCard.imageClassName}`]: { filter: 'brightness(0.88) saturate(1.02)' },
    } : {}),
    ...(tradingCard.overlayClassName ? {
      [`&:hover .${tradingCard.overlayClassName}`]: { opacity: 1 },
    } : {}),
  } : {};

  const rootContent = (
    <Box
      sx={{
        position: 'fixed',
        ...(position === 'left' ? { left: left ?? 32 } : { right: right ?? 32 }),
        bottom,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        zIndex: containerZIndex,
        transition: 'bottom 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Relative wrapper — TradingCard positions itself absolutely against this */}
      <Box sx={{ position: 'relative' }}>
        {/* TradingCard share panel — slides left when FAB is expanded */}
        {tradingCard && (
          <TradingCard
            onActivate={tradingCard.onActivate}
            imageUrl={tradingCard.imageUrl}
            imageAlt={tradingCard.imageAlt}
            imageClassName={tradingCard.imageClassName}
            imageSx={tradingCard.imageSx}
            fallbackSx={tradingCard.fallbackSx}
            label={tradingCard.label}
            title={tradingCard.title}
            qrUrl={tradingCard.qrUrl}
            overlayClassName={tradingCard.overlayClassName}
            overlayText={tradingCard.overlayText || 'Tap to Share'}
            overlaySx={tradingCard.overlaySx}
            isRestricted={tradingCard.isRestricted}
            isAvatarBlurred={tradingCard.isAvatarBlurred}
            frameSx={{
              position: 'absolute',
              ...(position === 'left' ? { left: { xs: 70, sm: 82 } } : { right: { xs: 70, sm: 82 } }),
              bottom: 0,
              boxShadow: expanded
                ? '0 18px 40px rgba(15,23,42,0.35), 0 0 0 1px rgba(148,163,184,0.45)'
                : '0 10px 24px rgba(15,23,42,0.18)',
              transform: expanded
                ? 'translateX(0) translateY(-6px) scale(1)'
                : `${position === 'left' ? 'translateX(-26px)' : 'translateX(26px)'} translateY(6px) scale(0.92)`,
              opacity: expanded ? 1 : 0,
              pointerEvents: expanded ? 'auto' : 'none',
              transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
              transitionDelay: expanded ? '0.24s' : '0s',
              zIndex: 1090,
              ...tradingCardHoverSx,
              ...(tradingCard.frameSx || {}),
            }}
          />
        )}

        {/* Action item FABs — stacked upward when expanded */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
          {positionedItems.map((item) => (
            <Box
              key={item.key}
              sx={{
                position: 'absolute',
                bottom: expanded ? item.bottomOffset : 0,
                ...(position === 'left' ? { left: 0 } : { right: 0 }),
                opacity: expanded ? 1 : 0,
                pointerEvents: expanded ? 'auto' : 'none',
                transition: 'bottom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
                transitionDelay: expanded ? `${item.delay.toFixed(2)}s` : '0s',
                zIndex: 1530,
              }}
            >
              <Tooltip title={item.tooltip || ''} placement={item.tooltipPlacement}>
                <Fab onClick={item.onClick} size={item.size} sx={actionFabSx(item.accent, item.delay)}>
                  {item.icon}
                </Fab>
              </Tooltip>
            </Box>
          ))}
        </Box>

        {/* Main toggle FAB */}
        {showMainFab ? (
          <Tooltip title={mainFabDisabled ? mainTooltipDisabled : (expanded ? mainTooltipOpen : mainTooltipClosed)} placement={position === 'left' ? 'right' : 'left'}>
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
    </Box>
  );

  if (enableClickAway) {
    return <ClickAwayListener onClickAway={onCollapse}>{rootContent}</ClickAwayListener>;
  }

  return rootContent;
};

export default NavFab;
