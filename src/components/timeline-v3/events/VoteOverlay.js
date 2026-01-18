import React from 'react';
import { Box } from '@mui/material';
import VoteControls from './VoteControls';

const VoteOverlay = ({ value, positiveRatio, totalVotes, isLoading = false, hasError = false }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }}
    >
      <VoteControls
        value={value}
        positiveRatio={positiveRatio}
        totalVotes={totalVotes}
        isLoading={isLoading}
        hasError={hasError}
      />
    </Box>
  );
};

export default VoteOverlay;
