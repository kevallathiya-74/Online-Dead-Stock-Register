import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Build as MaintenanceIcon,
  Assignment as ApprovalIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Store as VendorIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Activity {
  id: string;
  type: 'asset' | 'maintenance' | 'approval' | 'user' | 'vendor';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'asset':
      return <InventoryIcon />;
    case 'maintenance':
      return <MaintenanceIcon />;
    case 'approval':
      return <ApprovalIcon />;
    case 'user':
      return <PersonIcon />;
    case 'vendor':
      return <VendorIcon />;
    default:
      return <InventoryIcon />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'asset':
      return '#2196f3';
    case 'maintenance':
      return '#f44336';
    case 'approval':
      return '#ff9800';
    case 'user':
      return '#4caf50';
    case 'vendor':
      return '#9c27b0';
    default:
      return '#2196f3';
  }
};

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  return (
    <Card>
      <CardHeader
        title="Recent Activities"
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {activities.map((activity) => (
            <ListItem
              key={activity.id}
              alignItems="flex-start"
              sx={{
                '&:not(:last-child)': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: `${getActivityColor(activity.type)}15`,
                    color: getActivityColor(activity.type),
                  }}
                >
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2">{activity.title}</Typography>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {activity.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        by {activity.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Tooltip
                        title={format(
                          new Date(activity.timestamp),
                          'MMM d, yyyy HH:mm'
                        )}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(activity.timestamp), 'MMM d, HH:mm')}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;