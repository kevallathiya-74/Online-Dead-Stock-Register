import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardActionArea,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  subtitle?: string;
  percentage?: number;
  trend?: 'up' | 'down';
  onClick?: () => void;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
  percentage,
  trend,
  onClick,
  loading = false,
}) => {
  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      primary: '#1976d2',
      secondary: '#9c27b0',
      success: '#2e7d32',
      error: '#d32f2f',
      warning: '#ed6c02',
      info: '#0288d1',
    };
    return colorMap[colorName] || colorMap.primary;
  };

  const getTrendColor = () => {
    if (!trend) return 'default';
    return trend === 'up' ? 'success' : 'error';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? (
      <TrendingUpIcon fontSize="small" />
    ) : (
      <TrendingDownIcon fontSize="small" />
    );
  };

  const cardContent = (
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: getColorValue(color),
              mt: 1,
              mb: subtitle || percentage !== undefined ? 1 : 0,
            }}
          >
            {loading ? '...' : value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {percentage !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
              <Chip
                icon={getTrendIcon() || undefined}
                label={`${percentage > 0 ? '+' : ''}${percentage}%`}
                size="small"
                color={getTrendColor()}
                sx={{ fontWeight: 600 }}
              />
              {trend && (
                <Typography variant="caption" color="text.secondary">
                  vs last month
                </Typography>
              )}
            </Box>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 2,
              backgroundColor: `${getColorValue(color)}15`,
              color: getColorValue(color),
              '& .MuiSvgIcon-root': {
                fontSize: 32,
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </CardContent>
  );

  if (onClick) {
    return (
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-4px)',
          },
        }}
      >
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
          {cardContent}
        </CardActionArea>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      {cardContent}
    </Card>
  );
};

export default StatCard;
