import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  // Use the React plugin with JSX runtime automatic setting
  plugins: [
    react({
      // Use React 17 JSX transform
      jsxRuntime: 'automatic',
      // Ensure React is included
      include: '**/*.{jsx,js}',
    }),
  ],
  resolve: {
    alias: {
      // This allows imports from 'src/' similar to CRA's behavior
      'src': path.resolve(__dirname, './src')
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  // Preserve CRA's public folder behavior
  publicDir: 'public',
  // Configure server options
  server: {
    port: 3000,
    open: true,
    // Add better error handling
    hmr: {
      overlay: true,
    },
  },
  // Handle environment variables similar to CRA
  define: {
    // Map NODE_ENV for React and other libraries
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Add common environment variables with fallbacks
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000'),
    'process.env.REACT_APP_CLOUDINARY_CLOUD_NAME': JSON.stringify(process.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'),
    // Global is needed for some npm packages
    'global': 'window',
  },
  // Configure esbuild to handle JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: /\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx', // Treat all .js files as JSX
      },
      // Define global variables for compatibility
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    outDir: 'build', // Same output directory as CRA for consistency
    sourcemap: true,
    commonjsOptions: {
      // Handle mixed ES/CommonJS modules
      transformMixedEsModules: true,
      // Include React-related packages
      include: [/node_modules/],
    },
    // Increase the warning limit to avoid unnecessary warnings
    chunkSizeWarningLimit: 1000,
    // Configure code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Split MUI components into a separate chunk
          mui: ['@mui/material', '@mui/icons-material', '@mui/lab'],
          // Split React and related packages into a separate chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split utility libraries into a separate chunk
          utils: ['date-fns', 'axios', 'framer-motion'],
        },
      },
    },
  },
});
