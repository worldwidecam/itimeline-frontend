import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import TimelineNameDisplay from './timeline-v3/TimelineNameDisplay';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Tooltip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import UserAvatar from './common/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useEmailBlur } from '../contexts/EmailBlurContext';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import TagIcon from '@mui/icons-material/Tag';
import HistoryIcon from '@mui/icons-material/History';
import ToolbarSpacer from './ToolbarSpacer';
import api from '../utils/api';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user, logout } = useAuth();
  const { getBlurredEmail } = useEmailBlur();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [currentTimelineName, setCurrentTimelineName] = React.useState('');
  const [lastVisitedTimeline, setLastVisitedTimeline] = React.useState(null);
  const currentPath = location.pathname;
  
  // Function to handle navigation with refresh capability
  const handleNavigation = (path) => {
    // If we're already on this page, refresh the content
    if (path === currentPath) {
      // Close the drawer first
      setDrawerOpen(false);
      
      // For home page or timeline pages, force a refresh
      if (path === '/home' || path.startsWith('/timeline-v3/')) {
        // Force a refresh by navigating away and back
        // This is a simple way to trigger a re-render of the component
        navigate('/refresh-redirect', { replace: true });
        setTimeout(() => navigate(path, { replace: true }), 10);
      }
    } else {
      // Navigate to the new page
      navigate(path);
      setDrawerOpen(false);
    }
  };
  
  const isProfilePage = location.pathname.startsWith('/profile');
  const isTimelinePage = location.pathname.startsWith('/timeline-v3/');
  // Extract numeric timelineId even when on nested routes like /timeline-v3/:id/admin
  const timelineId = (() => {
    if (!isTimelinePage) return null;
    const match = location.pathname.match(/^\/timeline-v3\/(\d+)/);
    return match ? match[1] : null;
  })();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  // Function to toggle the drawer state when hamburger icon is clicked
  const handleHamburgerClick = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Load last visited timeline from localStorage on component mount
  useEffect(() => {
    const savedTimeline = localStorage.getItem('lastVisitedTimeline');
    if (savedTimeline) {
      try {
        setLastVisitedTimeline(JSON.parse(savedTimeline));
      } catch (error) {
        console.error('Error parsing saved timeline:', error);
        localStorage.removeItem('lastVisitedTimeline');
      }
    }
  }, []);

  // Fetch timeline name when on a timeline page
  useEffect(() => {
    const fetchTimelineName = async () => {
      if (isTimelinePage && timelineId) {
        try {
          const response = await api.get(`/api/timeline-v3/${timelineId}`);
          if (response.data && response.data.name) {
            const timelineName = response.data.name;
            setCurrentTimelineName(timelineName);
            
            // Save this timeline as the last visited timeline
            const timelineData = {
              id: timelineId,
              name: timelineName,
              path: currentPath,
              timeline_type: response.data.timeline_type || 'hashtag' // Include timeline_type with fallback
            };
            localStorage.setItem('lastVisitedTimeline', JSON.stringify(timelineData));
            setLastVisitedTimeline(timelineData);
          }
        } catch (error) {
          // For locked personal timelines, a 403 here is expected; avoid noisy logging
          if (error?.response?.status === 403) {
            setCurrentTimelineName('');
            return;
          }
          console.error('Error fetching timeline name:', error);
        }
      } else {
        setCurrentTimelineName('');
      }
    };
    
    fetchTimelineName();
  }, [isTimelinePage, timelineId, currentPath]);

  const profileTabs = (
    <Box
      sx={{ 
        width: 280,
        height: '100%',
        backgroundColor: theme => theme.palette.mode === 'dark' 
          ? 'rgba(10, 17, 40, 0.95)' 
          : 'rgba(255, 234, 224, 0.95)', // Light peach color to match the theme gradient
        backdropFilter: 'blur(8px)',
        borderLeft: theme => theme.palette.mode === 'dark'
          ? '1px solid rgba(144, 202, 249, 0.15)'
          : '1px solid rgba(255, 213, 200, 0.5)', // Light border for light mode
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {user && (
          <ListItem sx={{ pt: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <UserAvatar
                name={user.username}
                avatarUrl={user.avatar_url}
                id={user.id}
                size={60}
                sx={{ mr: 2 }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {getBlurredEmail(user.email)}
                </Typography>
              </Box>
            </Box>
          </ListItem>
        )}
        <Divider />
        <ListItem 
          button 
          onClick={() => handleNavigation('/home')}
          sx={{
            position: 'relative',
            backgroundColor: currentPath === '/home' ? theme => 
              theme.palette.mode === 'dark' 
                ? 'rgba(144, 202, 249, 0.15)' 
                : 'rgba(255, 213, 200, 0.5)' // Peach color for light mode
              : 'transparent',
            '&::before': currentPath === '/home' ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: theme => theme.palette.primary.main,
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
            } : {}
          }}
        >
          <ListItemIcon>
            <Box component="span" sx={{ display: 'flex', color: currentPath === '/home' ? 'primary.main' : 'inherit' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </ListItemIcon>
          <ListItemText 
            primary="Home" 
            primaryTypographyProps={{
              fontWeight: currentPath === '/home' ? 'bold' : 'normal',
              color: currentPath === '/home' ? 'primary.main' : 'inherit'
            }}
          />
        </ListItem>
        
        {/* Current Timeline Item - Only shown when on a timeline page */}
        {isTimelinePage && currentTimelineName && (
          <ListItem 
            button 
            onClick={() => handleNavigation(currentPath)} // Refresh current timeline
            sx={{
              position: 'relative',
              backgroundColor: theme => 
                theme.palette.mode === 'dark' 
                  ? 'rgba(144, 202, 249, 0.15)' 
                  : 'rgba(255, 213, 200, 0.5)', // Always highlighted since we're on this page
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                backgroundColor: theme => theme.palette.primary.main,
                borderTopRightRadius: '4px',
                borderBottomRightRadius: '4px',
              }
            }}
          >
            <ListItemIcon>
              {lastVisitedTimeline?.timeline_type === 'community' ? (
                <span style={{ 
                  fontFamily: 'Lobster, cursive', 
                  color: 'inherit', // Use the theme's color
                  fontSize: '1.3em',
                  marginLeft: '10px' // Align with other icons
                }}>
                  i
                </span>
              ) : (
                <TagIcon sx={{ color: 'primary.main' }} />
              )}
            </ListItemIcon>
            {/* For the hamburger menu, we're showing the icon separately, so we always pass 'hashtag' as type to avoid showing the prefix */}
            <Typography
              fontWeight="bold"
              color="primary.main"
              noWrap
              sx={{ maxWidth: '180px' }} // Prevent very long timeline names from breaking layout
            >
              {currentTimelineName}
            </Typography>
          </ListItem>
        )}
        
        <ListItem 
          button 
          onClick={() => handleNavigation('/profile')}
          sx={{
            position: 'relative',
            backgroundColor: currentPath === '/profile' ? theme => 
              theme.palette.mode === 'dark' 
                ? 'rgba(144, 202, 249, 0.15)' 
                : 'rgba(255, 213, 200, 0.5)' // Peach color for light mode
              : 'transparent',
            '&::before': currentPath === '/profile' ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: theme => theme.palette.primary.main,
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
            } : {}
          }}
        >
          <ListItemIcon>
            <PersonIcon sx={{ color: currentPath === '/profile' ? 'primary.main' : 'inherit' }} />
          </ListItemIcon>
          <ListItemText 
            primary="My Profile" 
            primaryTypographyProps={{
              fontWeight: currentPath === '/profile' ? 'bold' : 'normal',
              color: currentPath === '/profile' ? 'primary.main' : 'inherit'
            }}
          />
        </ListItem>
        <ListItem 
          button 
          onClick={() => handleNavigation('/profile/settings')}
          sx={{
            position: 'relative',
            backgroundColor: currentPath === '/profile/settings' ? theme => 
              theme.palette.mode === 'dark' 
                ? 'rgba(144, 202, 249, 0.15)' 
                : 'rgba(255, 213, 200, 0.5)' // Peach color for light mode
              : 'transparent',
            '&::before': currentPath === '/profile/settings' ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: theme => theme.palette.primary.main,
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
            } : {}
          }}
        >
          <ListItemIcon>
            <SettingsIcon sx={{ color: currentPath === '/profile/settings' ? 'primary.main' : 'inherit' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Profile Settings" 
            primaryTypographyProps={{
              fontWeight: currentPath === '/profile/settings' ? 'bold' : 'normal',
              color: currentPath === '/profile/settings' ? 'primary.main' : 'inherit'
            }}
          />
        </ListItem>
        <Divider sx={{ my: 2 }} />
        
        {/* Last Visited Timeline section */}
        {lastVisitedTimeline && (!isTimelinePage || lastVisitedTimeline.id !== timelineId) && (
          <>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              sx={{ px: 2, py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              LAST VISITED TIMELINE
            </Typography>
            <ListItem 
              button 
              onClick={() => handleNavigation(lastVisitedTimeline.path)}
              sx={{
                position: 'relative',
                '&:hover': {
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(144, 202, 249, 0.08)' 
                      : 'rgba(255, 213, 200, 0.3)',
                }
              }}
            >
              <ListItemIcon>
                {lastVisitedTimeline.timeline_type === 'community' ? (
                  <span style={{ 
                    fontFamily: 'Lobster, cursive', 
                    color: 'inherit', // Use the theme's color
                    fontSize: '1.3em',
                    marginLeft: '10px' // Match the positioning of the current timeline
                  }}>
                    i
                  </span>
                ) : (
                  <TagIcon sx={{ color: 'primary.main' }} />
                )}
              </ListItemIcon>
              {/* For the last visited timeline, we're showing the icon separately, so we show just the name */}
              <Typography
                noWrap
                sx={{ maxWidth: '180px' }} // Prevent very long timeline names from breaking layout
              >
                {lastVisitedTimeline.name}
              </Typography>
            </ListItem>
            <Divider sx={{ my: 1 }} />
          </>
        )}
        
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <Box component="span" sx={{ display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Timeline Forum
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user ? (
              <>
                {/* Consistent hamburger menu on all pages */}
                <IconButton
                  color="inherit"
                  onClick={handleHamburgerClick}
                  sx={{ mr: 2 }}
                  aria-label="profile menu"
                >
                  <MenuIcon />
                </IconButton>
                <Drawer
                  anchor="right"
                  open={drawerOpen}
                  onClose={toggleDrawer(false)}
                  variant="temporary"
                  sx={{
                    '& .MuiDrawer-paper': {
                      marginTop: '64px', // Height of AppBar
                      height: 'calc(100% - 64px)',
                      boxSizing: 'border-box',
                      zIndex: 1600, // Higher than timeline floating buttons (which go up to 1530)
                    },
                    zIndex: 1600, // Apply to the Drawer component itself
                  }}
                  ModalProps={{
                    keepMounted: true, // Better mobile performance
                  }}
                >
                  {profileTabs}
                </Drawer>
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                  <UserAvatar
                    name={user.username}
                    avatarUrl={user.avatar_url}
                    id={user.id}
                    size={40}
                    sx={{ 
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      boxShadow: theme => theme.palette.mode === 'dark' 
                        ? '0 4px 20px rgba(0,0,0,0.5)' 
                        : '0 4px 20px rgba(0,0,0,0.15)',
                      borderRadius: 2,
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={handleLogout} sx={{ 
                    minWidth: '150px',
                    py: 1.5,
                  }}>
                    <ListItemIcon>
                      <Box component="svg" sx={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={RouterLink} to="/login">
                  Login
                </Button>
                <Button color="inherit" component={RouterLink} to="/register">
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <ToolbarSpacer />
    </>
  );
}

export default Navbar;
