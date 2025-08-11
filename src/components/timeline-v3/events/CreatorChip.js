import React from 'react';
import {
  Box,
  Typography,
  Link,
  useTheme
} from '@mui/material';
import UserAvatar from '../../common/UserAvatar';
import { Person as PersonIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * CreatorChip - A reusable component that displays creator information with avatar and profile link
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - User object containing id, username, and avatar
 * @param {string} props.color - Accent color for the chip (defaults to primary color)
 * @returns {JSX.Element} Rendered creator chip
 */
const CreatorChip = ({ user, color }) => {
  const theme = useTheme();
  
  // If no user data or no username, don't render anything
  if (!user || !user.username) return null;
  
  // If no color provided, use the primary color from theme
  const chipColor = color || theme.palette.primary.main;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      mb: 3, 
      p: 2, 
      bgcolor: theme.palette.mode === 'dark' 
        ? `${chipColor}15`  // 15% opacity in dark mode
        : `${chipColor}08`,  // 8% opacity in light mode
      borderRadius: 2, 
      borderLeft: `3px solid ${chipColor}`,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateX(2px)',
        boxShadow: theme.shadows[1]
      }
    }}>
      <UserAvatar 
        name={user.username}
        avatarUrl={user.avatar}
        id={user.id}
        size={44}
        sx={{ 
          mr: 2,
          border: `2px solid ${chipColor}`,
        }}
      />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <PersonIcon sx={{ fontSize: 16, mr: 0.75, color: chipColor, opacity: 0.8 }} />
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.8)' 
                : 'rgba(0,0,0,0.8)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.7rem',
            }}
          >
            Created By
          </Typography>
        </Box>
        <Link 
          component={RouterLink}
          to={`/profile/${user.id}`}
          sx={{
            fontWeight: 600,
            color: theme.palette.mode === 'dark' ? 'white' : 'rgba(0,0,0,0.9)',
            textDecoration: 'none',
            display: 'block',
            fontSize: '1.1rem',
            '&:hover': {
              color: chipColor,
            },
          }}
        >
          {user.username}
        </Link>
      </Box>
    </Box>
  );
};

export default CreatorChip;
