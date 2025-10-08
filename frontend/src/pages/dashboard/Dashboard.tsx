import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid as MuiGrid,
  Paper,
} from '@mui/material';

const Grid = MuiGrid as any; // Temporary type assertion to fix Grid component issues
import {
  Inventory as InventoryIcon,
  Build as MaintenanceIcon,
  Assignment as ApprovalIcon,
  Warning as AlertIcon,
  TrendingUp as TrendingUpIcon,
  Store as VendorIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import StatCard from '../../components/dashboard/StatCard';
import ChartComponent from '../../components/dashboard/ChartComponent';
import RecentActivities from '../../components/dashboard/RecentActivities';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sample chart data
  const assetTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Assets',
        data: [1200, 1250, 1300, 1350, 1400, 1450],
        borderColor: '#2196f3',
        backgroundColor: '#2196f320',
      },
      {
        label: 'Active Assets',
        data: [1000, 1050, 1100, 1150, 1200, 1250],
        borderColor: '#4caf50',
        backgroundColor: '#4caf5020',
      },
    ],
  };

  const departmentAssetsData = {
    labels: ['IT', 'Finance', 'HR', 'Operations', 'Maintenance'],
    datasets: [
      {
        label: 'Assets by Department',
        data: [300, 250, 150, 400, 200],
        borderColor: '#2196f3',
        backgroundColor: '#2196f320',
      },
    ],
  };

  // Sample activities data
  const recentActivities = [
    {
      id: '1',
      type: 'asset' as const,
      title: 'New Asset Added',
      description: 'Laptop Dell XPS 15 has been added to inventory',
      timestamp: new Date().toISOString(),
      user: 'John Doe',
    },
    {
      id: '2',
      type: 'maintenance' as const,
      title: 'Maintenance Scheduled',
      description: 'Routine maintenance scheduled for Printer HP LaserJet',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'Jane Smith',
    },
    {
      id: '3',
      type: 'approval' as const,
      title: 'Asset Transfer Approved',
      description: 'Transfer of Monitor Dell U2419H approved',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'Mike Johnson',
    },
  ];

  return (
    <Layout title="Dashboard">
      <Grid container spacing={3}>
        {/* Stats Row */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Assets"
            value="1,450"
            subtitle="12% increase from last month"
            progress={75}
            progressColor="primary"
            icon={<InventoryIcon />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Pending Approvals"
            value="12"
            subtitle="5 urgent approvals"
            progress={45}
            progressColor="warning"
            icon={<ApprovalIcon />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Maintenance Due"
            value="5"
            subtitle="Next maintenance in 3 days"
            progress={30}
            progressColor="error"
            icon={<MaintenanceIcon />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Asset Utilization"
            value="78%"
            subtitle="5% increase from last month"
            progress={78}
            progressColor="success"
            icon={<TrendingUpIcon />}
          />
        </Grid>

        {/* Charts Row */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <ChartComponent
              title="Asset Trends"
              type="line"
              data={assetTrendData}
              height={300}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <ChartComponent
              title="Assets by Department"
              type="bar"
              data={departmentAssetsData}
              height={300}
            />
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <RecentActivities activities={recentActivities} />
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Dashboard;