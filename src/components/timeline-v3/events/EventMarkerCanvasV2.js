import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import calculateMarkerValue from './markerPosition';

const HIT_ZONE_WIDTH = 10;
const DENSITY_WINDOW = 120;
const DENSITY_THRESHOLD = 6;
const BASE_RUNG_HEIGHT = 36;
const DENSE_RUNG_HEIGHT = 36;
const BASE_RUNG_WIDTH = 5;
const THIN_RUNG_WIDTH = 1;
const SELECTED_RUNG_WIDTH = 2.5;
const BASE_ALPHA = 0.7;
const HOVER_ALPHA = 1;
const HOVER_LERP = 0.12;
const PULSE_HEIGHT = 28;
const PULSE_DURATION = 1200;

const getEventColor = (event) => {
  const type = (event?.type || '').toLowerCase();
  if (type === 'remark') return '#3B82F6';
  if (type === 'news') return '#EF4444';
  if (type === 'media') {
    const subtype = (event?.media_subtype || '').toLowerCase();
    const mediaTypeHint = (event?.media_type || '').toLowerCase();
    const mediaUrl = (event?.media_url || event?.url || '').toLowerCase();
    const ext = mediaUrl.split('.').pop();
    const isVideo = subtype === 'video' || mediaTypeHint.includes('video') || (ext && ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext));
    const isAudio = subtype === 'audio' || mediaTypeHint.includes('audio') || (ext && ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext));
    const isImage = subtype === 'image' || mediaTypeHint.includes('image') || (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext));
    if (isImage) return '#009688';
    if (isAudio) return '#e65100';
    if (isVideo) return '#4a148c';
    return '#8B5CF6';
  }
  return '#3B82F6';
};

const hexToRgba = (hex, alpha) => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getLocalDensity = (positions, index) => {
  const base = positions[index];
  if (!base) return 1;
  let count = 1;
  for (let i = index - 1; i >= 0; i -= 1) {
    if (base.x - positions[i].x > DENSITY_WINDOW) break;
    count += 1;
  }
  for (let i = index + 1; i < positions.length; i += 1) {
    if (positions[i].x - base.x > DENSITY_WINDOW) break;
    count += 1;
  }
  return count;
};

