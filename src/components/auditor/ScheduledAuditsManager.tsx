import React, { useState } from 'react';
import AuditCalendar from './AuditCalendar';
import ScheduleAuditForm from './ScheduleAuditForm';
import AuditRunDashboard from './AuditRunDashboard';

interface ScheduledAuditsManagerProps {
  initialView?: 'calendar' | 'schedule' | 'dashboard';
}

const ScheduledAuditsManager: React.FC<ScheduledAuditsManagerProps> = ({
  initialView = 'calendar'
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'schedule' | 'dashboard'>(initialView);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setSelectedAudit(null);
    setShowScheduleForm(true);
  };

  const handleSelectAudit = (audit: any) => {
    setSelectedAudit(audit);
    setShowScheduleForm(true);
  };

  const handleFormSuccess = () => {
    setShowScheduleForm(false);
    setSelectedAudit(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowScheduleForm(false);
    setSelectedAudit(null);
  };

  if (showScheduleForm) {
    return (
      <div className="scheduled-audits-manager">
        <ScheduleAuditForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          editingAudit={selectedAudit}
        />
        <style>{managerStyles}</style>
      </div>
    );
  }

  return (
    <div className="scheduled-audits-manager">
      <div className="manager-header">
        <div className="header-content">
          <h1>📅 Scheduled Audits Management</h1>
          <p className="header-description">
            Schedule recurring audits, track progress, and manage audit runs
          </p>
        </div>
        
        <button className="create-audit-btn" onClick={handleCreateNew}>
          ➕ Schedule New Audit
        </button>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">Calendar View</span>
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Audit Runs</span>
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'calendar' && (
          <div key={refreshKey}>
            <AuditCalendar
              onSelectAudit={handleSelectAudit}
              onCreateNew={handleCreateNew}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div key={refreshKey}>
            <AuditRunDashboard
              onSelectRun={(run) => console.log('Selected run:', run)}
            />
          </div>
        )}
      </div>

      <div className="info-panel">
        <div className="info-section">
          <h3>🎯 Quick Guide</h3>
          <ul>
            <li><strong>Calendar View:</strong> See all scheduled audits on a visual calendar</li>
            <li><strong>Audit Runs:</strong> Track active and completed audit executions</li>
            <li><strong>Schedule New:</strong> Create recurring audits with custom rules</li>
            <li><strong>Reminders:</strong> Automatic email and notification reminders before audits</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>📋 Recurrence Types</h3>
          <div className="recurrence-legend">
            <div className="legend-item">
              <span className="legend-icon">⚪</span>
              <span>Once - One-time audit</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🔵</span>
              <span>Daily - Every day</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🟢</span>
              <span>Weekly - Every week</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🟠</span>
              <span>Monthly - Every month</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🟣</span>
              <span>Quarterly - Every 3 months</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🔴</span>
              <span>Yearly - Every year</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>✨ Key Features</h3>
          <ul>
            <li>✅ Multi-step audit configuration wizard</li>
            <li>✅ Flexible scope (all, department, location, category)</li>
            <li>✅ Custom checklist templates</li>
            <li>✅ Auto-assign auditors by department</li>
            <li>✅ Email and in-app reminders</li>
            <li>✅ Progress tracking dashboard</li>
            <li>✅ Audit completion analytics</li>
          </ul>
        </div>
      </div>

      <style>{managerStyles}</style>
    </div>
  );
};

const managerStyles = `
  .scheduled-audits-manager {
    padding: 20px;
    max-width: 1600px;
    margin: 0 auto;
    min-height: 100vh;
    background: #f5f5f5;
  }

  .manager-header {
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .header-content h1 {
    margin: 0 0 10px 0;
    font-size: 32px;
    color: #333;
    font-weight: 700;
  }

  .header-description {
    margin: 0;
    color: #666;
    font-size: 16px;
    line-height: 1.5;
  }

  .create-audit-btn {
    padding: 14px 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    white-space: nowrap;
  }

  .create-audit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .tab-navigation {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    background: white;
    border-radius: 12px;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .tab-btn {
    flex: 1;
    padding: 16px 24px;
    background: none;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    color: #666;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 500;
  }

  .tab-btn:hover {
    background: #f5f5f5;
    color: #333;
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .tab-icon {
    font-size: 24px;
  }

  .tab-label {
    font-size: 16px;
  }

  .tab-content {
    margin-bottom: 30px;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .info-panel {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-section h3 {
    margin: 0;
    font-size: 20px;
    color: #333;
    font-weight: 700;
  }

  .info-section ul {
    margin: 0;
    padding-left: 20px;
    list-style: none;
  }

  .info-section li {
    margin-bottom: 12px;
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    position: relative;
    padding-left: 8px;
  }

  .info-section li::before {
    content: "•";
    position: absolute;
    left: -12px;
    color: #2196F3;
    font-weight: bold;
  }

  .info-section strong {
    color: #333;
  }

  .recurrence-legend {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #f9f9f9;
    border-radius: 8px;
    font-size: 14px;
    color: #666;
  }

  .legend-icon {
    font-size: 20px;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .scheduled-audits-manager {
      padding: 15px;
    }

    .manager-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px;
    }

    .create-audit-btn {
      width: 100%;
    }

    .info-panel {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .header-content h1 {
      font-size: 24px;
    }

    .header-description {
      font-size: 14px;
    }

    .tab-navigation {
      flex-direction: column;
      gap: 8px;
    }

    .tab-btn {
      padding: 14px 20px;
    }

    .tab-icon {
      font-size: 20px;
    }

    .tab-label {
      font-size: 14px;
    }

    .info-panel {
      padding: 20px;
    }

    .info-section h3 {
      font-size: 18px;
    }
  }

  @media (max-width: 480px) {
    .scheduled-audits-manager {
      padding: 10px;
    }

    .manager-header {
      padding: 15px;
    }

    .header-content h1 {
      font-size: 20px;
    }

    .create-audit-btn {
      padding: 12px 20px;
      font-size: 14px;
    }
  }

  /* Print Styles */
  @media print {
    .manager-header,
    .tab-navigation,
    .create-audit-btn,
    .info-panel {
      display: none;
    }

    .scheduled-audits-manager {
      background: white;
    }

    .tab-content {
      margin-bottom: 0;
    }
  }
`;

export default ScheduledAuditsManager;
