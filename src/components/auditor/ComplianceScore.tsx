import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
} from '@mui/material';
import type { ComplianceMetrics } from '../../types';

interface ComplianceScoreProps {
  metrics: ComplianceMetrics;
}

const ComplianceScore: React.FC<ComplianceScoreProps> = ({ metrics }) => {
  const getScoreColor = (score: number): 'error' | 'warning' | 'success' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Box>
      {/* Overall Score */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" fontWeight="bold" color={getScoreColor(metrics.overallScore) + '.main'}>
          {metrics.overallScore}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Overall Compliance Score
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getScoreLabel(metrics.overallScore)}
        </Typography>
      </Box>

      {/* Category Scores */}
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        Category Breakdown
      </Typography>
      <Grid container spacing={2}>
        {Object.entries(metrics.categoryScores).map(([category, score]) => (
          <Grid item xs={12} key={category}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{category}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {score}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={score}
                color={getScoreColor(score)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Trend Indicator */}
      {metrics.trends && metrics.trends.length > 1 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Compliance Trend
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(() => {
              const firstScore = metrics.trends[0].score;
              const lastScore = metrics.trends[metrics.trends.length - 1].score;
              const diff = lastScore - firstScore;
              const trend = diff > 0 ? 'Improving' : diff < 0 ? 'Declining' : 'Stable';
              const color = diff > 0 ? 'success' : diff < 0 ? 'error' : 'info';

              return (
                <>
                  <Typography
                    variant="body2"
                    color={color + '.main'}
                    fontWeight="bold"
                  >
                    {trend}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({diff > 0 ? '+' : ''}{diff.toFixed(1)}% over last 12 months)
                  </Typography>
                </>
              );
            })()}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ComplianceScore;
