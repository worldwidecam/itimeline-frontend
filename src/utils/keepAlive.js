import api from './api';

/**
 * Simple utility to periodically ping the backend to prevent it from spinning down
 * on free tier hosting services like Render.
 */
const setupKeepAlive = () => {
  // Only run in production environment
  if (process.env.NODE_ENV !== 'production') return;
  
  const INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  const pingServer = async () => {
    try {
      await api.get('/api/health-check');
      console.log('Keep-alive ping sent to backend');
    } catch (error) {
      console.error('Keep-alive ping failed:', error);
    }
  };
  
  // Initial ping when the app loads
  pingServer();
  
  // Set up interval for regular pings
  const intervalId = setInterval(pingServer, INTERVAL);
  
  // Clean up on component unmount
  return () => clearInterval(intervalId);
};

export default setupKeepAlive;
