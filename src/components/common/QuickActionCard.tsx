import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
  Chip,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
  badge?: string | number;
  sx?: SxProps<Theme>;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  color = 'primary',
  disabled = false,
  badge,
  sx,
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

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
        ...sx,
      }}
    >
      <CardActionArea
        onClick={onClick}
        disabled={disabled}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          transition: 'all 0.3s',
          '&:hover': {
            transform: disabled ? 'none' : 'translateY(-4px)',
            boxShadow: disabled ? 'none' : 4,
          },
        }}
      >
        <CardContent sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
          {badge !== undefined && (
            <Chip
              label={badge}
              size="small"
              color={color}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                fontWeight: 600,
              }}
            />
          )}
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
              mb: 2,
              '& .MuiSvgIcon-root': {
                fontSize: 32,
              },
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default QuickActionCard;
