import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { People as CommunityIcon } from '@mui/icons-material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../../common/UserAvatar';
import HashtagIcon from '../../common/HashtagIcon';
import api, { getUserByUsername } from '../../../utils/api';
import { EVENT_TYPES, EVENT_TYPE_COLORS } from './EventTypes';
import { useAuth } from '../../../contexts/AuthContext';
import { displayUsername } from '../../../utils/usernameDisplay';

const RichContentRenderer = ({
  content,
  theme,
  onOpenEventReference,
  solidChips = false,
  disableInteractions = false,
  inheritTextColor = false,
  ocrMetadataStamps = false,
  textSx = null,
  dropcapFirstLetter = false,
  dropcapSx = null,
}) => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const [userCache, setUserCache] = React.useState({});
  const [userDataMap, setUserDataMap] = React.useState({});
  const [eventReferenceCache, setEventReferenceCache] = React.useState({});

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
      const userData = await getUserByUsername(username);
      if (userData) {
        setUserCache((prev) => ({ ...prev, [username]: userData }));
        setUserDataMap((prev) => ({ ...prev, [username]: userData }));
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    return null;
  };

  const resolveTimelineByName = async (timelineName) => {
    const lookup = String(timelineName || '').trim();
    if (!lookup) return null;

    // Use slug-based lookup for timeline by name
    try {
      const response = await api.get(`/api/v1/timelines/by-slug/${encodeURIComponent(lookup)}`);
      if (response?.data?.id) return response.data;
    } catch (error) {
      console.warn('[RichContentRenderer] Timeline not found for slug:', lookup);
    }

    return null;
  };

  const pickChipBg = ({ softLight, softDark, solidLight, solidDark }) => {
    if (theme.palette.mode === 'dark') {
      return solidChips ? solidDark : softDark;
    }
    return solidChips ? solidLight : softLight;
  };

  const getTimelineMentionLabel = (rawName) => String(rawName || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  const isStampedEditMetadataText = (value) => {
    const raw = String(value || '');
    const normalized = raw.replace(/\r/g, '').trim();
    if (!normalized) return false;

    if (normalized === '---') return true;
    if (/^edits made$/i.test(normalized)) return true;
    if (/^-\s*\d{4}-\d{2}-\d{2}t[^\s]*\s+by$/i.test(normalized)) return true;

    return false;
  };

  const firstDropcapTextIndex = React.useMemo(() => {
    if (!dropcapFirstLetter) return -1;
    return contentData.content.findIndex((item) => {
      if (item?.type !== 'text') return false;
      if (ocrMetadataStamps && isStampedEditMetadataText(item?.value)) return false;
      return /\S/.test(String(item?.value || ''));
    });
  }, [content, dropcapFirstLetter, ocrMetadataStamps]);

  const renderTextWithDropcap = (value) => {
    const rawValue = String(value || '');
    const firstVisibleCharIndex = rawValue.search(/\S/);
    if (firstVisibleCharIndex < 0) {
      return rawValue;
    }

    const leading = rawValue.slice(0, firstVisibleCharIndex);
    const firstChar = rawValue.charAt(firstVisibleCharIndex);
    const remainder = rawValue.slice(firstVisibleCharIndex + 1);

    return (
      <>
        {leading}
        <Box
          component="span"
          sx={{
            fontSize: '2.35rem',
            lineHeight: 0.78,
            fontWeight: 700,
            fontFamily: '"Lobster", "Bodoni Moda", "Times New Roman", serif',
            color: theme.palette.mode === 'dark' ? 'rgba(219,234,254,0.95)' : 'rgba(96,61,30,0.92)',
            pr: '0.06em',
            verticalAlign: '-0.18em',
            ...(dropcapSx || {}),
          }}
        >
          {firstChar}
        </Box>
        {remainder}
      </>
    );
  };

  React.useEffect(() => {
    const userMentions = contentData.content.filter((item) => item.type === 'user_mention');
    userMentions.forEach((item) => {
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
      const response = await api.get(`/api/v1/events/${normalizedId}/resolve`);
      const payload = response?.data;
      if (!payload?.id) return null;
      setEventReferenceCache((prev) => ({ ...prev, [normalizedId]: payload }));
      return payload;
    } catch (_) {
      return null;
    }
  };

  React.useEffect(() => {
    if (isGuest) return;
    const eventRefs = contentData.content.filter((item) => item.type === 'event_reference');
    eventRefs.forEach((item) => {
      const normalizedId = Number(item?.event_id);
      if (Number.isFinite(normalizedId) && normalizedId > 0 && !eventReferenceCache[normalizedId]) {
        resolveAndCacheEventReference(normalizedId);
      }
    });
  }, [content, eventReferenceCache, isGuest]);

  const toAbsoluteRoute = (route) => {
    if (!route) return '';
    if (/^https?:\/\//i.test(route)) return route;
    return `${window.location.origin}${route.startsWith('/') ? route : `/${route}`}`;
  };

  const openRouteInNewTab = (route) => {
    if (!route) return;
    window.open(toAbsoluteRoute(route), '_blank', 'noopener,noreferrer');
  };

  const openPendingNewTab = () => {
    const tab = window.open('about:blank', '_blank');
    if (tab) {
      try {
        tab.opener = null;
      } catch (_) {
        // noop
      }
    }
    return tab;
  };

  const handleMentionClick = async (type, name, username) => {
    if (disableInteractions) return;
    switch (type) {
      case 'user_mention': {
        const pendingTab = openPendingNewTab();
        const userData = await fetchUserData(username);
        if (userData && userData.id) {
          const route = `/profile/${userData.id}`;
          if (pendingTab) {
            pendingTab.location.href = toAbsoluteRoute(route);
          } else {
            openRouteInNewTab(route);
          }
        } else if (pendingTab) {
          pendingTab.close();
        }
        break;
      }
      case 'hashtag_mention': {
        const pendingTab = openPendingNewTab();
        try {
          const timelineName = name.toUpperCase();
          const timeline = await resolveTimelineByName(timelineName);
          const route = timeline?.id
            ? `/timeline-v3/${timeline.id}`
            : `/timeline-v3/new?name=${encodeURIComponent(timelineName)}`;
          if (pendingTab) {
            pendingTab.location.href = toAbsoluteRoute(route);
          } else {
            openRouteInNewTab(route);
          }
        } catch (error) {
          if (pendingTab) pendingTab.close();
          console.error('Error fetching hashtag timeline:', error);
        }
        break;
      }
      case 'community_mention': {
        const pendingTab = openPendingNewTab();
        try {
          const baseName = String(name || '').trim();
          const timeline = await resolveTimelineByName(baseName)
            || await resolveTimelineByName(`i-${baseName}`);
          if (timeline?.id) {
            const route = `/timeline-v3/${timeline.id}`;
            if (pendingTab) {
              pendingTab.location.href = toAbsoluteRoute(route);
            } else {
              openRouteInNewTab(route);
            }
          } else if (pendingTab) {
            pendingTab.close();
          }
        } catch (error) {
          if (pendingTab) pendingTab.close();
          console.error('Error fetching community timeline:', error);
        }
        break;
      }
      case 'link': {
        window.open(name, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'event_reference': {
        if (isGuest) break;
        const normalizedEventId = Number(name);
        if (!Number.isFinite(normalizedEventId) || normalizedEventId <= 0) break;
        const resolvedEvent = await resolveAndCacheEventReference(normalizedEventId);
        if (!resolvedEvent?.id) break;

        if (typeof onOpenEventReference === 'function') {
          onOpenEventReference({
            eventId: normalizedEventId,
            resolvedEvent,
          });
          break;
        }

        if (!resolvedEvent?.timeline_id) break;
        localStorage.setItem('timeline_pending_open_event_id', String(normalizedEventId));
        navigate(`/timeline-v3/${resolvedEvent.timeline_id}?openEvent=${normalizedEventId}`);
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
          const metadataStampText = ocrMetadataStamps && isStampedEditMetadataText(item.value);
          const dropcapEnabled = dropcapFirstLetter && !metadataStampText && index === firstDropcapTextIndex;
          return (
            <Typography
              key={index}
              variant="body2"
              sx={{
                color: inheritTextColor ? 'inherit' : 'text.secondary',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                display: 'inline',
                ...(textSx || {}),
                ...(metadataStampText ? {
                  fontFamily: '"OCR A Std", "OCR A Extended", "Share Tech Mono", "Courier Prime", monospace',
                  letterSpacing: '0.015em',
                  fontSize: '0.95em',
                  opacity: 0.92,
                } : {}),
              }}
            >
              {dropcapEnabled ? renderTextWithDropcap(item.value) : item.value}
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
                  bgcolor: pickChipBg({
                    softLight: 'rgba(230, 242, 255, 0.85)',
                    softDark: 'rgba(24, 56, 84, 0.85)',
                    solidLight: 'rgba(221, 237, 255, 0.97)',
                    solidDark: 'rgba(27, 65, 99, 0.96)',
                  }),
                  cursor: disableInteractions ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: pickChipBg({
                      softLight: 'rgba(216, 233, 251, 0.92)',
                      softDark: 'rgba(29, 72, 108, 0.9)',
                      solidLight: 'rgba(208, 228, 250, 0.99)',
                      solidDark: 'rgba(33, 77, 115, 0.98)',
                    }),
                  },
                }}
              >
                <UserAvatar
                  name={item.username}
                  avatarUrl={userData?.avatar_url}
                  id={userData?.id}
                  size={24}
                  userColor={userData?.user_color}
                  sx={{
                    border: `1px solid ${theme.palette.primary.main}`,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.mode === 'dark' ? 'rgba(233, 244, 255, 0.96)' : 'rgba(17, 36, 57, 0.92)',
                  }}
                >
                  {displayUsername(item.username)}
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
                label={getTimelineMentionLabel(item.name)}
                size="small"
                onClick={() => handleMentionClick('hashtag_mention', item.name, null)}
                sx={{
                  cursor: disableInteractions ? 'default' : 'pointer',
                  bgcolor: pickChipBg({
                    softLight: 'rgba(235, 251, 237, 0.88)',
                    softDark: 'rgba(31, 69, 36, 0.84)',
                    solidLight: 'rgba(235, 251, 237, 0.97)',
                    solidDark: 'rgba(31, 69, 36, 0.96)',
                  }),
                  color: theme.palette.success.main,
                  '&:hover': {
                    bgcolor: pickChipBg({
                      softLight: 'rgba(223, 245, 226, 0.92)',
                      softDark: 'rgba(38, 82, 43, 0.9)',
                      solidLight: 'rgba(223, 245, 226, 0.99)',
                      solidDark: 'rgba(38, 82, 43, 0.98)',
                    }),
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
                label={getTimelineMentionLabel(item.name)}
                size="small"
                onClick={() => handleMentionClick('community_mention', item.name, null)}
                sx={{
                  cursor: disableInteractions ? 'default' : 'pointer',
                  bgcolor: pickChipBg({
                    softLight: 'rgba(245, 236, 251, 0.88)',
                    softDark: 'rgba(70, 33, 79, 0.84)',
                    solidLight: 'rgba(245, 236, 251, 0.97)',
                    solidDark: 'rgba(70, 33, 79, 0.96)',
                  }),
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: pickChipBg({
                      softLight: 'rgba(237, 225, 247, 0.92)',
                      softDark: 'rgba(84, 39, 95, 0.9)',
                      solidLight: 'rgba(237, 225, 247, 0.99)',
                      solidDark: 'rgba(84, 39, 95, 0.98)',
                    }),
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
                  cursor: disableInteractions ? 'default' : 'pointer',
                  bgcolor: pickChipBg({
                    softLight: 'rgba(255, 245, 229, 0.88)',
                    softDark: 'rgba(89, 53, 14, 0.84)',
                    solidLight: 'rgba(255, 245, 229, 0.97)',
                    solidDark: 'rgba(89, 53, 14, 0.96)',
                  }),
                  color: theme.palette.warning.main,
                  '&:hover': {
                    bgcolor: pickChipBg({
                      softLight: 'rgba(255, 236, 209, 0.92)',
                      softDark: 'rgba(106, 63, 16, 0.9)',
                      solidLight: 'rgba(255, 236, 209, 0.99)',
                      solidDark: 'rgba(106, 63, 16, 0.98)',
                    }),
                  },
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
          const canOpenEventReference = !disableInteractions && !isGuest;

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
                  } : undefined,
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
