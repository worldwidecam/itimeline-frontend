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
  IconButton
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Label as TagIcon,
  People as CommunityIcon,
  FavoriteBorder as HeartIcon,
  Lock as LockIcon,
  Add as AddIcon
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

const HashtagChips = ({ tags = [] }) => {
  const theme = useTheme();
  if (!tags.length) return null;

  const visible = tags.slice(0, 5);
  const extra = tags.length > 5 ? tags.length - 5 : 0;

  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
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
            sx={{
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
}) => {
  const theme = useTheme();
  const [hashtagDropdownOpen, setHashtagDropdownOpen] = React.useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = React.useState(false);
  const [personalDropdownOpen, setPersonalDropdownOpen] = React.useState(false);

  const renderColumnHeader = (label, dropdownOpen, setDropdownOpen, color) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
        {label}
      </Typography>
      <IconButton
        size="small"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        sx={{
          padding: '2px',
          color: alpha(color, 0.7),
          '&:hover': {
            backgroundColor: alpha(color, 0.1),
            color: color,
          },
        }}
      >
        <AddIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );

  const renderAddDropdown = (options, value, onChange, disabled, color, isOpen) => {
    if (!isOpen) return null;
    return (
      <Box sx={{ mb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Autocomplete
          size="small"
          options={options}
          getOptionLabel={(opt) => opt.name || ''}
          value={value}
          loading={loadingTimelines}
          onChange={(e, newVal) => onChange(newVal)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Search..." variant="outlined" size="small" />
          )}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          disabled={!value || disabled}
          onClick={() => onAddToTimeline(value)}
          sx={{
            minWidth: 'auto',
            px: 1.5,
            textTransform: 'none',
            backgroundColor: color,
            '&:hover': {
              backgroundColor: alpha(color, 0.9),
            },
          }}
        >
          {addingToTimeline ? '...' : 'Add'}
        </Button>
      </Box>
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 2,
        }}
      >
        {/* Hashtag lane */}
        <Box>
          {renderColumnHeader('Hashtags', hashtagDropdownOpen, setHashtagDropdownOpen, theme.palette.primary.main)}
          {renderAddDropdown(
            hashtagOptions,
            selectedHashtag,
            setSelectedHashtag,
            addingToTimeline,
            theme.palette.primary.main,
            hashtagDropdownOpen
          )}
          <HashtagChips tags={hashtagTags} />
        </Box>

        {/* Community lane */}
        <Box>
          {renderColumnHeader('Communities', communityDropdownOpen, setCommunityDropdownOpen, theme.palette.secondary.main)}
          {renderAddDropdown(
            communityOptions,
            selectedCommunity,
            setSelectedCommunity,
            addingToTimeline,
            theme.palette.secondary.main,
            communityDropdownOpen
          )}
          {communities.length > 0 && (
            <Pill
              label="Communities"
              count={communities.length}
              icon={<CommunityIcon sx={{ fontSize: 16 }} />}
              color={theme.palette.secondary.main}
            />
          )}
        </Box>

        {/* Personal lane */}
        <Box>
          {renderColumnHeader('Personals', personalDropdownOpen, setPersonalDropdownOpen, theme.palette.primary.main)}
          {renderAddDropdown(
            personalOptions,
            selectedPersonal,
            setSelectedPersonal,
            addingToTimeline,
            theme.palette.primary.main,
            personalDropdownOpen
          )}
          {personals.length > 0 && (
            <Pill
              label="Personals"
              count={personals.length}
              icon={<PersonalIcon />}
              color={theme.palette.primary.main}
            />
          )}
        </Box>
      </Box>

      {(error || success) && (
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && !error && <Alert severity="success">{success}</Alert>}
        </Box>
      )}

      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

export default PopupTimelineLanes;
