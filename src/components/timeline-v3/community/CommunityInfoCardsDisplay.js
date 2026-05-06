import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  useTheme,
  Divider,
  Stack,
  Chip,
  Tooltip
} from '@mui/material';
import Info from '@mui/icons-material/Info';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Person as PersonIcon,
  People as CommunityIcon,
  Link as LinkIcon,
  EventOutlined as EventOutlinedIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../common/UserAvatar';
import HashtagIcon from '../../common/HashtagIcon';
import api, { getUserByUsername } from '../../../utils/api';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from '../events/EventTypes';
import { useAuth } from '../../../contexts/AuthContext';
import EventPopup from '../events/EventPopup';
import { parseRichContent } from '../../../utils/richContent';

// Rich Content Renderer Component
const RichContentRenderer = ({ content, theme }) => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const [userCache, setUserCache] = React.useState({});
  const [userDataMap, setUserDataMap] = React.useState({});
  const [eventReferenceCache, setEventReferenceCache] = React.useState({});
  const [localEventForPopup, setLocalEventForPopup] = React.useState(null);


  if (!content) {
    return null;
  }

  const contentData = parseRichContent(content);

  if (!contentData || !contentData.content || !Array.isArray(contentData.content)) {
    return null;
  }

  // Fetch user data by username
  const fetchUserData = async (username) => {
    if (Object.prototype.hasOwnProperty.call(userCache, username)) {
      return userCache[username];
    }
    try {
      const userData = await getUserByUsername(username);
      if (userData) {
        setUserCache(prev => ({ ...prev, [username]: userData }));
        setUserDataMap(prev => ({ ...prev, [username]: userData }));
        return userData;
      }
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('not found')) {
        // Cache misses too so we do not repeatedly retry the same invalid mention.
        setUserCache(prev => ({ ...prev, [username]: null }));
      } else {
        console.error('Error fetching user data:', error);
      }
    }
    return null;
  };

  // Pre-fetch all user mentions on mount
  React.useEffect(() => {
    const userMentions = contentData.content.filter(item => item.type === 'user_mention');
    userMentions.forEach(item => {
      if (!userCache[item.username]) {
        fetchUserData(item.username);
      }
    });
  }, [content]);

  const getEventReferenceColor = (eventType) => {
    const normalized = String(eventType || '').toLowerCase();
    const palette = EVENT_TYPE_COLORS[normalized];
    if (!palette) {
      return {
        bg: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.22)' : 'rgba(25, 118, 210, 0.14)',
        color: theme.palette.mode === 'dark' ? '#bbdefb' : '#0d47a1',
      };
    }
    return {
      bg: theme.palette.mode === 'dark' ? `${palette.dark}33` : `${palette.light}26`,
      color: theme.palette.mode === 'dark' ? palette.dark : palette.light,
    };
  };

  const resolveAndCacheEventReference = async (eventId) => {
    if (isGuest) return null;
    const normalizedId = Number(eventId);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) return null;

    const existing = eventReferenceCache[normalizedId];
    if (existing) return existing;

    try {
      const response = await api.get(`/api/v1/events/${normalizedId}`);
      const payload = response?.data;
      if (!payload?.id) return null;
      setEventReferenceCache((prev) => ({ ...prev, [normalizedId]: payload }));
      return payload;
    } catch (_) {
      return null;
    }
  };

  const handleMentionClick = async (type, name, username) => {
    const toAbsoluteRoute = (route) => {
      if (!route) return '';
      if (/^https?:\/\//i.test(route)) return route;
      return `${window.location.origin}${route.startsWith('/') ? route : `/${route}`}`;
    };
    
    const openRouteInNewTab = (route) => {
      if (!route) return;
      window.open(toAbsoluteRoute(route), '_blank', 'noopener,noreferrer');
    };
    const openPendingNewTab = () => window.open('about:blank', '_blank', 'noopener,noreferrer');

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
          const slug = name.toUpperCase();
          const response = await api.get(`/api/v1/timelines/by-slug/${encodeURIComponent(slug)}`);
          if (response.data && response.data.id) {
            navigate(`/timeline-v3/${response.data.id}`);
          } else {
            navigate(`/timeline-v3/new?name=${encodeURIComponent(slug)}`);
          }
        } catch (error) {
          console.error('Error fetching hashtag timeline:', error);
        }
        break;
      }
      case 'community_mention': {
        try {
          const slug = name.toUpperCase();
          const response = await api.get(`/api/v1/timelines/by-slug/${encodeURIComponent(slug)}`);
          if (response.data && response.data.id) {
            navigate(`/timeline-v3/${response.data.id}`);
          }
        } catch (error) {
          console.error('Error fetching community timeline:', error);
        }
        break;
      }
      case 'link':
        window.open(name, '_blank', 'noopener,noreferrer');
        break;
      case 'event_reference': {
        if (isGuest) break;
        const normalizedEventId = Number(name);
        if (!Number.isFinite(normalizedEventId) || normalizedEventId <= 0) break;
        const resolvedEvent = await resolveAndCacheEventReference(normalizedEventId);
        if (!resolvedEvent?.id) break;

        setLocalEventForPopup(resolvedEvent);
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
                display: 'inline'
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
                      : 'rgba(33, 150, 243, 0.2)'
                  }
                }}
              >
                <UserAvatar
                  name={item.username}
                  avatarUrl={userData?.avatar_url}
                  id={userData?.id}
                  size={24}
                  sx={{
                    border: `1px solid ${theme.palette.primary.main}`
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
                      : 'rgba(76, 175, 80, 0.2)'
                  }
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
                      : 'rgba(156, 39, 176, 0.2)'
                  }
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
                      : 'rgba(255, 152, 0, 0.2)'
                  }
                }}
              />
            </Tooltip>
          );
        }

        if (item.type === 'event_reference') {
          const normalizedEventId = Number(item.event_id);
          const cachedEvent = eventReferenceCache[normalizedEventId];
          const eventType = cachedEvent?.type || EVENT_TYPES.REMARK;
          const eventColor = getEventReferenceColor(eventType);
          const canOpenEventReference = !isGuest;

          return (
            <Tooltip key={index} title={canOpenEventReference ? 'Click to open event popup' : 'Unavailable in guest mode'}>
              <Chip
                icon={<EventOutlinedIcon fontSize="small" />}
                label={item.text || `~${normalizedEventId}`}
                size="small"
                onClick={canOpenEventReference ? () => handleMentionClick('event_reference', normalizedEventId, null) : undefined}
                sx={{
                  cursor: canOpenEventReference ? 'pointer' : 'default',
                  bgcolor: eventColor.bg,
                  color: eventColor.color,
                  border: '1px solid',
                  borderColor: eventColor.color,
                  '&:hover': canOpenEventReference ? {
                    filter: 'brightness(1.08)',
                  } : undefined
                }}
              />
            </Tooltip>
          );
        }

        return null;
      })}
      {localEventForPopup && (
        <EventPopup
          event={localEventForPopup}
          open={Boolean(localEventForPopup)}
          onClose={() => setLocalEventForPopup(null)}
        />
      )}
    </Box>
  );
};

