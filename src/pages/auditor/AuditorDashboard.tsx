import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import AuditProgressChart from '../../components/auditor/AuditProgressChart';
import ConditionChart from '../../components/auditor/ConditionChart';
import RecentActivities from '../../components/auditor/RecentActivities';
import ComplianceScore from '../../components/auditor/ComplianceScore';
import auditorService from '../../services/auditorService';
import type { AuditorStats, AuditActivity, ChartData, ComplianceMetrics } from '../../types';

const AuditorDashboard: React.FC = () => {
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [progressData, setProgressData] = useState<ChartData | null>(null);
  const [conditionData, setConditionData] = useState<ChartData | null>(null);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsData,
        activitiesData,
        progressChartData,
        conditionChartData,
        complianceData,
      ] = await Promise.all([
        auditorService.getAuditorStats(),
        auditorService.getAuditorActivities(),
        auditorService.getAuditProgressChart(),
        auditorService.getConditionChart(),
        auditorService.getComplianceMetrics(),
      ]);

      setStats(statsData);
      setActivities(activitiesData);
      setProgressData(progressChartData);
      setConditionData(conditionChartData);
      setComplianceMetrics(complianceData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Auditor Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track audit progress, compliance metrics, and asset conditions
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Assets"
              value={stats?.total_assigned || 0}
              icon={<AssignmentIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Completed Audits"
              value={stats?.completed || 0}
              icon={<CheckCircleIcon />}
              color="success"
              subtitle={stats ? `${stats.completion_rate}% complete` : undefined}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Pending Audits"
              value={stats?.pending || 0}
              icon={<SearchIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Discrepancies"
              value={stats?.discrepancies || 0}
              icon={<WarningIcon />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Missing Assets"
              value={stats?.missing || 0}
              icon={<ErrorIcon />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Completion Rate"
              value={`${stats?.completion_rate || 0}%`}
              icon={<TrendingUpIcon />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Audit Progress (Last 6 Months)
              </Typography>
              {progressData && <AuditProgressChart data={progressData} />}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Asset Condition
              </Typography>
              {conditionData && <ConditionChart data={conditionData} />}
            </Paper>
          </Grid>
        </Grid>

        {/* Compliance Score & Recent Activities */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Compliance Score
              </Typography>
              {complianceMetrics && (
                <ComplianceScore metrics={complianceMetrics} />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <RecentActivities activities={activities} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
};

export default AuditorDashboard;
