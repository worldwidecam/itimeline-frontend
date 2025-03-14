import React from 'react';
import { Dialog, DialogContent } from '@mui/material';
import EventDisplay from '../EventDisplay';

const EventDialog = ({
  selectedEvent,
  onClose,
  onEdit,
  onDelete,
  currentUserId
}) => {
  return (
    <Dialog
      open={Boolean(selectedEvent)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogContent>
        {selectedEvent && (
          <EventDisplay
            event={selectedEvent}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUserId={currentUserId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
