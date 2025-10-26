import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import auditorService from '../../services/auditorService';
import type { ComplianceMetrics } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CompliancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceMetrics();
  }, []);

  const fetchComplianceMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditorService.getComplianceMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Error fetching compliance metrics:', err);
      setError(err.response?.data?.message || 'Failed to load compliance metrics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  const getTrendData = () => {
    if (!metrics || !metrics.trends) return null;

    return {
      labels: metrics.trends.map((t) => {
        const date = new Date(t.date);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Compliance Score',
          data: metrics.trends.map((t) => t.score),
          borderColor: getScoreColor(metrics.overallScore),
          backgroundColor: getScoreColor(metrics.overallScore) + '20',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
        >
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  const trendData = getTrendData();
  const overallTrend =
    metrics && metrics.trends.length > 1
      ? metrics.trends[metrics.trends.length - 1].score - metrics.trends[0].score
      : 0;

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Compliance Metrics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor compliance scores and trends across all categories
          </Typography>
        </Box>

        {/* Overall Score Card */}
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h1" fontWeight="bold" sx={{ color: getScoreColor(metrics?.overallScore || 0) }}>
                  {metrics?.overallScore || 0}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Overall Compliance Score
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {getScoreLabel(metrics?.overallScore || 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {overallTrend >= 0 ? (
                    <TrendingUpIcon color="success" />
                  ) : (
                    <TrendingDownIcon color="error" />
                  )}
                  <Typography variant="h6" color={overallTrend >= 0 ? 'success.main' : 'error.main'}>
                    {overallTrend >= 0 ? '+' : ''}{overallTrend.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    over last 12 months
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Your compliance score represents how well your assets meet audit standards,
                  documentation requirements, and condition expectations.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Category Scores */}
        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
          Category Breakdown
        </Typography>
        <Grid container spacing={3} mb={4}>
          {metrics &&
            Object.entries(metrics.categoryScores).map(([category, score]) => (
              <Grid item xs={12} md={6} key={category}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {score >= 80 ? (
                        <CheckCircleIcon color="success" fontSize="large" />
                      ) : (
                        <WarningIcon color="warning" fontSize="large" />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{category}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getScoreLabel(score)}
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: getScoreColor(score) }}>
                        {score}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={score}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getScoreColor(score),
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Trend Chart */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Compliance Trend (Last 12 Months)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Track how your compliance score has changed over time
          </Typography>
          <Box sx={{ height: 400 }}>
            {trendData && <Line options={chartOptions} data={trendData} />}
          </Box>
        </Paper>

        {/* Recommendations */}
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'info.light' }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Recommendations
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            {metrics && metrics.overallScore < 80 && (
              <>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Focus on categories with scores below 80% to improve overall compliance
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Ensure all assets are audited at least once per year
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Update asset documentation and verify location accuracy
                </Typography>
              </>
            )}
            {metrics && metrics.overallScore >= 80 && (
              <>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Maintain regular audit schedules to sustain high compliance
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Continue monitoring asset conditions and addressing issues promptly
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Share best practices with your team to keep scores high
                </Typography>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </DashboardLayout>
  );
};

export default CompliancePage;
