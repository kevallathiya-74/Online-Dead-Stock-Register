import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import type { AuditActivity } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivitiesProps {
  activities: AuditActivity[];
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'audit_completed':
        return <CheckCircleIcon color="success" />;
      case 'discrepancy_found':
        return <WarningIcon color="warning" />;
      case 'asset_missing':
        return <ErrorIcon color="error" />;
      case 'compliance_check':
        return <AssignmentIcon color="info" />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getPriorityColor = (
    priority: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (activities.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">No recent activities</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
      {activities.map((activity) => (
        <ListItem
          key={activity.id}
          sx={{
            borderLeft: 3,
            borderColor: getPriorityColor(activity.priority) + '.main',
            mb: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
          }}
        >
          <Avatar sx={{ mr: 2, bgcolor: 'background.default' }}>
            {getActivityIcon(activity.type)}
          </Avatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2">{activity.title}</Typography>
                <Chip
                  label={activity.priority.toUpperCase()}
                  size="small"
                  color={getPriorityColor(activity.priority)}
                />
              </Box>
            }
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  {activity.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Asset ID: {activity.asset_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Location: {activity.location}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </Typography>
                </Box>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default RecentActivities;
