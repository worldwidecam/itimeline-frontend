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
    host: '0.0.0.0', // Listen on all network interfaces
    cors: true, // Enable CORS for all origins
    // Add better error handling
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
    },
    // Proxy API requests to the backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // Add CORS headers for the preview
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            // Ensure CORS headers are set in the response
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        },
      }
    }
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
    sourcemap: process.env.NODE_ENV !== 'production', // Only generate sourcemaps in development
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
        // Use content hashing for better cache control
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
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
    // Minify the output in production
    minify: process.env.NODE_ENV === 'production',
    // Target modern browsers for better performance
    target: 'es2015',
  },
});
