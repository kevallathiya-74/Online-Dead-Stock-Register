import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Alert,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Assignment as AuditIcon,
  CheckCircle as VerifiedIcon,
  Warning as DiscrepancyIcon,
  Error as MissingIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  AccountBalance as ComplianceIcon,
  Security as SecurityIcon,
  AttachMoney as FinancialIcon,
  TaskAlt as TaskIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { toast } from 'react-toastify';

interface AuditSummary {
  totalAssets: number;
  verified: number;
  pending: number;
  discrepancies: number;
  missing: number;
  complianceScore: number;
}

interface RecentActivity {
  id: string;
  type: 'audit' | 'report' | 'compliance' | 'finding';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface UpcomingTask {
  id: string;
  title: string;
  type: 'audit' | 'report' | 'review';
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
}

const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [auditSummary, setAuditSummary] = useState<AuditSummary>({
    totalAssets: 0,
    verified: 0,
    pending: 0,
    discrepancies: 0,
    missing: 0,
    complianceScore: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Demo data for auditor dashboard
      const summaryData: AuditSummary = {
        totalAssets: 1247,
        verified: 1089,
        pending: 89,
        discrepancies: 54,
        missing: 15,
        complianceScore: 87.4,
      };

      const activitiesData: RecentActivity[] = [
        {
          id: '1',
          type: 'audit',
          title: 'Asset Audit Completed',
          description: 'IT Department floor 2 - 45 assets audited',
          timestamp: '2024-01-20 14:30',
          status: 'completed',
          priority: 'medium',
        },
        {
          id: '2',
          type: 'finding',
          title: 'Discrepancy Found',
          description: 'MacBook Pro (ASSET-002) location mismatch',
          timestamp: '2024-01-20 11:15',
          status: 'pending',
          priority: 'high',
        },
        {
          id: '3',
          type: 'report',
          title: 'Compliance Report Generated',
          description: 'Q4 2023 Asset Compliance Report',
          timestamp: '2024-01-19 16:45',
          status: 'completed',
          priority: 'medium',
        },
        {
          id: '4',
          type: 'compliance',
          title: 'Regulatory Review',
          description: 'ISO 27001 compliance assessment completed',
          timestamp: '2024-01-19 09:30',
          status: 'completed',
          priority: 'high',
        },
        {
          id: '5',
          type: 'audit',
          title: 'Physical Verification',
          description: 'Sales department asset verification in progress',
          timestamp: '2024-01-18 13:20',
          status: 'in_progress',
          priority: 'medium',
        },
      ];

      const tasksData: UpcomingTask[] = [
        {
          id: '1',
          title: 'Q1 2024 Financial Audit',
          type: 'audit',
          dueDate: '2024-01-25',
          priority: 'high',
          assignedTo: 'Current User',
        },
        {
          id: '2',
          title: 'Security Assets Review',
          type: 'review',
          dueDate: '2024-01-26',
          priority: 'critical',
          assignedTo: 'Current User',
        },
        {
          id: '3',
          title: 'Compliance Report Submission',
          type: 'report',
          dueDate: '2024-01-28',
          priority: 'medium',
          assignedTo: 'Sarah Wilson',
        },
        {
          id: '4',
          title: 'Asset Reconciliation',
          type: 'audit',
          dueDate: '2024-01-30',
          priority: 'high',
          assignedTo: 'Current User',
        },
      ];

      setAuditSummary(summaryData);
      setRecentActivities(activitiesData);
      setUpcomingTasks(tasksData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'audit': return <AuditIcon />;
      case 'report': return <ReportIcon />;
      case 'compliance': return <ComplianceIcon />;
      case 'finding': return <DiscrepancyIcon />;
      default: return <TaskIcon />;
    }
  };

  const getActivityColor = (type: string, status: string) => {
    if (status === 'completed') return 'success';
    if (status === 'in_progress') return 'info';
    if (type === 'finding') return 'error';
    return 'warning';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'audit': return <AuditIcon />;
      case 'report': return <ReportIcon />;
      case 'review': return <ViewIcon />;
      default: return <TaskIcon />;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'audit_assets':
        navigate('/auditor/assets');
        break;
      case 'view_reports':
        navigate('/auditor/reports');
        break;
      case 'generate_report':
        toast.success('New audit report generation started');
        break;
      case 'schedule_audit':
        toast.info('Audit scheduling interface opened');
        break;
      default:
        toast.info(`${action} action triggered`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading auditor dashboard...</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Auditor Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Comprehensive audit management and compliance tracking
          </Typography>
        </Box>

        {/* Audit Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {auditSummary.totalAssets}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Assets
                    </Typography>
                  </Box>
                  <AuditIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {auditSummary.verified}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verified
                    </Typography>
                  </Box>
                  <VerifiedIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {auditSummary.pending}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                  <PendingIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {auditSummary.discrepancies}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Discrepancies
                    </Typography>
                  </Box>
                  <DiscrepancyIcon color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="error.main">
                      {auditSummary.missing}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Missing
                    </Typography>
                  </Box>
                  <MissingIcon color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {auditSummary.complianceScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compliance
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={auditSummary.complianceScore}
                    sx={{ height: 6 }}
                    color={auditSummary.complianceScore >= 90 ? 'success' : 
                           auditSummary.complianceScore >= 70 ? 'warning' : 'error'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AuditIcon />}
                  onClick={() => handleQuickAction('audit_assets')}
                  sx={{ py: 1.5 }}
                >
                  Audit Assets
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={() => handleQuickAction('view_reports')}
                  sx={{ py: 1.5 }}
                >
                  View Reports
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ComplianceIcon />}
                  onClick={() => handleQuickAction('generate_report')}
                  sx={{ py: 1.5 }}
                >
                  Generate Report
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TaskIcon />}
                  onClick={() => handleQuickAction('schedule_audit')}
                  sx={{ py: 1.5 }}
                >
                  Schedule Audit
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Recent Activities and Upcoming Tasks */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activities
                </Typography>
                <List>
                  {recentActivities.map((activity, index) => (
                    <ListItem key={activity.id} divider={index < recentActivities.length - 1}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getActivityColor(activity.type, activity.status)}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">{activity.title}</Typography>
                            <Chip
                              label={activity.priority}
                              size="small"
                              color={getPriorityColor(activity.priority) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.timestamp}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upcoming Tasks
                </Typography>
                <List>
                  {upcomingTasks.map((task, index) => (
                    <ListItem key={task.id} divider={index < upcomingTasks.length - 1}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getPriorityColor(task.priority)}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getTaskIcon(task.type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">{task.title}</Typography>
                            <Chip
                              label={task.priority}
                              size="small"
                              color={getPriorityColor(task.priority) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Due: {task.dueDate} | Assigned: {task.assignedTo}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Compliance Alert */}
        {auditSummary.complianceScore < 80 && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="subtitle2">
              Compliance Score Below Threshold
            </Typography>
            <Typography variant="body2">
              Current compliance score is {auditSummary.complianceScore}%. 
              Immediate attention required to address {auditSummary.discrepancies} discrepancies 
              and {auditSummary.missing} missing assets.
            </Typography>
          </Alert>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default AuditorDashboard;