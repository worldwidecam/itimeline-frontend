import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Autocomplete,
  TextField,
  Button,
  Tooltip,
  useTheme,
  Divider,
  Alert,
  IconButton,
  Collapse,
  Paper,
  Avatar
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  People as CommunityIcon,
  FavoriteBorder as HeartIcon,
  Lock as LockIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import HashtagIcon from '../../common/HashtagIcon';
import api from '../../../utils/api';

const hslToHex = (h, s, l) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const stringToColor = (str, isDarkMode) => {
  if (typeof str !== 'string') str = String(str || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Multiply by 137 to perfectly scatter adjacent hashes far apart in the hue space!
  const hue = Math.abs((hash * 137) % 360);
  // Glowing text on dark mode (85% saturation, 65% lightness), high contrast text on light mode (75% saturation, 40% lightness)
  const s = isDarkMode ? 85 : 75;
  const l = isDarkMode ? 65 : 40;
  return hslToHex(hue, s, l);
};

const getMedalColors = (index, isDarkMode) => {
  if (index === 0) {
    // Gold: Brilliant, glowing sunlit yellow-gold
    return {
      bg: isDarkMode ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.18)',
      text: isDarkMode ? '#FFE066' : '#A37D00',
      border: isDarkMode ? 'rgba(255, 215, 0, 0.4)' : 'rgba(163, 125, 0, 0.35)',
    };
  }
  if (index === 1) {
    // Silver: Sleek, clean polished slate-silver
    return {
      bg: isDarkMode ? 'rgba(226, 232, 240, 0.15)' : 'rgba(148, 163, 184, 0.15)',
      text: isDarkMode ? '#F1F5F9' : '#475569',
      border: isDarkMode ? 'rgba(226, 232, 240, 0.4)' : 'rgba(71, 85, 105, 0.4)',
    };
  }
  if (index === 2) {
    // Bronze: Vibrant, fiery metallic copper-orange (highly distinct from Gold)
    return {
      bg: isDarkMode ? 'rgba(205, 127, 50, 0.15)' : 'rgba(249, 115, 22, 0.15)',
      text: isDarkMode ? '#FFB077' : '#D84B06',
      border: isDarkMode ? 'rgba(205, 127, 50, 0.4)' : 'rgba(216, 75, 6, 0.35)',
    };
  }
  return null;
};

const PersonalIcon = () => (
  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <HeartIcon sx={{ fontSize: 16 }} />
    <LockIcon
      sx={{
        fontSize: 10,
        position: 'absolute',
        bottom: -1,
        right: -1,
      }}
    />
  </Box>
);

const Pill = ({ label, count, icon, color }) => {
  const theme = useTheme();
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        height: 24,
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(color, 0.2)
          : alpha(color, 0.08),
        color: theme.palette.mode === 'dark'
          ? theme.palette.common.white
          : color,
        borderRadius: 1.5,
        position: 'relative',
        '& .MuiChip-label': {
          px: 1.5,
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'Lobster, cursive',
        },
        '& .MuiChip-icon': {
          mr: 0.5,
          ml: 0.5,
        },
        '&::after': {
          content: `"${count}"`,
          position: 'absolute',
          top: -4,
          right: -4,
          minWidth: 14,
          height: 14,
          borderRadius: '999px',
          backgroundColor: color,
          color: theme.palette.common.white,
          fontSize: '0.65rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 3px',
        },
      }}
    />
  );
};

