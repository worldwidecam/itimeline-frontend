import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Button, alpha, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import FlagIcon from '@mui/icons-material/Flag';
import { formatActionSchedule, getActionProgressMeta, canVoteForAction } from './timelineStatusActionUtils';

const ActionCard = ({
  action,
  onVote,
  voteLoading = false,
  displayMode = 'list', // 'list' (wide layout like MemberListTab) or 'sidebar' (compact layout like HomePage)
}) => {
  const theme = useTheme();

  if (!action) return null;

  // Support both snake_case (API) and camelCase (mapped objects) properties
  const actionType = String(action?.action_type || action?.actionType || '').toLowerCase();
  const actionSchedule = formatActionSchedule(action?.due_date || action?.dueDate);
  const actionProgress = getActionProgressMeta(action);
  const actionLocked = actionProgress.isUnlocked === false;

  const actionStyles = {
    bronze: {
      strip: 'linear-gradient(90deg, #cd7f32, #e1a66b, #cd7f32)',
      bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #2d2520, #1a1512)' : 'linear-gradient(145deg, #f8f0e8, #e6d0c0)',
      edge: theme.palette.mode === 'dark' ? 'rgba(205,127,50,0.22)' : 'rgba(205,127,50,0.35)',
      accent: '#cd7f32',
      accentText: theme.palette.mode === 'dark' ? '#cd7f32' : '#8B5A2B',
      shadowText: theme.palette.mode === 'dark' ? '0 0 4px rgba(205,127,50,0.3)' : '0 0 2px rgba(139,90,43,0.2)',
      title: 'BRONZE ACTION',
    },
    silver: {
      strip: 'linear-gradient(90deg, #c0c0c0, #e6e6e6, #c0c0c0)',
      bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #2d2d32, #1a1a1f)' : 'linear-gradient(145deg, #f8f8fa, #e6e6e9)',
      edge: theme.palette.mode === 'dark' ? 'rgba(192,192,192,0.2)' : 'rgba(192,192,192,0.34)',
      accent: '#c0c0c0',
      accentText: theme.palette.mode === 'dark' ? '#cfcfd6' : '#5a5a62',
      shadowText: theme.palette.mode === 'dark' ? '0 0 4px rgba(192,192,192,0.3)' : '0 0 2px rgba(90,90,98,0.2)',
      title: 'SILVER ACTION',
    },
    gold: {
      strip: 'linear-gradient(90deg, #d4af37, #f5d970, #d4af37)',
      bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #2d2a20, #19160f)' : 'linear-gradient(145deg, #f8f3e6, #eadcb0)',
      edge: theme.palette.mode === 'dark' ? 'rgba(212,175,55,0.24)' : 'rgba(212,175,55,0.38)',
      accent: '#d4af37',
      accentText: theme.palette.mode === 'dark' ? '#ffd700' : '#8B6F1F',
      shadowText: theme.palette.mode === 'dark' ? '0 0 5px rgba(255,215,0,0.3)' : '0 0 2px rgba(139,111,31,0.2)',
      title: 'GOLD ACTION',
    },
  }[actionType] || {
    strip: 'linear-gradient(90deg, #64748b, #94a3b8, #64748b)',
    bg: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, #1f2937, #111827)' : 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
    edge: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.22)' : 'rgba(100,116,139,0.3)',
    accent: '#64748b',
    accentText: theme.palette.text.primary,
    shadowText: 'none',
    title: String(actionType || 'ACTION').toUpperCase(),
  };

  const isSidebar = displayMode === 'sidebar';

  return (
    <Card
      sx={{
        position: 'relative',
        borderRadius: 2,
        width: '100%',
        ml: 0,
        transform: isSidebar ? { xs: 'scale(0.90)', sm: 'none' } : 'none',
        transformOrigin: 'top left',
        background: actionStyles.bg,
        boxShadow: theme.palette.mode === 'dark'
          ? `0 8px 16px rgba(0,0,0,0.35), 0 0 0 1px ${actionStyles.edge}`
          : `0 8px 16px rgba(0,0,0,0.1), 0 0 0 1px ${actionStyles.edge}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: actionStyles.strip,
        },
      }}
    >
      <CardContent
        sx={{
          p: isSidebar ? 1.15 : 3,
          pt: isSidebar ? 1.35 : 3,
          position: 'relative',
          pr: (!isSidebar && actionSchedule) ? { xs: 3, md: actionType === 'gold' ? '200px' : '170px' } : (isSidebar ? 1.15 : 3),
          minHeight: (!isSidebar && actionSchedule) ? { xs: 'auto', md: actionType === 'gold' ? 220 : 180 } : 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {actionLocked && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
              p: 2,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <LockIcon
              sx={{
                fontSize: isSidebar ? 24 : 40,
                color: actionStyles.accent,
                mb: isSidebar ? 0.8 : 2,
                filter: `drop-shadow(0 0 5px ${alpha(actionStyles.accent, 0.5)})`,
              }}
            />
            <Typography variant={isSidebar ? 'body2' : 'h6'} sx={{ color: '#fff', mb: 0.8, fontWeight: 700 }}>
              {actionStyles.title} Locked
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', mb: 1, maxWidth: isSidebar ? '100%' : '80%' }}>
              {actionProgress.label || 'Help unlock this action by contributing progress.'}
            </Typography>
            <Box sx={{ width: '100%', maxWidth: isSidebar ? 220 : 280, mb: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={Math.round((actionProgress.ratio || 0) * 100)}
                sx={{
                  height: 7,
                  borderRadius: 999,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: actionStyles.accent,
                  },
                }}
              />
            </Box>
            {canVoteForAction(action) ? (
              <Button
                size="small"
                variant={action?.progress?.user_voted ? 'outlined' : 'contained'}
                onClick={onVote}
                disabled={voteLoading || !!action?.progress?.user_voted}
                sx={{
                  color: '#fff',
                  borderColor: alpha(actionStyles.accent, 0.8),
                  bgcolor: action?.progress?.user_voted
                    ? 'transparent'
                    : alpha(actionStyles.accent, 0.25),
                  '&:hover': {
                    bgcolor: alpha(actionStyles.accent, 0.35),
                    borderColor: actionStyles.accent,
                  },
                }}
              >
                {action?.progress?.user_voted
                  ? 'Vote Counted'
                  : (voteLoading ? 'Voting...' : 'Count me in!')}
              </Button>
            ) : null}
          </Box>
        )}

        {/* Action Header Label */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: isSidebar ? 0.45 : 1.5 }}>
          <FlagIcon
            sx={{
              mr: isSidebar ? 1 : 1.5,
              color: actionStyles.accent,
              fontSize: isSidebar ? '1.1rem' : '1.3rem',
              filter: `drop-shadow(0 0 2px ${alpha(actionStyles.accent, 0.5)})`,
            }}
          />
          <Typography
            variant={isSidebar ? 'caption' : 'h6'}
            component={isSidebar ? 'span' : 'h2'}
            sx={{
              fontFamily: isSidebar ? 'inherit' : '"Playfair Display", serif',
              fontWeight: 800,
              fontSize: isSidebar ? '0.68rem' : '0.95rem',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: actionStyles.accentText,
              textShadow: actionStyles.shadowText,
            }}
          >
            {actionStyles.title}
          </Typography>
        </Box>

        {/* Absolute Schedule box for list mode (only Gold and Bronze in wide mode get this display) */}
        {!isSidebar && actionSchedule && (
          <Box
            sx={{
              position: { xs: 'relative', md: 'absolute' },
              top: { md: 20 },
              right: { md: 20 },
              width: { xs: '100%', md: actionType === 'gold' ? 160 : 136 },
              minHeight: { xs: 80, md: actionType === 'gold' ? 148 : 132 },
              mb: { xs: 1.75, md: 0 },
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? alpha(actionStyles.accent, 0.5) : alpha(actionStyles.accent, 0.4),
              boxShadow: theme.palette.mode === 'dark'
                ? `0 8px 16px rgba(0,0,0,0.35), 0 0 0 1px ${alpha(actionStyles.accent, 0.15)}`
                : `0 8px 16px ${alpha(actionStyles.accent, 0.2)}, 0 0 0 1px ${alpha(actionStyles.accent, 0.2)}`,
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                px: 1,
                py: 0.5,
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark' ? alpha(actionStyles.accent, 0.24) : alpha(actionStyles.accent, 0.32),
                borderBottom: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? alpha(actionStyles.accent, 0.45) : alpha(actionStyles.accent, 0.35),
              }}
            >
              <Typography sx={{ fontSize: '0.68rem', letterSpacing: '0.65px', fontWeight: 800, textTransform: 'uppercase' }}>
                Day of Action
              </Typography>
            </Box>
            <Box
              sx={{
                minHeight: { xs: 68, md: actionType === 'gold' ? 112 : 95 },
                px: 1.25,
                py: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,10,6,0.55)' : 'rgba(255,250,235,0.82)',
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2 }}>
                {actionSchedule.dateLabel}
              </Typography>
              <Typography sx={{ mt: 0.45, opacity: 0.85, fontSize: '0.78rem', fontWeight: 600 }}>
                {actionSchedule.timeLabel}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Action Title */}
        <Typography
          variant={isSidebar ? 'body2' : 'h5'}
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: isSidebar ? undefined : '1.15rem',
            lineHeight: 1.25,
            mt: isSidebar ? 0.3 : 1,
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            textAlign: isSidebar ? 'left' : 'center',
          }}
        >
          {action.title || 'Untitled action'}
        </Typography>

        {/* Action Description */}
        <Typography
          variant="body2"
          sx={{
            mb: isSidebar ? 0.6 : 1.5,
            fontSize: isSidebar ? '0.75rem' : '0.88rem',
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            textAlign: isSidebar ? 'left' : 'center',
          }}
        >
          {action.description}
        </Typography>

        {/* Inline Schedule for Sidebar mode */}
        {isSidebar && actionSchedule && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.6, opacity: 0.8 }}>
            Day of Action: {actionSchedule.dateLabel} · {actionSchedule.timeLabel}
          </Typography>
        )}

        {/* Action Progress Bar */}
        {actionProgress.label && (
          <Box sx={{ mt: 0.6 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.4, opacity: 0.85 }}>
              Progress: {actionProgress.label}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.round((actionProgress.ratio || 0) * 100)}
              sx={{
                height: isSidebar ? 6 : 7,
                borderRadius: 999,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: actionStyles.accent,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionCard;
