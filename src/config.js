const config = {
    API_URL: process.env.NODE_ENV === 'production' 
        ? (process.env.REACT_APP_API_URL || 'https://api.i-timeline.com')
        : 'http://localhost:5000',
    
    // Add version information
    VERSION: '1.0.0',
    
    // Add Cloudinary configuration for frontend transformations
    CLOUDINARY: {
        CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo',
        SECURE: true
    }
};

export default config;
