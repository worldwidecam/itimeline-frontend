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
  IconButton,
  alpha,
  Slider,
  Autocomplete,
  InputAdornment,
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
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CakeIcon from '@mui/icons-material/Cake';
import PaletteIcon from '@mui/icons-material/Palette';
import LockIcon from '@mui/icons-material/Lock';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LanguageIcon from '@mui/icons-material/Language';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import MusicPlayer from './MusicPlayer';
import UserAvatar from './common/UserAvatar';
import TradingCard from './common/TradingCard';
import { getTimelineSurfaceTheme } from './timeline-v3/timelineSurfaceTheme';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getGlassDialogPaperSx,
  getGlassInputSx,
  getGlassPillActionButtonSx,
} from '../utils/formStyleGuide';
import { countries, getFlagUrl } from '../utils/countries';
import { displayUsername } from '../utils/usernameDisplay';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
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
      // Handle both new backend format (module_key) and legacy format (type/id)
      const moduleKey = module?.module_key || module?.type || module?.id || '';
      const moduleType = normalizeProfileModuleType(moduleKey);
      
      // Handle new backend format (config object) or flat legacy format
      const config = module?.config || {};
      const title = String(module?.title || config?.title || '').trim().slice(0, 120);
      const description = String(module?.description || config?.description || '').trim().slice(0, 1200);
      const texts = normalizeProfileTextEntries(module?.texts || config?.texts, title || 'User');
      
      const hasTheoryBoardPayload = moduleType === PROFILE_MODULE_TYPE_THEORY_BOARD;
      if (!hasTheoryBoardPayload && !title && !description && texts.length === 0 && moduleType !== PROFILE_MODULE_TYPE_TEXTS) return null;
      
      const moduleOrder = Number.isFinite(Number(module?.position)) 
        ? Number(module.position) 
        : (Number.isFinite(Number(module?.order)) ? Number(module.order) : index);
        
      const isVisible = module?.enabled !== undefined 
        ? Boolean(module.enabled) 
        : (module?.is_visible !== undefined ? Boolean(module.is_visible) : true);

      const maxItems = Math.max(1, Math.min(TEXTS_MODULE_MAX_ITEMS, Number(module?.max_items || config?.max_items) || TEXTS_MODULE_MAX_ITEMS));
      const overflowMode = normalizeOverflowMode(module?.overflow_mode || config?.overflow_mode);

      return {
        id: moduleKey,
        module_key: moduleKey,
        type: moduleType,
        title,
        description,
        order: moduleOrder,
        position: moduleOrder,
        is_visible: isVisible,
        enabled: isVisible,
        max_items: maxItems,
        overflow_mode: overflowMode,
        texts,
        config: config
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((module, index) => ({
      ...module,
      order: index,
      position: index,
    }));
};

const getTextsModuleFromModules = (modules) => (
  normalizeProfileModules(modules).find((module) => module.type === PROFILE_MODULE_TYPE_TEXTS) || null
);

const getTheoryBoardModuleFromModules = (modules) => (
  normalizeProfileModules(modules).find((module) => module.type === PROFILE_MODULE_TYPE_THEORY_BOARD) || null
);

const upsertTextsModule = ({ modules, enabled, overflowMode, ownerLabel = 'User' }) => {
  const normalizedModules = normalizeProfileModules(modules);
  const nextOverflowMode = normalizeOverflowMode(overflowMode);
  const existingTextsModule = getTextsModuleFromModules(normalizedModules);
  
  const config = {
    title: existingTextsModule?.title || `${ownerLabel} Says`,
    description: existingTextsModule?.description || '',
    max_items: TEXTS_MODULE_MAX_ITEMS,
    overflow_mode: nextOverflowMode,
    texts: existingTextsModule?.texts || []
  };

  const nextTextsModule = {
    module_key: PROFILE_MODULE_TYPE_TEXTS,
    enabled: Boolean(enabled),
    position: 0,
    config: config
  };

  const withoutTexts = normalizedModules.filter((module) => module.type !== PROFILE_MODULE_TYPE_TEXTS);
  return [nextTextsModule, ...withoutTexts].map((module, index) => ({ ...module, position: index }));
};

