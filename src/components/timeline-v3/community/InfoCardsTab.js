import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  useTheme,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../utils/api';

const InfoCardsTab = ({ timelineId }) => {
  const theme = useTheme();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  // Load info cards
  const loadCards = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/v1/timelines/${timelineId}/info-cards`);
      const cardsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setCards(cardsData);
    } catch (error) {
      console.error('Failed to load info cards:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load info cards',
        severity: 'error'
      });
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [timelineId]);

  // Handle opening create/edit dialog
  const handleOpenDialog = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({ title: card.title, description: card.description });
    } else {
      setEditingCard(null);
      setFormData({ title: '', description: '' });
    }
    setDialogOpen(true);
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCard(null);
    setFormData({ title: '', description: '' });
  };

  // Handle saving card (create or update)
  const handleSaveCard = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setSnackbar({
        open: true,
        message: 'Title and description are required',
        severity: 'warning'
      });
      return;
    }

    try {
      setIsCreating(true);

      if (editingCard) {
        // Update existing card
        await api.put(
          `/api/v1/timelines/${timelineId}/info-cards/${editingCard.id}`,
          {
            title: formData.title,
            description: formData.description
          }
        );
        setSnackbar({
          open: true,
          message: 'Info card updated successfully',
          severity: 'success'
        });
      } else {
        // Create new card
        await api.post(
          `/api/v1/timelines/${timelineId}/info-cards`,
          {
            title: formData.title,
            description: formData.description
          }
        );
        setSnackbar({
          open: true,
          message: 'Info card created successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      await loadCards();
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to save info card';
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle delete confirmation
  const handleOpenDeleteConfirm = (card) => {
    setCardToDelete(card);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setCardToDelete(null);
  };

  // Handle deleting card
  const handleDeleteCard = async () => {
    if (!cardToDelete) return;

    try {
      setIsCreating(true);
      await api.delete(
        `/api/v1/timelines/${timelineId}/info-cards/${cardToDelete.id}`
      );
      setSnackbar({
        open: true,
        message: 'Info card deleted successfully',
        severity: 'success'
      });
      handleCloseDeleteConfirm();
      await loadCards();
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to delete info card';
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              Community Info Cards
            </Typography>
            <Chip label={cards.length} size="small" variant="outlined" />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={isCreating}
          >
            New Card
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: 'background.default',
              borderRadius: 2
            }}
          >
            <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No info cards yet. Create one to get started!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create First Card
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>
            <AnimatePresence>
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[4],
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <DragIcon
                          sx={{
                            color: 'text.disabled',
                            mt: 0.5,
                            cursor: 'grab',
                            '&:active': { cursor: 'grabbing' }
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {card.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              mb: 2,
                              maxHeight: 100,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {card.description}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Order: {card.card_order}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(card)}
                        disabled={isCreating}
                        title="Edit card"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteConfirm(card)}
                        disabled={isCreating}
                        title="Delete card"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Stack>
        )}

        {/* Create/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingCard ? 'Edit Info Card' : 'Create New Info Card'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Title"
                fullWidth
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Our Discord Server"
                disabled={isCreating}
                inputProps={{ maxLength: 255 }}
                helperText={`${formData.title.length}/255`}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details, links, or formatted text..."
                disabled={isCreating}
                helperText="Supports text formatting and links"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCard}
              variant="contained"
              disabled={isCreating || !formData.title.trim() || !formData.description.trim()}
            >
              {isCreating ? <CircularProgress size={24} /> : (editingCard ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={handleCloseDeleteConfirm}
        >
          <DialogTitle>Delete Info Card?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{cardToDelete?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteConfirm} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCard}
              color="error"
              variant="contained"
              disabled={isCreating}
            >
              {isCreating ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default InfoCardsTab;
