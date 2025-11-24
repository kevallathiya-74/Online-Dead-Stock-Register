import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Inventory2,
  DeleteForever,
  TrendingUp,
  Settings as SettingsIcon,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface LifecycleStats {
  current_state: {
    active: number;
    dead_stock: number;
    disposed: number;
  };
  eligible: {
    for_dead_stock: number;
    for_disposal: number;
  };
  configuration: {
    deadStock: {
      maxAgeYears: number;
      poorConditionAge: number;
      noMaintenanceMonths: number;
    };
    disposal: {
      daysInDeadStock: number;
      autoApprove: boolean;
    };
  };
}

interface AutomationResult {
  success: boolean;
  duration: string;
  deadStock: {
    count: number;
    assets: Array<{
      assetId: string;
      name: string;
      reason: string;
    }>;
  };
  disposal: {
    count: number;
    records: Array<{
      assetId: string;
      name: string;
      method: string;
      value: number;
    }>;
  };
}

const LifecycleManagementPage: React.FC = () => {
  const [stats, setStats] = useState<LifecycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [resultDialog, setResultDialog] = useState(false);
  const [result, setResult] = useState<AutomationResult | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/lifecycle/stats');
      setStats(response.data.data);
    } catch (error: any) {
      toast.error('Failed to fetch lifecycle statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const runFullAutomation = async () => {
    setRunning(true);
    try {
      const response = await api.post('/lifecycle/run');
      setResult(response.data.data);
      setResultDialog(true);
      toast.success('Lifecycle automation completed successfully');
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to run lifecycle automation');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const runDeadStockOnly = async () => {
    setRunning(true);
    try {
      const response = await api.post('/lifecycle/dead-stock');
      toast.success(`${response.data.data.count} assets moved to dead stock`);
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to run dead stock check');
    } finally {
      setRunning(false);
    }
  };

  const runDisposalOnly = async () => {
    setRunning(true);
    try {
      const response = await api.post('/lifecycle/disposal');
      toast.success(`${response.data.data.count} assets moved to disposal`);
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to run disposal check');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Asset Lifecycle Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Automated management of asset lifecycle: Active → Dead Stock → Disposal
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={running ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
          onClick={runFullAutomation}
          disabled={running}
        >
          Run Full Automation
        </Button>
      </Box>

      {/* Alert for pending actions */}
      {stats && (stats.eligible.for_dead_stock > 0 || stats.eligible.for_disposal > 0) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Action Required:</strong> {stats.eligible.for_dead_stock} assets eligible for
            dead stock, {stats.eligible.for_disposal} assets ready for disposal
          </Typography>
        </Alert>
      )}

      {/* Current State Statistics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Assets</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {stats?.current_state.active || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Currently in use or available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Dead Stock</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="warning.main">
                {stats?.current_state.dead_stock || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Marked for disposal review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DeleteForever color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Disposed</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="error.main">
                {stats?.current_state.disposed || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Permanently disposed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Eligible Assets */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Eligible for Dead Stock
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h2" fontWeight="bold" color="warning.main">
                  {stats?.eligible.for_dead_stock || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary" ml={2}>
                  assets meet criteria
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="textSecondary" mb={1}>
                <strong>Criteria:</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Assets older than {stats?.configuration.deadStock.maxAgeYears} years
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Poor condition for {stats?.configuration.deadStock.poorConditionAge}+ years
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • No maintenance for {stats?.configuration.deadStock.noMaintenanceMonths} months
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={<Inventory2 />}
                onClick={runDeadStockOnly}
                disabled={running || stats?.eligible.for_dead_stock === 0}
              >
                Move to Dead Stock
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ready for Disposal
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h2" fontWeight="bold" color="error.main">
                  {stats?.eligible.for_disposal || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary" ml={2}>
                  assets ready
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="textSecondary" mb={1}>
                <strong>Criteria:</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • In dead stock for {stats?.configuration.disposal.daysInDeadStock}+ days
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Auto-approval:{' '}
                {stats?.configuration.disposal.autoApprove ? 'Enabled' : 'Disabled'}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={<DeleteForever />}
                onClick={runDisposalOnly}
                disabled={running || stats?.eligible.for_disposal === 0}
              >
                Move to Disposal
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Automation Flow */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Automation Flow
          </Typography>
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">Active</Typography>
                  <Typography variant="body2" color="textSecondary">
                    In use / Available
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={1}>
                <Box textAlign="center">
                  <Typography variant="h4" color="textSecondary">
                    →
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6">Dead Stock</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Outdated / Damaged
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={1}>
                <Box textAlign="center">
                  <Typography variant="h4" color="textSecondary">
                    →
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <DeleteForever sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                  <Typography variant="h6">Disposal</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Recycling / Auction
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </CardContent>
      </Card>

      {/* Scheduled Automation Info */}
      <Alert severity="info" icon={<TrendingUp />}>
        <Typography variant="body2">
          <strong>Scheduled Automation:</strong> Lifecycle automation runs daily at 1:00 AM IST.
          Assets are automatically evaluated and moved through the lifecycle stages based on
          configured criteria.
        </Typography>
      </Alert>

      {/* Result Dialog */}
      <Dialog open={resultDialog} onClose={() => setResultDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Automation Results</DialogTitle>
        <DialogContent>
          {result && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ✅ Completed in {result.duration}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      Dead Stock: {result.deadStock.count}
                    </Typography>
                    {result.deadStock.assets.slice(0, 5).map((asset, index) => (
                      <Typography key={index} variant="body2" sx={{ mt: 1 }}>
                        • {asset.assetId}: {asset.reason}
                      </Typography>
                    ))}
                    {result.deadStock.count > 5 && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        ... and {result.deadStock.count - 5} more
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      Disposal: {result.disposal.count}
                    </Typography>
                    {result.disposal.records.slice(0, 5).map((record, index) => (
                      <Typography key={index} variant="body2" sx={{ mt: 1 }}>
                        • {record.assetId}: {record.method} - ₹{record.value}
                      </Typography>
                    ))}
                    {result.disposal.count > 5 && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        ... and {result.disposal.count - 5} more
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LifecycleManagementPage;
