import React, { useState, useEffect, useRef } from 'react';
import { Box, CardMedia, IconButton, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { PlayArrow as PlayIcon, OpenInNew as OpenInNewIcon, VolumeUp as VolumeUpIcon, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';
import AudioWaveformVisualizer from '../../../components/AudioWaveformVisualizer';
import config from '../../../config';
import { isCdnUrlExpired } from '../../../utils/api';

// Centralized media URL normalization helper
const normalizeMediaUrl = (url) => {
  if (!url) return '';
  let trimmed = String(url).trim();
  if (!trimmed) return '';

  // Replace absolute localhost backend URLs with relative paths to hit the Vite proxy
  trimmed = trimmed.replace(/^https?:\/\/localhost:5000\//, '/');

  // 1. If it's already a full HTTP(S) URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. If it's a relative path starting with /, return it as-is to hit the Vite proxy
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // 3. Handle Cloudinary/R2 shorthand or relative paths
  const baseUrl = config.API_URL?.endsWith('/') 
    ? config.API_URL.slice(0, -1) 
     : (config.API_URL || '');

  // If the config.API_URL itself points to localhost:5000, we should return relative
  if (baseUrl.includes('localhost:5000')) {
    return `/${trimmed}`;
  }

  return `${baseUrl}/${trimmed}`;
};

const getEmbedData = (url) => {
  if (!url) return null;
  const s = String(url).trim();

  // 1. YouTube & Shorts
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const ytMatch = s.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    const isShorts = s.includes('/shorts/');
    return {
      type: 'youtube',
      isShorts,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
    };
  }

  // 2. TikTok
  const ttRegex = /tiktok\.com\/(?:@[^\/]+\/)?video\/(\d+)/;
  const ttMatch = s.match(ttRegex);
  if (ttMatch && ttMatch[1]) {
    return {
      type: 'tiktok',
      isShorts: true, // Always portrait
      embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`
    };
  }
  const ttRegex2 = /tiktok\.com\/v\/(\d+)/;
  const ttMatch2 = s.match(ttRegex2);
  if (ttMatch2 && ttMatch2[1]) {
    return {
      type: 'tiktok',
      isShorts: true, // Always portrait
      embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch2[1]}`
    };
  }

  // 3. Instagram Reels & Posts
  const igRegex = /instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/;
  const igMatch = s.match(igRegex);
  if (igMatch && igMatch[1]) {
    const isReel = s.includes('/reel/') || s.includes('/reels/');
    return {
      type: 'instagram',
      isShorts: isReel,
      embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed`
    };
  }

  // 4. Twitter / X
  const twitterRegex = /(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/status\/(\d+)/;
  const twitterMatch = s.match(twitterRegex);
  if (twitterMatch && twitterMatch[1]) {
    return {
      type: 'twitter',
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${twitterMatch[1]}`
    };
  }

  // 5. Facebook
  const isFb = /facebook\.com|fb\.watch/i.test(s);
  if (isFb) {
    const isFbVideo = s.includes('/videos/') || s.includes('/watch') || s.includes('video.php');
    if (isFbVideo) {
      return {
        type: 'facebook',
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(s)}&show_text=false`
      };
    } else {
      return {
        type: 'facebook',
        embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(s)}&show_text=true`
      };
    }
  }

  // 6. Bluesky
  const bskyRegex = /bsky\.app\/profile\/[^\/]+\/post\/([a-zA-Z0-9]+)/;
  const bskyMatch = s.match(bskyRegex);
  if (bskyMatch && bskyMatch[1]) {
    return {
      type: 'bluesky',
      embedUrl: `https://embed.bsky.app/iframe?url=${encodeURIComponent(s)}`
    };
  }

  return null;
};

const getAutoplayUrl = (embed, isAutoplayEnabled = true) => {
  if (!embed) return '';
  const url = embed.embedUrl;
  if (!isAutoplayEnabled) {
    if (embed.type === 'youtube') {
      return url + (url.includes('?') ? '&autoplay=0&mute=1' : '?autoplay=0&mute=1');
    }
    if (embed.type === 'facebook') {
      return url + (url.includes('?') ? '&autoplay=false' : '?autoplay=false');
    }
    if (embed.type === 'tiktok') {
      return url + (url.includes('?') ? '&autoplay=0' : '?autoplay=0');
    }
    return url;
  }
  if (embed.type === 'youtube') {
    return url + (url.includes('?') ? '&autoplay=1&mute=0' : '?autoplay=1&mute=0');
  }
  if (embed.type === 'facebook') {
    return url + (url.includes('?') ? '&autoplay=true' : '?autoplay=true');
  }
  if (embed.type === 'tiktok') {
    // Disable autoplay so it doesn't start muted.
    // TikTok embeds will load in a paused state and play unmuted on direct click.
    return url + (url.includes('?') ? '&autoplay=0' : '?autoplay=0');
  }
  return url;
};

const TikTokEmbed = ({ embedUrl, title, isMediaFullscreen }) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [scale, setScale] = useState(1);
  const targetWidth = 325;
  const targetHeight = 580;

  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width || targetWidth;
      const containerHeight = rect.height || targetHeight;

      const scaleX = containerWidth / targetWidth;
      const scaleY = containerHeight / targetHeight;
      
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale || 1);
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', measure);
    const timer = setTimeout(measure, 100);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [isMediaFullscreen]);

  const handleLoad = () => {
    const sendUnmute = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          const win = iframeRef.current.contentWindow;
          // 1. TikTok Native player commands
          win.postMessage({ 'x-tiktok-player': true, type: 'unMute' }, '*');
          win.postMessage({ 'x-tiktok-player': true, type: 'changeVolume', value: 100 }, '*');
          
          // 2. PlayerJS standard commands
          win.postMessage(JSON.stringify({ event: 'command', func: 'unmute', args: [] }), '*');
          win.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [1] }), '*');
          
          // 3. Alternate standard object forms
          win.postMessage({ event: 'command', func: 'unmute', args: [] }, '*');
          win.postMessage({ event: 'command', func: 'setVolume', args: [100] }, '*');
        } catch (e) {
          // ignore
        }
      }
    };

    sendUnmute();
    const t1 = setTimeout(sendUnmute, 500);
    const t2 = setTimeout(sendUnmute, 1500);
    const t3 = setTimeout(sendUnmute, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  useEffect(() => {
    const cleanup = handleLoad();
    return cleanup;
  }, [embedUrl]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: 'black',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title}
        onLoad={handleLoad}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        style={{
          position: 'absolute',
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          border: 'none',
          backgroundColor: 'black',
        }}
      />
    </Box>
  );
};

