import React from 'react';
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
  Label as TagIcon,
  People as CommunityIcon,
  FavoriteBorder as HeartIcon,
  Lock as LockIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 30%, 50%)`;
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
  if (!tags.length) return null;

  // Handle hashtag click - open timeline in new tab
  const handleHashtagClick = async (e, tagName) => {
    e.stopPropagation();
    try {
      // Strip any leading # and convert to uppercase for hashtag timeline name
      const baseName = (tagName || '').replace(/^#+/, '');
      const timelineName = baseName.toUpperCase();
      const response = await api.get(`/api/timeline-v3/name/${encodeURIComponent(timelineName)}`);
      if (response.data && response.data.id) {
        window.open(`/timeline-v3/${response.data.id}`, '_blank');
      } else {
        window.open(`/timeline-v3/new?name=${encodeURIComponent(timelineName)}`, '_blank');
      }
    } catch (error) {
      console.error('Error fetching timeline for tag:', tagName, error);
      const baseName = (tagName || '').replace(/^#+/, '');
      const fallbackName = baseName.toUpperCase();
      window.open(`/timeline-v3/new?name=${encodeURIComponent(fallbackName)}`, '_blank');
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
        const tagColor = stringToColor(tagName);
        return (
          <Chip
            key={`${tagName}-${idx}`}
            icon={(
              <TagIcon
                sx={{
                  fontSize: 14,
                  color: theme.palette.mode === 'dark' ? 'inherit' : tagColor,
                }}
              />
            )}
            label={tagName}
            size="small"
            onClick={(e) => handleHashtagClick(e, tagName)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(tagColor, 0.3)
                  : alpha(tagColor, 0.2),
              },
              height: 24,
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(tagColor, 0.2)
                : alpha(tagColor, 0.1),
              color: theme.palette.mode === 'dark'
                ? theme.palette.common.white
                : tagColor,
              borderRadius: 1.5,
              '& .MuiChip-label': {
                px: 1,
                fontSize: '0.75rem',
                fontWeight: 500,
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
}) => {
  const theme = useTheme();
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

  return (
    <Box>
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
        </Box>
        
        {/* Hashtag Add Dropdown */}
        {hashtagDropdownOpen && (
          <Box sx={{ mb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
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
                // If no input, show only first 10 options
                if (!state.inputValue || state.inputValue.trim() === '') {
                  return options.slice(0, 10);
                }
                // Otherwise use default filtering
                const filtered = options.filter(option =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase())
                );
                return filtered;
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Search hashtags..." variant="outlined" size="small" />
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
                px: 1.5,
                textTransform: 'none',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.9),
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
          <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
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
              renderInput={(params) => (
                <TextField {...params} placeholder="Search communities..." variant="outlined" size="small" />
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
                px: 1.5,
                textTransform: 'none',
                backgroundColor: theme.palette.secondary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.9),
                },
              }}
            >
              {addingToTimeline ? '...' : 'Add'}
            </Button>
          </Box>
          
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
                      window.open(`/timeline-v3/${community.id}`, '_blank');
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
          <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Autocomplete
              size="small"
              options={personalOptions}
              getOptionLabel={(opt) => opt.name || ''}
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
              renderInput={(params) => (
                <TextField {...params} placeholder="Search personals..." variant="outlined" size="small" />
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
                px: 1.5,
                textTransform: 'none',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.9),
                },
              }}
            >
              {addingToTimeline ? '...' : 'Add'}
            </Button>
          </Box>
          
          {/* Personals List */}
          {personals.length > 0 ? (
            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
              {personals.map((personal, idx) => {
                const isOwner = personal.created_by && currentUserId && Number(personal.created_by) === Number(currentUserId);
                const displayName = isOwner ? (personal.name || 'Personal') : (personal.owner_username || 'User');
                
                return (
                  <Chip
                    key={idx}
                    avatar={!isOwner ? (
                      personal.owner_avatar ? (
                        <Avatar src={personal.owner_avatar} />
                      ) : (
                        <PersonIcon sx={{ fontSize: 16 }} />
                      )
                    ) : (
                      <PersonalIcon />
                    )}
                    label={displayName}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOwner && personal.id) {
                        window.open(`/timeline-v3/${personal.id}`, '_blank');
                      } else if (!isOwner && personal.created_by) {
                        window.open(`/profile/${personal.created_by}`, '_blank');
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
                      '& .MuiChip-avatar': {
                        width: 18,
                        height: 18,
                        fontSize: '0.65rem'
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
