import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const MusicPlayer = ({ url, platform }) => {
  const audioRef = useRef(null);
  const fadeInterval = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset player state when URL changes
    setIsPlaying(false);
    setError(null);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    return () => {
      if (fadeInterval.current) {
        clearInterval(fadeInterval.current);
      }
    };
  }, [url]);

  const fadeInVolume = async () => {
    if (!audioRef.current) return;
    
    // Start with volume at 0
    audioRef.current.volume = 0;
    
    // Start playing
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      
      let currentVol = 0;
      const targetVol = isMuted ? 0 : volume;
      const steps = 20; // Number of steps in fade
      const increment = targetVol / steps;
      const intervalTime = 50; // Time between steps in ms
      
      // Clear any existing fade interval
      if (fadeInterval.current) {
        clearInterval(fadeInterval.current);
      }
      
      // Create new fade interval
      fadeInterval.current = setInterval(() => {
        currentVol = Math.min(targetVol, currentVol + increment);
        if (audioRef.current) {
          audioRef.current.volume = currentVol;
        }
        
        if (currentVol >= targetVol) {
          clearInterval(fadeInterval.current);
        }
      }, intervalTime);
    } catch (err) {
      setError('Unable to play audio. Please check the URL.');
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        // Clear any ongoing fade
        if (fadeInterval.current) {
          clearInterval(fadeInterval.current);
        }
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

  if (!url) return null;

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderRadius: 1,
      bgcolor: 'background.paper',
      maxWidth: '400px',
      margin: '0 auto',
      boxShadow: 1
    }}>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError('Unable to play audio. Please check the URL.')}
      />
      
      <IconButton 
        onClick={handlePlayPause}
        size="large"
        color="primary"
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <IconButton onClick={handleVolumeToggle} size="small">
          {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        
        <Slider
          size="small"
          value={isMuted ? 0 : volume * 100}
          onChange={handleVolumeChange}
          aria-label="Volume"
          sx={{ width: 100 }}
        />
      </Box>

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default MusicPlayer;
