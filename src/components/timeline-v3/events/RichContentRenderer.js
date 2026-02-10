import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { People as CommunityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../common/UserAvatar';
import HashtagIcon from '../../common/HashtagIcon';
import api from '../../../utils/api';

const RichContentRenderer = ({ content, theme }) => {
  const navigate = useNavigate();
  const [userCache, setUserCache] = React.useState({});
  const [userDataMap, setUserDataMap] = React.useState({});

  if (!content) {
    return null;
  }

  let contentData;
  try {
    contentData = typeof content === 'string' ? JSON.parse(content) : content;
  } catch (e) {
    return null;
  }

  if (!contentData.content || !Array.isArray(contentData.content)) {
    return null;
  }

  const fetchUserData = async (username) => {
    if (userCache[username]) {
      return userCache[username];
    }
    try {
      const response = await api.get(`/api/users/lookup?username=${encodeURIComponent(username)}`);
      if (response.data) {
        setUserCache((prev) => ({ ...prev, [username]: response.data }));
        setUserDataMap((prev) => ({ ...prev, [username]: response.data }));
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    return null;
  };

  React.useEffect(() => {
    const userMentions = contentData.content.filter((item) => item.type === 'user_mention');
    userMentions.forEach((item) => {
      if (!userCache[item.username]) {
        fetchUserData(item.username);
      }
    });
  }, [content]);

  const handleMentionClick = async (type, name, username) => {
    switch (type) {
      case 'user_mention': {
        const userData = await fetchUserData(username);
        if (userData && userData.id) {
          navigate(`/profile/${userData.id}`);
        }
        break;
      }
      case 'hashtag_mention': {
        try {
          const timelineName = name.toUpperCase();
          const response = await api.get(`/api/timeline-v3/name/${encodeURIComponent(timelineName)}`);
          if (response.data && response.data.id) {
            navigate(`/timeline-v3/${response.data.id}`);
          } else {
            navigate(`/timeline-v3/new?name=${encodeURIComponent(timelineName)}`);
          }
        } catch (error) {
          console.error('Error fetching hashtag timeline:', error);
        }
        break;
      }
      case 'community_mention': {
        try {
          const response = await api.get(`/api/timeline-v3/name/${encodeURIComponent(name)}`);
          if (response.data && response.data.id) {
            navigate(`/timeline-v3/${response.data.id}`);
          }
        } catch (error) {
          console.error('Error fetching community timeline:', error);
        }
        break;
      }
      case 'link': {
        window.open(name, '_blank');
        break;
      }
      default:
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
      {contentData.content.map((item, index) => {
        if (item.type === 'text') {
          return (
            <Typography
              key={index}
              variant="body2"
              sx={{
                color: 'text.secondary',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                display: 'inline',
              }}
            >
              {item.value}
            </Typography>
          );
        }

        if (item.type === 'user_mention') {
          const userData = userDataMap[item.username];
          return (
            <Tooltip key={index} title="Click to view profile">
              <Box
                onClick={() => handleMentionClick('user_mention', item.username, item.username)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(33, 150, 243, 0.2)'
                    : 'rgba(33, 150, 243, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(33, 150, 243, 0.3)'
                      : 'rgba(33, 150, 243, 0.2)',
                  },
                }}
              >
                <UserAvatar
                  name={item.username}
                  avatarUrl={userData?.avatar_url}
                  id={userData?.id}
                  size={24}
                  sx={{
                    border: `1px solid ${theme.palette.primary.main}`,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.username}
                </Typography>
              </Box>
            </Tooltip>
          );
        }

        if (item.type === 'hashtag_mention') {
          return (
            <Tooltip key={index} title="Click to view timeline">
              <Chip
                icon={<HashtagIcon fontSize="small" />}
                label={item.name}
                size="small"
                onClick={() => handleMentionClick('hashtag_mention', item.name, null)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(76, 175, 80, 0.2)'
                    : 'rgba(76, 175, 80, 0.1)',
                  color: theme.palette.success.main,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(76, 175, 80, 0.3)'
                      : 'rgba(76, 175, 80, 0.2)',
                  },
                }}
              />
            </Tooltip>
          );
        }

        if (item.type === 'community_mention') {
          return (
            <Tooltip key={index} title="Click to view community">
              <Chip
                icon={<CommunityIcon />}
                label={item.name}
                size="small"
                onClick={() => handleMentionClick('community_mention', item.name, null)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(156, 39, 176, 0.2)'
                    : 'rgba(156, 39, 176, 0.1)',
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(156, 39, 176, 0.3)'
                      : 'rgba(156, 39, 176, 0.2)',
                  },
                }}
              />
            </Tooltip>
          );
        }

        if (item.type === 'link') {
          return (
            <Tooltip key={index} title="Click to open link">
              <Chip
                icon={<LinkIcon />}
                label={item.text || item.url}
                size="small"
                onClick={() => handleMentionClick('link', item.url)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 152, 0, 0.2)'
                    : 'rgba(255, 152, 0, 0.1)',
                  color: theme.palette.warning.main,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 152, 0, 0.3)'
                      : 'rgba(255, 152, 0, 0.2)',
                  },
                }}
              />
            </Tooltip>
          );
        }

        return null;
      })}
    </Box>
  );
};

export default RichContentRenderer;