const InstagramEmbed = ({ embedUrl, title, isMediaFullscreen }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const targetWidth = 328;
  const targetHeight = 720;

  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width || targetWidth;
      const containerHeight = rect.height || targetHeight;

      const scaleX = containerWidth / targetWidth;
      const scaleY = containerHeight / targetHeight;
      
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale || 1);
    };

    measure();

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', measure);
    const timer = setTimeout(measure, 100);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [isMediaFullscreen]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: 'black',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <iframe
        src={embedUrl}
        title={title}
        frameBorder="0"
        scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          border: 'none',
          backgroundColor: 'black',
        }}
      />
    </Box>
  );
};

const UniversalMediaDisplay = ({
  event,
  isPlayerActive,
  setIsPlayerActive,
  isMediaFullscreen,
  setIsMediaFullscreen,
  localIsBlurred = false,
  isRevealed = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [videoElement, setVideoElement] = useState(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const audioVisualizerRef = useRef(null);
  const lastTapRef = useRef(0);

  // Derive Cloudinary public_id from a Cloudinary URL if cloudinary_id is missing
  const getCloudinaryPublicIdFromUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return '';
      if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) return '';
      const parts = url.split('/');
      const uploadIdx = parts.findIndex(p => p === 'upload');
      if (uploadIdx === -1 || uploadIdx >= parts.length - 1) return '';
      const afterUpload = parts.slice(uploadIdx + 1).join('/');
      const afterNoVersion = afterUpload.replace(/^v\d+\//, '');
      const publicId = afterNoVersion.replace(/\.[^\.\/?]+(\?.*)?$/, '');
      return publicId;
    } catch (_) {
      return '';
    }
  };

  const prepareVideoSources = (mediaSource) => {
    let videoSources = [];
    if (!mediaSource) return videoSources;

    const normalizedInput = String(mediaSource).trim().replace(/^https?:\/\/localhost:5000\//, '/');
    const isCloudinaryUrl = (
      (normalizedInput && (normalizedInput.includes('cloudinary.com') || normalizedInput.includes('res.cloudinary'))) ||
      (event.media_type && event.media_type.includes('cloudinary'))
    );
    const isR2Url = normalizedInput && (normalizedInput.includes('r2.dev') || normalizedInput.includes('itimeline-media'));
    const isAbsoluteUrl = normalizedInput.startsWith('http://') || normalizedInput.startsWith('https://');
    
    let fullUrl = normalizedInput;
    if (isCloudinaryUrl || isR2Url || isAbsoluteUrl) {
      fullUrl = normalizedInput;
    } else if (normalizedInput.startsWith('/')) {
      fullUrl = normalizedInput;
    } else {
      const baseUrl = config.API_URL?.endsWith('/') ? config.API_URL.slice(0, -1) : (config.API_URL || '');
      if (baseUrl.includes('localhost:5000')) {
        fullUrl = `/${normalizedInput}`;
      } else {
        fullUrl = `${baseUrl}/${normalizedInput}`;
      }
    }
    
    if (fullUrl) videoSources.push(fullUrl);
    if (normalizedInput.startsWith('/uploads/')) videoSources.push(normalizedInput);

    const looksLikeCloudinaryId = event.cloudinary_id && !event.cloudinary_id.includes('/') && !event.cloudinary_id.includes('.');
    if (looksLikeCloudinaryId && !isCloudinaryUrl && !isR2Url) {
      const cloudName = 'dnjwvuxn7';
      const baseUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${event.cloudinary_id}`;
      videoSources.push(`${baseUrl}.mp4`);
      videoSources.push(`${baseUrl}.webm`);
      videoSources.push(`${baseUrl}.mov`);
      videoSources.push(baseUrl);
    }
    
    return videoSources.filter(Boolean);
  };

  // Helper for Double Tap / Double Click logic to toggle Fullscreen
  const handleContainerTap = (e) => {
    // Avoid triggering toggle if clicking controls or buttons
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.MuiSlider-root')) {
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setIsMediaFullscreen(!isMediaFullscreen);
    }
    lastTapRef.current = now;
  };  const handleVideoClick = (e) => {
    // Avoid play/pause toggle if clicking the fullscreen button or other controls
    if (e.target.closest('.no-toggle-play')) {
      return;
    }
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.play().catch(err => console.log('Playback error:', err));
      } else {
        videoElement.pause();
      }
    }
  };

  useEffect(() => {
    // Autoplay native video element if popup is open and player is active or video is not gated (blurred)
    if (videoElement) {
      const canAutoplay = !localIsBlurred || isRevealed || isPlayerActive;
      if (canAutoplay) {
        const timer = setTimeout(() => {
          videoElement.muted = false;
          videoElement.play().catch(err => {
            console.log('Autoplay prevented by browser:', err);
          });
        }, 500);
        return () => clearTimeout(timer);
      } else {
        videoElement.pause();
      }
    }
  }, [videoElement, isPlayerActive, localIsBlurred, isRevealed]);

  const safeType = (event.type || '').toLowerCase();
  const rawMediaUrl = event.media_url || event.mediaUrl || event.url;
  const mediaUrl = isCdnUrlExpired(rawMediaUrl) ? null : rawMediaUrl;
  const normalizedUrl = normalizeMediaUrl(mediaUrl);
  const embedData = getEmbedData(event.url || event.media_source || mediaUrl);

  // Determine media classifications
  const isImage = () => {
    if (safeType === 'news') return false;
    const subtype = (event.media_subtype || '').toLowerCase();
    if (subtype === 'image') return true;
    return (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mediaUrl || '') || (event.media_type || '').startsWith('image/'));
  };

  const isVideo = () => {
    if (safeType === 'news') return false;
    const subtype = (event.media_subtype || '').toLowerCase();
    if (subtype === 'video') return true;
    return (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(mediaUrl || '') || (event.media_type || '').startsWith('video/'));
  };

  const isAudio = () => {
    if (safeType === 'news') return false;
    const subtype = (event.media_subtype || '').toLowerCase();
    if (subtype === 'audio') return true;
    return (/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(mediaUrl || '') || (event.media_type || '').startsWith('audio/'));
  };

  const handlePlayOverlayClick = () => {
    setIsPlayerActive(true);
  };

  if (safeType === 'news' || embedData) {
    if (embedData) {
      if (embedData.type === 'instagram') {
        return (
          <Box 
            onClick={handleContainerTap}
            sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              bgcolor: 'black' 
            }}
          >
            <InstagramEmbed
              embedUrl={getAutoplayUrl(embedData, !localIsBlurred || isRevealed || isPlayerActive)}
              title={event.title || 'Instagram'}
              isMediaFullscreen={isMediaFullscreen}
            />

            {/* Big custom Fullscreen toggle button in bottom-right corner */}
            {!isMediaFullscreen && (
              <IconButton
                className="no-toggle-play"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMediaFullscreen(true);
                }}
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  width: 54,
                  height: 54,
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.85)',
                    transform: 'scale(1.1)',
                    borderColor: 'white'
                  },
                  zIndex: 10
                }}
                title="Enter fullscreen"
              >
                <FullscreenIcon sx={{ fontSize: 28 }} />
              </IconButton>
            )}
          </Box>
        );
      }

      if (embedData.type === 'tiktok') {
        return (
          <Box 
            onClick={handleContainerTap}
            sx={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              bgcolor: 'black' 
            }}
          >
            <TikTokEmbed
              embedUrl={getAutoplayUrl(embedData, !localIsBlurred || isRevealed || isPlayerActive)}
              title={event.title || 'TikTok'}
              isMediaFullscreen={isMediaFullscreen}
            />

            {/* Big custom Fullscreen toggle button in bottom-right corner */}
            {!isMediaFullscreen && (
              <IconButton
                className="no-toggle-play"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMediaFullscreen(true);
                }}
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  width: 54,
                  height: 54,
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.85)',
                    transform: 'scale(1.1)',
                    borderColor: 'white'
                  },
                  zIndex: 10
                }}
                title="Enter fullscreen"
              >
                <FullscreenIcon sx={{ fontSize: 28 }} />
              </IconButton>
            )}
          </Box>
        );
      }

      const isWidescreen = !embedData.isShorts;
      return (
        <Box 
          onClick={handleContainerTap}
          sx={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'black' 
          }}
        >
          <iframe
            src={getAutoplayUrl(embedData, !localIsBlurred || isRevealed || isPlayerActive)}
            title={event.title || 'Embed'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              aspectRatio: !isWidescreen ? '9/16' : 'unset',
              maxWidth: '100%',
              maxHeight: '100%',
              margin: 'auto',
              display: 'block',
              border: 'none',
            }}
          />

          {/* Big custom Fullscreen toggle button in bottom-right corner */}
          {!isMediaFullscreen && (
            <IconButton
              className="no-toggle-play"
              onClick={(e) => {
                e.stopPropagation();
                setIsMediaFullscreen(true);
              }}
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                width: 54,
                height: 54,
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.85)',
                  transform: 'scale(1.1)',
                  borderColor: 'white'
                },
                zIndex: 10
              }}
              title="Enter fullscreen"
            >
              <FullscreenIcon sx={{ fontSize: 28 }} />
            </IconButton>
          )}
        </Box>
      );
    }

    // Otherwise, normal article link (just open in new tab when clicked)
    const rawPreviewImg = event.url_image || (mediaUrl && mediaUrl.match(/\.(jpeg|jpg|gif|png)$/) ? mediaUrl : null) || '/images/fallbacks/news-link-fallback.jpg';
    const previewImg = isCdnUrlExpired(rawPreviewImg) ? '/images/fallbacks/news-link-fallback.jpg' : rawPreviewImg;
    return (
      <Box
        onClick={() => {
          const normalized = normalizeMediaUrl(event.url || event.media_source || mediaUrl);
          if (normalized) window.open(normalized, '_blank', 'noopener,noreferrer');
        }}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={previewImg}
          alt={event.title}
          draggable="false"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            WebkitUserDrag: 'none',
            userSelect: 'none',
            transition: 'transform 0.5s ease',
            '&:hover': { transform: 'scale(1.03)' }
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/fallbacks/news-link-fallback.jpg';
          }}
        />
      </Box>
    );
  }

  // 2. Standard Media Video
  if (isVideo()) {
    const derivedId = getCloudinaryPublicIdFromUrl(normalizedUrl);
    const cloudinaryId = event.cloudinary_id || derivedId;
    const useCloudinary = !!cloudinaryId;

    if (useCloudinary) {
      return (
        <Box 
          onClick={handleContainerTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'black' }}
        >
          <iframe
            title="cloudinary-player"
            src={`https://player.cloudinary.com/embed/?cloud_name=dnjwvuxn7&public_id=${encodeURIComponent(cloudinaryId)}&profile=cld-default&autoplay=${(!localIsBlurred || isRevealed || isPlayerActive) ? 'true' : 'false'}&muted=${(!localIsBlurred || isRevealed || isPlayerActive) ? 'false' : 'true'}&controls=true`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              background: 'black'
            }}
          />
        </Box>
      );
    }

    const videoSources = prepareVideoSources(normalizedUrl);
    return (
      <Box 
        onClick={handleVideoClick}
        sx={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          bgcolor: 'black',
          cursor: 'pointer'
        }}
      >
        <video
          ref={el => setVideoElement(el)}
          autoPlay={false}
          muted={false}
          playsInline
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: 'black',
            display: 'block',
          }}
          onError={(e) => {
            const currentSrc = e.target.src;
            const currentIndex = videoSources.indexOf(currentSrc);
            if (currentIndex >= 0 && currentIndex < videoSources.length - 1) {
              e.target.src = videoSources[currentIndex + 1];
            } else {
              setVideoFailed(true);
            }
          }}
        >
          {videoSources.map((src, idx) => (
            <source key={idx} src={src} />
          ))}
          Your browser does not support the video tag.
        </video>

        {/* Big custom Fullscreen toggle button in bottom-right corner */}
        {!isMediaFullscreen && (
          <IconButton
            className="no-toggle-play"
            onClick={(e) => {
              e.stopPropagation();
              setIsMediaFullscreen(true);
            }}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              width: 54,
              height: 54,
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.85)',
                transform: 'scale(1.1)',
                borderColor: 'white'
              },
              zIndex: 10
            }}
            title="Enter fullscreen"
          >
            <FullscreenIcon sx={{ fontSize: 28 }} />
          </IconButton>
        )}

        {/* Big custom Play button in center when paused */}
        {isPaused && (
          <Box
            className="no-toggle-play"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              pointerEvents: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              zIndex: 5
            }}
          >
            <PlayIcon sx={{ fontSize: 32, ml: 0.5 }} />
          </Box>
        )}

        {videoFailed && (
          <Box
            sx={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.85)', p: 3, textAlign: 'center', zIndex: 5
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>Video preview failed</Typography>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(normalizedUrl, '_blank')}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Open in new tab
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // 3. Standard Media Image
  if (isImage()) {
    return (
      <Box
        onClick={handleContainerTap}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black',
          overflow: 'hidden',
        }}
      >
        <CardMedia
          component="img"
          image={normalizedUrl}
          alt={event.title || 'Image Preview'}
          draggable="false"
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
            cursor: 'pointer',
            WebkitUserDrag: 'none',
            userSelect: 'none',
            transition: 'transform 0.4s ease',
            '&:hover': {
              transform: isMediaFullscreen ? 'none' : 'scale(1.02)'
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsMediaFullscreen(!isMediaFullscreen);
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/fallbacks/news-link-fallback.jpg';
          }}
        />
        <IconButton
          onClick={() => window.open(normalizedUrl, '_blank')}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            zIndex: 6,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  // 4. Standard Media Audio
  if (isAudio()) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'black', p: 2 }}>
        <AudioWaveformVisualizer 
          ref={audioVisualizerRef}
          audioUrl={normalizedUrl} 
          title={event.title || "Audio"}
          previewMode={false}
          showTitle={false}
          compactMode={true}
        />
      </Box>
    );
  }

  // Fallback default placeholder
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'black', p: 3 }}>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        No preview available.
      </Typography>
    </Box>
  );
};

export default UniversalMediaDisplay;
