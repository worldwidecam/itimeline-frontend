import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import {
  LocalFireDepartment as LocalFireDepartmentIcon,
  Tag as TagIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FavoriteBorder as HeartIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { normalizeTimelineCardData } from './timelineCardModel';
import { displayUsername } from '../../utils/usernameDisplay';

function TimelineCard({
  timeline,
  allowFavoriteToggle = false,
  isFavoriteTimeline = false,
  onToggleFavorite,
  onOpenTimeline,
  formatDate,
  openTimelineLabel = 'Open Timeline',
  sections,
}) {
  const theme = useTheme();

  if (!timeline) return null;

  const cardData = normalizeTimelineCardData(timeline);
  const {
    id: timelineId,
    name: timelineName,
    isCommunity,
    isPersonal,
    isHashtag,
    typeLabel,
    audienceCount,
    audienceLabel,
    portraitCoverPosition,
    portraitCoverZoom,
    hasPortraitCover,
    coverImageUrl,
    isImagePrivilegeEnabled,
    description,
    createdAt,
  } = cardData;
  const TypeIcon = isCommunity ? GroupsIcon : isPersonal ? PersonIcon : TagIcon;
  const fallbackCoverGradient = isCommunity
    ? 'linear-gradient(152deg, rgba(37,99,235,0.94) 0%, rgba(30,64,175,0.9) 55%, rgba(15,23,42,0.6) 100%)'
    : isPersonal
      ? 'linear-gradient(152deg, rgba(168,85,247,0.92) 0%, rgba(236,72,153,0.86) 55%, rgba(88,28,135,0.62) 100%)'
      : 'linear-gradient(152deg, rgba(34,197,94,0.9) 0%, rgba(22,163,74,0.88) 55%, rgba(20,83,45,0.62) 100%)';
  const typeChipGradient = isCommunity
    ? 'linear-gradient(135deg, rgba(30,136,229,0.95) 0%, rgba(13,71,161,0.95) 100%)'
    : isPersonal
      ? 'linear-gradient(135deg, rgba(192,132,252,0.96) 0%, rgba(236,72,153,0.95) 100%)'
      : 'linear-gradient(135deg, rgba(74,222,128,0.95) 0%, rgba(21,128,61,0.95) 100%)';
  const titleStrokeGradient = isCommunity
    ? 'linear-gradient(90deg, rgba(56,189,248,0.7), rgba(29,78,216,0.46))'
    : isPersonal
      ? 'linear-gradient(90deg, rgba(196,181,253,0.72), rgba(236,72,153,0.46))'
      : 'linear-gradient(90deg, rgba(134,239,172,0.74), rgba(22,163,74,0.45))';
  const clampFramePosition = (value, defaultValue = 50) => {
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) ? numeric : Number(defaultValue);
    return Math.max(-40, Math.min(140, safe));
  };
  const clampZoom = (value) => Math.max(1, Math.min(4.875, Number(value) || 1));
  const buildCoverTransform = (position, zoomValue, isPrivilegeEnabled) => {
    const tx = (clampFramePosition(position?.x, 50) - 50) * 0.9;
    const ty = (clampFramePosition(position?.y, 50) - 50) * 0.9;
    const safeZoom = clampZoom(zoomValue);
    const finalZoom = isPrivilegeEnabled ? safeZoom : (safeZoom + 0.08);
    return `translate(${tx}%, ${ty}%) scale(${finalZoom})`;
  };
  const resolvedSections = {
    cover: sections?.cover !== false,
    typeChip: sections?.typeChip !== false,
    audience: sections?.audience !== false,
    description: sections?.description !== false,
    createdDate: sections?.createdDate !== false,
    favoriteToggle: sections?.favoriteToggle !== false,
    openAction: sections?.openAction !== false,
  };
  const formatCreatedDate = (value) => {
    if (typeof formatDate === 'function') {
      return formatDate(value);
    }
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const TITLE_VISUAL_CHAR_LIMIT = 62;
  const timelineTitle = displayUsername(timelineName || '').trim();
  const displayTimelineTitle = timelineTitle.length > TITLE_VISUAL_CHAR_LIMIT
    ? `${timelineTitle.slice(0, TITLE_VISUAL_CHAR_LIMIT - 1)}…`
    : timelineTitle;

  return (
    <Card
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(30, 41, 59, 0.18)',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(165deg, rgba(17,23,39,0.96) 0%, rgba(10,14,24,0.96) 100%)'
          : 'linear-gradient(165deg, rgba(250,244,236,0.98) 0%, rgba(245,239,230,0.98) 100%)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 10px 24px rgba(0,0,0,0.35)'
          : '0 10px 20px rgba(120, 100, 80, 0.12)',
        overflow: 'hidden',
      }}
    >
      {resolvedSections.cover ? (
        <Box
          sx={{
            width: { xs: '100%', lg: 240 },
            minWidth: { xs: '100%', lg: 240 },
            height: { xs: 76, lg: 'auto' },
            minHeight: { xs: 76, lg: 120 },
            px: 2,
            py: 2,
            display: 'flex',
            alignItems: 'flex-end',
            position: 'relative',
            overflow: 'hidden',
            background: coverImageUrl 
              ? 'transparent' 
              : 'rgba(15, 23, 42, 0.62)',
            backdropFilter: coverImageUrl ? 'none' : 'blur(10px)',
            borderRight: { xs: 'none', lg: coverImageUrl ? 'none' : '1px solid' },
            borderRightColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.12)',
            borderBottom: { xs: coverImageUrl ? 'none' : '1px solid', lg: 'none' },
            borderBottomColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.12)',
          }}
        >
          {coverImageUrl && (
            <>
              <Box
                component="img"
                src={coverImageUrl}
                alt={`${timelineName} cover`}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: (isCommunity || ((isPersonal || isHashtag) && hasPortraitCover)) ? '50% 28%' : '50% 50%',
                  filter: isImagePrivilegeEnabled ? 'brightness(1.06) saturate(1.04)' : 'blur(18px) saturate(0.45)',
                  transform: (isPersonal || isHashtag) && hasPortraitCover
                    ? buildCoverTransform(portraitCoverPosition, portraitCoverZoom, isImagePrivilegeEnabled)
                    : (isImagePrivilegeEnabled ? 'none' : 'scale(1.08)'),
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(6,10,19,0.3) 0%, rgba(6,10,19,0.68) 100%)',
                }}
              />
              {!isImagePrivilegeEnabled ? (
                <Chip
                  size="small"
                  label="Image Privilege Off"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 2,
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.45)',
                    background: 'rgba(9,14,28,0.66)',
                    fontWeight: 700,
                  }}
                  variant="outlined"
                />
              ) : null}
            </>
          )}

          {!coverImageUrl && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.08,
                color: '#fff',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              {isCommunity && <GroupsIcon sx={{ fontSize: 130 }} />}
              {isHashtag && <TagIcon sx={{ fontSize: 130 }} />}
              {isPersonal && (
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 130, height: 130 }}>
                  <HeartIcon sx={{ fontSize: 130 }} />
                  <LockIcon
                    sx={{
                      fontSize: 60,
                      position: 'absolute',
                      bottom: -8,
                      right: -12,
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          {resolvedSections.typeChip ? (() => {
            const renderTypeIcon = () => {
              if (isCommunity) return <GroupsIcon fontSize="small" />;
              if (isHashtag) return <TagIcon fontSize="small" />;
              return (
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14 }}>
                  <HeartIcon sx={{ fontSize: 14 }} />
                  <LockIcon
                    sx={{
                      fontSize: 9,
                      position: 'absolute',
                      bottom: -2,
                      right: -3,
                    }}
                  />
                </Box>
              );
            };
            return (
              <Chip
                size="small"
                icon={renderTypeIcon()}
                label={typeLabel}
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  zIndex: 2,
                  px: 0.35,
                  height: { xs: 22, sm: 24 },
                  borderRadius: 1.6,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: { xs: '0.62rem', sm: '0.66rem' },
                  letterSpacing: 0.28,
                  textTransform: 'uppercase',
                  background: typeChipGradient,
                  border: '1px solid rgba(255,255,255,0.24)',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.22)',
                  '& .MuiChip-label': {
                    px: 0.85,
                  },
                  '& .MuiChip-icon': {
                    color: 'rgba(255,255,255,0.94)',
                    fontSize: 14,
                  },
                }}
              />
            );
          })() : null}
        </Box>
      ) : null}

      <CardContent sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 2 }}>
        <Box sx={{ mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1.5,
              flexWrap: 'wrap',
              width: '100%',
              mb: 1.5,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                position: 'relative',
                display: 'inline-flex',
                lineHeight: 1.15,
                fontSize: { xs: '1.02rem', sm: '1.2rem', md: '1.34rem' },
                fontWeight: 900,
                letterSpacing: 0.25,
                pr: 0.5,
                pb: 0.4,
                mb: 0,
                maxWidth: '100%',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                textAlign: 'left',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  height: 4,
                  borderRadius: 999,
                  transform: 'skewX(-6deg)',
                  filter: 'saturate(1.04)',
                  background: titleStrokeGradient,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 0 10px rgba(15,23,42,0.35)'
                    : '0 0 8px rgba(148,163,184,0.2)',
                },
              }}
            >
              {displayTimelineTitle}
            </Typography>

            {resolvedSections.audience ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.15,
                  py: 0.4,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(30,41,59,0.2)',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(120deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'
                    : 'linear-gradient(120deg, rgba(255,255,255,0.9), rgba(255,244,227,0.84))',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: theme.palette.mode === 'dark' ? 0.2 : 0.14,
                    backgroundImage: 'repeating-linear-gradient(120deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 1px, transparent 1px, transparent 7px)',
                  },
                }}
              >
                <LocalFireDepartmentIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#d97706', position: 'relative', zIndex: 1 }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 0.35,
                    fontSize: { xs: '0.74rem', sm: '0.8rem' },
                    color: theme.palette.text.primary,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {audienceCount.toLocaleString()} {audienceLabel}
                </Typography>
              </Box>
            ) : null}
          </Box>

          {resolvedSections.description && description ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                fontStyle: 'italic',
                lineHeight: 1.45,
                display: 'block',
                color: theme.palette.text.secondary,
              }}
            >
              <span style={{ fontSize: '1.15rem', fontWeight: 900, marginRight: '4px', verticalAlign: 'middle', opacity: 0.65, fontFamily: 'Georgia, serif' }}>“</span>
              {description}
              <span style={{ fontSize: '1.15rem', fontWeight: 900, marginLeft: '4px', verticalAlign: 'middle', opacity: 0.65, fontFamily: 'Georgia, serif' }}>”</span>
            </Typography>
          ) : null}
        </Box>

        {resolvedSections.createdDate ? (
          <Typography variant="caption" color="text.secondary">
            Created: {formatCreatedDate(createdAt)}
          </Typography>
        ) : null}
      </CardContent>
      <Box
        sx={{
          px: 2,
          pt: { xs: 0, lg: 2 },
          pb: 2,
          alignSelf: 'stretch',
          display: 'flex',
          flexDirection: { xs: 'row', lg: 'column' },
          alignItems: { xs: 'center', lg: 'center' },
          justifyContent: { xs: 'space-between', lg: 'space-between' },
          gap: { xs: 1, lg: 0 },
        }}
      >
        {allowFavoriteToggle && resolvedSections.favoriteToggle ? (
          <IconButton
            size="small"
            aria-label={isFavoriteTimeline ? 'Remove favorite timeline' : 'Set as favorite timeline'}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (timelineId > 0) {
                onToggleFavorite?.(timelineId);
              }
            }}
            sx={{
              border: '1px solid',
              borderColor: isFavoriteTimeline
                ? (theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.72)' : 'rgba(202,138,4,0.75)')
                : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)'),
              color: isFavoriteTimeline
                ? (theme.palette.mode === 'dark' ? '#facc15' : '#ca8a04')
                : 'text.secondary',
              background: isFavoriteTimeline
                ? (theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(146,64,14,0.2), rgba(250,204,21,0.2))'
                  : 'linear-gradient(135deg, rgba(254,249,195,0.9), rgba(253,230,138,0.9))')
                : 'transparent',
              '&:hover': {
                background: isFavoriteTimeline
                  ? (theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(146,64,14,0.28), rgba(250,204,21,0.28))'
                    : 'linear-gradient(135deg, rgba(254,240,138,0.94), rgba(252,211,77,0.94))')
                  : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'),
              },
            }}
          >
            {isFavoriteTimeline ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
        ) : null}
        {resolvedSections.openAction ? (
          <Button
            size="small"
            variant="contained"
            sx={{
              minWidth: { xs: 124, sm: 136 },
              borderRadius: 999,
              px: { xs: 1.35, sm: 1.65 },
              py: 0.55,
              textTransform: 'none',
              fontWeight: 800,
              letterSpacing: 0.24,
              color: theme.palette.mode === 'dark' ? '#fff' : '#0f172a',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(37,99,235,0.86), rgba(29,78,216,0.76))'
                : 'linear-gradient(135deg, rgba(147,197,253,0.86), rgba(96,165,250,0.86))',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(191,219,254,0.52)' : 'rgba(30,64,175,0.26)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 18px rgba(29,78,216,0.32)'
                : '0 8px 14px rgba(59,130,246,0.24)',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.84))'
                  : 'linear-gradient(135deg, rgba(96,165,250,0.9), rgba(59,130,246,0.9))',
              },
            }}
            onClick={() => {
              if (timelineId > 0) {
                onOpenTimeline?.(timelineId, timeline);
              }
            }}
          >
            {openTimelineLabel}
          </Button>
        ) : null}
      </Box>
    </Card>
  );
}

export default React.memo(TimelineCard);
