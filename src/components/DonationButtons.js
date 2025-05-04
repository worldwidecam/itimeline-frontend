import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import { useSpring, animated } from 'react-spring';

// This component creates animated floating action buttons for donations
const DonationButtons = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [isHoveringMain, setIsHoveringMain] = useState(false);
  const [isHoveringKofi, setIsHoveringKofi] = useState(false);
  const [isHoveringGofundme, setIsHoveringGofundme] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(null);
  const [showBubble, setShowBubble] = useState(false);
  const bubbleTimeoutRef = useRef(null);
  
  // Main button animation
  const mainButtonAnimation = useSpring({
    transform: isHoveringMain ? 'scale(1.1)' : (open ? 'scale(1.05)' : 'scale(1)'),
    config: { tension: 300, friction: 20 }
  });
  
  // Pulse animation for the main button when closed
  const pulseAnimation = useSpring({
    from: { transform: 'scale(1)' },
    to: async (next) => {
      // Only pulse when the menu is closed
      if (!open && !isHoveringMain) {
        await next({ transform: 'scale(1.1)' });
        await next({ transform: 'scale(1)' });
      }
    },
    config: { tension: 300, friction: 10 },
    loop: !open && !isHoveringMain,
    // Pause the animation when menu is open or hovering
    pause: open || isHoveringMain
  });
  
  // Ko-fi button animation
  const kofiButtonAnimation = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(-70px) scale(1)' : 'translateY(0px) scale(0.5)',
    config: { tension: 300, friction: 20 }
  });
  
  // GoFundMe button animation
  const gofundmeButtonAnimation = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(-140px) scale(1)' : 'translateY(0px) scale(0.5)',
    config: { tension: 300, friction: 20 }
  });
  
  // Handle clicks on the main button
  const handleMainButtonClick = () => {
    setOpen(!open);
  };
  
  // Handle clicks on the Ko-fi button
  const handleKofiClick = () => {
    window.open('https://ko-fi.com/brahdyssey', '_blank');
  };
  
  // Handle clicks on the GoFundMe button
  const handleGofundmeClick = () => {
    window.open('https://gofund.me/dea7bc67', '_blank');
  };
  
  // Hide tooltips when clicking elsewhere on the page
  useEffect(() => {
    const handleClickOutside = () => {
      setTooltipVisible(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Function to show the speech bubble
  const showSpeechBubble = () => {
    console.log('Showing speech bubble');
    setShowBubble(true);
    
    // Hide the bubble after 15 seconds
    bubbleTimeoutRef.current = setTimeout(() => {
      console.log('Starting fade-out of speech bubble');
      // Start the fade-out animation by setting showBubble to false
      setShowBubble(false);
      
      // Schedule the next appearance after 30 seconds
      // We use a longer timeout to account for the fade-out animation
      setTimeout(() => {
        if (!open) { // Only show if menu is not open
          showSpeechBubble();
        }
      }, 30000);
    }, 15000);
  };
  
  // Function to hide the speech bubble with animation
  const hideSpeechBubbleWithAnimation = () => {
    // Just set showBubble to false - the SpeechBubble component
    // will handle the fade-out animation internally
    setShowBubble(false);
    
    // Clear any existing timeouts when the button is clicked
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = null;
    }
  };
  
  // Show the speech bubble on initial load
  useEffect(() => {
    console.log('Setting up initial speech bubble timeout');
    
    // Show the bubble immediately for testing
    // For production, use a timeout: setTimeout(showSpeechBubble, 10000);
    showSpeechBubble();
    
    // Clear the timeout when component unmounts
    return () => {
      if (bubbleTimeoutRef.current) {
        clearTimeout(bubbleTimeoutRef.current);
      }
    };
  }, []);
  
  // Hide the bubble when the donation menu is opened
  useEffect(() => {
    if (open) {
      setShowBubble(false);
    }
  }, [open]);
  
  // Comic style speech bubble component
  const SpeechBubble = ({ visible, text }) => {
    // State to track if we should render the component
    const [shouldRender, setShouldRender] = useState(visible);
    // State to track internal opacity for manual animation
    const [opacity, setOpacity] = useState(visible ? 0 : 1);
    // Ref to store interval IDs for cleanup
    const fadeIntervalRef = useRef(null);
    
    // Use a simpler animation just for the scale
    const bubbleAnimation = useSpring({
      transform: visible ? 'scale(1)' : 'scale(0.95)',
      config: { 
        tension: 120,
        friction: 14
      }
    });
    
    // Clear any existing intervals to prevent conflicts
    const clearFadeIntervals = () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
    
    // Handle fade-in effect
    useEffect(() => {
      // Clear any existing animations first
      clearFadeIntervals();
      
      if (visible) {
        console.log('Starting fade-IN effect');
        // Make sure we're rendering
        setShouldRender(true);
        // Reset opacity to 0
        setOpacity(0);
        
        // Start fade-in after a tiny delay to ensure state is updated
        setTimeout(() => {
          let currentOpacity = 0;
          // Faster fade-in (half the time) - 0.1 increment = 10 steps
          fadeIntervalRef.current = setInterval(() => {
            currentOpacity += 0.1; // Increment by 10% (twice as fast)
            setOpacity(Math.min(currentOpacity, 1)); // Cap at 1
            
            if (currentOpacity >= 1) {
              clearFadeIntervals();
            }
          }, 50); // 50ms intervals = 0.5 second total (10 steps)
        }, 10);
      }
      
      // Cleanup on unmount
      return clearFadeIntervals;
    }, [visible]);
    
    // Handle fade-out effect (separate useEffect for clarity)
    useEffect(() => {
      if (!visible && shouldRender) {
        console.log('Starting fade-OUT effect');
        // Clear any existing animations first
        clearFadeIntervals();
        
        // Start with full opacity
        let currentOpacity = 1;
        setOpacity(1);
        
        // Create the fade-out interval
        fadeIntervalRef.current = setInterval(() => {
          currentOpacity -= 0.02; // Decrease by 2% each step
          console.log('Fade-out opacity:', currentOpacity);
          
          if (currentOpacity <= 0) {
            // When fully transparent, stop rendering
            setOpacity(0);
            clearFadeIntervals();
            setShouldRender(false);
          } else {
            // Update opacity state
            setOpacity(currentOpacity);
          }
        }, 60); // 60ms intervals = 3 seconds total (50 steps)
      }
      
      // Cleanup on unmount
      return clearFadeIntervals;
    }, [visible, shouldRender]);
    
    // Log animation state for debugging
    useEffect(() => {
      console.log(`Animation state update - visible: ${visible}, opacity: ${opacity}`);
    }, [visible, opacity]);
    
    console.log('Speech bubble visibility:', visible, 'shouldRender:', shouldRender, 'opacity:', opacity);
    
    return shouldRender ? (
      <animated.div style={{
        position: 'fixed', // Changed from absolute to fixed
        bottom: '120px', // Moved higher (was 80px)
        right: '20px',
        backgroundColor: 'white',
        color: '#333',
        padding: '12px 16px',
        borderRadius: '18px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        fontSize: '16px', // Increased font size
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        zIndex: 1002,
        border: '2px solid #333',
        opacity: opacity, // Apply manual opacity control
        ...bubbleAnimation
      }}>
        {text}
        {/* Speech bubble tail */}
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          right: '25px',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '20px solid white',
          zIndex: 1003
        }} />
        {/* Speech bubble tail border */}
        <div style={{
          position: 'absolute',
          bottom: '-23px',
          right: '22px',
          width: 0,
          height: 0,
          borderLeft: '13px solid transparent',
          borderRight: '13px solid transparent',
          borderTop: '23px solid #333',
          zIndex: 1002
        }} />
      </animated.div>
    ) : null;
  };
  
  // Custom tooltip component
  const Tooltip = ({ visible, text, children, style }) => (
    <div style={{ position: 'relative' }}>
      {visible && (
        <div style={{
          position: 'absolute',
          right: '70px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0,0,0,0.75)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '14px',
          whiteSpace: 'nowrap',
          zIndex: 1001,
          ...style
        }}>
          {text}
          <div style={{
            position: 'absolute',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '6px solid rgba(0,0,0,0.75)'
          }} />
        </div>
      )}
      {children}
    </div>
  );
  
  return (
    <>
      {/* Ko-fi Button */}
      <animated.div 
        style={{ 
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 1000,
          ...kofiButtonAnimation
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleKofiClick();
        }}
        onMouseEnter={() => {
          setIsHoveringKofi(true);
          setTooltipVisible('kofi');
        }}
        onMouseLeave={() => {
          setIsHoveringKofi(false);
        }}
      >
        <Tooltip visible={tooltipVisible === 'kofi'} text="Support on Ko-fi">
          <svg 
            width="56" 
            height="56" 
            viewBox="0 0 56 56"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
              transform: isHoveringKofi ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <circle 
              cx="28" 
              cy="28" 
              r="28" 
              fill={isHoveringKofi ? '#1a8eb8' : '#29abe0'} 
            />
            {/* 
              Ko-fi Logo Configuration:
              - cupOffsetX/Y: Adjust these values to move the entire cup within the circle
              - heartOffsetX/Y: Adjust these values to move the heart within the cup
              - scale: Adjust to change the overall size of the cup (0.7 is default)
            */}
            {/* Define positioning variables for easy adjustment */}
            <g transform={`translate(${12 + 0} ${12 + 2}) scale(0.7)`}>
              {/* 
                Cup body - The main coffee cup shape
                - Increase translateX to move right, decrease to move left
                - Increase translateY to move down, decrease to move up
              */}
              <path 
                d="M6 8C6 6.34315 7.34315 5 9 5H39C40.6569 5 42 6.34315 42 8V26C42 33.1797 36.1797 39 29 39H19C11.8203 39 6 33.1797 6 26V8Z" 
                fill="white" 
                stroke="black" 
                strokeWidth="4" 
              />
              
              {/* 
                Cup handle - The handle on the right side of the cup
                - This is positioned relative to the cup body
              */}
              <path 
                d="M42 14C42 11.7909 43.7909 10 46 10C48.2091 10 50 11.7909 50 14C50 16.2091 48.2091 18 46 18C43.7909 18 42 16.2091 42 14Z" 
                fill="white" 
                stroke="black" 
                strokeWidth="4" 
              />
              
              {/* 
                Heart - The heart inside the cup
                - Adjust the first two numbers in the path to move the heart
                - Current position: centered in cup (24, 14)
                - Decrease first number to move left, increase to move right
                - Decrease second number to move up, increase to move down
              */}
              <path 
                d="M24 14C20.6863 14 18 16.6863 18 20C18 25.5 24 31 30 36C36 31 42 25.5 42 20C42 16.6863 39.3137 14 36 14C33.5 14 31.3 15.3 30 17.25C28.7 15.3 26.5 14 24 14Z" 
                fill="#FF5E5B" 
              />
            </g>
          </svg>
        </Tooltip>
      </animated.div>
      
      {/* GoFundMe Button */}
      <animated.div 
        style={{ 
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 1000,
          ...gofundmeButtonAnimation
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleGofundmeClick();
        }}
        onMouseEnter={() => {
          setIsHoveringGofundme(true);
          setTooltipVisible('gofundme');
        }}
        onMouseLeave={() => {
          setIsHoveringGofundme(false);
        }}
      >
        <Tooltip visible={tooltipVisible === 'gofundme'} text="Donate on GoFundMe">
          <svg 
            width="56" 
            height="56" 
            viewBox="0 0 56 56"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
              transform: isHoveringGofundme ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <circle 
              cx="28" 
              cy="28" 
              r="28" 
              fill={isHoveringGofundme ? '#018a4a' : '#02a95c'} 
            />
            {/* 
              GoFundMe Logo Configuration:
              - Adjust translate values to position the icon within the circle
              - Scale adjusts the overall size of the icon
            */}
            <g transform={`translate(1, 8) scale(1)`}>
              {/* Half-circle representing the rising sun */}
              <path 
                d="M40 28C40 21.4 34.6 16 28 16C21.4 16 16 21.4 16 28C16 28 16 28 16 28H40C40 28 40 28 40 28Z" 
                fill="white" 
                stroke="white" 
                strokeWidth="0.5" 
              />
              
              {/* Left ray of sunshine - pill shaped */}
              <rect
                x="8" 
                y="18"
                width="12"
                height="6"
                rx="3"
                ry="3"
                transform="rotate(20, 14, 21)"
                fill="white"
              />
              
              {/* Middle ray of sunshine - pill shaped */}
              <rect
                x="25" 
                y="5"
                width="6"
                height="12"
                rx="3"
                ry="3"
                fill="white"
              />
              
              {/* Right ray of sunshine - pill shaped */}
              <rect
                x="36" 
                y="18"
                width="12"
                height="6"
                rx="3"
                ry="3"
                transform="rotate(-20, 42, 21)"
                fill="white"
              />
            </g>
          </svg>
        </Tooltip>
      </animated.div>
      
      {/* Speech Bubble - Always rendered but visibility controlled by state */}
      <SpeechBubble 
        visible={showBubble && !open} 
        text="Consider Donating $1 / Month!"
      />
      
      {/* Main Button */}
      <animated.div 
        style={{ 
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 1000,
          ...(!open && !isHoveringMain && pulseAnimation)
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleMainButtonClick();
          // Use the animation function instead of immediately hiding
          hideSpeechBubbleWithAnimation();
        }}
        onMouseEnter={() => {
          setIsHoveringMain(true);
          setTooltipVisible('main');
        }}
        onMouseLeave={() => {
          setIsHoveringMain(false);
        }}
      >
        <animated.div style={mainButtonAnimation}>
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 64 64"
            style={{
              filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))',
            }}
          >
            <circle 
              cx="32" 
              cy="32" 
              r="32" 
              fill={isHoveringMain 
                ? (theme.palette.mode === 'dark' ? '#ff8589' : '#3a58c7')
                : (theme.palette.mode === 'dark' ? '#ff9a9e' : '#4568dc')
              } 
            />
            {open ? (
              <path 
                d="M38 26.6L36.4 25 32 29.4 27.6 25 26 26.6 30.4 31 26 35.4 27.6 37 32 32.6 36.4 37 38 35.4 33.6 31z" 
                fill={theme.palette.mode === 'dark' ? '#1a1a1a' : 'white'}
                transform="scale(1) translate(0, 0)"
              />
            ) : (
              /* Heart icon - cute, properly shaped heart */
              <path 
                d="M28 39c-0.3 0-0.5-0.1-0.7-0.2-2.2-1.3-13.1-8.1-13.1-16.9 0-4.6 3.7-8.4 8.4-8.4 2.5 0 4.9 1.1 6.5 3 1.6-1.9 4-3 6.5-3 4.6 0 8.4 3.7 8.4 8.4 0 8.8-10.9 15.6-13.1 16.9-0.2 0.1-0.5 0.2-0.7 0.2z"
                fill={theme.palette.mode === 'dark' ? '#fff8e1' : '#ff4081'}
                transform="scale(0.75) translate(13, 15)"
              />
            )}
          </svg>
        </animated.div>
      </animated.div>
    </>
  );
};

export default DonationButtons;