const HashtagChips = ({ tags = [], fullMode = false, maxHeight = '200px' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  if (!tags.length) return null;

  // Handle hashtag click - open timeline in same tab by default
  const handleHashtagClick = async (e, tagName) => {
    e.stopPropagation();
    try {
      // Strip any leading # and convert to uppercase for hashtag timeline name
      const baseName = (tagName || '').replace(/^#+/, '');
      const slug = baseName.toUpperCase();
      const response = await api.get(`/api/v1/timelines/by-slug/${encodeURIComponent(slug)}`);
      const route = response.data && response.data.id
        ? `/timeline-v3/${response.data.id}`
        : `/timeline-v3/new?name=${encodeURIComponent(slug)}`;
      
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
        window.open(route, '_blank');
      } else {
        navigate(route);
      }
    } catch (error) {
      console.error('Error fetching timeline for tag:', tagName, error);
      const baseName = (tagName || '').replace(/^#+/, '');
      const fallbackName = baseName.toUpperCase();
      const route = `/timeline-v3/new?name=${encodeURIComponent(fallbackName)}`;
      
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
        window.open(route, '_blank');
      } else {
        navigate(route);
      }
    }
  };

  // In full mode (popups), show all tags with scrolling
  // In compact mode (cards), show only 5 tags with overflow count
  const visible = fullMode ? tags : tags.slice(0, 5);
  const extra = !fullMode && tags.length > 5 ? tags.length - 5 : 0;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 0.75, 
        flexWrap: 'wrap', 
        mb: 1,
        ...(fullMode && {
          maxHeight: maxHeight,
          overflowY: 'auto',
          pr: 0.5, // Padding for scrollbar space
        })
      }}
    >
      {visible.map((tagName, idx) => {
        const isDarkMode = theme.palette.mode === 'dark';
        const medalColors = getMedalColors(idx, isDarkMode);
        const tagColor = medalColors ? medalColors.text : stringToColor(tagName, isDarkMode);
        const bg = medalColors ? medalColors.bg : (isDarkMode ? alpha(tagColor, 0.15) : alpha(tagColor, 0.08));
        const border = medalColors ? medalColors.border : alpha(tagColor, 0.25);

        return (
          <Chip
            key={`${tagName}-${idx}`}
            icon={(
              <HashtagIcon
                fontSize="small"
                sx={{
                  color: isDarkMode ? 'inherit' : tagColor,
                  marginLeft: 0,
                }}
              />
            )}
            label={tagName}
            size="small"
            onClick={(e) => handleHashtagClick(e, tagName)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: medalColors 
                  ? (isDarkMode ? alpha(tagColor, 0.25) : alpha(tagColor, 0.14))
                  : (isDarkMode ? alpha(tagColor, 0.25) : alpha(tagColor, 0.16)),
                borderColor: medalColors ? border : alpha(tagColor, 0.45),
              },
              height: 24,
              backgroundColor: bg,
              color: tagColor,
              border: `1px solid ${border}`,
              borderRadius: 1.5,
              '& .MuiChip-label': {
                px: 1,
                fontSize: '0.75rem',
                fontWeight: medalColors ? 600 : 500,
              },
              '& .MuiChip-icon': {
                mr: 0.5,
                ml: 0.5,
              },
            }}
          />
        );
      })}
      {extra > 0 && (
        <Chip
          label={`+${extra}`}
          size="small"
          sx={{
            height: 24,
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.2)
              : alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.mode === 'dark'
              ? theme.palette.common.white
              : theme.palette.primary.main,
            borderRadius: 1.5,
            '& .MuiChip-label': {
              px: 1,
              fontSize: '0.75rem',
              fontWeight: 500,
            },
          }}
        />
      )}
    </Box>
  );
};

