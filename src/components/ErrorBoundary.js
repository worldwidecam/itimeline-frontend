import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    // Reset the error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Attempt to reload the component
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h5" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We're having trouble loading this timeline. This might be due to a temporary connection issue.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReset}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => window.location.href = '/'}
            sx={{ mt: 2 }}
          >
            Go to Home Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
