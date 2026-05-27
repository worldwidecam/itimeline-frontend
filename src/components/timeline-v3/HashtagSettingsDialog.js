import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import api, { updateTimelineDetails } from '../../utils/api';
import { TimelineHeroBanner } from './TimelineHeroBanner';
import TradingCard from '../common/TradingCard';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassSquareActionButtonSx,
  getGlassPillActionButtonSx,
} from '../../utils/formStyleGuide';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const FRAME_POSITION_MIN = -40;
const FRAME_POSITION_MAX = 140;
const JOYSTICK_SENSITIVITY = 0.42;
const CAMERA_PAN_MULTIPLIER = 0.9;

const buildCoverFallbackGradient = (mode) => (
  mode === 'dark'
    ? 'linear-gradient(135deg, rgba(13,36,63,0.86) 0%, rgba(20,48,92,0.9) 40%, rgba(65,34,106,0.86) 100%)'
    : 'linear-gradient(135deg, rgba(250,232,242,0.94) 0%, rgba(246,232,220,0.96) 68%, rgba(252,238,224,0.98) 100%)'
);

// Helper to extract storage key from R2/Cloudinary URL for backend
const extractKeyFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // If already a key (no protocol and doesn't start with /), return as-is
  if (!url.startsWith('http') && !url.startsWith('/')) {
    return url;
  }
  
  try {
    const urlObj = url.startsWith('http') ? new URL(url) : null;
    const path = urlObj ? urlObj.pathname : url;
    
    // R2 path format: /media/{purpose}/{filename}
    const mediaMatch = path.match(/\/media\/(avatars|covers|events|music)\/(.+)$/);
    if (mediaMatch) {
      return `${mediaMatch[1]}/${mediaMatch[2]}`;
    }

    // Fallback for root-level purposes
    const purposeMatch = path.match(/\/(avatars|covers|events|music)\/(.+)$/);
    if (purposeMatch) {
      return `${purposeMatch[1]}/${purposeMatch[2]}`;
    }

    // Legacy path format: /timelines/{id}/{filename}
    const legacyMatch = path.match(/\/timelines\/[^/]+\/(.+)$/);
    if (legacyMatch) {
      return `timelines/${legacyMatch[1]}`;
    }
    
    // Fallback: return path without leading slash
    return path.startsWith('/') ? path.slice(1) : path;
  } catch (e) {
    // If URL parsing fails, return original
    return url;
  }
};