const CommunityInfoCardsDisplay = ({ timelineId }) => {
  const theme = useTheme();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get(`/api/v1/timelines/${timelineId}/info-cards`);
        const cardsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setCards(cardsData);
      } catch (err) {
        console.error('Failed to load info cards:', err);
        // Only set error if it's not a 404 (which means no cards exist)
        if (err?.response?.status !== 404) {
          setError('Failed to load info cards');
        }
        setCards([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (timelineId) {
      loadCards();
    }
  }, [timelineId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
          border: `1px solid ${theme.palette.error.light}`,
          borderRadius: 2
        }}
      >
        <Typography 
          color="error" 
          variant="body2"
          sx={{ mb: 1, fontWeight: 500 }}
        >
          Unable to load info cards
        </Typography>
        <Typography 
          color="text.secondary" 
          variant="caption"
        >
          There was a problem loading the community info cards. Please try refreshing the page.
        </Typography>
      </Paper>
    );
  }

  if (cards.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Info sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>
          No community info cards yet
        </Typography>
        <Typography color="text.disabled" variant="caption">
          Community moderators can create info cards from the Admin Panel
        </Typography>
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Stack spacing={2}>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              sx={{
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-2px)'
                },
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1.5,
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  {card.title}
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                {card.content || card.description ? (
                  <RichContentRenderer content={card.content || card.description} theme={theme} />
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Stack>
    </motion.div>
  );
};

export default CommunityInfoCardsDisplay;
