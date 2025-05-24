const config = {
    // Use Vite's environment variables format
    // In development, use relative URLs to work with the Vite proxy
    // In production, use the configured API URL or fall back to the default
    API_URL: import.meta.env.MODE === 'production' 
        ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
        : '', // Empty string for relative URLs in development
    
    // Add version information
    VERSION: '1.0.0',
    
    // Add Cloudinary configuration for frontend transformations
    CLOUDINARY: {
        CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
        SECURE: true
    }
};

export default config;
