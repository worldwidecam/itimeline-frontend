import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import ToolbarSpacer from './ToolbarSpacer';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Get current path for navigation highlighting
  const currentPath = location.pathname;
  
  // Function to handle navigation with refresh capability
  const handleNavigation = (path) => {
    // If we're already on this page, refresh the content
    if (path === currentPath) {
      // For home page, we'll reload the timelines
      if (path === '/home') {
        // Close the drawer
        setDrawerOpen(false);
        // Force a refresh by navigating away and back
        // This is a simple way to trigger a re-render of the component
        navigate('/refresh-redirect', { replace: true });
        setTimeout(() => navigate(path, { replace: true }), 10);
      } else {
        // For other pages, just close the drawer
        setDrawerOpen(false);
      }
    } else {
      // Navigate to the new page
      navigate(path);
      setDrawerOpen(false);
    }
  };
  
  const isProfilePage = location.pathname.startsWith('/profile');

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
              <Avatar
                src={user.avatar_url}
                sx={{ width: 60, height: 60, mr: 2 }}
                alt={user.username}
              >
                {user.username[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {user.email}
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
                    },
                  }}
                  ModalProps={{
                    keepMounted: true, // Better mobile performance
                  }}
                >
                  {profileTabs}
                </Drawer>
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={user.username}
                    src={user.avatar_url}
                    sx={{ bgcolor: 'secondary.main' }}
                  >
                    {user.username[0].toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>
                    Profile
                  </MenuItem>
                  <MenuItem component={RouterLink} to="/profile/settings" onClick={handleClose}>
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
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
