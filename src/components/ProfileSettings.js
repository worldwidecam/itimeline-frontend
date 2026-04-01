import React, { useState, useEffect, useCallback } from 'react';
import api, { updateUserPreferences } from '../utils/api';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Divider,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  LinearProgress,
  CircularProgress,
  Tooltip,
  Stack,
  Card,
  CardContent,
  Chip,
  Portal,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import MusicPlayer from './MusicPlayer';
import UserAvatar from './common/UserAvatar';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const PROFILE_MODULE_TYPE_INFO_CARD = 'info_card';
const PROFILE_MODULE_TYPE_TEXTS = 'texts';
const PROFILE_MODULE_TYPE_THEORY_BOARD = 'theory_board';
const PROFILE_MODULE_TYPE_CONSPIRACY_BOARD = 'conspiracy_board';
const TEXTS_MODULE_MAX_ITEMS = 10;
const THEORY_BOARD_TITLE_MAX_LENGTH = 50;

const normalizeProfileModuleType = (type) => {
  const rawType = String(type || '').trim().toLowerCase();
  if (rawType === PROFILE_MODULE_TYPE_INFO_CARD || rawType === PROFILE_MODULE_TYPE_TEXTS) {
    return PROFILE_MODULE_TYPE_TEXTS;
  }
  if (rawType === PROFILE_MODULE_TYPE_THEORY_BOARD || rawType === PROFILE_MODULE_TYPE_CONSPIRACY_BOARD) {
    return PROFILE_MODULE_TYPE_THEORY_BOARD;
  }
  return PROFILE_MODULE_TYPE_TEXTS;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isValidHexColor = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());

const calculateAgeFromDob = (dobIso) => {
  if (!dobIso) return null;
  const birthDate = new Date(dobIso);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const formatDobForDisplay = (dobIso) => {
  if (!dobIso) return '';
  const parsed = new Date(dobIso);
  return Number.isNaN(parsed.getTime()) ? dobIso : parsed.toLocaleDateString();
};

const safeParseJson = (rawValue, fallback) => {
  if (!rawValue || typeof rawValue !== 'string') return fallback;
  try {
    const parsed = JSON.parse(rawValue);
    return parsed ?? fallback;
  } catch (_) {
    return fallback;
  }
};

const normalizeOverflowMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'fifo' ? 'fifo' : 'manual';
};

const normalizeTheoryBoardTitleBase = (value) => {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  const withoutSuffix = compact.replace(/\s*board$/i, '').trim();
  return withoutSuffix.slice(0, THEORY_BOARD_TITLE_MAX_LENGTH);
};

const formatTheoryBoardTitle = (value) => {
  const base = normalizeTheoryBoardTitleBase(value);
  return `${base || 'Theory'} Board`;
};

const normalizeProfileTextEntries = (entries, fallbackAuthor = 'User') => {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry, index) => {
      const text = String(entry?.text || '').trim().slice(0, 1200);
      if (!text) return null;
      const authorId = Number(entry?.author_id);
      return {
        id: String(entry?.id || `profile-text-${index + 1}`),
        text,
        author_id: Number.isInteger(authorId) && authorId > 0 ? authorId : null,
        author_username: String(entry?.author_username || fallbackAuthor).trim().slice(0, 80),
        created_at: String(entry?.created_at || '').trim() || null,
      };
    })
    .filter(Boolean);
};

