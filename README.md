# iTimeline Frontend

Frontend application for the iTimeline platform, a modern web application for creating and sharing timelines with interactive event cards.

## Features

### Diagnostic Tools
- **MediaUploader Component**: A standalone component on the homepage for testing and diagnosing media uploads
  - Direct upload to Cloudinary with detailed logging
  - Support for images, videos, and audio files
  - Preview functionality for uploaded media
  - Created to help troubleshoot media upload functionality in the main application
  - Serves as a reference implementation for proper media handling

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

## Design Standards

### Event Card Interactions

#### Double-Click Behavior
Event cards in the timeline support a double-click interaction pattern:
- First click: Selects the card (highlights it and scrolls it into view)
- Second click: Opens the Event Popup with detailed information

#### Implementation Details
- Each card type (Media, News, Remark) has its own component with a dedicated click handler
- The click handler checks if the card is already selected before opening the popup
- The animation effect (push-in animation) is implemented using Framer Motion's `whileTap` property

#### Known Issues and Solutions
- **Issue**: Media cards may not respond to clicks or may not show the push-in animation effect
- **Solution**: Ensure each card component has:
  1. A direct click handler on the motion.div wrapper: `onClick={(e) => { e.stopPropagation(); handleCardClick(); }}`
  2. The `whileTap={{ scale: 0.98 }}` animation property
  3. A properly implemented `handleCardClick` function that checks for `isSelected` and opens the popup

#### Popup Closing
- Event popups can be closed by:
  1. Clicking the X button in the top-right corner
  2. Clicking outside the popup
  3. Pressing the Escape key

