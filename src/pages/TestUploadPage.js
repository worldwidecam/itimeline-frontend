import React from 'react';
import { Container, Typography } from '@mui/material';
import TestUpload from '../test-upload';

const TestUploadPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Media Upload Test Page
      </Typography>
      <Typography variant="body1" paragraph align="center">
        Use this page to test media uploads for the iTimeline application
      </Typography>
      
      <TestUpload />
    </Container>
  );
};

export default TestUploadPage;
