import React, { forwardRef } from 'react';
import { EVENT_TYPES } from '../EventTypes';
import RemarkCard from './RemarkCard';
import NewsCard from './NewsCard';
import MediaCard from './MediaCard';

/**
 * EventCard - Unified wrapper component for all event card types
 * 
 * This component provides a standardized interface for rendering event cards
 * across all pages (Home, Timeline, Profile). It automatically selects the
 * appropriate card component based on event.type and normalizes props.
 * 
 * Usage:
 *   <EventCard event={event} variant="timeline" onEdit={handleEdit} onDelete={handleDelete} />
 *   <EventCard event={event} variant="home" />
 *   <EventCard event={event} variant="profile" isSelected={true} />
 * 
 * Props:
 *   - event: The event object (required)
 *   - variant: 'home' | 'timeline' | 'profile' - affects default prop values
 *   - onEdit: Callback when edit is triggered (optional)
 *   - onDelete: Callback when delete is triggered (optional)
 *   - isSelected: Whether card is in selected state (optional)
 *   - setIsPopupOpen: Callback to notify parent of popup state (optional)
 *   - reviewingEventIds: Set of event IDs under review (optional)
 *   - showInlineVoteControls: Show vote controls inline (default: true)
 *   - showVoteOverlay: Show vote overlay on card (default: false)
 *   - onMediaLoadError: Callback for media loading errors (optional)
 *   - ref: Forwarded ref for imperative methods (openPopup, setPopupOpen)
 */

const VARIANT_DEFAULTS = {
  home: {
    showInlineVoteControls: true,
    showVoteOverlay: false,
    // Home page cards are always "selected" visually
    isSelected: true,
  },
  timeline: {
    showInlineVoteControls: true,
    showVoteOverlay: false,
    isSelected: false,
  },
  profile: {
    showInlineVoteControls: true,
    showVoteOverlay: false,
    isSelected: false,
  },
};

const EventCard = forwardRef(({
  event,
  variant = 'timeline',
  onEdit,
  onDelete,
  isSelected,
  setIsPopupOpen,
  reviewingEventIds,
  showInlineVoteControls,
  showVoteOverlay,
  onMediaLoadError,
  ...additionalProps
}, ref) => {
  // Validate event
  if (!event) {
    console.error('EventCard: event prop is required');
    return null;
  }

  // Get variant defaults
  const defaults = VARIANT_DEFAULTS[variant] || VARIANT_DEFAULTS.timeline;

  // Normalize event type
  const eventType = (event.type || '').toLowerCase();

  // Build normalized props
  const cardProps = {
    event,
    onEdit: onEdit || (() => {}),
    onDelete: onDelete || (() => {}),
    isSelected: isSelected !== undefined ? isSelected : defaults.isSelected,
    setIsPopupOpen: setIsPopupOpen || (() => {}),
    reviewingEventIds: reviewingEventIds || new Set(),
    showInlineVoteControls: showInlineVoteControls !== undefined 
      ? showInlineVoteControls 
      : defaults.showInlineVoteControls,
    showVoteOverlay: showVoteOverlay !== undefined 
      ? showVoteOverlay 
      : defaults.showVoteOverlay,
    // Only pass onMediaLoadError to MediaCard (it handles media)
    ...(eventType === EVENT_TYPES.MEDIA && onMediaLoadError && { onMediaLoadError }),
    ...additionalProps,
  };

  // Render appropriate card based on event type
  switch (eventType) {
    case EVENT_TYPES.NEWS:
      return <NewsCard ref={ref} {...cardProps} />;
    
    case EVENT_TYPES.MEDIA:
      return <MediaCard ref={ref} {...cardProps} />;
    
    case EVENT_TYPES.REMARK:
    default:
      // Default to RemarkCard for unknown types
      if (eventType && eventType !== EVENT_TYPES.REMARK) {
        console.warn(`EventCard: Unknown event type "${eventType}", rendering as RemarkCard`);
      }
      return <RemarkCard ref={ref} {...cardProps} />;
  }
});

EventCard.displayName = 'EventCard';

export default EventCard;
