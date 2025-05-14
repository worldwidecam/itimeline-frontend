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
      coreSizeMin: 12,           // Minimum size of the central core when quiet
      coreSizeMax: 28,           // Maximum size the core can pulse to
      coreColorInner: 'rgba(255, 100, 100, 0.9)',  // Inner core color
      coreColorOuter: 'rgba(255, 0, 0, 0.8)',      // Outer core color
      coreGlowColor: 'rgba(128, 0, 0, 0)',         // Core glow fade color
      
      // Ripple parameters
      maxRipples: 12,            // Maximum number of active ripple waves - INCREASED
      rippleSpeed: 1.8,          // Speed at which ripples move outward - INCREASED
      rippleLifespan: 150,       // How long ripples last before fading (frames) - INCREASED
      rippleSpawnRate: 0.35,     // Chance of spawning a new ripple (0-1) - INCREASED
      rippleMaxSize: Math.min(width, height) * 0.45,  // Maximum ripple size
      
      // Pixel parameters
      pixelSize: 8,              // Base size of each pixel - DOUBLED
      pixelGap: 1.2,             // Gap between pixels (lower = more dense) - DECREASED
      pixelVariation: 0.5,       // How much pixels vary in size based on frequency - INCREASED
      
      // Color parameters
      baseColor: [255, 50, 50],  // Base RGB color
      colorVariation: [0, 30, 20] // How much color varies from inner to outer ripples
    };
    
    // Calculate intensity based on audio data with frequency band analysis
    let intensity = 0;
    let bassIntensity = 0;
    let midIntensity = 0;
    let highIntensity = 0;
    let frequencyData = [];
    
    if (analyserRef.current && dataArrayRef.current) {
      // Get frequency data (whether playing or paused)
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      frequencyData = [...dataArrayRef.current];
      
      // Split frequency data into bass, mid, and high ranges
      // For a typical 128-bin array:
      // Bass: 0-15 (low frequencies)
      // Mid: 16-63 (mid frequencies)
      // High: 64-127 (high frequencies)
      const bassRange = frequencyData.slice(0, 16);
      const midRange = frequencyData.slice(16, 64);
      const highRange = frequencyData.slice(64);
      
      // Calculate average intensity for each range
      const calcAverage = (arr) => arr.reduce((sum, val) => sum + val, 0) / arr.length / 255;
      
      bassIntensity = calcAverage(bassRange);
      midIntensity = calcAverage(midRange);
      highIntensity = calcAverage(highRange);
      
      // Overall intensity weighted toward bass for more dramatic effect
      intensity = (bassIntensity * 0.5) + (midIntensity * 0.3) + (highIntensity * 0.2);
      
      // If paused, gradually reduce intensity values
      if (!isPlaying && lastPlayingIntensitiesRef.current) {
        // Use last playing values but decay them slowly over time
        intensity = lastPlayingIntensitiesRef.current.intensity * 0.95;
        bassIntensity = lastPlayingIntensitiesRef.current.bassIntensity * 0.95;
        midIntensity = lastPlayingIntensitiesRef.current.midIntensity * 0.95;
        highIntensity = lastPlayingIntensitiesRef.current.highIntensity * 0.95;
        
        // Store the decayed values for next frame
        lastPlayingIntensitiesRef.current = {
          intensity: intensity,
          bassIntensity: bassIntensity,
          midIntensity: midIntensity,
          highIntensity: highIntensity
        };
      } else if (isPlaying) {
        // Store current intensities when playing for use when paused
        lastPlayingIntensitiesRef.current = {
          intensity: intensity,
          bassIntensity: bassIntensity,
          midIntensity: midIntensity,
          highIntensity: highIntensity
        };
      }
    } else {
      // Fallback if audio context not available
      frequencyData = Array(128).fill(0);
      intensity = 0.1;
      bassIntensity = 0.05;
      midIntensity = 0.05;
      highIntensity = 0.05;
    }
    
    // Only add debug ripples when actually playing (not just when isPlaying state is true)
    // This ensures ripples are tied to actual audio decibels
    if (isPlaying && audioRef.current && !audioRef.current.paused) {
      // Add a debug ripple at a reasonable rate - not too frequent
      if (Math.random() < 0.05) { // Reduced from 0.1 to 0.05 for fewer ripples
        audioRipplesRef.current.push({
          size: config.coreSizeMax * 2, // Start larger for visibility
          age: 0,
          intensity: 1.0, // Maximum intensity
          frequencySnapshot: [...dataArrayRef.current], // Use actual audio data
          type: 'debug',
          pixelSize: 10, // Large pixels for visibility but not overwhelming
          pixelGap: 1.2, // Slightly more gap
          speed: 1.8 // Fast but not too fast
        });
        console.log('Added debug ripple based on audio, count:', audioRipplesRef.current.length);
      }
    }
    
    // Generate ripples based on frequency bands or a regular heartbeat when playing
    // Only generate ripples when audio is actually playing (not paused)
    if (isPlaying && audioRef.current && !audioRef.current.paused) {
      // Ensure we generate at least some ripples even with low audio levels
      // This creates a "heartbeat" effect to ensure ripples are always visible
      const heartbeatRipple = Math.random() < 0.05; // Regular heartbeat ripples
      
      // 1. Bass-triggered ripples (larger, fewer pixels)
      // Much lower threshold to ensure ripples appear
      const bassTrigger = bassIntensity > 0.15 || (bassIntensity > 0.05 && Math.random() < bassIntensity * 2) || heartbeatRipple;
      if (bassTrigger && audioRipplesRef.current.length < config.maxRipples) {
        // Create a bass ripple - larger, stronger, fewer pixels
        const bassRipple = {
          size: config.coreSizeMax * 1.3, // Start larger
          age: 0,
          intensity: Math.max(0.3, 0.5 + (bassIntensity * 0.8)), // Ensure minimum intensity
          frequencySnapshot: [...frequencyData],
          type: 'bass',
          pixelSize: config.pixelSize * 1.5, // Larger pixels
          pixelGap: config.pixelGap * 2, // More space between pixels
          speed: config.rippleSpeed * 1.2 // Move faster
        };
        audioRipplesRef.current.push(bassRipple);
        
        // Debug log to verify ripples are being created
        console.log('Created bass ripple, total ripples:', audioRipplesRef.current.length);
      }
      
      // 2. Mid-range triggered ripples (medium size, normal pixels)
      // Lower threshold to ensure ripples appear
      const midTrigger = midIntensity > 0.1 || (Math.random() < config.rippleSpawnRate * 3 * midIntensity) || heartbeatRipple;
      if (midTrigger && audioRipplesRef.current.length < config.maxRipples) {
        // Create a mid-range ripple - standard size and density
        const midRipple = {
          size: config.coreSizeMax * 1.2,
          age: 0,
          intensity: Math.max(0.2, 0.3 + (midIntensity * 0.7)), // Ensure minimum intensity
          frequencySnapshot: [...frequencyData],
          type: 'mid',
          pixelSize: config.pixelSize, // Standard pixel size
          pixelGap: config.pixelGap, // Standard gap
          speed: config.rippleSpeed
        };
        audioRipplesRef.current.push(midRipple);
        
        // Debug log to verify ripples are being created
        console.log('Created mid ripple, total ripples:', audioRipplesRef.current.length);
      }
      
      // 3. High-frequency triggered ripples (smaller, many tiny pixels)
      // Lower threshold to ensure ripples appear
      const highTrigger = highIntensity > 0.08 || (Math.random() < config.rippleSpawnRate * 4 * highIntensity) || heartbeatRipple;
      if (highTrigger && audioRipplesRef.current.length < config.maxRipples) {
        // Create a high-frequency ripple - smaller, denser pixels
        const highRipple = {
          size: config.coreSizeMax * 1.1, // Start smaller
          age: 0,
          intensity: Math.max(0.15, 0.2 + (highIntensity * 0.8)), // Ensure minimum intensity
          frequencySnapshot: [...frequencyData],
          type: 'high',
          pixelSize: config.pixelSize * 0.7, // Smaller pixels
          pixelGap: config.pixelGap * 0.7, // Less space between pixels (more dense)
          speed: config.rippleSpeed * 0.9 // Move slightly slower
        };
        audioRipplesRef.current.push(highRipple);
        
        // Debug log to verify ripples are being created
        console.log('Created high ripple, total ripples:', audioRipplesRef.current.length);
      }
      
      // Force at least one ripple if none were created and we're playing
      if (audioRipplesRef.current.length === 0 && isPlaying) {
        const forcedRipple = {
          size: config.coreSizeMax * 1.2,
          age: 0,
          intensity: 0.3,
          frequencySnapshot: Array(128).fill(50), // Simple default frequency data
          type: 'forced',
          pixelSize: config.pixelSize,
          pixelGap: config.pixelGap,
          speed: config.rippleSpeed
        };
        audioRipplesRef.current.push(forcedRipple);
        console.log('Created forced ripple');
      }
    }
    
    // Update and draw existing ripples
    audioRipplesRef.current = audioRipplesRef.current.filter(ripple => {
      // Update ripple using its specific speed (or default if not specified)
      const rippleSpeed = ripple.speed || config.rippleSpeed;
      ripple.size += rippleSpeed * (1 + ripple.intensity * 0.5);
      ripple.age++;
      
      // Calculate opacity based on age (fade out as it gets older)
      // Make ripples fade out faster when audio is paused
      const lifeProgress = ripple.age / config.rippleLifespan;
      // Faster fade-out when paused
      const fadeMultiplier = (!isPlaying || (audioRef.current && audioRef.current.paused)) ? 1.5 : 1.0;
      const opacity = Math.max(0, 1 - (lifeProgress * fadeMultiplier));
      
      // Only draw if still visible
      if (opacity > 0) {
        // Use ripple-specific pixel properties or defaults
        const pixelSize = ripple.pixelSize || config.pixelSize;
        const pixelGap = ripple.pixelGap || config.pixelGap;
        
        // Calculate how many "pixels" to draw around the circle
        const circumference = 2 * Math.PI * ripple.size;
        const numPixels = Math.floor(circumference / (pixelSize * pixelGap));
        
        // Draw pixelated ripple with natural variations
        for (let p = 0; p < numPixels; p++) {
          // Calculate angle for this pixel
          const angle = (p / numPixels) * 2 * Math.PI;
          
          // Get frequency data for this angle from the ripple's snapshot
          const dataIndex = Math.floor((p / numPixels) * ripple.frequencySnapshot.length);
          const freqIntensity = ripple.frequencySnapshot[dataIndex] / 255;
          
          // Add variation to make ripples look more natural and less perfect
          // This helps avoid visible "breaks" in the circle
          
          // Get the ripple-specific pixel size or use default
          const basePixelSize = ripple.pixelSize || config.pixelSize;
          
          // 1. Vary the pixel size based on angle and frequency
          const angleFactor = 0.5 + Math.sin(angle * 3) * 0.5; // Creates variation around the circle
          const pixelSizeAdjusted = basePixelSize * (1 + (freqIntensity * angleFactor) * config.pixelVariation);
          
          // 2. Calculate color based on ripple type and age
          // Different colors for different frequency types
          const ageProgress = ripple.age / config.rippleLifespan;
          let red = config.baseColor[0];
          let green, blue;
          
          if (ripple.type === 'bass') {
            // Bass ripples: more red/orange
            green = Math.floor(30 + (ageProgress * 70));
            blue = Math.floor(10 + (ageProgress * 20));
          } else if (ripple.type === 'high') {
            // High frequency ripples: more pink/purple
            green = Math.floor(20 + (ageProgress * 30));
            blue = Math.floor(50 + (ageProgress * 70));
          } else {
            // Mid/default ripples: standard red to orange
            green = Math.floor(config.baseColor[1] + (ageProgress + Math.sin(angle * 2) * 0.1) * config.colorVariation[1] * 2);
            blue = Math.floor(config.baseColor[2] + (ageProgress + Math.cos(angle * 2) * 0.1) * config.colorVariation[2]);
          }
          
          // 3. Add significant position variation based on angle and frequency
          // This creates a more organic, less perfect circle shape
          const angleVariation = 0.15 + Math.sin(angle * 4) * 0.1; // Different variation at different angles
          const variation = ripple.size * angleVariation * (0.5 + freqIntensity * 0.8);
          
          // Calculate final position with natural variation
          const x = centerX + Math.cos(angle) * (ripple.size + variation);
          const y = centerY + Math.sin(angle) * (ripple.size + variation);
          
          // 4. Vary opacity slightly based on angle to create subtle density differences
          // Increase base opacity to make pixels more visible
          const angleOpacity = 0.9 + Math.sin(angle * 6) * 0.1;
          
          // Draw the pixel as a square for 8-bit effect
          // Use MUCH higher opacity to make pixels more visible
          ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${Math.min(1.0, opacity * angleOpacity * 2.0)})`;
          
          // Draw slightly larger pixels to ensure visibility
          const renderSize = pixelSizeAdjusted * 1.2;
          ctx.fillRect(
            x - renderSize / 2, 
            y - renderSize / 2, 
            renderSize, 
            renderSize
          );
        }
        
        return true; // Keep the ripple
      }
      
      return false; // Remove the ripple if fully faded
    });
    
    // 3. CORE - Draw a central circle that pulses dramatically with bass beats
    
    // Calculate core size with extra emphasis on bass
    // Bass hits cause dramatic expansion of the core
    const bassPulse = Math.pow(bassIntensity, 1.5) * 2; // Non-linear response to bass
    
    // ALWAYS ensure the core has a minimum size, even when no audio is playing
    // This guarantees the core is visible at all times
    const centerSize = Math.max(config.coreSizeMin * 1.5, 
                      config.coreSizeMin + 
                      ((config.coreSizeMax - config.coreSizeMin) * intensity) + 
                      (bassPulse * 15)); // Dramatic expansion on bass hits
    
    // Create a more dynamic gradient based on frequency intensities
    const innerRadius = Math.max(1, centerSize * 0.3);
    const outerRadius = centerSize * (1.5 + bassIntensity * 0.5);
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, outerRadius
    );
    
    // Dynamic colors based on frequency content
    // ALWAYS ensure vibrant colors even when no audio is playing
    const innerRed = 255;
    const innerGreen = Math.max(50, 50 + Math.floor(bassIntensity * 50));
    const innerBlue = Math.max(50, 50 + Math.floor(highIntensity * 50));
    
    // ALWAYS ensure high opacity for visibility
    const innerAlpha = Math.max(0.95, 0.9 + (bassIntensity * 0.1));
    const outerAlpha = Math.max(0.9, 0.8 + (bassIntensity * 0.2));
    
    gradient.addColorStop(0, `rgba(${innerRed}, ${innerGreen}, ${innerBlue}, ${innerAlpha})`);
    gradient.addColorStop(0.7, `rgba(255, ${Math.floor(30 + bassIntensity * 30)}, 0, ${outerAlpha})`);
    gradient.addColorStop(1, 'rgba(128, 0, 0, 0)');
    
    // Draw the core with a slight wobble effect on bass hits
    ctx.fillStyle = gradient;
    ctx.beginPath();
    
    if (bassIntensity > 0.4 && isPlaying) {
      // Add wobble effect to the core on strong bass hits
      const wobbleAmount = bassIntensity * 3;
      const segments = 12;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wobble = 1 + (Math.sin(angle * 3 + Date.now() / 100) * wobbleAmount * 0.1);
        const radius = centerSize * wobble;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      // Regular circle for normal playback or when paused
      ctx.arc(centerX, centerY, centerSize, 0, 2 * Math.PI);
    }
    
    ctx.fill();
    
    // Add a highlight/glow effect on strong bass hits
    if (bassIntensity > 0.5 && isPlaying) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerSize * 1.2, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 50, 0, ${bassIntensity * 0.2})`;
      ctx.fill();
    }
    
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
      
      // Set canvas dimensions to match container
      if (container) {
        canvas.width = container.clientWidth - 32; // Account for padding
        canvas.height = 200; // Fixed height for visualization
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