### Theme Quality Standard
- **Neon Effect**: The application uses sophisticated neon effects for key elements like the logo, with multi-layered text shadows and box shadows
- **Gradient Backgrounds**: Dark theme uses a vertical gradient from black to dark blue (#000000 → #0a1128 → #1a2456)
- **Animation**: Subtle flicker animations are used to enhance the neon effect
- **Contrast**: High contrast between text and background ensures readability while maintaining visual appeal
- **Responsive Design**: All visual elements adapt to different screen sizes while preserving the aesthetic quality

### Landing Page
- **Clean Interface**: The landing page appears without the top navigation bar for a distraction-free introduction
- **Interactive Timeline Demo**: Features a fully functional timeline with different view modes (day, week, month, year)
- **Context-Specific Events**: Each view mode displays different types of example events appropriate for that time scale
- **Direct Authentication**: Sign in and registration buttons are prominently displayed for easy access
- **Automatic Redirection**: Authenticated users are automatically redirected to the home page

### Navigation Structure
- **Conditional Navigation**: The top navigation bar appears on all pages except the landing page
- **Consistent Layout**: All authenticated pages maintain the same navigation structure for familiarity
- **Protected Routes**: Secure routes require authentication and redirect unauthenticated users to the login page
- **Logical Flow**: The application follows a natural flow from landing → authentication → home → timeline creation

### Website Terminology
- **Event**: A single entry on the timeline, which can be a remark, news, or media
- **Timeline**: A collection of events, which can be filtered, sorted, and shared
- **View Mode**: The different ways to display the timeline, such as day, week, month, or year
- **Marker**: A visual representation of an event on the timeline

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

#### Frontend Setup

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

#### Backend Setup

1. Clone the backend repository:
   ```
   git clone https://github.com/worldwidecam/itimeline-backend.git
   cd itimeline-backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=sqlite:///timeline_forum.db
   JWT_SECRET_KEY=your-local-secret-key
   FRONTEND_URL=http://localhost:3000
   ```

4. Start the development server:
   ```
   python app.py
   ```

#### Database Configuration

For local development, the backend uses SQLite by default. This provides a simple, file-based database that requires no additional setup. The database file will be created automatically when you start the backend server.

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

## Media Upload System

### Architecture
- **MediaUploader Component**: Standalone component for uploading files to Cloudinary
  - Handles file selection, validation, and upload
  - Provides detailed logging and error handling
  - Displays uploaded files with preview functionality
- **MediaEventCreator Component**: Integrates MediaUploader into the timeline event creation workflow
  - Captures upload results from MediaUploader
  - Formats data correctly for event creation
  - Handles form submission to create media events
- **MediaCard Component**: Displays media events in the timeline
  - Supports multiple media types (images, videos, audio)
  - Implements fallback mechanisms for URL resolution
  - Provides interactive media controls

### Data Flow
1. User selects a file in MediaUploader
2. File is uploaded to Cloudinary via `/api/upload-media` endpoint
3. Upload response contains URL, media type, and Cloudinary ID
4. MediaEventCreator captures this data and combines it with event details
5. Event is created with the correct media information
6. MediaCard displays the media using the URL from the event data

### Critical Fields for Media Events
- **media_url**: The URL to the media file on Cloudinary
- **url**: Duplicate of media_url for compatibility with different components
- **media_type**: The type of media (image, video, audio)
- **media**: Object containing type and URL information
- **type**: Must be set to EVENT_TYPES.MEDIA for proper event type identification
- **raw_event_date**: Formatted date string for display
- **is_exact_user_time**: Flag indicating this is a user-selected time

## Media Upload Components Documentation

### Active Components (DO NOT MODIFY)

The application includes several media upload components, but only some are actively used in the production flow. Be extremely careful when modifying these components as they are sensitive to changes:

1. **MediaUploader.js** (`src/components/MediaUploader.js`): 
   - **ACTIVELY USED** in the production application
   - Imported directly by MediaEventCreator.js for the popup media event creation
   - **EXTREMELY SENSITIVE TO CHANGES** - modifications often break upload functionality
   - Shows all previously uploaded files from Cloudinary

2. **MediaEventCreator.js** (`src/components/timeline-v3/events/MediaEventCreator.js`):
   - **ACTIVELY USED** when creating media events from the floating button
   - Contains the dialog that appears when creating a new media event
   - Integrates with the MediaUploader component
   - **EXTREMELY SENSITIVE TO CHANGES** - modifications often break upload functionality

### Auxiliary Components (Safer to Modify)

3. **MediaEventUploader.js** (`src/components/timeline-v3/events/MediaEventUploader.js`):
   - **NOT ACTIVELY USED** in the main application flow
   - A simplified version that was intended for use within the event form
   - Can be modified with less risk of breaking core functionality

4. **CloudinaryUploader.js** (`src/components/shared/CloudinaryUploader.js`):
   - **TESTING ONLY** - not used in production flows
   - A dedicated component for testing Cloudinary uploads
   - Safe to modify for testing purposes

## Lessons Learned and Best Practices

### Component Integration
- **Prop Naming Consistency**: Ensure prop names match exactly between parent and child components
  - Example: Using `onSave` in both TimelineV3.js and MediaEventCreator.js
- **Data Format Alignment**: Match the data format expected by API endpoints
  - Example: Structuring event data to match what handleEventSubmit expects

### Media Handling
- **URL Field Redundancy**: Include media URLs in multiple fields for compatibility
  - Both `media_url` and `url` fields should be set
- **Media Type Detection**: Implement multiple detection methods
  - Check MIME types, file extensions, and response data
- **Fallback Mechanisms**: Always provide fallback URLs or placeholders

### Debugging Strategies
- **Console Logging**: Add detailed logs at each step of the upload process
- **Response Inspection**: Log API responses to identify data format issues
- **DOM Inspection**: Check rendered elements to verify media display

### Common Issues and Solutions
- **Prop Mismatch**: Ensure component props match exactly between parent and child
  - Solution: Review all prop names in both components and ensure they match
- **Data Format Mismatch**: API endpoints expect specific data formats
  - Solution: Log the expected format and ensure your data matches it exactly
- **Media URL Capture**: Upload results must be properly captured and stored
  - Solution: Implement multiple methods to capture the URL (state, DOM, response parsing)
- **Media Type Detection**: Different file types require different handling
  - Solution: Use multiple detection methods and provide fallbacks

## Troubleshooting

### Common Issues

- **API Connection Issues**: Verify that `REACT_APP_API_URL` is correctly set and the backend is running
- **Authentication Problems**: Check that the JWT token is being properly stored and sent with requests
- **Image Loading Issues**: Confirm that Cloudinary is properly configured
- **Cross-Origin Errors**: Ensure that CORS is properly configured on the backend

### Database Connection Issues

- **Local Development**: If you're having issues with the SQLite database, check that the database file has been created in the backend directory and has proper permissions
- **Production**: Currently, the production database is not available as the Render PostgreSQL instance has expired. Development will continue locally until a new production database solution is implemented

## Browser Compatibility

The application is tested and compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Issues

### Media Display in Event Cards

**Issue Description**: Media files uploaded through the EventForm are not displaying correctly in MediaCard and EventPopup components.

**Current Status**: As of March 25, 2025, we've attempted several approaches to fix this issue:

1. Updated URL construction in the EventForm to store relative URLs in the database
2. Modified MediaCard and EventPopup components to consistently handle media URLs
3. Added explicit cache control headers in the backend
4. Created a dedicated route for serving uploaded files
5. Added detailed logging throughout the media upload and display process

**Troubleshooting Findings**:
- Media files are successfully uploaded to the server (confirmed via logs)
- The backend returns the correct URL path for the uploaded files
- The frontend correctly constructs the full URL for display
- Despite these changes, media is still not displaying in the cards

**Possible Causes**:
- There might be a disconnect between how the MediaCard component expects to receive media URLs and how they're being stored
- The issue could be related to how the event data is being saved or retrieved from the database
- There might be browser caching issues preventing the media from displaying
- The media type detection logic might not be correctly identifying the uploaded files

**Next Steps**:
- Investigate how the profile avatar and music uploads are implemented, as these are working correctly
- Check the network requests in the browser to see if the media files are being requested correctly
- Consider implementing a completely different approach to media handling
- Review the database schema to ensure media URLs are being stored correctly

This issue is a high priority for the next development sprint.
