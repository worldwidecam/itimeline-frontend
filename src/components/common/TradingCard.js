import React from 'react';
import { Box, Typography } from '@mui/material';

const TradingCard = ({
  onActivate,
  frameSx = {},
  frameClassName,
  innerSx = {},
  imageUrl,
  imageAlt,
  imageClassName,
  imageSx = {},
  fallbackSx = {},
  fallbackClassName,
  gradientOverlaySx = {},
  innerBorderSx = {},
  label,
  title,
  contentSx = {},
  labelSx = {},
  titleTypographyProps = {},
  qrUrl,
  qrAlt = 'Share QR code',
  qrSx = {},
  overlayClassName,
  overlayText = 'Tap to Share',
  overlaySx = {},
  isRestricted = false,
  isAvatarBlurred = false,
}) => {
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setImageLoadFailed(false);
  }, [imageUrl]);

  const hasValidImageUrl = Boolean(String(imageUrl || '').trim());
  const shouldRenderImage = hasValidImageUrl && !imageLoadFailed;

  const handleKeyDown = async (event) => {
    if (!onActivate) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      await onActivate();
    }
  };

  const handleClick = async () => {
    if (!onActivate) return;
    await onActivate();
  };

  return (
    <Box
      className={frameClassName}
      role={onActivate ? 'button' : undefined}
      tabIndex={onActivate ? 0 : undefined}
      onClick={onActivate ? handleClick : undefined}
      onKeyDown={onActivate ? handleKeyDown : undefined}
      sx={{
        width: { xs: 138, sm: 168 },
        height: { xs: 204, sm: 248 },
        borderRadius: 3,
        padding: 0.8,
        background: `linear-gradient(160deg, rgba(120,86,36,0.95) 0%, rgba(120,86,36,0.9) 25%, rgba(10,10,12,0.96) 75%, rgba(0,0,0,0.98) 100%) padding-box,
          linear-gradient(135deg, rgba(56,189,248,0.7), rgba(129,140,248,0.65), rgba(248,113,113,0.55)) border-box`,
        border: '2px solid transparent',
        boxShadow: '0 10px 24px rgba(15,23,42,0.18)',
        backdropFilter: 'blur(6px)',
        cursor: onActivate ? 'pointer' : 'default',
        ...frameSx,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 2.4,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.8) 100%)',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.15)',
          ...innerSx,
        }}
      >
        {/* Always render the fallback HSL gradient background so that empty/transparent space on 'contain' is beautifully filled */}
        <Box
          className={fallbackClassName || imageClassName}
          sx={{
            position: 'absolute',
            inset: 0,
            ...fallbackSx,
          }}
        />

        {shouldRenderImage && (
          <Box
            component="img"
            src={imageUrl}
            alt={imageAlt}
            className={imageClassName}
            onError={() => setImageLoadFailed(true)}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: '50% 50%',
              filter: isAvatarBlurred ? 'blur(18px)' : 'none',
              ...imageSx,
            }}
          />
        )}

        {isRestricted && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/images/RESTRICTED_img.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 1, // Above the image but below the gradient
              pointerEvents: 'none',
            }}
          />
        )}

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.55) 100%)',
            ...gradientOverlaySx,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            border: '2px solid rgba(0,0,0,1)',
            borderRadius: 'inherit',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 1,
            ...innerBorderSx,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 6,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0.6,
            color: '#f8fafc',
            textShadow: '0 2px 8px rgba(0,0,0,0.35)',
            ...contentSx,
          }}
        >
          {label ? (
            <Box
              sx={{
                px: 0.7,
                py: 0.24,
                borderRadius: 999,
                fontSize: '0.36rem',
                fontWeight: 700,
                background: 'rgba(15,23,42,0.72)',
                border: '1px solid rgba(148,163,184,0.6)',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                alignSelf: 'flex-start',
                ...labelSx,
              }}
            >
              {label}
            </Box>
          ) : null}
          {title ? (
            <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.4 }} {...titleTypographyProps}>
              {title}
            </Typography>
          ) : null}
        </Box>

        {qrUrl ? (
          <Box
            sx={{
              position: 'absolute',
              bottom: 52,
              right: 12,
              width: { xs: 54, sm: 64 },
              height: { xs: 54, sm: 64 },
              background: 'rgba(248,250,252,0.95)',
              borderRadius: 1.8,
              padding: 0.6,
              boxShadow: '0 6px 14px rgba(15,23,42,0.25)',
              border: '1px solid rgba(148,163,184,0.5)',
              ...qrSx,
            }}
          >
            <Box component="img" src={qrUrl} alt={qrAlt} sx={{ width: '100%', height: '100%', display: 'block' }} />
          </Box>
        ) : null}

        <Box
          className={overlayClassName}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2,6,23,0.6)',
            color: '#f8fafc',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            ...overlaySx,
          }}
        >
          {overlayText}
        </Box>
      </Box>
    </Box>
  );
};

export default TradingCard;
