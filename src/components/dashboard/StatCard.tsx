import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  progressColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  progress,
  progressColor = 'primary',
  icon,
}) => {
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
                  theme.palette[progressColor].light + '20',
                color: (theme) => theme.palette[progressColor].main,
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
              color={progressColor}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: (theme) =>
                  theme.palette[progressColor].light + '40',
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;