const normalizeProfileModules = (rawModules) => {
  if (!Array.isArray(rawModules)) return [];
  return rawModules
    .map((module, index) => {
      const moduleType = normalizeProfileModuleType(module?.type);
      const title = String(module?.title || '').trim().slice(0, 120);
      const description = String(module?.description || '').trim().slice(0, 1200);
      const texts = normalizeProfileTextEntries(module?.texts, title || 'User');
      const hasTheoryBoardPayload = moduleType === PROFILE_MODULE_TYPE_THEORY_BOARD;
      if (!hasTheoryBoardPayload && !title && !description && texts.length === 0) return null;
      const moduleOrder = Number.isFinite(Number(module?.order)) ? Number(module.order) : index;
      const maxItems = Math.max(1, Math.min(TEXTS_MODULE_MAX_ITEMS, Number(module?.max_items) || TEXTS_MODULE_MAX_ITEMS));
      const overflowMode = normalizeOverflowMode(module?.overflow_mode);
      return {
        id: String(module?.id || `profile-module-${index + 1}`),
        type: moduleType,
        title,
        description,
        order: moduleOrder,
        is_visible: module?.is_visible !== false,
        max_items: maxItems,
        overflow_mode: overflowMode,
        texts,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((module, index) => ({
      ...module,
      order: index,
    }));
};

const getTextsModuleFromModules = (modules) => (
  normalizeProfileModules(modules).find((module) => normalizeProfileModuleType(module.type) === PROFILE_MODULE_TYPE_TEXTS) || null
);

const getTheoryBoardModuleFromModules = (modules) => (
  normalizeProfileModules(modules).find((module) => normalizeProfileModuleType(module.type) === PROFILE_MODULE_TYPE_THEORY_BOARD) || null
);

const upsertTextsModule = ({ modules, enabled, overflowMode, ownerLabel = 'User' }) => {
  const normalizedModules = normalizeProfileModules(modules);
  const nextOverflowMode = normalizeOverflowMode(overflowMode);
  const existingTextsModule = getTextsModuleFromModules(normalizedModules);
  const fallbackTexts = existingTextsModule?.texts || [];
  const nextTextsModule = {
    id: existingTextsModule?.id || 'profile-module-texts-main',
    type: PROFILE_MODULE_TYPE_TEXTS,
    title: existingTextsModule?.title || `${ownerLabel} Says`,
    description: existingTextsModule?.description || '',
    order: 0,
    is_visible: Boolean(enabled),
    max_items: TEXTS_MODULE_MAX_ITEMS,
    overflow_mode: nextOverflowMode,
    texts: normalizeProfileTextEntries(fallbackTexts, ownerLabel),
  };

  const withoutTexts = normalizedModules.filter((module) => normalizeProfileModuleType(module.type) !== PROFILE_MODULE_TYPE_TEXTS);
  return [nextTextsModule, ...withoutTexts].map((module, index) => ({ ...module, order: index }));
};

const upsertTheoryBoardModule = ({ modules, enabled, titleBase }) => {
  const normalizedModules = normalizeProfileModules(modules);
  const existingTheoryBoardModule = getTheoryBoardModuleFromModules(normalizedModules);
  const nextTheoryBoardModule = {
    id: existingTheoryBoardModule?.id || 'profile-module-theory-board-main',
    type: PROFILE_MODULE_TYPE_THEORY_BOARD,
    title: formatTheoryBoardTitle(titleBase || existingTheoryBoardModule?.title || 'Theory'),
    description: existingTheoryBoardModule?.description || '',
    order: 0,
    is_visible: Boolean(enabled),
    max_items: 100,
    overflow_mode: 'manual',
    texts: [],
  };

  const withoutTheoryBoard = normalizedModules.filter(
    (module) => normalizeProfileModuleType(module.type) !== PROFILE_MODULE_TYPE_THEORY_BOARD
  );
  return [...withoutTheoryBoard, nextTheoryBoardModule].map((module, index) => ({ ...module, order: index }));
};

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { blurEmail, toggleBlurEmail, getBlurredEmail, getPrivacyEmail } = useEmailBlur();
  const theme = useMuiTheme();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Preference settings with defaults
    showEmail: user?.preferences?.showEmail !== false, // Default to true if not set
    emailNotifications: user?.preferences?.emailNotifications !== false, // Default to true if not set
    defaultTimelineView: user?.preferences?.defaultTimelineView || 'base', // Default to 'base' if not set
    blurEmail: false, // This will be set from localStorage in fetchUserData
    dateOfBirth: '',
    userColor: '#4f7cff',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [musicData, setMusicData] = useState({
    music_url: '',
    music_platform: 'youtube'
  });
  const [musicFile, setMusicFile] = useState(null);
  const [musicPreview, setMusicPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragState, setDragState] = useState({ avatar: false, music: false });
  const [fileInfo, setFileInfo] = useState({ avatar: null, music: null });

  // FAB save button states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [showDobInput, setShowDobInput] = useState(false);
  const [profileModules, setProfileModules] = useState([]);
  const [textsModuleEnabled, setTextsModuleEnabled] = useState(false);
  const [textsOverflowMode, setTextsOverflowMode] = useState('manual');
  const [theoryBoardModuleEnabled, setTheoryBoardModuleEnabled] = useState(false);
  const [theoryBoardTitle, setTheoryBoardTitle] = useState('Theory');

  const markUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(true);
    setShowSavedState(false);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch music preferences
        try {
          const musicResponse = await api.get('/api/profile/music');
          if (musicResponse.data?.music_url) {
            setMusicData(musicResponse.data);
          }
        } catch (musicError) {
          // Only log unexpected errors (not 404s)
          if (musicError.response?.status !== 404) {
            console.warn('Error fetching music data:', musicError.message);
          }
        }
        
        // For now, we'll use localStorage for preferences
        const userId = Number(user?.id || 0);
        const savedBlurPref = localStorage.getItem('emailBlurPreference');
        let resolvedDateOfBirth = userId > 0
          ? String(localStorage.getItem(`date_of_birth_user_${userId}`) || '').trim()
          : '';
        let resolvedUserColor = userId > 0
          ? String(localStorage.getItem(`user_color_pref_user_${userId}`) || '').trim()
          : '';
        let resolvedProfileModules = userId > 0
          ? safeParseJson(localStorage.getItem(`profile_modules_user_${userId}`), [])
          : [];

        try {
          const passportResponse = await api.get('/api/v1/user/passport');
          const passportPrefs = passportResponse?.data?.preferences || {};
          const hasPassportDateOfBirth = Object.prototype.hasOwnProperty.call(passportPrefs, 'date_of_birth');
          const hasPassportUserColor = Object.prototype.hasOwnProperty.call(passportPrefs, 'user_color');
          const hasPassportProfilePortraitUrl = Object.prototype.hasOwnProperty.call(passportPrefs, 'profile_portrait_image_url');
          const hasPassportProfilePortraitX = Object.prototype.hasOwnProperty.call(passportPrefs, 'profile_portrait_x');
          const hasPassportProfilePortraitY = Object.prototype.hasOwnProperty.call(passportPrefs, 'profile_portrait_y');
          const hasPassportProfilePortraitZoom = Object.prototype.hasOwnProperty.call(passportPrefs, 'profile_portrait_zoom');
          const hasPassportProfileModules = Object.prototype.hasOwnProperty.call(passportPrefs, 'profile_modules');
          const passportDateOfBirth = passportPrefs?.date_of_birth ? String(passportPrefs.date_of_birth).trim() : '';
          const passportUserColor = passportPrefs?.user_color ? String(passportPrefs.user_color).trim() : '';

          if (hasPassportDateOfBirth) {
            resolvedDateOfBirth = passportDateOfBirth;
          }
          if (hasPassportUserColor) {
            resolvedUserColor = isValidHexColor(passportUserColor) ? passportUserColor.toLowerCase() : '';
          }
          if (userId > 0) {
            if (hasPassportProfilePortraitUrl) {
              const portraitUrl = String(passportPrefs?.profile_portrait_image_url || '').trim();
              if (portraitUrl) {
                localStorage.setItem(`profile_portrait_url_user_${userId}`, portraitUrl);
              } else {
                localStorage.removeItem(`profile_portrait_url_user_${userId}`);
              }
            }
            if (hasPassportProfilePortraitX) {
              const portraitX = Number(passportPrefs?.profile_portrait_x);
              if (Number.isFinite(portraitX)) localStorage.setItem(`profile_portrait_x_user_${userId}`, String(portraitX));
            }
            if (hasPassportProfilePortraitY) {
              const portraitY = Number(passportPrefs?.profile_portrait_y);
              if (Number.isFinite(portraitY)) localStorage.setItem(`profile_portrait_y_user_${userId}`, String(portraitY));
            }
            if (hasPassportProfilePortraitZoom) {
              const portraitZoom = Number(passportPrefs?.profile_portrait_zoom);
              if (Number.isFinite(portraitZoom)) localStorage.setItem(`profile_portrait_zoom_user_${userId}`, String(portraitZoom));
            }
            if (hasPassportProfileModules) {
              resolvedProfileModules = Array.isArray(passportPrefs?.profile_modules) ? passportPrefs.profile_modules : [];
              localStorage.setItem(`profile_modules_user_${userId}`, JSON.stringify(resolvedProfileModules));
            }
          }
        } catch (passportError) {
          console.warn('Error fetching passport preferences:', passportError?.response?.data || passportError?.message || passportError);
        }

        const normalizedModules = normalizeProfileModules(resolvedProfileModules);
        setProfileModules(normalizedModules);
        const textsModule = getTextsModuleFromModules(normalizedModules);
        const theoryBoardModule = getTheoryBoardModuleFromModules(normalizedModules);
        setTextsModuleEnabled(Boolean(textsModule?.is_visible));
        setTextsOverflowMode(normalizeOverflowMode(textsModule?.overflow_mode));
        setTheoryBoardModuleEnabled(Boolean(theoryBoardModule?.is_visible));
        setTheoryBoardTitle(normalizeTheoryBoardTitleBase(theoryBoardModule?.title || 'Theory'));

        if (savedBlurPref !== null) {
          setFormData(prev => ({
            ...prev,
            blurEmail: savedBlurPref === 'true',
            dateOfBirth: resolvedDateOfBirth,
            userColor: isValidHexColor(resolvedUserColor) ? resolvedUserColor.toLowerCase() : '#4f7cff',
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            dateOfBirth: resolvedDateOfBirth,
            userColor: isValidHexColor(resolvedUserColor) ? resolvedUserColor.toLowerCase() : '#4f7cff',
          }));
        }
        setShowDobInput(!Boolean(resolvedDateOfBirth));
        
        // If you want to implement the preferences endpoint later, uncomment this:
        /*
        const prefsResponse = await api.get('/api/profile/preferences');
        if (prefsResponse.data) {
          setFormData(prev => ({
            ...prev,
            showEmail: prefsResponse.data.showEmail !== false,
            emailNotifications: prefsResponse.data.emailNotifications !== false,
            defaultTimelineView: prefsResponse.data.defaultTimelineView || 'base',
            blurEmail: prefsResponse.data.blurEmail || false
          }));
        }
        */
      } catch (error) {
        // Only log unexpected errors (not 404s)
        if (error.response?.status !== 404) {
          console.warn('Error in fetchUserData:', error.message);
        }
      }
    };

    if (user) {
      const userData = {
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        // Preference settings with defaults
        showEmail: user?.preferences?.showEmail !== false, // Default to true if not set
        emailNotifications: user?.preferences?.emailNotifications !== false, // Default to true if not set
        defaultTimelineView: user?.preferences?.defaultTimelineView || 'base', // Default to 'base' if not set
        blurEmail: false, // This will be set from localStorage in fetchUserData
        dateOfBirth: '',
        userColor: '#4f7cff',
      };
      setFormData(userData);
      setInitialFormData({ ...userData });
      setPreviewUrl(user.avatar_url || '');
      fetchUserData();
    }
  }, [user]);

  const handleThemeChange = () => {
    toggleTheme();
    markUnsavedChanges();
  };

  const handleBlurEmailChange = () => {
    toggleBlurEmail();
    markUnsavedChanges();
  };

  const handleTextsModuleEnabledChange = (event) => {
    setTextsModuleEnabled(Boolean(event.target.checked));
    markUnsavedChanges();
  };

  const handleTextsOverflowModeChange = (event) => {
    setTextsOverflowMode(normalizeOverflowMode(event.target.value));
    markUnsavedChanges();
  };

  const handleTheoryBoardModuleEnabledChange = (event) => {
    setTheoryBoardModuleEnabled(Boolean(event.target.checked));
    markUnsavedChanges();
  };

  const handleTheoryBoardTitleChange = (event) => {
    setTheoryBoardTitle(normalizeTheoryBoardTitleBase(event.target.value));
    markUnsavedChanges();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track unsaved changes
    markUnsavedChanges();
  };

  const handleDateOfBirthChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: event.target.value,
    }));
    markUnsavedChanges();
  };

  const handleDobReset = () => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: '',
    }));
    setShowDobInput(true);
    markUnsavedChanges();
  };

  const handleUserColorChange = (event) => {
    const value = String(event.target.value || '').trim();
    setFormData((prev) => ({
      ...prev,
      userColor: isValidHexColor(value) ? value.toLowerCase() : prev.userColor,
    }));
    markUnsavedChanges();
  };

  const onDrop = useCallback((acceptedFiles, type) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const fileSize = file.size;
    const maxSize = type === 'avatar' ? MAX_FILE_SIZE : MAX_AUDIO_SIZE;
    
    setFileInfo(prev => ({
      ...prev,
      [type]: {
        name: file.name,
        size: formatFileSize(fileSize),
        type: file.type
      }
    }));

    if (fileSize > maxSize) {
      setError(`File size exceeds ${formatFileSize(maxSize)}`);
      return;
    }

    if (type === 'avatar') {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, JPEG, GIF)');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      // Track unsaved changes
      markUnsavedChanges();
    } else if (type === 'music') {
      if (!file.type.startsWith('audio/')) {
        setError('Please upload an audio file (MP3, WAV, or OGG)');
        return;
      }
      setMusicFile(file);
      setMusicPreview(URL.createObjectURL(file));
      // Track unsaved changes
      markUnsavedChanges();
    }
  }, [markUnsavedChanges]);

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'avatar'),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false,
    onDragEnter: () => setDragState(prev => ({ ...prev, avatar: true })),
    onDragLeave: () => setDragState(prev => ({ ...prev, avatar: false })),
    onDropAccepted: () => setDragState(prev => ({ ...prev, avatar: false })),
  });

  const { getRootProps: getMusicRootProps, getInputProps: getMusicInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'music'),
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg']
    },
    multiple: false,
    onDragEnter: () => setDragState(prev => ({ ...prev, music: true })),
    onDragLeave: () => setDragState(prev => ({ ...prev, music: false })),
    onDropAccepted: () => setDragState(prev => ({ ...prev, music: false })),
  });

  const handleMusicChange = (e) => {
    const { name, value } = e.target;
    setMusicData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    setIsUploading(true);
    const trimmedUsername = String(formData.username || '').trim();

    if (!trimmedUsername) {
      setError('Username is required');
      setIsUploading(false);
      setIsSaving(false);
      return;
    }

    if (/\s/.test(trimmedUsername)) {
      setError('Username cannot contain spaces.');
      setIsUploading(false);
      setIsSaving(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('username', trimmedUsername);
      submitData.append('email', formData.email);
      submitData.append('bio', formData.bio);
      
      // Add preference settings
      submitData.append('preferences', JSON.stringify({
        showEmail: formData.showEmail,
        emailNotifications: formData.emailNotifications,
        defaultTimelineView: formData.defaultTimelineView
      }));
      
      if (selectedFile) {
        submitData.append('avatar', selectedFile);
      }

      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          setIsUploading(false);
          return;
        }
        submitData.append('current_password', formData.currentPassword);
        submitData.append('new_password', formData.newPassword);
      }

      console.log('Submitting profile update with data:', submitData);
      console.log('Current user:', user);

      const response = await api.post(
        '/api/profile/update',
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          }
        }
      );
      console.log('Profile update response:', response.data);
      const uploadedAvatarUrl = String(response?.data?.avatar_url || '').trim();
      const shouldSyncProfilePortraitFromAvatar = Boolean(selectedFile && uploadedAvatarUrl);
      setSelectedFile(null);
      setFileInfo(prev => ({ ...prev, avatar: null }));

      let preferenceSyncFailed = false;
      try {
        const withTextsModules = upsertTextsModule({
          modules: profileModules,
          enabled: textsModuleEnabled,
          overflowMode: textsOverflowMode,
          ownerLabel: user?.username || 'User',
        });
        const nextProfileModules = upsertTheoryBoardModule({
          modules: withTextsModules,
          enabled: theoryBoardModuleEnabled,
          titleBase: theoryBoardTitle,
        });

        const preferencePayload = {
          date_of_birth: formData.dateOfBirth || null,
          user_color: formData.userColor || null,
          profile_modules: nextProfileModules,
        };
        if (shouldSyncProfilePortraitFromAvatar) {
          preferencePayload.profile_portrait_image_url = uploadedAvatarUrl;
          preferencePayload.profile_portrait_x = 50;
          preferencePayload.profile_portrait_y = 50;
          preferencePayload.profile_portrait_zoom = 1;
        }
        await updateUserPreferences(preferencePayload);
        if (user?.id) {
          localStorage.setItem(`user_color_pref_user_${user.id}`, formData.userColor || '#4f7cff');
          if (formData.dateOfBirth) {
            localStorage.setItem(`date_of_birth_user_${user.id}`, formData.dateOfBirth);
          } else {
            localStorage.removeItem(`date_of_birth_user_${user.id}`);
          }
          localStorage.setItem(`profile_modules_user_${user.id}`, JSON.stringify(nextProfileModules));
          if (shouldSyncProfilePortraitFromAvatar) {
            localStorage.setItem(`profile_portrait_url_user_${user.id}`, uploadedAvatarUrl);
            localStorage.setItem(`profile_portrait_x_user_${user.id}`, '50');
            localStorage.setItem(`profile_portrait_y_user_${user.id}`, '50');
            localStorage.setItem(`profile_portrait_zoom_user_${user.id}`, '1');
          }
        }
        setShowDobInput(!Boolean(formData.dateOfBirth));
      } catch (prefError) {
        preferenceSyncFailed = true;
        console.warn('Profile preference sync error:', prefError?.response?.data || prefError?.message || prefError);
      }

      if (updateProfile) {
        try {
          // Update the user data in the auth context
          await updateProfile(response.data);
          setSuccess(preferenceSyncFailed
            ? 'Profile updated, but some preferences failed to sync'
            : 'Profile updated successfully');
          
          // Don't reload the page, just update the UI
          // This prevents the token refresh issues that cause logout
          setPreviewUrl(response.data.avatar_url);
          
          // Update initial form data and clear unsaved changes
          setInitialFormData({ ...formData });
          setHasUnsavedChanges(false);
          setShowSavedState(true);
          
          // Hide saved state after 3 seconds
          setTimeout(() => {
            setShowSavedState(false);
          }, 3000);
        } catch (updateError) {
          console.error('Error updating profile in context:', updateError);
          // Even if context update fails, we still have the updated data from the API
          setSuccess('Profile updated successfully, but there was an issue refreshing the page data');
          setHasUnsavedChanges(false);
          setShowSavedState(true);
          setTimeout(() => {
            setShowSavedState(false);
          }, 3000);
        }
      } else {
        setSuccess(preferenceSyncFailed
          ? 'Profile updated, but some preferences failed to sync'
          : 'Profile updated successfully');
        setPreviewUrl(response.data.avatar_url);
        setHasUnsavedChanges(false);
        setShowSavedState(true);
        setTimeout(() => {
          setShowSavedState(false);
        }, 3000);
      }
      setProfileModules(upsertTheoryBoardModule({
        modules: upsertTextsModule({
          modules: profileModules,
          enabled: textsModuleEnabled,
          overflowMode: textsOverflowMode,
          ownerLabel: user?.username || 'User',
        }),
        enabled: theoryBoardModuleEnabled,
        titleBase: theoryBoardTitle,
      }));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const handleMusicSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!musicFile) {
      setError('Please select a music file to upload');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('music', musicFile);

      const response = await api.post(
        '/api/profile/music',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          }
        }
      );
      console.log('Music update response:', response.data);
      setSuccess('Music updated successfully');
      setMusicData(response.data);
      // Clear the file input
      setMusicFile(null);
      setFileInfo(prev => ({ ...prev, music: null }));
    } catch (error) {
      console.error('Music update error:', error);
      setError(error.response?.data?.error || 'Failed to update music');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        position: 'relative',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #000000 0%, #0a1128 50%, #1a2456 100%)'
          : 'linear-gradient(180deg, #ffb199 0%, #ffd5c8 20%, #ffeae0 45%, #f7f4ea 75%, #f5f1e4 90%, #ffffff 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pt: 4,
        pb: 4,
        overflow: 'auto'
      }}
    >
    <Container maxWidth="md">
      <Paper sx={{ 
        ...getGlassDialogPaperSx(theme),
        p: 4, 
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
          : '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: 3,
          p: 2,
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: 2,
          transition: 'background-color 0.3s ease'
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={isDarkMode}
                onChange={handleThemeChange}
                sx={{
                  '& .MuiSwitch-switchBase': {
                    '&.Mui-checked': {
                      color: '#90caf9',
                      '& + .MuiSwitch-track': {
                        backgroundColor: '#90caf9',
                      },
                    },
                  },
                  '& .MuiSwitch-thumb': {
                    backgroundColor: isDarkMode ? '#90caf9' : '#f4b942',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.5)' : 'rgba(244, 185, 66, 0.5)',
                  },
                }}
              />
            }
            label={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
              }}>
                {isDarkMode ? (
                  <DarkModeIcon sx={{ 
                    color: '#90caf9',
                    animation: 'fadeIn 0.3s ease-in',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }} />
                ) : (
                  <LightModeIcon sx={{ 
                    color: '#f4b942',
                    animation: 'fadeIn 0.3s ease-in',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'scale(0.8)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  }} />
                )}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: theme => theme.palette.mode === 'dark' ? '#90caf9' : '#f4b942',
                    fontWeight: 500,
                  }}
                >
                  {isDarkMode ? 'Dark' : 'Light'} Mode
                </Typography>
              </Box>
            }
          />
        </Box>
        
        {error && !error.includes('music') && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ my: 3 }} />
        </Box>
        
        <Box
          component="form"
          sx={{
            mt: 3,
            '& .MuiTextField-root': getGlassInputSx(theme),
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4} md={3}>
              <Tooltip title={`Max size: ${formatFileSize(MAX_FILE_SIZE)}`} placement="top">
                <Box {...getAvatarRootProps()} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 2,
                    border: '2px dashed',
                    borderColor: dragState.avatar ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: dragState.avatar ? 'scale(1.02)' : 'scale(1)',
                    bgcolor: dragState.avatar ? 'action.hover' : 'transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}>
                  <input {...getAvatarInputProps()} />
                  <UserAvatar
                    name={formData.username}
                    avatarUrl={previewUrl || user?.avatar_url || ''}
                    id={user?.id}
                    size={100}
                    sx={{ 
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.05)' }
                    }}
                  />
                  <Box sx={{ textAlign: 'center' }}>
                    <CloudUploadIcon color="primary" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      Drag & drop or click to upload avatar
                    </Typography>
                    {fileInfo.avatar && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        {fileInfo.avatar.name} ({fileInfo.avatar.size})
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={12} sm={8} md={9}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Profile Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    // Show privacy dots when email blur is enabled, but store the actual value
                    value={blurEmail ? getPrivacyEmail(formData.email) : formData.email}
                    onChange={handleInputChange}
                    InputProps={{
                      readOnly: blurEmail, // Make it read-only when blurred for better UX
                    }}
                    helperText={blurEmail ? "Email is masked for privacy" : ""}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    multiline
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </Grid>


              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Profile Music
                <Tooltip title={`Max size: ${formatFileSize(MAX_AUDIO_SIZE)}`} placement="top">
                  <InfoIcon color="action" sx={{ fontSize: 20 }} />
                </Tooltip>
              </Typography>
              
              {/* Music upload error message */}
              {error && error.includes('music') && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}
              
              <Box {...getMusicRootProps()}
                sx={{ 
                  border: '2px dashed',
                  borderColor: dragState.music ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  mb: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: dragState.music ? 'scale(1.02)' : 'scale(1)',
                  bgcolor: dragState.music ? 'action.hover' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}>
                <input {...getMusicInputProps()} />
                <Box sx={{ textAlign: 'center' }}>
                  {musicFile ? (
                    <AudioFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  ) : (
                    <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  )}
                  <Typography variant="body1" gutterBottom>
                    {musicFile ? 'Change audio file' : 'Drag & drop or click to upload music'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supports MP3, WAV, and OGG formats
                  </Typography>
                  {fileInfo.music && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      {fileInfo.music.name} ({fileInfo.music.size})
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {(musicPreview || musicData?.music_url) && (
                <Box sx={{ mt: 2 }}>
                  <MusicPlayer url={musicPreview || musicData?.music_url} />
                </Box>
              )}
              
              {/* Music-specific success message */}
              {success && success.includes('Music') && (
                <Alert 
                  severity="success" 
                  sx={{ mt: 2, mb: 2 }}
                  onClose={() => setSuccess('')}
                >
                  {success}
                </Alert>
              )}
            </Grid>

            {isUploading && (
              <Grid item xs={12}>
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }} 
                  />
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                    Uploading... {Math.round(uploadProgress)}%
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={handleMusicSubmit}
                disabled={!musicFile}
                sx={getGlassPillActionButtonSx(theme)}
              >
                Update Music
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Preferences Section */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.9)',
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', mb: 3 }}>
                  Preferences
                </Typography>
                
                <Box sx={{ width: '100%' }}>
                  {/* Preference toggle rows - descriptions on left, toggles on right */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2,
                    pb: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body1">
                      Email Blur
                    </Typography>
                    <Switch 
                      checked={blurEmail}
                      onChange={handleBlurEmailChange}
                      color="primary"
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Date of Birth
                    </Typography>
                    {!showDobInput && formData.dateOfBirth ? (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDobForDisplay(formData.dateOfBirth)} • Age {calculateAgeFromDob(formData.dateOfBirth) ?? 'N/A'}
                        </Typography>
                        <Button variant="text" size="small" onClick={handleDobReset}>
                          Reset
                        </Button>
                      </Box>
                    ) : (
                      <TextField
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={handleDateOfBirthChange}
                        inputProps={{ max: new Date().toISOString().split('T')[0] }}
                        size="small"
                      />
                    )}
                  </Box>

                  <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Identity Color
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <input
                        type="color"
                        value={formData.userColor || '#4f7cff'}
                        onChange={handleUserColorChange}
                        aria-label="Choose identity color"
                        style={{
                          width: 44,
                          height: 32,
                          border: 'none',
                          borderRadius: 8,
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formData.userColor || '#4f7cff'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Typography variant="body1">
                      Dark mode
                    </Typography>
                    <Switch 
                      checked={isDarkMode}
                      onChange={handleThemeChange}
                      color="primary"
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{
                p: 3,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.9)',
                borderRadius: 2,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                  : '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}>
                <Typography variant="h6" gutterBottom>
                  Profile Modules
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure module visibility for your profile.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Module List
                      </Typography>
                    </Box>
                    <Stack spacing={1.2}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              Theory Board Module
                            </Typography>
                            <Chip
                              size="small"
                              color={theoryBoardModuleEnabled ? 'success' : 'default'}
                              label={theoryBoardModuleEnabled ? 'ACTIVE' : 'INACTIVE'}
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                          <FormControlLabel
                            control={(
                              <Switch
                                checked={theoryBoardModuleEnabled}
                                onChange={handleTheoryBoardModuleEnabledChange}
                              />
                            )}
                            label="Show Theory Board module on your profile"
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Board Name"
                            value={theoryBoardTitle}
                            onChange={handleTheoryBoardTitleChange}
                            inputProps={{ maxLength: THEORY_BOARD_TITLE_MAX_LENGTH }}
                            sx={getGlassInputSx(theme)}
                            helperText={`Displays as: ${formatTheoryBoardTitle(theoryBoardTitle)}`}
                          />
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1.2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              Texts Module
                            </Typography>
                            <Chip
                              size="small"
                              color={textsModuleEnabled ? 'success' : 'default'}
                              label={textsModuleEnabled ? 'ACTIVE' : 'INACTIVE'}
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                          <FormControlLabel
                            control={(
                              <Switch
                                checked={textsModuleEnabled}
                                onChange={handleTextsModuleEnabledChange}
                              />
                            )}
                            label="Show Texts module on your profile"
                            sx={{ mb: 1.1 }}
                          />

                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="At 10 texts"
                            value={textsOverflowMode}
                            onChange={handleTextsOverflowModeChange}
                            disabled={!textsModuleEnabled}
                            sx={getGlassInputSx(theme)}
                            helperText={textsOverflowMode === 'fifo'
                              ? 'FIFO: oldest text is removed automatically when a new one is sent.'
                              : 'Manual: add button is hidden at 10 until you delete one.'}
                          >
                            <MenuItem value="manual">Manual delete only</MenuItem>
                            <MenuItem value="fifo">Auto-delete oldest (FIFO)</MenuItem>
                          </TextField>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
          </Grid>
        </Box>

        <Snackbar
          open={Boolean(success) && !success.includes('Music')}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            onClose={() => setSuccess('')}
            sx={{ width: '100%' }}
            elevation={6}
          >
            {success}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
    
    {/* Floating Action Button for Save Changes - Outside main container for proper fixed positioning */}
    <Portal>
      <AnimatePresence>
        {(hasUnsavedChanges || showSavedState) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: showSavedState ? 10 : 0,
              transition: { type: 'spring', stiffness: 300, damping: 25 }
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: 40,
              transition: { duration: 0.3 }
            }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 1400,
            }}
          >
            <Button
              variant="contained"
              color={showSavedState ? 'success' : 'primary'}
              onClick={handleSubmit}
              disabled={isSaving || showSavedState}
              startIcon={showSavedState ? <CheckCircleIcon /> : isSaving ? null : <SaveIcon />}
              sx={{
                borderRadius: '28px',
                padding: '12px 24px',
                boxShadow: showSavedState
                  ? '0 8px 16px rgba(76, 175, 80, 0.3)'
                  : '0 8px 16px rgba(0,0,0,0.2)',
                '&:hover': {
                  boxShadow: showSavedState
                    ? '0 8px 16px rgba(76, 175, 80, 0.3)'
                    : '0 12px 20px rgba(0,0,0,0.3)',
                },
                '&.Mui-disabled': {
                  color: 'white',
                  opacity: showSavedState ? 1 : 0.7
                },
                transition: 'all 0.3s ease'
              }}
            >
              {showSavedState ? 'SAVED!' : isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
    </Box>
  );
};

export default ProfileSettings;
