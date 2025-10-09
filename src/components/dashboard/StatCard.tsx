import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  progressColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon?: React.ReactNode;
}

const StatCard = ({
  title,
  value,
  subtitle,
  progress,
  progressColor = 'primary',
  color,
  icon,
}: StatCardProps) => {
  // Use color prop if provided, otherwise fallback to progressColor
  const themeColor = color || progressColor;
  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: (theme) =>
                  theme.palette[themeColor].light + '20',
                color: (theme) => theme.palette[themeColor].main,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography variant="h4" component="div" sx={{ mb: subtitle ? 1 : 2 }}>
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: progress ? 1 : 0 }}
          >
            {subtitle}
          </Typography>
        )}

        {typeof progress === 'number' && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={themeColor}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: (theme) =>
                  theme.palette[themeColor].light + '40',
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;