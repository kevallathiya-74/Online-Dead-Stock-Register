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
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Description as DocumentIcon,
  BuildCircle as MaintenanceIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  Store as VendorIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.AUDITOR, UserRole.EMPLOYEE],
  },
  {
    title: 'Assets',
    path: '/assets',
    icon: <InventoryIcon />,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.AUDITOR],
  },
  {
    title: 'Users',
    path: '/users',
    icon: <PeopleIcon />,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Approvals',
    path: '/approvals',
    icon: <AssignmentIcon />,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
  },
  {
    title: 'Documents',
    path: '/documents',
    icon: <DocumentIcon />,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.AUDITOR],
  },
  {
    title: 'Maintenance',
    path: '/maintenance',
    icon: <MaintenanceIcon />,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
  },
  {
    title: 'Vendors',
    path: '/vendors',
    icon: <VendorIcon />,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <ReportsIcon />,
    roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.AUDITOR],
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    roles: [UserRole.ADMIN],
  },
];

const Sidebar: React.FC = () => {
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
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;