const PopupTimelineLanes = ({
  hashtagTags = [],
  communities = [],
  personals = [],
  hashtagOptions = [],
  communityOptions = [],
  personalOptions = [],
  selectedHashtag,
  setSelectedHashtag,
  selectedCommunity,
  setSelectedCommunity,
  selectedPersonal,
  setSelectedPersonal,
  onAddToTimeline,
  addingToTimeline,
  loadingTimelines,
  error,
  success,
  currentUserId,
  showPrivacyWarningGate = false,
  onAcknowledgePrivacyWarning,
  isRestricted = false,
  shakeHashtag = false,
  shakeCommunity = false,
  shakePersonal = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [hashtagDropdownOpen, setHashtagDropdownOpen] = React.useState(false);
  const [communityListOpen, setCommunityListOpen] = React.useState(false);
  const [personalListOpen, setPersonalListOpen] = React.useState(false);

  // Toggle handlers that close the other list when opening one
  const handleCommunityToggle = () => {
    if (!communityListOpen) {
      setPersonalListOpen(false); // Close personals when opening communities
    }
    setCommunityListOpen(!communityListOpen);
  };

  const handlePersonalToggle = () => {
    if (!personalListOpen) {
      setCommunityListOpen(false); // Close communities when opening personals
    }
    setPersonalListOpen(!personalListOpen);
  };

  if (showPrivacyWarningGate) {
    return (
      <Box
        sx={{
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'warning.main',
          bgcolor: 'rgba(255, 244, 229, 0.92)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 1.25,
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 2, sm: 2.5 },
        }}
      >
        <Typography sx={{ fontWeight: 800, color: 'warning.dark', fontSize: '0.95rem' }}>
          Privacy Notice
        </Typography>
        <Typography sx={{ fontWeight: 600, color: 'warning.dark', maxWidth: 560, lineHeight: 1.4 }}>
          This event is currently in a private context (personal timeline or private timeline).
        </Typography>
        <Typography sx={{ color: 'warning.dark', maxWidth: 560, lineHeight: 1.4 }}>
          Adding or changing timeline associations can increase who can discover this event.
          Continue only if you want to proceed.
        </Typography>
        <Button
          variant="contained"
          color="warning"
          onClick={onAcknowledgePrivacyWarning}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          I understand, continue
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Header Row: Timeline Tags Title + Communities & Personals Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(0,0,0,0.9)',
          }}
        >
          Timeline Tags
        </Typography>
        
        {/* Communities & Personals Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {/* Communities Button */}
          <Chip
            icon={<CommunityIcon sx={{ fontSize: 16 }} />}
            label={`Communities ${communities.length > 0 ? `(${communities.length})` : ''}`}
            onClick={handleCommunityToggle}
            deleteIcon={communityListOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onDelete={handleCommunityToggle}
            sx={{
              height: 28,
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              color: theme.palette.secondary.main,
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
              },
              '& .MuiChip-deleteIcon': {
                color: theme.palette.secondary.main,
                '&:hover': {
                  color: theme.palette.secondary.main,
                },
              },
            }}
          />

          {/* Personals Button */}
          <Chip
            icon={<PersonalIcon />}
            label={`Personals ${personals.length > 0 ? `(${personals.length})` : ''}`}
            onClick={handlePersonalToggle}
            deleteIcon={personalListOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onDelete={handlePersonalToggle}
            sx={{
              height: 28,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
              '& .MuiChip-deleteIcon': {
                color: theme.palette.primary.main,
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Hashtags Section - Full width with add dropdown */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Hashtags
          </Typography>
          {!isRestricted && (
            <IconButton
              size="small"
              onClick={() => setHashtagDropdownOpen(!hashtagDropdownOpen)}
              sx={{
                padding: '2px',
                color: alpha(theme.palette.primary.main, 0.7),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                },
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
        
        {/* Hashtag Add Dropdown */}
        {hashtagDropdownOpen && (
          <Box 
            sx={{ 
              mb: 1.5, 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center',
              ...(shakeHashtag && {
                animation: 'shake-shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                '@keyframes shake-shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                  '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                }
              })
            }}
          >
            <Autocomplete
              size="small"
              options={hashtagOptions}
              getOptionLabel={(opt) => opt.name || ''}
              value={selectedHashtag}
              loading={loadingTimelines}
              onChange={(e, newVal) => {
                if (typeof newVal === 'string') {
                  setSelectedHashtag({ id: null, name: newVal, type: 'hashtag' });
                } else {
                  setSelectedHashtag(newVal);
                }
              }}
              freeSolo
              isOptionEqualToValue={(option, value) => option?.id === value?.id || option?.name === value?.name}
              filterOptions={(options, state) => {
                // If no input, return empty array to act as a pure narrowing auto-complete
                if (!state.inputValue || state.inputValue.trim() === '') {
                  return [];
                }
                // Otherwise use default filtering
                const filtered = options.filter(option =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                );
                return filtered;
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                return (
                  <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <HashtagIcon size={14} color={theme.palette.primary.main} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Search hashtags..." 
                  variant="outlined" 
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.background.paper, 0.5),
                      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
                      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.4) },
                      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                    }
                  }}
                />
              )}
              sx={{ flex: 1, maxWidth: '300px' }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!selectedHashtag || addingToTimeline}
              onClick={() => onAddToTimeline(selectedHashtag)}
              sx={{
                minWidth: 'auto',
                height: 40,
                px: 2,
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: theme.palette.primary.main,
                boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.9),
                  boxShadow: `0 6px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              {addingToTimeline ? '...' : 'Add'}
            </Button>
          </Box>
        )}
        
        {/* Hashtag Chips */}
        <HashtagChips tags={hashtagTags} fullMode={true} maxHeight="300px" />
      </Box>

      {/* Communities Expandable List */}
      <Collapse in={communityListOpen}>
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.secondary.main, 0.05),
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.secondary.main, fontWeight: 600 }}>
            Communities
          </Typography>
          
          {/* Add Community Section */}
          {!isRestricted && (
            <Box 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center',
                ...(shakeCommunity && {
                  animation: 'shake-shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                  '@keyframes shake-shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                  }
                })
              }}
            >
              <Autocomplete
                size="small"
                options={communityOptions}
                getOptionLabel={(opt) => opt.name || ''}
                value={selectedCommunity}
                loading={loadingTimelines}
                onChange={(e, newVal) => setSelectedCommunity(newVal)}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                filterOptions={(options, state) => {
                  // If no input, show only first 10 options
                  if (!state.inputValue || state.inputValue.trim() === '') {
                    return options.slice(0, 10);
                  }
                  // Otherwise use default filtering
                  return options.filter(option =>
                    option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                      <CommunityIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    placeholder="Search communities..." 
                    variant="outlined" 
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        '& fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.2) },
                        '&:hover fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.4) },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.secondary.main },
                      }
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                size="small"
                disabled={!selectedCommunity || addingToTimeline}
                onClick={() => onAddToTimeline(selectedCommunity)}
                sx={{
                  minWidth: 'auto',
                  height: 40,
                  px: 2,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: theme.palette.secondary.main,
                  boxShadow: `0 4px 10px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.9),
                    boxShadow: `0 6px 14px ${alpha(theme.palette.secondary.main, 0.4)}`,
                  },
                }}
              >
                {addingToTimeline ? '...' : 'Add'}
              </Button>
            </Box>
          )}
          
          {/* Communities List */}
          {communities.length > 0 ? (
            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
              {communities.map((community, idx) => (
                <Chip
                  key={idx}
                  icon={<CommunityIcon sx={{ fontSize: 14 }} />}
                  label={community.name || 'Community'}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (community.id) {
                      const route = `/timeline-v3/${community.id}`;
                      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
                        window.open(route, '_blank');
                      } else {
                        navigate(route);
                      }
                    }
                  }}
                  sx={{
                    mb: 0.5,
                    mr: 0.5,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                    },
                  }}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              No communities added yet
            </Typography>
          )}
        </Paper>
      </Collapse>

      {/* Personals Expandable List */}
      <Collapse in={personalListOpen}>
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: theme.palette.primary.main, fontWeight: 600 }}>
            Personals
          </Typography>
          
          {/* Add Personal Section */}
          {!isRestricted && (
            <Box 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center',
                ...(shakePersonal && {
                  animation: 'shake-shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                  '@keyframes shake-shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                  }
                })
              }}
            >
              <Autocomplete
                size="small"
                options={personalOptions}
                getOptionLabel={(opt) => {
                  const rawName = opt.name || '';
                  return rawName.replace(/'s\s+personal$/i, '').replace(/\s+personal$/i, '');
                }}
                value={selectedPersonal}
                loading={loadingTimelines}
                onChange={(e, newVal) => setSelectedPersonal(newVal)}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                filterOptions={(options, state) => {
                  // If no input, show only first 10 options
                  if (!state.inputValue || state.inputValue.trim() === '') {
                    return options.slice(0, 10);
                  }
                  // Otherwise use default filtering
                  return options.filter(option =>
                    option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box key={key} component="li" {...optionProps} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(option.name || '').replace(/'s\s+personal$/i, '').replace(/\s+personal$/i, '')}
                      </Typography>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    placeholder="Search personals..." 
                    variant="outlined" 
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.2) },
                        '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.4) },
                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                      }
                    }}
                  />
                )}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                size="small"
                disabled={!selectedPersonal || addingToTimeline}
                onClick={() => onAddToTimeline(selectedPersonal)}
                sx={{
                  minWidth: 'auto',
                  height: 40,
                  px: 2,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: theme.palette.primary.main,
                  boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.9),
                    boxShadow: `0 6px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                }}
              >
                {addingToTimeline ? '...' : 'Add'}
              </Button>
            </Box>
          )}
          
          {/* Personals List */}
          {personals.length > 0 ? (
            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
              {personals.map((personal, idx) => {
                const isOwner = personal.created_by && currentUserId && Number(personal.created_by) === Number(currentUserId);
                const displayName = isOwner 
                  ? (personal.display_name || personal.name || 'Personal') 
                  : (personal.owner_username || 'Personal');
                
                return (
                  <Chip
                    key={idx}
                    avatar={!isOwner ? (
                      personal.owner_avatar ? (
                        <Avatar src={personal.owner_avatar} sx={{ width: 18, height: 18 }} />
                      ) : (
                        <Avatar sx={{ width: 18, height: 18, bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
                          <PersonIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                        </Avatar>
                      )
                    ) : (
                      <PersonalIcon />
                    )}
                    label={displayName}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOwner && personal.id) {
                        const route = `/timeline-v3/${personal.id}`;
                        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
                          window.open(route, '_blank');
                        } else {
                          navigate(route);
                        }
                      } else if (!isOwner && personal.created_by) {
                        const route = `/profile/${personal.created_by}`;
                        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
                          window.open(route, '_blank');
                        } else {
                          navigate(route);
                        }
                      }
                    }}
                    sx={{
                      mb: 0.5,
                      mr: 0.5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      },
                      '& .MuiChip-label': {
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }
                    }}
                  />
                );
              })}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              No personals added yet
            </Typography>
          )}
        </Paper>
      </Collapse>

      {/* Error/Success Messages */}
      {(error || success) && (
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && !error && <Alert severity="success">{success}</Alert>}
        </Box>
      )}

    </Box>
  );
};

export default PopupTimelineLanes;
