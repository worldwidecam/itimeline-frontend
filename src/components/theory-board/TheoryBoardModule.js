import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Popper,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PushPinIcon from '@mui/icons-material/PushPin';
import EastIcon from '@mui/icons-material/East';
import MinimizeIcon from '@mui/icons-material/Minimize';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import HubIcon from '@mui/icons-material/Hub';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CommunityIcon from '@mui/icons-material/People';
import HashtagIcon from '../common/HashtagIcon';
import NewsEventMarker from '../timeline-v3/events/markers/NewsEventMarker';
import MediaEventMarker from '../timeline-v3/events/markers/MediaEventMarker';
import RemarkEventMarker from '../timeline-v3/events/markers/RemarkEventMarker';
import RichContentRenderer from '../timeline-v3/events/RichContentRenderer';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { toRichContentPayload } from '../../utils/richContent';

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.1;
const ZOOM_FACTOR = 1.25;
const BASE_TEXTURE_TILE = 120;
const BASE_CELL_SIZE = 162;
const ABS_MIN_ZOOM = 0.01;
const CUT_LIMP_DURATION_MS = 520;

const TACK_COLORS = ['#cd4f56', '#4a78cf', '#4aa867', '#d9a248', '#8a67d8'];
const ORIGIN_TACK_COLOR = TACK_COLORS[0];
const NON_ORIGIN_TACK_COLORS = TACK_COLORS.slice(1);

const wrapOffset = (value, tileSize) => {
  if (!Number.isFinite(tileSize) || tileSize <= 0) return 0;
  return ((value % tileSize) + tileSize) % tileSize;
};

const mapZoomToDb = (zoom) => {
  const clamped = Math.max(0.01, Math.min(2.1, zoom));
  return Math.round(((clamped - 0.01) / 2.09) * 275 + 25);
};

const mapDbToZoom = (dbZoom) => {
  const clamped = Math.max(25, Math.min(300, Number(dbZoom) || 100));
  return ((clamped - 25) / 275) * 2.09 + 0.01;
};

const isTheoryBoardStorageUnavailableError = (error) => {
  const statusCode = Number(error?.response?.status || 0);
  const errorText = String(error?.response?.data?.error || '').toLowerCase();
  return statusCode === 503 && errorText.includes('theory board storage is unavailable');
};

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

const toCellCoord = (value) => Math.floor(value + 0.5);

const resolveRandomizedTackColor = (seed, isOriginCell = false) => {
  if (isOriginCell) return ORIGIN_TACK_COLOR;
  const palette = NON_ORIGIN_TACK_COLORS.length > 0 ? NON_ORIGIN_TACK_COLORS : TACK_COLORS;
  const rawSeed = String(seed || '0');
  let hash = 0;
  for (let i = 0; i < rawSeed.length; i += 1) {
    hash = ((hash << 5) - hash) + rawSeed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
};

const createYarnLink = (pinAId, pinBId) => {
  const fromId = String(pinAId || '').trim();
  const toId = String(pinBId || '').trim();
  if (!fromId || !toId || fromId === toId) return null;
  const [first, second] = [fromId, toId].sort();
  return {
    id: `${first}::${second}`,
    fromId: first,
    toId: second,
  };
};

const detectMentionAtCursor = (text, cursorPos) => {
  const beforeCursor = String(text || '').substring(0, Math.max(0, cursorPos));

  const atMatch = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
  if (atMatch) return { type: 'user', label: 'Tagging', partial: atMatch[1], color: 'rgba(33, 150, 243, 0.15)' };

  const hashMatch = beforeCursor.match(/#([a-zA-Z0-9_]*)$/);
  if (hashMatch) return { type: 'hashtag', label: 'Hashtag', partial: hashMatch[1], color: 'rgba(76, 175, 80, 0.15)' };

  const commMatch = beforeCursor.match(/i-([a-zA-Z0-9_]*)$/);
  if (commMatch) return { type: 'community', label: 'Community', partial: commMatch[1], color: 'rgba(156, 39, 176, 0.15)' };

  const wwwMatch = beforeCursor.match(/www\.([a-zA-Z0-9._-]*)$/);
  if (wwwMatch) return { type: 'url', label: 'URL', partial: wwwMatch[1], color: 'rgba(255, 152, 0, 0.15)' };

  const eventMatch = beforeCursor.match(/~([0-9]*)$/);
  if (eventMatch) return { type: 'event', label: 'Event', partial: eventMatch[1], color: 'rgba(103, 58, 183, 0.15)' };

  return null;
};

const isSingleEmoji = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(trimmed));
      if (segments.length !== 1) return false;
      const emojiRegex = /\p{Extended_Pictographic}/u;
      return emojiRegex.test(trimmed);
    } catch (_) {
      // Fallback below
    }
  }

  const fallbackRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})\uFE0F?$/u;
  return fallbackRegex.test(trimmed);
};