const HashtagSettingsDialog = ({
  open,
  onClose,
  timelineId,
  timelineName,
  timelineType = 'hashtag',
  initialDescription,
  initialCoverPortraitUrl,
  initialCoverPortraitPosition,
  initialCoverPortraitZoom,
  initialCoverLandscapeUrl,
  initialCoverLandscapePosition,
  initialCoverLandscapeZoom,
  onSaved,
  onNotify,
}) => {
  const theme = useTheme();
  const [description, setDescription] = useState('');
  const [coverPortraitUrl, setCoverPortraitUrl] = useState('');
  const [coverPortraitPosition, setCoverPortraitPosition] = useState({ x: 50, y: 50 });
  const [coverPortraitZoom, setCoverPortraitZoom] = useState(1);
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [pendingCoverPreviewUrl, setPendingCoverPreviewUrl] = useState('');
  const [pendingCoverRemoval, setPendingCoverRemoval] = useState(false);

  // Landscape cover states
  const [coverLandscapeUrl, setCoverLandscapeUrl] = useState('');
  const [coverLandscapePosition, setCoverLandscapePosition] = useState({ x: 50, y: 50 });
  const [coverLandscapeZoom, setCoverLandscapeZoom] = useState(1);
  const [pendingCoverLandscapeFile, setPendingCoverLandscapeFile] = useState(null);
  const [pendingCoverLandscapePreviewUrl, setPendingCoverLandscapePreviewUrl] = useState('');
  const [pendingCoverLandscapeRemoval, setPendingCoverLandscapeRemoval] = useState(false);
  const [activeFrameTarget, setActiveFrameTarget] = useState('portrait');
  const [joystickKnobOffset, setJoystickKnobOffset] = useState({ x: 0, y: 0 });

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const joystickRef = useRef(null);
  const joystickDragRef = useRef(null);

  const portraitPreviewUrl = pendingCoverRemoval
    ? ''
    : (pendingCoverPreviewUrl || coverPortraitUrl);
  const landscapePreviewUrl = pendingCoverLandscapeRemoval
    ? ''
    : (pendingCoverLandscapePreviewUrl || coverLandscapeUrl);
  
  const hasPortraitPreview = Boolean(portraitPreviewUrl);
  const hasLandscapePreview = Boolean(landscapePreviewUrl);
  
  const activeCoverPreviewUrl = activeFrameTarget === 'portrait' ? portraitPreviewUrl : landscapePreviewUrl;
  const hasActivePreview = activeFrameTarget === 'portrait' ? hasPortraitPreview : hasLandscapePreview;

  const fallbackGradient = useMemo(
    () => buildCoverFallbackGradient(theme.palette.mode),
    [theme.palette.mode],
  );

  const emitNotice = useCallback((message, severity = 'info') => {
    if (onNotify) onNotify({ message, severity });
  }, [onNotify]);

  useEffect(() => {
    if (!open) return;
    setDescription(String(initialDescription || ''));
    setCoverPortraitUrl(String(initialCoverPortraitUrl || '').trim());
    setCoverPortraitPosition({
      x: Number(initialCoverPortraitPosition?.x ?? 50),
      y: Number(initialCoverPortraitPosition?.y ?? 50),
    });
    setCoverPortraitZoom(Number(initialCoverPortraitZoom ?? 1) || 1);
    
    // Landscape initialization
    setCoverLandscapeUrl(String(initialCoverLandscapeUrl || '').trim());
    setCoverLandscapePosition({
      x: Number(initialCoverLandscapePosition?.x ?? 50),
      y: Number(initialCoverLandscapePosition?.y ?? 50),
    });
    setCoverLandscapeZoom(Number(initialCoverLandscapeZoom ?? 1) || 1);

    setPendingCoverFile(null);
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
    setPendingCoverPreviewUrl('');
    setPendingCoverRemoval(false);

    setPendingCoverLandscapeFile(null);
    if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
    }
    setPendingCoverLandscapePreviewUrl('');
    setPendingCoverLandscapeRemoval(false);

    setActiveFrameTarget('portrait');
    setHasUnsavedChanges(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    initialDescription,
    initialCoverPortraitUrl,
    initialCoverPortraitPosition?.x,
    initialCoverPortraitPosition?.y,
    initialCoverPortraitZoom,
    initialCoverLandscapeUrl,
    initialCoverLandscapePosition?.x,
    initialCoverLandscapePosition?.y,
    initialCoverLandscapeZoom,
  ]);

  useEffect(() => () => {
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
    if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
    }
  }, [pendingCoverPreviewUrl, pendingCoverLandscapePreviewUrl]);

  const clampPercent = useCallback((value) => Math.max(0, Math.min(100, Number(value) || 0)), []);
  const clampFramePosition = useCallback((value, defaultValue = 50) => {
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) ? numeric : Number(defaultValue);
    return Math.max(FRAME_POSITION_MIN, Math.min(FRAME_POSITION_MAX, safe));
  }, []);
  const clampZoom = useCallback((value) => Math.max(1, Math.min(4.875, Number(value) || 1)), []);
  const getFrameTranslate = useCallback((value) => {
    const centered = clampFramePosition(value, 50) - 50;
    return centered * CAMERA_PAN_MULTIPLIER;
  }, [clampFramePosition]);
  const buildFrameTransform = useCallback((position, zoomValue) => {
    const tx = getFrameTranslate(position?.x);
    const ty = getFrameTranslate(position?.y);
    return `translate(${tx}%, ${ty}%) scale(${clampZoom(zoomValue)})`;
  }, [getFrameTranslate, clampZoom]);

  const validateCoverFile = useCallback((nextFile) => {
    if (!String(nextFile?.type || '').startsWith('image/')) {
      emitNotice('Please select an image file.', 'error');
      return false;
    }
    if ((Number(nextFile?.size) || 0) > MAX_UPLOAD_BYTES) {
      emitNotice('Cover image must be 10 MB or less.', 'error');
      return false;
    }
    return true;
  }, [emitNotice]);

  const handleSelectCoverFile = useCallback((event) => {
    const nextFile = event?.target?.files?.[0];
    if (event?.target) {
      event.target.value = '';
    }
    if (!nextFile || !validateCoverFile(nextFile)) return;

    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }

    setPendingCoverFile(nextFile);
    setPendingCoverPreviewUrl(URL.createObjectURL(nextFile));
    setPendingCoverRemoval(false);
    setHasUnsavedChanges(true);
  }, [pendingCoverPreviewUrl, validateCoverFile]);

  const handleSelectLandscapeCoverFile = useCallback((event) => {
    const nextFile = event?.target?.files?.[0];
    if (event?.target) {
      event.target.value = '';
    }
    if (!nextFile || !validateCoverFile(nextFile)) return;

    if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
    }

    setPendingCoverLandscapeFile(nextFile);
    setPendingCoverLandscapePreviewUrl(URL.createObjectURL(nextFile));
    setPendingCoverLandscapeRemoval(false);
    setHasUnsavedChanges(true);
  }, [pendingCoverLandscapePreviewUrl, validateCoverFile]);

  const handleClearCover = useCallback(() => {
    setPendingCoverRemoval(true);
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
    setPendingCoverPreviewUrl('');
    setPendingCoverFile(null);
    setHasUnsavedChanges(true);
  }, [pendingCoverPreviewUrl]);

  const handleClearLandscapeCover = useCallback(() => {
    setPendingCoverLandscapeRemoval(true);
    if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
    }
    setPendingCoverLandscapePreviewUrl('');
    setPendingCoverLandscapeFile(null);
    setHasUnsavedChanges(true);
  }, [pendingCoverLandscapePreviewUrl]);

  const uploadCoverFile = useCallback(async (file) => {
    if (!file) return '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'covers');

    const response = await api.post('/api/v1/uploads/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    const uploadedUrl = String(response?.data?.url || '').trim();
    if (!uploadedUrl) {
      throw new Error('No cover URL returned from upload response');
    }

    return uploadedUrl;
  }, []);

  const handleSaveSettings = useCallback(async () => {
    if (!timelineId) return;

    try {
      setIsSaving(true);

      // Resolve portrait
      let resolvedPortraitUrl = pendingCoverRemoval ? '' : coverPortraitUrl;
      let newPortraitSize = null;
      if (pendingCoverRemoval) {
        resolvedPortraitUrl = '';
      } else if (pendingCoverFile) {
        resolvedPortraitUrl = await uploadCoverFile(pendingCoverFile);
        newPortraitSize = pendingCoverFile.size;
      }

      // Resolve landscape
      let resolvedLandscapeUrl = pendingCoverLandscapeRemoval ? '' : coverLandscapeUrl;
      let newLandscapeSize = null;
      if (pendingCoverLandscapeRemoval) {
        resolvedLandscapeUrl = '';
      } else if (pendingCoverLandscapeFile) {
        resolvedLandscapeUrl = await uploadCoverFile(pendingCoverLandscapeFile);
        newLandscapeSize = pendingCoverLandscapeFile.size;
      }

      // Build payload using _key fields (required by backend strict Zod schema)
      const payload = {
        description,
        cover_portrait_x: clampFramePosition(coverPortraitPosition?.x ?? 50, 50),
        cover_portrait_y: clampFramePosition(coverPortraitPosition?.y ?? 50, 50),
        cover_portrait_zoom: clampZoom(coverPortraitZoom ?? 1),
        cover_landscape_x: clampFramePosition(coverLandscapePosition?.x ?? 50, 50),
        cover_landscape_y: clampFramePosition(coverLandscapePosition?.y ?? 50, 50),
        cover_landscape_zoom: clampZoom(coverLandscapeZoom ?? 1),
      };

      if (resolvedPortraitUrl) {
        payload.cover_portrait_key = extractKeyFromUrl(resolvedPortraitUrl);
        if (newPortraitSize !== null) payload.cover_portrait_size = newPortraitSize;
      } else {
        payload.cover_portrait_key = null;
      }

      if (resolvedLandscapeUrl) {
        payload.cover_landscape_key = extractKeyFromUrl(resolvedLandscapeUrl);
        if (newLandscapeSize !== null) payload.cover_landscape_size = newLandscapeSize;
      } else {
        payload.cover_landscape_key = null;
      }

      const updatedTimeline = await updateTimelineDetails(timelineId, payload);

      const nextDescription = String(updatedTimeline?.description ?? description ?? '');
      const nextCoverPortraitUrl = String(updatedTimeline?.cover_portrait_image_url || resolvedPortraitUrl || '').trim();
      const nextCoverPortraitX = clampFramePosition(updatedTimeline?.cover_portrait_x ?? coverPortraitPosition?.x ?? 50, 50);
      const nextCoverPortraitY = clampFramePosition(updatedTimeline?.cover_portrait_y ?? coverPortraitPosition?.y ?? 50, 50);
      const nextCoverPortraitZoom = clampZoom(updatedTimeline?.cover_portrait_zoom ?? coverPortraitZoom ?? 1);

      const nextCoverLandscapeUrl = String(updatedTimeline?.cover_landscape_image_url || resolvedLandscapeUrl || '').trim();
      const nextCoverLandscapeX = clampFramePosition(updatedTimeline?.cover_landscape_x ?? coverLandscapePosition?.x ?? 50, 50);
      const nextCoverLandscapeY = clampFramePosition(updatedTimeline?.cover_landscape_y ?? coverLandscapePosition?.y ?? 50, 50);
      const nextCoverLandscapeZoom = clampZoom(updatedTimeline?.cover_landscape_zoom ?? coverLandscapeZoom ?? 1);

      setDescription(nextDescription);
      
      setCoverPortraitUrl(nextCoverPortraitUrl);
      setCoverPortraitPosition({ x: nextCoverPortraitX, y: nextCoverPortraitY });
      setCoverPortraitZoom(nextCoverPortraitZoom);
      setPendingCoverFile(null);
      setPendingCoverRemoval(false);

      setCoverLandscapeUrl(nextCoverLandscapeUrl);
      setCoverLandscapePosition({ x: nextCoverLandscapeX, y: nextCoverLandscapeY });
      setCoverLandscapeZoom(nextCoverLandscapeZoom);
      setPendingCoverLandscapeFile(null);
      setPendingCoverLandscapeRemoval(false);

      if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverPreviewUrl);
      }
      setPendingCoverPreviewUrl('');

      if (pendingCoverLandscapePreviewUrl && pendingCoverLandscapePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverLandscapePreviewUrl);
      }
      setPendingCoverLandscapePreviewUrl('');

      setHasUnsavedChanges(false);

      onSaved?.({
        description: nextDescription,
        coverPortraitUrl: nextCoverPortraitUrl,
        coverPortraitPosition: { x: nextCoverPortraitX, y: nextCoverPortraitY },
        coverPortraitZoom: nextCoverPortraitZoom,
        coverLandscapeUrl: nextCoverLandscapeUrl,
        coverLandscapePosition: { x: nextCoverLandscapeX, y: nextCoverLandscapeY },
        coverLandscapeZoom: nextCoverLandscapeZoom,
      });
      emitNotice('Hashtag settings saved.', 'success');
    } catch (error) {
      console.error('[HashtagSettingsDialog] Failed to save hashtag settings:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to save hashtag settings.';
      emitNotice(message, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [
    timelineId,
    pendingCoverRemoval,
    coverPortraitUrl,
    pendingCoverFile,
    pendingCoverLandscapeRemoval,
    coverLandscapeUrl,
    pendingCoverLandscapeFile,
    description,
    clampFramePosition,
    coverPortraitPosition,
    coverLandscapePosition,
    clampZoom,
    coverPortraitZoom,
    coverLandscapeZoom,
    pendingCoverPreviewUrl,
    pendingCoverLandscapePreviewUrl,
    onSaved,
    emitNotice,
  ]);

  const handleJoystickPointerDown = useCallback((event) => {
    if (!hasActivePreview) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    const targetPosition = activeFrameTarget === 'portrait' ? coverPortraitPosition : coverLandscapePosition;
    joystickDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: clampFramePosition(targetPosition?.x ?? 50, 50),
      startPositionY: clampFramePosition(targetPosition?.y ?? 50, 50),
    };
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }, [hasActivePreview, activeFrameTarget, coverPortraitPosition, coverLandscapePosition, clampFramePosition]);

  const handleJoystickPointerMove = useCallback((event) => {
    const drag = joystickDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.cancelable) {
      event.preventDefault();
    }

    const node = joystickRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const rawDeltaX = ((event.clientX - drag.startClientX) / width) * 100;
    const rawDeltaY = ((event.clientY - drag.startClientY) / height) * 100;

    const distance = Math.sqrt(rawDeltaX * rawDeltaX + rawDeltaY * rawDeltaY);
    const maxRadius = 40;
    let clampedDeltaX = rawDeltaX;
    let clampedDeltaY = rawDeltaY;
    if (distance > maxRadius) {
      clampedDeltaX = (rawDeltaX / distance) * maxRadius;
      clampedDeltaY = (rawDeltaY / distance) * maxRadius;
    }

    setJoystickKnobOffset({ x: clampedDeltaX, y: clampedDeltaY });

    const next = {
      x: clampFramePosition(drag.startPositionX + clampedDeltaX * JOYSTICK_SENSITIVITY, 50),
      y: clampFramePosition(drag.startPositionY + clampedDeltaY * JOYSTICK_SENSITIVITY, 50),
    };

    if (activeFrameTarget === 'portrait') {
      setCoverPortraitPosition(next);
    } else {
      setCoverLandscapePosition(next);
    }
    setHasUnsavedChanges(true);
  }, [activeFrameTarget, clampFramePosition]);

  const handleJoystickPointerUp = useCallback((event) => {
    if (event?.currentTarget?.releasePointerCapture && joystickDragRef.current?.pointerId !== undefined) {
      try {
        event.currentTarget.releasePointerCapture(joystickDragRef.current.pointerId);
      } catch (_) {}
    }
    joystickDragRef.current = null;
    setJoystickKnobOffset({ x: 0, y: 0 });
  }, []);

  const joystickKnobPosition = {
    x: 50 + joystickKnobOffset.x,
    y: 50 + joystickKnobOffset.y,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: getGlassDialogPaperSx(theme) }}
    >
      <DialogTitle>Hashtag Settings</DialogTitle>
      <DialogContent sx={{ '& .MuiTextField-root': getGlassInputSx(theme) }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage description, portrait cover card, and landscape timeline banner for #{timelineName || 'hashtag'}.
        </Typography>

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setHasUnsavedChanges(true);
            }}
          />

          <Box
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)',
              p: { xs: 2, md: 2.5 },
            }}
          >
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                variant={activeFrameTarget === 'portrait' ? 'contained' : 'outlined'}
                onClick={() => setActiveFrameTarget('portrait')}
                size="small"
              >
                Card Portrait Cover
              </Button>
              <Button
                variant={activeFrameTarget === 'landscape' ? 'contained' : 'outlined'}
                onClick={() => setActiveFrameTarget('landscape')}
                size="small"
              >
                Timeline Landscape Banner
              </Button>
            </Stack>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.3 }}>
              {activeFrameTarget === 'portrait' ? 'Portrait Card Cover' : 'Landscape Timeline Banner'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.6 }}>
              {activeFrameTarget === 'portrait' 
                ? 'Used for hashtag trading cards and search results.' 
                : 'Stretches across the top of your hashtag timeline view.'}
            </Typography>

            {activeFrameTarget === 'portrait' ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 260px) 1fr' }, gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700 }}>
                    Portrait Preview (1200 x 2100)
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <TradingCard
                      imageUrl={portraitPreviewUrl}
                      imageAlt={`${timelineName} portrait cover`}
                      label="HASHTAG"
                      title={`#${timelineName || 'hashtag'}`}
                      frameSx={{
                        width: { xs: 180, sm: 210 },
                        height: { xs: 266, sm: 310 },
                      }}
                      imageSx={{
                        objectFit: 'contain',
                        transform: buildFrameTransform(coverPortraitPosition, coverPortraitZoom),
                      }}
                      fallbackSx={{ background: fallbackGradient }}
                    />
                  </Box>
                </Box>

                <Stack spacing={1.5} justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                      Upload controls
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button variant="outlined" component="label" disabled={isSaving}>
                        Choose portrait
                        <input 
                          hidden 
                          accept="image/*" 
                          type="file" 
                          onChange={handleSelectCoverFile} 
                        />
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        onClick={handleClearCover}
                        disabled={isSaving || !(coverPortraitUrl || pendingCoverPreviewUrl || pendingCoverRemoval)}
                      >
                        Remove
                      </Button>
                    </Stack>
                    {pendingCoverFile && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Ready: {pendingCoverFile.name} ({(pendingCoverFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      p: 1.6,
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.2)',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.45)' : 'rgba(248,250,252,0.9)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Tip: keep the subject centered in the top half for best trading card framing.
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                      Framing controls
                    </Typography>
                    <Box
                      ref={joystickRef}
                      onPointerDown={handleJoystickPointerDown}
                      onPointerMove={handleJoystickPointerMove}
                      onPointerUp={handleJoystickPointerUp}
                      onPointerCancel={handleJoystickPointerUp}
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'relative',
                        mx: 'auto',
                        mb: 1.2,
                        touchAction: 'none',
                        cursor: hasActivePreview ? 'grab' : 'not-allowed',
                        opacity: hasActivePreview ? 1 : 0.5,
                        background: theme.palette.mode === 'dark'
                          ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 70%)'
                          : 'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.015) 70%)',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'text.secondary',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${joystickKnobPosition.x}%`,
                          top: `${joystickKnobPosition.y}%`,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          transform: 'translate(-50%, -50%)',
                          bgcolor: 'warning.main',
                          border: '2px solid rgba(255,255,255,0.9)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                        }}
                      />
                    </Box>

                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">Zoom</Typography>
                      <Slider
                        size="small"
                        value={coverPortraitZoom}
                        min={1}
                        max={4.875}
                        step={0.01}
                        disabled={!hasActivePreview}
                        onChange={(_, value) => {
                          const zoomValue = Array.isArray(value) ? value[0] : value;
                          setCoverPortraitZoom(clampZoom(zoomValue));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700 }}>
                    Live Banner Preview
                  </Typography>
                  <TimelineHeroBanner
                    timelineName={timelineName}
                    timelineType={timelineType}
                    coverImageUrl={landscapePreviewUrl}
                    coverLandscapeX={coverLandscapePosition?.x ?? 50}
                    coverLandscapeY={coverLandscapePosition?.y ?? 50}
                    coverZoom={coverLandscapeZoom ?? 1}
                    coverUploadEnabled
                    isLoading={false}
                    sx={{ mb: 0, mt: 0, minHeight: 0, width: '100%' }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3.5 }}>
                  <Stack spacing={2} justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                        Upload controls
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button variant="outlined" component="label" disabled={isSaving}>
                          Choose landscape
                          <input 
                            hidden 
                            accept="image/*" 
                            type="file" 
                            onChange={handleSelectLandscapeCoverFile} 
                          />
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          onClick={handleClearLandscapeCover}
                          disabled={isSaving || !(coverLandscapeUrl || pendingCoverLandscapePreviewUrl || pendingCoverLandscapeRemoval)}
                        >
                          Remove
                        </Button>
                      </Stack>
                      {pendingCoverLandscapeFile && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Ready: {pendingCoverLandscapeFile.name} ({(pendingCoverLandscapeFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        p: 1.6,
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.2)',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.45)' : 'rgba(248,250,252,0.9)',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Tip: drag the image with the joystick below to adjust the vertical/horizontal alignment of the banner.
                      </Typography>
                    </Box>
                  </Stack>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                      Framing controls
                    </Typography>
                    <Box
                      ref={joystickRef}
                      onPointerDown={handleJoystickPointerDown}
                      onPointerMove={handleJoystickPointerMove}
                      onPointerUp={handleJoystickPointerUp}
                      onPointerCancel={handleJoystickPointerUp}
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'relative',
                        mx: 'auto',
                        mb: 1.2,
                        touchAction: 'none',
                        cursor: hasActivePreview ? 'grab' : 'not-allowed',
                        opacity: hasActivePreview ? 1 : 0.5,
                        background: theme.palette.mode === 'dark'
                          ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 70%)'
                          : 'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.015) 70%)',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: 'text.secondary',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${joystickKnobPosition.x}%`,
                          top: `${joystickKnobPosition.y}%`,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          transform: 'translate(-50%, -50%)',
                          bgcolor: 'warning.main',
                          border: '2px solid rgba(255,255,255,0.9)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                        }}
                      />
                    </Box>

                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">Zoom</Typography>
                      <Slider
                        size="small"
                        value={coverLandscapeZoom}
                        min={1}
                        max={4.875}
                        step={0.01}
                        disabled={!hasActivePreview}
                        onChange={(_, value) => {
                          const zoomValue = Array.isArray(value) ? value[0] : value;
                          setCoverLandscapeZoom(clampZoom(zoomValue));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            ...getGlassSquareActionButtonSx(theme),
            width: 'auto',
            minWidth: 84,
            px: 2,
            borderRadius: 1.4,
          }}
        >
          Close
        </Button>
        <Button
          variant="outlined"
          onClick={handleSaveSettings}
          disabled={!hasUnsavedChanges || isSaving}
          sx={getGlassPillActionButtonSx(theme)}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HashtagSettingsDialog;