const EventMarkerCanvasV2 = ({
  events = [],
  viewMode,
  timelineOffset,
  markerSpacing,
  selectedEventId,
  onMarkerClick,
  onBackgroundClick,
  isFullyFaded = false,
  markersLoading = false,
  timelineMarkersLoading = false,
  progressiveLoadingState = 'complete',
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const hoverRef = useRef({ id: null, intensity: 0, target: 0 });
  const [opacity, setOpacity] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0, dpr: 1, left: 0 });

  const measureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    setCanvasSize({ width: rect.width, height: rect.height, dpr, left: rect.left });
  }, []);

  useEffect(() => {
    measureCanvas();
    window.addEventListener('resize', measureCanvas);
    return () => window.removeEventListener('resize', measureCanvas);
  }, [measureCanvas]);

  const shouldFadeIn = !isFullyFaded
    && !markersLoading
    && !timelineMarkersLoading
    && progressiveLoadingState === 'complete';

  useEffect(() => {
    setOpacity(shouldFadeIn ? 1 : 0);
  }, [shouldFadeIn]);

  useEffect(() => {
    measureCanvas();
  }, [measureCanvas, viewMode, timelineOffset, events.length]);

  const positions = useMemo(() => {
    if (!canvasSize.width) return [];
    const centerX = window.innerWidth / 2;
    return events
      .map((event, index) => {
        if (!event?.event_date || viewMode === 'position') return null;
        const markerValue = calculateMarkerValue(event.event_date, viewMode, new Date());
        const x = centerX + (markerValue * markerSpacing);
        return { event, index, markerValue, x };
      })
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);
  }, [events, viewMode, markerSpacing, canvasSize.width]);

  const draw = useCallback((time = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height, dpr } = canvasSize;
    if (!width || !height) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(timelineOffset, 0);
    ctx.lineCap = 'round';

    const baselineY = height - 70;

    positions.forEach((pos, index) => {
      const density = getLocalDensity(positions, index);
      const isDense = density >= DENSITY_THRESHOLD;
      const rungHeight = isDense ? DENSE_RUNG_HEIGHT : BASE_RUNG_HEIGHT;
      const topY = baselineY - rungHeight;
      const isSelected = pos.event?.id === selectedEventId;
      const hoverBoost = hoverRef.current.id === pos.event?.id
        ? hoverRef.current.intensity
        : 0;
      const alpha = isSelected
        ? 1
        : (BASE_ALPHA + (HOVER_ALPHA - BASE_ALPHA) * hoverBoost);

      ctx.lineWidth = isSelected
        ? SELECTED_RUNG_WIDTH
        : (isDense ? THIN_RUNG_WIDTH : BASE_RUNG_WIDTH);
      ctx.strokeStyle = hexToRgba(getEventColor(pos.event), alpha);
      ctx.beginPath();
      ctx.moveTo(pos.x, baselineY);
      ctx.lineTo(pos.x, topY);
      ctx.stroke();

      if (isSelected) {
        const phase = (time % PULSE_DURATION) / PULSE_DURATION;
        const pulseTop = topY - (phase * PULSE_HEIGHT);
        const gradient = ctx.createLinearGradient(pos.x, topY, pos.x, pulseTop);
        gradient.addColorStop(0, hexToRgba(getEventColor(pos.event), 0.8));
        gradient.addColorStop(1, hexToRgba(getEventColor(pos.event), 0));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(1, ctx.lineWidth - 0.5);
        ctx.beginPath();
        ctx.moveTo(pos.x, topY);
        ctx.lineTo(pos.x, pulseTop);
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [canvasSize, positions, selectedEventId, timelineOffset]);

  const animate = useCallback((time) => {
    const hoverState = hoverRef.current;
    hoverState.intensity += (hoverState.target - hoverState.intensity) * HOVER_LERP;
    if (Math.abs(hoverState.target - hoverState.intensity) < 0.01) {
      hoverState.intensity = hoverState.target;
    }

    draw(time);

    const needsHover = hoverState.intensity !== hoverState.target;
    const needsPulse = Boolean(selectedEventId);
    if (needsHover || needsPulse) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
    }
  }, [draw, selectedEventId]);

  useEffect(() => {
    draw(performance.now());
    if (animationRef.current) return;
    if (selectedEventId || hoverRef.current.intensity !== hoverRef.current.target) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [draw, animate, selectedEventId, positions]);

  useEffect(() => {
    if (timelineOffset !== undefined) {
      draw(performance.now());
    }
  }, [timelineOffset, draw]);

  useEffect(() => () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const handleClick = (event) => {
    if (!positions.length || !onMarkerClick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - timelineOffset;
    let closest = null;
    let minDist = Infinity;
    positions.forEach((pos) => {
      const dist = Math.abs(pos.x - x);
      if (dist < minDist) {
        minDist = dist;
        closest = pos;
      }
    });
    if (!closest || minDist > HIT_ZONE_WIDTH * 1.5) {
      if (onBackgroundClick) {
        onBackgroundClick();
      }
      return;
    }
    onMarkerClick(closest.event, closest.index, event, closest.markerValue, 0);
  };

  const handleMouseMove = (event) => {
    if (!positions.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - timelineOffset;
    let closest = null;
    let minDist = Infinity;
    positions.forEach((pos) => {
      const dist = Math.abs(pos.x - x);
      if (dist < minDist) {
        minDist = dist;
        closest = pos;
      }
    });
    if (!closest || minDist > HIT_ZONE_WIDTH * 1.5) {
      hoverRef.current.id = null;
      hoverRef.current.target = 0;
      return;
    }
    if (hoverRef.current.id !== closest.event?.id) {
      hoverRef.current.id = closest.event?.id || null;
      hoverRef.current.target = 1;
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }
  };

  const handleMouseLeave = () => {
    hoverRef.current.id = null;
    hoverRef.current.target = 0;
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        opacity,
        transition: 'opacity 650ms ease',
      }}
    />
  );
};

export default EventMarkerCanvasV2;
