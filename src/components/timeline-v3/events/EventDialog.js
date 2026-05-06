import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  TextField,
  Stack,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  useTheme,
  InputAdornment,
  Chip,
  Tooltip,
  Popper,
  Paper,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Comment as RemarkIcon,
  Newspaper as NewsIcon,
  PermMedia as MediaIcon,
  Link as LinkIcon,
  EventOutlined as EventOutlinedIcon,
  Close as CloseIcon,
  Add as AddIcon,
  LockOutlined as LockOutlinedIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  People as CommunityIcon,
} from '@mui/icons-material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import api from '../../../utils/api';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import HashtagIcon from '../../common/HashtagIcon';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassSquareActionButtonSx,
  getGlassPillActionButtonSx,
} from '../../../utils/formStyleGuide';
import { alpha } from '@mui/material/styles';

const EVENT_TITLE_MAX_LENGTH = 120;

const RichEditor = ({
  value,
  onChange,
  disabled,
  readOnly = false,
  label = 'Description',
  helperText = 'Use @ # i- www. or ~123 to add mentions, links, and event references',
  rows = 3,
  inputSx,
}) => {
  const [indicator, setIndicator] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const textFieldRef = React.useRef(null);

  const detectMention = (text, pos) => {
    const beforeCursor = text.substring(0, pos);

    const atMatch = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (atMatch) {
      return { type: 'user', label: 'Tagging', partial: atMatch[1], color: 'rgba(33, 150, 243, 0.15)' };
    }

    const hashMatch = beforeCursor.match(/#([a-zA-Z0-9_]*)$/);
    if (hashMatch) {
      return { type: 'hashtag', label: 'Hashtag', partial: hashMatch[1], color: 'rgba(76, 175, 80, 0.15)' };
    }

    const commMatch = beforeCursor.match(/i-([a-zA-Z0-9_]*)$/);
    if (commMatch) {
      return { type: 'community', label: 'Community', partial: commMatch[1], color: 'rgba(156, 39, 176, 0.15)' };
    }

    const wwwMatch = beforeCursor.match(/www\.([a-zA-Z0-9._-]*)$/);
    if (wwwMatch) {
      return { type: 'url', label: 'URL', partial: wwwMatch[1], color: 'rgba(255, 152, 0, 0.15)' };
    }

    const eventRefMatch = beforeCursor.match(/~([0-9]*)$/);
    if (eventRefMatch) {
      return { type: 'event', label: 'Event', partial: eventRefMatch[1], color: 'rgba(103, 58, 183, 0.15)' };
    }

    return null;
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;

    onChange(newValue);

    const mention = detectMention(newValue, newCursorPos);
    if (mention) {
      setIndicator(mention);
      setAnchorEl(textFieldRef.current);
    } else {
      setIndicator(null);
      setAnchorEl(null);
    }
  };

  const getIndicatorIcon = () => {
    if (!indicator) return null;
    switch (indicator.type) {
      case 'user':
        return <PersonIcon fontSize="small" />;
      case 'hashtag':
        return <HashtagIcon fontSize="small" />;
      case 'community':
        return <CommunityIcon fontSize="small" />;
      case 'link':
      case 'url':
        return <LinkIcon fontSize="small" />;
      case 'event':
        return <EventOutlinedIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getIndicatorText = () => {
    if (!indicator) return '';
    const text = indicator.partial ? ` ${indicator.partial}` : '';
    return `${indicator.label}${text}`;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        ref={textFieldRef}
        fullWidth
        multiline
        rows={rows}
        label={label}
        value={value}
        onChange={handleChange}
        helperText={helperText}
        disabled={disabled}
        InputProps={{ readOnly }}
        sx={inputSx}
      />

      <Popper
        open={Boolean(indicator && anchorEl)}
        anchorEl={anchorEl}
        placement="right-start"
        modifiers={[{ name: 'offset', options: { offset: [12, 0] } }]}
        style={{ zIndex: 1300 }}
      >
        <Paper
          sx={{
            mt: 1,
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: indicator?.color,
            border: '1px solid',
            borderColor: 'divider',
            pointerEvents: 'none'
          }}
        >
          {getIndicatorIcon()}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {getIndicatorText()}
          </Typography>
        </Paper>
      </Popper>
    </Box>
  );
};

const EventDialog = ({
  open,
  onClose,
  onSave,
  initialEvent = null,
  timelineName,
  timelineType,
  timelineVisibility,
  mode = 'create',
  initialType = EVENT_TYPES.REMARK,
  submitLabel,
  showVerdictField = false,
  verdict = '',
  onVerdictChange,
  submitLoading = false,
  submitDisabled = false,
}) => {
  const theme = useTheme();
  const isEditing = Boolean(initialEvent);
  const editPermissions = initialEvent?.edit_permissions || null;
  console.log('[EventDialog] initialEvent?.edit_permissions:', initialEvent?.edit_permissions);
  const allowedFields = Array.isArray(editPermissions?.allowed_fields)
    ? new Set(editPermissions.allowed_fields)
    : null;
  console.log('[EventDialog] allowedFields:', allowedFields);
  const canEditField = (field) => {
    if (!isEditing) return true;
    if (!editPermissions || !allowedFields) return true;
    return allowedFields.has(field);
  };
  const descriptionAppendOnly = isEditing && editPermissions?.description_mode === 'append_only';
  const canEditTitle = canEditField('title');
  const canEditDescription = canEditField('description');
  const canEditDate = canEditField('event_date');
  const canEditType = canEditField('type');
  const canEditMedia = canEditField('media');
  const canEditTags = canEditField('tags');
  const canEditUrl = canEditField('url') || canEditField('url_metadata');
  const isTierAEditor = isEditing && editPermissions?.tier === 'A';
  const canAddTags = !isEditing || canEditTags;
  const canRemoveTags = canAddTags && (!isEditing || editPermissions?.tier !== 'C');

  const [eventType, setEventType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAppend, setDescriptionAppend] = useState('');
  const [existingEditsText, setExistingEditsText] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [url, setUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaUploadResult, setMediaUploadResult] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState(null);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [initialTagKeys, setInitialTagKeys] = useState([]);
  const [associatedTimelineChips, setAssociatedTimelineChips] = useState([]);
  const [creatorTimelineChip, setCreatorTimelineChip] = useState(null);
  const [removeAssociationIds, setRemoveAssociationIds] = useState([]);
  const clampTitle = (value) => String(value || '').slice(0, EVENT_TITLE_MAX_LENGTH);
  const isPersonalTimeline = String(timelineType || '').toLowerCase() === 'personal'
    || (typeof timelineName === 'string' && timelineName.startsWith('My-'));

  const normalizeTimelineType = (rawType) => {
    const normalizedType = String(rawType || '').trim().toLowerCase();
    if (normalizedType === 'community' || normalizedType === 'personal' || normalizedType === 'hashtag') {
      return normalizedType;
    }
    return '';
  };

  const normalizeTags = (rawTags = []) => rawTags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      if (tag && typeof tag === 'object') {
        return tag.name || tag.label || tag.tag || '';
      }
      return '';
    })
    .map((tag) => String(tag || '').replace(/^#+/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((tag) => Boolean(tag));

  const toCanonicalTagKey = (value) => String(value || '')
    .replace(/^#+/, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const buildCanonicalTagKeys = (values = []) => Array.from(new Set(
    values
      .map((tag) => toCanonicalTagKey(tag))
      .filter(Boolean)
  )).sort();

  useEffect(() => {
    if (initialEvent) {
      setEventType(initialEvent.type || EVENT_TYPES.REMARK);
      setTitle(clampTitle(initialEvent.title || ''));
      const incomingDescription = String(initialEvent.description || '');
      const marker = '\n\n---\nEdits made\n';
      const markerIndex = incomingDescription.indexOf(marker);
      if (descriptionAppendOnly && markerIndex >= 0) {
        setDescription(incomingDescription.slice(0, markerIndex));
        setExistingEditsText(incomingDescription.slice(markerIndex + marker.length).trim());
      } else {
        setDescription(incomingDescription);
        setExistingEditsText('');
      }
      setDescriptionAppend('');
      setEventDate(initialEvent.event_date ? new Date(initialEvent.event_date) : new Date());
      setUrl(initialEvent.url || '');
      const normalizedInitialTags = normalizeTags(initialEvent.tags || []);
      setTags(normalizedInitialTags);
      setInitialTagKeys(buildCanonicalTagKeys(normalizedInitialTags));
      setMediaPreview(initialEvent.media_url || '');
      setMediaFile(null);
      setMediaUploadResult(null);
      setMediaUploadError(null);
      const sourceAssociations = [];
      const associationTypeById = new Map();
      const associationTypeByName = new Map();

      const registerAssociationType = (item, hintType = '') => {
        const timelineId = Number(item?.id || item?.timeline_id || 0);
        const timelineName = String(item?.name || item?.timeline_name || '').trim();
        const resolvedType = normalizeTimelineType(item?.type || item?.timeline_type)
          || normalizeTimelineType(hintType);

        if (!resolvedType) return;

        if (timelineId && !associationTypeById.has(timelineId)) {
          associationTypeById.set(timelineId, resolvedType);
        }

        if (timelineName) {
          const nameKey = timelineName.toLowerCase();
          const existing = associationTypeByName.get(nameKey);
          if (!existing || existing === 'hashtag') {
            associationTypeByName.set(nameKey, resolvedType);
          }
        }
      };

      const pushAssociations = (items, hintType = '') => {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
          sourceAssociations.push({ ...item, __hintType: hintType });
          registerAssociationType(item, hintType);
        });
      };

      pushAssociations(initialEvent.associated_timelines);
      pushAssociations(initialEvent.associatedTimelines);
      pushAssociations(initialEvent.referenced_in);
      pushAssociations(initialEvent.communities, 'community');
      pushAssociations(initialEvent.personals, 'personal');

      const resolveAssociation = (timeline) => {
        const timelineId = Number(timeline?.id || timeline?.timeline_id || 0);
        const timelineName = String(timeline?.name || timeline?.timeline_name || '').trim();
        let resolvedType = normalizeTimelineType(timeline?.type || timeline?.timeline_type)
          || normalizeTimelineType(timeline?.__hintType);
        if (!resolvedType && timelineId) {
          resolvedType = associationTypeById.get(timelineId) || '';
        }
        if (!resolvedType && timelineName) {
          resolvedType = associationTypeByName.get(timelineName.toLowerCase()) || '';
        }

        return {
          id: timelineId,
          name: timelineName,
          type: resolvedType || 'hashtag',
        };
      };

      const ownerTimelineId = Number(initialEvent.timeline_id || 0);
      const ownerTimeline = sourceAssociations
        .map(resolveAssociation)
        .find((timeline) => timeline.id === ownerTimelineId && timeline.name);
      setCreatorTimelineChip(ownerTimeline || null);

      const visibleAssociations = sourceAssociations
        .map(resolveAssociation)
        .filter((timeline) => timeline.id && timeline.name)
        .filter((timeline) => timeline.id !== ownerTimelineId)
        .filter((timeline) => timeline.type !== 'hashtag')
        .filter((timeline, index, arr) => arr.findIndex((candidate) => candidate.id === timeline.id) === index);
      setAssociatedTimelineChips(visibleAssociations);
      setRemoveAssociationIds([]);
      if (initialEvent.url) {
        setUrlPreview({
          title: initialEvent.url_title || '',
          description: initialEvent.url_description || '',
          image: initialEvent.url_image || '',
          source: initialEvent.url_source || ''
        });
      } else {
        setUrlPreview(null);
      }
    } else {
      resetForm();
      if (initialType) {
        setEventType(initialType);
      }
    }
  }, [initialEvent, initialType]);

  useEffect(() => {
    const fetchUrlPreview = async () => {
      if (!url || eventType !== EVENT_TYPES.NEWS) return;

      try {
        setIsLoadingPreview(true);
        const response = await api.post('/api/v1/url-preview', { url });
        setUrlPreview(response.data);

        // Auto-fill title if empty and URL preview has a title
        if (!title && response.data.title) {
          setTitle(clampTitle(response.data.title));
        }
      } catch (error) {
        console.error('Error fetching URL preview:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    // Add a small delay to prevent excessive API calls while typing
    const timeoutId = setTimeout(() => {
      fetchUrlPreview();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [url, eventType, title]);

  const resetForm = () => {
    setEventType(EVENT_TYPES.REMARK);
    setTitle('');
    setDescription('');
    setEventDate(new Date());
    setUrl('');
    setMediaFile(null);
    setMediaPreview('');
    setTags([]);
    setCurrentTag('');
    setInitialTagKeys([]);
    setUrlPreview(null);
    setDescriptionAppend('');
    setExistingEditsText('');
    setAssociatedTimelineChips([]);
    setCreatorTimelineChip(null);
    setRemoveAssociationIds([]);
  };

  const handleTypeChange = (event, newType) => {
    if (!canEditType) return;
    if (newType !== null) {
      setEventType(newType);
    }
  };

  // Auto-add a default hashtag tag based on the current timeline for new events
  useEffect(() => {
    if (!open) return;
    if (initialEvent) return;
    if (!timelineName || typeof timelineName !== 'string') return;
    if (tags.length > 0) return;

    let baseName = timelineName.trim();
    if (!baseName) return;

    const type = (timelineType || 'hashtag').toLowerCase();
    const visibility = (timelineVisibility || 'public').toLowerCase();

    // Do not auto-add any tag for personal timelines
    if (type === 'personal') {
      return;
    }

    // V3 Enhancement: If community is private, do NOT auto-add the hashtag counterpart
    if (type === 'community' && visibility === 'private') {
      console.log('[EventDialog] Private community detected, skipping auto-# tag seeding');
      return;
    }

    // For community timelines, strip leading i- when deriving the base hashtag name
    if (type === 'community') {
      const lower = baseName.toLowerCase();
      if (lower.startsWith('i-')) {
        baseName = baseName.slice(2);
      }
    }

    // Store the bare name (no leading #) in the tags array so it behaves like
    // user-entered tags (e.g. "test"), and let downstream rendering normalize
    // how hashtag chips are displayed.
    baseName = baseName.replace(/^#+/, '');

    console.log('[EventDialog] Auto-seeding tag:', baseName);
    setTags([baseName]);
  }, [open, initialEvent, timelineName, timelineType]);

  const handleMediaChange = async (event) => {
    if (!canEditMedia) return;
    const file = event.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaUploadError(null);

      // Create preview for UI
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to backend immediately
      await uploadMediaFile(file);
    }
  };

  const uploadMediaFile = async (file) => {
    setMediaUploading(true);
    setMediaUploadError(null);

    try {
      // Determine media subtype from file MIME
      let mediaSubtype = 'other';
      if (file.type.startsWith('image/')) {
        mediaSubtype = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaSubtype = 'video';
      } else if (file.type.startsWith('audio/')) {
        mediaSubtype = 'audio';
      }

      const formData = new FormData();
      formData.append('file', file);
      // Map media type to upload purpose
      const purpose = mediaSubtype === 'audio' ? 'music' : 'events';
      formData.append('purpose', purpose);

      const response = await api.post('/api/v1/uploads/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      console.log('EventDialog: Media upload successful:', response.data);

      // Store upload result with all metadata
      setMediaUploadResult({
        url: response.data.url,
        cloudinary_id: response.data.key, // Map R2 key to expected cloudinary_id field
        media_type: mediaSubtype === 'other' ? null : mediaSubtype,
        media_subtype: file.type
      });
    } catch (error) {
      console.error('EventDialog: Media upload failed:', error);
      setMediaUploadError(error.response?.data?.error || 'Upload failed');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleAddTag = () => {
    if (isPersonalTimeline || !canAddTags) {
      setCurrentTag('');
      return;
    }

    const normalizedTag = String(currentTag || '')
      .replace(/^#+/, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalizedTag) {
      setCurrentTag('');
      return;
    }

    // V3 Enhancement: Ban '-' and '#' from tag names
    if (normalizedTag.includes('-') || normalizedTag.includes('#')) {
      alert('Tags cannot contain "-" or "#" characters.');
      return;
    }

    // Ban 'i-' and 'My-' style inputs from being treated as hashtags
    const lowerTag = normalizedTag.toLowerCase();
    if (lowerTag.startsWith('i-') || lowerTag.startsWith('my-')) {
      alert('Tags cannot start with "i-" or "My-".');
      return;
    }

    if (!tags.some((tag) => String(tag).toLowerCase() === normalizedTag.toLowerCase())) {
      console.log('[EventDialog] Adding tag:', normalizedTag, 'Current tags:', tags);
      setTags([...tags, normalizedTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!canRemoveTags) return;
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleRemoveAssociatedTimeline = (timelineIdToRemove) => {
    if (!canRemoveTags) return;
    const targetTimeline = associatedTimelineChips.find((timeline) => timeline.id === timelineIdToRemove);
    if (targetTimeline?.type === 'personal' && !isTierAEditor) {
      return;
    }
    setAssociatedTimelineChips((prev) => prev.filter((timeline) => timeline.id !== timelineIdToRemove));
    setRemoveAssociationIds((prev) => (prev.includes(timelineIdToRemove) ? prev : [...prev, timelineIdToRemove]));
  };

  const handleSave = () => {
    if (!isEditing && !title.trim()) {
      // Show error or validation message
      return;
    }

    // Format the date directly from the components
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth() + 1; // Month is 0-indexed in JS
    const day = eventDate.getDate();
    const hours = eventDate.getHours();
    const minutes = eventDate.getMinutes();

    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format for display
    const displayHours = hours % 12;
    const displayHoursFormatted = displayHours ? displayHours : 12; // Convert 0 to 12

    // Create the raw date string in the format: MM.DD.YYYY.HH.MM.AMPM
    const rawDateString = `${month}.${day}.${year}.${displayHoursFormatted}.${String(minutes).padStart(2, '0')}.${ampm}`;

    console.log('===== EVENT SAVE DEBUG =====');
    console.log('Event date object:', eventDate);
    console.log('Created raw date string:', rawDateString);
    console.log('============================');

    const eventData = {};
    console.log('[EventDialog] Building eventData:', { isEditing, canEditDescription, canEditType, canEditDate, descriptionAppendOnly, descriptionAppend: descriptionAppend?.substring(0, 50) });

    if (!isEditing || canEditTitle) {
      eventData.title = title;
    }

    if (!isEditing || canEditType) {
      eventData.type = eventType;
    }

    if (!isEditing || canEditDate) {
      eventData.event_date = eventDate.toISOString();
      eventData.raw_event_date = rawDateString;
      eventData.is_exact_user_time = true;
    }

    if (!isEditing || canEditDescription) {
      console.log('[EventDialog] Adding description field, descriptionAppendOnly:', descriptionAppendOnly);
      if (descriptionAppendOnly) {
        eventData.description_append = descriptionAppend;
        console.log('[EventDialog] Set description_append:', descriptionAppend?.substring(0, 50));
      } else {
        eventData.description = description;
      }
    }

    if ((!isEditing || canEditUrl) && eventType === EVENT_TYPES.NEWS && (urlPreview || url)) {
      eventData.url = url;
      eventData.url_title = urlPreview?.title || initialEvent?.url_title || '';
      eventData.url_description = urlPreview?.description || initialEvent?.url_description || '';
      eventData.url_image = urlPreview?.image || initialEvent?.url_image || '';
      eventData.url_source = urlPreview?.source || initialEvent?.url_source || '';
    }

    if ((!isEditing || canEditMedia) && eventType === EVENT_TYPES.MEDIA && mediaUploadResult) {
      eventData.media_url = mediaUploadResult.url;
      eventData.media_type = mediaUploadResult.media_type;
      eventData.media_subtype = mediaUploadResult.media_subtype;
      eventData.cloudinary_id = mediaUploadResult.cloudinary_id;
    } else if (!isEditing && eventType === EVENT_TYPES.MEDIA && !mediaUploadResult) {
      // Prevent submission if media type selected but no upload completed
      console.error('EventDialog: Media event requires uploaded media');
      return;
    }

    console.log('[EventDialog] Saving event with tags:', tags);
    if (isEditing && canAddTags) {
      const currentTagKeys = buildCanonicalTagKeys(tags);
      const tagsChangedFromInitial = currentTagKeys.join('|') !== initialTagKeys.join('|');
      const isTierCEditor = editPermissions?.tier === 'C';

      if (!isTierCEditor || tagsChangedFromInitial) {
        eventData.tags = tags;
      }

      if (canRemoveTags && removeAssociationIds.length > 0) {
        eventData.remove_association_ids = removeAssociationIds;
      }
    } else if (!isEditing && tags.length > 0) {
      eventData.tags = tags;
    }

    console.log('[EventDialog] Final eventData:', eventData);
    onSave(eventData);
  };

  const getTypeColor = () => {
    // Make sure we have a valid event type
    const safeEventType = eventType && Object.values(EVENT_TYPES).includes(eventType)
      ? eventType
      : EVENT_TYPES.REMARK;

    // Get colors with fallback
    const colors = EVENT_TYPE_COLORS[safeEventType] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    return theme.palette.mode === 'dark' ? colors.dark : colors.light;
  };

  // Safely get hover color
  const getHoverColor = () => {
    // Make sure we have a valid event type
    const safeEventType = eventType && Object.values(EVENT_TYPES).includes(eventType)
      ? eventType
      : EVENT_TYPES.REMARK;

    // Get colors with fallback
    const colors = EVENT_TYPE_COLORS[safeEventType] || EVENT_TYPE_COLORS[EVENT_TYPES.REMARK];
    const hoverColors = colors.hover || { light: colors.light, dark: colors.dark };

    return theme.palette.mode === 'dark' ? hoverColors.dark : hoverColors.light;
  };

  const getAssociationChipTone = (associationType) => {
    const normalizedType = String(associationType || '').toLowerCase();
    const accent = normalizedType === 'community'
      ? theme.palette.secondary.main
      : (normalizedType === 'personal' ? theme.palette.primary.main : theme.palette.success.main);

    return {
      accent,
      background: theme.palette.mode === 'dark' ? alpha(accent, 0.24) : alpha(accent, 0.12),
      border: theme.palette.mode === 'dark' ? alpha(accent, 0.5) : alpha(accent, 0.42),
    };
  };

  const getAssociationChipSx = (associationType) => {
    const tone = getAssociationChipTone(associationType);
    return {
      bgcolor: tone.background,
      color: tone.accent,
      border: `1px solid ${tone.border}`,
      '& .MuiChip-deleteIcon': {
        color: tone.accent,
        '&:hover': { color: tone.accent },
      },
    };
  };

  const renderTypeSpecificFields = () => {
    switch (eventType) {
      case EVENT_TYPES.NEWS:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Article URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={!canEditUrl}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            {isLoadingPreview ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading preview...
              </Typography>
            ) : urlPreview && (
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                {urlPreview.image && (
                  <Box
                    component="img"
                    src={urlPreview.image}
                    alt={urlPreview.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                )}
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {urlPreview.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {urlPreview.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {urlPreview.source}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        );

      case EVENT_TYPES.MEDIA:
        return (
          <Box sx={{ mt: 2 }}>
            {isEditing && !canEditMedia ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Media cannot be edited yet. Uploads are disabled during edit to avoid orphaned media.
              </Typography>
            ) : (
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                style={{ display: 'none' }}
                id="media-upload"
                onChange={handleMediaChange}
              />
            )}
            <label htmlFor="media-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={!canEditMedia}
                sx={{
                  width: '100%',
                  height: 100,
                  borderStyle: 'dashed',
                  borderColor: getTypeColor(),
                  color: getTypeColor(),
                }}
              >
                Upload Media
              </Button>
            </label>
            {mediaPreview && (
              <Box sx={{ mt: 2, position: 'relative' }}>
                {mediaFile?.type?.startsWith('image/') ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                ) : mediaFile?.type?.startsWith('video/') ? (
                  <video
                    src={mediaPreview}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <audio
                    src={mediaPreview}
                    controls
                    style={{ width: '100%' }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview('');
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: getGlassDialogPaperSx(theme)
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {initialEvent ? 'Edit Event' : 'Create New Event'}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          pb: 0,
          '& .MuiTextField-root': getGlassInputSx(theme),
        }}
      >
        <ToggleButtonGroup
          value={eventType}
          exclusive
          onChange={handleTypeChange}
          disabled={!canEditType}
          aria-label="event type"
          sx={{
            width: '100%',
            mb: 3,
            '& .MuiToggleButton-root': {
              flex: 1,
              py: 2,
              borderRadius: '12px !important',
              mx: 0.5,
              borderColor: 'transparent',
              '&.Mui-selected': {
                bgcolor: `${getTypeColor()}20 !important`,
                color: getTypeColor(),
                borderColor: getTypeColor(),
              }
            }
          }}
        >
          <ToggleButton value={EVENT_TYPES.REMARK}>
            <Stack alignItems="center" spacing={1}>
              <RemarkIcon />
              <Typography variant="caption">Remark</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value={EVENT_TYPES.NEWS}>
            <Stack alignItems="center" spacing={1}>
              <NewsIcon />
              <Typography variant="caption">News</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value={EVENT_TYPES.MEDIA}>
            <Stack alignItems="center" spacing={1}>
              <MediaIcon />
              <Typography variant="caption">Media</Typography>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(clampTitle(e.target.value))}
            helperText={`${title.length}/${EVENT_TITLE_MAX_LENGTH}`}
            inputProps={{ maxLength: EVENT_TITLE_MAX_LENGTH }}
            disabled={!canEditTitle}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Event Date & Time"
              value={eventDate}
              onChange={setEventDate}
              renderInput={(params) => <TextField {...params} />}
              disabled={!canEditDate}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: getTypeColor(),
                  },
                  '&:hover fieldset': {
                    borderColor: getTypeColor(),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: getTypeColor(),
                  },
                },
              }}
            />
          </LocalizationProvider>

          {renderTypeSpecificFields()}

          <RichEditor
            value={description}
            onChange={setDescription}
            disabled={!canEditDescription}
            readOnly={descriptionAppendOnly && canEditDescription}
            label={descriptionAppendOnly ? 'Original Description' : 'Description'}
            helperText={descriptionAppendOnly
              ? 'Original text is locked for append-only editing.'
              : 'Use @ # i- www. or ~123 to add mentions, links, and event references'}
          />

          {descriptionAppendOnly && existingEditsText ? (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.25,
                backgroundColor: 'rgba(255,255,255,0.03)',
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', mb: 0.75, color: 'text.secondary', fontWeight: 700 }}>
                Edits made
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                {existingEditsText}
              </Typography>
            </Box>
          ) : null}

          {descriptionAppendOnly ? (
            <RichEditor
              value={descriptionAppend}
              onChange={setDescriptionAppend}
              disabled={!canEditDescription}
              label="Add Edit"
              rows={4}
              helperText="Append your edit note. Existing content remains unchanged."
            />
          ) : null}

          <Box>
            <Box
              sx={{
                position: 'relative',
                filter: isPersonalTimeline ? 'blur(2px)' : 'none',
                opacity: isPersonalTimeline ? 0.6 : 1,
                pointerEvents: isPersonalTimeline ? 'none' : 'auto',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Add Tags"
                  size="small"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={isPersonalTimeline || !canAddTags}
                  sx={{ flexGrow: 1 }}
                />
                <Tooltip title="Add Tag">
                  <span>
                    <IconButton
                      onClick={handleAddTag}
                      disabled={isPersonalTimeline || !canAddTags}
                      sx={{
                        color: getTypeColor(),
                        '&:hover': { bgcolor: `${getTypeColor()}20` }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              {tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tags.map((tag) => {
                    const normalizedTagLabel = (typeof tag === 'string' ? tag : String(tag)).replace(/^#+/, '');
                    return (
                      <Chip
                        key={tag}
                        label={`#${normalizedTagLabel}`}
                        onDelete={canRemoveTags ? () => handleRemoveTag(tag) : undefined}
                        sx={{
                          bgcolor: `${getTypeColor()}20`,
                          color: getTypeColor(),
                          '& .MuiChip-deleteIcon': {
                            color: getTypeColor(),
                            '&:hover': { color: getTypeColor() }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              {isPersonalTimeline ? (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'warning.main',
                    bgcolor: 'rgba(255, 193, 7, 0.12)',
                  }}
                />
              ) : null}
            </Box>
            {associatedTimelineChips.length > 0 ? (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {associatedTimelineChips.map((association) => {
                  const prefix = association.type === 'community' ? 'i-' : (association.type === 'personal' ? 'My-' : '#');
                  const isPersonalAssociation = association.type === 'personal';
                  const canRemoveAssociation = canRemoveTags && (!isPersonalAssociation || isTierAEditor);
                  return (
                    <Box key={`assoc-${association.id}`} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={`${prefix}${association.name}`}
                        onDelete={canRemoveAssociation ? () => handleRemoveAssociatedTimeline(association.id) : undefined}
                        sx={getAssociationChipSx(association.type)}
                      />
                      {isPersonalAssociation && !isTierAEditor ? (
                        <Tooltip title="Personal associations are removable by Tier A editors only.">
                          <LockOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </Tooltip>
                      ) : null}
                    </Box>
                  );
                })}
              </Box>
            ) : null}

            {creatorTimelineChip ? (
              <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  label={`${creatorTimelineChip.type === 'community' ? 'i-' : (creatorTimelineChip.type === 'personal' ? 'My-' : '#')}${creatorTimelineChip.name}`}
                  sx={getAssociationChipSx(creatorTimelineChip.type)}
                />
                <Tooltip title="Creator timeline association is locked and cannot be removed.">
                  <LockOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Tooltip>
              </Box>
            ) : null}

            {isPersonalTimeline ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Hashtags are disabled on personal timelines to prevent accidental public exposure.
              </Typography>
            ) : null}
          </Box>
        </Stack>
        {showVerdictField && (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Resolution Summary (required)"
              placeholder="Explain the edits and why the ticket is being resolved"
              value={verdict}
              onChange={(event) => onVerdictChange?.(event.target.value)}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={submitLoading}
          variant="contained"
          sx={{
            ...getGlassSquareActionButtonSx(theme),
            width: 'auto',
            minWidth: 84,
            px: 2,
            borderRadius: 1.4,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={submitLoading || submitDisabled || !title || !eventDate || (showVerdictField && !(verdict || '').trim())}
          sx={{
            ...getGlassPillActionButtonSx(theme),
            bgcolor: getTypeColor(),
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            border: '1px solid',
            borderColor: `${getTypeColor()}88`,
            // Mechanical feel: Raised by default, drops down on hover
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'dark'
              ? `0 8px 16px ${alpha('#000', 0.6)}, 0 4px 0 ${alpha(getTypeColor(), 0.8)}`
              : `0 8px 16px ${alpha('#000', 0.25)}, 0 4px 0 ${alpha(getTypeColor(), 0.6)}`,
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: getHoverColor(),
              color: '#fff',
              transform: 'translateY(0)',
              boxShadow: `0 2px 4px ${alpha('#000', 0.3)}`,
            },
            '&:active': {
              transform: 'translateY(2px)',
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              color: 'rgba(255,255,255,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
              textShadow: 'none',
              WebkitTextStroke: '0.4px rgba(0,0,0,0.5)',
              transform: 'none',
              boxShadow: 'none',
            }
          }}
        >
          {submitLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} color="inherit" />
              <span>Submitting...</span>
            </Stack>
          ) : (submitLabel || (initialEvent ? 'Save Changes' : 'Create Event'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDialog;
