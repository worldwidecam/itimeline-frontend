import React, { useState, useEffect, useRef } from 'react';
import { Box, useTheme, Typography, CircularProgress } from '@mui/material';
import TimelineBackground from './timeline-v3/TimelineBackground';
import TimelineBar from './timeline-v3/TimelineBar';
import TimeMarkers from './timeline-v3/TimeMarkers';
import LandingEventMarker from './timeline-v3/events/LandingEventMarker';
import calculateMarkerValue from './timeline-v3/events/markerPosition';
import EventPopup from './timeline-v3/events/EventPopup';
import api from '../utils/api';

// Helper to determine the best view mode so the majority of events fit comfortably
const determineBestViewMode = (eventList) => {
  if (!eventList || eventList.length === 0) return 'day';

  const modes = ['day', 'week', 'month', 'year'];
  const refDate = new Date();

  for (const mode of modes) {
    const values = eventList
      .filter((e) => e.event_date)
      .map((e) => calculateMarkerValue(e.event_date, mode, refDate));

    if (values.length === 0) continue;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min;

    // If events span 16 markers or fewer (1600px total draggable spread), use this view mode
    if (spread <= 16) {
      return mode;
    }
  }

  return 'year';
};

function LandingTimelineV3() {
  const theme = useTheme();
  const containerRef = useRef(null);
  const timelineBarRef = useRef(null);

  // Core state for timeline
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [markers, setMarkers] = useState([]);
  const [viewMode, setViewMode] = useState('day');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [popupEvent, setPopupEvent] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  // Drag interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [startDragX, setStartDragX] = useState(0);
  const [startOffset, setStartOffset] = useState(0);

  // Define marker styles
  const markerStyles = {
    regular: {
      '& .marker-line': {
        backgroundColor: theme.palette.divider,
      },
      '& .marker-label': {
        color: theme.palette.text.secondary,
      },
    },
    reference: {
      '& .marker-line': {
        backgroundColor: theme.palette.primary.main,
        height: '25px',
        width: '3px',
      },
      '& .marker-label': {
        color: theme.palette.primary.main,
        fontWeight: 'bold',
      },
    },
  };

  // Initialize background markers
  useEffect(() => {
    const getInitialMarkers = () => {
      const markerSpacing = 100;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const markersNeeded = Math.ceil(screenWidth / markerSpacing) * 3;
      const totalMarkers = markersNeeded + (markersNeeded % 2 === 0 ? 1 : 0);
      const sideCount = Math.floor(totalMarkers / 2);

      return Array.from({ length: totalMarkers }, (_, i) => i - sideCount);
    };

    setMarkers(getInitialMarkers());
  }, []);

  // Fetch safety-filtered popular events for landing page
  useEffect(() => {
    let active = true;

    const loadPopularEvents = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/v1/events/popular/landing');
        if (!active) return;

        const fetchedEvents = Array.isArray(res.data) ? res.data : [];
        setEvents(fetchedEvents);

        if (fetchedEvents.length > 0) {
          const bestMode = determineBestViewMode(fetchedEvents);
          setViewMode(bestMode);

          // Center offset around the center of the event cluster
          const refDate = new Date();
          const markerValues = fetchedEvents
            .filter((e) => e.event_date)
            .map((e) => calculateMarkerValue(e.event_date, bestMode, refDate));

          if (markerValues.length > 0) {
            const min = Math.min(...markerValues);
            const max = Math.max(...markerValues);
            const mid = (min + max) / 2;
            setTimelineOffset(-mid);
          } else {
            setTimelineOffset(0);
          }
        }
      } catch (err) {
        console.error('[LandingTimelineV3] Error fetching popular events:', err);
        if (active) {
          setEvents([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPopularEvents();

    return () => {
      active = false;
    };
  }, []);

  // Handle touch interactions for mobile
  const handleTouchStart = (e) => {
    if (!timelineBarRef.current) return;
    setIsDragging(true);
    setStartDragX(e.touches[0].clientX);
    setStartOffset(timelineOffset);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !timelineBarRef.current) return;
    const deltaX = e.touches[0].clientX - startDragX;
    const newOffset = startOffset + deltaX / 100;
    setTimelineOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle mouse interactions
  const handleMouseMove = (e) => {
    if (!timelineBarRef.current) return;
    if (isDragging) {
      const deltaX = e.clientX - startDragX;
      const newOffset = startOffset + deltaX / 100;
      setTimelineOffset(newOffset);
    }
  };

  const handleMouseDown = (e) => {
    if (!timelineBarRef.current) return;
    setIsDragging(true);
    setStartDragX(e.clientX);
    setStartOffset(timelineOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle event selection -> opens EventPopup in landing preview mode
  const handleEventClick = (event) => {
    setSelectedEventId(event?.id || null);
    setPopupEvent(event);
    setPopupOpen(true);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    setSelectedEventId(null);
  };

  // Format current date for display
  const getFormattedDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '500px',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        overflow: 'hidden',
        backgroundColor: 'black',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        position: 'relative',
        mb: 3,
      }}
      ref={containerRef}
    >
      {/* Timeline Background */}
      <TimelineBackground onBackgroundClick={() => setSelectedEventId(null)} />

      {/* Timeline Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold', mr: 1 }}>
            Popular Posts
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
          </Typography>
        </Box>
      </Box>

      {/* View Description */}
      <Box sx={{ px: 2, mb: 1, zIndex: 10 }}>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {getFormattedDate()}
        </Typography>
      </Box>

      {/* Timeline Bar Area */}
      <Box
        ref={timelineBarRef}
        sx={{
          position: 'relative',
          height: 350,
          cursor: isDragging ? 'grabbing' : 'grab',
          mt: 'auto',
          mb: 4,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 25,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              color: 'white',
            }}
          >
            <CircularProgress size={36} color="primary" />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Loading popular posts...
            </Typography>
          </Box>
        )}

        {/* Empty State message when no posts qualify */}
        {!loading && events.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 25,
              textAlign: 'center',
              px: 3,
              maxWidth: 460,
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>
              No public highlights right now
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Posts that trend across community timelines will appear here. Check back soon or create your own timeline!
            </Typography>
          </Box>
        )}

        {/* Transparent overlay to capture drag events and prevent text selection */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 15,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={(e) => {
            e.preventDefault();
            handleMouseDown(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        {/* Timeline Bar */}
        <Box sx={{ position: 'relative', top: '200px' }}>
          <TimelineBar
            timelineOffset={timelineOffset * 100}
            markerSpacing={100}
            minMarker={markers.length > 0 ? Math.min(...markers) : -5}
            maxMarker={markers.length > 0 ? Math.max(...markers) : 5}
            theme={theme}
          />
        </Box>

        {/* Time Markers */}
        <Box sx={{ position: 'relative', top: '200px' }}>
          <TimeMarkers
            timelineOffset={timelineOffset * 100}
            markerSpacing={100}
            markers={markers}
            viewMode={viewMode}
            theme={theme}
            markerStyles={markerStyles}
          />
        </Box>

        {/* Event Markers */}
        <Box sx={{ position: 'absolute', top: '270px', width: '100%', zIndex: 16 }}>
          {events.map((event) => (
            <LandingEventMarker
              key={event.id}
              event={event}
              timelineOffset={timelineOffset * 100}
              isSelected={event.id === selectedEventId}
              onClick={() => handleEventClick(event)}
              viewMode={viewMode}
              markerSpacing={100}
              theme={theme}
            />
          ))}
        </Box>
      </Box>

      {/* Mission Statement bar (Option 3) */}
      <Box
        sx={{
          position: 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          zIndex: 5,
          textAlign: 'center',
          mt: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, letterSpacing: '0.2px', color: 'rgba(255,255,255,0.9)' }}>
          Tap a line to open a post
        </Typography>
      </Box>

      {/* Real EventPopup rendered with guest interaction restrictions */}
      {popupEvent && (
        <EventPopup
          event={popupEvent}
          open={popupOpen}
          onClose={handlePopupClose}
          hideActionMenu={true}
          isLandingPreview={true}
        />
      )}
    </Box>
  );
}

export default LandingTimelineV3;
