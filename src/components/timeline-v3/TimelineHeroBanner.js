import React, { useMemo } from 'react';
import { Box, Typography, Skeleton, useMediaQuery, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import TagIcon from '@mui/icons-material/Tag';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getTimelineSurfaceTheme } from './timelineSurfaceTheme';

export const TimelineHeroBanner = ({
  timelineName = 'Timeline',
  timelineType = 'community',
  visibility = 'public',
  coverImageUrl = '',
  coverLandscapeX = 50,
  coverLandscapeY = 50,
  coverZoom = 1,
  coverUploadEnabled = true,
  isLoading = false,
  onClick = null,      // When provided, banner becomes a toggle handle
  isCollapsed = false, // Controls chevron direction
  sx = {}
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const xTranslationFactor = isDesktop ? 0.9 : 0.9 * (8 / 4.5);
  const timelineSurfaces = useMemo(() => getTimelineSurfaceTheme(theme), [theme]);
  const cleanCoverImageUrl = String(coverImageUrl || '').trim();

  // Normalized type flags
  const normType = String(timelineType || 'community').toLowerCase();
  const isPersonal = normType === 'personal';
  const isCommunity = normType === 'community';
  const isHashtag = !isPersonal && !isCommunity;

  // Clean raw timeline name to avoid duplicated prefixes if caller already formatted it
  const cleanName = useMemo(() => {
    let raw = String(timelineName || 'Timeline').trim();
    if (raw.startsWith('i - ')) raw = raw.slice(4).trim();
    else if (raw.startsWith('i-')) raw = raw.slice(2).trim();
    else if (raw.startsWith('My-')) raw = raw.slice(3).trim();
    else if (raw.startsWith('#')) raw = raw.slice(1).trim();
    return raw || 'Timeline';
  }, [timelineName]);

  // Dark vs light mode fallback background gradients
  const fallbackGradient = theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
    : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)';

  // Renders the correct icon on the right-hand side of the banner based on timeline type
  const renderIcon = () => {
    const iconStyle = {
      color: '#fff',
      fontSize: { xs: 24, md: 32 },
      opacity: 0.85,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
    };

    switch (String(timelineType).toLowerCase()) {
      case 'community':
        return <GroupsIcon sx={iconStyle} />;
      case 'personal':
        return (
          <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <FavoriteBorderIcon sx={iconStyle} />
            <LockIcon
              sx={{
                fontSize: { xs: 12, md: 16 },
                position: 'absolute',
                bottom: -2,
                right: -2,
                color: '#fff',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
            />
          </Box>
        );
      default:
        return <TagIcon sx={iconStyle} />;
    }
  };

  return (
    <Tooltip
      title={onClick ? (isCollapsed ? 'Show Timeline' : 'Hide Timeline') : ''}
      placement="top"
      disableHoverListener={!onClick}
    >
      <Box
        onClick={onClick || undefined}
        sx={{
          width: '100%',
          maxWidth: '100%',
          mb: 3,
          mt: 2,
          minHeight: { xs: 80, md: 120 },
          aspectRatio: { xs: '4.5 / 1', md: '8 / 1' },
          borderRadius: 2.25,
          border: '1px solid',
          borderColor: timelineSurfaces.shellBorder,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 24px rgba(2,6,23,0.45), 0 0 0 1px rgba(255,255,255,0.06)'
            : '0 12px 24px rgba(15,23,42,0.16), 0 0 0 1px rgba(15,23,42,0.08)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          px: { xs: 2.5, md: 4 },
          pb: { xs: 2, md: 3 },
          background: fallbackGradient,
          // Clickable affordance
          ...(onClick ? {
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, filter 0.2s ease',
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 32px rgba(2,6,23,0.6), 0 0 0 1.5px rgba(255,255,255,0.18)'
                : '0 12px 32px rgba(15,23,42,0.22), 0 0 0 1.5px rgba(15,23,42,0.16)',
              filter: 'brightness(1.06)',
            },
          } : {}),
          ...sx,
        }}
      >
      {/* Cover Image - strictly utilizing 'contain' to honor positioning settings */}
      {!isLoading && cleanCoverImageUrl && (
        <Box
          component="img"
          src={cleanCoverImageUrl}
          alt={`${timelineName} cover`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: '50% 50%',
            filter: coverUploadEnabled
              ? 'brightness(1.05) saturate(1.04)'
              : 'blur(18px) saturate(0.42)',
            transform: `translate(${(Number(coverLandscapeX ?? 50) - 50) * xTranslationFactor}%, ${(Number(coverLandscapeY ?? 50) - 50) * 0.9}%) scale(${coverUploadEnabled ? (Number(coverZoom ?? 1) || 1) : ((Number(coverZoom ?? 1) || 1) + 0.08)})`,
          }}
        />
      )}

      {/* Shadow overlay to keep text and controls crystal clear */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(2,6,23,0.04) 0%, rgba(2,6,23,0.28) 42%, rgba(2,6,23,0.78) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Loading Skeleton Mode */}
      {isLoading && (
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <Skeleton variant="text" width={110} height={16} sx={{ bgcolor: 'rgba(255,255,255,0.25)', mb: 0.5 }} />
          <Skeleton variant="text" width={240} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.28)' }} />
        </Box>
      )}

      {/* Banner text label & Controls */}
      {!isLoading && (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 2,
            minWidth: 0,
          }}
        >
          {/* Left Column: Eyebrow + Title with brand prefix */}
          <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'rgba(248,250,252,0.85)',
                textShadow: '0 1px 3px rgba(2,6,23,0.9), 0 2px 8px rgba(2,6,23,0.7)',
                fontWeight: 700,
                fontSize: { xs: '0.58rem', sm: '0.66rem', md: '0.72rem' },
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                lineHeight: 1.2,
                mb: 0.35,
              }}
            >
              {normType.toUpperCase()} TIMELINE
            </Typography>

            <Typography
              component="div"
              sx={{
                color: '#ffffff',
                fontWeight: 800,
                fontSize: { xs: '1.05rem', sm: '1.3rem', md: '1.65rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                textShadow: '0 2px 4px rgba(2,6,23,0.9), 0 4px 12px rgba(2,6,23,0.75), 0 0 24px rgba(2,6,23,0.6)',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {isCommunity && (
                <span
                  style={{
                    fontFamily: 'Lobster, cursive',
                    marginRight: '6px',
                    color: theme.palette.mode === 'dark' ? '#60a5fa' : '#93c5fd',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  i -
                </span>
              )}
              {isPersonal && (
                <span
                  style={{
                    fontFamily: 'Lobster, cursive',
                    marginRight: '6px',
                    color: theme.palette.mode === 'dark' ? '#c084fc' : '#e9d5ff',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  My-
                </span>
              )}
              {isHashtag && (
                <span
                  style={{
                    marginRight: '4px',
                    color: theme.palette.mode === 'dark' ? '#4ade80' : '#86efac',
                    flexShrink: 0,
                    fontWeight: 900,
                  }}
                  aria-hidden="true"
                >
                  #
                </span>
              )}
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexShrink: 1,
                  minWidth: 0,
                }}
              >
                {cleanName}
              </span>
              {isCommunity && visibility === 'private' && (
                <Tooltip title="Private timeline" arrow placement="top">
                  <LockIcon
                    sx={{
                      ml: 0.75,
                      fontSize: { xs: '0.85rem', sm: '1rem' },
                      color: 'rgba(255,255,255,0.85)',
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              )}
            </Typography>
          </Box>

          {/* Right Column: Toggle button & Type Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {/* Collapse/Expand chevron — only shown when banner is wired as a toggle */}
            {onClick && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: '20px',
                  px: 1.25,
                  py: 0.4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.55)',
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.92)',
                    fontSize: { xs: '0.62rem', sm: '0.68rem' },
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isCollapsed ? 'Show Timeline' : 'Hide Timeline'}
                </Typography>
                <ExpandMoreIcon
                  sx={{
                    color: 'rgba(255,255,255,0.92)',
                    fontSize: 16,
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </Box>
            )}
            {renderIcon()}
          </Box>
        </Box>
      )}
    </Box>
    </Tooltip>
  );
};
