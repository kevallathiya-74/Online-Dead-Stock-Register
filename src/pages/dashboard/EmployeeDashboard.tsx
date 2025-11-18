/**
 * EMPLOYEE DASHBOARD - Real-Time Integration
 * 
 * Data Sources (100% Real API):
 * - GET /api/v1/dashboard/employee/stats - Employee-specific statistics
 * - GET /api/v1/assets/my-assets - Assets assigned to current user
 * 
 * Real-Time Strategy:
 * - Manual refresh for user-initiated updates
 * - Scoped to logged-in user via JWT token (user ID from req.user)
 * 
 * Field Mappings:
 * - Backend: total_assets, active_assets, pending_maintenance, warranties_expiring
 * - Assets: _id, unique_asset_id, manufacturer, model, serial_number, status, location, condition, category
 * - Category Icons: Laptop/Computer → LaptopIcon, Mobile/Phone → PhoneIcon, Default → InventoryIcon
 * 
 * Role Access: All authenticated users (employee data scoped by user ID)
 * Authentication: Bearer token in Authorization header
 * No Mock Data: Assets filtered server-side by assigned_user
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  Avatar,
  Paper,
  ListItemAvatar,
  CircularProgress,
} from "@mui/material";
import {
  Laptop as LaptopIcon,
  Smartphone as PhoneIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Build as MaintenanceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  QrCodeScanner as QrScanIcon,
} from "@mui/icons-material";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface Asset {
  _id: string;
  unique_asset_id: string;
  name?: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  location: string;
  condition: string;
  category?: { name: string };
  asset_type?: string;
}

interface EmployeeStats {
  total_assets: number;
  active_assets: number;
  pending_maintenance: number;
  warranties_expiring: number;
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = "primary", loading = false }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={24} sx={{ my: 1 }} />
          ) : (
            <Typography variant="h4" component="div">
              {value}
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

// Quick Action Card Component
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, onClick, color = "primary" }) => (
  <Card sx={{ height: "100%", cursor: "pointer", transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", boxShadow: 3 } }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <Avatar sx={{ backgroundColor: `${color}.main`, mr: 2, mt: 0.5 }}>
          {icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);

  const loadDashboardData = async () => {
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

      // Fetch employee stats and assets
      const [statsResponse, assetsResponse] = await Promise.all([
        api.get('/dashboard/employee/stats'),
        api.get('/assets/my-assets'),
      ]);

      setStats(statsResponse.data);
      setMyAssets(Array.isArray(assetsResponse.data.data) ? assetsResponse.data.data : []);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      const errorMessage = error.response?.data?.message || "Failed to load dashboard data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('laptop') || cat.includes('computer')) return <LaptopIcon />;
    if (cat.includes('mobile') || cat.includes('phone')) return <PhoneIcon />;
    return <InventoryIcon />;
  };

  const quickActions = [
    {
      title: "Scan QR Code",
      description: "Scan asset QR code",
      icon: <QrScanIcon />,
      onClick: () => navigate("/assets/scan-qr"),
      color: "primary" as const,
    },
    {
      title: "Request Asset",
      description: "Submit new asset request",
      icon: <AddIcon />,
      onClick: () => navigate("/employee/requests"),
      color: "success" as const,
    },
    {
      title: "Report Issue",
      description: "Report asset problems",
      icon: <MaintenanceIcon />,
      onClick: () => navigate("/maintenance"),
      color: "warning" as const,
    },
  ];

  if (error && !stats) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }>
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Welcome, {user?.name || user?.full_name || "Employee"}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your assigned assets and requests
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Assets"
              value={stats?.total_assets || 0}
              icon={<InventoryIcon />}
              color="primary"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Assets"
              value={stats?.active_assets || 0}
              icon={<CheckIcon />}
              color="success"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Maintenance"
              value={stats?.pending_maintenance || 0}
              icon={<MaintenanceIcon />}
              color="warning"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Warranties Expiring"
              value={stats?.warranties_expiring || 0}
              icon={<WarningIcon />}
              color="error"
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }} fontWeight="medium">
          Quick Actions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>

        {/* My Assigned Assets */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            My Assigned Assets ({myAssets.length})
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : myAssets.length === 0 ? (
            <Alert severity="info">No assets assigned to you yet</Alert>
          ) : (
            <List>
              {myAssets.map((asset, index) => (
                <ListItem
                  key={asset._id}
                  divider={index < myAssets.length - 1}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {getCategoryIcon(asset.asset_type || "")}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">
                          {asset.manufacturer} {asset.model}
                        </Typography>
                        <Chip label={asset.status} size="small" color="success" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          ID: {asset.unique_asset_id} | S/N: {asset.serial_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Location: {asset.location} | Condition: {asset.condition}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate("/employee/my-assets")}
          >
            View All Assets
          </Button>
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