const upsertTheoryBoardModule = ({ modules, enabled, titleBase }) => {
  const normalizedModules = normalizeProfileModules(modules);
  const existingTheoryBoardModule = getTheoryBoardModuleFromModules(normalizedModules);
  
  const config = {
    title: formatTheoryBoardTitle(titleBase || existingTheoryBoardModule?.title || 'Theory'),
    description: existingTheoryBoardModule?.description || '',
    max_items: 100,
    overflow_mode: 'manual',
    texts: []
  };

  const nextTheoryBoardModule = {
    module_key: PROFILE_MODULE_TYPE_THEORY_BOARD,
    enabled: Boolean(enabled),
    position: 1, // Default position 1
    config: config
  };

  const withoutTheoryBoard = normalizedModules.filter(
    (module) => module.type !== PROFILE_MODULE_TYPE_THEORY_BOARD
  );
  return [...withoutTheoryBoard, nextTheoryBoardModule].map((module, index) => ({ ...module, position: index }));
};

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { blurEmail, toggleBlurEmail, getBlurredEmail, getPrivacyEmail } = useEmailBlur();
  const theme = useMuiTheme();
  const appCanvasBackground = getTimelineSurfaceTheme(theme).canvas;
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
    profileVisibility: 'public',
    profileAccessKey: '',
    country: user?.country || '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
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
  const [musicRemoved, setMusicRemoved] = useState(false);

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
  const [portraitX, setPortraitX] = useState(50);
  const [portraitY, setPortraitY] = useState(50);
  const [portraitZoom, setPortraitZoom] = useState(1);

  const markUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(true);
    setShowSavedState(false);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch music preferences
        try {
          const musicResponse = await api.get('/api/v1/profile/music');
          if (musicResponse.data?.music_url || musicResponse.data?.music_media_url) {
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
        let resolvedProfileVisibility = userId > 0
          ? String(localStorage.getItem(`profile_visibility_user_${userId}`) || 'public').trim().toLowerCase()
          : 'public';
        let resolvedProfileAccessKey = userId > 0
          ? String(localStorage.getItem(`profile_access_key_user_${userId}`) || '').trim()
          : '';
        let resolvedProfileModules = userId > 0
          ? safeParseJson(localStorage.getItem(`profile_modules_user_${userId}`), [])
          : [];
        let resolvedCountry = userId > 0 ? (user?.country || '') : '';

        try {
          const passportResponse = await api.get('/api/v1/profile/hydrate');
          const passportUser = passportResponse?.data?.user || {};
          const passportPrefs = passportResponse?.data?.preferences || {};
          // user_color comes from user object (toUserSelfDTO), not preferences
          const hasPassportUserColor = Object.prototype.hasOwnProperty.call(passportUser, 'user_color');
          const passportUserColor = passportUser?.user_color ? String(passportUser.user_color).trim() : '';
          const hasPassportDateOfBirth = Object.prototype.hasOwnProperty.call(passportUser, 'date_of_birth');
          const passportDateOfBirth = passportUser?.date_of_birth ? String(passportUser.date_of_birth).trim() : '';
          const hasPassportProfilePortraitUrl = Object.prototype.hasOwnProperty.call(passportUser, 'avatar_url');
          const hasPassportProfilePortraitX = Object.prototype.hasOwnProperty.call(passportUser, 'profile_portrait_x');
          const hasPassportProfilePortraitY = Object.prototype.hasOwnProperty.call(passportUser, 'profile_portrait_y');
          const hasPassportProfilePortraitZoom = Object.prototype.hasOwnProperty.call(passportUser, 'profile_portrait_zoom');
          const hasPassportProfileModules = Object.prototype.hasOwnProperty.call(passportPrefs, 'profile_modules');
          const hasPassportProfileVisibility = Object.prototype.hasOwnProperty.call(passportUser, 'profile_visibility');
          const hasPassportProfileAccessKey = Object.prototype.hasOwnProperty.call(passportUser, 'profile_access_key');
          const passportProfileVisibility = String(passportUser?.profile_visibility || 'public').trim().toLowerCase();
          const passportProfileAccessKey = String(passportUser?.profile_access_key || '').trim();

          if (hasPassportDateOfBirth) {
            resolvedDateOfBirth = passportDateOfBirth;
          }
          if (hasPassportUserColor) {
            resolvedUserColor = isValidHexColor(passportUserColor) ? passportUserColor.toLowerCase() : '';
          }
          if (hasPassportProfileVisibility) {
            resolvedProfileVisibility = ['private', 'key-gated'].includes(passportProfileVisibility) ? 'private' : 'public';
          }
          if (hasPassportProfileAccessKey) {
            resolvedProfileAccessKey = passportProfileAccessKey;
          }
          if (passportUser?.country !== undefined) {
            resolvedCountry = passportUser.country || '';
          }
          if (userId > 0) {
            if (hasPassportProfilePortraitUrl) {
              const portraitUrl = String(passportUser?.avatar_url || '').trim();
              if (portraitUrl) {
                localStorage.setItem(`profile_portrait_url_user_${userId}`, portraitUrl);
              } else {
                localStorage.removeItem(`profile_portrait_url_user_${userId}`);
              }
            }
            if (hasPassportProfilePortraitX) {
              const pX = Number(passportUser?.profile_portrait_x);
              if (Number.isFinite(pX)) {
                localStorage.setItem(`profile_portrait_x_user_${userId}`, String(pX));
                setPortraitX(pX);
              }
            }
            if (hasPassportProfilePortraitY) {
              const pY = Number(passportUser?.profile_portrait_y);
              if (Number.isFinite(pY)) {
                localStorage.setItem(`profile_portrait_y_user_${userId}`, String(pY));
                setPortraitY(pY);
              }
            }
            if (hasPassportProfilePortraitZoom) {
              const pZoom = Number(passportUser?.profile_portrait_zoom);
              if (Number.isFinite(pZoom)) {
                localStorage.setItem(`profile_portrait_zoom_user_${userId}`, String(pZoom));
                setPortraitZoom(pZoom);
              }
            }
            if (passportResponse?.data?.profile_modules) {
              resolvedProfileModules = Array.isArray(passportResponse.data.profile_modules) ? passportResponse.data.profile_modules : [];
              localStorage.setItem(`profile_modules_user_${userId}`, JSON.stringify(resolvedProfileModules));
            }
            localStorage.setItem(`profile_visibility_user_${userId}`, resolvedProfileVisibility === 'private' ? 'private' : 'public');
            if (resolvedProfileAccessKey) {
              localStorage.setItem(`profile_access_key_user_${userId}`, resolvedProfileAccessKey);
            } else {
              localStorage.removeItem(`profile_access_key_user_${userId}`);
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
            profileVisibility: resolvedProfileVisibility === 'private' ? 'private' : 'public',
            profileAccessKey: resolvedProfileAccessKey,
            country: resolvedCountry,
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            dateOfBirth: resolvedDateOfBirth,
            userColor: isValidHexColor(resolvedUserColor) ? resolvedUserColor.toLowerCase() : '#4f7cff',
            profileVisibility: resolvedProfileVisibility === 'private' ? 'private' : 'public',
            profileAccessKey: resolvedProfileAccessKey,
            country: resolvedCountry,
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
        profileVisibility: 'public',
        profileAccessKey: '',
        country: user.country || '',
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

  const handleProfileVisibilityChange = (event) => {
    const isPrivate = event?.target?.type === 'checkbox'
      ? Boolean(event.target.checked)
      : String(event?.target?.value || '').trim().toLowerCase() === 'private';
    setFormData((prev) => ({
      ...prev,
      profileVisibility: isPrivate ? 'private' : 'public',
    }));
    markUnsavedChanges();
  };

  const handleProfileAccessKeyChange = (event) => {
    const value = String(event.target.value || '').slice(0, 120);
    setFormData((prev) => ({
      ...prev,
      profileAccessKey: value,
    }));
    markUnsavedChanges();
  };

  const handleCountryChange = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      country: newValue ? newValue.code : '',
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
      setMusicRemoved(false);
      // Track unsaved changes
      markUnsavedChanges();
    }
  }, [markUnsavedChanges]);

  const handlePortraitXChange = (event, newValue) => {
    setPortraitX(newValue);
    markUnsavedChanges();
  };

  const handlePortraitYChange = (event, newValue) => {
    setPortraitY(newValue);
    markUnsavedChanges();
  };

  const handlePortraitZoomChange = (event, newValue) => {
    setPortraitZoom(newValue);
    markUnsavedChanges();
  };

  const handleMusicRemove = () => {
    setMusicFile(null);
    setMusicPreview(null);
    setMusicRemoved(true);
    markUnsavedChanges();
  };

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'avatar'),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false,
    onDragEnter: () => setDragState(prev => ({ ...prev, avatar: true })),
    onDragLeave: () => setDragState(prev => ({ ...prev, avatar: false })),
    onDropAccepted: () => setDragState(prev => ({ ...prev, avatar: false })),
    onDropRejected: (fileRejections) => {
      setDragState(prev => ({ ...prev, avatar: false }));
      const error = fileRejections[0]?.errors[0]?.message || 'Invalid image file';
      setError(`Avatar rejected: ${error}`);
    }
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
    onDropRejected: (fileRejections) => {
      setDragState(prev => ({ ...prev, music: false }));
      const error = fileRejections[0]?.errors[0]?.message || 'Invalid audio file';
      setError(`Music rejected: ${error}. Max size 25MB.`);
    }
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

    // Prevent submission if private access key is too short
    if (formData.profileVisibility === 'private' && formData.profileAccessKey && formData.profileAccessKey.length < 4) {
      setError('Profile access key must be at least 4 characters long.');
      setIsUploading(false);
      setIsSaving(false);
      return;
    }

    // Golden rule: spaces are stored as underscores, displayed as spaces
    const normalizedUsername = trimmedUsername.replace(/\s+/g, '_');

    try {
      const submitData = new FormData();
      submitData.append('username', normalizedUsername);
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

      // Password change validation (will be sent to separate endpoint)
      let passwordChangeError = null;
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          passwordChangeError = 'Current password is required to change password';
        } else if (formData.newPassword !== formData.confirmPassword) {
          passwordChangeError = 'New passwords do not match';
        }
        if (passwordChangeError) {
          setError(passwordChangeError);
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
      }

      // Upload avatar first if selected
      let avatarKey = null;
      if (selectedFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('file', selectedFile);
        avatarFormData.append('purpose', 'avatars');
        const uploadResponse = await api.post('/api/v1/uploads/media', avatarFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          }
        });
        avatarKey = uploadResponse?.data?.key || null;
      }

      // If the actual username handle changed, update it first
      if (normalizedUsername !== user.username) {
        await api.patch('/api/v1/users/me/username', { username: normalizedUsername });
      }

      // Update profile via PATCH /api/v1/users/me
      // Note: user_color must be 6-digit hex (#RRGGBB) - convert 3-digit to 6-digit if needed
      let normalizedUserColor = formData.userColor;
      if (normalizedUserColor && /^#[0-9a-fA-F]{3}$/.test(normalizedUserColor)) {
        // Convert 3-digit hex to 6-digit: #RGB -> #RRGGBB
        normalizedUserColor = '#' + normalizedUserColor[1] + normalizedUserColor[1] + normalizedUserColor[2] + normalizedUserColor[2] + normalizedUserColor[3] + normalizedUserColor[3];
      }
      const profilePayload = {
        display_username: formData.username !== undefined ? formData.username : undefined,
        bio: formData.bio !== undefined ? formData.bio : undefined,
        user_color: normalizedUserColor || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
        profile_visibility: formData.profileVisibility === 'private' 
          ? (formData.profileAccessKey ? 'key-gated' : 'private')
          : (formData.profileVisibility || undefined),
        profile_access_key: formData.profileVisibility === 'private'
          ? (String(formData.profileAccessKey || '').trim() || undefined)
          : undefined,
        profile_portrait_x: portraitX,
        profile_portrait_y: portraitY,
        profile_portrait_zoom: String(portraitZoom),
        country: formData.country || null,
        avatar_key: selectedFile ? avatarKey : undefined,
        avatar_size: selectedFile ? selectedFile.size : undefined,
      };

      let response = await api.patch('/api/v1/users/me', profilePayload);

      // Change password via dedicated endpoint if provided
      if (formData.newPassword) {
        try {
          await api.post('/api/v1/auth/change-password', {
            current_password: formData.currentPassword,
            new_password: formData.newPassword,
          });
          // Clear password fields on success
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }));
        } catch (pwdError) {
          console.error('Password change error:', pwdError);
          const pwdMsg = pwdError?.response?.data?.error || 'Failed to change password';
          setError(pwdMsg);
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
      }

      // Change email via dedicated endpoint if it changed
      if (formData.email && formData.email !== user?.email) {
        try {
          const emailResponse = await api.post('/api/v1/auth/change-email', {
            new_email: formData.email,
          });
          // Update local user state with new email
          if (emailResponse.data?.user) {
            await updateProfile(emailResponse.data.user);
          }
        } catch (emailError) {
          console.error('Email change error:', emailError);
          const emailMsg = emailError?.response?.data?.error || 'Failed to change email';
          setError(emailMsg);
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
      }

      // Avatar update is now handled by the PATCH /api/v1/users/me call above
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

        // Profile modules go to a separate endpoint
        // PUT /api/v1/profile/modules accepts one module at a time
        // Sync each module individually
        for (const mod of nextProfileModules) {
          await api.put('/api/v1/profile/modules', {
            module_key: mod.module_key || mod.id,
            position: mod.position,
            enabled: mod.enabled,
            config: mod.config,
          });
        }

        // Handle Music Upload/Removal if changed
        if (musicFile) {
          try {
            const musicFormData = new FormData();
            musicFormData.append('file', musicFile);
            musicFormData.append('purpose', 'music');
            const musicUploadResponse = await api.post('/api/v1/uploads/media', musicFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (progressEvent) => {
                const progress = (progressEvent.loaded / progressEvent.total) * 100;
                setUploadProgress(progress);
              }
            });
            const musicKey = musicUploadResponse?.data?.key;
            const mResponse = await api.patch('/api/v1/users/me/music', { 
              music_media_key: musicKey,
              music_size: musicFile.size
            });
            setMusicData(mResponse.data);
            setMusicFile(null);
            setMusicPreview(null);
            setFileInfo(prev => ({ ...prev, music: null }));
          } catch (musicErr) {
            console.error('Music upload during save error:', musicErr);
            setError('Profile saved, but music upload failed: ' + (musicErr.response?.data?.error || musicErr.message));
          }
        } else if (musicRemoved) {
          try {
            const mResponse = await api.patch('/api/v1/users/me/music', { music_media_key: null });
            setMusicData(mResponse.data);
            setMusicRemoved(false);
          } catch (musicErr) {
            console.error('Music removal during save error:', musicErr);
            setError('Profile saved, but failed to remove music: ' + (musicErr.response?.data?.error || musicErr.message));
          }
        }

        // Only send valid preference fields to /api/v1/profile/preferences
        // date_of_birth, user_color, profile_visibility, profile_access_key are handled by /api/v1/users/me
        const preferencePayload = {};
        // Note: portrait settings are not currently supported by backend preferences
        // Keeping localStorage in sync for now
        if (user?.id) {
          localStorage.setItem(`user_color_pref_user_${user.id}`, normalizedUserColor || '#4f7cff');
          if (formData.dateOfBirth) {
            localStorage.setItem(`date_of_birth_user_${user.id}`, formData.dateOfBirth);
          } else {
            localStorage.removeItem(`date_of_birth_user_${user.id}`);
          }
          localStorage.setItem(`profile_visibility_user_${user.id}`, formData.profileVisibility === 'private' ? 'private' : 'public');
          if (formData.profileVisibility === 'private' && String(formData.profileAccessKey || '').trim()) {
            localStorage.setItem(`profile_access_key_user_${user.id}`, String(formData.profileAccessKey || '').trim());
          } else {
            localStorage.removeItem(`profile_access_key_user_${user.id}`);
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
        setError('Failed to sync profile modules or preferences: ' + (prefError?.response?.data?.error || prefError?.message || String(prefError)));
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
      
      // Attempt to extract the most descriptive error message possible
      let errorMessage = 'Failed to update profile';
      
      if (err.response?.data) {
        const data = err.response.data;
        // Check for common error structures (error, message, or Zod issues)
        if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (Array.isArray(data.issues)) {
          // Handle Zod validation issues specifically
          errorMessage = data.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Map error message to field for shake animation
      if (errorMessage.toLowerCase().includes('username')) setErrorField('username');
      else if (errorMessage.toLowerCase().includes('email')) setErrorField('email');
      else if (errorMessage.toLowerCase().includes('password')) setErrorField('password');
      else setErrorField('general');
      
      setTimeout(() => setErrorField(''), 1000);
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
      // Upload music file first
      const musicFormData = new FormData();
      musicFormData.append('file', musicFile);
      musicFormData.append('purpose', 'music');
      const uploadResponse = await api.post('/api/v1/uploads/media', musicFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
        }
      });
      const musicKey = uploadResponse?.data?.key;

      // Update music metadata
      const response = await api.patch('/api/v1/users/me/music', { 
        music_media_key: musicKey,
        music_size: musicFile.size
      });
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
        background: appCanvasBackground,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            Profile Settings
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            User ID: {user?.id}
          </Typography>
        </Box>
        
        
        {/* Error messages are shown via Snackbar at bottom-center — see below */}
        
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
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
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
                      width: '100%',
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
                      userColor={formData.userColor}
                      isRestricted={user?.is_restricted || user?.is_suspended}
                      sx={{
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    />
                    <Box sx={{ textAlign: 'center' }}>
                      <CloudUploadIcon color="primary" sx={{ mb: 1 }} />
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                        Change Avatar
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>

                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, opacity: 0.8 }}>
                    Trading Card Preview
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', transformOrigin: 'top center' }}>
                    <TradingCard
                      imageUrl={previewUrl || user?.avatar_url || ''}
                      imageAlt={displayUsername(formData.username)}
                      label="PROFILE"
                      title={String(displayUsername(formData.username) || '').toUpperCase()}
                      isRestricted={user?.is_restricted || user?.is_suspended}
                      frameSx={{
                        width: { xs: 180, sm: 210 },
                        height: { xs: 266, sm: 310 },
                      }}
                      imageSx={{
                        objectFit: (selectedFile !== null || (portraitX === 50 && portraitY === 50 && portraitZoom === 1)) ? 'contain' : 'cover',
                        transform: `translate(${(portraitX - 50) * 0.9}%, ${(portraitY - 50) * 0.9}%) scale(${portraitZoom})`,
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={8} md={9}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Profile Information
                    </Typography>
                  </Box>
                </Grid>

                {/* Portrait Adjustment Sliders */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                      Trading Card Portrait Adjustment
                    </Typography>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" color="textSecondary">Horizontal Position (X)</Typography>
                        <Slider
                          value={portraitX}
                          onChange={handlePortraitXChange}
                          min={-40}
                          max={140}
                          valueLabelDisplay="auto"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" color="textSecondary">Vertical Position (Y)</Typography>
                        <Slider
                          value={portraitY}
                          onChange={handlePortraitYChange}
                          min={-40}
                          max={140}
                          valueLabelDisplay="auto"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" color="textSecondary">Zoom Level</Typography>
                        <Slider
                          value={portraitZoom}
                          onChange={handlePortraitZoomChange}
                          min={1}
                          max={4.8}
                          step={0.1}
                          valueLabelDisplay="auto"
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={displayUsername(formData.username)}
                    onChange={handleInputChange}
                    error={errorField === 'username'}
                    helperText={errorField === 'username' ? error : "Spaces are allowed and encouraged!"}
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
                    error={errorField === 'email'}
                    InputProps={{
                      readOnly: blurEmail, // Make it read-only when blurred for better UX
                    }}
                    helperText={errorField === 'email' ? error : (blurEmail ? "Email is masked for privacy" : "")}
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
                    error={errorField === 'bio'}
                    helperText={errorField === 'bio' ? error : ""}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  {/* Dummy inputs to absorb browser autofill and keep fields empty */}
                  <input type="text" name="dummy_username" style={{ display: 'none' }} autoComplete="username" />
                  <input type="password" name="dummy_password" style={{ display: 'none' }} autoComplete="current-password" />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    error={errorField === 'password'}
                    autoComplete="new-password"
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
                    error={errorField === 'password'}
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
                    error={errorField === 'password'}
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
              
              {(musicPreview || (!musicRemoved && (musicData?.music_url || musicData?.music_media_url))) && (
                <Box sx={{ mt: 2, position: 'relative' }}>
                  <MusicPlayer url={musicPreview || musicData?.music_url || musicData?.music_media_url} />
                  <IconButton
                    size="small"
                    onClick={handleMusicRemove}
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      color: theme.palette.error.main,
                      '&:hover': {
                        bgcolor: theme.palette.error.main,
                        color: '#fff',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease',
                      zIndex: 2
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
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
              <Divider sx={{ my: 2 }} />
            </Grid>            {/* Preferences Section */}
            <Grid item xs={12}>
              <Box sx={getGlassDialogPaperSx(theme)}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  mb: 3, 
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)'
                }}>
                  <InfoIcon color="primary" /> Preferences
                </Typography>
                
                <Stack spacing={3}>
                  {/* Email Blur */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <VisibilityOffIcon sx={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Email Blur</Typography>
                        <Typography variant="caption" color="textSecondary">Hides your email address from casual view</Typography>
                      </Box>
                    </Box>
                    <Switch 
                      checked={blurEmail}
                      onChange={handleBlurEmailChange}
                      color="primary"
                    />
                  </Box>

                  {/* Home Country */}
                  <Box sx={{ 
                    p: 2,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <LanguageIcon sx={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Home Country</Typography>
                        <Typography variant="caption" color="textSecondary">Represent where you live on your public profile</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ ml: 6 }}>
                      <Autocomplete
                        options={countries}
                        getOptionLabel={(option) => option.label}
                        value={countries.find(c => c.code === formData.country) || null}
                        onChange={handleCountryChange}
                        renderOption={(props, option) => {
                          const { key, ...optionProps } = props;
                          return (
                            <Box 
                              key={key} 
                              component="li" 
                              sx={{ py: '10px !important', px: '16px !important', fontSize: '0.95rem' }} 
                              {...optionProps}
                            >
                              <Box 
                                component="img"
                                loading="lazy"
                                src={getFlagUrl(option.code)}
                                alt=""
                                sx={{ 
                                  width: 24, 
                                  height: 'auto', 
                                  mr: 2, 
                                  borderRadius: '2px', 
                                  boxShadow: '0 0 2px rgba(0,0,0,0.2)',
                                  flexShrink: 0
                                }}
                              />
                              {option.label} ({option.code})
                            </Box>
                          );
                        }}
                        renderInput={(params) => {
                          const selectedCountry = countries.find(c => c.code === formData.country);
                          return (
                            <TextField
                              {...params}
                              placeholder="Choose where you live"
                              sx={getGlassInputSx(theme)}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    {params.InputProps.startAdornment}
                                    {selectedCountry && (
                                      <InputAdornment position="start" sx={{ pl: 1, mr: -0.5 }}>
                                        <Box 
                                          component="img"
                                          loading="lazy"
                                          src={getFlagUrl(selectedCountry.code)}
                                          alt=""
                                          sx={{ 
                                            width: 24, 
                                            height: 'auto', 
                                            borderRadius: '2px', 
                                            boxShadow: '0 0 2px rgba(0,0,0,0.2)',
                                            display: 'block'
                                          }}
                                        />
                                      </InputAdornment>
                                    )}
                                  </>
                                ),
                              }}
                            />
                          );
                        }}
                        sx={{
                          '& .MuiAutocomplete-paper': {
                            ...getGlassDialogPaperSx(theme),
                            mt: 1
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Date of Birth */}
                  <Box sx={{ 
                    p: 2,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CakeIcon sx={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Date of Birth</Typography>
                      </Box>
                      {!showDobInput && formData.dateOfBirth && (
                        <Button 
                          variant="text" 
                          size="small" 
                          onClick={handleDobReset}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                          Change
                        </Button>
                      )}
                    </Box>
                    
                    {!showDobInput && formData.dateOfBirth ? (
                      <Box sx={{ ml: 6 }}>
                        <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                          {formatDobForDisplay(formData.dateOfBirth)} 
                          <Typography component="span" variant="caption" sx={{ ml: 1.5, opacity: 0.7, fontWeight: 400 }}>
                            • {calculateAgeFromDob(formData.dateOfBirth) ?? 'N/A'} years old
                          </Typography>
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ ml: 6 }}>
                        <TextField
                          type="date"
                          fullWidth
                          value={formData.dateOfBirth || ''}
                          onChange={handleDateOfBirthChange}
                          inputProps={{ max: new Date().toISOString().split('T')[0] }}
                          sx={getGlassInputSx(theme)}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Identity Color */}
                  <Box sx={{ 
                    p: 2,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <PaletteIcon sx={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>Identity Color</Typography>
                        <Typography variant="caption" color="textSecondary">Used for your name and highlights across the site</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ ml: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box 
                        sx={{ 
                          position: 'relative',
                          width: 50,
                          height: 50,
                          borderRadius: '16px',
                          bgcolor: formData.userColor || '#4f7cff',
                          boxShadow: `0 8px 20px ${(formData.userColor || '#4f7cff')}44`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          border: '3px solid rgba(255,255,255,0.2)',
                          '&:hover': { transform: 'scale(1.1) rotate(5deg)' }
                        }}
                        onClick={() => document.getElementById('identity-color-picker').click()}
                      >
                         <input
                          id="identity-color-picker"
                          type="color"
                          value={formData.userColor || '#4f7cff'}
                          onChange={handleUserColorChange}
                          style={{
                            opacity: 0,
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 800, 
                          letterSpacing: '0.1em',
                          fontFamily: 'monospace',
                          opacity: 0.9
                        }}>
                          {String(formData.userColor || '#4f7cff').toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Privacy Section */}
                  <Box sx={{ 
                    p: 2,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LockIcon sx={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>Private Profile</Typography>
                          <Typography variant="caption" color="textSecondary">Limit visibility and require an access key</Typography>
                        </Box>
                      </Box>
                      <Switch
                        checked={formData.profileVisibility === 'private'}
                        onChange={handleProfileVisibilityChange}
                        color="primary"
                      />
                    </Box>

                    <AnimatePresence>
                      {formData.profileVisibility === 'private' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <Box sx={{ ml: 6, pt: 1 }}>
                            <TextField
                              fullWidth
                              type="password"
                              label="Profile Access Key"
                              placeholder="Create a key for viewers..."
                              value={formData.profileAccessKey || ''}
                              onChange={handleProfileAccessKeyChange}
                              error={formData.profileVisibility === 'private' && !!formData.profileAccessKey && formData.profileAccessKey.length < 4}
                              helperText={
                                (formData.profileVisibility === 'private' && !!formData.profileAccessKey && formData.profileAccessKey.length < 4)
                                  ? "Access key must be at least 4 characters long."
                                  : "Share this key with viewers you want to temporarily allow."
                              }
                              inputProps={{ maxLength: 120 }}
                              sx={getGlassInputSx(theme)}
                            />
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>

                  {/* Dark Mode */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <DarkModeIcon sx={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>Dark Theme</Typography>
                    </Box>
                    <Switch 
                      checked={isDarkMode}
                      onChange={handleThemeChange}
                      color="primary"
                    />
                  </Box>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={getGlassDialogPaperSx(theme)}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  mb: 2, 
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)'
                }}>
                  <DashboardIcon color="primary" /> Profile Modules
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, ml: 5 }}>
                  Configure module visibility for your profile.
                </Typography>

                <Stack spacing={3}>
                  <Box sx={{ 
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: theoryBoardModuleEnabled 
                      ? alpha(theme.palette.success.main, 0.2) 
                      : 'transparent',
                    transition: 'all 0.3s ease',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: 1.5, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main
                        }}>
                          <DashboardIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Theory Board</Typography>
                          <Typography variant="caption" color="textSecondary">Share your latest theories and insights</Typography>
                        </Box>
                      </Box>
                      <Chip
                        size="small"
                        color={theoryBoardModuleEnabled ? 'success' : 'default'}
                        label={theoryBoardModuleEnabled ? 'ACTIVE' : 'INACTIVE'}
                        sx={{ fontWeight: 800, borderRadius: 1.5, height: 24, fontSize: '0.65rem' }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
                      <FormControlLabel
                        control={(
                          <Switch
                            checked={theoryBoardModuleEnabled}
                            onChange={handleTheoryBoardModuleEnabledChange}
                            color="primary"
                          />
                        )}
                        label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Visible on profile</Typography>}
                        sx={{ ml: 0 }}
                      />
                      
                      <AnimatePresence>
                        {theoryBoardModuleEnabled && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <TextField
                              fullWidth
                              label="Board Custom Name"
                              placeholder="e.g. Conspiracy, Ideas, Research"
                              value={theoryBoardTitle}
                              onChange={handleTheoryBoardTitleChange}
                              sx={getGlassInputSx(theme)}
                              helperText="The suffix 'Board' will be added automatically."
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>

                  {/* Texts Module Toggle */}
                  <Box sx={{ 
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: textsModuleEnabled 
                      ? alpha(theme.palette.success.main, 0.2) 
                      : 'transparent',
                    transition: 'all 0.3s ease',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: 1.5, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main
                        }}>
                          <InfoIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Texts & Notes</Typography>
                          <Typography variant="caption" color="textSecondary">General profile text content and notes</Typography>
                        </Box>
                      </Box>
                      <Chip
                        size="small"
                        color={textsModuleEnabled ? 'success' : 'default'}
                        label={textsModuleEnabled ? 'ACTIVE' : 'INACTIVE'}
                        sx={{ fontWeight: 800, borderRadius: 1.5, height: 24, fontSize: '0.65rem' }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
                      <FormControlLabel
                        control={(
                          <Switch
                            checked={textsModuleEnabled}
                            onChange={handleTextsModuleEnabledChange}
                            color="primary"
                          />
                        )}
                        label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Visible on profile</Typography>}
                        sx={{ ml: 0 }}
                      />

                      <AnimatePresence>
                        {textsModuleEnabled && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <TextField
                              select
                              fullWidth
                              label="Text Overflow Mode"
                              value={textsOverflowMode}
                              onChange={handleTextsOverflowModeChange}
                              sx={getGlassInputSx(theme)}
                              helperText="Manual: You pick which texts show. FIFO: Oldest are hidden automatically."
                            >
                              <MenuItem value="manual">Manual Selection</MenuItem>
                              <MenuItem value="fifo">Automatic (FIFO)</MenuItem>
                            </TextField>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
          </Grid>
        </Box>

        {/* Error Snackbar — bottom-center, consistent with success */}
        <Snackbar
          open={Boolean(error) && !error.includes('music')}
          autoHideDuration={8000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            onClose={() => setError('')}
            sx={{ width: '100%' }}
            elevation={6}
          >
            {error}
          </Alert>
        </Snackbar>

        {/* Success Snackbar — bottom-center */}
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
        {(hasUnsavedChanges || showSavedState || !!selectedFile || !!musicFile || musicRemoved) && (
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
