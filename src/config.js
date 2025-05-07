const config = {
    // Use Vite's environment variables format
    API_URL: import.meta.env.MODE === 'production' 
        ? (import.meta.env.VITE_API_URL || 'https://api.i-timeline.com')
        : 'http://localhost:5000',
    
    // Add version information
    VERSION: '1.0.0',
    
    // Add Cloudinary configuration for frontend transformations
    CLOUDINARY: {
        CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
        SECURE: true
    }
};

export default config;
