import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  IconButton,
  Slider,
  useTheme,
} from '@mui/material';
import api, { updateTimelineDetails } from '../../utils/api';
import UserAvatar from '../common/UserAvatar';
import { displayUsername } from '../../utils/usernameDisplay';
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

const PersonalAccessPanel = ({
  open,
  onClose,
  user,
  allowedViewers,
  newViewerUsername,
  setNewViewerUsername,
  viewerError,
  onAddViewer,
  onRemoveViewer,
  timelineId,
  timelineDescription,
  setTimelineDescription,
  coverPortraitUrl,
  setCoverPortraitUrl,
  coverPortraitPosition,
  setCoverPortraitPosition,
  coverPortraitZoom,
  setCoverPortraitZoom,
  onNotify,
}) => {
  const theme = useTheme();
  const [pendingCoverFile, setPendingCoverFile] = useState(null);
  const [pendingCoverPreviewUrl, setPendingCoverPreviewUrl] = useState('');
  const [pendingCoverRemoval, setPendingCoverRemoval] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const joystickRef = useRef(null);
  const joystickDragRef = useRef(null);

  const portraitPreviewUrl = pendingCoverRemoval
    ? ''
    : (pendingCoverPreviewUrl || coverPortraitUrl);
  const hasPortraitPreview = Boolean(portraitPreviewUrl);
  const fallbackGradient = useMemo(
    () => buildCoverFallbackGradient(theme.palette.mode),
    [theme.palette.mode]
  );

  useEffect(() => () => {
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
  }, [pendingCoverPreviewUrl]);

  const emitNotice = useCallback((message, severity = 'info') => {
    if (onNotify) {
      onNotify({ message, severity });
    }
  }, [onNotify]);

  const validateCoverFile = useCallback((nextFile) => {
    if (!String(nextFile?.type || '').startsWith('image/')) {
      emitNotice('Please select an image file for the portrait cover.', 'error');
      return false;
    }
    if ((Number(nextFile?.size) || 0) > MAX_UPLOAD_BYTES) {
      emitNotice('Portrait cover must be 10 MB or less.', 'error');
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
  }, [timelineId]);

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
  }, [hasPortraitPreview, coverPortraitPosition, clampFramePosition]);

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
    const next = {
      x: clampFramePosition(drag.startPositionX + deltaXPercent, 50),
      y: clampFramePosition(drag.startPositionY + deltaYPercent, 50),
    };

    setCoverPortraitPosition(next);
    setHasUnsavedChanges(true);
  }, [clampFramePosition, setCoverPortraitPosition]);

  const handleJoystickPointerUp = useCallback((event) => {
    if (joystickDragRef.current?.pointerId === event.pointerId) {
      joystickDragRef.current = null;
    }
  }, []);

  const joystickKnobPosition = {
    x: clampPercent(((clampFramePosition(coverPortraitPosition?.x ?? 50, 50) - FRAME_POSITION_MIN) / (FRAME_POSITION_MAX - FRAME_POSITION_MIN)) * 100),
    y: clampPercent(((clampFramePosition(coverPortraitPosition?.y ?? 50, 50) - FRAME_POSITION_MIN) / (FRAME_POSITION_MAX - FRAME_POSITION_MIN)) * 100),
  };

  const handleSaveCover = useCallback(async () => {
    if (!timelineId) return;

    try {
      setIsUploadingCover(true);
      let resolvedUrl = pendingCoverRemoval ? '' : coverPortraitUrl;

      if (pendingCoverFile) {
        resolvedUrl = await uploadCoverFile(pendingCoverFile);
      }

      const updatedTimeline = await updateTimelineDetails(timelineId, {
        description: String(timelineDescription || ''),
        cover_portrait_image_url: resolvedUrl,
        cover_portrait_x: clampFramePosition(coverPortraitPosition?.x ?? 50, 50),
        cover_portrait_y: clampFramePosition(coverPortraitPosition?.y ?? 50, 50),
        cover_portrait_zoom: clampZoom(coverPortraitZoom ?? 1),
      });

      const nextDescription = String(updatedTimeline?.description ?? timelineDescription ?? '');
      setTimelineDescription(nextDescription);

      setCoverPortraitUrl(resolvedUrl);
      setPendingCoverFile(null);
      setPendingCoverRemoval(false);
      if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingCoverPreviewUrl);
      }
      setPendingCoverPreviewUrl('');
      setHasUnsavedChanges(false);
      emitNotice('Personal timeline settings saved.', 'success');
    } catch (error) {
      console.error('[PersonalAccessPanel] Failed to save portrait cover:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to save portrait cover.';
      emitNotice(message, 'error');
    } finally {
      setIsUploadingCover(false);
    }
  }, [
    timelineId,
    pendingCoverFile,
    pendingCoverRemoval,
    coverPortraitUrl,
    uploadCoverFile,
    coverPortraitPosition,
    coverPortraitZoom,
    timelineDescription,
    clampFramePosition,
    clampZoom,
    pendingCoverPreviewUrl,
    emitNotice,
    setTimelineDescription,
    setCoverPortraitUrl,
  ]);

  const handleClearCover = useCallback(() => {
    setPendingCoverRemoval(true);
    if (pendingCoverPreviewUrl && pendingCoverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
    setPendingCoverPreviewUrl('');
    setPendingCoverFile(null);
    setHasUnsavedChanges(true);
  }, [pendingCoverPreviewUrl]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...getGlassDialogPaperSx(theme),
          minHeight: { xs: '82vh', md: '70vh' },
        },
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>Access Panel</DialogTitle>
      <DialogContent
        sx={{
          pt: 2,
          '& .MuiTextField-root': getGlassInputSx(theme),
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Control who can see this personal timeline, plus set a portrait cover for the trading card.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            alignItems: 'stretch',
          }}
        >
          <Stack
            spacing={2.5}
            sx={{
              width: { xs: '100%', md: 280 },
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                borderRadius: 2.4,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(148,163,184,0.28)'
                  : 'rgba(15,23,42,0.12)',
                p: 2,
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(15,23,42,0.55)'
                  : 'rgba(255,255,255,0.8)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 10px 24px rgba(2,6,23,0.35)'
                  : '0 10px 20px rgba(15,23,42,0.08)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                Allowed viewers
              </Typography>
              <Stack spacing={1.5} sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <UserAvatar
                    name={user?.username || 'You'}
                    avatarUrl={user?.avatar_url}
                    id={user?.id}
                    size={32}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.06)',
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      @{displayUsername(user?.username) || 'you'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <span style={{ transform: 'rotate(-20deg)', display: 'inline-block' }}>
                        ↪
                      </span>
                      You (creator)
                    </Typography>
                  </Box>
                </Stack>

                {allowedViewers.map((viewer) => (
                  <Stack
                    key={viewer.id || viewer.username}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.015)',
                    }}
                  >
                    <UserAvatar
                      name={viewer.username || 'User'}
                      avatarUrl={viewer.avatarUrl}
                      id={viewer.id}
                      size={28}
                      sx={{
                        bgcolor: theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.04)',
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">@{displayUsername(viewer.username)}</Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveViewer(viewer.id)}
                    >
                      ×
                    </IconButton>
                  </Stack>
                ))}

                {allowedViewers.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Only you can currently see this personal timeline.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box
              sx={{
                borderRadius: 2.4,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(148,163,184,0.24)'
                  : 'rgba(15,23,42,0.1)',
                p: 2,
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(15,23,42,0.4)'
                  : 'rgba(255,255,255,0.74)',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Grant access
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a username"
                  value={newViewerUsername}
                  onChange={(event) => setNewViewerUsername(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onAddViewer();
                    }
                  }}
                />
                <Button variant="contained" onClick={onAddViewer}>
                  Add
                </Button>
              </Stack>
              {viewerError && (
                <Typography variant="body2" color="error">
                  {viewerError}
                </Typography>
              )}
            </Box>
          </Stack>

          <Box
            sx={{
              flex: 1,
              borderRadius: 3,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(148,163,184,0.3)'
                : 'rgba(15,23,42,0.12)',
              p: { xs: 2, md: 3 },
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(15,23,42,0.5)'
                : 'rgba(255,255,255,0.85)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 16px 32px rgba(2,6,23,0.35)'
                : '0 12px 24px rgba(15,23,42,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Timeline Description
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.2 }}>
                This appears in places like your Favorite tab when a custom quote is not set.
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Description"
                value={timelineDescription}
                onChange={(event) => {
                  setTimelineDescription(event.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Portrait Cover
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Used for trading cards and sharing previews. Portrait only for personal timelines.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 260px) 1fr' },
                gap: 2.5,
                alignItems: 'stretch',
              }}
            >
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
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(148,163,184,0.35)'
                      : 'rgba(15,23,42,0.15)',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(15,23,42,0.6)'
                      : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {hasPortraitPreview ? (
                    <Box
                      component="img"
                      src={portraitPreviewUrl}
                      alt="Portrait cover preview"
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
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: fallbackGradient,
                      }}
                    />
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

              <Stack spacing={1.5} justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                    Upload controls
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button variant="outlined" component="label" disabled={isUploadingCover}>
                      Choose portrait
                      <input hidden accept="image/*" type="file" onChange={handleSelectCoverFile} />
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      onClick={handleClearCover}
                      disabled={isUploadingCover || !(coverPortraitUrl || pendingCoverPreviewUrl || pendingCoverRemoval)}
                    >
                      Remove
                    </Button>
                  </Stack>
                  {pendingCoverFile ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Ready: {pendingCoverFile.name} ({(pendingCoverFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </Typography>
                  ) : null}
                </Box>

                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(148,163,184,0.35)'
                      : 'rgba(15,23,42,0.2)',
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(15,23,42,0.45)'
                      : 'rgba(248,250,252,0.9)',
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
                  <Stack spacing={0.5}>
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
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
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
          onClick={handleSaveCover}
          disabled={!hasUnsavedChanges || isUploadingCover}
          sx={getGlassPillActionButtonSx(theme)}
        >
          {isUploadingCover ? 'Saving...' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonalAccessPanel;
