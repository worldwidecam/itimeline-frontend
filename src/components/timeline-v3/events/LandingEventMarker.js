import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { EVENT_TYPE_COLORS, EVENT_TYPES } from './EventTypes';
import { differenceInMilliseconds } from 'date-fns';
import RemarkEventMarker from './markers/RemarkEventMarker';
import NewsEventMarker from './markers/NewsEventMarker';
import MediaEventMarker from './markers/MediaEventMarker';

const LandingEventMarker = ({
  event,
  timelineOffset,
  markerSpacing,
  viewMode,
  onClick,
  isSelected = false,
  isMoving = false,
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [freshCurrentDate, setFreshCurrentDate] = useState(new Date());
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFreshCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Calculate position based on view mode and event date
  const calculatePosition = () => {
    if (viewMode !== 'position') {
      const eventDate = event && event.event_date ? new Date(event.event_date) : null;
      let markerPosition = 0;

      switch (viewMode) {
        case 'day': {
          const dayDiffMs = eventDate
            ? differenceInMilliseconds(
                new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
                new Date(freshCurrentDate.getFullYear(), freshCurrentDate.getMonth(), freshCurrentDate.getDate())
              )
            : 0;
          const dayDiff = dayDiffMs / (1000 * 60 * 60 * 24);
          const currentHour = freshCurrentDate.getHours();
          const eventHour = eventDate ? eventDate.getHours() : 0;
          const eventMinute = eventDate ? eventDate.getMinutes() : 0;

          markerPosition = dayDiff * 24 + eventHour - currentHour + eventMinute / 60;
          break;
        }

        case 'week': {
          const dayDiffMsWeek = eventDate
            ? differenceInMilliseconds(
                new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()),
                new Date(freshCurrentDate.getFullYear(), freshCurrentDate.getMonth(), freshCurrentDate.getDate())
              )
            : 0;
          const dayDiffWeek = dayDiffMsWeek / (1000 * 60 * 60 * 24);

          if (dayDiffWeek === 0) {
            const totalMinutesInDay = 24 * 60;
            const eventMinutesIntoDay = eventDate ? eventDate.getHours() * 60 + eventDate.getMinutes() : 0;
            markerPosition = eventMinutesIntoDay / totalMinutesInDay;
          } else {
            const eventHourWeek = eventDate ? eventDate.getHours() : 0;
            const eventMinuteWeek = eventDate ? eventDate.getMinutes() : 0;
            const totalMinutesInDay = 24 * 60;
            const eventMinutesIntoDay = eventHourWeek * 60 + eventMinuteWeek;
            markerPosition = Math.floor(dayDiffWeek) + eventMinutesIntoDay / totalMinutesInDay;
          }
          break;
        }

        case 'month': {
          const eventYear = eventDate ? eventDate.getFullYear() : 0;
          const currentYear = freshCurrentDate.getFullYear();
          const eventMonth = eventDate ? eventDate.getMonth() : 0;
          const currentMonth = freshCurrentDate.getMonth();
          const eventDay = eventDate ? eventDate.getDate() : 0;
          const daysInMonth = eventDate ? new Date(eventYear, eventMonth + 1, 0).getDate() : 0;

          const monthYearDiff = eventYear - currentYear;
          const monthDiff = eventMonth - currentMonth + monthYearDiff * 12;
          const monthDayFraction = daysInMonth > 0 ? (eventDay - 1) / daysInMonth : 0;

          markerPosition = monthDiff + monthDayFraction;
          break;
        }

        case 'year': {
          const yearDiff = eventDate ? eventDate.getFullYear() - freshCurrentDate.getFullYear() : 0;
          const yearMonthContribution = eventDate ? eventDate.getMonth() / 12 : 0;
          const daysInYearMonth = eventDate ? new Date(eventDate.getFullYear(), eventDate.getMonth() + 1, 0).getDate() : 30;
          const yearDayFraction = eventDate ? (eventDate.getDate() - 1) / daysInYearMonth : 0;
          const yearDayContribution = yearDayFraction / 12;

          markerPosition = yearDiff + yearMonthContribution + yearDayContribution;
          break;
        }

        default:
          return {
            x: 0,
            y: 70,
          };
      }

      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const positionValue = markerPosition * markerSpacing;

      return {
        x: Math.round(screenWidth / 2 + positionValue + timelineOffset),
        y: 70,
      };
    } else {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      return {
        x: Math.round(screenWidth / 2 + timelineOffset),
        y: 70,
      };
    }
  };

  useEffect(() => {
    const calculated = calculatePosition();
    setPosition(calculated);
  }, [viewMode, freshCurrentDate, timelineOffset, markerSpacing]);

  const getColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event?.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.dark : typeColors.light;
  };

  const getHoverColor = () => {
    const typeColors = EVENT_TYPE_COLORS[event?.type] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? typeColors.hover.dark : typeColors.hover.light;
  };

  const handleMarkerClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  if (!position) return null;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Timeline line marker */}
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: 'absolute',
          left: `${position.x}px`,
          bottom: `${position.y}px`,
          width: '3px',
          height: (() => {
            if (viewMode === 'day') return '50px';
            if (viewMode === 'week') return '45px';
            if (viewMode === 'month') return '40px';
            return '35px';
          })(),
          borderRadius: '2px',
          background: `linear-gradient(to top, ${getColor()}80, ${getColor()})`,
          transform: isMoving
            ? `translateX(-50%) translateX(${timelineOffset > 0 ? -10 : 10}px) scaleY(0)`
            : 'translateX(-50%)',
          transformOrigin: 'bottom center',
          opacity: isMoving ? 0 : 1,
          cursor: 'pointer',
          transition: isMoving ? 'all 0.25s ease-out' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isMoving ? 'none' : `0 0 6px ${getColor()}40`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '-15px',
            zIndex: 1,
          },
          '&:hover': {
            background: isMoving
              ? `linear-gradient(to top, ${getColor()}80, ${getColor()})`
              : `linear-gradient(to top, ${getHoverColor()}90, ${getHoverColor()})`,
            transform: isMoving
              ? `translateX(-50%) translateX(${timelineOffset > 0 ? -10 : 10}px) scaleY(0)`
              : 'translateX(-50%) scaleY(1.2) scaleX(1.3)',
            boxShadow: isMoving ? 'none' : `0 0 8px ${getColor()}60`,
          },
          zIndex: 800,
        }}
        onClick={handleMarkerClick}
      />

      {/* Actual Hover Preview Cards rendered on hover */}
      {isHovered && (
        <Box
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            position: 'absolute',
            bottom: `${position.y + 40}px`,
            left: `${position.x}px`,
            transform: 'translateX(-50%)',
            zIndex: 9000,
            pointerEvents: 'auto',
          }}
        >
          {event?.type === EVENT_TYPES.REMARK ? (
            <RemarkEventMarker
              event={event}
              onDelete={null}
              onEdit={null}
              isLandingPreview={true}
              avatarSide={position?.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 600) ? 'right' : 'left'}
            />
          ) : event?.type === EVENT_TYPES.NEWS ? (
            <NewsEventMarker
              event={event}
              onDelete={null}
              onEdit={null}
              isLandingPreview={true}
            />
          ) : (
            <MediaEventMarker
              event={event}
              onDelete={null}
              onEdit={null}
              isLandingPreview={true}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default LandingEventMarker;
