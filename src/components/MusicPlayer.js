import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Slider, Tooltip, useTheme, keyframes, alpha } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import LoopIcon from '@mui/icons-material/Loop';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.7); }
  100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
`;

const waveAnimation = keyframes`
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
`;

const MusicPlayer = ({ url, platform, compact = false }) => {
  const theme = useTheme();
  const audioRef = useRef(null);
  const fadeInterval = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsPlaying(false);
    setError(null);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load(); // Force reload the new source
    }

    return () => {
      if (fadeInterval.current) {
        clearInterval(fadeInterval.current);
      }
    };
  }, [url]);

  const fadeInVolume = async () => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = 0;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      
      let currentVol = 0;
      const targetVol = isMuted ? 0 : volume;
      const steps = 20; 
      const increment = targetVol / steps;
      const intervalTime = 50; 
      
      if (fadeInterval.current) {
        clearInterval(fadeInterval.current);
      }
      
      fadeInterval.current = setInterval(() => {
        currentVol = Math.min(targetVol, currentVol + increment);
        if (audioRef.current) {
          audioRef.current.volume = currentVol;
        }
        
        if (currentVol >= targetVol) {
          clearInterval(fadeInterval.current);
          fadeInterval.current = null;
        }
      }, intervalTime);
    } catch (err) {
      setError('Unable to play audio. Please check the URL.');
      setIsPlaying(false);
    }
  };

  const fadeOutVolume = (callback) => {
    if (!audioRef.current || !isPlaying) {
      if (callback) callback();
      return;
    }
    
    let currentVol = audioRef.current.volume;
    const steps = 20; 
    const decrement = currentVol / steps;
    const intervalTime = 50; 
    
    if (fadeInterval.current) {
      clearInterval(fadeInterval.current);
    }
    
    fadeInterval.current = setInterval(() => {
      currentVol = Math.max(0, currentVol - decrement);
      if (audioRef.current) {
        audioRef.current.volume = currentVol;
      }
      
      if (currentVol <= 0) {
        clearInterval(fadeInterval.current);
        fadeInterval.current = null;
        if (callback) callback();
      }
    }, intervalTime);
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        fadeOutVolume(() => {
          audioRef.current.pause();
          setIsPlaying(false);
        });
      } else {
        fadeInVolume();
      }
    }
  };

  const handleVolumeToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (audioRef.current.volume > 0) {
        audioRef.current.volume = isMuted ? volume : 0;
      }
    }
  };

  const handleVolumeChange = (event, newValue) => {
    const volumeValue = newValue / 100;
    setVolume(volumeValue);
    if (audioRef.current && isPlaying) {
      audioRef.current.volume = volumeValue;
    }
  };

  const handleLoopToggle = () => {
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const handleAudioEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
    }
  };

  if (!url) return null;

  const glassBg = theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.7) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(241, 245, 249, 0.8) 100%)';
  const glassBorder = theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(255, 255, 255, 0.6)';
  const glassShadow = theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.05)'
    : '0 8px 32px rgba(148, 163, 184, 0.15), inset 0 1px 1px rgba(255,255,255,0.8)';
  const textPrimary = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)';
  const textSecondary = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: compact ? 'column' : 'row',
      alignItems: 'center',
      gap: { xs: 1.5, sm: 2.5 },
      p: compact ? 2 : { xs: 1.5, sm: 2 },
      borderRadius: 4,
      background: glassBg,
      backdropFilter: 'blur(20px)',
      border: '1px solid',
      borderColor: glassBorder,
      width: '100%',
      boxShadow: glassShadow,
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.08)'
          : '0 12px 40px rgba(148, 163, 184, 0.25), inset 0 1px 1px rgba(255,255,255,0.9)',
      }
    }}>
      <audio
        ref={audioRef}
        src={url}
        onEnded={handleAudioEnded}
        onError={() => setError('Unable to play audio. Please check the URL.')}
        loop={isLooping}
      />

      {/* Decorative Accent Blur */}
      <Box sx={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: isPlaying 
          ? alpha('#10b981', 0.2) 
          : alpha('#3b82f6', 0.15),
        filter: 'blur(40px)',
        zIndex: 0,
        transition: 'background 0.5s ease'
      }} />

      {/* Play/Pause Button */}
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={handlePlayPause}
          sx={{
            width: { xs: 46, sm: 54 },
            height: { xs: 46, sm: 54 },
            background: isPlaying 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            boxShadow: isPlaying
              ? '0 6px 16px rgba(16, 185, 129, 0.4)'
              : '0 6px 16px rgba(59, 130, 246, 0.4)',
            animation: isPlaying ? `${pulseGlow} 2s infinite` : 'none',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:hover': {
              background: isPlaying 
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              transform: 'scale(1.1)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            }
          }}
        >
          {isPlaying ? <PauseIcon sx={{ fontSize: { xs: 24, sm: 28 } }} /> : <PlayArrowIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
        </IconButton>
      </Box>

      {/* Track Info & Controls Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, zIndex: 1, width: '100%' }}>
        
        {/* Top Row: Visualizer & Text */}
        {!compact && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            {isPlaying ? (
              <Box sx={{ display: 'flex', gap: 0.5, height: 16, alignItems: 'center' }}>
                {[1, 2, 3, 4].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 3,
                      height: '100%',
                      background: 'linear-gradient(180deg, #10b981 0%, #34d399 100%)',
                      borderRadius: 2,
                      animation: `${waveAnimation} ${0.6 + (i * 0.2)}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </Box>
            ) : (
              <MusicNoteIcon sx={{ color: textSecondary, fontSize: 18 }} />
            )}
            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.01em'
              }}
            >
              {platform || 'Profile Track'}
            </Typography>
          </Box>
        )}

        {/* Bottom Row: Volume & Loop Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, width: '100%' }}>
          <IconButton 
            onClick={handleVolumeToggle} 
            size="small"
            sx={{ 
              color: isMuted ? textSecondary : textPrimary,
              transition: 'color 0.2s',
              '&:hover': { background: alpha(textPrimary, 0.08) }
            }}
          >
            {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
          </IconButton>

          <Slider
            size="small"
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            aria-label="Volume"
            sx={{
              flex: 1,
              minWidth: 60,
              color: isPlaying ? '#10b981' : '#3b82f6',
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                '&:before': { boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0px 0px 0px 8px ${alpha(isPlaying ? '#10b981' : '#3b82f6', 0.16)}`
                },
                '&.Mui-active': {
                  width: 16,
                  height: 16,
                }
              },
              '& .MuiSlider-rail': {
                opacity: 0.2,
                backgroundColor: textPrimary
              }
            }}
          />

          <Tooltip title={isLooping ? "Disable loop" : "Enable loop"}>
            <IconButton
              onClick={handleLoopToggle}
              size="small"
              sx={{
                color: isLooping ? (isPlaying ? '#10b981' : '#3b82f6') : textSecondary,
                background: isLooping ? alpha(isPlaying ? '#10b981' : '#3b82f6', 0.1) : 'transparent',
                transition: 'all 0.2s',
                '&:hover': { background: alpha(isPlaying ? '#10b981' : '#3b82f6', 0.15) }
              }}
            >
              <LoopIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ 
            position: 'absolute', 
            bottom: 4, 
            left: '50%', 
            transform: 'translateX(-50%)',
            fontWeight: 500,
            background: alpha(theme.palette.error.main, 0.1),
            px: 1,
            borderRadius: 1
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default MusicPlayer;
