import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  BuildCircle as MaintenanceIcon,
  Store as VendorIcon,
} from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface MenuItem {
  title: string;
  path: string;
  icon: SvgIconComponent;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.IT_MANAGER, UserRole.AUDITOR, UserRole.EMPLOYEE],
  },
  {
    title: 'Approvals',
    path: '/approvals',
    icon: AssignmentIcon,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.IT_MANAGER],
  },
  {
    title: 'Maintenance',
    path: '/maintenance',
    icon: MaintenanceIcon,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.IT_MANAGER],
  },
  {
    title: 'Vendors',
    path: '/vendors',
    icon: VendorIcon,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.IT_MANAGER],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role as UserRole)
  );

  return (
    <Box sx={{ overflow: 'auto' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Dead Stock Register
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>
                  <IconComponent />
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;