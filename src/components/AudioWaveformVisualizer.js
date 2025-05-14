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
  const audioRipplesRef = useRef([]);
  const lastPlayingIntensitiesRef = useRef(null);
  
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
  }, [audioUrl]);

  // Handle play button click - this is where we set up the audio context
  const setupAudioContext = async () => {
    try {
      // If already set up, just return true
      if (isSetupRef.current && 
          audioContextRef.current && 
          audioContextRef.current.state !== 'closed' && 
          sourceRef.current) {
        
        // Just resume if suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        return true;
      }
      
      // Clean up any existing connections first
      cleanupAudio();
      
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

  /**
   * Draw modern 8-bit pixel style visualization with true ripple effects
   * 
   * The visualizer consists of these main parts:
   * 1. Core - The central pulsing circle that represents the beat
   * 2. Ripples - Waves of pixels that emanate outward from the center
   * 3. Pixels - Individual square elements that make up each ripple
   */
  const drawWaveform = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Configuration parameters - these could be exposed as props for customization
    const config = {
      // Core parameters
      coreSizeMin: 10,           // Smaller minimum size of the central core when quiet
      coreSizeMax: 28,           // Maximum size the core can pulse to (reduced to prevent too much growth)
      corePulseSpeed: 0.5,       // Further reduced pulse speed for more gentle animation when resting
      coreColorInner: 'rgba(255, 100, 100, 0.95)', // Inner core color (more opaque)
      coreColorOuter: 'rgba(255, 0, 0, 0.9)',      // Outer core color (more opaque)
      coreGlowColor: 'rgba(128, 0, 0, 0.2)',       // Core glow fade color
      coreGlowSize: 2.5,         // Increased aura size multiplier (was 1.5)
      
      // Ripple parameters - Redesigned for true outward-only motion
      maxRipples: 8,             // Increased for more visual richness
      rippleInitialSpeed: 2.5,   // Moderate initial speed for smooth motion
      rippleSpeedDecay: 0.99,    // Very slight speed decay for more consistent outward motion
      rippleLifespan: 180,       // Balanced lifespan for proper container coverage
      rippleSpawnRate: 0.3,      // Increased for more frequent ripples
      rippleMaxSize: Math.max(width, height) * 1.1, // Slightly beyond container to ensure full coverage
      
      // Modern ripple style parameters
      rippleStyle: 'smooth',     // New smooth style instead of pixelated
      rippleThickness: 2.0,      // Slightly thinner lines for more elegance
      rippleInitialOpacity: 0.7, // Starting opacity (will reach 1.0 then fade)
      rippleOpacityPeak: 0.25,   // Earlier peak for longer fade-out period
      rippleVariation: 0.15      // Slight variation in ripple characteristics
    };
    
    // Color parameters for ripples
    const baseColor = [255, 50, 50];  // Base RGB color
    const colorVariation = [0, 30, 20]; // How much color varies from inner to outer ripples
    
    // Calculate intensity based on audio data with frequency band analysis
    let intensity = 0;
    let bassIntensity = 0;
    let midIntensity = 0;
    let highIntensity = 0;
    let frequencyData = [];
    
    // Get frequency data if audio context is available
    if (isPlaying && analyserRef.current && dataArrayRef.current) {
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      frequencyData = Array.from(dataArrayRef.current);
      
      // Calculate intensity for different frequency bands
      // Bass: 0-120Hz (roughly first 10% of frequency data)
      const bassRange = Math.floor(frequencyData.length * 0.1);
      const bassSum = frequencyData.slice(0, bassRange).reduce((sum, val) => sum + val, 0);
      bassIntensity = bassSum / (bassRange * 255); // Normalize to 0-1
      
      // Mid: 120Hz-2kHz (roughly next 30% of frequency data)
      const midRange = Math.floor(frequencyData.length * 0.3);
      const midSum = frequencyData.slice(bassRange, bassRange + midRange).reduce((sum, val) => sum + val, 0);
      midIntensity = midSum / (midRange * 255); // Normalize to 0-1
      
      // High: 2kHz+ (roughly remaining 60% of frequency data)
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
    
    // 1. RIPPLE GENERATION - Create new ripples based on audio intensity
    
    // Only create ripples when playing and based on intensity thresholds
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
          speed: config.rippleSpeed * 1.2,
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
          speed: config.rippleSpeed * 1.5,
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
          speed: config.rippleSpeed * 0.8,
          thickness: config.rippleThickness * 1.4,
          frequencySnapshot: Array(frequencyData.length).fill(128), // Flat frequency response
          createdWhilePlaying: true
        });
      }
      
      // Limit the number of ripples for performance
      if (audioRipplesRef.current.length > config.maxRipples) {
        // Remove oldest ripples first
        audioRipplesRef.current = audioRipplesRef.current.slice(-config.maxRipples);
      }
    } else {
      // When paused, remove any ripples that were created while playing
      // This ensures no ripples appear when paused
      audioRipplesRef.current = audioRipplesRef.current.filter(ripple => !ripple.createdWhilePlaying);
    }
    
    // 2. RIPPLE DRAWING - Update and draw all active ripples
    
    // Update and draw existing ripples
    audioRipplesRef.current = audioRipplesRef.current.filter(ripple => {
      // Initialize ripple speed if not already set
      if (!ripple.currentSpeed) {
        ripple.currentSpeed = ripple.speed || config.rippleInitialSpeed;
      }
      
      // Apply speed decay over time for smoother, more artistic motion
      ripple.currentSpeed *= config.rippleSpeedDecay;
      
      // Update ripple size with decaying speed and intensity factor
      ripple.size += ripple.currentSpeed * (1 + ripple.intensity * 0.3);
      ripple.age++;
      
      // Calculate opacity based on age, max lifespan, and distance from center
      const maxAge = ripple.type === 'heartbeat' ? config.rippleLifespan * 1.5 : config.rippleLifespan;
      
      // Calculate normalized age (0 to 1)
      const normalizedAge = ripple.age / maxAge;
      
      // Calculate distance factor (how close the ripple is to the edge)
      const containerSize = Math.max(width, height);
      const maxDistance = containerSize * 0.95; // Use 95% of the container as max distance
      const distanceFactor = Math.min(1, ripple.size / maxDistance);
      
      // Calculate opacity based on age only (no peak that could cause visual reversal)
      // This creates a simple fade-out effect as the ripple ages
      let opacity = Math.max(0, 1 - (normalizedAge * 0.8)); // Linear fade out
      
      // Apply stronger distance-based fading as ripples approach the container edges
      // This ensures they fully disappear before hitting the actual boundary
      if (distanceFactor > 0.75) { // Start fading at 75% of container size
        const edgeFade = Math.max(0, 1 - ((distanceFactor - 0.75) / 0.25));
        // Apply exponential fade (squared) for faster disappearance at edges
        opacity *= edgeFade * edgeFade;
      }
      
      // Ensure ripples never appear to move back toward core by enforcing
      // that opacity can only decrease once it starts decreasing
      if (!ripple.maxOpacity || opacity > ripple.maxOpacity) {
        ripple.maxOpacity = opacity;
      } else {
        // Once we've hit peak opacity, never increase again (prevents visual reversal)
        opacity = Math.min(opacity, ripple.maxOpacity * 0.99); // Ensure continuous decrease
        ripple.maxOpacity *= 0.99; // Continuously decrease max opacity
      }
      
      // Only draw if visible and within bounds
      if (opacity > 0 && ripple.size < config.rippleMaxSize) {
        // Get ripple color (with type-specific enhancements)
        let rippleColor = ripple.color || baseColor;
        const thickness = ripple.thickness || config.rippleThickness;
        
        // Adjust color based on ripple type
        if (ripple.type === 'beat') {
          // Beat ripples are more red
          rippleColor = [
            Math.min(255, rippleColor[0] + 10),
            Math.max(0, rippleColor[1] - 20),
            Math.max(0, rippleColor[2] - 20)
          ];
        } else if (ripple.type === 'high') {
          // High frequency ripples shift toward yellow-orange
          rippleColor = [
            Math.min(255, rippleColor[0]),
            Math.min(255, rippleColor[1] + 50),
            Math.max(0, rippleColor[2])
          ];
        } else if (ripple.type === 'heartbeat') {
          // Heartbeat ripples are deeper red
          rippleColor = [
            Math.min(255, rippleColor[0] - 20),
            Math.max(0, rippleColor[1]),
            Math.max(0, rippleColor[2])
          ];
        }
        
        // Draw a perfect circle for the ripple - no variations
        ctx.beginPath();
        ctx.arc(centerX, centerY, ripple.size, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(${rippleColor[0]}, ${rippleColor[1]}, ${rippleColor[2]}, ${opacity})`;
        ctx.lineWidth = thickness;
        ctx.stroke();
        
        // Add subtle frequency-based variation to the ripple
        if (ripple.frequencySnapshot && ripple.frequencySnapshot.length > 0) {
          // Draw frequency-responsive accents around the ripple
          const numAccents = 12; // Number of accent points around the circle
          
          for (let i = 0; i < numAccents; i++) {
            const angle = (i / numAccents) * 2 * Math.PI;
            
            // Get frequency data for this angle
            const freqIndex = Math.floor((i / numAccents) * ripple.frequencySnapshot.length);
            const freqValue = ripple.frequencySnapshot[freqIndex] || 0;
            const freqRatio = freqValue / 255;
            
            if (freqRatio > 0.5) { // Only draw accents for stronger frequencies
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
    
    // 3. CORE - Draw a central circle that pulses dramatically with bass beats
    
    // Calculate core size with gentler pulse when at rest
    let bassPulse, corePulse;
    if (isPlaying) {
      // More dramatic pulse when playing
      bassPulse = bassIntensity * 0.7 + Math.sin(Date.now() / 200) * 0.1;
      corePulse = intensity * 0.3 + bassPulse;
    } else {
      // Gentler pulse when paused/resting
      bassPulse = Math.sin(Date.now() / 800) * config.corePulseSpeed * 0.5;
      corePulse = 0.3 + bassPulse * 0.2; // Smaller range of motion when paused
    }
    
    const coreSize = config.coreSizeMin + (config.coreSizeMax - config.coreSizeMin) * corePulse;
    
    // Create a gradient for the core with smoother edges
    const coreGradient = ctx.createRadialGradient(
      centerX, centerY, coreSize * 0.2, // Smaller inner radius for more vibrant center
      centerX, centerY, coreSize
    );
    
    // Add color stops with slight variation based on intensity
    coreGradient.addColorStop(0, config.coreColorInner);
    coreGradient.addColorStop(0.7, config.coreColorOuter); // Moved from 1.0 to 0.7 for softer edge
    coreGradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)'); // Semi-transparent edge for smoother look
    
    // Draw the core
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreSize, 0, 2 * Math.PI);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    // Add a glow effect behind the core - smaller when paused
    const glowSizeMultiplier = isPlaying ? config.coreGlowSize : (config.coreGlowSize * 0.6); // Reduce aura when paused
    const glowSize = coreSize * glowSizeMultiplier;
    const glowIntensity = isPlaying ? (0.15 + (bassIntensity * 0.2)) : 0.1; // Dimmer when paused
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 50, 0, ${glowIntensity})`;
    ctx.fill();
    
    // Continue animation if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  };

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
    const animate = () => {
      if (canvasRef.current) {
        drawWaveform();
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    console.log('Animation started, isPlaying:', isPlaying);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        console.log('Animation stopped');
      }
    };
  }, [isPlaying]); // Re-run when isPlaying changes

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

  // Add an effect to initialize the canvas when the component mounts
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      
      // Set canvas dimensions to match container exactly
      if (container) {
        // Use the full container dimensions without padding reduction
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
  }, []);
  
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
