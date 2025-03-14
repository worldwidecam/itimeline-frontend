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
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const profileTabs = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        <ListItem>
          <Typography variant="h6" sx={{ p: 2 }}>
            Profile Menu
          </Typography>
        </ListItem>
        <Divider />
        <ListItem button component={RouterLink} to="/profile">
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem button component={RouterLink} to="/profile/settings">
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Profile Settings" />
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
                {!isProfilePage && (
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/profile"
                    sx={{ mr: 2 }}
                  >
                    View Profile
                  </Button>
                )}
                {isProfilePage && (
                  <>
                    <IconButton
                      color="inherit"
                      onClick={toggleDrawer(true)}
                      sx={{ mr: 2 }}
                      aria-label="profile menu"
                    >
                      <MenuIcon />
                    </IconButton>
                    <Drawer
                      anchor="right"
                      open={drawerOpen}
                      onClose={toggleDrawer(false)}
                    >
                      {profileTabs}
                    </Drawer>
                  </>
                )}
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
