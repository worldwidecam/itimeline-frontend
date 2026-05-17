import React, { useMemo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import TagIcon from '@mui/icons-material/Tag';
import { getTimelineSurfaceTheme } from './timelineSurfaceTheme';

export const TimelineHeroBanner = ({
  timelineName = 'Timeline',
  timelineType = 'community',
  coverImageUrl = '',
  coverLandscapeX = 50,
  coverLandscapeY = 50,
  coverZoom = 1,
  coverUploadEnabled = true,
  isLoading = false,
  sx = {}
}) => {
  const theme = useTheme();
  const timelineSurfaces = useMemo(() => getTimelineSurfaceTheme(theme), [theme]);
  const cleanCoverImageUrl = String(coverImageUrl || '').trim();

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
        return <PersonIcon sx={iconStyle} />;
      default:
        return <TagIcon sx={iconStyle} />;
    }
  };

  return (
    <Box
      sx={{
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
        background: cleanCoverImageUrl ? 'transparent' : fallbackGradient,
        ...sx,
      }}
    >
      {/* Cover Image - strictly utilizing 'contain' to honor positioning settings */}
      {!isLoading && cleanCoverImageUrl && (
        <Box
          component="img"
          src={cleanCoverImageUrl}
          alt={`${timelineName} cover`}
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
            transform: `translate(${(Number(coverLandscapeX ?? 50) - 50) * 0.9}%, ${(Number(coverLandscapeY ?? 50) - 50) * 0.9}%) scale(${coverUploadEnabled ? (Number(coverZoom ?? 1) || 1) : ((Number(coverZoom ?? 1) || 1) + 0.08)})`,
          }}
        />
      )}

      {/* Shadow overlay overlay to keep text highly legible */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.42) 100%)',
        }}
      />

      {/* Loading Skeleton Mode */}
      {isLoading && (
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <Skeleton variant="text" width={220} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.25)' }} />
          <Skeleton variant="text" width={140} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.22)' }} />
        </Box>
      )}

      {/* Banner text label & Icon */}
      {!isLoading && (
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(248,250,252,0.95)',
              textShadow: `
                0 2px 4px rgba(2,6,23,0.8), 
                0 4px 12px rgba(2,6,23,0.6), 
                0 0 20px rgba(2,6,23,0.4)
              `,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            {String(timelineType || 'community').toUpperCase()} TIMELINE
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderIcon()}
          </Box>
        </Box>
      )}
    </Box>
  );
};
