import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  TextField,
  Popper,
  Paper,
  Typography,
  CircularProgress,
  MenuList,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
  Link as LinkIcon,
  People as CommunityIcon,
  EventOutlined as EventOutlinedIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import HashtagIcon from './HashtagIcon';
import UserAvatar from './UserAvatar';
import { getFollowedUsers } from '../../utils/api';

/**
 * A unified RichEditor component that parses special triggers (@, #, i-, www., ~)
 * and displays an autocomplete popup for followed users (friends) when typing @.
 */
const RichEditor = ({
  value,
  onChange,
  disabled,
  readOnly = false,
  label = 'Description',
  placeholder,
  helperText = 'Use @ # i- www. or ~123 to add mentions, links, and event references',
  rows = 4,
  inputSx,
  variant = 'outlined',
  name = 'description',
  fullWidth = true,
  error = false,
  sx = {},
  inputRef,
  onKeyDown,
}) => {
  const theme = useTheme();
  const [cursorPos, setCursorPos] = useState(0);
  const [indicator, setIndicator] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const textFieldRef = useRef(null);
  const localInputRef = useRef(null);
  const resolvedInputRef = inputRef || localInputRef;

  const isUserMention = indicator?.type === 'user';

  // Fetch followed users (friends) when user mention is active
  useEffect(() => {
    if (!isUserMention) return;

    let active = true;
    const fetchFriends = async () => {
      try {
        setLoadingFriends(true);
        const list = await getFollowedUsers();
        if (active) {
          setFriends(list || []);
        }
      } catch (err) {
        console.error('[RichEditor] Error loading followed users:', err);
      } finally {
        if (active) {
          setLoadingFriends(false);
        }
      }
    };
    fetchFriends();
    return () => {
      active = false;
    };
  }, [isUserMention]);

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

  const handleSelectionChange = (e) => {
    const newCursorPos = e.target.selectionStart;
    setCursorPos(newCursorPos);

    const mention = detectMention(e.target.value, newCursorPos);
    if (mention) {
      setIndicator(mention);
      setAnchorEl(textFieldRef.current);
    } else {
      setIndicator(null);
      setAnchorEl(null);
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    handleSelectionChange(e);
  };

  const handleSelectFriend = (username) => {
    const text = value || '';
    const beforeCursor = text.substring(0, cursorPos);
    const afterCursor = text.substring(cursorPos);

    const atMatch = beforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (!atMatch) return;

    const atIndex = beforeCursor.length - atMatch[0].length;
    const prefix = text.substring(0, atIndex);

    const newValue = `${prefix}@${username} ${afterCursor}`;
    onChange(newValue);
    setIndicator(null);
    setAnchorEl(null);

    // Refocus the input element and place the cursor at the correct position
    setTimeout(() => {
      const actualInput = resolvedInputRef.current || textFieldRef.current?.querySelector('textarea') || textFieldRef.current?.querySelector('input');
      if (actualInput) {
        actualInput.focus();
        const newPos = atIndex + username.length + 2; // +1 for @, +1 for space
        actualInput.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const filteredFriends = useMemo(() => {
    if (indicator?.type !== 'user') return [];
    const partial = (indicator.partial || '').toLowerCase();
    return friends.filter(
      (f) =>
        f.username?.toLowerCase().includes(partial) ||
        f.name?.toLowerCase().includes(partial)
    );
  }, [friends, indicator]);

  // Reset keyboard navigation focus index when search changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [indicator?.partial, filteredFriends.length]);

  const handleKeyDown = (e) => {
    if (indicator && indicator.type === 'user' && filteredFriends.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % filteredFriends.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + filteredFriends.length) % filteredFriends.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedFriend = filteredFriends[focusedIndex];
        if (selectedFriend) {
          handleSelectFriend(selectedFriend.username);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIndicator(null);
        setAnchorEl(null);
      }
    } else if (onKeyDown) {
      onKeyDown(e);
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


  // Base styling guidelines matching theme variables
  const defaultTextFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      '& fieldset': {
        borderColor: 'divider',
      },
      '&:hover fieldset': {
        borderColor: 'primary.light',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        borderWidth: 2,
      },
    },
    '& .MuiInputBase-input': {
      padding: '14px 16px',
      fontSize: '0.95rem',
    },
  };

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto', ...sx }}>
      <TextField
        ref={textFieldRef}
        inputRef={resolvedInputRef}
        name={name}
        label={label}
        value={value}
        onChange={handleChange}
        onKeyUp={handleSelectionChange}
        onClick={handleSelectionChange}
        onKeyDown={handleKeyDown}
        multiline
        rows={rows}
        fullWidth={fullWidth}
        variant={variant}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        helperText={helperText}
        InputProps={{
          readOnly,
        }}
        InputLabelProps={{
          sx: {
            fontSize: '0.95rem',
            transform: 'translate(14px, -9px) scale(0.75)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
            '&.Mui-focused': {
              color: 'primary.main',
            },
          },
        }}
        sx={{ ...defaultTextFieldSx, ...inputSx }}
      />

      <Popper
        open={Boolean(indicator && anchorEl)}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <Paper
          sx={{
            mt: 1,
            maxHeight: 250,
            width: 250,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
                : '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.95)'
                : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isUserMention ? (
            <MenuList sx={{ py: 0 }}>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  opacity: 0.7,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Select Friend
                </Typography>
              </Box>
              {loadingFriends ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={20} />
                </Box>
              ) : filteredFriends.length > 0 ? (
                filteredFriends.map((friend, idx) => (
                  <MenuItem
                    key={friend.id}
                    selected={idx === focusedIndex}
                    onMouseDown={(e) => e.preventDefault()} // Keeps focus on TextField
                    onClick={() => handleSelectFriend(friend.username)}
                    sx={{
                      py: 1,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <UserAvatar
                      id={friend.id}
                      name={friend.username}
                      avatarUrl={friend.avatar_url || friend.avatar}
                      size={28}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, noWrap: true }}
                      >
                        {friend.username}
                      </Typography>
                      {friend.name && friend.name !== friend.username && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', noWrap: true }}
                        >
                          {friend.name}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No friends found
                  </Typography>
                </Box>
              )}
            </MenuList>
          ) : (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: indicator?.color,
              }}
            >
              {getIndicatorIcon()}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {getIndicatorText()}
              </Typography>
            </Box>
          )}
        </Paper>
      </Popper>
    </Box>
  );
};

export default RichEditor;
