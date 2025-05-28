import React, { useRef, useEffect, useCallback, forwardRef } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

/**
 * A standalone audio visualizer that works with an external audio element
 * It only handles visualization and doesn't control playback
 */
const AudioVisualizerOnly = forwardRef(({ audioElement, width = '100%', height = '100%' }, ref) => {
  const { isDarkMode } = useTheme();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const isSetupRef = useRef(false);
  
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
      audioContextRef.current.close().catch(err => {
        console.warn('Error closing audio context:', err);
      });
    }
    
    isSetupRef.current = false;
  }, []);
  
  // Initialize audio context and analyzer
  const setupAudio = useCallback(async () => {
    if (!audioElement || !canvasRef.current) return;
    
    try {
      // Clean up any existing audio context
      await cleanupAudio();
      
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Create source from audio element
      const source = audioContext.createMediaElementSource(audioElement);
      sourceRef.current = source;
      
      // Connect source -> analyser -> destination
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // Create data array for frequency data
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      isSetupRef.current = true;
      return true;
    } catch (err) {
      console.error('Error setting up audio visualization:', err);
      cleanupAudio();
      return false;
    }
  }, [audioElement, cleanupAudio]);
  
  // Draw the waveform
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = dataArrayRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Draw waveform
    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * height;
      
      // Skip very small bars to reduce visual noise
      if (barHeight < 2) continue;
      
      // Calculate color based on frequency and amplitude
      const hue = 240 - (i / bufferLength * 120);
      const saturation = 80 + (dataArray[i] / 255 * 20);
      const lightness = 40 + (dataArray[i] / 255 * 20);
      
      // Draw bar
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
    
    // Schedule next frame
    animationRef.current = requestAnimationFrame(drawWaveform);
  }, []);
  
  // Set up effect to handle audio element changes
  useEffect(() => {
    if (!audioElement) return;
    
    let isMounted = true;
    
    const setupVisualizer = async () => {
      const success = await setupAudio();
      
      if (success && isMounted) {
        // Start animation loop
        animationRef.current = requestAnimationFrame(drawWaveform);
      }
    };
    
    setupVisualizer();
    
    return () => {
      isMounted = false;
      cleanupAudio();
    };
  }, [audioElement, setupAudio, drawWaveform, cleanupAudio]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          canvasRef.current.width = container.clientWidth;
          canvasRef.current.height = container.clientHeight;
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <Box 
      ref={ref}
      sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isDarkMode ? 'rgba(18, 18, 18, 0.9)' : 'rgba(245, 245, 245, 0.9)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent'
        }}
      />
    </Box>
  );
});

AudioVisualizerOnly.displayName = 'AudioVisualizerOnly';

export default AudioVisualizerOnly;
