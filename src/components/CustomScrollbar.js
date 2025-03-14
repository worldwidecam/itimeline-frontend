import React, { useState, useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';

const CustomScrollbar = ({ children, ...props }) => {
  const theme = useTheme();
  const contentRef = useRef(null);
  const thumbRef = useRef(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbPosition, setThumbPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScroll, setStartScroll] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef(null);

  // Calculate thumb size based on content
  useEffect(() => {
    const calculateThumbSize = () => {
      if (!contentRef.current) return;
      
      const { clientHeight, scrollHeight } = contentRef.current;
      
      // Calculate thumb height proportional to visible content
      const newThumbHeight = Math.max(
        30, // Minimum thumb height
        (clientHeight / scrollHeight) * clientHeight
      );
      
      setThumbHeight(newThumbHeight);
    };

    calculateThumbSize();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateThumbSize);
    return () => window.removeEventListener('resize', calculateThumbSize);
  }, []);

  // Update thumb position when content is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || isDragging) return;
      
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      
      // Calculate thumb position
      const newPosition = (scrollTop / (scrollHeight - clientHeight)) * 
                          (clientHeight - thumbHeight);
      
      setThumbPosition(newPosition);
      
      // Show scrollbar when scrolling
      setIsVisible(true);
      
      // Hide scrollbar after a delay
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1500);
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('scroll', handleScroll);
    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [thumbHeight, isDragging]);

  // Handle thumb dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !contentRef.current) return;
      
      const { scrollHeight, clientHeight } = contentRef.current;
      
      // Calculate how far the mouse has moved
      const deltaY = e.clientY - startY;
      
      // Calculate the new scroll position
      const scrollRatio = (scrollHeight - clientHeight) / (clientHeight - thumbHeight);
      const newScrollTop = startScroll + (deltaY * scrollRatio);
      
      // Update content scroll position
      contentRef.current.scrollTop = newScrollTop;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startScroll, thumbHeight]);

  // Start dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartScroll(contentRef.current.scrollTop);
  };

  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box sx={{ 
      position: 'relative', 
      display: 'flex', 
      height: '100%', 
      width: '100%',
      overflow: 'hidden',
      ...props.sx
    }}>
      {/* Content with scroll */}
      <Box
        ref={contentRef}
        sx={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>

      {/* Scrollbar thumb */}
      <Box
        ref={thumbRef}
        className="scrollThumb"
        onMouseDown={handleMouseDown}
        sx={{
          position: 'absolute',
          width: '6px',
          height: `${thumbHeight}px`,
          right: '2px',
          top: `${thumbPosition}px`,
          backgroundColor: isDarkMode ? 'rgba(180, 180, 180, 0.6)' : 'rgba(120, 120, 120, 0.6)',
          borderRadius: '3px',
          cursor: 'pointer',
          opacity: isDragging || isVisible ? 0.8 : 0,
          transition: 'opacity 0.3s',
          '&:hover': {
            opacity: 0.8,
            backgroundColor: isDarkMode ? 'rgba(200, 200, 200, 0.7)' : 'rgba(100, 100, 100, 0.7)',
          }
        }}
      />
    </Box>
  );
};

export default CustomScrollbar;
