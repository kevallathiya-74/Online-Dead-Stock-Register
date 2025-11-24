import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  BugReport as BugIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  DeleteSweep as ClearIcon,
} from '@mui/icons-material';

interface DebugLog {
  id: number;
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'success';
  component: string;
  message: string;
  data?: any;
}

interface DebugPanelProps {
  enableQRDebug?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ enableQRDebug = true }) => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [captureConsole, setCaptureConsole] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  // Intercept console methods
  useEffect(() => {
    if (!captureConsole) return;

    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    const addLog = (type: 'info' | 'warn' | 'error' | 'success', component: string, message: string, data?: any) => {
      const newLog: DebugLog = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
        type,
        component,
        message,
        data,
      };

      setLogs((prev) => {
        const updated = [...prev, newLog];
        // Keep only last 200 logs
        return updated.slice(-200);
      });
    };

    console.log = (...args: any[]) => {
      originalConsoleLog.apply(console, args);
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
      
      // Detect component from message
      let component = 'General';
      if (message.includes('QR') || message.includes('scan') || message.includes('camera')) {
        component = 'QRScanner';
      } else if (message.includes('API') || message.includes('axios')) {
        component = 'API';
      } else if (message.includes('Asset')) {
        component = 'Asset';
      }

      // Determine type from emoji/symbols
      let type: 'info' | 'warn' | 'error' | 'success' = 'info';
      if (message.includes('✅') || message.includes('SUCCESS')) type = 'success';
      else if (message.includes('⚠️') || message.includes('WARNING')) type = 'warn';
      else if (message.includes('❌') || message.includes('ERROR')) type = 'error';

      addLog(type as 'info' | 'warn' | 'error', component, message, args.length > 1 ? args : undefined);
    };

    console.warn = (...args: any[]) => {
      originalConsoleWarn.apply(console, args);
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
      addLog('warn', 'Warning', message, args.length > 1 ? args : undefined);
    };

    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
      addLog('error', 'Error', message, args.length > 1 ? args : undefined);
    };

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, [captureConsole]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && open) {
      const logContainer = document.getElementById('debug-log-container');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll, open]);

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}] [${log.component}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warn': return '#ff9800';
      default: return '#2196f3';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warn': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const filteredLogs = filterType === 'all' 
    ? logs 
    : logs.filter(log => log.type === filterType || log.component === filterType);

  const componentCounts = logs.reduce((acc, log) => {
    acc[log.component] = (acc[log.component] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeCounts = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Floating Debug Button */}
      <Tooltip title="Open Debug Panel" placement="left">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 9999,
            backgroundColor: 'error.main',
            color: 'white',
            boxShadow: 3,
            '&:hover': {
              backgroundColor: 'error.dark',
            },
            width: 56,
            height: 56,
          }}
        >
          <BugIcon />
        </IconButton>
      </Tooltip>

      {/* Debug Panel Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 600, md: 800 },
            backgroundColor: '#1e1e1e',
            color: '#fff',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: '#2d2d2d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #444',
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <BugIcon sx={{ color: '#f44336' }} />
              <Typography variant="h6" fontWeight="600">
                Debug Panel
              </Typography>
              <Chip
                label={`${logs.length} logs`}
                size="small"
                sx={{ ml: 1, backgroundColor: '#424242', color: '#fff' }}
              />
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Controls */}
          <Box sx={{ p: 2, backgroundColor: '#252525', borderBottom: '1px solid #444' }}>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Button
                size="small"
                variant={filterType === 'all' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('all')}
                sx={{ color: filterType === 'all' ? '#fff' : '#aaa' }}
              >
                All ({logs.length})
              </Button>
              <Button
                size="small"
                variant={filterType === 'QRScanner' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('QRScanner')}
                sx={{ color: filterType === 'QRScanner' ? '#fff' : '#aaa' }}
              >
                QR Scanner ({componentCounts.QRScanner || 0})
              </Button>
              <Button
                size="small"
                variant={filterType === 'API' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('API')}
                sx={{ color: filterType === 'API' ? '#fff' : '#aaa' }}
              >
                API ({componentCounts.API || 0})
              </Button>
              <Button
                size="small"
                variant={filterType === 'Asset' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('Asset')}
                sx={{ color: filterType === 'Asset' ? '#fff' : '#aaa' }}
              >
                Asset ({componentCounts.Asset || 0})
              </Button>
              <Divider orientation="vertical" flexItem sx={{ mx: 1, backgroundColor: '#444' }} />
              <Button
                size="small"
                variant={filterType === 'error' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setFilterType('error')}
              >
                Errors ({typeCounts.error || 0})
              </Button>
              <Button
                size="small"
                variant={filterType === 'warn' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('warn')}
                sx={{ color: filterType === 'warn' ? '#fff' : '#ff9800' }}
              >
                Warnings ({typeCounts.warn || 0})
              </Button>
            </Box>

            <Box display="flex" gap={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={captureConsole}
                    onChange={(e) => setCaptureConsole(e.target.checked)}
                    size="small"
                  />
                }
                label="Capture Console"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto Scroll"
              />
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearLogs}
                variant="outlined"
                sx={{ ml: 'auto', color: '#fff' }}
              >
                Clear
              </Button>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={exportLogs}
                variant="outlined"
                sx={{ color: '#fff' }}
              >
                Export
              </Button>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ p: 2, backgroundColor: '#2a2a2a', borderBottom: '1px solid #444' }}>
            <Accordion
              sx={{
                backgroundColor: '#333',
                color: '#fff',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                <Typography variant="subtitle2">System Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: '#aaa', border: 'none' }}>User Agent</TableCell>
                        <TableCell sx={{ color: '#fff', border: 'none', fontSize: '0.75rem' }}>
                          {navigator.userAgent}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#aaa', border: 'none' }}>Platform</TableCell>
                        <TableCell sx={{ color: '#fff', border: 'none' }}>{navigator.platform}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#aaa', border: 'none' }}>Language</TableCell>
                        <TableCell sx={{ color: '#fff', border: 'none' }}>{navigator.language}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#aaa', border: 'none' }}>Camera API</TableCell>
                        <TableCell sx={{ color: '#fff', border: 'none' }}>
                          {navigator.mediaDevices ? '✅ Available' : '❌ Not Available'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#aaa', border: 'none' }}>HTTPS</TableCell>
                        <TableCell sx={{ color: '#fff', border: 'none' }}>
                          {window.location.protocol === 'https:' ? '✅ Secure' : '⚠️ Not Secure'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#aaa', border: 'none' }}>Viewport</TableCell>
                        <TableCell sx={{ color: '#fff', border: 'none' }}>
                          {window.innerWidth} x {window.innerHeight}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Logs */}
          <Box
            id="debug-log-container"
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              backgroundColor: '#1e1e1e',
            }}
          >
            {filteredLogs.length === 0 ? (
              <Alert severity="info" sx={{ backgroundColor: '#2a2a2a', color: '#fff' }}>
                No logs captured yet. Interact with the app to see debug information.
              </Alert>
            ) : (
              filteredLogs.map((log) => (
                <Box
                  key={log.id}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    backgroundColor: '#2a2a2a',
                    borderLeft: `4px solid ${getTypeColor(log.type)}`,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#333',
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography
                      component="span"
                      sx={{ fontSize: '0.75rem', color: '#888', minWidth: 80 }}
                    >
                      {log.timestamp}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '0.875rem' }}>
                      {getTypeIcon(log.type)}
                    </Typography>
                    <Chip
                      label={log.component}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        backgroundColor: getTypeColor(log.type),
                        color: '#fff',
                      }}
                    />
                  </Box>
                  <Typography
                    component="pre"
                    sx={{
                      fontSize: '0.8rem',
                      color: '#fff',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                      fontFamily: 'monospace',
                    }}
                  >
                    {log.message}
                  </Typography>
                  {log.data && (
                    <Box
                      component="pre"
                      sx={{
                        mt: 1,
                        p: 1,
                        backgroundColor: '#1a1a1a',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        color: '#4caf50',
                        overflow: 'auto',
                        maxHeight: 200,
                      }}
                    >
                      {JSON.stringify(log.data, null, 2)}
                    </Box>
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default DebugPanel;
