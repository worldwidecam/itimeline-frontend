import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import calculateMarkerValue from './markerPosition';

const HIT_ZONE_WIDTH = 10;
const DENSITY_WINDOW = 120;
const DENSITY_THRESHOLD = 6;
const BASE_RUNG_HEIGHT = 36;
const DENSE_RUNG_HEIGHT = 36;
const BASE_RUNG_WIDTH = 4;
const THIN_RUNG_WIDTH = 1.2;
const SELECTED_RUNG_WIDTH = 3.2;
const BASELINE_Y_RATIO = 0.75;
const BASE_ALPHA = 0.7;
const HOVER_ALPHA = 1;
const HOVER_LERP = 0.12;
const PULSE_GAP = 4;
const PULSE_HEIGHT = 28;
const PULSE_DURATION = 1200;
const VOTE_DOT_PADDING = 6;
const VOTE_DOT_GLOW_SIZE = 3;
const VOTE_POSITIVE_COLOR = '#22c55e';
const VOTE_NEGATIVE_COLOR = '#ef4444';
const VOTE_NEUTRAL_COLOR = '#aaaaaa';
const VOTE_GLOW_CYCLE = 10000;
const VOTE_GLOW_WIDTH = 0.18;
const VOTE_DOT_FADE_DURATION = 650;

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
  voteDotsById = {},
  voteDotsLoading = false,
  isFullyFaded = false,
  markersLoading = false,
  timelineMarkersLoading = false,
  progressiveLoadingState = 'complete',
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const hoverRef = useRef({ id: null, intensity: 0, target: 0 });
  const voteFadeRef = useRef({ start: null });
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

  const hasVoteDots = useMemo(
    () => Object.values(voteDotsById || {}).some((dot) => dot?.isVisible),
    [voteDotsById]
  );

  useEffect(() => {
    if (voteDotsLoading) {
      voteFadeRef.current.start = null;
    } else if (hasVoteDots) {
      voteFadeRef.current.start = performance.now();
    }
  }, [voteDotsLoading, hasVoteDots]);

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

    const baselineY = height * BASELINE_Y_RATIO;

    const minX = positions[0]?.x ?? 0;
    const maxX = positions[positions.length - 1]?.x ?? minX + 1;
    const rangeX = Math.max(1, maxX - minX);

    const voteFadeStart = voteFadeRef.current.start;
    const voteFadeProgress = voteDotsLoading || !hasVoteDots
      ? 0
      : (voteFadeStart == null
        ? 1
        : Math.min(1, (time - voteFadeStart) / VOTE_DOT_FADE_DURATION));
    if (voteFadeStart != null && voteFadeProgress >= 1) {
      voteFadeRef.current.start = null;
    }

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

      const lineWidth = isSelected
        ? SELECTED_RUNG_WIDTH
        : (isDense ? THIN_RUNG_WIDTH : BASE_RUNG_WIDTH);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = hexToRgba(getEventColor(pos.event), alpha);
      ctx.beginPath();
      ctx.moveTo(pos.x, baselineY);
      ctx.lineTo(pos.x, topY);
      ctx.stroke();

      if (!isSelected && !isDense) {
        const coreWidth = Math.max(1, lineWidth - 1.4);
        ctx.lineWidth = coreWidth;
        ctx.strokeStyle = hexToRgba(getEventColor(pos.event), Math.min(1, alpha + 0.12));
        ctx.beginPath();
        ctx.moveTo(pos.x, baselineY);
        ctx.lineTo(pos.x, topY);
        ctx.stroke();
      }

      if (isSelected) {
        const phase = (time % PULSE_DURATION) / PULSE_DURATION;
        const fade = Math.sin(Math.PI * phase);
        const pulseStart = topY - PULSE_GAP;
        const pulseTop = pulseStart - (phase * PULSE_HEIGHT);
        const gradient = ctx.createLinearGradient(pos.x, pulseStart, pos.x, pulseTop);
        gradient.addColorStop(0, hexToRgba(getEventColor(pos.event), 0.7 * fade));
        gradient.addColorStop(1, hexToRgba(getEventColor(pos.event), 0));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(1, ctx.lineWidth - 0.5);
        ctx.beginPath();
        ctx.moveTo(pos.x, pulseStart);
        ctx.lineTo(pos.x, pulseTop);
        ctx.stroke();
      }

      const voteDot = voteDotsById?.[pos.event?.id] || null;
      if (!voteDotsLoading && voteDot?.isVisible) {
        const dotSize = voteDot.size ?? 6;
        const dotOffset = voteDot.offset ?? 0;
        const dotSizeClamped = Math.max(3, Math.min(dotSize, lineWidth * 2));
        const dotRadius = dotSizeClamped / 2;
        const maxOffset = Math.max(0, topY - VOTE_DOT_PADDING - (dotRadius * 2));
        const clampedOffset = Math.min(dotOffset, maxOffset);
        const dotCenterY = Math.max(
          dotRadius,
          topY - VOTE_DOT_PADDING - clampedOffset - dotRadius
        );
        const dotColor = voteDot.netVotes > 0
          ? VOTE_POSITIVE_COLOR
          : (voteDot.netVotes < 0 ? VOTE_NEGATIVE_COLOR : VOTE_NEUTRAL_COLOR);
        const isNeutral = voteDot.netVotes === 0 || voteDot.isNeutral;
        const idleColor = isNeutral ? 'rgb(170, 170, 170)' : dotColor;
        const brightColor = isNeutral ? 'rgb(255, 255, 255)' : dotColor;
        const phaseOffset = (pos.x - minX) / rangeX;
        const glowPhase = ((time / VOTE_GLOW_CYCLE) + (1 - phaseOffset)) % 1;
        const distance = Math.abs(glowPhase - 0.5);
        const glowStrength = Math.pow(Math.max(0, 1 - (distance / VOTE_GLOW_WIDTH)), 2);
        const idleGlowAlpha = (isNeutral ? 0.15 : 0.2) * voteFadeProgress;
        const brightGlowAlpha = (isNeutral ? 0.7 : 0.9) * glowStrength * voteFadeProgress;

        ctx.save();
        ctx.fillStyle = idleColor;
        ctx.globalAlpha = idleGlowAlpha + brightGlowAlpha * 0.6;
        ctx.beginPath();
        ctx.arc(pos.x, dotCenterY, dotRadius + VOTE_DOT_GLOW_SIZE, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = brightColor;
        ctx.globalAlpha = (0.5 + (0.5 * glowStrength)) * voteFadeProgress;
        ctx.beginPath();
        ctx.arc(pos.x, dotCenterY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }, [canvasSize, positions, selectedEventId, timelineOffset, voteDotsById, voteDotsLoading]);

  const animate = useCallback((time) => {
    const hoverState = hoverRef.current;
    hoverState.intensity += (hoverState.target - hoverState.intensity) * HOVER_LERP;
    if (Math.abs(hoverState.target - hoverState.intensity) < 0.01) {
      hoverState.intensity = hoverState.target;
    }

    draw(time);

    const needsHover = hoverState.intensity !== hoverState.target;
    const needsPulse = Boolean(selectedEventId);
    const needsVoteGlow = hasVoteDots && !voteDotsLoading;
    const needsVoteFade = voteFadeRef.current.start != null;
    if (needsHover || needsPulse || needsVoteGlow || needsVoteFade) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
    }
  }, [draw, selectedEventId, hasVoteDots, voteDotsLoading]);

  useEffect(() => {
    draw(performance.now());
    if (animationRef.current) return;
    if (selectedEventId || hoverRef.current.intensity !== hoverRef.current.target || (hasVoteDots && !voteDotsLoading)) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [draw, animate, selectedEventId, positions, hasVoteDots, voteDotsLoading]);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    draw(performance.now());
    if (selectedEventId || hoverRef.current.intensity !== hoverRef.current.target || (hasVoteDots && !voteDotsLoading)) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [selectedEventId, animate, draw, hasVoteDots, voteDotsLoading]);

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
