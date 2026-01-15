import React, { useState } from 'react';
import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const ChevronArrow = ({ direction = 'up' }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    sx={{
      width: 20,
      height: 16,
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

  const clampedPositiveRatio = Math.max(0, Math.min(positiveRatio, 1));
  const dividerPosition = clampedPositiveRatio * 100;

  const handleVote = (direction) => (event) => {
    event.stopPropagation();
    const nextVote = vote === direction ? null : direction;
    if (onChange) {
      onChange(nextVote);
    } else {
      setInternalVote(nextVote);
    }
  };

  const handlePillClick = (event) => {
    event.stopPropagation();
    if (onChange) {
      onChange(null);
    } else {
      setInternalVote(null);
    }
  };

  const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'relative',
        width: width,
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!isActive ? (
        <Box
          sx={{
            position: 'absolute',
            width: width,
            height: height,
            borderRadius: height / 2,
            border: `2px solid ${neutralColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingX: 1.5,
            transition: `all 0.3s ${easing}`,
            opacity: 1,
            transform: 'scale(1)',
            background: showVoteText ? 'transparent' : 'transparent',
          }}
        >
          {showVoteText ? (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
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
                  cursor: 'pointer',
                  color: isPositive ? positiveColor : neutralColor,
                  transition: `color 0.2s ease`,
                  '&:hover': {
                    color: positiveColor,
                  },
                }}
              >
                <ChevronArrow direction="up" />
              </Box>

              <Box
                sx={{
                  width: 0.5,
                  height: height * 0.6,
                  background: `linear-gradient(90deg, ${positiveColor}, ${negativeColor})`,
                  opacity: 1,
                }}
              />

              <Box
                onClick={handleVote('down')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isNegative ? negativeColor : neutralColor,
                  transition: `color 0.2s ease`,
                  '&:hover': {
                    color: negativeColor,
                  },
                }}
              >
                <ChevronArrow direction="down" />
              </Box>
            </>
          )}
        </Box>
      ) : null}

      {isActive && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: positiveColor,
              letterSpacing: '0.3px',
            }}
          >
            {Math.round(dividerPosition)}%
          </Box>

          <Box
            onClick={handlePillClick}
            sx={{
              position: 'relative',
              width: width,
              height: height,
              borderRadius: height / 2,
              border: `2px solid ${alpha(theme.palette.text.primary, 0.2)}`,
              cursor: 'pointer',
              transition: `all 0.3s ${easing}`,
              opacity: 1,
              transform: 'scale(1)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
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
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VoteControls;
