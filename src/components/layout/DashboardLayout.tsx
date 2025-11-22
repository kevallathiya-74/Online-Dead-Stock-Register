import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForRole, getProfileNavigationForRole, NavigationItem } from '../../utils/navigation';

const drawerWidth = 280;
const mobileDrawerWidth = 260;

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

  // Detect if we're on a profile page
  const isProfilePage = location.pathname.endsWith('/profile');

  // Use profile navigation if on profile page, otherwise use regular navigation
  // Memoize navigation to prevent infinite loop
  const navigation = useMemo(() => {
    return user 
      ? (isProfilePage ? getProfileNavigationForRole(user.role) : getNavigationForRole(user.role))
      : [];
  }, [user?.role, isProfilePage]);

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

    // Only update if there are actual changes
    if (Object.keys(newOpenItems).length > 0) {
      setOpenItems(prev => {
        const updated = { ...prev, ...newOpenItems };
        // Check if state actually changed to prevent unnecessary re-renders
        const hasChanges = Object.keys(newOpenItems).some(key => prev[key] !== newOpenItems[key]);
        return hasChanges ? updated : prev;
      });
    }
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
                minHeight: { xs: 44, sm: 48 },
                px: { xs: 1.5, sm: 2 },
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
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{ component: 'div' }}
              />
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
        <Box sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
          <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.main', width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
            {(user.name || user.full_name)?.[0] || user.email[0].toUpperCase()}
          </Avatar>
          <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {user.name || user.full_name || 'User'}
          </Typography>
          <Typography variant="body2" component="div" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-all' }}>
            {user.email}
          </Typography>
          <Chip
            label={user.role.replace('_', ' ')}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          />
        </Box>
      )}
      
      <Divider />
      
      <List sx={{ px: { xs: 0.5, sm: 1 }, py: { xs: 1, sm: 2 } }}>
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
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
            <MenuItem onClick={() => { 
              const profilePath = user?.role === 'VENDOR' ? '/vendor/profile' : 
                                 user?.role === 'AUDITOR' ? '/auditor/profile' : 
                                 user?.role === 'ADMIN' ? '/admin/profile' : 
                                 user?.role === 'INVENTORY_MANAGER' ? '/inventory-manager/profile' :
                                 user?.role === 'IT_MANAGER' ? '/profile' :
                                 '/dashboard';
              navigate(profilePath); 
              handleProfileMenuClose(); 
            }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: { xs: mobileDrawerWidth, sm: drawerWidth },
              maxWidth: '85vw'
            },
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
          p: { xs: 1, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'grey.50',
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;