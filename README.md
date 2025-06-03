# iTimeline Frontend

Frontend application for the iTimeline platform, a modern web application for creating and sharing timelines with interactive event cards.

## Current Focus (June 2025)

### Popup Styling Standards

The iTimeline application implements a consistent styling approach across all event popup components, ensuring a cohesive user experience. The following standards have been established:

#### CreatorChip Component
- **Purpose**: Displays creator information with avatar, username, and profile link
- **Implementation**: Reusable component with color-aware styling
- **Location**: Used in all event popup components (NewsEventPopup, EventPopup, VideoEventPopup, ImageEventPopup, AudioMediaPopup)
- **Styling**:
  - Color-aware background with low opacity (15% dark mode, 8% light mode)
  - Left border accent using event type color
  - Consistent avatar size (44px) with color border
  - Hover effect with subtle transform and shadow
  - Responsive typography with proper hierarchy

#### Event Popup Standards
- **Dialog Title**:
  - Color-aware type icon matching event theme color
  - Consistent sizing and spacing
  - Clear visual hierarchy with proper typography

- **Header Accent Bar**:
  - Color-aware gradient accent at the top of the popup
  - Gradient transitions from full color to transparent (left to right)
  - Format: `linear-gradient(90deg, ${eventColor} 0%, ${eventColor}99 50%, ${eventColor}44 100%)`
  - Height of 8px for visual consistency

- **Event Details Section**:
  - Consistent metadata presentation with color-aware icons
  - Timeline Date with EventIcon in event theme color
  - Published Date with AccessTimeIcon in event theme color
  - Proper spacing and alignment between elements

