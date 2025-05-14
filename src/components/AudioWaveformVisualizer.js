import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Paper, Slider, IconButton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';

/**
 * A component that displays an audio waveform visualization
 * The waveform moves with the audio decibel levels
 */
const AudioWaveformVisualizer = ({ audioUrl, title }) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const isSetupRef = useRef(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Clean up function to properly dispose audio resources
  const cleanupAudio = () => {
    // Stop any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Disconnect and clean up audio nodes
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (err) {
        console.warn('Error disconnecting source:', err);
      }
      sourceRef.current = null;
    }
    
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (err) {
        console.warn('Error disconnecting analyser:', err);
      }
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (err) {
        console.warn('Error closing audio context:', err);
      }
      audioContextRef.current = null;
    }
    
    // Reset the setup flag
    isSetupRef.current = false;
  };

  // Initialize a new audio context and analyzer
  const initAudioContext = () => {
    // Clean up any existing audio context first
    cleanupAudio();
    
    // Create new audio context and analyzer
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
  };

  // Set up audio element and connect to analyzer when audio URL changes
  useEffect(() => {
    if (!audioUrl) return;
    
    // Reset state
    setIsPlaying(false);
    setAudioLoaded(false);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    
    // Initialize audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.crossOrigin = "anonymous"; // Important for CORS
      audioRef.current.load();
      
      // Set up event listeners
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current.duration);
        setAudioLoaded(true);
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio loading error:', e);
        setError('Failed to load audio file');
      };
    }
    
    return () => cleanupAudio();
  }, [audioUrl]);

  // Handle play button click - this is where we set up the audio context
  const setupAudioContext = async () => {
    // Only set up once
    if (isSetupRef.current) return true;
    
    try {
      // Initialize new audio context
      initAudioContext();
      
      // Resume audio context if needed
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Create and connect the source
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Mark as set up
      isSetupRef.current = true;
      return true;
    } catch (err) {
      console.error('Error setting up audio context:', err);
      setError(`Error setting up audio: ${err.message}`);
      return false;
    }
  };

  // Draw waveform visualization
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set line style
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff0000'; // Red color for the waveform
    
    // Draw waveform
    const barWidth = (width / dataArrayRef.current.length) * 2.5;
    let x = 0;
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const barHeight = dataArrayRef.current[i] / 2;
      
      // Draw the top part of the waveform
      if (i === 0) {
        ctx.moveTo(x, height / 2 - barHeight);
      } else {
        ctx.lineTo(x, height / 2 - barHeight);
      }
      
      x += barWidth;
    }
    
    // Draw the bottom part of the waveform (mirror of the top)
    x = width;
    for (let i = dataArrayRef.current.length - 1; i >= 0; i--) {
      const barHeight = dataArrayRef.current[i] / 2;
      ctx.lineTo(x, height / 2 + barHeight);
      x -= barWidth;
    }
    
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
    gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Stroke the outline
    ctx.stroke();
    
    // Continue animation if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  // Start/stop animation based on play state
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Update current time while playing
  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };
    
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Handle play/pause
  const togglePlay = async () => {
    if (!audioRef.current || !audioLoaded) return;
    
    try {
      // First time playing - set up audio context
      if (!isSetupRef.current) {
        const success = await setupAudioContext();
        if (!success) return;
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('Error playing audio:', err);
      setError(`Error playing audio: ${err.message}`);
    }
  };

  // Handle volume change
  const handleVolumeChange = (event, newValue) => {
    if (!audioRef.current) return;
    
    const volumeValue = newValue / 100;
    setVolume(volumeValue);
    audioRef.current.volume = volumeValue;
    
    if (volumeValue === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle time seek
  const handleTimeChange = (event, newValue) => {
    if (!audioRef.current) return;
    
    const timeValue = (newValue / 100) * duration;
    audioRef.current.currentTime = timeValue;
    setCurrentTime(timeValue);
  };

  // Format time in MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        bgcolor: '#121212', 
        color: 'white',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title || 'Audio Visualizer'}
      </Typography>
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box 
        sx={{ 
          width: '100%', 
          height: 150, 
          bgcolor: 'rgba(0,0,0,0.3)',
          borderRadius: 1,
          overflow: 'hidden',
          mb: 2
        }}
      >
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={150} 
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton 
          onClick={togglePlay} 
          disabled={!audioLoaded}
          sx={{ color: 'white' }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        
        <Typography variant="body2" sx={{ minWidth: 45 }}>
          {formatTime(currentTime)}
        </Typography>
        
        <Slider
          value={(currentTime / duration) * 100 || 0}
          onChange={handleTimeChange}
          disabled={!audioLoaded}
          sx={{ 
            mx: 2,
            color: '#ff0000',
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0px 0px 0px 8px rgba(255, 0, 0, 0.16)'
              }
            },
            '& .MuiSlider-rail': {
              opacity: 0.3,
            }
          }}
        />
        
        <Typography variant="body2" sx={{ minWidth: 45 }}>
          {formatTime(duration)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={toggleMute}
          disabled={!audioLoaded}
          sx={{ color: 'white' }}
        >
          {isMuted ? <VolumeOff /> : <VolumeUp />}
        </IconButton>
        
        <Slider
          value={isMuted ? 0 : volume * 100}
          onChange={handleVolumeChange}
          disabled={!audioLoaded}
          sx={{ 
            width: 100,
            ml: 1,
            color: '#ff0000',
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12
            }
          }}
        />
      </Box>
      
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </Paper>
  );
};

export default AudioWaveformVisualizer;
