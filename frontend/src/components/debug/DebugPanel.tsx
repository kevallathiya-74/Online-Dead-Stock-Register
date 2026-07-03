import {
    ArrowDownTrayIcon,
    BugAntIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DebugPanel: React.FC<DebugPanelProps> = ({ enableQRDebug = true }) => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [captureConsole, setCaptureConsole] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showSysInfo, setShowSysInfo] = useState(false);

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

      setTimeout(() => {
        setLogs((prev) => {
          const updated = [...prev, newLog];
          return updated.slice(-200);
        });
      }, 0);
    };

    console.log = (...args: any[]) => {
      originalConsoleLog.apply(console, args);
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
      
      let component = 'General';
      if (message.includes('QR') || message.includes('scan') || message.includes('camera')) {
        component = 'QRScanner';
      } else if (message.includes('API') || message.includes('axios')) {
        component = 'API';
      } else if (message.includes('Asset')) {
        component = 'Asset';
      }

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

  useEffect(() => {
    if (autoScroll && open) {
      const logContainer = document.getElementById('debug-panel-logs');
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

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500 text-white';
      case 'error': return 'bg-red-500 text-white';
      case 'warn': return 'bg-amber-500 text-slate-900';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getTypeIndicator = (type: string) => {
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
      {/* Floating Toggle Icon Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
        title="Open Debug Panel"
      >
        <BugAntIcon className="w-6 h-6" />
      </button>

      {/* Drawer Overlay backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-fade-in text-[10px] text-slate-300">
          <div className="w-full sm:max-w-2xl bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-800 animate-slide-in-right">
            
            {/* Header title */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BugAntIcon className="w-5 h-5 text-red-500" />
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Debug Logs Monitor</h3>
                <span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-slate-400">{logs.length} Logged</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-450 hover:text-white rounded-lg cursor-pointer">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter buttons bar */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-850 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-1 rounded font-mono ${filterType === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-800 hover:bg-slate-750 text-slate-300'}`}
                >
                  All ({logs.length})
                </button>
                <button
                  onClick={() => setFilterType('QRScanner')}
                  className={`px-2 py-1 rounded font-mono ${filterType === 'QRScanner' ? 'bg-brand-600 text-white' : 'bg-slate-800 hover:bg-slate-750 text-slate-300'}`}
                >
                  QR ({componentCounts.QRScanner || 0})
                </button>
                <button
                  onClick={() => setFilterType('API')}
                  className={`px-2 py-1 rounded font-mono ${filterType === 'API' ? 'bg-brand-600 text-white' : 'bg-slate-800 hover:bg-slate-750 text-slate-300'}`}
                >
                  API ({componentCounts.API || 0})
                </button>
                <button
                  onClick={() => setFilterType('error')}
                  className={`px-2 py-1 rounded font-mono bg-red-950 text-red-400 hover:bg-red-900/50 ${filterType === 'error' ? 'ring-1 ring-red-500' : ''}`}
                >
                  Errors ({typeCounts.error || 0})
                </button>
                <button
                  onClick={() => setFilterType('warn')}
                  className={`px-2 py-1 rounded font-mono bg-amber-950 text-amber-405 hover:bg-amber-900/50 ${filterType === 'warn' ? 'ring-1 ring-amber-500' : ''}`}
                >
                  Warn ({typeCounts.warn || 0})
                </button>
              </div>

              {/* Switches options list */}
              <div className="flex items-center justify-between text-slate-400 font-semibold font-mono">
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={captureConsole}
                      onChange={(e) => setCaptureConsole(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-brand-600"
                    />
                    Capture
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-brand-600"
                    />
                    AutoScroll
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={clearLogs} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded font-mono cursor-pointer">
                    <TrashIcon className="w-3.5 h-3.5" /> Clear
                  </button>
                  <button onClick={exportLogs} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-205 rounded font-mono cursor-pointer">
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
            </div>

            {/* System Info accordion drop panel */}
            <div className="px-4 py-2 border-b border-slate-850 bg-slate-900">
              <button
                onClick={() => setShowSysInfo(!showSysInfo)}
                className="w-full flex items-center justify-between py-1.5 text-slate-450 hover:text-white font-mono"
              >
                <span>SYSINFO SPECS</span>
                {showSysInfo ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
              </button>
              
              {showSysInfo && (
                <div className="mt-2 py-2 border-t border-slate-800 divide-y divide-slate-850 font-mono text-[9px] text-slate-400">
                  <div className="py-1 flex justify-between"><span>UserAgent:</span><span className="text-white truncate max-w-sm">{navigator.userAgent}</span></div>
                  <div className="py-1 flex justify-between"><span>Platform:</span><span className="text-white">{navigator.platform}</span></div>
                  <div className="py-1 flex justify-between"><span>Media Devices:</span><span className="text-white">{navigator.mediaDevices ? 'Available' : 'Unavailable'}</span></div>
                  <div className="py-1 flex justify-between"><span>Active Viewport:</span><span className="text-white">{window.innerWidth}x{window.innerHeight}</span></div>
                </div>
              )}
            </div>

            {/* Logs List Screen */}
            <div
              id="debug-panel-logs"
              className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-950 font-mono leading-relaxed"
            >
              {filteredLogs.length === 0 ? (
                <div className="p-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-center font-mono">
                  No active logs captured yet.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-900/50 border border-slate-850 rounded-lg space-y-1.5 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">{log.timestamp}</span>
                      <span>{getTypeIndicator(log.type)}</span>
                      <span className={`px-1.5 py-0.5 rounded font-mono uppercase text-[8px] font-bold ${getTypeBadgeClass(log.type)}`}>
                        {log.component}
                      </span>
                    </div>
                    <pre className="text-slate-200 text-[9px] whitespace-pre-wrap word-break">{log.message}</pre>
                    {log.data && (
                      <pre className="p-2 bg-slate-950/80 text-green-450 text-[8.5px] rounded overflow-x-auto max-h-40">{JSON.stringify(log.data, null, 2)}</pre>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
