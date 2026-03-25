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

const HashtagSettingsDialog = ({
  open,
  onClose,
  timelineId,
  timelineName,
  initialDescription,
  initialCoverPortraitUrl,
  initialCoverPortraitPosition,
  initialCoverPortraitZoom,
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
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const joystickRef = useRef(null);
  const joystickDragRef = useRef(null);

  const portraitPreviewUrl = pendingCoverRemoval
    ? ''
    : (pendingCoverPreviewUrl || coverPortraitUrl);
  const hasPortraitPreview = Boolean(portraitPreviewUrl);
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
    setPendingCoverFile(null);
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
    setPendingCoverPreviewUrl('');
    setPendingCoverRemoval(false);
    setHasUnsavedChanges(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    initialDescription,
    initialCoverPortraitUrl,
    initialCoverPortraitPosition?.x,
    initialCoverPortraitPosition?.y,
    initialCoverPortraitZoom,
  ]);

  useEffect(() => () => {
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
  }, [pendingCoverPreviewUrl]);

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
      emitNotice('Please select an image file for the hashtag portrait cover.', 'error');
      return false;
    }
    if ((Number(nextFile?.size) || 0) > MAX_UPLOAD_BYTES) {
      emitNotice('Hashtag portrait cover must be 10 MB or less.', 'error');
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

  const handleClearCover = useCallback(() => {
    setPendingCoverRemoval(true);
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
    setPendingCoverPreviewUrl('');
    setPendingCoverFile(null);
    setHasUnsavedChanges(true);
  }, [pendingCoverPreviewUrl]);

  const uploadCoverFile = useCallback(async (file) => {
    if (!file) return '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_kind', 'timeline_cover_portrait');
    formData.append('timeline_id', String(timelineId));

    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    const uploadedUrl = String(response?.data?.url || '').trim();
    if (!uploadedUrl) {
      throw new Error('No cover URL returned from upload response');
    }

    return uploadedUrl;
  }, [timelineId]);

  const handleSaveSettings = useCallback(async () => {
    if (!timelineId) return;

    try {
      setIsSaving(true);

      let resolvedUrl = pendingCoverRemoval ? '' : coverPortraitUrl;
      if (pendingCoverFile) {
        resolvedUrl = await uploadCoverFile(pendingCoverFile);
      }

      const updatedTimeline = await updateTimelineDetails(timelineId, {
        description,
        cover_portrait_image_url: resolvedUrl,
        cover_portrait_x: clampFramePosition(coverPortraitPosition?.x ?? 50, 50),
        cover_portrait_y: clampFramePosition(coverPortraitPosition?.y ?? 50, 50),
        cover_portrait_zoom: clampZoom(coverPortraitZoom ?? 1),
      });

      const nextDescription = String(updatedTimeline?.description ?? description ?? '');
      const nextCoverPortraitUrl = String(updatedTimeline?.cover_portrait_image_url || resolvedUrl || '').trim();
      const nextCoverPortraitX = clampFramePosition(updatedTimeline?.cover_portrait_x ?? coverPortraitPosition?.x ?? 50, 50);
      const nextCoverPortraitY = clampFramePosition(updatedTimeline?.cover_portrait_y ?? coverPortraitPosition?.y ?? 50, 50);
      const nextCoverPortraitZoom = clampZoom(updatedTimeline?.cover_portrait_zoom ?? coverPortraitZoom ?? 1);

      setDescription(nextDescription);
      setCoverPortraitUrl(nextCoverPortraitUrl);
      setCoverPortraitPosition({ x: nextCoverPortraitX, y: nextCoverPortraitY });
      setCoverPortraitZoom(nextCoverPortraitZoom);
      setPendingCoverFile(null);
      setPendingCoverRemoval(false);
      if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverPreviewUrl);
      }
      setPendingCoverPreviewUrl('');
      setHasUnsavedChanges(false);

      onSaved?.({
        description: nextDescription,
        coverPortraitUrl: nextCoverPortraitUrl,
        coverPortraitPosition: { x: nextCoverPortraitX, y: nextCoverPortraitY },
        coverPortraitZoom: nextCoverPortraitZoom,
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
    uploadCoverFile,
    description,
    clampFramePosition,
    coverPortraitPosition,
    clampZoom,
    coverPortraitZoom,
    pendingCoverPreviewUrl,
    onSaved,
    emitNotice,
  ]);

  const handleJoystickPointerDown = useCallback((event) => {
    if (!hasPortraitPreview) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    joystickDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: clampFramePosition(coverPortraitPosition?.x ?? 50, 50),
      startPositionY: clampFramePosition(coverPortraitPosition?.y ?? 50, 50),
    };
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }, [hasPortraitPreview, clampFramePosition, coverPortraitPosition]);

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

    const deltaXPercent = ((event.clientX - drag.startClientX) / width) * 100 * JOYSTICK_SENSITIVITY;
    const deltaYPercent = ((event.clientY - drag.startClientY) / height) * 100 * JOYSTICK_SENSITIVITY;

    setCoverPortraitPosition({
      x: clampFramePosition(drag.startPositionX + deltaXPercent, 50),
      y: clampFramePosition(drag.startPositionY + deltaYPercent, 50),
    });
    setHasUnsavedChanges(true);
  }, [clampFramePosition]);

  const handleJoystickPointerUp = useCallback((event) => {
    if (joystickDragRef.current?.pointerId === event.pointerId) {
      joystickDragRef.current = null;
    }
  }, []);

  const joystickKnobPosition = {
    x: clampPercent(((clampFramePosition(coverPortraitPosition?.x ?? 50, 50) - FRAME_POSITION_MIN) / (FRAME_POSITION_MAX - FRAME_POSITION_MIN)) * 100),
    y: clampPercent(((clampFramePosition(coverPortraitPosition?.y ?? 50, 50) - FRAME_POSITION_MIN) / (FRAME_POSITION_MAX - FRAME_POSITION_MIN)) * 100),
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
          Manage description and portrait cover for #{timelineName || 'hashtag'} trading/share cards.
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
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.3 }}>
              Portrait Cover
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.6 }}>
              Used for hashtag trading cards and share previews.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.8, fontWeight: 700 }}>
                  Preview (1200 x 2100)
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '4 / 7',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.15)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {hasPortraitPreview ? (
                    <Box
                      component="img"
                      src={portraitPreviewUrl}
                      alt="Hashtag portrait cover preview"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: '50% 50%',
                        transform: buildFrameTransform(coverPortraitPosition, coverPortraitZoom),
                      }}
                    />
                  ) : (
                    <Box sx={{ position: 'absolute', inset: 0, background: fallbackGradient }} />
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.45) 100%)',
                    }}
                  />
                </Box>
              </Box>

              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" component="label" disabled={isSaving}>
                    Choose portrait
                    <input hidden accept="image/*" type="file" onChange={handleSelectCoverFile} />
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
                    touchAction: 'none',
                    cursor: hasPortraitPreview ? 'grab' : 'not-allowed',
                    opacity: hasPortraitPreview ? 1 : 0.5,
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

                <Box>
                  <Typography variant="caption" color="text.secondary">Zoom</Typography>
                  <Slider
                    size="small"
                    value={coverPortraitZoom}
                    min={1}
                    max={4.875}
                    step={0.01}
                    disabled={!hasPortraitPreview}
                    onChange={(_, value) => {
                      const zoomValue = Array.isArray(value) ? value[0] : value;
                      setCoverPortraitZoom(clampZoom(zoomValue));
                      setHasUnsavedChanges(true);
                    }}
                  />
                </Box>
              </Stack>
            </Box>
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
