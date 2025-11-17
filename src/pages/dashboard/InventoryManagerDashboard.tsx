/**
 * INVENTORY MANAGER DASHBOARD - Real-Time Integration
 * 
 * Data Sources (100% Real API):
 * - GET /api/v1/dashboard/inventory-stats - Inventory statistics with trends
 * - GET /api/v1/dashboard/assets-by-location - Asset distribution by location
 * - GET /api/v1/dashboard/warranty-expiring - Warranties expiring in 90 days
 * - GET /api/v1/dashboard/maintenance-schedule - Upcoming maintenance (next 7 days)
 * - GET /api/v1/dashboard/top-vendors - Top performing vendors
 * - GET /api/v1/dashboard/inventory-approvals - Pending inventory approvals
 * 
 * Real-Time Strategy:
 * - Auto-refresh every 5 minutes for inventory data
 * - Manual refresh with cache invalidation
 * - Backend caching: Redis 300-600s TTL
 * 
 * Field Mappings:
 * - Stats: totalAssets, activeAssets, inMaintenanceAssets, disposedAssets, totalValue, locationCount, warrantyExpiring, maintenanceDue
 * - Locations: location name, count, percentage
 * - Warranty: asset ID, category, expiryDate, daysLeft, priority (high/medium/low)
 * - Maintenance: asset, scheduledDate, type, assignedTechnician, priority
 * - Vendors: vendor_name, total_orders, total_value, performance_score
 * - Currency: ₹ Indian Rupee with toLocaleString('en-IN')
 * 
 * Role Access: ADMIN, INVENTORY_MANAGER, IT_MANAGER roles
 * Authentication: Bearer token in Authorization header
 * Caching: Backend Redis cache with user-scoped keys
 * No Mock Data: All data from MongoDB aggregation pipelines
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  LinearProgress,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Warning,
  TrendingUp,
  TrendingDown,
  LocationOn as LocationIcon,
  CheckCircle,
  Visibility,
  Add as AddIcon,
  ShoppingCart as OrderIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Build as MaintenanceIcon,
  Security as WarrantyIcon,
  Business as VendorIcon,
  QrCodeScanner as QrScanIcon,
} from "@mui/icons-material";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { dashboardDataService } from "../../services/dashboardData.service";
import { UserRole } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "primary",
  onClick,
  loading = false,
}) => (
  <Card
    sx={{
      height: "100%",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s",
      "&:hover": onClick
        ? {
            transform: "translateY(-2px)",
            boxShadow: 4,
          }
        : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={24} sx={{ my: 1 }} />
          ) : (
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {value}
            </Typography>
          )}
          {trend && !loading && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {trend.isPositive ? (
                <TrendingUp sx={{ color: "success.main", mr: 0.5, fontSize: 20 }} />
              ) : (
                <TrendingDown sx={{ color: "error.main", mr: 0.5, fontSize: 20 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: trend.isPositive ? "success.main" : "error.main",
                }}
              >
                {trend.value}%
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar
          sx={{
            backgroundColor: `${color}.main`,
            height: 56,
            width: 56,
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

// Quick Action Button Component
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
}

const QuickActionCard: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
  color = "primary",
}) => (
  <Card
    sx={{
      height: "100%",
      cursor: "pointer",
      transition: "all 0.2s",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: 3,
      },
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <Avatar
          sx={{
            backgroundColor: `${color}.main`,
            mr: 2,
            mt: 0.5,
          }}
        >
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

const InventoryManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [assetsByLocation, setAssetsByLocation] = useState<any[]>([]);
  const [warrantyExpiring, setWarrantyExpiring] = useState<any[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  // Load dashboard data from API
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel from real API endpoints
      const [
        dashboardStats,
        locationData,
        warrantyData,
        maintenanceData,
        vendorData,
        approvalsData,
      ] = await Promise.all([
        dashboardDataService.getDashboardStats(UserRole.INVENTORY_MANAGER),
        dashboardDataService.getAssetsByLocation(),
        dashboardDataService.getWarrantyExpiringAssets(),
        dashboardDataService.getMaintenanceSchedule(),
        dashboardDataService.getVendorPerformance(),
        api.get('/dashboard/inventory-approvals').then(res => res.data).catch(() => ({ data: [] })),
      ]);

      setStats(dashboardStats);
      setAssetsByLocation(locationData);
      setWarrantyExpiring(warrantyData);
      setMaintenanceSchedule(maintenanceData);
      setTopVendors(vendorData);
      setPendingApprovals(Array.isArray(approvalsData.data) ? approvalsData.data : []);
      
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    dashboardDataService.refreshCache();
    loadDashboardData();
  };

  // Quick Actions
  const quickActions = [
    {
      title: "Scan QR Code",
      description: "Scan asset QR codes",
      icon: <QrScanIcon />,
      onClick: () => navigate("/assets/scan-qr"),
      color: "primary" as const,
    },
    {
      title: "Add Asset",
      description: "Register new asset",
      icon: <AddIcon />,
      onClick: () => navigate("/assets/add"),
      color: "success" as const,
    },
    {
      title: "Manage Maintenance",
      description: "Schedule maintenance",
      icon: <ScheduleIcon />,
      onClick: () => navigate("/maintenance"),
      color: "warning" as const,
    },
    {
      title: "Purchase Orders",
      description: "View purchase orders",
      icon: <OrderIcon />,
      onClick: () => navigate("/purchase-orders"),
      color: "secondary" as const,
    },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDashboardData}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Inventory Manager Dashboard
          </Typography>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </Box>

        {/* Statistics Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Assets"
              value={stats?.totalAssets || 0}
              icon={<InventoryIcon />}
              trend={stats?.trends?.assets}
              color="primary"
              onClick={() => navigate("/assets")}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Assets"
              value={stats?.activeAssets || 0}
              icon={<CheckCircle />}
              trend={stats?.trends?.active}
              color="success"
              onClick={() => navigate("/assets?status=Active")}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Warranty Expiring"
              value={stats?.warrantyExpiring || 0}
              icon={<WarrantyIcon />}
              color="warning"
              onClick={() => navigate("/assets?filter=warranty_expiring")}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Maintenance Due"
              value={stats?.maintenanceDue || 0}
              icon={<MaintenanceIcon />}
              color="error"
              onClick={() => navigate("/maintenance")}
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" sx={{ mb: 2 }} fontWeight="medium">
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <QuickActionCard {...action} />
            </Grid>
          ))}
        </Grid>

        {/* Data Sections */}
        <Grid container spacing={3}>
          {/* Assets by Location */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Assets by Location
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : assetsByLocation.length === 0 ? (
                <Alert severity="info">No location data available</Alert>
              ) : (
                <List>
                  {assetsByLocation.map((location, index) => (
                    <ListItem key={index} divider={index < assetsByLocation.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <LocationIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={location.location}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                              <Typography variant="body2">{location.count} assets</Typography>
                              <Typography variant="body2">{location.percentage}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={location.percentage}
                              sx={{ height: 6, borderRadius: 1 }}
                            />
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
                onClick={() => navigate("/locations")}
              >
                View All Locations
              </Button>
            </Paper>
          </Grid>

          {/* Warranty Expiring */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Warranty Expiring Soon
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : warrantyExpiring.length === 0 ? (
                <Alert severity="success">No warranties expiring soon</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Days Left</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {warrantyExpiring.slice(0, 5).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                              {item.asset}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {item.daysLeft <= 30 && (
                                <Warning sx={{ color: "error.main", mr: 0.5, fontSize: 16 }} />
                              )}
                              {item.daysLeft} days
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.priority}
                              size="small"
                              color={
                                item.priority === "high"
                                  ? "error"
                                  : item.priority === "medium"
                                  ? "warning"
                                  : "default"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/assets?warranty=${item.asset}`)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Maintenance Schedule */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upcoming Maintenance
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : maintenanceSchedule.length === 0 ? (
                <Alert severity="info">No maintenance scheduled</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Scheduled Date</TableCell>
                        <TableCell>Technician</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {maintenanceSchedule.slice(0, 5).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.asset}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.scheduledDate}</TableCell>
                          <TableCell>{item.technician}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.status}
                              size="small"
                              color={item.status === "scheduled" ? "success" : "warning"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate("/maintenance")}
              >
                View All Maintenance
              </Button>
            </Paper>
          </Grid>

          {/* Top Vendors */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Vendors
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : topVendors.length === 0 ? (
                <Alert severity="info">No vendor data available</Alert>
              ) : (
                <List>
                  {topVendors.slice(0, 5).map((vendor, index) => (
                    <ListItem key={index} divider={index < topVendors.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "secondary.main" }}>
                          <VendorIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={vendor.name}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {vendor.orders || 0} orders • ₹{(vendor.value || 0).toLocaleString('en-IN')}
                            </Typography>
                            <br />
                            <Typography variant="caption" component="span">
                              Rating: ⭐ {vendor.rating || 0}/5
                            </Typography>
                          </>
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
                onClick={() => navigate("/vendors")}
              >
                View All Vendors
              </Button>
            </Paper>
          </Grid>

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Pending Approvals ({pendingApprovals.length})
                </Typography>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <List>
                    {pendingApprovals.slice(0, 5).map((approval, index) => (
                      <ListItem
                        key={index}
                        divider={index < pendingApprovals.length - 1}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => navigate("/approvals")}
                          >
                            <Visibility />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Typography variant="subtitle2">
                                {approval.type} - {approval.id}
                              </Typography>
                              <Chip
                                label={approval.priority}
                                size="small"
                                color={
                                  approval.priority === "Critical"
                                    ? "error"
                                    : approval.priority === "High"
                                    ? "warning"
                                    : "info"
                                }
                              />
                            </Box>
                          }
                          secondary={`Requested by ${approval.requester} • ${approval.daysAgo} day${
                            approval.daysAgo !== 1 ? "s" : ""
                          } ago`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => navigate("/approvals")}
                >
                  View All Approvals
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default InventoryManagerDashboard;
