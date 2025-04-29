// NOTE: This component requires accurate date/time information for proper functionality.
// There are additional considerations to ensure it works correctly.

// FUTURE ENHANCEMENT: Implement a smooth curvature winding line that rests on top of all event marker lines,
// connecting them visually like an audioform soundwave. This would provide a visual continuity
// to the timeline, especially in year view where many events may be displayed.

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, useTheme, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TimelineEvent from './TimelineEvent';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from './EventTypes';
import { EventHoverCard } from './EventHoverCard';
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFreshCurrentDate(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Calculate if this event overlaps with others based on position
  useEffect(() => {
    if (viewMode !== 'position' && position) {
      const eventPositions = window.timelineEventPositions || [];
      
      // Update this event's position in the global array
      const existingIndex = eventPositions.findIndex(ep => ep.id === event.id);
      if (existingIndex >= 0) {
        eventPositions[existingIndex] = {
          id: event.id,
          x: position.x,
          viewMode,
          type: event.type,
          eventData: event // Store the full event data for more accurate comparison
        };
      } else {
        eventPositions.push({
          id: event.id,
          x: position.x,
          viewMode,
          type: event.type,
          eventData: event // Store the full event data for more accurate comparison
        });
      }
      window.timelineEventPositions = eventPositions;
      
      // Adjust proximity threshold based on view mode
      // Larger views (year, month) need larger thresholds
      let proximityThreshold = 10; // Default
      if (viewMode === 'month') proximityThreshold = 15;
      if (viewMode === 'year') proximityThreshold = 40; // Increased from 30 to 40 for year view
      
      // Find nearby events with more sophisticated collision detection
      let nearbyEvents = [];
      
      if (viewMode === 'year') {
        // For year view, use a more aggressive proximity detection
        // Consider events within the same month or adjacent months as nearby
        nearbyEvents = eventPositions.filter(ep => {
          if (ep.id === event.id || ep.viewMode !== viewMode) return false;
          
          // Check if events are close horizontally
          const isClose = Math.abs(ep.x - position.x) < proximityThreshold;
          
          // Make sure both event objects and their dates exist before comparing
          if (event && event.event_date && ep.eventData && ep.eventData.event_date) {
            // If events are in the same month (or close), count them as nearby
            // This helps detect clustering in year view where events might be stacked
            const eventDate = new Date(event.event_date);
            const otherEventDate = new Date(ep.eventData.event_date);
            const sameMonth = eventDate.getMonth() === otherEventDate.getMonth();
            const adjacentMonth = Math.abs(eventDate.getMonth() - otherEventDate.getMonth()) <= 1;
            
            return isClose || (sameMonth && Math.abs(ep.x - position.x) < 60) || 
                   (adjacentMonth && Math.abs(ep.x - position.x) < 45);
          }
          
          // If we can't compare dates, just use horizontal proximity
          return isClose;
        });
      } else if (viewMode === 'month') {
        // For month view, consider events in the same week as nearby
        nearbyEvents = eventPositions.filter(ep => {
          if (ep.id === event.id || ep.viewMode !== viewMode) return false;
          
          // Check if events are close horizontally
          const isClose = Math.abs(ep.x - position.x) < proximityThreshold;
          
          // Compare dates if available
          if (event && event.event_date && ep.eventData && ep.eventData.event_date) {
            const eventDate = new Date(event.event_date);
            const otherEventDate = new Date(ep.eventData.event_date);
            
            // Check if events are in the same week
            const sameWeek = Math.abs(eventDate.getDate() - otherEventDate.getDate()) < 7;
            
            return isClose || (sameWeek && Math.abs(ep.x - position.x) < 40);
          }
          
          return isClose;
        });
      } else if (viewMode === 'week') {
        // For week view, use a standard proximity check with slightly increased threshold
        nearbyEvents = eventPositions.filter(ep => 
          ep.id !== event.id && 
          ep.viewMode === viewMode &&
          Math.abs(ep.x - position.x) < (proximityThreshold + 5)
        );
      } else {
        // For day view and other views, use the standard proximity detection
        nearbyEvents = eventPositions.filter(ep => 
          ep.id !== event.id && 
          ep.viewMode === viewMode &&
          Math.abs(ep.x - position.x) < proximityThreshold
        );
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
          const eventYear = eventDate ? eventDate.getFullYear() : 0;
          const currentYear = freshCurrentDate.getFullYear();
          const eventMonth = eventDate ? eventDate.getMonth() : 0;
          const currentMonth = freshCurrentDate.getMonth();
          const eventDay = eventDate ? eventDate.getDate() : 0;
          const daysInMonth = eventDate ? new Date(eventYear, eventMonth + 1, 0).getDate() : 0;
          
          const monthYearDiff = eventYear - currentYear;
          const monthDiff = eventMonth - currentMonth + (monthYearDiff * 12);
          
          const monthDayFraction = (eventDay - 1) / daysInMonth;
          
          markerPosition = monthDiff + monthDayFraction;
          
          positionValue = markerPosition * markerSpacing;
          break;
          
        case 'year':
          const yearDiff = eventDate ? eventDate.getFullYear() - freshCurrentDate.getFullYear() : 0;
          
          const yearMonthFraction = eventDate ? eventDate.getMonth() / 12 : 0;
          const yearDayFraction = eventDate ? (eventDate.getDate() - 1) / new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, 0).getDate() : 0;
          
          const yearMonthContribution = eventDate ? eventDate.getMonth() / 12 : 0;
          const yearDayContribution = eventDate ? yearDayFraction / 12 : 0;
          
          markerPosition = yearDiff + yearMonthContribution + yearDayContribution;
          
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
      };
    } else {
      const centerX = window.innerWidth / 2;
      const positionValue = (index - currentIndex) * markerSpacing;
      
      return {
        x: Math.round(centerX + positionValue + timelineOffset),
        y: 70,
      };
    }
  };

  useEffect(() => {
    const position = calculatePosition();
    setPosition(position);
  }, [viewMode, freshCurrentDate, index, currentIndex, timelineOffset, markerSpacing, minMarker, maxMarker]);

  const getColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;
  };

  const getHoverColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.hover.dark : typeColors.hover.light;
  };

  const handleMarkerClick = () => {
    // Call the onClick handler if provided
    if (onClick) {
      onClick(event, index);
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
            sx={{
              width: `${4 + (overlappingFactor - 1) * 0.5}px`, // Increase width slightly for overlapping events
              height: `${Math.max(60, 40 * overlappingFactor) * getMarkerHeightMultiplier()}px`, // Increased minimum height with adjustment for overlapping factor and filter type
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
              // Smart positioning based on view mode and available space
              ...(viewMode === 'year' ? {
                // For year view, position to the side instead of above
                bottom: '0px',
                left: '100%',
                marginLeft: '12px',
                transform: 'none',
                // If marker is on the right side of the screen, position to the left
                ...(position.x > window.innerWidth / 2 && {
                  left: 'auto',
                  right: '100%',
                  marginLeft: '0px',
                  marginRight: '12px'
                })
              } : {
                // For other views, position above but with a minimum distance from the top
                bottom: `${Math.min(45 + (overlappingFactor - 1) * 20, window.innerHeight - 200)}px`,
                left: '50%',
                transform: 'translateX(-50%)'
              }),
              p: 1.5,
              maxWidth: 280,
              width: 'max-content', // Allow width to adjust to content
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 16px rgba(0,0,0,0.5)' 
                : '0 8px 16px rgba(0,0,0,0.1)',
              zIndex: 900,
              '&::after': {
                content: '""',
                position: 'absolute',
                ...(viewMode === 'year' 
                  ? {
                      // For year view, arrow points left or right
                      ...(position.x > window.innerWidth / 2 
                        ? { // Right side of screen - arrow points right
                            top: '50%',
                            right: '100%',
                            transform: 'translateY(-50%)',
                            border: '8px solid transparent',
                            borderRightColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'
                          }
                        : { // Left side of screen - arrow points left
                            top: '50%',
                            left: '100%',
                            transform: 'translateY(-50%)',
                            border: '8px solid transparent',
                            borderLeftColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'
                          })
                    }
                  : { // Other views - arrow points down
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      border: '8px solid transparent',
                      borderTopColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'
                    })
              }
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5, lineHeight: 1.2 }}>
              {event.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 0.5,
              lineHeight: 1.3
            }}>
              {event.description}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {event && event.event_date ? new Date(event.event_date).toLocaleString() : ''}
            </Typography>
          </Paper>
        </Box>
      ) : (
        <Box
          ref={markerRef}
          className={markerClass}
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
              
              return Math.max(minHeight, baseHeight * overlappingFactor);
            })() * getMarkerHeightMultiplier()}px`, // Adjust height based on view mode, overlapping factor and selected filter type
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
