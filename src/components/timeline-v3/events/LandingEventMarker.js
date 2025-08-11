// A simplified version of EventMarker specifically for the landing page
// This version doesn't include the popup overlay functionality

import React, { useState, useEffect } from 'react';
import { Box, useTheme, Paper, Typography, Divider } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import PhotoIcon from '@mui/icons-material/Photo';
import LuggageIcon from '@mui/icons-material/Luggage';
import PeopleIcon from '@mui/icons-material/People';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from './EventTypes';
import { 
  differenceInMilliseconds,
  isSameDay
} from 'date-fns';

const LandingEventMarker = ({ 
  event, 
  timelineOffset, 
  markerSpacing,
  viewMode,
  onClick,
  isSelected = false,
  isMoving = false
}) => {
  const theme = useTheme();
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

  // Calculate position based on view mode and event date
  const calculatePosition = () => {
    if (viewMode !== 'position') {
      const eventDate = event && event.event_date ? new Date(event.event_date) : null;
      let positionValue = 0;
      let markerPosition = 0;
      
      switch (viewMode) {
        case 'day':
          // Calculate day difference
          const dayDiffMs = eventDate ? differenceInMilliseconds(
            new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
            new Date(freshCurrentDate.getFullYear(), freshCurrentDate.getMonth(), freshCurrentDate.getDate())
          ) : 0;
          
          const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
          
          // Calculate hours from midnight
          const currentHour = freshCurrentDate.getHours();
          const eventHour = eventDate ? eventDate.getHours() : 0;
          const eventMinute = eventDate ? eventDate.getMinutes() : 0;
          
          markerPosition = (dayDiff * 24) + eventHour - currentHour + (eventMinute / 60);
          positionValue = markerPosition * markerSpacing;
          break;
          
        case 'week':
          const dayDiffMsWeek = eventDate ? differenceInMilliseconds(
            new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
            new Date(freshCurrentDate.getFullYear(), freshCurrentDate.getMonth(), freshCurrentDate.getDate())
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
          
          const yearMonthContribution = eventDate ? eventDate.getMonth() / 12 : 0;
          const yearDayFraction = eventDate ? (eventDate.getDate() - 1) / new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, 0).getDate() : 0;
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
      
      return {
        x: Math.round(window.innerWidth/2 + positionValue + timelineOffset),
        y: 70,
      };
    } else {
      return {
        x: Math.round(window.innerWidth/2 + timelineOffset),
        y: 70,
      };
    }
  };

  useEffect(() => {
    const position = calculatePosition();
    setPosition(position);
  }, [viewMode, freshCurrentDate, timelineOffset, markerSpacing]);

  const getColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;
  };

  const getHoverColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.hover.dark : typeColors.hover.light;
  };

  const handleMarkerClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  if (!position) return null;

  // Calculate transition properties based on isMoving state
  const getTransitionStyle = () => {
    if (isMoving) {
      const swayDirection = timelineOffset > 0 ? -10 : 10;
      
      return {
        transform: `translateX(${swayDirection}px) scaleY(0)`,
        opacity: 0,
        transformOrigin: 'bottom center',
        transition: 'transform 0.25s ease-out, opacity 0.15s ease-out'
      };
    }
    return {
      transform: 'scaleY(1)',
      opacity: 1,
      transformOrigin: 'bottom center',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out'
    };
  };

  // Format date for display in tooltip
  const formatDate = (date) => {
    if (!date) return '';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('en-US', options);
  };
  
  // Get appropriate media content based on event and view
  const getMediaContent = () => {
    // Context-appropriate icons for specific events in each view
    
    // Day view - Lunch with friends
    if (viewMode === 'day' && event.title === "Lunch with friends") {
      return {
        type: 'icon',
        icon: <RestaurantIcon sx={{ 
          fontSize: 48, 
          color: getColor(),
          filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
        }} />,
        bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,192,203,0.15)',
        label: 'Dining'
      };
    }
    
    // Week view - Weekend getaway
    if (viewMode === 'week' && event.title === "Weekend getaway") {
      return {
        type: 'icon',
        icon: <LuggageIcon sx={{ 
          fontSize: 48, 
          color: getColor(),
          filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
        }} />,
        bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(173,216,230,0.15)',
        label: 'Travel'
      };
    }
    
    // Month view - Company Retreat
    if (viewMode === 'month' && event.title === "Company Retreat") {
      return {
        type: 'icon',
        icon: <PeopleIcon sx={{ 
          fontSize: 48, 
          color: getColor(),
          filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
        }} />,
        bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(144,238,144,0.15)',
        label: 'Team'
      };
    }
    
    // Year view - Conference events
    if (viewMode === 'year') {
      if (event.title === "Next Year's Conference") {
        return {
          type: 'icon',
          icon: <EventIcon sx={{ 
            fontSize: 48, 
            color: getColor(),
            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
          }} />,
          bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,222,173,0.15)',
          label: 'Conference'
        };
      } else if (event.title === "Five-Year Company Goal") {
        return {
          type: 'icon',
          icon: <BusinessIcon sx={{ 
            fontSize: 48, 
            color: getColor(),
            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
          }} />,
          bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(216,191,216,0.15)',
          label: 'Business'
        };
      }
    }
    
    // Default for all other media events - context-based icons
    if (event.type === 'media') {
      const title = event.title.toLowerCase();
      const desc = event.description.toLowerCase();
      
      // Travel-related events
      if (title.includes('trip') || title.includes('travel') || 
          desc.includes('trip') || desc.includes('travel')) {
        return { 
          type: 'icon', 
          icon: <DirectionsCarIcon sx={{ 
            fontSize: 48, 
            color: getColor(),
            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
          }} />,
          bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(173,216,230,0.15)',
          label: 'Travel'
        };
      }
      
      // Food-related events
      if (title.includes('lunch') || title.includes('dinner') || title.includes('food') ||
          desc.includes('lunch') || desc.includes('dinner') || desc.includes('food')) {
        return { 
          type: 'icon', 
          icon: <RestaurantIcon sx={{ 
            fontSize: 48, 
            color: getColor(),
            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
          }} />,
          bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,192,203,0.15)',
          label: 'Dining'
        };
      }
      
      // Celebration events
      if (title.includes('party') || title.includes('celebration') || 
          desc.includes('party') || desc.includes('celebration')) {
        return { 
          type: 'icon', 
          icon: <CelebrationIcon sx={{ 
            fontSize: 48, 
            color: getColor(),
            filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
          }} />,
          bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,222,173,0.15)',
          label: 'Celebration'
        };
      }
      
      // Generic media event
      return { 
        type: 'icon', 
        icon: <PhotoIcon sx={{ 
          fontSize: 48, 
          color: getColor(),
          filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
        }} />,
        bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(230,230,250,0.15)',
        label: 'Media'
      };
    }
    
    // Fallback for non-media events
    return { 
      type: 'icon', 
      icon: <PhotoIcon sx={{ 
        fontSize: 48, 
        color: getColor(),
        filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'
      }} />,
      bgColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(230,230,250,0.15)',
      label: 'Media'
    };
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: 'absolute',
          left: `${position.x + horizontalOffset}px`,
          bottom: `${position.y}px`,
          width: `${3 + (overlappingFactor - 1) * 0.5}px`,
          height: `${(() => {
            let baseHeight = 24;
            let minHeight = 40;
            
            if (viewMode === 'day') {
              minHeight = 50;
              baseHeight = 30;
            } else if (viewMode === 'week') {
              minHeight = 45;
              baseHeight = 28;
            } else if (viewMode === 'month') {
              minHeight = 40;
              baseHeight = 26;
            } else if (viewMode === 'year') {
              minHeight = 35;
              baseHeight = 24;
            }
            
            return Math.max(minHeight, baseHeight * overlappingFactor);
          })()}px`,
          borderRadius: '2px',
          background: `linear-gradient(to top, ${getColor()}80, ${getColor()})`,
          transform: isMoving 
            ? `translateX(-50%) translateX(${timelineOffset > 0 ? -10 : 10}px) scaleY(0)` 
            : 'translateX(-50%)',
          transformOrigin: 'bottom center',
          opacity: isMoving ? 0 : 1,
          cursor: 'pointer',
          transition: isMoving
            ? 'all 0.25s ease-out'
            : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isMoving ? 'none' : `0 0 6px ${getColor()}40`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '-15px',
            zIndex: 1,
          },
          '&:hover': {
            background: isMoving ? `linear-gradient(to top, ${getColor()}80, ${getColor()})` : `linear-gradient(to top, ${getHoverColor()}90, ${getHoverColor()})`,
            transform: isMoving 
              ? `translateX(-50%) translateX(${timelineOffset > 0 ? -10 : 10}px) scaleY(0)` 
              : 'translateX(-50%) scaleY(1.2) scaleX(1.3)',
            boxShadow: isMoving ? 'none' : `0 0 8px ${getColor()}60`,
          },
          zIndex: 800,
        }}
        onClick={handleMarkerClick}
      />
      
      {/* Tooltip/hover card that appears on hover */}
      {isHovered && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: `${position.y + 50}px`,
            left: `${position.x}px`,
            transform: 'translateX(-50%)',
            p: 0, // Removed padding to allow image to extend to edges
            maxWidth: event.type === 'media' ? 280 : event.type === 'news' ? 320 : 250,
            width: 'max-content',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: event.type === 'news' ? '8px' : '16px', // More squared for news, rounded for others
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 20px rgba(0,0,0,0.5)' 
              : '0 8px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden', // Ensure image doesn't overflow rounded corners
            zIndex: 900,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '8px solid transparent',
              borderTopColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'
            }
          }}
        >
          {/* Special styling for news events - magazine/newspaper style */}
          {event.type === 'news' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header with source and date */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2,
                pt: 1.5,
                pb: 0.5
              }}>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                    letterSpacing: 1
                  }}
                >
                  BREAKING NEWS
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.7rem',
                    color: theme.palette.text.secondary
                  }}
                >
                  {formatDate(event.event_date)}
                </Typography>
              </Box>
              
              {/* Title - newspaper headline style */}
              <Box sx={{ px: 2, pt: 0.5, pb: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    fontSize: '1.1rem',
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    mb: 0.5
                  }}
                >
                  {event.title}
                </Typography>
              </Box>
              
              <Divider sx={{ mx: 2, borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              
              {/* Main content area */}
              <Box sx={{ p: 2, pt: 1.5 }}>
                {/* First paragraph with first letter styled */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 1.5,
                    lineHeight: 1.5,
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    '&::first-letter': {
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      float: 'left',
                      lineHeight: 1,
                      paddingRight: '3px',
                      color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                    }
                  }}
                >
                  {event.description}
                </Typography>
                
                {/* Tags as categories */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  mt: 1,
                  flexWrap: 'wrap'
                }}>
                  {event.tags && event.tags.map((tag, index) => (
                    <Typography 
                      key={index}
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.65rem',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: theme.palette.text.secondary,
                        px: 0.8,
                        py: 0.3,
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {tag}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : event.type === 'media' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Image or icon section */}
              <Box 
                sx={{
                  height: 140,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(245,245,245,0.8)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Simplified media content rendering */}
                {(() => {
                  const content = getMediaContent();
                  
                  // Image content
                  if (content.type === 'image') {
                    return (
                      <Box 
                        component="img"
                        src={content.src}
                        alt={content.alt}
                        loading="eager"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                        }}
                      />
                    );
                  } 
                  
                  // Icon content
                  return (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                      bgcolor: content.bgColor || (theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'),
                      transition: 'all 0.3s ease'
                    }}>
                      {content.icon}
                      {content.label && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            mt: 1, 
                            fontWeight: 500,
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.7rem'
                          }}
                        >
                          {content.label}
                        </Typography>
                      )}
                    </Box>
                  );
                })()}
              </Box>
              
              {/* Content section with bubble-like styling */}
              <Box sx={{ 
                p: 2,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                mt: -2, // Overlap the image slightly for a layered effect
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0px -4px 10px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  mb: 0.5, 
                  lineHeight: 1.2,
                  color: getColor() // Use event type color for title
                }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ 
                  display: 'block', 
                  mt: 0.5,
                  fontWeight: 500 // Slightly bolder date for better readability
                }}>
                  {formatDate(event.event_date)}
                </Typography>
              </Box>
            </Box>
          ) : (
            /* Standard styling for other event types */
            <Box sx={{ p: 1.5 }}>
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
                {formatDate(event.event_date)}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default LandingEventMarker;
