import React from 'react';
import { Box, Typography, Card, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const QuoteDisplay = ({ 
  quote = "Those who make Peaceful Revolution impossible, will make violent Revolution inevitable.",
  author = "John F. Kennedy",
  variant = "default", // default, bronze, silver, gold, combined
}) => {
  const theme = useTheme();
  
  // Determine styling based on variant
  const getCardStyle = () => {
    const baseStyle = {
      position: 'relative',
      borderRadius: 2,
      overflow: 'hidden',
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: variant === 'gold' || variant === 'combined' ? 180 : 140,
      background: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.6)' : 'rgba(250,250,250,0.6)',
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 8px 16px rgba(0,0,0,0.3)'
        : '0 8px 16px rgba(0,0,0,0.1)',
    };
    
    // Add variant-specific styles
    switch(variant) {
      case 'bronze':
        return {
          ...baseStyle,
          flex: 1,
          mb: 0,
          background: theme.palette.mode === 'dark' ? 'rgba(45,37,32,0.6)' : 'rgba(248,240,232,0.6)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0,0,0,0.3), inset 0 0 8px rgba(205,127,50,0.1)'
            : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(205,127,50,0.1)',
          borderLeft: '3px solid',
          borderColor: '#cd7f32',
        };
      case 'silver':
        return {
          ...baseStyle,
          flex: 1,
          mb: 0,
          background: theme.palette.mode === 'dark' ? 'rgba(45,45,50,0.6)' : 'rgba(248,248,250,0.6)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0,0,0,0.3), inset 0 0 8px rgba(192,192,192,0.1)'
            : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(192,192,192,0.1)',
          borderRight: '3px solid',
          borderColor: '#c0c0c0',
        };
      case 'gold':
        return {
          ...baseStyle,
          mb: 3,
          mt: 1,
          background: theme.palette.mode === 'dark' ? 'rgba(45,42,32,0.6)' : 'rgba(248,243,226,0.6)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,215,0,0.1)'
            : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(255,215,0,0.1)',
          borderTop: '3px solid',
          borderColor: '#ffd700',
        };
      case 'combined':
        return {
          ...baseStyle,
          flex: 2,
          mb: 0,
          background: theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.6)' : 'rgba(245,245,245,0.6)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 16px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.05)'
            : '0 8px 16px rgba(0,0,0,0.1), inset 0 0 8px rgba(0,0,0,0.05)',
          borderBottom: '3px solid',
          borderImage: 'linear-gradient(to right, #cd7f32, #c0c0c0) 1',
        };
      default:
        return {
          ...baseStyle,
          mb: 3,
          mt: 1,
        };
    }
  };

  return (
    <Card sx={getCardStyle()}>
      {/* Large decorative quote mark at top */}
      <FormatQuoteIcon 
        sx={{ 
          fontSize: variant === 'gold' || variant === 'combined' ? '3rem' : '2.5rem',
          opacity: 0.2,
          transform: 'rotate(180deg)',
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          mb: 1
        }} 
      />
      
      <Typography 
        variant="h6" 
        component="blockquote"
        sx={{ 
          textAlign: 'center',
          fontFamily: '"Playfair Display", serif',
          fontStyle: 'italic',
          fontWeight: 500,
          mb: 2,
          px: 2,
          color: theme.palette.text.primary,
          fontSize: variant === 'gold' || variant === 'combined' ? '1.25rem' : '1rem',
          lineHeight: 1.5,
          position: 'relative',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            height: '2px',
            width: '30px',
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          },
          '&::before': {
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)'
          },
          '&::after': {
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)'
          }
        }}
      >
        {quote}
      </Typography>
      
      <Typography 
        variant="caption" 
        sx={{ 
          textAlign: 'center',
          fontWeight: 500,
          opacity: 0.7,
          fontStyle: 'italic',
          mt: 1
        }}
      >
        — {author}
      </Typography>
      
      {/* Small decorative quote mark at bottom */}
      <FormatQuoteIcon 
        sx={{ 
          fontSize: '1.5rem',
          opacity: 0.2,
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          mt: 1
        }} 
      />
    </Card>
  );
};

export default QuoteDisplay;