- **Color Theme Reference**:
  - News Events: Red (#d32f2f)
  - Remark Events: Blue (#2196f3)
  - Video Events: Deep Purple (#673ab7)
  - Image Events: Teal (#009688)
  - Audio Events: Orange (#ff9800)

#### Implementation Guidelines
- All popups should use the CreatorChip component for creator information
- Icons in the event details section should be color-aware using the event theme color
- The type icon in the dialog title should match the event theme color
- Maintain consistent spacing, typography, and visual hierarchy across all popups

### Form Validation Improvements

#### Media Event Form Validation
- **Enhanced Submit Button Logic**: Submit buttons are now properly disabled until required fields are completed
- **Media Event Creator**: The "Create Media Event" button remains disabled until:
  - A title is entered
  - A media file is successfully uploaded
- **Improved User Experience**: Prevents creation of incomplete or empty media events
- **Consistent Validation**: Aligns with validation patterns used in other event forms

### Audio Media Popup & Waveform Visualizer

The AudioMediaPopup provides an immersive audio playback experience with real-time waveform visualization:

#### AudioMediaPopup
- **Layout**: Two-panel design with fixed audio visualizer (60%) and scrollable content (40%)
- **Features**:
  - Persistent audio playback controls
  - Real-time waveform visualization
  - Event details including title, description, and metadata
  - Timeline tagging functionality
  - Responsive design for all screen sizes

#### AudioWaveformVisualizer
- **Core Features**:
  - Real-time audio waveform visualization
  - Beat detection across multiple frequency bands
  - Interactive playback controls
  - Volume adjustment with mute toggle
  - Timeline seeking

- **Visual Elements**:
  - Central pulsing core that responds to audio levels
  - Ripple effects triggered by beat detection
  - Theme-aware color schemes (light/dark mode)
  - Smooth animations and transitions

- **Technical Implementation**:
  - Built with Web Audio API for precise audio analysis
  - Uses Canvas API for high-performance rendering
  - Implements requestAnimationFrame for smooth animations
  - Self-contained audio element management

- **Integration**:
  - Import: `import AudioWaveformVisualizer from '../../../components/AudioWaveformVisualizer'`
  - Usage in AudioMediaPopup with required props:
    ```jsx
    <AudioWaveformVisualizer 
      ref={audioVisualizerRef}
      audioUrl={mediaSource}
      title={eventData.title}
      previewMode={false}
      showTitle={false}
      compactMode={true}
    />
    ```

### Audio Visualizer 2.0

The `AudioWaveformVisualizer` component has been enhanced to provide a rich, interactive audio visualization experience:

1. **Interactive Audio Visualization**
   - Dynamic waveform visualization that responds to audio beats and frequencies
   - Visual states: resting state (pulsing core) when paused, active state (ripples, auras) during playback
   - Beat detection for synchronized visual effects

2. **Integration Points**
   - `MediaCard`: Visualizer displays in preview mode with playback controls
   - `EventPopup`: Full-featured visualizer with enhanced playback experience
   - `AudioTester`: Test component for audio upload and visualization

3. **Implementation Notes**
   - Uses Web Audio API for audio processing and beat detection
   - Self-contained audio playback handling (no external audio elements needed)
   - Configurable via props: `audioUrl`, `title`, `previewMode`
   - Exposes playback methods via `useImperativeHandle`: `playAudio()`, `pauseAudio()`

4. **Usage Guidelines**
   - Set `previewMode={false}` for full functionality including beat detection
   - Always provide a `title` prop when not in preview mode
   - No need for separate audio elements - the visualizer handles playback internally

### Audio Playback Controls

1. **Playback Controls**
   - Play/Pause toggle button
   - Volume slider with mute toggle
   - Timeline scrubber for seeking
   - Time display (current time / duration)

2. **Visual Feedback**
   - Loading states
   - Error handling
   - Buffering indicators
   - Playback rate controls

### Perfecting Event Markers and Info Cards
1. **MediaEventMarker**
   - Optimize media rendering and performance
   - Improve visual feedback for different media states
   - Ensure consistent behavior across all view modes

2. **NewsEventMarker**
   - Resolve duplicate image issues
   - Enhance visual hierarchy and readability
   - Improve interaction states and transitions

3. **RemarkEventMarker**
   - Refine visual presentation
   - Optimize text rendering and truncation
   - Ensure consistent styling with other markers

## Timeline Performance Optimization

The timeline component implements a progressive loading strategy to ensure smooth transitions between different view modes, especially when dealing with large numbers of events:

### Priority-Based Loading
1. **Timeline Structure First**: The timeline bar and marker dividers load immediately when switching views
2. **Event List Second**: The event list loads next, initially showing only the first batch of events (10-20) based on current sort order
3. **Event Markers Third**: Event markers load progressively with fade-in animations, prioritizing markers for events currently visible in the list
4. **Background Loading**: Additional events and markers load in the background as resources become available

### Performance Considerations
- **View Mode Transitions**: Transitions between view modes (day, week, month, year) are optimized to maintain responsiveness
- **Progressive Rendering**: Events and markers render in batches to prevent UI freezing with large datasets
- **Fade-In Cushioning**: Visual elements use staggered fade-in animations to create a smoother perception of loading
- **Marker Virtualization**: Only markers within or near the viewport are fully rendered to reduce DOM elements

### Event Marker Popovers

Event markers display interactive popovers when selected, providing a preview of the event content. These popovers are implemented using Material-UI's `Paper` component with custom styling.

#### Popover Types
- **News Events**: Display article title, source, and image (if available)
- **Media Events**: Show media preview with type indicator
- **Remark Events**: Show title and author

#### Customization
- **Positioning**: Popovers appear above their markers with dynamic positioning
  - News events: 24px above marker
  - Other events: 36px above marker
- **Styling**: Each event type has distinct styling:
  - Background colors and borders are theme-aware (light/dark mode)
  - Subtle box shadows and transitions for better visual hierarchy
  - Responsive scaling (80% of original size)

#### Implementation Notes
- Popovers are triggered on click (not hover) for better mobile support
- Media previews are only shown for `EVENT_TYPES.MEDIA`
- News events handle their own image display in the `EventHoverCard` component

### EventMarker Refactoring (June 2024)
- **Modular Marker Components**: Split into specialized components for each event type
  - `MediaEventMarker`: Handles image, video, and audio events with type-specific rendering
  - `NewsEventMarker`: Dedicated component for news events with optimized image handling
  - `RemarkEventMarker`: Focused component for remark/note events
- **Performance Improvements**:
  - Reduced re-renders through better component isolation
  - Optimized media loading and error handling
  - Consistent styling and behavior across all event types
- **Code Maintainability**:
  - Clear separation of concerns
  - Reusable utility functions
  - Consistent prop interfaces
  - Improved testability

### EventMarker Optimization (May 2025) <!-- BOOKMARK: EVENTMARKER_OPTIMIZATION -->
- **Immediate Marker Rendering**: Event markers now appear immediately after event creation without requiring a page refresh
- **Smart Re-rendering**: Uses React Router navigation technique to force component re-renders without full page reloads
- **Session Preservation**: Maintains user authentication during re-renders by avoiding full page refreshes
- **Improved User Experience**: Creates a seamless workflow where users can create events and immediately see them on the timeline
- **Implementation Details**:
  - Leverages the same refresh technique used in the hamburger menu navigation
  - Temporarily navigates to a redirect page and back to trigger component re-mounting
  - Clears position caches to ensure proper marker positioning after re-render

### Loading Process Improvements <!-- BOOKMARK: LOADING_PROCESS_IMPROVEMENTS -->
- **Enhanced Loading Transitions**: The EventList workspace uses sophisticated fade-in transitions with multiple properties:
  - Opacity transition (0.6 → 1.0) with 1.2s duration
  - Subtle vertical movement (8px upward) during fade-in
  - Slight blur effect (1px → 0px) for a focus effect
  - Material Design easing curve for natural motion
  - Performance optimization with willChange property
- **Non-Disruptive Loading Indicator**:
  - Fixed position overlay at bottom-left corner
  - Doesn't affect layout or cause flickering
  - Contextual messages based on loading phase and view mode
  - Modern pill design with subtle animations
  - Pulsing dot with color changes based on loading phase
- **Layout Stability Optimizations**:
  - Removed in-flow loading indicators that caused layout shifts
  - Consolidated all loading states into a single, consistent indicator
  - Fixed positioning ensures loading indicators never disrupt content flow
  - Smooth transitions prevent jarring visual changes

### Event Marker Height Constraints <!-- BOOKMARK: EVENT_MARKER_HEIGHT_CONSTRAINTS -->
- **Workspace-Aware Marker Heights**: Event markers dynamically adjust their heights to respect workspace boundaries
- **State-Based Constraints**:
  - Selected markers: Maximum height ensures at least 10px from top of workspace
  - Hovered markers: Maximum height ensures at least 20px from top of workspace
  - Regular markers: Maximum height ensures at least 30px from top of workspace
- **View-Specific Adjustments**: Different base heights for each view mode (year, month, week, day)
- **Overlapping Factor**: Marker heights still grow logarithmically when events cluster, but with enforced maximums
- **Responsive Design**: Constraints automatically adjust based on available viewport height

### EventList Pagination <!-- BOOKMARK: EVENTLIST_PAGINATION -->
- **Progressive Loading**: Initially displays only the first 20 events to improve performance
- **Load More Button**: Allows users to incrementally load 20 more events at a time with a down arrow icon
- **Smart Selection Handling**: Automatically ensures selected events are visible regardless of pagination
- **Adaptive Reset**: Pagination resets when filter criteria change to maintain consistency
- **Event Count Summary**: Shows users how many events are currently displayed out of the total filtered events
- **Memory Efficient**: All events remain in memory for marker display while limiting DOM rendering
- **To Top Button**: Floating action button appears when scrolled down, allowing quick navigation back to the top
- **Smooth Transitions**: All UI elements fade in/out with smooth animations for a polished experience

### Implementation Notes
- Filter views (day, week, month, year) apply consistent filtering logic between the event list and markers
- The base coordinate view is designed as a foundation for the timeline's coordinate system, while filter views add temporal meaning to these coordinates
- Performance degrades noticeably with more than 20 simultaneous event markers, requiring batched loading
- **LandingPageTimeline Exception**: The landing page timeline (`LandingPageTimeline.js`) is a special case that implements its own custom event markers directly within the component, rather than using the standard `EventMarker` component. This is intentional and should be treated as an exception to the standard timeline implementation.

## Component Architecture

This section provides a detailed overview of the iTimeline frontend component structure and their relationships.

### Core Timeline Components

1. **`TimelineV3.js`**
   - **Location**: `/src/components/timeline-v3/TimelineV3.js`
   - **Purpose**: Main timeline container that orchestrates all other components
   - **Key Features**:
     - Manages timeline state
     - Handles event selection
     - Coordinates between markers and event list

2. **`EventList.js`**
   - **Location**: `/src/components/timeline-v3/events/EventList.js`
   - **Purpose**: Renders the list of events in the timeline
   - **Key Features**:
     - Manages virtualized list of events
     - Handles event selection
     - Renders appropriate card types

### Event Marker Components

1. **`EventMarker.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/EventMarker.js`
   - **Purpose**: Base component for all event markers
   - **Key Features**:
     - Renders the visual marker on the timeline
     - Handles marker interactions

2. **`MediaEventMarker.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/MediaEventMarker.js`
   - **Purpose**: Specialized marker for media events
   - **Key Features**:
     - Displays media thumbnails
     - Shows media type indicators

3. **`RemarkEventMarker.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/RemarkEventMarker.js`
   - **Purpose**: Specialized marker for remark/note events
   - **Key Features**:
     - Shows note preview
     - Different visual style from media markers

### Popup/Dialog Components

1. **`EventPopup.js`**
   - **Location**: `/src/components/timeline-v3/events/EventPopup.js`
   - **Purpose**: Detailed view of an event
   - **Key Features**:
     - Shows full event details
     - Media viewer
     - Edit/Delete actions
     - **Note**: Main popup that appears when clicking an event card

2. **`EventDialog.js`**
   - **Location**: `/src/components/timeline-v3/events/EventDialog.js`
   - **Purpose**: Form for creating/editing events
   - **Key Features**:
     - Form fields for event properties
     - Media upload
     - Save/Cancel actions

3. **`MarkerPopover.js`**
   - **Location**: `/src/components/timeline-v3/events/markers/`
   - **Purpose**: Small popup that appears when hovering/clicking a marker
   - **Key Features**:
     - Quick preview of event
     - Actions like "View Details" or "Edit"

### Card Components

1. **`MediaCard.js`**
   - **Location**: `/src/components/timeline-v3/events/cards/MediaCard.js`
   - **Purpose**: Renders media events in the event list
   - **Key Features**:
     - Displays media thumbnails
     - Play button for videos/audio
     - Media type indicators

2. **`RemarkCard.js`**
   - **Location**: `/src/components/timeline-v3/events/cards/RemarkCard.js`
   - **Purpose**: Renders note/remark events in the event list
   - **Key Features**:
     - Shows note preview
     - Different styling from media cards

### Key Distinctions

1. **Marker vs Card**
   - **Marker**: Visual indicator on the timeline axis
   - **Card**: Detailed view in the event list

2. **Popup vs Dialog**
   - **Popup (EventPopup)**: For viewing event details
   - **Dialog (EventDialog)**: For creating/editing events

3. **Marker Popover vs Event Popup**
   - **Marker Popover**: Lightweight, appears on marker hover/click
   - **Event Popup**: Full-featured, appears when clicking a card

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

### Specialized Media Handling <!-- BOOKMARK: MEDIA_HANDLING -->
- **Modular Media Components**:
  - Specialized components for different media types (image, video, audio)
  - MediaPopupManager for centralized media type detection and rendering
  - Two-container layout for enhanced media viewing experience

- **Image Media** (✅ Completed):
  - Fixed image display with black background in left container (60% width)
  - Scrollable content area for event details in right container (40% width)
  - Fullscreen button for enhanced viewing
  - Responsive design that adapts to different screen sizes
  - Support for various image formats (JPG, PNG, GIF, WebP)
  - Optimized for both portrait and landscape images

- **Video Media** (✅ Completed):
  - Custom video player with playback controls
  - Thumbnail generation for video previews
  - Support for multiple video formats (MP4, WebM)
  - Adaptive streaming based on network conditions
  - Fullscreen viewing option with enhanced controls
  - Play/pause toggling when clicking selected video cards
  - Auto-pause when card is deselected or navigated away from
  - Enhanced details button with visual indicators
  - Two-container layout in popup with video player on left, content on right

- **Audio Media** (🔄 In Progress):
  - Part 1: Audio Visualizer (✅ Completed)
    - Artistic waveform visualization with particle system
    - Frequency-responsive animations and effects
    - Dynamic color changes based on audio intensity
    - Circular frequency bars with orbital paths
    - Optimized performance with React hooks
  - Part 2: Audio Player Integration (⏳ Pending)
    - Custom controls for audio playback
    - Playlist functionality for multiple audio files
    - Metadata display (artist, album, etc.)
    - Responsive design for mobile and desktop

- **Media Type Detection**:
  - Multi-layered detection using media_subtype field, file extensions, and MIME types
  - Consistent handling across components
  - Fallback mechanisms for backward compatibility

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
- **Gradient Backgrounds**: 
  - Light mode: Warm peach-to-cream gradient (#ffd5c8 → #ffeae0 → #f7f4ea → #f5f1e4 → #ffffff)
  - Dark mode: Deep blue-black gradient (#000000 → #0a1128 → #1a2456)
  - Applied consistently across all pages (Login, Register, Homepage, Profile, Settings, Timeline)
  - Semi-transparent content containers with blur effects for visual depth
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

#### Frontend Setup (Vite)

The project has been migrated from Create React App to Vite for improved performance and developer experience.

1. Clone the repository:
   ```
   git clone https://github.com/worldwidecam/itimeline-frontend.git
   cd itimeline-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example`:
   ```
   # Vite environment variables must be prefixed with VITE_
   VITE_API_URL=http://localhost:5000
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

4. Start the development server:
   ```
   npm start
   ```

#### Environment Variables with Vite

With the migration to Vite, environment variables now use the `VITE_` prefix instead of `REACT_APP_`. In code, they are accessed using `import.meta.env.VITE_VARIABLE_NAME` instead of `process.env.REACT_APP_VARIABLE_NAME`.

Example:
```javascript
// Old way (Create React App)
const apiUrl = process.env.REACT_APP_API_URL;

// New way (Vite)
const apiUrl = import.meta.env.VITE_API_URL;
```

However, for backward compatibility, our configuration maintains support for the old `process.env.REACT_APP_*` format through a custom polyfill, so existing code will continue to work without changes.

#### Available Scripts

- `npm start` or `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build locally
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

#### Performance Optimizations

The Vite build process includes several performance optimizations:

- **Code Splitting**: The application is split into multiple chunks for better loading performance:
  - `vendor.js`: Contains React and related packages
  - `utils.js`: Contains utility libraries like date-fns, axios, and framer-motion
  - `mui.js`: Contains Material UI components
  - `index.js`: Contains the application code

- **Fast Development Server**: Vite uses native ES modules for instant server start and quick hot module replacement

- **Optimized Production Builds**: Smaller and faster than Create React App builds

#### JSX in JavaScript Files

Vite is configured to properly handle JSX in `.js` files, so there's no need to rename files to `.jsx`. This maintains compatibility with the existing codebase.

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

## Audio Integration Progress

### May 14, 2025 Updates

#### AudioWaveformVisualizer Integration
- Successfully integrated the AudioWaveformVisualizer component into the MediaCard for audio files
- Removed redundant title display from the visualizer to avoid duplication with the card title
- Adjusted the visualizer height and positioning to better fill the available space
- Fixed an issue where "Audio Visualizer" text was showing even when no title was provided

#### Audio Upload Functionality
- Confirmed that audio files are properly uploading to Cloudinary with preserved metadata
- Added proper media_subtype handling for audio files in the upload process
- Ensured the EventMediaUploader and MediaEventUploader components correctly handle audio files
- Verified that audio files display correctly in the EventList with the waveform visualizer

#### Next Steps
- Investigate creator information display in the EventPopup for audio media events
- Consider creating a specialized AudioEventPopup component similar to the existing ImageEventPopup and VideoEventPopup
- Further refine the audio visualizer appearance and behavior
- Test the complete audio upload and playback flow with various audio file formats

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

## Future Development Plans

### Migration to Vite

As create-react-app is no longer maintained, a future migration to Vite is planned. This section outlines the rationale and approach for this migration.

#### Benefits of Vite for iTimeline

1. **Development Speed**:
   - Extremely fast development server with instant hot module replacement
   - No bundling during development, using native ES modules instead
   - Significantly faster startup and refresh times compared to CRA

2. **Build Performance**:
   - Optimized production builds using Rollup
   - Code-splitting by default
   - Smaller bundle sizes with better tree-shaking

3. **Modern Defaults**:
   - Native ESM-based dev server
   - TypeScript support out of the box
   - CSS modules, PostCSS, and CSS pre-processors built-in

4. **Simple Migration Path**:
   - Minimal changes to existing React components
   - Keep most of your current application structure
   - Straightforward configuration

5. **Active Maintenance**:
   - Actively maintained by Evan You and the Vite team
   - Regular updates and improvements
   - Growing ecosystem of plugins

#### Migration Considerations

1. **Entry Point Changes**:
   - Replace `index.js` with `main.jsx` as the entry point
   - Adjust HTML template structure

2. **Configuration**:
   - Create a `vite.config.js` file to replace CRA configuration
   - Configure environment variables with the `import.meta.env` syntax

3. **Dependencies**:
   - Remove react-scripts and related CRA dependencies
   - Add Vite and related plugins

4. **Build Scripts**:
   - Update npm scripts in package.json
   - Adjust build output directory references if necessary

5. **CSS Processing**:
   - Adjust CSS imports for Vite's handling
   - Configure Tailwind CSS to work with Vite

#### Recommended Migration Approach

1. **Create a parallel Vite project**:
   ```bash
   npm create vite@latest itimeline-vite -- --template react
   ```

2. **Move key configuration files**:
   - Copy over essential configuration files (tailwind.config.js, etc.)
   - Create a new vite.config.js with appropriate settings

3. **Copy source code**:
   - Move the src directory to the new project
   - Adjust the entry point (main.jsx instead of index.js)

4. **Update dependencies**:
   - Install all required dependencies in the new project
   - Ensure compatibility with Vite

5. **Test thoroughly**:
   - Verify all features work as expected
   - Address any compatibility issues

6. **Replace the original project** once everything is working correctly

This migration will provide a modern, faster development experience while maintaining the same application structure and functionality.

## Future Work and To-Do

### Database Migration Strategy

#### Current Challenge
The application currently uses SQLite for local development, but production deployment will require PostgreSQL. Previous attempts to prepare for PostgreSQL migration resulted in compatibility issues that affected core functionality:

- Login/authentication stopped working properly
- Saved information failed to load correctly
- Media files couldn't be retrieved

#### Potential Solutions

1. **PostgreSQL for Both Environments**
   - Use PostgreSQL locally and in production for complete environment parity
   - Eliminates compatibility issues between different database systems
   - Provides more realistic testing conditions
   - Requires additional setup but prevents deployment surprises

2. **Database Abstraction Layer**
   - Enhance SQLAlchemy models to work seamlessly with both database types
   - Create migration scripts that handle dialect-specific differences
   - Implement compatibility wrappers for database-specific features

3. **Containerized Development Environment**
   - Use Docker to create consistent development environments
   - Package PostgreSQL as part of the development container
   - Simplify setup while maintaining production parity

#### Decision Criteria
- Development simplicity vs. production reliability
- Team familiarity with PostgreSQL administration
- Available system resources for local development
- Timeline for production deployment

This database strategy is a high-priority item that needs to be addressed before production deployment.
