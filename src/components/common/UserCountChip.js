import React from 'react';
import { Chip, useTheme } from '@mui/material';

const formatLargeNumber = (num) => {
  if (typeof num !== 'number') return '';
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
};

const UserCountChip = ({ count, sx }) => {
  const theme = useTheme();

  if (typeof count !== 'number') return null;

  return (
    <Chip
      label={`🔥 ${formatLargeNumber(count)} Users Strong!`}
      sx={{
        height: 30,
        fontWeight: 700,
        borderRadius: 999,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark'
          ? 'rgba(251, 146, 60, 0.42)'
          : 'rgba(194, 65, 12, 0.34)',
        color: theme.palette.mode === 'dark' ? '#fde68a' : '#7c2d12',
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(244, 114, 34, 0.26)'
          : 'rgba(251, 146, 60, 0.22)',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 20px rgba(0, 0, 0, 0.24)'
          : '0 8px 18px rgba(194, 65, 12, 0.14)',
        '& .MuiChip-label': {
          px: 1.25,
        },
        ...sx,
      }}
    />
  );
};

export default UserCountChip;
