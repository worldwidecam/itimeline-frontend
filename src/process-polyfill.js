/**
 * This file provides a polyfill for the Node.js process object in the browser
 * It helps with compatibility when migrating from Create React App to Vite
 */

// Create a process polyfill with env object if it doesn't exist
window.process = window.process || {
  env: {},
  // Add any other process properties that might be needed
  nextTick: (cb) => setTimeout(cb, 0),
  version: '',
  versions: {},
  platform: 'browser',
};

// Set up the NODE_ENV based on Vite's mode
window.process.env.NODE_ENV = import.meta.env.MODE;

// Map all Vite environment variables to both formats for maximum compatibility
Object.keys(import.meta.env).forEach(key => {
  // Copy all VITE_ variables directly
  window.process.env[key] = import.meta.env[key];
  
  // Also map VITE_ variables to REACT_APP_ format for backward compatibility
  if (key.startsWith('VITE_')) {
    const reactKey = key.replace('VITE_', 'REACT_APP_');
    window.process.env[reactKey] = import.meta.env[key];
  }
});

// Add API URL if not already set
if (!window.process.env.REACT_APP_API_URL && !window.process.env.VITE_API_URL) {
  const apiUrl = import.meta.env.DEV ? 'http://localhost:5000' : 'https://api.i-timeline.com';
  window.process.env.REACT_APP_API_URL = apiUrl;
  window.process.env.VITE_API_URL = apiUrl;
}

// Add Cloudinary cloud name if not already set
if (!window.process.env.REACT_APP_CLOUDINARY_CLOUD_NAME && !window.process.env.VITE_CLOUDINARY_CLOUD_NAME) {
  window.process.env.REACT_APP_CLOUDINARY_CLOUD_NAME = 'demo';
  window.process.env.VITE_CLOUDINARY_CLOUD_NAME = 'demo';
}

// Log the environment setup for debugging
console.log('Process polyfill initialized with:', {
  NODE_ENV: window.process.env.NODE_ENV,
  API_URL: window.process.env.VITE_API_URL,
});

export default window.process;
