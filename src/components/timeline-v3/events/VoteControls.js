import React, { useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
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
  badgeScale = 1,
}) => {
  const theme = useTheme();
  const [internalVote, setInternalVote] = useState(null); // 'up' | 'down' | null
  const vote = value !== undefined ? value : internalVote;

  const positiveColor = theme.palette.success.main;
  const negativeColor = theme.palette.error.main;
  const neutralColor = theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.4)'
    : 'rgba(0,0,0,0.4)';

  const isPositive = vote === 'up';
  const isNegative = vote === 'down';
  const isActive = isPositive || isNegative;
  const isHoveringUp = hoverDirection === 'up';
  const isHoveringDown = hoverDirection === 'down';
  const baseWidth = width * sizeScale;
  const baseHeight = height * sizeScale;
  const effectiveWidth = baseWidth * pillScale;
  const effectiveHeight = baseHeight * pillScale;
  const labelSlotWidth = 44 * sizeScale;
  const activeRowWidth = effectiveWidth + (labelSlotWidth * 2) + (12 * sizeScale);
  const pillOffset = labelSlotWidth;
  const isStacked = layout === 'stacked';
  const badgeHeight = baseHeight * badgeScale;
  const badgeMinWidth = 80 * sizeScale * badgeScale;
  const badgeFontSize = `${0.7 * sizeScale * badgeScale}rem`;
  const labelFontSize = `${0.75 * sizeScale}rem`;
  const voteTextFontSize = `${0.75 * sizeScale}rem`;
  const stackedCenterOffset = (12 * sizeScale) / 2;
  const arrowScale = sizeScale * pillScale;

  const clampedPositiveRatio = Math.max(0, Math.min(positiveRatio, 1));
  const dividerPosition = clampedPositiveRatio * 100;
  const isEvenSplit = Math.abs(clampedPositiveRatio - 0.5) < 0.0001;
  const isNegativeMajority = clampedPositiveRatio < 0.5;
  const showDivider = dividerPosition > 0 && dividerPosition < 100;
  const showLeftLabel = isEvenSplit || !isNegativeMajority;
  const showRightLabel = isEvenSplit || isNegativeMajority;
  const leftPercentage = Math.round(dividerPosition);
  const rightPercentage = Math.round(100 - dividerPosition);
  const leftLabelColor = hasError ? theme.palette.error.main : positiveColor;
  const rightLabelColor = hasError ? theme.palette.error.main : negativeColor;
  const resolvedTotalVotes = Number.isFinite(totalVotes) ? totalVotes : Number(totalVotes || 0);
  const totalVotesLabel = Number.isFinite(resolvedTotalVotes)
    ? String(Math.max(0, resolvedTotalVotes)).padStart(3, '0')
    : '000';
  const badgeLabel = isActive ? `${totalVotesLabel} Votes!` : 'VOTE!';
  const renderLabel = (side) => {
    const isLeft = side === 'left';
    const labelColor = isLeft ? leftLabelColor : rightLabelColor;
    const percentage = isLeft ? leftPercentage : rightPercentage;
    const spinnerColor = isLeft ? positiveColor : negativeColor;

    if (isLoading) {
      return <CircularProgress size={20 * sizeScale} sx={{ color: spinnerColor }} />;
    }

    return (
      <Box
        sx={{
          fontSize: labelFontSize,
          fontWeight: 700,
          color: labelColor,
          letterSpacing: '0.3px',
        }}
      >
        {percentage}%
      </Box>
    );
  };

  const handleVote = (direction) => (event) => {
    event.stopPropagation();
    if (isLoading) return; // Prevent voting while loading
    const nextVote = vote === direction ? null : direction;
    if (onChange) {
      onChange(nextVote);
    } else {
      setInternalVote(nextVote);
    }
  };

  const handlePillClick = (event) => {
    event.stopPropagation();
    if (isLoading) return; // Prevent voting while loading
    if (onChange) {
      onChange(null);
    } else {
      setInternalVote(null);
    }
  };

  const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  const badgeNode = (
    <Box
      sx={{
        height: badgeHeight,
        borderRadius: badgeHeight / 2,
        border: `2px solid ${neutralColor}`,
        display: 'flex',
        alignItems: 'center',
        paddingX: 1.5 * sizeScale * badgeScale,
        fontSize: badgeFontSize,
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: hasError ? theme.palette.error.main : theme.palette.text.primary,
        background: alpha(theme.palette.text.primary, 0.04),
        minWidth: badgeMinWidth,
        justifyContent: 'center',
      }}
    >
      {badgeLabel}
    </Box>
  );

  const activeVoteNode = (
    <Box
      sx={{
        position: 'relative',
        width: activeRowWidth,
        height: effectiveHeight,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: pillOffset,
          width: effectiveWidth,
          height: effectiveHeight,
          borderRadius: effectiveHeight / 2,
          border: `2px solid ${neutralColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingX: 1.5 * sizeScale,
          transition: `all 0.3s ${easing}`,
          opacity: isActive ? 0 : 1,
          transform: isActive ? 'scale(0.94)' : 'scale(1)',
          pointerEvents: isActive ? 'none' : 'auto',
          background: 'transparent',
        }}
      >
        {showVoteText ? (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: voteTextFontSize,
              fontWeight: 600,
              color: neutralColor,
              letterSpacing: '0.5px',
            }}
          >
            VOTE!
          </Box>
        ) : (
          <>
            <Box
              onClick={handleVote('up')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: hasError
                  ? theme.palette.error.main
                  : (isPositive || isHoveringUp ? positiveColor : neutralColor),
                transition: `color 0.2s ease, transform 0.25s ${easing}`,
                transform: isActive ? 'translateX(-10px)' : 'translateX(0px)',
                opacity: isLoading ? 0.5 : 1,
                '&:hover': {
                  color: isLoading ? (hasError ? theme.palette.error.main : neutralColor) : positiveColor,
                },
              }}
            >
              <ChevronArrow direction="up" sizeScale={arrowScale} />
            </Box>

            <Box
              sx={{
                width: 0.5,
                height: effectiveHeight * 0.6,
                background: `linear-gradient(90deg, ${positiveColor}, ${negativeColor})`,
                opacity: isActive ? 0 : 1,
                transition: `opacity 0.2s ease`,
              }}
            />

            <Box
              onClick={handleVote('down')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: hasError
                  ? theme.palette.error.main
                  : (isNegative || isHoveringDown ? negativeColor : neutralColor),
                transition: `color 0.2s ease, transform 0.25s ${easing}`,
                transform: isActive ? 'translateX(10px)' : 'translateX(0px)',
                opacity: isLoading ? 0.5 : 1,
                '&:hover': {
                  color: isLoading ? (hasError ? theme.palette.error.main : neutralColor) : negativeColor,
                },
              }}
            >
              <ChevronArrow direction="down" sizeScale={arrowScale} />
            </Box>
          </>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'scale(1)' : 'scale(0.96)',
          transition: `opacity 0.25s ease, transform 0.25s ${easing}`,
          pointerEvents: isActive ? 'auto' : 'none',
          width: activeRowWidth,
        }}
      >
        <Box
          sx={{
            minWidth: labelSlotWidth,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {showLeftLabel ? renderLabel('left') : null}
        </Box>

        <Box
          onClick={handlePillClick}
          sx={{
            position: 'relative',
            width: effectiveWidth,
            height: effectiveHeight,
            borderRadius: effectiveHeight / 2,
            border: `2px solid ${hasError ? theme.palette.error.main : alpha(theme.palette.text.primary, 0.2)}`,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: `all 0.3s ${easing}`,
            opacity: isLoading ? 0.6 : 1,
            transform: 'scale(1)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            '@keyframes voteErrorPulse': {
              '0%': { boxShadow: '0 0 0 rgba(244,67,54,0)' },
              '70%': { boxShadow: '0 0 0 6px rgba(244,67,54,0.25)' },
              '100%': { boxShadow: '0 0 0 rgba(244,67,54,0)' },
            },
            animation: hasError ? 'voteErrorPulse 0.45s ease' : 'none',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${dividerPosition}%`,
              background: positiveColor,
              opacity: 0.9,
              transition: `width 0.3s ${easing}`,
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              height: '100%',
              width: `${100 - dividerPosition}%`,
              background: negativeColor,
              opacity: 0.9,
              transition: `width 0.3s ${easing}`,
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              left: `${dividerPosition}%`,
              top: 0,
              height: '100%',
              width: 1.5,
              background: 'rgba(255,255,255,0.9)',
              transition: `left 0.3s ${easing}`,
              opacity: showDivider ? 1 : 0,
            }}
          />
        </Box>

        <Box
          sx={{
            minWidth: labelSlotWidth,
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          {showRightLabel ? renderLabel('right') : null}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: isStacked ? 'column' : 'row',
        alignItems: isStacked ? 'flex-start' : 'center',
        gap: isStacked ? 0.75 : 1,
      }}
    >
      {isStacked ? (
        <>
          {activeVoteNode}
          <Box
            sx={{
              width: activeRowWidth,
              display: 'flex',
              justifyContent: 'center',
              transform: `translateX(-${stackedCenterOffset}px)`,
            }}
          >
            {badgeNode}
          </Box>
        </>
      ) : (
        <>
          {badgeNode}
          {activeVoteNode}
        </>
      )}
    </Box>
  );
};

export default VoteControls;
