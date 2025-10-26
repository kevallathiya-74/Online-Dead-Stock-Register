import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AuditRun {
  _id: string;
  scheduled_audit_id: {
    _id: string;
    name: string;
    audit_type: string;
  };
  run_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  total_assets: number;
  audited_count: number;
  assigned_auditors: Array<{ _id: string; name: string; email: string }>;
  completion_percentage: number;
  started_at?: string;
  completed_at?: string;
}

interface AuditRunDashboardProps {
  onSelectRun?: (run: AuditRun) => void;
}

const AuditRunDashboard: React.FC<AuditRunDashboardProps> = ({ onSelectRun }) => {
  const [auditRuns, setAuditRuns] = useState<AuditRun[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchAuditRuns();
  }, [filter]);

  const fetchAuditRuns = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = { limit: 100 };
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await axios.get('http://localhost:5000/api/scheduled-audits/runs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setAuditRuns(response.data.audit_runs || []);
      
      // Calculate stats
      const runs = response.data.audit_runs || [];
      setStats({
        total: runs.length,
        pending: runs.filter((r: AuditRun) => r.status === 'pending').length,
        in_progress: runs.filter((r: AuditRun) => r.status === 'in_progress').length,
        completed: runs.filter((r: AuditRun) => r.status === 'completed').length,
        overdue: runs.filter((r: AuditRun) => r.status === 'overdue').length
      });
    } catch (error) {
      console.error('Error fetching audit runs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      in_progress: '#2196F3',
      completed: '#4CAF50',
      overdue: '#F44336'
    };
    return colors[status] || '#999';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      pending: '⏳',
      in_progress: '▶️',
      completed: '✅',
      overdue: '⚠️'
    };
    return icons[status] || '❓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTimeElapsed = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="audit-run-dashboard">
      <div className="dashboard-header">
        <h2>📊 Audit Runs Dashboard</h2>
        <button className="refresh-btn" onClick={fetchAuditRuns}>
          🔄 Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card total" onClick={() => setFilter('all')}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Runs</div>
          </div>
        </div>

        <div className="stat-card pending" onClick={() => setFilter('pending')}>
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="stat-card in-progress" onClick={() => setFilter('in_progress')}>
          <div className="stat-icon">▶️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.in_progress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card completed" onClick={() => setFilter('completed')}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card overdue" onClick={() => setFilter('overdue')}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Runs
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-tab ${filter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`filter-tab ${filter === 'overdue' ? 'active' : ''}`}
          onClick={() => setFilter('overdue')}
        >
          Overdue
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading audit runs...</div>
      ) : auditRuns.length === 0 ? (
        <div className="no-runs">
          <p>No audit runs found for the selected filter</p>
        </div>
      ) : (
        <div className="runs-grid">
          {auditRuns.map(run => (
            <div
              key={run._id}
              className="run-card"
              onClick={() => onSelectRun && onSelectRun(run)}
            >
              <div className="run-header">
                <div className="run-title">
                  <h3>{run.scheduled_audit_id.name}</h3>
                  <span 
                    className="status-badge"
                    style={{ background: getStatusColor(run.status) }}
                  >
                    {getStatusIcon(run.status)} {run.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="run-date">{formatDate(run.run_date)}</div>
              </div>

              <div className="run-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span className="progress-text">
                    {run.audited_count} / {run.total_assets} assets
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${run.completion_percentage}%`,
                      background: getStatusColor(run.status)
                    }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {run.completion_percentage.toFixed(1)}% Complete
                </div>
              </div>

              <div className="run-meta">
                <div className="meta-item">
                  <span className="meta-label">Type:</span>
                  <span className="meta-value">{run.scheduled_audit_id.audit_type}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Auditors:</span>
                  <span className="meta-value">{run.assigned_auditors.length}</span>
                </div>
                {run.started_at && (
                  <div className="meta-item">
                    <span className="meta-label">Duration:</span>
                    <span className="meta-value">
                      {run.completed_at 
                        ? calculateTimeElapsed(run.started_at)
                        : calculateTimeElapsed(run.started_at) + ' (ongoing)'
                      }
                    </span>
                  </div>
                )}
              </div>

              {run.assigned_auditors.length > 0 && (
                <div className="run-auditors">
                  <div className="auditors-label">Assigned to:</div>
                  <div className="auditors-list">
                    {run.assigned_auditors.slice(0, 3).map(auditor => (
                      <div key={auditor._id} className="auditor-chip" title={auditor.email}>
                        {auditor.name}
                      </div>
                    ))}
                    {run.assigned_auditors.length > 3 && (
                      <div className="auditor-chip more">
                        +{run.assigned_auditors.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .audit-run-dashboard {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .dashboard-header h2 {
          margin: 0;
          font-size: 28px;
          color: #333;
          font-weight: 700;
        }

        .refresh-btn {
          padding: 10px 20px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.3s;
        }

        .refresh-btn:hover {
          background: #1976D2;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s;
          color: white;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        .stat-card.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stat-card.pending {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-card.in-progress {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-card.completed {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .stat-card.overdue {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .stat-icon {
          font-size: 36px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .filter-tab {
          padding: 10px 20px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .filter-tab:hover {
          border-color: #2196F3;
          color: #2196F3;
        }

        .filter-tab.active {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: #999;
          font-size: 16px;
        }

        .no-runs {
          text-align: center;
          padding: 60px 20px;
          background: #fafafa;
          border: 2px dashed #ddd;
          border-radius: 8px;
        }

        .no-runs p {
          margin: 0;
          color: #999;
          font-size: 16px;
        }

        .runs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }

        .run-card {
          background: #fafafa;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .run-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          transform: translateY(-4px);
          border-color: #2196F3;
        }

        .run-header {
          margin-bottom: 16px;
        }

        .run-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .run-title h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
          flex: 1;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .run-date {
          font-size: 13px;
          color: #666;
        }

        .run-progress {
          margin-bottom: 16px;
          padding: 16px;
          background: white;
          border-radius: 8px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 13px;
          color: #666;
          font-weight: 600;
        }

        .progress-text {
          color: #333;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s;
          border-radius: 6px;
        }

        .progress-percentage {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          color: #333;
        }

        .run-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-value {
          font-size: 14px;
          color: #333;
          font-weight: 600;
        }

        .run-auditors {
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }

        .auditors-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .auditors-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .auditor-chip {
          padding: 6px 12px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 16px;
          font-size: 12px;
          color: #333;
          font-weight: 500;
        }

        .auditor-chip.more {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }

        @media (max-width: 768px) {
          .audit-run-dashboard {
            padding: 16px;
          }

          .dashboard-header h2 {
            font-size: 22px;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }

          .stat-card {
            padding: 16px;
          }

          .stat-icon {
            font-size: 28px;
          }

          .stat-value {
            font-size: 24px;
          }

          .stat-label {
            font-size: 12px;
          }

          .runs-grid {
            grid-template-columns: 1fr;
          }

          .run-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditRunDashboard;
