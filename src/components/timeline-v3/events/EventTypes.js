import { createTheme } from '@mui/material/styles';

export const EVENT_TYPES = {
  REMARK: 'remark',
  NEWS: 'news',
  MEDIA: 'media',
  // Media subtypes (internal use only)
  MEDIA_IMAGE: 'media_image',
  MEDIA_AUDIO: 'media_audio',
  MEDIA_VIDEO: 'media_video'
};

export const EVENT_TYPE_COLORS = {
  [EVENT_TYPES.REMARK]: {
    light: '#3B82F6', // Blue
    dark: '#60A5FA',
    hover: {
      light: '#2563EB',
      dark: '#93C5FD'
    }
  },
  [EVENT_TYPES.NEWS]: {
    light: '#EF4444', // Red
    dark: '#F87171',
    hover: {
      light: '#DC2626',
      dark: '#FCA5A5'
    }
  },
  [EVENT_TYPES.MEDIA]: {
    light: '#8B5CF6', // Purple
    dark: '#A78BFA',
    hover: {
      light: '#7C3AED',
      dark: '#C4B5FD'
    }
  }
};

export const EVENT_TYPE_METADATA = {
  [EVENT_TYPES.REMARK]: {
    label: 'Remark',
    description: 'Share your thoughts and opinions',
    icon: 'comment',
    requiredFields: ['title', 'date', 'description'],
    optionalFields: ['tags', 'url']
  },
  [EVENT_TYPES.NEWS]: {
    label: 'News',
    description: 'Share news articles and factual content',
    icon: 'newspaper',
    requiredFields: ['title', 'date', 'url'],
    optionalFields: ['tags', 'description']
  },
  [EVENT_TYPES.MEDIA]: {
    label: 'Media',
    description: 'Share images, videos, or audio',
    icon: 'perm_media',
    requiredFields: ['title', 'date', 'mediaFile'],
    optionalFields: ['tags', 'description']
  }
};

const getMediaSubtypeColor = (event, theme) => {
  const subtype = (event?.media_subtype || '').toLowerCase();
  const mediaTypeHint = (event?.media_type || '').toLowerCase();
  const mediaUrl = (event?.media_url || event?.url || '').toLowerCase();
  const ext = mediaUrl.split('.').pop();

  const isVideo =
    subtype === 'video' ||
    mediaTypeHint.includes('video') ||
    (ext && ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext));
  const isAudio =
    subtype === 'audio' ||
    mediaTypeHint.includes('audio') ||
    (ext && ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext));
  const isImage =
    subtype === 'image' ||
    mediaTypeHint.includes('image') ||
    (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext));

  if (isImage) return '#009688';
  if (isAudio) return '#e65100';
  if (isVideo) return '#4a148c';

  const fallback = EVENT_TYPE_COLORS[EVENT_TYPES.MEDIA];
  return theme?.palette?.mode === 'dark' ? fallback.dark : fallback.light;
};

// Hover card styles for timeline markers
export const getHoverCardStyles = (event, theme) => {
  const type = event?.type;
  const baseStyles = {
    position: 'absolute',
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    boxShadow: theme.shadows[4],
    border: '1px solid',
    zIndex: 1000,
    maxWidth: 300,
    transition: 'all 0.2s ease-in-out',
  };

  switch (type) {
    case EVENT_TYPES.REMARK:
      return {
        ...baseStyles,
        borderColor: theme.palette.mode === 'dark' 
          ? EVENT_TYPE_COLORS[EVENT_TYPES.REMARK].dark 
          : EVENT_TYPE_COLORS[EVENT_TYPES.REMARK].light,
        '& .title': {
          fontWeight: 600,
          color: theme.palette.mode === 'dark' 
            ? EVENT_TYPE_COLORS[EVENT_TYPES.REMARK].dark 
            : EVENT_TYPE_COLORS[EVENT_TYPES.REMARK].light,
        },
        '& .author': {
          fontSize: '0.875rem',
          color: theme.palette.text.secondary,
        }
      };

    case EVENT_TYPES.NEWS:
      return {
        ...baseStyles,
        borderColor: theme.palette.mode === 'dark' 
          ? EVENT_TYPE_COLORS[EVENT_TYPES.NEWS].dark 
          : EVENT_TYPE_COLORS[EVENT_TYPES.NEWS].light,
        display: 'flex',
        gap: theme.spacing(1.5),
        '& .image': {
          width: 80,
          height: 80,
          objectFit: 'cover',
          borderRadius: theme.spacing(0.5),
        },
        '& .content': {
          flex: 1,
        },
        '& .title': {
          fontWeight: 600,
          fontSize: '0.875rem',
          fontFamily: '"Times New Roman", serif',
        }
      };

    case EVENT_TYPES.MEDIA: {
      const mediaColor = getMediaSubtypeColor(event, theme);
      return {
        ...baseStyles,
        borderColor: mediaColor,
        padding: theme.spacing(1),
        '& .media-preview': {
          width: '100%',
          height: 120,
          objectFit: 'cover',
          borderRadius: theme.spacing(0.5),
          border: `2px solid ${mediaColor}`,
        },
        '& .title': {
          marginTop: theme.spacing(1),
          fontWeight: 500,
          fontSize: '0.875rem',
          textAlign: 'center',
        }
      };
    }

    default:
      return baseStyles;
  }
};
