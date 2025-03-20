# iTimeline Frontend

Frontend application for the iTimeline platform, a modern web application for creating and sharing timelines with interactive event cards.

## Features

### Timeline V3
- Interactive timeline with event cards
- Event types: Remarks, News, and Media
- Event filtering by type with modern, animated buttons
- Event sorting (newest/oldest) with preference memory
- Smart event referencing system:
  - Events can appear in multiple timelines through hashtags
  - All instances of an event share the same data
  - Changes and interactions are synchronized across timelines
- Modern UI with animations and transitions
- Responsive search functionality
- Smooth scrolling to selected events
- Dynamic Event Counter that reflects the number of visible events in the current view
  - Updates automatically as users navigate through different timeline views
  - Accounts for partially visible markers at screen edges

### Date and Time Handling
- **Raw Date String Storage**: Stores event dates as raw strings in the format `MM.DD.YYYY.HH.MM.AMPM`
- **Exact User Time Preservation**: Uses the `is_exact_user_time` flag to indicate user-selected times
- **Timezone-Independent Display**: Ensures accurate representation of user-inputted event dates regardless of server timezone
- **Dual Timestamp System**:
  - **Event Date**: The user-selected date and time for the event (what happened when)
  - **Published Date**: The server timestamp when the event was created (when it was recorded)
- **Backward Compatibility**: Maintains ISO date format support for legacy features

## Technical Stack

- **Framework**: React.js
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Styling**: CSS with Tailwind CSS
- **Deployment**: Docker containerization for Render.com

## Key Dependencies

- `@mui/material`: UI components
- `@mui/icons-material`: Material icons
- `axios`: HTTP requests
- `react-router-dom`: Client-side routing
- `date-fns`: Date formatting and manipulation
- `tailwindcss`: Utility-first CSS framework

## Repository Structure

This repository contains only the frontend code for the iTimeline application. The backend code is maintained in a separate repository at [itimeline-backend](https://github.com/worldwidecam/itimeline-backend).

## Core Architecture

### Coordinate-Based Timeline (`TimelineV3.js`)  
- Zero-point reference system  
- Bidirectional infinite growth  
- Marker generation algorithm (`generateTimeMarkers`)  

### Event/Post Unification (`EventList.js`)  
- Shared data structure between events/posts  
- Hashtag-based timeline association  
- Identical rendering components  

### Navigation System (`TimelineControls.js`)  
- Scroll position preservation  
- URL parameter synchronization  
- Hover marker persistence  

## Setup and Installation

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/worldwidecam/itimeline-frontend.git
   cd itimeline-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

4. Start the development server:
   ```
   npm start
   ```

### Using Docker for Local Development

1. Build and start the container:
   ```
   docker-compose up
   ```

## Deployment

The application is configured for deployment on Render.com with the following setup:

1. **Static Site**:
   - Build Command: `chmod +x build.sh && ./build.sh`
   - Publish Directory: `build`
   - Environment Variables:
     - `REACT_APP_API_URL`: Your backend URL (e.g., https://api.i-timeline.com)
     - `REACT_APP_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name

## Configuration

The application uses environment variables for configuration. These can be set in a `.env` file for local development or in the Render dashboard for production:

- `REACT_APP_API_URL`: URL of the backend API
- `REACT_APP_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for image optimization

## Best Practices

### Environment-Specific Configuration
- The application uses environment variables to avoid hardcoded values
- API URLs are configured based on the environment
- Configuration is centralized in `src/config.js`

### API Communication
- All API calls are made through the Axios client
- API base URL is configured through environment variables
- Authentication tokens are handled by interceptors

## Troubleshooting

- **API Connection Issues**: Verify that `REACT_APP_API_URL` is correctly set and the backend is running
- **Authentication Problems**: Check that the JWT token is being properly stored and sent with requests
- **Image Loading Issues**: Confirm that Cloudinary is properly configured
- **Cross-Origin Errors**: Ensure that CORS is properly configured on the backend

## Browser Compatibility

The application is tested and compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