const TheoryBoardModule = ({ profileUserId = 0, isOwner = false, onOpenEventReference = null }) => {
  const theme = useTheme();
  const location = useLocation();
  const useQuery = () => new URLSearchParams(location.search);
  const queryAccessKey = useQuery().get('access_key') || '';
  const { isGuest } = useAuth();
  const boardRef = useRef(null);
  const viewportRef = useRef(null);
  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const pinDragRef = useRef({
    pinId: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    startWorldX: 0,
    startWorldY: 0,
  });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panFrameRef = useRef(null);
  const pendingPanRef = useRef(null);
  const recenterFrameRef = useRef(null);
  const activePointersMapRef = useRef(new Map());
  const pinchRef = useRef(null);


  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [pins, setPins] = useState([]);
  const [yarnLinks, setYarnLinks] = useState([]);
  const [limpYarnLinks, setLimpYarnLinks] = useState([]);
  const [latestPinId, setLatestPinId] = useState(null);
  const [activePinDragId, setActivePinDragId] = useState(null);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [selectedPinDraft, setSelectedPinDraft] = useState('');
  const [selectedPinCursor, setSelectedPinCursor] = useState(0);
  const [selectedPinIndicatorAnchorEl, setSelectedPinIndicatorAnchorEl] = useState(null);
  const [interactionMode, setInteractionMode] = useState('default');
  const [pendingYarnStartPinId, setPendingYarnStartPinId] = useState(null);
  const [yarnPreviewPoint, setYarnPreviewPoint] = useState(null);
  const [eventPreviewCache, setEventPreviewCache] = useState({});
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardStorageUnavailable, setBoardStorageUnavailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [saveFeedbackTone, setSaveFeedbackTone] = useState('muted');
  const selectedPinInputRef = useRef(null);
  const cutLimpTimeoutsRef = useRef({});
  const suppressDirtyTrackingRef = useRef(true);

  const occupiedCellBounds = useMemo(() => {
    if (pins.length === 0) {
      return {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
      };
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    pins.forEach((pin) => {
      const cellX = toCellCoord(pin.worldX);
      const cellY = toCellCoord(pin.worldY);
      minX = Math.min(minX, cellX);
      maxX = Math.max(maxX, cellX);
      minY = Math.min(minY, cellY);
      maxY = Math.max(maxY, cellY);
    });

    return {
      minX,
      maxX,
      minY,
      maxY,
    };
  }, [pins]);

  const dynamicMinZoom = useMemo(() => {
    const perforationPaddingCells = 0.14;
    const occupiedCellWidthUnits = (occupiedCellBounds.maxX - occupiedCellBounds.minX + 1) + (perforationPaddingCells * 2);
    const occupiedCellHeightUnits = (occupiedCellBounds.maxY - occupiedCellBounds.minY + 1) + (perforationPaddingCells * 2);

    const fitZoomX = viewportSize.width > 0
      ? (viewportSize.width * 0.84) / (BASE_CELL_SIZE * occupiedCellWidthUnits)
      : MIN_ZOOM;
    const fitZoomY = viewportSize.height > 0
      ? (viewportSize.height * 0.78) / (BASE_CELL_SIZE * occupiedCellHeightUnits)
      : MIN_ZOOM;

    return Math.max(ABS_MIN_ZOOM, Math.min(MIN_ZOOM, fitZoomX, fitZoomY) * 0.95);
  }, [occupiedCellBounds, viewportSize]);

  const applyBoardSnapshot = useCallback((board) => {
    const normalizedBoard = board && typeof board === 'object' ? board : {};
    const rawNodes = Array.isArray(normalizedBoard.nodes) ? normalizedBoard.nodes : [];
    const nodeIdToLocalId = {};

    const hydratedPins = rawNodes.map((node, index) => {
      const serverId = Number(node?.id || 0);
      const localId = Number.isFinite(serverId) && serverId > 0
        ? `node-${serverId}`
        : `node-temp-${index + 1}`;
      if (Number.isFinite(serverId) && serverId > 0) {
        nodeIdToLocalId[serverId] = localId;
      }

      const gridCol = Number(node?.grid_col || 0);
      const gridRow = Number(node?.grid_row || 0);
      const offsetX = Number(node?.offset_x || 0) / 100;
      const offsetY = Number(node?.offset_y || 0) / 100;
      const isOriginCell = gridCol === 0 && gridRow === 0;
      const colorSeed = Number.isFinite(serverId) && serverId > 0
        ? `srv-${serverId}`
        : `tmp-${gridCol}:${gridRow}:${index + 1}`;
      return {
        id: localId,
        worldX: gridCol + offsetX,
        worldY: gridRow + offsetY,
        color: resolveRandomizedTackColor(colorSeed, isOriginCell),
        content: String(node?.cell_content || ''),
      };
    });

    const rawEdges = Array.isArray(normalizedBoard.edges) ? normalizedBoard.edges : [];
    const hydratedLinks = rawEdges
      .map((edge) => {
        const fromLocalId = nodeIdToLocalId[Number(edge?.from_node_id || 0)];
        const toLocalId = nodeIdToLocalId[Number(edge?.to_node_id || 0)];
        if (!fromLocalId || !toLocalId) return null;
        return createYarnLink(fromLocalId, toLocalId);
      })
      .filter(Boolean)
      .reduce((acc, link) => {
        if (acc.some((item) => item.id === link.id)) return acc;
        acc.push(link);
        return acc;
      }, []);

    const nextPanX = Number(normalizedBoard?.viewportX ?? normalizedBoard?.viewport?.x ?? 0);
    const nextPanY = Number(normalizedBoard?.viewportY ?? normalizedBoard?.viewport?.y ?? 0);
    const rawZoom = Number(normalizedBoard?.zoomLevel ?? normalizedBoard?.zoom_level ?? normalizedBoard?.viewport?.zoom ?? 100) || 100;
    const nextZoom = clamp(mapDbToZoom(rawZoom), ABS_MIN_ZOOM, MAX_ZOOM);

    suppressDirtyTrackingRef.current = true;
    setPins(hydratedPins);
    setYarnLinks(hydratedLinks);
    setLimpYarnLinks([]);
    setPan({ x: nextPanX, y: nextPanY });
    setZoom(nextZoom);
    setSelectedPinId(null);
    setPendingYarnStartPinId(null);
    setYarnPreviewPoint(null);
    setInteractionMode('default');
    setHasUnsavedChanges(false);
    window.requestAnimationFrame(() => {
      suppressDirtyTrackingRef.current = false;
    });
  }, []);

  const textureTile = Math.max(48, BASE_TEXTURE_TILE * zoom);
  const wrappedX = useMemo(() => wrapOffset(pan.x, textureTile), [pan.x, textureTile]);
  const wrappedY = useMemo(() => wrapOffset(pan.y, textureTile), [pan.y, textureTile]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (suppressDirtyTrackingRef.current) return;
    setHasUnsavedChanges(true);
  }, [pan, pins, yarnLinks, zoom]);

  useEffect(() => {
    const targetUserId = Number(profileUserId || 0);
    if (targetUserId <= 0) {
      suppressDirtyTrackingRef.current = true;
      setPins([]);
      setYarnLinks([]);
      setLimpYarnLinks([]);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setHasUnsavedChanges(false);
      setSaveFeedback('');
      window.requestAnimationFrame(() => {
        suppressDirtyTrackingRef.current = false;
      });
      return;
    }

    let cancelled = false;
    const loadBoardSnapshot = async () => {
      setBoardLoading(true);
      setSaveFeedback('');
      setSaveFeedbackTone('muted');
      try {
        const response = await api.get(`/api/v1/users/${targetUserId}/theory-board`, {
          params: { access_key: queryAccessKey }
        });
        if (cancelled) return;
        setBoardStorageUnavailable(false);
        applyBoardSnapshot(response?.data?.board || null);
      } catch (error) {
        if (cancelled) return;
        console.warn('[TheoryBoard] Failed to load board snapshot:', error?.response?.data || error?.message || error);
        const storageUnavailable = isTheoryBoardStorageUnavailableError(error);
        setBoardStorageUnavailable(storageUnavailable);
        suppressDirtyTrackingRef.current = true;
        setPins([]);
        setYarnLinks([]);
        setLimpYarnLinks([]);
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setHasUnsavedChanges(false);
        setSaveFeedback(
          storageUnavailable
            ? 'Theory Board storage not initialized on backend (503). Run DB migration.'
            : 'Theory Board load failed. Try refresh.'
        );
        setSaveFeedbackTone('error');
        window.requestAnimationFrame(() => {
          suppressDirtyTrackingRef.current = false;
        });
      } finally {
        if (!cancelled) {
          setBoardLoading(false);
        }
      }
    };

    loadBoardSnapshot();
    return () => {
      cancelled = true;
    };
  }, [applyBoardSnapshot, profileUserId]);

  const adjustZoom = useCallback((nextZoom) => {
    setZoom(Math.max(dynamicMinZoom, Math.min(MAX_ZOOM, nextZoom)));
  }, [dynamicMinZoom]);
  const recenterBoard = useCallback(() => {
    const startPan = panRef.current;
    const duration = 420;

    if (recenterFrameRef.current) {
      window.cancelAnimationFrame(recenterFrameRef.current);
      recenterFrameRef.current = null;
    }

    if (Math.abs(startPan.x) < 0.2 && Math.abs(startPan.y) < 0.2) {
      setPan({ x: 0, y: 0 });
      return;
    }

    const startTime = performance.now();
    const animateStep = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - ((1 - progress) ** 4);

      setPan({
        x: startPan.x * (1 - eased),
        y: startPan.y * (1 - eased),
      });

      if (progress < 1) {
        recenterFrameRef.current = window.requestAnimationFrame(animateStep);
      } else {
        recenterFrameRef.current = null;
      }
    };

    recenterFrameRef.current = window.requestAnimationFrame(animateStep);
  }, []);

  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement) return;

    const handleWheelRaw = (event) => {
      if (!isFullscreen) return;
      event.preventDefault();
      const currentZoom = zoomRef.current;
      if (event.deltaY > 0) {
        adjustZoom(currentZoom / ZOOM_FACTOR);
      } else if (event.deltaY < 0) {
        adjustZoom(currentZoom * ZOOM_FACTOR);
      }
    };

    viewportElement.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => {
      viewportElement.removeEventListener('wheel', handleWheelRaw);
    };
  }, [isFullscreen, adjustZoom]);

  const handlePointerDown = useCallback((event) => {
    // Track active pointer touch coordinate
    activePointersMapRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (activePointersMapRef.current.size === 2) {
      // Transition to pinch-to-zoom mode
      const pointerIds = Array.from(activePointersMapRef.current.keys());
      const p1 = activePointersMapRef.current.get(pointerIds[0]);
      const p2 = activePointersMapRef.current.get(pointerIds[1]);
      const initialDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

      pinchRef.current = {
        initialDistance,
        initialZoom: zoomRef.current,
        initialPan: { x: panRef.current.x, y: panRef.current.y },
        centerClientX: (p1.clientX + p2.clientX) / 2,
        centerClientY: (p1.clientY + p2.clientY) / 2,
      };

      // Suspend single-finger panning
      setIsDragging(false);
    } else if (activePointersMapRef.current.size === 1) {
      if (event.button !== 0) return;

      // Deselect any active pin when clicking/dragging empty space
      setSelectedPinId(null);

      if (isOwner && interactionMode !== 'default') return;

      const nextDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      dragRef.current = nextDrag;
      setIsDragging(true);
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  }, [interactionMode, isOwner, pan.x, pan.y]);

  const handlePointerMove = useCallback((event) => {
    // Keep track of moving touch points
    if (activePointersMapRef.current.has(event.pointerId)) {
      activePointersMapRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    }

    if (activePointersMapRef.current.size === 2 && pinchRef.current) {
      const pointerIds = Array.from(activePointersMapRef.current.keys());
      const p1 = activePointersMapRef.current.get(pointerIds[0]);
      const p2 = activePointersMapRef.current.get(pointerIds[1]);
      const currentDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

      const scale = currentDistance / pinchRef.current.initialDistance;
      const targetZoom = clamp(pinchRef.current.initialZoom * scale, dynamicMinZoom, MAX_ZOOM);

      setZoom(targetZoom);

      // Adjust pan to focus zoom directly on the pinch midpoint
      const zoomRatio = targetZoom / pinchRef.current.initialZoom;
      const rect = event.currentTarget.getBoundingClientRect();
      const midX = pinchRef.current.centerClientX - rect.left - (viewportSize.width / 2);
      const midY = pinchRef.current.centerClientY - rect.top - (viewportSize.height / 2);

      const nextPanX = midX - (midX - pinchRef.current.initialPan.x) * zoomRatio;
      const nextPanY = midY - (midY - pinchRef.current.initialPan.y) * zoomRatio;

      setPan({ x: nextPanX, y: nextPanY });
      return;
    }

    if (isOwner && interactionMode === 'create_yarn') {
      const rect = event.currentTarget.getBoundingClientRect();
      setYarnPreviewPoint({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }

    if (!isDragging || dragRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    pendingPanRef.current = {
      x: dragRef.current.startPanX + deltaX,
      y: dragRef.current.startPanY + deltaY,
    };

    if (panFrameRef.current !== null) return;
    panFrameRef.current = window.requestAnimationFrame(() => {
      panFrameRef.current = null;
      if (!pendingPanRef.current) return;
      setPan(pendingPanRef.current);
      pendingPanRef.current = null;
    });
  }, [interactionMode, isDragging, isOwner, viewportSize]);

  const handlePointerUp = useCallback((event) => {
    activePointersMapRef.current.delete(event.pointerId);

    if (activePointersMapRef.current.size < 2) {
      pinchRef.current = null;
    }

    if (dragRef.current.pointerId === event.pointerId) {
      dragRef.current.pointerId = null;
      setIsDragging(false);
      if (pendingPanRef.current) {
        setPan(pendingPanRef.current);
        pendingPanRef.current = null;
      }
    }

    // Smooth transition back to single-finger drag on remaining touch pointer
    if (activePointersMapRef.current.size === 1) {
      const remainingId = Array.from(activePointersMapRef.current.keys())[0];
      const remaining = activePointersMapRef.current.get(remainingId);

      dragRef.current = {
        pointerId: remainingId,
        startX: remaining.clientX,
        startY: remaining.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      };
      setIsDragging(true);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => () => {
    if (panFrameRef.current !== null) {
      window.cancelAnimationFrame(panFrameRef.current);
    }
    if (recenterFrameRef.current !== null) {
      window.cancelAnimationFrame(recenterFrameRef.current);
    }

    Object.values(cutLimpTimeoutsRef.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    cutLimpTimeoutsRef.current = {};
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!boardRef.current) return;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await boardRef.current.requestFullscreen();
      }
    } catch (_) {
      // noop
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement && boardRef.current && document.fullscreenElement === boardRef.current);
      setIsFullscreen(active);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!viewportRef.current) return undefined;
    const element = viewportRef.current;

    const syncSize = () => {
      setViewportSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    syncSize();

    const observer = new ResizeObserver(syncSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!latestPinId) return undefined;
    const timeoutId = window.setTimeout(() => setLatestPinId(null), 480);
    return () => window.clearTimeout(timeoutId);
  }, [latestPinId]);

  const handleAddPin = useCallback(() => {
    if (!isOwner) return;
    const createdId = `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
    const previousPinId = pins[pins.length - 1]?.id || null;
    const currentZoom = Number.isFinite(zoomRef.current) && zoomRef.current > 0 ? zoomRef.current : 1;
    const currentScaledCell = BASE_CELL_SIZE * currentZoom;
    const centerWorldX = -panRef.current.x / currentScaledCell;
    const centerWorldY = -panRef.current.y / currentScaledCell;

    setPins((previousPins) => {
      const nextCellX = toCellCoord(centerWorldX);
      const nextCellY = toCellCoord(centerWorldY);
      const isOriginCell = nextCellX === 0 && nextCellY === 0;
      const nextPin = {
        id: createdId,
        worldX: centerWorldX,
        worldY: centerWorldY,
        color: resolveRandomizedTackColor(createdId, isOriginCell),
        content: '',
      };
      return [...previousPins, nextPin];
    });

    setLatestPinId(createdId);

    if (previousPinId) {
      const autoLink = createYarnLink(previousPinId, createdId);
      if (autoLink) {
        setYarnLinks((previousLinks) => (
          previousLinks.some((link) => link.id === autoLink.id)
            ? previousLinks
            : [...previousLinks, autoLink]
        ));
      }
    }

    if (isOwner) {
      setSelectedPinId(createdId);
    }
  }, [isOwner, pins]);

  useEffect(() => {
    if (pins.length <= 1) {
      setYarnLinks([]);
      setPendingYarnStartPinId(null);
      return;
    }

    setYarnLinks((previousLinks) => {
      const validIds = new Set(pins.map((pin) => pin.id));
      return previousLinks.filter((link) => validIds.has(link.fromId) && validIds.has(link.toId));
    });

    setLimpYarnLinks((previousLinks) => {
      const validIds = new Set(pins.map((pin) => pin.id));
      return previousLinks.filter((link) => validIds.has(link.fromId) && validIds.has(link.toId));
    });
  }, [pins]);

  const scaledCell = BASE_CELL_SIZE * zoom;
  const boardCenterX = viewportSize.width / 2 + pan.x;
  const boardCenterY = viewportSize.height / 2 + pan.y;
  const firstPinId = pins[0]?.id ?? null;

  const pinPositions = useMemo(() => pins.map((pin) => ({
    ...pin,
    screenX: boardCenterX + (pin.worldX * scaledCell),
    screenY: boardCenterY + (pin.worldY * scaledCell),
    isNew: pin.id === latestPinId,
  })), [boardCenterX, boardCenterY, latestPinId, pins, scaledCell]);

  const pinPositionMap = useMemo(() => {
    const mapped = {};
    pinPositions.forEach((pin) => {
      mapped[pin.id] = pin;
    });
    return mapped;
  }, [pinPositions]);

  const perforationPaddingCells = 0.14;
  const perforationLeft = boardCenterX + ((occupiedCellBounds.minX - 0.5 - perforationPaddingCells) * scaledCell);
  const perforationTop = boardCenterY + ((occupiedCellBounds.minY - 0.5 - perforationPaddingCells) * scaledCell);
  const perforationWidth = ((occupiedCellBounds.maxX - occupiedCellBounds.minX + 1) + (perforationPaddingCells * 2)) * scaledCell;
  const perforationHeight = ((occupiedCellBounds.maxY - occupiedCellBounds.minY + 1) + (perforationPaddingCells * 2)) * scaledCell;

  useEffect(() => {
    setZoom((previousZoom) => Math.max(dynamicMinZoom, Math.min(MAX_ZOOM, previousZoom)));
  }, [dynamicMinZoom]);

  const selectedPin = useMemo(
    () => pins.find((pin) => pin.id === selectedPinId) || null,
    [pins, selectedPinId]
  );

  useEffect(() => {
    setSelectedPinDraft(selectedPin ? String(selectedPin.content || '') : '');
    setSelectedPinCursor(selectedPin ? String(selectedPin.content || '').length : 0);
  }, [selectedPin]);

  const selectedPinDraftIndicator = useMemo(
    () => detectMentionAtCursor(selectedPinDraft, selectedPinCursor),
    [selectedPinCursor, selectedPinDraft]
  );

  useEffect(() => {
    if (selectedPinDraftIndicator && selectedPinInputRef.current) {
      setSelectedPinIndicatorAnchorEl(selectedPinInputRef.current);
      return;
    }
    setSelectedPinIndicatorAnchorEl(null);
  }, [selectedPinDraftIndicator]);

  const selectedPinScreenPosition = useMemo(() => {
    if (!selectedPin) return null;
    return {
      x: boardCenterX + (selectedPin.worldX * scaledCell),
      y: boardCenterY + (selectedPin.worldY * scaledCell),
    };
  }, [boardCenterX, boardCenterY, scaledCell, selectedPin]);

  const updateSelectedPinContent = useCallback((nextContent) => {
    if (!selectedPinId) return;
    setPins((previousPins) => previousPins.map((pin) => (
      pin.id === selectedPinId
        ? { ...pin, content: String(nextContent || '').slice(0, 1200) }
        : pin
    )));
  }, [selectedPinId]);

  const handleDeleteSelectedPin = useCallback(() => {
    if (!selectedPinId) return;
    if (selectedPinId === firstPinId && pins.length > 1) return;

    const orderedPins = pins;
    const pinIndex = orderedPins.findIndex((pin) => pin.id === selectedPinId);
    const previousPin = pinIndex > 0 ? orderedPins[pinIndex - 1] : null;
    const nextPin = pinIndex >= 0 && pinIndex < orderedPins.length - 1 ? orderedPins[pinIndex + 1] : null;

    setPins((previousPins) => previousPins.filter((pin) => pin.id !== selectedPinId));
    setYarnLinks((previousLinks) => {
      const filtered = previousLinks.filter((link) => link.fromId !== selectedPinId && link.toId !== selectedPinId);
      if (!previousPin || !nextPin) return filtered;

      const bridgeLink = createYarnLink(previousPin.id, nextPin.id);
      if (!bridgeLink || filtered.some((link) => link.id === bridgeLink.id)) return filtered;
      return [...filtered, bridgeLink];
    });
    setLimpYarnLinks((previousLinks) => previousLinks.filter((link) => link.fromId !== selectedPinId && link.toId !== selectedPinId));

    if (pendingYarnStartPinId === selectedPinId) {
      setPendingYarnStartPinId(null);
    }

    setSelectedPinId(null);
  }, [firstPinId, pendingYarnStartPinId, pins, selectedPinId]);

  const submitSelectedPinContent = useCallback(() => {
    if (!selectedPinId) return;
    updateSelectedPinContent(selectedPinDraft);
    setSelectedPinId(null);
  }, [selectedPinDraft, selectedPinId, updateSelectedPinContent]);

  const closeSelectedPinDash = useCallback(() => {
    setSelectedPinId(null);
  }, []);

  const completeYarnCreation = useCallback((targetPinId) => {
    if (!isOwner || interactionMode !== 'create_yarn') return;
    if (!pendingYarnStartPinId || pendingYarnStartPinId === targetPinId) return;

    const nextLink = createYarnLink(pendingYarnStartPinId, targetPinId);
    if (nextLink) {
      setYarnLinks((previousLinks) => (
        previousLinks.some((link) => link.id === nextLink.id)
          ? previousLinks
          : [...previousLinks, nextLink]
      ));
    }

    setInteractionMode('default');
    setPendingYarnStartPinId(null);
    setYarnPreviewPoint(null);
  }, [interactionMode, isOwner, pendingYarnStartPinId]);

  const handleCutYarn = useCallback((link) => {
    if (!isOwner || interactionMode !== 'cut' || !link?.id) return;

    setYarnLinks((previousLinks) => previousLinks.filter((item) => item.id !== link.id));
    setLimpYarnLinks((previousLinks) => {
      const withoutDuplicate = previousLinks.filter((item) => item.id !== link.id);
      return [...withoutDuplicate, link];
    });

    if (cutLimpTimeoutsRef.current[link.id]) {
      window.clearTimeout(cutLimpTimeoutsRef.current[link.id]);
    }
    cutLimpTimeoutsRef.current[link.id] = window.setTimeout(() => {
      setLimpYarnLinks((previousLinks) => previousLinks.filter((item) => item.id !== link.id));
      delete cutLimpTimeoutsRef.current[link.id];
    }, CUT_LIMP_DURATION_MS);
    setInteractionMode('default');
  }, [interactionMode, isOwner]);

  const handleOpenEventReference = useCallback(({ eventId, resolvedEvent }) => {
    if (typeof onOpenEventReference !== 'function') return;

    onOpenEventReference({
      eventId,
      resolvedEvent,
    });
  }, [onOpenEventReference]);

  const handleSaveBoard = useCallback(async () => {
    const targetUserId = Number(profileUserId || 0);
    if (!isOwner || targetUserId <= 0 || isSaving) return;
    if (boardStorageUnavailable) {
      setSaveFeedback('Cannot save: Theory Board backend storage is unavailable (503).');
      setSaveFeedbackTone('error');
      return;
    }

    const normalizedPins = pins.map((pin) => ({
      localId: pin.id,
      cell_content: String(pin?.content || '').trim().slice(0, 4000),
      grid_col: toCellCoord(Number(pin?.worldX || 0)),
      grid_row: toCellCoord(Number(pin?.worldY || 0)),
      offset_x: Math.round(((pin.worldX || 0) % 1) * 100),
      offset_y: Math.round(((pin.worldY || 0) % 1) * 100),
      pin_color: pin.color || 'red',
      z_index: 0,
    }));

    const occupiedCells = new Set();
    for (let index = 0; index < normalizedPins.length; index += 1) {
      const pin = normalizedPins[index];
      const key = `${pin.grid_col}:${pin.grid_row}`;
      if (occupiedCells.has(key)) {
        setSaveFeedback('Two tacks are in the same grid cell after snap. Separate them and save again.');
        setSaveFeedbackTone('error');
        return;
      }
      occupiedCells.add(key);
    }

    setIsSaving(true);
    setSaveFeedback('Saving board...');
    setSaveFeedbackTone('muted');

    try {
      const existingResponse = await api.get(`/api/v1/users/${targetUserId}/theory-board`, {
        params: { access_key: queryAccessKey }
      });
      setBoardStorageUnavailable(false);
      const existingBoard = existingResponse?.data?.board || {};
      const existingNodes = Array.isArray(existingBoard?.nodes) ? existingBoard.nodes : [];

      for (let index = 0; index < existingNodes.length; index += 1) {
        const nodeId = Number(existingNodes[index]?.id || 0);
        if (!Number.isFinite(nodeId) || nodeId <= 0) continue;
        await api.delete(`/api/v1/users/${targetUserId}/theory-board/nodes/${nodeId}`);
      }

      const localToServerNodeId = {};
      for (let index = 0; index < normalizedPins.length; index += 1) {
        const pin = normalizedPins[index];
        const createResponse = await api.post(`/api/v1/users/${targetUserId}/theory-board/nodes/cell`, {
          cell_content: pin.cell_content,
          grid_col: pin.grid_col,
          grid_row: pin.grid_row,
          offset_x: pin.offset_x,
          offset_y: pin.offset_y,
          pin_color: pin.pin_color,
          z_index: pin.z_index,
        });

        // The backend returns either the direct node object or { board: { nodes: [...] } }
        const createdData = createResponse?.data || {};
        const createdNodeFromBoard = (Array.isArray(createdData.board?.nodes) ? createdData.board.nodes : [])
          .find((node) => (
            Number(node?.grid_col) === pin.grid_col
            && Number(node?.grid_row) === pin.grid_row
          ));

        const createdNode = createdNodeFromBoard || createdData;
        const createdNodeId = Number(createdNode?.id || 0);

        if (!Number.isFinite(createdNodeId) || createdNodeId <= 0) {
          throw new Error('Unable to map saved node id');
        }
        localToServerNodeId[pin.localId] = createdNodeId;
      }

      for (let index = 0; index < yarnLinks.length; index += 1) {
        const link = yarnLinks[index];
        const fromNodeId = Number(localToServerNodeId[link?.fromId] || 0);
        const toNodeId = Number(localToServerNodeId[link?.toId] || 0);
        if (!(fromNodeId > 0) || !(toNodeId > 0) || fromNodeId === toNodeId) continue;
        await api.post(`/api/v1/users/${targetUserId}/theory-board/edges`, {
          from_node_id: fromNodeId,
          to_node_id: toNodeId,
        });
      }

      await api.patch(`/api/v1/users/${targetUserId}/theory-board/viewport`, {
        x: Math.round(Number(pan?.x || 0)),
        y: Math.round(Number(pan?.y || 0)),
        zoom: mapZoomToDb(zoom),
      });

      const latestResponse = await api.get(`/api/v1/users/${targetUserId}/theory-board`, {
        params: { access_key: queryAccessKey }
      });
      applyBoardSnapshot(latestResponse?.data?.board || null);
      setHasUnsavedChanges(false);
      setSaveFeedback('Board saved.');
      setSaveFeedbackTone('success');
    } catch (error) {
      console.error('[TheoryBoard] Save failed:', error?.response?.data || error?.message || error);
      if (isTheoryBoardStorageUnavailableError(error)) {
        setBoardStorageUnavailable(true);
      }
      setSaveFeedback(error?.response?.data?.error || error?.message || 'Failed to save board');
      setSaveFeedbackTone('error');
    } finally {
      setIsSaving(false);
    }
  }, [applyBoardSnapshot, boardStorageUnavailable, isOwner, isSaving, pan?.x, pan?.y, pins, profileUserId, queryAccessKey, yarnLinks, zoom]);

  const eventReferenceIds = useMemo(() => {
    const ids = [];
    pins.forEach((pin) => {
      const trimmed = String(pin?.content || '').trim();
      const match = trimmed.match(/^~(\d+)$/);
      if (!match) return;
      const eventId = Number(match[1]);
      if (Number.isFinite(eventId) && eventId > 0) ids.push(eventId);
    });
    return Array.from(new Set(ids));
  }, [pins]);

  useEffect(() => {
    if (isGuest) return;
    if (eventReferenceIds.length === 0) return;

    let cancelled = false;
    const fetchEventPreviews = async () => {
      const updates = {};
      for (let i = 0; i < eventReferenceIds.length; i += 1) {
        const eventId = eventReferenceIds[i];
        if (eventPreviewCache[eventId]) continue;
        try {
          const resolvedResponse = await api.get(`/api/v1/events/${eventId}/resolve`);
          const resolved = resolvedResponse?.data;
          if (!resolved?.id) {
            updates[eventId] = { error: true };
            continue;
          }

          let fullEvent = resolved;
          const timelineId = Number(resolved.timeline_id || 0);
          if (timelineId > 0) {
            try {
              const eventResponse = await api.get(`/api/v1/events/${eventId}`);
              if (eventResponse?.data?.id) {
                fullEvent = eventResponse.data;
              }
            } catch (_) {
              // fallback to resolved payload
            }
          }

          updates[eventId] = {
            resolved,
            fullEvent,
          };
        } catch (_) {
          updates[eventId] = { error: true };
        }
      }

      if (cancelled || Object.keys(updates).length === 0) return;
      setEventPreviewCache((previous) => ({
        ...previous,
        ...updates,
      }));
    };

    fetchEventPreviews();
    return () => {
      cancelled = true;
    };
  }, [eventPreviewCache, eventReferenceIds, isGuest]);

  const handlePinPointerDown = useCallback((pin, event) => {
    event.stopPropagation();
    if (event.button !== 0) return;

    if (isOwner && interactionMode === 'create_yarn') {
      if (!pendingYarnStartPinId) {
        setPendingYarnStartPinId(pin.id);
        setSelectedPinId(pin.id);
        return;
      }

      completeYarnCreation(pin.id);
      setSelectedPinId(pin.id);
      return;
    }

    if (isOwner && interactionMode === 'cut') {
      setSelectedPinId(pin.id);
      return;
    }

    pinDragRef.current = {
      pinId: pin.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWorldX: pin.worldX,
      startWorldY: pin.worldY,
    };

    setActivePinDragId(pin.id);
    setSelectedPinId(pin.id);

    event.currentTarget.setPointerCapture(event.pointerId);
  }, [completeYarnCreation, interactionMode, isOwner, pendingYarnStartPinId]);

  const handlePinPointerMove = useCallback((event) => {
    if (pinDragRef.current.pointerId !== event.pointerId || !pinDragRef.current.pinId) return;
    event.stopPropagation();

    const deltaWorldX = (event.clientX - pinDragRef.current.startX) / scaledCell;
    const deltaWorldY = (event.clientY - pinDragRef.current.startY) / scaledCell;

    const nextWorldX = pinDragRef.current.startWorldX + deltaWorldX;
    const nextWorldY = pinDragRef.current.startWorldY + deltaWorldY;
    const isOriginPin = pinDragRef.current.pinId === firstPinId;

    setPins((previousPins) => previousPins.map((pin) => {
      if (pin.id !== pinDragRef.current.pinId) return pin;
      if (isOriginPin) {
        return {
          ...pin,
          worldX: clamp(nextWorldX, -0.45, 0.45),
          worldY: clamp(nextWorldY, -0.45, 0.45),
        };
      }

      return {
        ...pin,
        worldX: nextWorldX,
        worldY: nextWorldY,
      };
    }));
  }, [firstPinId, scaledCell]);

  const handlePinPointerUp = useCallback((event) => {
    if (pinDragRef.current.pointerId !== event.pointerId) return;
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pinDragRef.current = {
      pinId: null,
      pointerId: null,
      startX: 0,
      startY: 0,
      startWorldX: 0,
      startWorldY: 0,
    };

    setActivePinDragId(null);
  }, []);

  return (
    <Paper
      ref={boardRef}
      sx={{
        p: isFullscreen ? 0 : 0.4,
        borderRadius: isFullscreen ? 0 : 2.2,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          borderRadius: isFullscreen ? 0 : 1.6,
          p: isFullscreen ? 0 : { xs: 1.35, sm: 1.7 },
          background: `
            linear-gradient(142deg, #5f3920 0%, #4b2d18 34%, #71482b 67%, #3f2615 100%),
            repeating-linear-gradient(20deg, rgba(255,255,255,0.08) 0 2px, rgba(0,0,0,0.08) 2px 6px),
            repeating-linear-gradient(112deg, rgba(0,0,0,0.12) 0 1px, rgba(0,0,0,0) 1px 5px)
          `,
          boxShadow: `
            inset 0 1px 0 rgba(255, 233, 205, 0.28),
            inset 0 -1px 0 rgba(10, 5, 2, 0.55),
            inset 0 0 0 1px rgba(19, 11, 6, 0.78),
            inset 0 0 24px rgba(0,0,0,0.22),
            0 12px 30px rgba(10, 5, 3, 0.45)
          `,
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            minHeight: isFullscreen ? 0 : 390,
            borderRadius: 0.35,
            background: `
              radial-gradient(circle at 8% 12%, rgba(246, 210, 168, 0.34) 0 0.7px, transparent 0.8px),
              radial-gradient(circle at 82% 79%, rgba(86, 53, 29, 0.26) 0 0.6px, transparent 0.9px),
              radial-gradient(circle at 24% 74%, rgba(239, 198, 156, 0.2) 0 0.8px, transparent 1px),
              repeating-radial-gradient(circle at 50% 50%, rgba(85, 50, 28, 0.11) 0 0.7px, rgba(0,0,0,0) 0.8px 2.2px),
              linear-gradient(180deg, #be885f 0%, #b17b53 45%, #a9734d 100%)
            `,
            boxShadow: `
              inset 0 0 0 1px rgba(78, 47, 29, 0.35),
              inset 0 14px 26px rgba(255, 233, 208, 0.12),
              inset 0 -14px 30px rgba(64, 39, 22, 0.2)
            `,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: isFullscreen ? '100%' : 'auto',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.03) 0,
                rgba(255,255,255,0.03) 1px,
                rgba(0,0,0,0) 1px,
                rgba(0,0,0,0) 3px
              )`,
              mixBlendMode: 'soft-light',
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'relative',
              px: { xs: 0.8, sm: 1.35 },
              py: 0.8,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(9, 7, 4, 0.18)' : 'rgba(255, 252, 247, 0.12)',
              borderBottom: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(55, 31, 17, 0.18)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: { xs: 0.8, sm: 1 },
              zIndex: 2,
            }}
          >
            <Stack direction="row" spacing={0.35} alignItems="center" sx={{ flexShrink: 0 }}>
              {isOwner && (
                <Tooltip title="Add Thumb Tack">
                  <IconButton
                    size="small"
                    onClick={handleAddPin}
                    sx={{
                      p: 0.35,
                      color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.92)' : 'rgba(84,48,24,0.92)',
                      border: 'none',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    <PushPinIcon fontSize="small" />
                    <AddIcon sx={{ fontSize: 13, ml: 0.2 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', flexShrink: 1 }}>
              {isOwner && (
                <Button
                  size="small"
                  variant={hasUnsavedChanges ? 'contained' : 'outlined'}
                  onClick={handleSaveBoard}
                  disabled={isSaving || boardLoading || boardStorageUnavailable || !hasUnsavedChanges}
                  startIcon={<SaveOutlinedIcon sx={{ fontSize: 15 }} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    px: { xs: 0.8, sm: 1.2 },
                    minWidth: { xs: 76, sm: 96 },
                    height: 28,
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    bgcolor: hasUnsavedChanges
                      ? (theme.palette.mode === 'dark' ? 'rgba(88, 126, 86, 0.86)' : 'rgba(93, 142, 89, 0.88)')
                      : 'transparent',
                    color: hasUnsavedChanges
                      ? 'rgba(248, 255, 245, 0.96)'
                      : (theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.76)' : 'rgba(84,48,24,0.72)'),
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.2)' : 'rgba(84,48,24,0.26)',
                    '&:hover': {
                      bgcolor: hasUnsavedChanges
                        ? (theme.palette.mode === 'dark' ? 'rgba(96, 136, 94, 0.92)' : 'rgba(100, 150, 95, 0.92)')
                        : 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
              {saveFeedback && (
                <Typography
                  variant="caption"
                  sx={{
                    maxWidth: { xs: 120, sm: 240 },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    color: saveFeedbackTone === 'error'
                      ? (theme.palette.mode === 'dark' ? '#ffab91' : '#b23b17')
                      : saveFeedbackTone === 'success'
                        ? (theme.palette.mode === 'dark' ? '#b9f6ca' : '#2e7d32')
                        : (theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.72)' : 'rgba(84,48,24,0.68)'),
                  }}
                >
                  {saveFeedback}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              <Tooltip title="Recenter board">
                <IconButton
                  size="small"
                  onClick={recenterBoard}
                  sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.9)' : 'rgba(84,48,24,0.9)', p: { xs: 0.5, sm: 1 } }}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom out">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => adjustZoom(zoom / ZOOM_FACTOR)}
                    disabled={zoom <= dynamicMinZoom + 0.001}
                    sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.9)' : 'rgba(84,48,24,0.9)', p: { xs: 0.5, sm: 1 } }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Zoom in">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => adjustZoom(zoom * ZOOM_FACTOR)}
                    disabled={zoom >= MAX_ZOOM - 0.001}
                    sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.9)' : 'rgba(84,48,24,0.9)', p: { xs: 0.5, sm: 1 } }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              {isOwner && (
                <Tooltip title={interactionMode === 'cut' ? 'Exit yarn cut mode' : 'Cut yarn mode'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (interactionMode === 'cut') {
                        setInteractionMode('default');
                        return;
                      }
                      setInteractionMode('cut');
                      setPendingYarnStartPinId(null);
                      setYarnPreviewPoint(null);
                    }}
                    sx={{
                      p: { xs: 0.5, sm: 1 },
                      color: interactionMode === 'cut'
                        ? (theme.palette.mode === 'dark' ? 'rgba(255,210,160,0.98)' : 'rgba(120, 44, 14, 0.96)')
                        : (theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.9)' : 'rgba(84,48,24,0.9)'),
                    }}
                  >
                    <ContentCutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {isOwner && (
                <Tooltip title={interactionMode === 'create_yarn' ? 'Exit yarn create mode' : 'Add yarn'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (interactionMode === 'create_yarn') {
                        setInteractionMode('default');
                        setPendingYarnStartPinId(null);
                        setYarnPreviewPoint(null);
                        return;
                      }
                      setInteractionMode('create_yarn');
                      setPendingYarnStartPinId(null);
                      setYarnPreviewPoint(null);
                    }}
                    sx={{
                      p: { xs: 0.5, sm: 1 },
                      color: interactionMode === 'create_yarn'
                        ? (theme.palette.mode === 'dark' ? 'rgba(255,210,160,0.98)' : 'rgba(120, 44, 14, 0.96)')
                        : (theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.9)' : 'rgba(84,48,24,0.9)'),
                    }}
                  >
                    <HubIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <IconButton
                  size="small"
                  onClick={handleToggleFullscreen}
                  sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.9)' : 'rgba(84,48,24,0.9)', p: { xs: 0.5, sm: 1 } }}
                >
                  {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Box
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            sx={{
              position: 'relative',
              flex: 1,
              minHeight: isFullscreen ? 0 : 330,
              zIndex: 1,
              cursor: isOwner && interactionMode === 'cut'
                ? 'crosshair'
                : isOwner && interactionMode === 'create_yarn'
                  ? 'crosshair'
                  : (isDragging ? 'grabbing' : 'grab'),
              touchAction: 'none',
              backgroundColor: '#b27b53',
              backgroundImage: `
                radial-gradient(circle at 15% 22%, rgba(255,225,192,0.32) 0 0.55px, transparent 0.7px),
                radial-gradient(circle at 72% 68%, rgba(95,56,31,0.24) 0 0.55px, transparent 0.75px),
                radial-gradient(circle at 42% 38%, rgba(245,206,166,0.24) 0 0.5px, transparent 0.7px),
                repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, rgba(0,0,0,0) 1px 4px),
                repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0 1px, rgba(0,0,0,0) 1px 5px)
              `,
              backgroundSize: `${textureTile * 0.7}px ${textureTile * 0.7}px, ${textureTile * 0.9}px ${textureTile * 0.9}px, ${textureTile}px ${textureTile}px, ${textureTile * 0.35}px ${textureTile * 0.35}px, ${textureTile * 0.35}px ${textureTile * 0.35}px`,
              backgroundPosition: `${wrappedX}px ${wrappedY}px, ${wrappedX * 0.7}px ${wrappedY * 0.7}px, ${wrappedX * 1.1}px ${wrappedY * 1.1}px, ${wrappedX}px ${wrappedY}px, ${wrappedX}px ${wrappedY}px`,
              boxShadow: `
                inset 0 0 0 1px rgba(78, 47, 29, 0.35),
                inset 0 14px 26px rgba(255, 233, 208, 0.12),
                inset 0 -14px 30px rgba(64, 39, 22, 0.2)
              `,
            }}
          >
            {isOwner && (
              <Box
                sx={{
                  position: 'absolute',
                  left: perforationLeft,
                  top: perforationTop,
                  width: perforationWidth,
                  height: perforationHeight,
                  borderRadius: 0.8,
                  border: '2px dashed',
                  borderColor: pins.length === 0 ? 'rgba(255, 245, 229, 0.8)' : 'rgba(255, 245, 229, 0.45)',
                  boxShadow: pins.length === 0 ? '0 0 0 1px rgba(95, 57, 30, 0.28)' : 'none',
                  pointerEvents: 'none',
                }}
              />
            )}

            {(yarnLinks.length > 0 || limpYarnLinks.length > 0) && (
              <Box
                component="svg"
                viewBox={`0 0 ${Math.max(1, viewportSize.width)} ${Math.max(1, viewportSize.height)}`}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: isOwner && interactionMode === 'cut' ? 'auto' : 'none',
                  zIndex: 2,
                }}
              >
                {[...yarnLinks, ...limpYarnLinks].map((link, index) => {
                  const from = pinPositionMap[link.fromId];
                  const to = pinPositionMap[link.toId];
                  if (!from || !to) return null;

                  const isLimp = limpYarnLinks.some((item) => item.id === link.id);
                  const droop = (isLimp ? 24 : 14) + ((index % 3) * 4);
                  const controlX = (from.screenX + to.screenX) / 2;
                  const controlY = Math.max(from.screenY, to.screenY) + droop;
                  const distance = Math.hypot(to.screenX - from.screenX, to.screenY - from.screenY);
                  const segmentCount = Math.max(1, Math.round(distance / scaledCell));
                  const dash = Math.max(6, distance / (segmentCount * 2.6));
                  const gap = Math.max(4, dash * 0.85);
                  const pathD = `M ${from.screenX} ${from.screenY} Q ${controlX} ${controlY} ${to.screenX} ${to.screenY}`;

                  return (
                    <g key={link.id}>
                      <path
                        d={pathD}
                        stroke={isLimp ? 'rgba(114, 66, 39, 0.72)' : 'rgba(114, 66, 39, 0.82)'}
                        strokeWidth={3.8}
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          transformOrigin: `${controlX}px ${controlY}px`,
                          animation: isLimp
                            ? `yarnCutDrop ${CUT_LIMP_DURATION_MS}ms ease-out forwards`
                            : 'yarnGravity 3.8s ease-in-out infinite alternate',
                        }}
                      />
                      <path
                        d={pathD}
                        stroke={isLimp ? 'rgba(226, 195, 153, 0.62)' : 'rgba(226, 195, 153, 0.74)'}
                        strokeWidth={1.4}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${gap}`}
                        style={{
                          animation: isLimp ? `yarnCutDrop ${CUT_LIMP_DURATION_MS}ms ease-out forwards` : 'none',
                        }}
                      />
                      {isOwner && interactionMode === 'cut' && !isLimp && (
                        <path
                          d={pathD}
                          stroke="transparent"
                          strokeWidth={14}
                          fill="none"
                          pointerEvents="stroke"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCutYarn(link);
                          }}
                        />
                      )}
                    </g>
                  );
                })}
              </Box>
            )}

            {isOwner && interactionMode === 'create_yarn' && pendingYarnStartPinId && yarnPreviewPoint && pinPositionMap[pendingYarnStartPinId] && (
              <Box
                component="svg"
                viewBox={`0 0 ${Math.max(1, viewportSize.width)} ${Math.max(1, viewportSize.height)}`}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                {(() => {
                  const startPin = pinPositionMap[pendingYarnStartPinId];
                  const controlX = (startPin.screenX + yarnPreviewPoint.x) / 2;
                  const controlY = Math.max(startPin.screenY, yarnPreviewPoint.y) + 20;
                  const previewPath = `M ${startPin.screenX} ${startPin.screenY} Q ${controlX} ${controlY} ${yarnPreviewPoint.x} ${yarnPreviewPoint.y}`;
                  return (
                    <path
                      d={previewPath}
                      stroke="rgba(250, 233, 205, 0.82)"
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="8 6"
                    />
                  );
                })()}
              </Box>
            )}

            {pinPositions.map((pin) => {
              const contentText = String(pin.content || '').trim();
              if (!contentText) return null;

              const eventMatch = contentText.match(/^~(\d+)$/);
              const isEventReference = Boolean(eventMatch);
              const eventId = isEventReference ? Number(eventMatch[1]) : null;
              const preview = eventId ? eventPreviewCache[eventId] : null;
              const previewEvent = preview?.fullEvent || preview?.resolved || null;
              const canOpenResolvedEventReference = Boolean(isEventReference && eventId && previewEvent?.id);
              const richPayload = isEventReference ? null : toRichContentPayload(contentText);
              const singleEmoji = isSingleEmoji(contentText);
              const isChipOnlyContent = singleEmoji || (
                Boolean(richPayload?.content?.length)
                && richPayload.content.every((item) => (
                  item?.type !== 'text' || !String(item?.value || '').trim()
                ))
              );

              const noteScale = (() => {
                if (zoom >= 1.0) {
                  return 1.0 + (zoom - 1.0) * 1.8;
                }
                const range = 1.0 - dynamicMinZoom;
                if (range <= 0) return 1.0;
                const t = (zoom - dynamicMinZoom) / range;
                return 0.65 + 0.35 * Math.max(0, Math.min(1, t));
              })();

              return (
                <Box
                  key={`${pin.id}-content`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!canOpenResolvedEventReference) return;
                    handleOpenEventReference({
                      eventId,
                      resolvedEvent: previewEvent,
                    });
                  }}
                  sx={{
                    position: 'absolute',
                    left: pin.screenX,
                    top: pin.screenY + 14,
                    width: isEventReference ? 'auto' : 'max-content',
                    minWidth: (!isEventReference && !isChipOnlyContent) ? 140 : undefined,
                    maxWidth: isEventReference
                      ? Math.min(520, Math.max(250, window.innerWidth * 0.72))
                      : Math.min(560, Math.max(230, window.innerWidth * 0.68)),
                    marginRight: -2000,
                    maxHeight: 'none',
                    overflow: 'visible',
                    borderRadius: (isChipOnlyContent || isEventReference) ? 1 : '2px 3px 18px 2px',
                    border: (isChipOnlyContent || isEventReference) ? 'none' : '1px solid',
                    borderColor: isChipOnlyContent
                      ? 'transparent'
                      : isEventReference
                        ? 'rgba(61, 32, 18, 0.45)'
                        : 'rgba(67, 38, 23, 0.18)',
                    bgcolor: (isChipOnlyContent || isEventReference)
                      ? 'transparent'
                      : (() => {
                        const hash = String(pin.id).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
                        const colors = theme.palette.mode === 'dark'
                          ? ['#3e3b12', '#4a1a2c', '#1a4a32', '#1a324a', '#321a4a']
                          : ['#ffff88', '#ff80ab', '#80f0ff', '#b2ff59', '#ffd180', '#ea80fc'];
                        return colors[Math.abs(hash) % colors.length];
                      })(),
                    backgroundImage: (isChipOnlyContent || isEventReference)
                      ? 'none'
                      : 'linear-gradient(165deg, rgba(255,255,255,0.24) 0%, rgba(0,0,0,0.06) 100%)',
                    boxShadow: (isChipOnlyContent || isEventReference)
                      ? 'none'
                      : '2px 6px 12px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.12)',
                    p: (isChipOnlyContent || isEventReference) ? 0 : 1.2,
                    zIndex: 2,
                    transform: `translateX(-50%) scale(${noteScale}) rotate(${((String(pin.id).length % 7) - 3) * 0.6}deg)`,
                    transformOrigin: 'top center',
                    cursor: canOpenResolvedEventReference ? 'pointer' : 'default',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: `translateX(-50%) scale(${noteScale * 1.02}) rotate(${((String(pin.id).length % 7) - 3) * 0.6}deg)`,
                      zIndex: 10,
                    }
                  }}
                >
                  {isEventReference ? (
                    (() => {
                      if (!previewEvent?.id) {
                        return (
                          <Paper
                            elevation={2}
                            sx={{
                              position: 'relative',
                              px: 1.2,
                              py: 0.95,
                              borderRadius: 1.2,
                              minWidth: 188,
                              border: '1px solid rgba(255,255,255,0.34)',
                              bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(18, 20, 24, 0.84)'
                                : 'rgba(250, 251, 255, 0.84)',
                              boxShadow: theme.palette.mode === 'dark'
                                ? '0 10px 24px rgba(0,0,0,0.36)'
                                : '0 10px 24px rgba(15,23,42,0.16)',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                filter: 'blur(2.8px)',
                                opacity: 0.62,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                              }}
                            >
                              <EventOutlinedIcon sx={{ fontSize: 18 }} />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {`~${eventId}`}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(3px)',
                                background: theme.palette.mode === 'dark'
                                  ? 'linear-gradient(145deg, rgba(146,27,27,0.38), rgba(24,24,24,0.48))'
                                  : 'linear-gradient(145deg, rgba(146,27,27,0.28), rgba(255,255,255,0.46))',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  px: 0.9,
                                  py: 0.25,
                                  borderRadius: 0.8,
                                  fontWeight: 900,
                                  letterSpacing: 1.05,
                                  color: '#fff',
                                  bgcolor: 'rgba(180, 30, 30, 0.88)',
                                  textTransform: 'uppercase',
                                }}
                              >
                                PRIVATE
                              </Typography>
                            </Box>
                          </Paper>
                        );
                      }

                      const previewType = String(previewEvent.type || 'remark').toLowerCase();
                      if (previewType === 'news') {
                        return (
                          <Box sx={{ pointerEvents: 'none' }}>
                            <NewsEventMarker event={previewEvent} previewOnly onPreviewClick={() => { }} />
                          </Box>
                        );
                      }
                      if (previewType === 'media') {
                        return (
                          <Box sx={{ pointerEvents: 'none' }}>
                            <MediaEventMarker event={previewEvent} previewOnly onPreviewClick={() => { }} />
                          </Box>
                        );
                      }
                      return (
                        <Box sx={{ pointerEvents: 'none' }}>
                          <RemarkEventMarker event={previewEvent} previewOnly onPreviewClick={() => { }} avatarSide="left" />
                        </Box>
                      );
                    })()
                  ) : singleEmoji ? (
                    <Box
                      sx={{
                        fontSize: '3.5rem',
                        lineHeight: 1.1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.22))',
                      }}
                    >
                      {contentText}
                    </Box>
                  ) : (
                    <RichContentRenderer
                      content={richPayload}
                      theme={theme}
                      onOpenEventReference={handleOpenEventReference}
                      solidChips
                      disableInteractions={isFullscreen}
                    />
                  )}
                </Box>
              );
            })}

            {pinPositions.map((pin) => (
              <Box
                key={pin.id}
                sx={{
                  position: 'absolute',
                  left: pin.screenX,
                  top: pin.screenY,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.75), ${pin.color})`,
                  boxShadow: '0 5px 10px rgba(22, 11, 5, 0.34), inset -2px -3px 6px rgba(0,0,0,0.24)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                  pointerEvents: 'auto',
                  touchAction: 'none',
                  cursor: activePinDragId === pin.id ? 'grabbing' : 'grab',
                  animation: pin.isNew ? 'tackDrop 460ms cubic-bezier(0.2, 0.75, 0.25, 1)' : 'pinGravity 3.4s ease-in-out infinite alternate',
                }}
                onPointerDown={(event) => handlePinPointerDown(pin, event)}
                onPointerMove={handlePinPointerMove}
                onPointerUp={handlePinPointerUp}
                onPointerCancel={handlePinPointerUp}
              />
            ))}

            {isOwner && selectedPin && selectedPinScreenPosition && (
              <Box
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                sx={{
                  position: 'absolute',
                  left: selectedPinScreenPosition.x + 22,
                  top: selectedPinScreenPosition.y - 10,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'stretch',
                  zIndex: 5,
                }}
              >
                <Box
                  sx={{
                    width: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 11,
                      height: 2,
                      borderRadius: 999,
                      bgcolor: 'rgba(53, 28, 16, 0.7)',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    width: { xs: 158, sm: 188 },
                    p: 0.7,
                    borderRadius: 1.2,
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,235,206,0.26)' : 'rgba(71, 38, 22, 0.24)',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 11, 7, 0.86)' : 'rgba(255, 249, 239, 0.92)',
                    boxShadow: '0 10px 20px rgba(18, 9, 4, 0.25)',
                  }}
                >
                  <Stack direction="row" spacing={0.6} alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <TextField
                        ref={selectedPinInputRef}
                        value={selectedPinDraft}
                        onChange={(event) => {
                          const nextValue = event.target.value.slice(0, 1200);
                          const nextCursor = event.target.selectionStart ?? event.target.value.length;
                          setSelectedPinDraft(nextValue);
                          setSelectedPinCursor(nextCursor);
                          const mention = detectMentionAtCursor(nextValue, nextCursor);
                          setSelectedPinIndicatorAnchorEl(mention && selectedPinInputRef.current ? selectedPinInputRef.current : null);
                        }}
                        onClick={(event) => {
                          const nextCursor = event.target.selectionStart ?? selectedPinDraft.length;
                          setSelectedPinCursor(nextCursor);
                          const mention = detectMentionAtCursor(selectedPinDraft, nextCursor);
                          setSelectedPinIndicatorAnchorEl(mention && selectedPinInputRef.current ? selectedPinInputRef.current : null);
                        }}
                        onKeyUp={(event) => {
                          const nextCursor = event.currentTarget.selectionStart ?? selectedPinDraft.length;
                          setSelectedPinCursor(nextCursor);
                          const mention = detectMentionAtCursor(selectedPinDraft, nextCursor);
                          setSelectedPinIndicatorAnchorEl(mention && selectedPinInputRef.current ? selectedPinInputRef.current : null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          if (event.shiftKey) return;
                          event.preventDefault();
                          submitSelectedPinContent();
                        }}
                        size="small"
                        variant="outlined"
                        fullWidth
                        placeholder="@ # i- www or ~124"
                        multiline
                        minRows={1}
                        maxRows={3}
                        inputProps={{ maxLength: 1200 }}
                        sx={{
                          '& .MuiInputBase-root': {
                            fontSize: '0.75rem',
                            borderRadius: 1,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 15, 11, 0.86)' : 'rgba(255, 255, 255, 0.84)',
                          },
                        }}
                      />
                      <Popper
                        open={Boolean(selectedPinDraftIndicator && selectedPinIndicatorAnchorEl)}
                        anchorEl={selectedPinIndicatorAnchorEl}
                        placement="bottom-start"
                        sx={{ zIndex: 6 }}
                      >
                        <Paper
                          sx={{
                            mt: 0.8,
                            px: 1.2,
                            py: 0.8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.7,
                            bgcolor: selectedPinDraftIndicator?.color || 'rgba(255,255,255,0.92)',
                            border: '1px solid',
                            borderColor: 'divider',
                            pointerEvents: 'none',
                          }}
                        >
                          {selectedPinDraftIndicator?.type === 'user' && <PersonIcon sx={{ fontSize: 14 }} />}
                          {selectedPinDraftIndicator?.type === 'hashtag' && <HashtagIcon sx={{ fontSize: 14 }} />}
                          {selectedPinDraftIndicator?.type === 'community' && <CommunityIcon sx={{ fontSize: 14 }} />}
                          {(selectedPinDraftIndicator?.type === 'url' || selectedPinDraftIndicator?.type === 'link') && <LinkIcon sx={{ fontSize: 14 }} />}
                          {selectedPinDraftIndicator?.type === 'event' && <EventOutlinedIcon sx={{ fontSize: 14 }} />}
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {`${selectedPinDraftIndicator?.label || ''}${selectedPinDraftIndicator?.partial ? ` ${selectedPinDraftIndicator.partial}` : ''}`}
                          </Typography>
                        </Paper>
                      </Popper>
                    </Box>
                    <Box
                      sx={{
                        mt: 0.1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 0.15,
                      }}
                    >
                      <Tooltip title="Save tack content">
                        <span>
                          <IconButton
                            size="small"
                            onClick={submitSelectedPinContent}
                            sx={{
                              color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.9)' : 'rgba(84,48,24,0.86)',
                            }}
                          >
                            <EastIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete tack">
                        <span>
                          <IconButton
                            size="small"
                            disabled={selectedPin?.id === firstPinId && pins.length > 1}
                            onClick={handleDeleteSelectedPin}
                            sx={{
                              color: theme.palette.mode === 'dark' ? 'rgba(255,220,210,0.82)' : 'rgba(122, 39, 22, 0.82)',
                              '&.Mui-disabled': {
                                color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.35)' : 'rgba(122,39,22,0.3)',
                              },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Minimize dash">
                        <span>
                          <IconButton
                            size="small"
                            onClick={closeSelectedPinDash}
                            sx={{
                              color: theme.palette.mode === 'dark' ? 'rgba(255,240,220,0.75)' : 'rgba(84,48,24,0.68)',
                            }}
                          >
                            <MinimizeIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          width: 0,
          height: 0,
          overflow: 'hidden',
          '@keyframes tackDrop': {
            '0%': { transform: 'translate(-50%, -85%) scale(0.8)' },
            '58%': { transform: 'translate(-50%, -43%) scale(1.04)' },
            '100%': { transform: 'translate(-50%, -50%) scale(1)' },
          },
          '@keyframes pinGravity': {
            '0%': { transform: 'translate(-50%, -50%)' },
            '100%': { transform: 'translate(-50%, -49%)' },
          },
          '@keyframes yarnGravity': {
            '0%': { transform: 'translateY(0px)' },
            '100%': { transform: 'translateY(2px)' },
          },
          '@keyframes yarnCutDrop': {
            '0%': { transform: 'translateY(0px)', opacity: 1 },
            '100%': { transform: 'translateY(18px)', opacity: 0 },
          },
        }}
      />
    </Paper>
  );
};

export default TheoryBoardModule;
