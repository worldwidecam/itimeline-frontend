import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  useTheme,
  Divider,
  Stack
} from '@mui/material';
import Info from '@mui/icons-material/Info';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../utils/api';

const CommunityInfoCardsDisplay = ({ timelineId }) => {
  const theme = useTheme();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get(`/api/v1/timelines/${timelineId}/info-cards`);
        const cardsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setCards(cardsData);
      } catch (err) {
        console.error('Failed to load info cards:', err);
        // Only set error if it's not a 404 (which means no cards exist)
        if (err?.response?.status !== 404) {
          setError('Failed to load info cards');
        }
        setCards([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (timelineId) {
      loadCards();
    }
  }, [timelineId]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
          border: `1px solid ${theme.palette.error.light}`,
          borderRadius: 2
        }}
      >
        <Typography 
          color="error" 
          variant="body2"
          sx={{ mb: 1, fontWeight: 500 }}
        >
          Unable to load info cards
        </Typography>
        <Typography 
          color="text.secondary" 
          variant="caption"
        >
          There was a problem loading the community info cards. Please try refreshing the page.
        </Typography>
      </Paper>
    );
  }

  if (cards.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Info sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5 }}>
          No community info cards yet
        </Typography>
        <Typography color="text.disabled" variant="caption">
          Community moderators can create info cards from the Admin Panel
        </Typography>
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Stack spacing={2}>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              sx={{
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: 'translateY(-2px)'
                },
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1.5,
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  {card.title}
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    '& a': {
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }
                  }}
                >
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Stack>
    </motion.div>
  );
};

export default CommunityInfoCardsDisplay;
