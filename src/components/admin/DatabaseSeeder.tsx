import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Storage, CheckCircle } from '@mui/icons-material';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DatabaseSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    if (!window.confirm('This will seed the database with test data. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await api.post('/dev/seed-database');

      if (response.data.success) {
        setResult(response.data.data);
        toast.success('Database seeded successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to seed database');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to seed database';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Storage color="primary" />
          <Typography variant="h6">Database Seeder</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          Use this tool to populate the database with sample test data including assets, vendors, and maintenance records.
          This is useful for development and testing purposes.
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Development Only:</strong> This feature is only available in development mode and will be disabled in production.
        </Alert>

        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <Storage />}
          onClick={handleSeedDatabase}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? 'Seeding Database...' : 'Seed Database'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
              Database seeded successfully!
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Summary:
            </Typography>

            <List dense>
              {result.vendors && (
                <ListItem>
                  <ListItemText
                    primary="Vendors"
                    secondary={
                      result.vendors.created
                        ? `Created ${result.vendors.created} vendors`
                        : `${result.vendors.existing} vendors already exist`
                    }
                  />
                </ListItem>
              )}

              {result.assets && (
                <ListItem>
                  <ListItemText
                    primary="Assets"
                    secondary={
                      result.assets.created
                        ? `Created ${result.assets.created} assets`
                        : `${result.assets.existing} assets already exist`
                    }
                  />
                </ListItem>
              )}

              {result.maintenance && (
                <ListItem>
                  <ListItemText
                    primary="Maintenance Records"
                    secondary={
                      result.maintenance.created
                        ? `Created ${result.maintenance.created} maintenance records`
                        : `${result.maintenance.existing} maintenance records already exist`
                    }
                  />
                </ListItem>
              )}

              {result.adminUser && (
                <ListItem>
                  <ListItemText
                    primary="Admin User"
                    secondary={`Using ${result.adminUser.found} (${result.adminUser.role})`}
                  />
                </ListItem>
              )}
            </List>

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Refresh your dashboard to see the new data.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseSeeder;
