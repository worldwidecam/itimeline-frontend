import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { forwardRef } from 'react';
import { Box, Typography, Paper, Slider, IconButton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

/**
 * A component that displays an audio waveform visualization
 * The waveform moves with the audio decibel levels
 */
const AudioWaveformVisualizer = forwardRef(({ audioUrl, title, previewMode = false, showTitle = true }, ref) => {
  // Get the current theme mode
  const { isDarkMode } = useTheme();
  // Refs for DOM elements and audio processing
  const canvasRef = useRef(null);
  const lastRippleTimeRef = useRef({
    low: 0,
    mid: 0,
    high: 0
  });
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const isSetupRef = useRef(false);
  const audioRipplesRef = useRef([]);
  const lastPlayingIntensitiesRef = useRef(null);
  const lastGlowMultiplierRef = useRef(1.0); // Track glow size for smooth transitions
  
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
    coreSizeMax: 35,
    corePulseSpeed: 0.5,
    coreColorInner: isDarkMode ? 'rgba(255, 100, 100, 0.95)' : 'rgba(220, 60, 60, 0.95)',
    coreColorOuter: isDarkMode ? 'rgba(255, 0, 0, 0.9)' : 'rgba(180, 0, 0, 0.9)',
    coreGlowColor: isDarkMode ? 'rgba(128, 0, 0, 0.2)' : 'rgba(180, 0, 0, 0.15)',
    coreGlowSize: 2.5,
    
    // Beat detection parameters
    beatHold: 40, // How many frames to keep a beat
    beatDecayRate: 0.96, // How quickly the beat detection decays
    beatMin: 0.15, // Volume threshold for a beat
    beatFilter: 0.8, // How much to filter the beat detection
    
    // Frequency bands for different beat types
    freqBands: {
      low: { min: 20, max: 250 },    // Kick drum
      mid: { min: 250, max: 2000 },  // Snare, vocals
      high: { min: 2000, max: 10000 } // Hi-hat, cymbals
    },
    
    // Ripple parameters
    maxRipples: 6,
    rippleInitialSpeed: 1.5,
    rippleSpeedDecay: 0.98,
    rippleLifespan: 120,
    rippleMaxSize: 1000,
    
    // Style parameters
    rippleStyle: 'smooth',
    rippleThickness: 1.8,
    rippleInitialOpacity: 0.85,
    rippleOpacityPeak: 0.35,
    rippleVariation: 0.2
  }), [isDarkMode]);
  
  // Memoize color parameters based on theme
  const baseColor = useMemo(() => isDarkMode ? [255, 50, 50] : [180, 30, 30], [isDarkMode]); // Base RGB color
  const colorVariation = useMemo(() => isDarkMode ? [0, 30, 20] : [20, 10, 5], [isDarkMode]); // Color variation

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

  // Initialize audio context with enhanced analysis
  const initAudioContext = useCallback(() => {
    cleanupAudio();
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();
    
    // Create analyser with better settings for beat detection
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 512; // Increased for better frequency resolution
    analyserRef.current.smoothingTimeConstant = 0.6; // Smoother transitions
    
    // Create frequency data array
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    
    // Initialize beat detection variables
    lastPlayingIntensitiesRef.current = {
      low: 0,
      mid: 0,
      high: 0,
      volume: 0,
      beatCutOff: 0,
      beatTime: 0,
      beatDetect: false,
      beatHoldFrames: 0
    };
  }, [cleanupAudio]);

  // Set up audio context and connect nodes
  const setupAudioContext = useCallback(async () => {
    try {
      // If already set up and working, just resume if needed
      if (isSetupRef.current && 
          audioContextRef.current && 
          audioContextRef.current.state !== 'closed' && 
          sourceRef.current) {
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        return true;
      }
      
      // Clean up any existing audio context
      cleanupAudio();
      initAudioContext();
      
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (audioContextRef.current && audioRef.current) {
        try {
          // Try to create a new MediaElementSource
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          
          isSetupRef.current = true;
          return true;
        } catch (sourceErr) {
          // Handle the case where the audio element is already connected
          if (sourceErr.message && sourceErr.message.includes('already connected')) {
            console.warn('Audio element already connected, using a workaround');
            
            // Instead of creating a new audio element, we'll just use the analyser
            // without connecting a source. We'll manually update the visualization data.
            isSetupRef.current = true;
            
            // Set up a timer to manually update the visualization
            const updateInterval = setInterval(() => {
              if (!audioRef.current || audioContextRef.current?.state === 'closed') {
                clearInterval(updateInterval);
                return;
              }
              
              // Update ripple effects based on beat detection
              if (isPlaying && analyserRef.current && lastPlayingIntensitiesRef.current) {
                const { beatDetect, volume } = lastPlayingIntensitiesRef.current;
                
                // Update intensity based on overall volume
                let intensity = volume * 1.5; // Scale up for better visibility
                
                // Add new ripples on beats with different properties based on frequency bands
                if (beatDetect) {
                  const beatType = beatDetected.low ? 'low' : beatDetected.mid ? 'mid' : 'high';
                  
                  // Create ripples with properties based on beat type
                  const rippleCount = beatType === 'low' ? 2 : 1; // More ripples for bass
                  
                  for (let i = 0; i < rippleCount; i++) {
                    if (audioRipplesRef.current.length >= config.maxRipples) break;
                    
                    // Adjust properties based on beat type
                    let speed, size, opacity, thickness;
                    
                    switch(beatType) {
                      case 'low':
                        // Big, slow ripples for bass
                        speed = config.rippleInitialSpeed * (0.7 + Math.random() * 0.3);
                        size = 1.2 + Math.random() * 0.3;
                        opacity = config.rippleInitialOpacity * (0.8 + Math.random() * 0.4);
                        thickness = config.rippleThickness * (1.2 + Math.random() * 0.3);
                        break;
                      case 'mid':
                        // Medium ripples for mid-range
                        speed = config.rippleInitialSpeed * (1.0 + Math.random() * 0.3);
                        size = 1.0 + Math.random() * 0.2;
                        opacity = config.rippleInitialOpacity * (0.9 + Math.random() * 0.2);
                        thickness = config.rippleThickness * (0.9 + Math.random() * 0.2);
                        break;
                      case 'high':
                      default:
                        // Fast, subtle ripples for high frequencies
                        speed = config.rippleInitialSpeed * (1.2 + Math.random() * 0.4);
                        size = 0.8 + Math.random() * 0.2;
                        opacity = config.rippleInitialOpacity * (0.7 + Math.random() * 0.3);
                        thickness = config.rippleThickness * (0.7 + Math.random() * 0.2);
                    }
                    
                    // Add some randomness to position for natural feel
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 5 + Math.random() * 10;
                    
                    audioRipplesRef.current.push({
                      x: centerX + Math.cos(angle) * distance,
                      y: centerY + Math.sin(angle) * distance,
                      radius: 0,
                      speed: speed,
                      opacity: opacity,
                      life: 0,
                      maxLife: config.rippleLifespan * size,
                      color: `hsl(${
                        (baseColor[0] + (Math.random() * 2 - 1) * colorVariation[0] + 360) % 360
                      }, ${
                        baseColor[1] + (Math.random() * 2 - 1) * colorVariation[1]
                      }%, ${
                        baseColor[2] + (Math.random() * 2 - 1) * colorVariation[2]
                      }%`,
                      thickness: thickness,
                      type: beatType
                    });
                  }
                }
              }
            }, 50); // Update at 20fps
            
            return true;
          }
          throw sourceErr; // Re-throw if it's a different error
        }
      }
      return false;
    } catch (err) {
      console.error('Error setting up audio context:', err);
      setError(`Error setting up audio: ${err.message}`);
      return false;
    }
  }, [cleanupAudio, initAudioContext]);

  // Analyze frequency bands for beat detection
  const analyzeFrequencyBands = useCallback((freqData) => {
    if (!freqData || !lastPlayingIntensitiesRef.current) return null;
    
    const intensities = {
      low: 0,
      mid: 0,
      high: 0,
      volume: 0
    };
    
    // Calculate average volume for each frequency band
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const frequencyBinCount = analyserRef.current?.frequencyBinCount || 0;
    const binSize = sampleRate / 2 / frequencyBinCount;
    
    // Sum up the frequency bands
    for (let i = 0; i < frequencyBinCount; i++) {
      const freq = i * binSize;
      const value = freqData[i] / 255; // Normalize to 0-1
      
      // Add to volume
      intensities.volume += value;
      
      // Add to appropriate frequency band
      if (freq >= config.freqBands.low.min && freq < config.freqBands.low.max) {
        intensities.low += value;
      } else if (freq >= config.freqBands.mid.min && freq < config.freqBands.mid.max) {
        intensities.mid += value;
      } else if (freq >= config.freqBands.high.min && freq < config.freqBands.high.max) {
        intensities.high += value;
      }
    }
    
    // Normalize the values
    const totalBins = frequencyBinCount;
    intensities.volume /= totalBins;
    intensities.low /= (config.freqBands.low.max - config.freqBands.low.min) / binSize;
    intensities.mid /= (config.freqBands.mid.max - config.freqBands.mid.min) / binSize;
    intensities.high /= (config.freqBands.high.max - config.freqBands.high.min) / binSize;
    
    return intensities;
  }, [config.freqBands]);
  
  // Detect beats in the audio
  const detectBeats = useCallback((intensities) => {
    if (!intensities || !lastPlayingIntensitiesRef.current) return false;
    
    const last = lastPlayingIntensitiesRef.current;
    const beatDetected = {
      low: false,
      mid: false,
      high: false
    };
    
    // Detect beats in each frequency band
    const threshold = config.beatMin;
    const filter = config.beatFilter;
    
    // Low frequencies (kick drum)
    if (intensities.low > last.low * (1 + threshold) && intensities.low > threshold) {
      last.beatCutOff = intensities.low * (1 + threshold);
      beatDetected.low = true;
    } else {
      last.low = intensities.low * filter + last.low * (1 - filter);
    }
    
    // Mid frequencies (snare, vocals)
    if (intensities.mid > last.mid * (1 + threshold) && intensities.mid > threshold) {
      last.mid = intensities.mid * (1 + threshold);
      beatDetected.mid = true;
    } else {
      last.mid = intensities.mid * filter + last.mid * (1 - filter);
    }
    
    // High frequencies (hi-hat, cymbals)
    if (intensities.high > last.high * (1 + threshold) && intensities.high > threshold) {
      last.high = intensities.high * (1 + threshold);
      beatDetected.high = true;
    } else {
      last.high = intensities.high * filter + last.high * (1 - filter);
    }
    
    // Update volume
    last.volume = intensities.volume;
    
    // Handle beat hold frames
    if (beatDetected.low || beatDetected.mid || beatDetected.high) {
      last.beatTime = 0;
      last.beatDetect = true;
      last.beatHoldFrames = config.beatHold;
    } else if (last.beatHoldFrames > 0) {
      last.beatHoldFrames--;
    } else {
      last.beatDetect = false;
    }
    
    return beatDetected;
  }, [config.beatHold, config.beatMin, config.beatFilter]);
  
  // Draw the waveform visualization with beat detection
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas with a subtle fade effect
    ctx.fillStyle = isDarkMode ? 'rgba(10, 10, 15, 0.2)' : 'rgba(245, 245, 250, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Get frequency data if available
    let beatDetected = { low: false, mid: false, high: false };
    let intensities = { low: 0, mid: 0, high: 0, volume: 0 };
    
    if (analyserRef.current && isPlaying) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      intensities = analyzeFrequencyBands(dataArrayRef.current) || intensities;
      beatDetected = detectBeats(intensities) || beatDetected;
    }
    
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
    
    // RIPPLE GENERATION - Create new ripples based on audio intensity and beat detection
    if (isPlaying) {
      // Create a beat ripple when bass exceeds threshold
      const now = Date.now();
      
      // Low frequency (bass) beats - create strong, slow ripples
      if (bassIntensity > 0.5 && now - lastRippleTimeRef.current.low > 100) {
        const bassScale = 0.8 + (bassIntensity * 0.4);
        audioRipplesRef.current.push({
          size: config.coreSizeMax * 1.05,
          age: 0,
          maxLife: 120 + (bassIntensity * 30), // Longer life for bass ripples
          intensity: bassIntensity,
          type: 'low',
          color: isDarkMode ? [255, 50, 50] : [220, 30, 30],
          speed: config.rippleInitialSpeed * 0.9 * bassScale,
          thickness: config.rippleThickness * 1.5,
          frequencySnapshot: [...frequencyData],
          createdWhilePlaying: true,
          opacity: 0.8 + (bassIntensity * 0.4)
        });
        lastRippleTimeRef.current.low = now;
      }
      
      // Mid frequency beats - create balanced ripples
      if (midIntensity > 0.5 && now - lastRippleTimeRef.current.mid > 150) {
        const midScale = 0.9 + (midIntensity * 0.2);
        audioRipplesRef.current.push({
          size: config.coreSizeMax * 1.1,
          age: 0,
          maxLife: 100 + (midIntensity * 20),
          intensity: midIntensity,
          type: 'mid',
          color: isDarkMode ? [80, 180, 255] : [0, 100, 200],
          speed: config.rippleInitialSpeed * 1.1 * midScale,
          thickness: config.rippleThickness,
          frequencySnapshot: [...frequencyData],
          createdWhilePlaying: true,
          opacity: 0.7 + (midIntensity * 0.3)
        });
        lastRippleTimeRef.current.mid = now;
      }
      
      // High frequency beats - create fast, subtle ripples (50ms cooldown for more responsiveness)
      if (highIntensity > 0.5 && now - lastRippleTimeRef.current.high > 50) {
        const highScale = 1.0 + (highIntensity * 0.3);
        audioRipplesRef.current.push({
          size: config.coreSizeMax * 1.05,
          age: 0,
          maxLife: 80 + (highIntensity * 15),
          intensity: highIntensity,
          type: 'high',
          color: isDarkMode ? [150, 255, 150] : [50, 200, 50],
          speed: config.rippleInitialSpeed * 1.3 * highScale,
          thickness: config.rippleThickness * 0.7,
          frequencySnapshot: [...frequencyData],
          createdWhilePlaying: true,
          opacity: 0.6 + (highIntensity * 0.2)
        });
        lastRippleTimeRef.current.high = now;
      }
      
      // Limit the number of ripples for performance
      if (audioRipplesRef.current.length > config.maxRipples) {
        audioRipplesRef.current = audioRipplesRef.current.slice(-config.maxRipples);
      }
    }
    
    // RIPPLE DRAWING - Update and draw all active ripples
    audioRipplesRef.current = audioRipplesRef.current.filter(ripple => {
      try {
        // Update ripple properties
        ripple.size += ripple.speed || config.rippleInitialSpeed;
        ripple.age++;
        
        // Calculate opacity based on life progress
        const lifeProgress = ripple.age / (ripple.maxLife || config.rippleLifespan);
        let opacity = ripple.opacity !== undefined ? 
          ripple.opacity * (1 - lifeProgress) : 
          config.rippleOpacity * (1 - lifeProgress);
        
        // Ensure ripples never appear to move back toward core
        if (!ripple.maxOpacity || opacity > ripple.maxOpacity) {
          ripple.maxOpacity = opacity;
        } else {
          opacity = Math.min(opacity, ripple.maxOpacity * 0.99);
          ripple.maxOpacity *= 0.99;
        }
        
          // Only draw if visible and within bounds
          if (opacity > 0.01 && ripple.size < config.rippleMaxSize) {
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
      } catch (err) {
        console.error('Error rendering ripple:', err);
        return false; // Remove the ripple on error
      }
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
    coreGradient.addColorStop(1, isDarkMode ? 'rgba(255, 0, 0, 0.5)' : 'rgba(180, 0, 0, 0.4)');
    
    // Draw the core
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreSize, 0, 2 * Math.PI);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    // Calculate audio activity level (0-1) based on intensity
    const activityLevel = Math.min(1, Math.max(0, intensity * 1.5)); // Scale intensity for better response
    
    // Smoothly adjust glow size based on audio activity
    const targetGlowMultiplier = activityLevel > 0.1 
      ? config.coreGlowSize * (0.8 + activityLevel * 0.5) // Scale up with activity
      : config.coreGlowSize * 0.4; // Minimum glow when no activity
      
    // Smooth the transition using a simple easing function
    const glowSizeMultiplier = lastGlowMultiplierRef.current = 
      lastGlowMultiplierRef.current * 0.8 + targetGlowMultiplier * 0.2;
      
    const glowSize = coreSize * glowSizeMultiplier;
    
    // Adjust glow intensity based on audio activity
    const glowIntensity = 0.1 + (activityLevel * 0.25); // 0.1 to 0.35 range
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, 2 * Math.PI);
    ctx.fillStyle = isDarkMode 
      ? `rgba(255, 50, 0, ${glowIntensity})` 
      : `rgba(200, 40, 0, ${glowIntensity * 0.8})`;
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
  
  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
      audioRef.current.crossOrigin = "anonymous";
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

  // Render the preview mode (minimal UI)
  if (previewMode) {
    // For preview mode, ensure audio is always muted
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
    }, [audioRef.current]);
    
    return (
      <Box 
        sx={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0,0,0,0.7)',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
        onClick={handlePlayPause}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block',
            opacity: isPlaying ? 1 : 0.7,
            transition: 'opacity 0.3s ease'
          }}
        />
        {/* No play/pause indicator in the center */}
        <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" muted={true} />
      </Box>
    );
  }

  // Full player mode
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
      {showTitle && title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      
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
          mb: 2,
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={handlePlayPause}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block'
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
});

AudioWaveformVisualizer.displayName = 'AudioWaveformVisualizer';

export default AudioWaveformVisualizer;
