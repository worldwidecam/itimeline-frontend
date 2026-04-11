import React, { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const ChevronArrow = ({ direction = 'up', sizeScale = 1 }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    sx={{
      width: 20 * sizeScale,
      height: 16 * sizeScale,
      display: 'block',
    }}
  >
    {direction === 'up' ? (
      <polyline
        points="18 15 12 9 6 15"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <polyline
        points="6 9 12 15 18 9"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </Box>
);

const formatCompactCount = (rawValue) => {
  const value = Number(rawValue || 0);
  if (!Number.isFinite(value)) return '0';
  const absValue = Math.abs(value);

  if (absValue >= 1000000000) {
    return `${(value / 1000000000).toFixed(absValue >= 10000000000 ? 0 : 1).replace(/\.0$/, '')}B`;
  }
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(absValue >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
  }
  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(absValue >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
  }
  return String(Math.round(value));
};

const VoteControls = ({
  width = 70,
  height = 28,
  showVoteText = false,
  value = undefined,
  onChange = undefined,
  positiveRatio = 0.6,
  totalVotes = null,
  isLoading = false,
  hasError = false,
  hoverDirection = null,
  layout = 'inline',
  sizeScale = 1,
  pillScale = 1,
  showBreakdown = true,
  compact = false,
}) => {
  const theme = useTheme();
  const [internalVote, setInternalVote] = useState(null);
  const vote = value !== undefined ? value : internalVote;

  const positiveColor = theme.palette.success.main;
  const negativeColor = theme.palette.error.main;
  const neutralColor = theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.68)'
    : 'rgba(30,41,59,0.62)';
  const isPositive = vote === 'up';
  const isNegative = vote === 'down';
  const clampedPositiveRatio = Math.max(0, Math.min(Number(positiveRatio) || 0, 1));
  const promotePercent = Math.round(clampedPositiveRatio * 100);
  const demotePercent = 100 - promotePercent;
  const totalValue = Number.isFinite(totalVotes) ? totalVotes : Number(totalVotes || 0);
  const totalLabel = Number.isFinite(totalValue) ? formatCompactCount(Math.max(0, totalValue)) : '0';
  const hasVotes = Math.max(0, totalValue) > 0;
  const isStacked = layout === 'stacked';

  const voteDigits = String(totalLabel).length;
  const tallyWidth = Math.max(30, voteDigits * 9);
  const controlHeight = Math.max(36, height * sizeScale * pillScale * (compact ? 1.28 : 1.42));
  const actionWidth = compact ? Math.max(26, controlHeight * 0.66) : Math.max(38, controlHeight * 1.02);
  const actionHeight = controlHeight - 6;
  const compactExpandedWidth = Math.max(140, 92 + tallyWidth);
  const compactCollapsedWidth = Math.max(70, (actionWidth * 2) + 14);
  const isUnvoted = vote === null;
  const isCompactZeroState = compact && (!hasVotes || isUnvoted);
  const controlWidth = compact
    ? (isCompactZeroState ? compactCollapsedWidth : compactExpandedWidth)
    : Math.max(128, width * sizeScale * pillScale * (isStacked ? 2.2 : 2));
  const tallyFontSize = `${Math.max(0.72, compact ? 0.9 * sizeScale : 0.84 * sizeScale)}rem`;
  const ratioLabelSize = `${Math.max(0.62, 0.68 * sizeScale)}rem`;
  const ratioBarHeight = Math.max(6, 7 * sizeScale);

  const handleVote = (direction) => (event) => {
    event.stopPropagation();
    if (isLoading) return;
    const nextVote = vote === direction ? null : direction;
    if (onChange) {
      onChange(nextVote);
      return;
    }
    setInternalVote(nextVote);
  };

  const tallyNode = isLoading ? (
    <CircularProgress size={16 * sizeScale} sx={{ color: theme.palette.text.secondary }} />
  ) : (
    <Typography
      component="span"
      sx={{
        fontWeight: 800,
        letterSpacing: '0.03em',
        fontSize: tallyFontSize,
        color: hasError ? theme.palette.error.main : theme.palette.text.primary,
        whiteSpace: 'nowrap',
      }}
    >
      {showVoteText ? `Votes ${totalLabel}` : totalLabel}
    </Typography>
  );

  const resolveVoteStyle = (direction) => {
    const isUp = direction === 'up';
    const active = isUp ? isPositive : isNegative;
    const hovered = hoverDirection === direction;
    const directionColor = isUp ? positiveColor : negativeColor;

    return {
      color: hasError
        ? theme.palette.error.main
        : (active || hovered ? directionColor : neutralColor),
      backgroundColor: active
        ? alpha(directionColor, theme.palette.mode === 'dark' ? 0.28 : 0.16)
        : 'transparent',
      borderColor: active
        ? alpha(directionColor, theme.palette.mode === 'dark' ? 0.82 : 0.56)
        : 'transparent',
      '&:hover': {
        color: directionColor,
        backgroundColor: alpha(directionColor, theme.palette.mode === 'dark' ? 0.25 : 0.14),
      },
    };
  };



  const pillBorderColor = hasError
    ? theme.palette.error.main
    : alpha(theme.palette.text.primary, isCompactZeroState
      ? (theme.palette.mode === 'dark' ? 0.36 : 0.28)
      : (theme.palette.mode === 'dark' ? 0.28 : 0.2));
  const pillBackground = isCompactZeroState
    ? (theme.palette.mode === 'dark'
      ? `linear-gradient(120deg, ${alpha(theme.palette.grey[600], 0.38)}, ${alpha(theme.palette.grey[700], 0.3)})`
      : `linear-gradient(120deg, ${alpha(theme.palette.grey[100], 0.96)}, ${alpha(theme.palette.grey[300], 0.8)})`)
    : (theme.palette.mode === 'dark'
      ? `linear-gradient(120deg, ${alpha(theme.palette.common.white, 0.08)}, ${alpha(theme.palette.common.white, 0.03)})`
      : `linear-gradient(120deg, ${alpha('#ffffff', 0.94)}, ${alpha('#fff7ed', 0.88)})`);

  return (
    <Box
      onClick={(event) => event.stopPropagation()}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: showBreakdown ? 0.5 : 0,
        width: controlWidth,
        transition: compact ? 'width 240ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: controlHeight,
          borderRadius: controlHeight,
          border: `1px solid ${pillBorderColor}`,
          background: pillBackground,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 16px rgba(0,0,0,0.35)'
            : '0 8px 16px rgba(15,23,42,0.12)',
          overflow: 'hidden',
          opacity: isLoading ? 0.72 : 1,
          transition: 'background 220ms ease, border-color 220ms ease',
        }}
      >
        {hasVotes && (!compact || !isUnvoted) && (
          <>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${promotePercent}%`,
                background: alpha(positiveColor, theme.palette.mode === 'dark' ? 0.24 : 0.16),
                transition: 'width 240ms ease',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${demotePercent}%`,
                background: alpha(negativeColor, theme.palette.mode === 'dark' ? 0.2 : 0.12),
                transition: 'width 240ms ease',
              }}
            />
          </>
        )}

        {compact ? (
          isCompactZeroState ? (
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.35,
                px: 0.3,
                transition: 'opacity 160ms ease',
              }}
            >
              <Box
                onClick={handleVote('up')}
                sx={{
                  ...resolveVoteStyle('up'),
                  width: actionWidth,
                  height: actionHeight,
                  borderRadius: actionHeight,
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 180ms ease',
                }}
              >
                <ChevronArrow direction="up" sizeScale={sizeScale * 0.95} />
              </Box>

              <Box
                onClick={handleVote('down')}
                sx={{
                  ...resolveVoteStyle('down'),
                  width: actionWidth,
                  height: actionHeight,
                  borderRadius: actionHeight,
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 180ms ease',
                }}
              >
                <ChevronArrow direction="down" sizeScale={sizeScale * 0.95} />
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
              }}
            >
              <Box
                onClick={handleVote('up')}
                sx={{
                  ...resolveVoteStyle('up'),
                  position: 'absolute',
                  left: '25%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: actionWidth,
                  height: actionHeight,
                  borderRadius: actionHeight,
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 180ms ease',
                }}
              >
                <ChevronArrow direction="up" sizeScale={sizeScale * 0.95} />
              </Box>

              <Box
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  minWidth: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: 0.25,
                  transition: 'opacity 180ms ease, transform 180ms ease',
                }}
              >
                {tallyNode}
              </Box>

              <Box
                onClick={handleVote('down')}
                sx={{
                  ...resolveVoteStyle('down'),
                  position: 'absolute',
                  left: '75%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: actionWidth,
                  height: actionHeight,
                  borderRadius: actionHeight,
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 180ms ease',
                }}
              >
                <ChevronArrow direction="down" sizeScale={sizeScale * 0.95} />
              </Box>
            </Box>
          )
        ) : (
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
            }}
          >
            <Box
              onClick={handleVote('up')}
              sx={{
                ...resolveVoteStyle('up'),
                position: 'absolute',
                left: '25%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: actionWidth,
                height: actionHeight,
                borderRadius: actionHeight,
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 180ms ease',
              }}
            >
              <ChevronArrow direction="up" sizeScale={sizeScale * 0.95} />
            </Box>

            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                minWidth: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                px: 0.65,
              }}
            >
              {tallyNode}
            </Box>

            <Box
              onClick={handleVote('down')}
              sx={{
                ...resolveVoteStyle('down'),
                position: 'absolute',
                left: '75%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: actionWidth,
                height: actionHeight,
                borderRadius: actionHeight,
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 180ms ease',
              }}
            >
              <ChevronArrow direction="down" sizeScale={sizeScale * 0.95} />
            </Box>
          </Box>
        )}
      </Box>

      {showBreakdown && (
        <Box sx={{ width: '100%', px: 0.7 }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: ratioBarHeight,
            borderRadius: ratioBarHeight,
            overflow: 'hidden',
            background: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.2 : 0.12),
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${promotePercent}%`,
              background: `linear-gradient(90deg, ${alpha(positiveColor, 0.9)}, ${alpha(positiveColor, 0.7)})`,
              transition: 'width 240ms ease',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: `${demotePercent}%`,
              background: `linear-gradient(90deg, ${alpha(negativeColor, 0.7)}, ${alpha(negativeColor, 0.9)})`,
              transition: 'width 240ms ease',
            }}
          />
        </Box>

        <Box
          sx={{
            mt: 0.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.8,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: ratioLabelSize,
              fontWeight: 700,
              color: hasError ? theme.palette.error.main : alpha(positiveColor, 0.95),
            }}
          >
            {promotePercent}% Promote
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: ratioLabelSize,
              fontWeight: 700,
              color: hasError ? theme.palette.error.main : alpha(negativeColor, 0.95),
            }}
          >
            {demotePercent}% Demote
          </Typography>
        </Box>
        </Box>
      )}
    </Box>
  );
};

export default VoteControls;
