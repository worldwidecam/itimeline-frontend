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
      {/* Artistic quote composition */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        {/* Decorative top accent with shimmer effect */}
        <Box 
          sx={{
            width: '200px',
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}, transparent)`,
            margin: '0 auto',
            mb: 3,
            borderRadius: '2px',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-1px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '15px',
              height: '0px',
              background: `linear-gradient(90deg, transparent, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}, transparent)`,
              borderRadius: '3px',
              filter: 'blur(1px)'
            }
          }}
        />
        
        {/* Quote with creative quote mark positioning */}
        <Box sx={{ position: 'relative', px: 2 }}>
          {/* Oversized stylized left quote */}
          <Box
            sx={{
              position: 'absolute',
              left: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '4rem',
              opacity: 0.15,
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              lineHeight: 0.8,
              zIndex: 1,
              userSelect: 'none'
            }}
          >
            “
          </Box>
          
          {/* Oversized stylized right quote */}
          <Box
            sx={{
              position: 'absolute',
              right: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '4rem',
              opacity: 0.15,
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              lineHeight: 0.8,
              zIndex: 1,
              userSelect: 'none'
            }}
          >
            ”
          </Box>
          
          <Typography 
            variant="h6" 
            component="blockquote"
            sx={{ 
              textAlign: 'center',
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontWeight: 500,
              px: 2,
              py: 2,
              color: theme.palette.text.primary,
              fontSize: variant === 'gold' || variant === 'combined' ? '1.25rem' : '1rem',
              lineHeight: 1.7,
              position: 'relative',
              zIndex: 2,
              maxWidth: 'calc(100% - 20px)',
              ml: 1,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05))'
                : 'linear-gradient(135deg, rgba(0,0,0,0.02), rgba(0,0,0,0.05))',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              textShadow: theme.palette.mode === 'dark' 
                ? '0 1px 2px rgba(0,0,0,0.3)'
                : '0 1px 2px rgba(255,255,255,0.8)'
            }}
          >
            {quote}
          </Typography>
        </Box>
        
        {/* Artistic separator with diamond accent */}
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 3,
            mb: 2
          }}
        >
          <Box 
            sx={{
              width: '30px',
              height: '1px',
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
            }}
          />
          <Box 
            sx={{
              width: '6px',
              height: '6px',
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              transform: 'rotate(45deg)',
              mx: 2,
              borderRadius: '1px'
            }}
          />
          <Box 
            sx={{
              width: '30px',
              height: '1px',
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
            }}
          />
        </Box>
      </Box>
      
      <Typography 
        variant="caption" 
        sx={{ 
          textAlign: 'center',
          fontWeight: 600,
          opacity: 0.8,
          fontStyle: 'italic',
          letterSpacing: '1px',
          fontSize: '0.75rem',
          textTransform: 'uppercase'
        }}
      >
        {author}
      </Typography>
    </Card>
  );
};

export default QuoteDisplay;
