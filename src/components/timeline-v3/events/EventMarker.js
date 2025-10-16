// NOTE: This component requires accurate date/time information for proper functionality.
// There are additional considerations to ensure it works correctly.

// FUTURE ENHANCEMENT: Implement a smooth curvature winding line that rests on top of all event marker lines,
// connecting them visually like an audioform soundwave. This would provide a visual continuity
// to the timeline, especially in year view where many events may be displayed.

import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Import type-specific marker components
import NewsEventMarker from './markers/NewsEventMarker';
import MediaEventMarker from './markers/MediaEventMarker';
import RemarkEventMarker from './markers/RemarkEventMarker';

// Import other components and constants
import TimelineEvent from './TimelineEvent';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import { 
  differenceInHours, 
  differenceInDays, 
  differenceInMinutes, 
  differenceInMonths, 
  differenceInMilliseconds,
  isSameDay,
  isSameMonth,
  isSameYear,
  startOfWeek,
  endOfWeek,
  isWithinInterval
} from 'date-fns';

const EventMarker = ({ 
  event, 
  timelineOffset, 
  markerSpacing,
  viewMode,
  index, 
  totalEvents,
  currentIndex,
  onChangeIndex,
  minMarker,
  maxMarker,
  onClick,
  selectedType,
  isSelected = false, // Prop to determine if this marker is selected
  isMoving = false // New prop to track timeline movement
}) => {
  const theme = useTheme();
  const markerRef = React.useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [freshCurrentDate, setFreshCurrentDate] = useState(new Date());
  const [overlappingFactor, setOverlappingFactor] = useState(1);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [position, setPosition] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(0); // Store the exact marker value for Point B

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFreshCurrentDate(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Calculate if this event overlaps with others based on position
  // Performance optimized version for large numbers of events
  useEffect(() => {
    if (viewMode !== 'position' && position) {
      // Performance optimization: Skip overlap calculation for large event sets in month/year view
      // This significantly improves performance when there are many events
      const isLargeEventSet = window.timelineEventPositions && window.timelineEventPositions.length > 50;
      const isMonthOrYearView = viewMode === 'month' || viewMode === 'year';
      
      // For large event sets in month/year view, use a simplified approach
      if (isLargeEventSet && isMonthOrYearView) {
        // Apply a fixed offset pattern based on event ID to distribute events
        // This avoids expensive collision detection while still providing visual separation
        const eventIdNumber = parseInt(event.id.replace(/\D/g, '')) || event.id.charCodeAt(0);
        const offsetPattern = eventIdNumber % 4; // Create 4 different offset patterns
        
        setOverlappingFactor(1); // No stacking in simplified mode
        setHorizontalOffset(offsetPattern * 5); // Apply a fixed horizontal offset
        return; // Skip the rest of the calculation
      }
      
      // For smaller event sets or day/week views, use the full collision detection
      // Reset the global positions array when view mode changes to prevent position persistence issues
      if (!window.currentViewMode || window.currentViewMode !== viewMode) {
        window.timelineEventPositions = [];
        window.currentViewMode = viewMode;
      }
      
      const eventPositions = window.timelineEventPositions || [];
      
      // Update this event's position in the global array - use a more efficient approach
      // Performance optimization: Use a Map for faster lookups
      if (!window.timelineEventPositionsMap) {
        window.timelineEventPositionsMap = new Map();
      }
      
      const positionData = {
        id: event.id,
        x: position.x,
        viewMode,
        type: event.type,
        // Performance optimization: Store only necessary event data
        eventDate: event.event_date ? new Date(event.event_date) : null
      };
      
      // Update in both the array and map for efficient access
      const existingIndex = eventPositions.findIndex(ep => ep.id === event.id);
      if (existingIndex >= 0) {
        eventPositions[existingIndex] = positionData;
      } else {
        eventPositions.push(positionData);
      }
      window.timelineEventPositionsMap.set(event.id, positionData);
      window.timelineEventPositions = eventPositions;
      
      // Adjust proximity threshold based on view mode
      // Larger views (year, month) need larger thresholds
      let proximityThreshold = 10; // Default
      if (viewMode === 'month') proximityThreshold = 15;
      if (viewMode === 'year') proximityThreshold = 40;
      
      // Performance optimization: Only check events that are likely to be nearby
      // This avoids checking every single event position
      let nearbyEvents = [];
      
      // Filter the events to check based on view mode
      const eventsToCheck = eventPositions.filter(ep => 
        ep.id !== event.id && 
        ep.viewMode === viewMode && 
        Math.abs(ep.x - position.x) < (viewMode === 'year' ? 60 : viewMode === 'month' ? 40 : proximityThreshold)
      );
      
      // Now apply more specific filtering based on view mode
      if (viewMode === 'year' && eventsToCheck.length > 0) {
        nearbyEvents = eventsToCheck.filter(ep => {
          // Check if events are close horizontally
          const isClose = Math.abs(ep.x - position.x) < proximityThreshold;
          
          // Compare dates if available
          if (event.event_date && ep.eventDate) {
            const eventDate = new Date(event.event_date);
            const otherEventDate = ep.eventDate;
            const sameMonth = eventDate.getMonth() === otherEventDate.getMonth();
            const adjacentMonth = Math.abs(eventDate.getMonth() - otherEventDate.getMonth()) <= 1;
            
            return isClose || (sameMonth && Math.abs(ep.x - position.x) < 60) || 
                   (adjacentMonth && Math.abs(ep.x - position.x) < 45);
          }
          
          return isClose;
        });
      } else if (viewMode === 'month' && eventsToCheck.length > 0) {
        nearbyEvents = eventsToCheck.filter(ep => {
          // Check if events are close horizontally
          const isClose = Math.abs(ep.x - position.x) < proximityThreshold;
          
          // Compare dates if available
          if (event.event_date && ep.eventDate) {
            const eventDate = new Date(event.event_date);
            const otherEventDate = ep.eventDate;
            
            // Check if events are in the same week
            const sameWeek = Math.abs(eventDate.getDate() - otherEventDate.getDate()) < 7;
            
            return isClose || (sameWeek && Math.abs(ep.x - position.x) < 40);
          }
          
          return isClose;
        });
      } else {
        // For day and week views, just use the pre-filtered events
        nearbyEvents = eventsToCheck;
      }
      
      // Calculate overlapping factor with diminishing returns
      // First few overlaps have more impact, then it tapers off
      const baseGrowth = 1;
      // Use different max growth values based on view mode
      let maxGrowth = 6.0; // Default max growth
      
      if (viewMode === 'year') {
        maxGrowth = 10.0; // Significantly higher max growth for year view
      } else if (viewMode === 'month') {
        maxGrowth = 7.0; // Slightly higher for month view
      }
      
      if (nearbyEvents.length === 0) {
        setOverlappingFactor(1);
        setHorizontalOffset(0);
      } else {
        // Logarithmic growth function to prevent excessive height
        // Use a more aggressive logarithmic base for faster growth
        let factor;
        
        if (viewMode === 'year') {
          // More aggressive growth for year view
          factor = baseGrowth + (Math.log(nearbyEvents.length + 1) / Math.log(2.0));
        } else {
          factor = baseGrowth + (Math.log(nearbyEvents.length + 1) / Math.log(2.5));
        }
        
        setOverlappingFactor(Math.min(factor, maxGrowth));
        
        // Calculate a subtle horizontal offset based on event ID to prevent perfect alignment
        // This creates a more natural, less rigid appearance when events overlap
        let offsetBase = 0;
        if (event && event.id && typeof event.id === 'string') {
          offsetBase = (event.id.charCodeAt(0) % 5) - 2; // Range from -2 to 2
        } else if (event && event.id) {
          // If id exists but is not a string (e.g., a number), convert to string first
          offsetBase = (String(event.id).charCodeAt(0) % 5) - 2;
        } else {
          // Fallback to a random offset if id doesn't exist
          offsetBase = (Math.floor(Math.random() * 5) - 2);
        }
        setHorizontalOffset(nearbyEvents.length > 0 ? offsetBase : 0);
      }
    }
  }, [event.id, event.type, viewMode, position, event.event_date]);

  useEffect(() => {
    if (index === currentIndex && markerRef.current) {
      // No need to set anchorEl here
    }
  }, [index, currentIndex]);

  const calculatePosition = () => {
    if (viewMode !== 'position') {
      const eventDate = event && event.event_date ? new Date(event.event_date) : null;
      let positionValue = 0;
      let markerPosition = 0;
      
      switch (viewMode) {
        case 'day':
          // First determine if the event is on the same day as the reference point [0]
          const isSameDayAsRef = eventDate ? isSameDay(eventDate, freshCurrentDate) : false;
          
          // For day view, we need to align with how TimeMarkers.js represents hours
          // In TimeMarkers.js, each marker represents an hour, with special markers at 12AM for each day
          
          // Calculate day difference
          const dayDiffMs = eventDate ? differenceInMilliseconds(
            new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
            new Date(freshCurrentDate.getFullYear(), freshCurrentDate.getMonth(), freshCurrentDate.getDate())
          ) : 0;
          
          const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
          
          // Calculate hours from midnight of the reference day
          const currentHour = freshCurrentDate.getHours();
          const eventHour = eventDate ? eventDate.getHours() : 0;
          const eventMinute = eventDate ? eventDate.getMinutes() : 0;
          
          // Position calculation:
          // 1. Start with the day difference in hours (dayDiff * 24)
          // 2. Add the event's hour position relative to midnight (eventHour)
          // 3. Subtract the current hour to align with reference point [0]
          // 4. Add minute fraction for precise positioning
          
          // This formula ensures the event is positioned at the correct hour marker
          // based on its actual hour value (0-23) and day offset
          markerPosition = (dayDiff * 24) + eventHour - currentHour + (eventMinute / 60);
          
          positionValue = markerPosition * markerSpacing;
          break;
          
        case 'week':
          const dayDiffMsWeek = eventDate ? differenceInMilliseconds(
            new Date(
              eventDate.getFullYear(),
              eventDate.getMonth(),
              eventDate.getDate()
            ),
            new Date(
              freshCurrentDate.getFullYear(),
              freshCurrentDate.getMonth(),
              freshCurrentDate.getDate()
            )
          ) : 0;
          
          const dayDiffWeek = dayDiffMsWeek / (1000 * 60 * 60 * 24);
          
          if (dayDiffWeek === 0) {
            const totalMinutesInDay = 24 * 60;
            const eventMinutesIntoDay = eventDate ? eventDate.getHours() * 60 + eventDate.getMinutes() : 0;
            const eventFractionOfDay = eventMinutesIntoDay / totalMinutesInDay;
            
            markerPosition = eventFractionOfDay;
          } else {
            const eventHourWeek = eventDate ? eventDate.getHours() : 0;
            const eventMinuteWeek = eventDate ? eventDate.getMinutes() : 0;
            
            const totalMinutesInDay = 24 * 60;
            const eventMinutesIntoDay = eventHourWeek * 60 + eventMinuteWeek;
            const eventFractionOfDay = eventMinutesIntoDay / totalMinutesInDay;
            
            markerPosition = Math.floor(dayDiffWeek) + eventFractionOfDay;
          }
          
          positionValue = markerPosition * markerSpacing;
          
          // Check if the marker is within the visible range on the timeline
          // This is determined by the minMarker and maxMarker props
          const isWithinVisibleRange = minMarker <= markerPosition && markerPosition <= maxMarker;
          
          // We'll keep the week interval check, but only use it for debugging purposes
          const weekStart = startOfWeek(freshCurrentDate, { weekStartsOn: 0 });
          const weekEnd = endOfWeek(freshCurrentDate, { weekStartsOn: 0 });
          const isWithinWeek = eventDate ? isWithinInterval(eventDate, { start: weekStart, end: weekEnd }) : false;
          
          // For week view, we'll show all events within the visible timeline range
          // regardless of whether they're in the current week
          if (!isWithinVisibleRange && index !== currentIndex) {
            return null;
          }
          break;
          
        case 'month':
          const monthEventYear = eventDate ? eventDate.getFullYear() : 0;
          const monthCurrentYear = freshCurrentDate.getFullYear();
          const monthEventMonth = eventDate ? eventDate.getMonth() : 0;
          const currentMonth = freshCurrentDate.getMonth();
          const monthEventDay = eventDate ? eventDate.getDate() : 0;
          const monthDaysInMonth = eventDate ? new Date(monthEventYear, monthEventMonth + 1, 0).getDate() : 0;
          
          const monthYearDiff = monthEventYear - monthCurrentYear;
          const monthDiff = monthEventMonth - currentMonth + (monthYearDiff * 12);
          
          const monthDayFraction = (monthEventDay - 1) / monthDaysInMonth;
          
          markerPosition = monthDiff + monthDayFraction;
          
          positionValue = markerPosition * markerSpacing;
          break;
          
        case 'year':
          // Calculate the exact year difference including fractional parts
          const yearEventYear = eventDate ? eventDate.getFullYear() : freshCurrentDate.getFullYear();
          const yearCurrentYear = freshCurrentDate.getFullYear();
          const yearDiff = yearEventYear - yearCurrentYear;
          
          // Calculate month as a fraction of a year (0-11 months = 0-0.92 of a year)
          const yearEventMonth = eventDate ? eventDate.getMonth() : 0;
          const yearMonthFraction = yearEventMonth / 12;
          
          // Calculate day as a fraction of a month
          const yearEventDay = eventDate ? eventDate.getDate() : 1;
          const yearDaysInMonth = eventDate ? new Date(yearEventYear, yearEventMonth + 1, 0).getDate() : 30;
          const yearDayFraction = (yearEventDay - 1) / yearDaysInMonth / 12; // Divide by 12 to scale to year
          
          // Combine all components for precise positioning
          markerPosition = yearDiff + yearMonthFraction + yearDayFraction;
          
          positionValue = markerPosition * markerSpacing;
          break;
          
        default:
          return {
            x: 0,
            y: 70,
          };
      }

      const isVisible = minMarker <= markerPosition && markerPosition <= maxMarker;
      
      if (!isVisible && index !== currentIndex) {
        return null;
      }
      
      return {
        x: Math.round(window.innerWidth/2 + positionValue + timelineOffset),
        y: 70,
        markerValue: markerPosition // Include the exact marker value
      };
    } else {
      const centerX = window.innerWidth / 2;
      const positionValue = (index - currentIndex) * markerSpacing;
      
      return {
        x: Math.round(centerX + positionValue + timelineOffset),
        y: 70,
        markerValue: index - currentIndex // For position view
      };
    }
  };

  useEffect(() => {
    const positionData = calculatePosition();
    if (positionData) {
      setPosition(positionData);
      const exactMarkerValue = positionData.markerValue || 0;
      setMarkerPosition(exactMarkerValue);
      console.log('[EventMarker] Position calculated for event:', event.id, 'markerValue:', exactMarkerValue);
    }
  }, [viewMode, freshCurrentDate, index, currentIndex, timelineOffset, markerSpacing, minMarker, maxMarker]);

  const getColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;
  };

  const getHoverColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.hover.dark : typeColors.hover.light;
  };

  const handleMarkerClick = (clickEvent) => {
    console.log('[EventMarker] Click handler called for event:', event.id, 'markerPosition:', markerPosition);
    // Call the onClick handler if provided, passing the exact marker position for Point B
    if (onClick) {
      onClick(event, index, clickEvent, markerPosition); // Pass the exact marker value
    } else {
      // Fallback to the old behavior if onClick is not provided
      if (index !== currentIndex) {
        onChangeIndex(index);
      }
    }
  };

  if (!position) return null;

  // The isSelected prop passed from TimelineV3 determines if this marker is selected
  // This ensures only the marker for the selected event shows its info popup
  
  // Determine if this marker should be visible
  const isVisible = position !== null;
  
  // Calculate opacity based on selected filter type
  const getMarkerOpacity = () => {
    // If no filter is selected (All), show all markers at full opacity
    if (!selectedType) return 1;
    
    // If this event matches the selected type, show at full opacity
    if (event.type === selectedType) return 1;
    
    // Otherwise, show at reduced opacity
    return 0.35;
  };
  
  // Calculate height adjustment based on selected filter type
  const getMarkerHeightMultiplier = () => {
    // If no filter is selected (All) or this event matches the selected type, use full height
    if (!selectedType || event.type === selectedType) return 1;
    
    // Otherwise, reduce height by 3/4 (to 1/4 of original)
    return 0.25;
  };
  
  // Calculate the maximum allowed height based on workspace constraints
  const getMaxAllowedHeight = (isSelectedMarker, isHoveredMarker) => {
    // Get the available height (distance from bottom of timeline to top of workspace)
    // For simplicity, we'll use a percentage of viewport height as a proxy
    const availableHeight = window.innerHeight * 0.3; // Approximately 30% of viewport height
    
    // Apply constraints based on marker state
    if (isSelectedMarker) {
      // Tallest state - ensure at least 10px from top
      return Math.min(availableHeight - 10, 120); // Cap at 120px max
    } else if (isHoveredMarker) {
      // Second tallest state - ensure at least 20px from top
      return Math.min(availableHeight - 20, 80); // Cap at 80px max
    } else {
      // Regular state - ensure at least 30px from top
      return Math.min(availableHeight - 30, 60); // Cap at 60px max
    }
  };
  
  // Add a debug class to help identify markers in different states
  const markerClass = isSelected ? 'selected-marker' : 'normal-marker';
  
  // Calculate transition properties based on isMoving state
  const getTransitionStyle = () => {
    if (isMoving) {
      // Direction of movement affects the sway direction
      const swayDirection = timelineOffset > 0 ? -10 : 10;
      
      return {
        // Scale Y to 0 (shrink vertically) and translate to create sway effect
        transform: `translateX(${swayDirection}px) scaleY(0)`,
        opacity: 0,
        transformOrigin: 'bottom center', // Shrink from bottom to top
        transition: 'transform 0.25s ease-out, opacity 0.15s ease-out'
      };
    }
    return {
      transform: 'scaleY(1)',
      opacity: 1,
      transformOrigin: 'bottom center', // Grow from bottom to top
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out' // Bouncy effect when appearing
    };
  };

  return (
    <>
      {isSelected ? (
        <Box
          sx={{
            position: 'absolute',
            left: `${position.x + horizontalOffset}px`, // Add horizontal offset
            bottom: `${position.y}px`,
            display: 'flex',
            alignItems: 'center',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            ...getTransitionStyle() // Apply transition style based on isMoving
          }}
        >
          <Box
            ref={markerRef}
            className="active-marker"
            onClick={handleMarkerClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              width: `${4 + (overlappingFactor - 1) * 0.5}px`, // Increase width slightly for overlapping events
              height: `${Math.min(getMaxAllowedHeight(true, false), Math.max(60, 40 * overlappingFactor) * getMarkerHeightMultiplier())}px`, // Height constrained by workspace
              cursor: 'pointer',
              position: 'relative',
              // Increased click area with pseudo-element
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: '-15px', // Increased from -8px to -15px for larger click area
                background: `radial-gradient(ellipse at center, ${getColor()}30 0%, transparent 70%)`,
                borderRadius: '4px',
                animation: 'pulse 2s infinite',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(to top, ${getColor()}99, ${getColor()})`,
                borderRadius: '4px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 10px ${getColor()}40`,
                opacity: getMarkerOpacity(),
              },
              '&:hover::after': {
                transform: 'scaleY(1.1) scaleX(1.5)',
                boxShadow: `
                  0 0 0 2px ${theme.palette.background.paper},
                  0 0 0 4px ${getColor()}40,
                  0 0 12px ${getColor()}60
                `,
              }
            }}
          />
          
          {/* Popup for selected marker - Context-aware positioning */}
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              // Position above the marker
              bottom: event.type === EVENT_TYPES.NEWS ? '24px' : '36px', // Lower position for news events
              left: '50%',
              transform: 'translateX(-50%) scale(0.8)', // Scale down by 20%
              transformOrigin: 'bottom center', // Ensure scaling happens from the bottom center
              p: 0, // Remove default padding to control it in child elements
              maxWidth: 256, // Reduced from 320 (320 * 0.8)
              width: 'max-content', // Allow width to adjust to content
              // Type-specific background colors
              bgcolor: (() => {
                if (event.type === EVENT_TYPES.MEDIA) {
                  return theme.palette.mode === 'dark' 
                    ? 'rgba(30,20,40,0.95)' // Darker purple for dark mode
                    : 'rgba(245,240,255,0.97)'; // Light purple for light mode
                } else if (event.type === EVENT_TYPES.NEWS) {
                  return theme.palette.mode === 'dark' 
                    ? 'rgba(40,20,20,0.95)' // Darker red for dark mode
                    : 'rgba(255,245,245,0.97)'; // Light red for light mode
                } else {
                  // Default/Remark
                  return theme.palette.mode === 'dark' 
                    ? 'rgba(15,15,35,0.95)' // Darker blue for dark mode
                    : 'rgba(245,250,255,0.97)'; // Light blue for light mode
                }
              })(),
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              // Type-specific border colors
              border: `1px solid ${(() => {
                if (event.type === EVENT_TYPES.MEDIA) {
                  return theme.palette.mode === 'dark' 
                    ? 'rgba(180,160,220,0.2)' // Purple border for dark mode
                    : 'rgba(140,100,220,0.15)'; // Purple border for light mode
                } else if (event.type === EVENT_TYPES.NEWS) {
                  return theme.palette.mode === 'dark' 
                    ? 'rgba(220,160,160,0.2)' // Red border for dark mode
                    : 'rgba(220,100,100,0.15)'; // Red border for light mode
                } else {
                  // Default/Remark
                  return theme.palette.mode === 'dark' 
                    ? 'rgba(160,180,220,0.2)' // Blue border for dark mode
                    : 'rgba(100,140,220,0.15)'; // Blue border for light mode
                }
              })()}`,
              overflow: 'hidden', // For rounded corners on media content
              // Type-specific box shadows
              boxShadow: (() => {
                if (event.type === EVENT_TYPES.MEDIA) {
                  return theme.palette.mode === 'dark' 
                    ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(100,50,150,0.3)' 
                    : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(100,50,150,0.15)';
                } else if (event.type === EVENT_TYPES.NEWS) {
                  return theme.palette.mode === 'dark' 
                    ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(150,50,50,0.3)' 
                    : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(150,50,50,0.15)';
                } else {
                  // Default/Remark
                  return theme.palette.mode === 'dark' 
                    ? '0 8px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(50,100,150,0.3)' 
                    : '0 8px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(50,100,150,0.15)';
                }
              })(),
              zIndex: 9000, // Significantly higher z-index to ensure it appears above all containers
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              // Arrow pointer at the bottom of the card
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-8px', // Position at the bottom of the card
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                border: '8px solid transparent',
                borderTopColor: (() => {
                  // Type-specific colors for the arrow
                  if (event.type === EVENT_TYPES.MEDIA) {
                    return theme.palette.mode === 'dark' 
                      ? `rgba(30,20,40,0.95)` // Darker purple for dark mode
                      : `rgba(245,240,255,0.97)`; // Light purple for light mode
                  } else if (event.type === EVENT_TYPES.NEWS) {
                    return theme.palette.mode === 'dark' 
                      ? `rgba(40,20,20,0.95)` // Darker red for dark mode
                      : `rgba(255,245,245,0.97)`; // Light red for light mode
                  } else {
                    // Default/Remark
                    return theme.palette.mode === 'dark' 
                      ? `rgba(15,15,35,0.95)` // Darker blue for dark mode
                      : `rgba(245,250,255,0.97)`; // Light blue for light mode
                  }
                })()
              }
            }}
          >
            {/* Render the appropriate marker based on event type */}
            {event.type === EVENT_TYPES.REMARK ? (
              <RemarkEventMarker event={event} />
            ) : event.type === EVENT_TYPES.NEWS ? (
              <NewsEventMarker event={event} />
            ) : event.type === EVENT_TYPES.MEDIA ? (
              <MediaEventMarker event={event} />
            ) : null}
          </Paper>
        </Box>
      ) : (
        <Box
          ref={markerRef}
          className={markerClass}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            position: 'absolute',
            left: `${position.x + horizontalOffset}px`, // Add horizontal offset
            bottom: `${position.y}px`,
            width: `${3 + (overlappingFactor - 1) * 0.5}px`, // Increase width slightly for overlapping events
            // Calculate base height based on view mode
            height: `${(() => {
              // Set minimum heights based on view mode
              let baseHeight = 24; // Default base height
              let minHeight = 40; // Default minimum height
              
              if (viewMode === 'day') {
                minHeight = 50; // Larger minimum for day view
                baseHeight = 30;
              } else if (viewMode === 'week') {
                minHeight = 45; // Medium minimum for week view
                baseHeight = 28;
              } else if (viewMode === 'month') {
                minHeight = 40; // Standard minimum for month view
                baseHeight = 26;
              } else if (viewMode === 'year') {
                minHeight = 35; // Smaller minimum for year view to avoid overcrowding
                baseHeight = 24;
              }
              
              // Calculate base height based on view mode and overlapping factor
              const baseCalculatedHeight = Math.max(minHeight, baseHeight * overlappingFactor) * getMarkerHeightMultiplier();
              // Apply workspace constraints
              return Math.min(getMaxAllowedHeight(false, isHovered), baseCalculatedHeight);
            })()}px`, // Height constrained by workspace
            borderRadius: '2px',
            background: `linear-gradient(to top, ${getColor()}80, ${getColor()})`,
            transform: isMoving 
              ? `translateX(-50%) translateX(${timelineOffset > 0 ? -10 : 10}px) scaleY(0)` 
              : 'translateX(-50%)',
            transformOrigin: 'bottom center', // Shrink from bottom to top
            opacity: isMoving ? 0 : getMarkerOpacity(),
            cursor: 'pointer',
            transition: isMoving
              ? 'all 0.25s ease-out' // Faster transition for movement
              : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy effect when appearing
            // Enhanced visual appearance for all filter views (day, week, month, year)
            ...(viewMode !== 'position' && {
              boxShadow: isMoving ? 'none' : `0 0 6px ${getColor()}40`,
              // Special styling for week view
              ...(viewMode === 'week' && {
                width: '4px',
                boxShadow: isMoving ? 'none' : `0 0 8px ${getColor()}60`
              })
            }),
            // Add a larger invisible click area using ::before pseudo-element
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '-15px', // Creates a 15px invisible padding around the marker
              zIndex: 1, // Ensures it's clickable
            },
            '&:hover': {
              background: isMoving ? `linear-gradient(to top, ${getColor()}80, ${getColor()})` : `linear-gradient(to top, ${getHoverColor()}90, ${getHoverColor()})`,
              transform: isMoving 
                ? `translateX(-50%) translateX(${timelineOffset > 0 ? -10 : 10}px) scaleY(0)` 
                : 'translateX(-50%) scaleY(1.2) scaleX(1.3)',
              boxShadow: isMoving ? 'none' : `0 0 8px ${getColor()}60`,
              ...(viewMode !== 'position' && {
                boxShadow: isMoving ? 'none' : `0 0 10px ${getColor()}70`,
                // Enhanced hover effect for week view
                ...(viewMode === 'week' && {
                  boxShadow: isMoving ? 'none' : `0 0 12px ${getColor()}80`
                })
              })
            },
            zIndex: 800, // Reduced from 1000 to 800 (below hover marker at 900)
          }}
          onClick={handleMarkerClick}
        />
      )}
    </>
  );
};

export default EventMarker;
