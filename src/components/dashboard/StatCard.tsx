import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface Trend {
  value: number;
  isPositive: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  progressColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon?: React.ReactNode;
  trend?: Trend;
}

const StatCard = ({
  title,
  value,
  subtitle,
  progress,
  progressColor = 'primary',
  color,
  icon,
  trend,
}: StatCardProps) => {
  // Use color prop if provided, otherwise fallback to progressColor
  const themeColor = color || progressColor;
  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
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
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: '50%',
                backgroundColor: (theme) =>
                  theme.palette[themeColor].light + '20',
                color: (theme) => theme.palette[themeColor].main,
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: 20, sm: 24 },
                },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: subtitle ? 1 : 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            {value}
          </Typography>
          {trend && trend.value > 0 && (
            <Chip
              icon={trend.isPositive ? <TrendingUp /> : <TrendingDown />}
              label={`${trend.value}%`}
              size="small"
              color={trend.isPositive ? 'success' : 'error'}
              sx={{ height: 24 }}
            />
          )}
        </Box>

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