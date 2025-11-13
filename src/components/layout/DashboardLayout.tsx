import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForRole, NavigationItem } from '../../utils/navigation';

const drawerWidth = 280;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigation = user ? getNavigationForRole(user.role) : [];

  // Auto-expand parent menu when on a child route
  useEffect(() => {
    const newOpenItems: { [key: string]: boolean } = {};
    
    navigation.forEach((item) => {
      if (item.children) {
        // Check if current path matches any child path
        const hasActiveChild = item.children.some(
          (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
        );
        if (hasActiveChild) {
          newOpenItems[item.id] = true;
        }
      }
    });

    setOpenItems(prev => ({ ...prev, ...newOpenItems }));
  }, [location.pathname, navigation]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuItemClick = (item: NavigationItem) => {
    if (item.children) {
      setOpenItems(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
    } else {
      navigate(item.path);
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleProfileMenuClose();
  };

  const renderNavigationItems = (items: NavigationItem[], level: number = 0) => {
    return items.map((item) => {
      const isActive = location.pathname === item.path || 
                      (item.children && item.children.some(child => location.pathname === child.path));
      
      return (
        <React.Fragment key={item.id}>
          <ListItem disablePadding sx={{ pl: level * 2 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick(item)}
              selected={isActive}
              sx={{
                minHeight: 48,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.title} />
              {item.children && (
                openItems[item.id] ? <ExpandLess /> : <ExpandMore />
              )}
            </ListItemButton>
          </ListItem>
          {item.children && (
            <Collapse in={openItems[item.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderNavigationItems(item.children, level + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            Dead Stock Register
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>
            {(user.name || user.full_name)?.[0] || user.email[0].toUpperCase()}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {user.name || user.full_name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user.email}
          </Typography>
          <Chip
            label={user.role.replace('_', ' ')}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
      
      <Divider />
      
      <List sx={{ px: 1, py: 2 }}>
        {renderNavigationItems(navigation)}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.role.replace('_', ' ')} Dashboard
          </Typography>

          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
              {(user?.name || user?.full_name)?.[0] || user?.email[0].toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { navigate('/employee/profile'); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            {user?.role === 'ADMIN' && (
              <MenuItem onClick={() => { navigate('/admin/settings'); handleProfileMenuClose(); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'grey.50',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;