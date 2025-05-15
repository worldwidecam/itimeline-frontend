import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Slider, IconButton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';

/**
 * A component that displays an audio waveform visualization
 * The waveform moves with the audio decibel levels
 */
const AudioWaveformVisualizer = ({ audioUrl, title }) => {
  // Refs for DOM elements and audio processing
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const isSetupRef = useRef(false);
  const audioRipplesRef = useRef([]);
  const lastPlayingIntensitiesRef = useRef(null);
  
  // Component state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the visualization configuration
  const config = useMemo(() => ({
    // Core parameters
    coreSizeMin: 10,
    coreSizeMax: 28,
    corePulseSpeed: 0.5,
    coreColorInner: 'rgba(255, 100, 100, 0.95)',
    coreColorOuter: 'rgba(255, 0, 0, 0.9)',
    coreGlowColor: 'rgba(128, 0, 0, 0.2)',
    coreGlowSize: 2.5,
    
    // Ripple parameters
    maxRipples: 8,
    rippleInitialSpeed: 2.5,
    rippleSpeedDecay: 0.99,
    rippleLifespan: 180,
    rippleSpawnRate: 0.3,
    rippleMaxSize: 1000, // Will be updated based on canvas size
    
    // Style parameters
    rippleStyle: 'smooth',
    rippleThickness: 2.0,
    rippleInitialOpacity: 0.7,
    rippleOpacityPeak: 0.25,
    rippleVariation: 0.15
  }), []);
  
  // Memoize color parameters
  const baseColor = useMemo(() => [255, 50, 50], []); // Base RGB color
  const colorVariation = useMemo(() => [0, 30, 20], []); // Color variation

  // Clean up audio resources
  const cleanupAudio = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
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
    
    isSetupRef.current = false;
  }, []);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    cleanupAudio();
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
  }, [cleanupAudio]);

  // Set up audio context and connect nodes
  const setupAudioContext = useCallback(async () => {
    try {
      if (isSetupRef.current && 
          audioContextRef.current && 
          audioContextRef.current.state !== 'closed' && 
          sourceRef.current) {
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        return true;
      }
      
      cleanupAudio();
      initAudioContext();
      
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (audioContextRef.current && audioRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        
        isSetupRef.current = true;
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error setting up audio context:', err);
      setError(`Error setting up audio: ${err.message}`);
      return false;
    }
  }, [cleanupAudio, initAudioContext]);

  // Draw the waveform visualization
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate intensity based on audio data
    let intensity = 0;
    let bassIntensity = 0;
    let midIntensity = 0;
    let highIntensity = 0;
    let frequencyData = [];
    
    // Get frequency data if audio context is available
    if (isPlaying && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      frequencyData = Array.from(dataArrayRef.current);
      
      // Calculate intensity for different frequency bands
      const bassRange = Math.floor(frequencyData.length * 0.1);
      const bassSum = frequencyData.slice(0, bassRange).reduce((sum, val) => sum + val, 0);
      bassIntensity = bassSum / (bassRange * 255); // Normalize to 0-1
      
      const midRange = Math.floor(frequencyData.length * 0.3);
      const midSum = frequencyData.slice(bassRange, bassRange + midRange).reduce((sum, val) => sum + val, 0);
      midIntensity = midSum / (midRange * 255); // Normalize to 0-1
      
      const highRange = frequencyData.length - bassRange - midRange;
      const highSum = frequencyData.slice(bassRange + midRange).reduce((sum, val) => sum + val, 0);
      highIntensity = highSum / (highRange * 255); // Normalize to 0-1
      
      // Overall intensity (weighted to emphasize bass)
      intensity = (bassIntensity * 0.5) + (midIntensity * 0.3) + (highIntensity * 0.2);
      
      // Snapshot the current intensities for ripple creation
      lastPlayingIntensitiesRef.current = {
        intensity,
        bassIntensity,
        midIntensity,
        highIntensity,
        frequencyData: [...frequencyData]
      };
    } else {
      // Fallback if audio context not available
      frequencyData = Array(128).fill(0);
      intensity = 0.1;
      bassIntensity = 0.05;
      midIntensity = 0.05;
      highIntensity = 0.05;
    }
    
    // RIPPLE GENERATION - Create new ripples based on audio intensity
    if (isPlaying) {
      // Create a beat ripple when bass exceeds threshold
      if (bassIntensity > 0.5 && Math.random() < config.rippleSpawnRate * 2) {
        // Beat-based ripple (red)
        audioRipplesRef.current.push({
          size: config.coreSizeMax * 1.05,
          age: 0,
          intensity: bassIntensity,
          type: 'beat',
          color: [255, 0, 0],
          speed: config.rippleInitialSpeed * 1.2,
          thickness: config.rippleThickness * 1.2,
          frequencySnapshot: [...frequencyData],
          createdWhilePlaying: true
        });
      }
      
      // Create a high-frequency ripple when high frequencies exceed threshold
      if (highIntensity > 0.6 && Math.random() < config.rippleSpawnRate) {
        // High-frequency ripple (orange-yellow)
        audioRipplesRef.current.push({
          size: config.coreSizeMax * 1.05,
          age: 0,
          intensity: highIntensity,
          type: 'high',
          color: [255, 150, 0],
          speed: config.rippleInitialSpeed * 1.5,
          thickness: config.rippleThickness * 0.8,
          frequencySnapshot: [...frequencyData],
          createdWhilePlaying: true
        });
      }
      
      // Create a heartbeat ripple periodically regardless of audio
      if (Math.random() < 0.01) {
        // Heartbeat ripple (deep red)
        audioRipplesRef.current.push({
          size: config.coreSizeMax * 1.05,
          age: 0,
          intensity: 0.7,
          type: 'heartbeat',
          color: [180, 0, 0],
          speed: config.rippleInitialSpeed * 0.8,
          thickness: config.rippleThickness * 1.4,
          frequencySnapshot: Array(frequencyData.length).fill(128), // Flat frequency response
          createdWhilePlaying: true
        });
      }
      
      // Limit the number of ripples for performance
      if (audioRipplesRef.current.length > config.maxRipples) {
        audioRipplesRef.current = audioRipplesRef.current.slice(-config.maxRipples);
      }
    } else {
      // When paused, remove any ripples that were created while playing
      audioRipplesRef.current = audioRipplesRef.current.filter(ripple => !ripple.createdWhilePlaying);
    }
    
    // RIPPLE DRAWING - Update and draw all active ripples
    audioRipplesRef.current = audioRipplesRef.current.filter(ripple => {
      // Initialize ripple speed if not already set
      if (!ripple.currentSpeed) {
        ripple.currentSpeed = ripple.speed || config.rippleInitialSpeed;
      }
      
      // Apply speed decay over time for smoother motion
      ripple.currentSpeed *= config.rippleSpeedDecay;
      
      // Update ripple size with decaying speed and intensity factor
      ripple.size += ripple.currentSpeed * (1 + ripple.intensity * 0.3);
      ripple.age++;
      
      // Calculate opacity based on age and max lifespan
      const maxAge = ripple.type === 'heartbeat' ? config.rippleLifespan * 1.5 : config.rippleLifespan;
      const normalizedAge = ripple.age / maxAge;
      
      // Calculate distance factor (how close the ripple is to the edge)
      const containerSize = Math.max(width, height);
      const maxDistance = containerSize * 0.95;
      const distanceFactor = Math.min(1, ripple.size / maxDistance);
      
      // Calculate opacity with linear fade out
      let opacity = Math.max(0, 1 - (normalizedAge * 0.8));
      
      // Apply stronger distance-based fading as ripples approach the edges
      if (distanceFactor > 0.75) {
        const edgeFade = Math.max(0, 1 - ((distanceFactor - 0.75) / 0.25));
        opacity *= edgeFade * edgeFade;
      }
      
      // Ensure ripples never appear to move back toward core
      if (!ripple.maxOpacity || opacity > ripple.maxOpacity) {
        ripple.maxOpacity = opacity;
      } else {
        opacity = Math.min(opacity, ripple.maxOpacity * 0.99);
        ripple.maxOpacity *= 0.99;
      }
      
      // Only draw if visible and within bounds
      if (opacity > 0 && ripple.size < config.rippleMaxSize) {
        // Get ripple color with type-specific enhancements
        let rippleColor = ripple.color || baseColor;
        const thickness = ripple.thickness || config.rippleThickness;
        
        // Adjust color based on ripple type
        if (ripple.type === 'beat') {
          rippleColor = [
            Math.min(255, rippleColor[0] + 10),
            Math.max(0, rippleColor[1] - 20),
            Math.max(0, rippleColor[2] - 20)
          ];
        } else if (ripple.type === 'high') {
          rippleColor = [
            Math.min(255, rippleColor[0]),
            Math.min(255, rippleColor[1] + 50),
            Math.max(0, rippleColor[2])
          ];
        } else if (ripple.type === 'heartbeat') {
          rippleColor = [
            Math.min(255, rippleColor[0] - 20),
            Math.max(0, rippleColor[1]),
            Math.max(0, rippleColor[2])
          ];
        }
        
        // Draw the ripple circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, ripple.size, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(${rippleColor[0]}, ${rippleColor[1]}, ${rippleColor[2]}, ${opacity})`;
        ctx.lineWidth = thickness;
        ctx.stroke();
        
        // Add subtle frequency-based variation to the ripple
        if (ripple.frequencySnapshot && ripple.frequencySnapshot.length > 0) {
          // Draw frequency-responsive accents around the ripple
          const numAccents = 12;
          
          for (let i = 0; i < numAccents; i++) {
            const angle = (i / numAccents) * 2 * Math.PI;
            
            // Get frequency data for this angle
            const freqIndex = Math.floor((i / numAccents) * ripple.frequencySnapshot.length);
            const freqValue = ripple.frequencySnapshot[freqIndex] || 0;
            const freqRatio = freqValue / 255;
            
            if (freqRatio > 0.5) {
              const accentSize = thickness * 1.5 * freqRatio;
              const x = centerX + Math.cos(angle) * ripple.size;
              const y = centerY + Math.sin(angle) * ripple.size;
              
              // Draw a small glow at this point
              const glow = ctx.createRadialGradient(x, y, 0, x, y, accentSize * 2);
              glow.addColorStop(0, `rgba(${rippleColor[0]}, ${rippleColor[1]}, ${rippleColor[2]}, ${opacity})`);
              glow.addColorStop(1, `rgba(${rippleColor[0]}, ${rippleColor[1]}, ${rippleColor[2]}, 0)`);
              
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(x, y, accentSize * 2, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
        
        return true; // Keep the ripple
      }
      
      return false; // Remove the ripple if fully faded
    });
    
    // CORE - Draw a central circle that pulses with bass beats
    let bassPulse, corePulse;
    if (isPlaying) {
      // More dramatic pulse when playing
      bassPulse = bassIntensity * 0.7 + Math.sin(Date.now() / 200) * 0.1;
      corePulse = intensity * 0.3 + bassPulse;
    } else {
      // Gentler pulse when paused/resting
      bassPulse = Math.sin(Date.now() / 800) * config.corePulseSpeed * 0.5;
      corePulse = 0.3 + bassPulse * 0.2;
    }
    
    const coreSize = config.coreSizeMin + (config.coreSizeMax - config.coreSizeMin) * corePulse;
    
    // Create a gradient for the core with smoother edges
    const coreGradient = ctx.createRadialGradient(
      centerX, centerY, coreSize * 0.2,
      centerX, centerY, coreSize
    );
    
    // Add color stops with slight variation based on intensity
    coreGradient.addColorStop(0, config.coreColorInner);
    coreGradient.addColorStop(0.7, config.coreColorOuter);
    coreGradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)');
    
    // Draw the core
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreSize, 0, 2 * Math.PI);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    // Add a glow effect behind the core
    const glowSizeMultiplier = isPlaying ? config.coreGlowSize : (config.coreGlowSize * 0.6);
    const glowSize = coreSize * glowSizeMultiplier;
    const glowIntensity = isPlaying ? (0.15 + (bassIntensity * 0.2)) : 0.1;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 50, 0, ${glowIntensity})`;
    ctx.fill();
    
    // Continue animation if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  }, [isPlaying, config, baseColor]);

  // Start the animation loop
  const startAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const animate = () => {
      drawWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  }, [drawWaveform]);

  // Handle play/pause button click
  const handlePlayPause = useCallback(async () => {
    if (!audioRef.current || !audioLoaded) return;
    
    try {
      if (isPlaying) {
        // Pause the audio
        audioRef.current.pause();
        setIsPlaying(false);
        
        // Pause the audio context if it exists
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          await audioContextRef.current.suspend();
        }
      } else {
        // Set up audio context if not already done
        const success = await setupAudioContext();
        if (!success) return;
        
        // Play the audio
        await audioRef.current.play();
        setIsPlaying(true);
        
        // Start the visualization
        startAnimation();
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
      setError(`Playback error: ${err.message}`);
    }
  }, [isPlaying, audioLoaded, setupAudioContext, startAnimation]);

  // Handle volume change
  const handleVolumeChange = useCallback((event, newValue) => {
    setVolume(newValue / 100);
    if (audioRef.current) {
      audioRef.current.volume = newValue / 100;
    }
    // Unmute if volume is changed manually
    if (isMuted && newValue > 0) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    setIsMuted(prevMuted => {
      const newMuted = !prevMuted;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  // Handle seek (time slider change)
  const handleSeek = useCallback((event, newValue) => {
    if (!audioRef.current) return;
    
    const timeValue = (newValue / 100) * duration;
    audioRef.current.currentTime = timeValue;
    setCurrentTime(timeValue);
  }, [duration]);

  // Format time in MM:SS format
  const formatTime = useCallback((time) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Update the rippleMaxSize when canvas dimensions change
  useEffect(() => {
    if (canvasRef.current) {
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      config.rippleMaxSize = Math.max(width, height) * 1.1;
    }
  }, [config]);

  // Set up audio element and connect to analyzer when audio URL changes
  useEffect(() => {
    if (!audioUrl) return;
    
    // Reset state
    setIsPlaying(false);
    setAudioLoaded(false);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    
    // Clean up any existing audio context and connections
    cleanupAudio();
    
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
  }, [audioUrl, cleanupAudio]);

  // Keep animation running and react to isPlaying changes
  useEffect(() => {
    // Make sure canvas is properly sized to its container
    if (canvasRef.current) {
      const container = canvasRef.current.parentElement;
      if (container) {
        canvasRef.current.width = container.clientWidth;
        canvasRef.current.height = container.clientHeight;
        console.log(`Canvas sized to ${canvasRef.current.width}x${canvasRef.current.height}`);
      }
    }
    
    // Start animation loop
    startAnimation();
    console.log('Animation started, isPlaying:', isPlaying);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        console.log('Animation stopped');
      }
    };
  }, [isPlaying, startAnimation]);

  // Update current time during playback - optimized with throttling
  useEffect(() => {
    // Create a throttled update function to reduce state updates
    let lastUpdateTime = 0;
    const throttleInterval = 250; // Update at most every 250ms
    
    const updateTime = () => {
      const now = Date.now();
      if (now - lastUpdateTime > throttleInterval) {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          setCurrentTime(audioRef.current.currentTime);
        }
        lastUpdateTime = now;
      }
    };
    
    // Add timeupdate event listener for more accurate updates
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', updateTime);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateTime);
      }
    };
  }, []);

  // Initialize the canvas when the component mounts
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      
      // Set canvas dimensions to match container exactly
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        console.log(`Canvas initialized with size: ${canvas.width}x${canvas.height}`);
        
        // Draw initial state to ensure something is visible
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw a visible core
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // Create a gradient for the core
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 5,
            centerX, centerY, 30
          );
          
          gradient.addColorStop(0, 'rgba(255, 50, 50, 0.95)');
          gradient.addColorStop(0.7, 'rgba(255, 30, 0, 0.9)');
          gradient.addColorStop(1, 'rgba(128, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
          ctx.fill();
          
          console.log('Initial core drawn on canvas');
        }
      }
    }
    
    // Handle component unmount - ensure all resources are properly cleaned up
    return cleanupAudio;
  }, [cleanupAudio]);

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
          height: 180, 
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
          onClick={handlePlayPause} 
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
          onChange={handleSeek}
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
          onClick={handleMuteToggle}
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
