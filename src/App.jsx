import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import TimelineV3 from './components/timeline-v3/TimelineV3';
import PersonalTimelineWrapper from './components/timeline-v3/PersonalTimelineWrapper';
import Login from './components/Login';
import Register from './components/Register';
import RequiredUsernameChangePage from './components/RequiredUsernameChangePage';
import Profile from './components/Profile';
import ProfileSettings from './components/ProfileSettings';
import UserProfileView from './components/UserProfileView';
import LandingPage from './components/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { 
  CircularProgress, 
  Box,
} from '@mui/material';
import PageTransition from './components/PageTransition';
import setupKeepAlive from './utils/keepAlive';

const REQUIRED_USERNAME_CHANGE_PATH = '/account/required-username-change';
const REQUIRED_USERNAME_CHANGE_ALIASES = new Set([
  REQUIRED_USERNAME_CHANGE_PATH,
  '/account/required-user-name-change',
]);

const isRequiredUsernameChangePath = (pathname = '') => REQUIRED_USERNAME_CHANGE_ALIASES.has(pathname);

const isForcedRenameRequired = (authUser) => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = authUser?.id || storedUser?.id;

    const userFlag = Boolean(authUser?.must_change_username) || Boolean(storedUser?.must_change_username);
    if (userFlag) {
      return true;
    }

    if (!userId) {
      return false;
    }

    const passportRaw = localStorage.getItem(`user_passport_${userId}`);
    const passport = passportRaw ? JSON.parse(passportRaw) : null;
    return Boolean(passport?.must_change_username);
  } catch (_e) {
    return Boolean(authUser?.must_change_username);
  }
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const mustChangeUsername = isForcedRenameRequired(user);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (mustChangeUsername && !isRequiredUsernameChangePath(location.pathname)) {
    return <Navigate to={REQUIRED_USERNAME_CHANGE_PATH} replace />;
  }

  return children;
};

// Auth Route component - Shows Homepage for authenticated users, LandingPage for non-authenticated
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const mustChangeUsername = isForcedRenameRequired(user);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return children;
  }

  if (mustChangeUsername) {
    return <Navigate to={REQUIRED_USERNAME_CHANGE_PATH} replace />;
  }

  return <Navigate to="/home" />;
};

const NavbarGate = () => {
  const { user } = useAuth();
  const mustChangeUsername = isForcedRenameRequired(user);
  if (mustChangeUsername) {
    return null;
  }

  return <Navbar />;
};

function App() {
  // Set up keep-alive ping to prevent backend from spinning down
  React.useEffect(() => {
    setupKeepAlive();
  }, []);

  return (
    <CustomThemeProvider>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <PageTransition>
            <Router>
              {/* Conditional Navbar - only show on non-landing pages */}
              <Routes>
                <Route path="/" element={null} />
                <Route path="*" element={<NavbarGate />} />
              </Routes>
              
              <Routes>
                {/* Landing page route without navbar */}
                <Route path="/" element={
                  <AuthRoute>
                    <LandingPage />
                  </AuthRoute>
                } />
                
                {/* Login/Register routes */}
                <Route path="/login" element={
                  <Box sx={{ pt: 8 }}>
                    <Login />
                  </Box>
                } />
                <Route path="/register" element={
                  <Box sx={{ pt: 8 }}>
                    <Register />
                  </Box>
                } />
                <Route path="/account/required-username-change" element={
                  <ProtectedRoute>
                    <RequiredUsernameChangePage />
                  </ProtectedRoute>
                } />
                <Route path="/account/required-user-name-change" element={<Navigate to={REQUIRED_USERNAME_CHANGE_PATH} replace />} />
                
                {/* Protected routes */}
                <Route path="/home" element={
                  <Box sx={{ height: '100vh', overflow: 'auto' }}>
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:id" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <TimelineV3 />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:username/:slug" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <PersonalTimelineWrapper />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/timeline-v3/:username/:slug/:id" element={
                  <Box sx={{ pt: 8 }}>
                    <ProtectedRoute>
                      <TimelineV3 />
                    </ProtectedRoute>
                  </Box>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/profile/:userId" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/profile/settings" element={
                  <ProtectedRoute>
                    <ProfileSettings />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </PageTransition>
        </LocalizationProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
