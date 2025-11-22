/**
 * AUDITOR DASHBOARD - Real-Time Integration
 * 
 * Data Sources (100% Real API):
 * - GET /api/v1/dashboard/auditor/stats - Audit statistics
 * - GET /api/v1/dashboard/auditor/audit-items - Assets for auditing
 * 
 * Real-Time Strategy:
 * - Manual refresh button for on-demand updates
 * - Auto-refresh every 2 minutes (audit data changes frequently)
 * 
 * Field Mappings:
 * - Backend: total_assigned, completed, pending, discrepancies, missing, completion_rate
 * - Audit Items: id, asset_id, asset_name, location, assigned_user, last_audit_date, status, condition
 * - Status Colors: verified=success, pending=warning, discrepancy/missing=error
 * 
 * Role Access: ADMIN, AUDITOR roles only
 * Authentication: Bearer token from localStorage
 * No Mock Data: All data from MongoDB via real endpoints
 */

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import auditorService from '../../services/auditorService';
import type { AuditorStats } from '../../types';
import { useNavigate } from 'react-router-dom';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = "primary", subtitle }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ flex: 1 }}>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ backgroundColor: `${color}.main`, height: 56, width: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        const errorMsg = 'Authentication required. Please log in again.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const [statsData, itemsData] = await Promise.all([
        auditorService.getAuditorStats(),
        auditorService.getAuditItems(),
      ]);

      setStats(statsData);
      setAuditItems(Array.isArray(itemsData) ? itemsData.slice(0, 10) : []);
    } catch (err: unknown) {
      const errorMessage = (err as any).response?.data?.message || (err as any).message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      if (!errorMessage.includes('token') && !errorMessage.includes('Authentication')) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 100);
    
    // Auto-refresh every 2 minutes for audit data
    const interval = setInterval(fetchDashboardData, 120000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: string): "default" | "success" | "warning" | "error" => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'discrepancy':
      case 'missing':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={fetchDashboardData}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Auditor Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track audit progress, compliance metrics, and asset conditions
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
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

        {/* Audit Items Table */}
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent Audit Items
            </Typography>
            <Button
              variant="text"
              onClick={() => navigate('/auditor/audit-list')}
            >
              View All
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset ID</TableCell>
                  <TableCell>Asset Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Assigned User</TableCell>
                  <TableCell>Last Audit</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditItems.length > 0 ? (
                  auditItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.asset_id}</TableCell>
                      <TableCell>{item.asset_name}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{item.assigned_user}</TableCell>
                      <TableCell>
                        {item.last_audit_date !== '1970-01-01'
                          ? new Date(item.last_audit_date).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>{item.condition}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          size="small"
                          color={getStatusColor(item.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No audit items available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default AuditorDashboard;
