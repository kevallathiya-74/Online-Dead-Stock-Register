import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ScheduledAudit {
  _id: string;
  name: string;
  description: string;
  recurrence_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  next_run_date: string;
  last_run_date?: string;
  audit_type: string;
  scope_type: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  assigned_auditors: Array<{ _id: string; name: string; email: string }>;
}

interface AuditCalendarProps {
  onSelectAudit?: (audit: ScheduledAudit) => void;
  onCreateNew?: () => void;
}

const AuditCalendar: React.FC<AuditCalendarProps> = ({ onSelectAudit, onCreateNew }) => {
  const [audits, setAudits] = useState<ScheduledAudit[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/scheduled-audits', {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'active', limit: 100 }
      });
      setAudits(response.data.scheduled_audits);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAuditsForDate = (date: Date) => {
    if (!date) return [];
    
    return audits.filter(audit => {
      const nextRunDate = new Date(audit.next_run_date);
      return (
        nextRunDate.getDate() === date.getDate() &&
        nextRunDate.getMonth() === date.getMonth() &&
        nextRunDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getRecurrenceColor = (recurrence: string) => {
    const colors: { [key: string]: string } = {
      once: '#9E9E9E',
      daily: '#2196F3',
      weekly: '#4CAF50',
      monthly: '#FF9800',
      quarterly: '#9C27B0',
      yearly: '#F44336'
    };
    return colors[recurrence] || '#666';
  };

  const getRecurrenceIcon = (recurrence: string) => {
    const icons: { [key: string]: string } = {
      once: '⚪',
      daily: '🔵',
      weekly: '🟢',
      monthly: '🟠',
      quarterly: '🟣',
      yearly: '🔴'
    };
    return icons[recurrence] || '⚫';
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="calendar-month-view">
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days-grid">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="calendar-day empty"></div>;
            }

            const dayAudits = getAuditsForDate(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);

            return (
              <div
                key={index}
                className={`calendar-day ${isTodayDate ? 'today' : ''} ${isSelectedDate ? 'selected' : ''} ${dayAudits.length > 0 ? 'has-audits' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="day-number">{date.getDate()}</div>
                {dayAudits.length > 0 && (
                  <div className="day-audits">
                    {dayAudits.slice(0, 3).map((audit, idx) => (
                      <div
                        key={audit._id}
                        className="audit-indicator"
                        style={{ background: getRecurrenceColor(audit.recurrence_type) }}
                        title={audit.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectAudit) onSelectAudit(audit);
                        }}
                      >
                        <span className="audit-icon">{getRecurrenceIcon(audit.recurrence_type)}</span>
                        <span className="audit-name">{audit.name}</span>
                      </div>
                    ))}
                    {dayAudits.length > 3 && (
                      <div className="more-audits">+{dayAudits.length - 3} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const upcomingAudits = audits
      .filter(audit => new Date(audit.next_run_date) >= new Date())
      .sort((a, b) => new Date(a.next_run_date).getTime() - new Date(b.next_run_date).getTime());

    return (
      <div className="calendar-list-view">
        {upcomingAudits.length === 0 ? (
          <div className="no-audits">
            <p>No upcoming scheduled audits</p>
            <button className="create-btn" onClick={onCreateNew}>
              Create Scheduled Audit
            </button>
          </div>
        ) : (
          <div className="audits-list">
            {upcomingAudits.map(audit => (
              <div
                key={audit._id}
                className="audit-list-item"
                onClick={() => onSelectAudit && onSelectAudit(audit)}
              >
                <div className="audit-list-header">
                  <div className="audit-list-title">
                    <span
                      className="recurrence-badge"
                      style={{ background: getRecurrenceColor(audit.recurrence_type) }}
                    >
                      {getRecurrenceIcon(audit.recurrence_type)} {audit.recurrence_type}
                    </span>
                    <h3>{audit.name}</h3>
                  </div>
                  <div className="audit-list-date">
                    {new Date(audit.next_run_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <p className="audit-list-description">{audit.description}</p>
                <div className="audit-list-meta">
                  <span>Type: {audit.audit_type}</span>
                  <span>Scope: {audit.scope_type}</span>
                  <span>Auditors: {audit.assigned_auditors.length}</span>
                  <span>Runs: {audit.completed_runs}/{audit.total_runs}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="audit-calendar">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button className="nav-btn" onClick={previousMonth}>
            ← Prev
          </button>
          <button className="today-btn" onClick={goToToday}>
            Today
          </button>
          <button className="nav-btn" onClick={nextMonth}>
            Next →
          </button>
        </div>

        <h2 className="calendar-title">{formatMonthYear(currentDate)}</h2>

        <div className="view-controls">
          <button
            className={`view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            📅 Month
          </button>
          <button
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            📋 List
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><span className="legend-dot" style={{ background: '#2196F3' }}></span> Daily</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#4CAF50' }}></span> Weekly</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#FF9800' }}></span> Monthly</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#9C27B0' }}></span> Quarterly</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#F44336' }}></span> Yearly</div>
      </div>

      {isLoading ? (
        <div className="calendar-loading">Loading audits...</div>
      ) : (
        <div className="calendar-content">
          {view === 'month' && renderMonthView()}
          {view === 'list' && renderListView()}
        </div>
      )}

      <style>{`
        .audit-calendar {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .calendar-controls {
          display: flex;
          gap: 10px;
        }

        .nav-btn, .today-btn, .view-btn {
          padding: 10px 20px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .nav-btn:hover, .today-btn:hover, .view-btn:hover {
          border-color: #2196F3;
          color: #2196F3;
        }

        .today-btn {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }

        .today-btn:hover {
          background: #1976D2;
        }

        .calendar-title {
          margin: 0;
          font-size: 28px;
          color: #333;
          font-weight: 700;
        }

        .view-controls {
          display: flex;
          gap: 8px;
        }

        .view-btn.active {
          background: #2196F3;
          color: white;
          border-color: #2196F3;
        }

        .calendar-legend {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 6px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #666;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .calendar-loading {
          text-align: center;
          padding: 60px;
          color: #999;
          font-size: 16px;
        }

        .calendar-month-view {
          margin-top: 20px;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 8px;
        }

        .calendar-weekday {
          text-align: center;
          font-weight: 600;
          color: #666;
          padding: 12px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          min-height: 500px;
        }

        .calendar-day {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 8px;
          min-height: 100px;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
        }

        .calendar-day:hover {
          background: #f9f9f9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .calendar-day.empty {
          background: #fafafa;
          cursor: default;
        }

        .calendar-day.today {
          background: #e3f2fd;
          border-color: #2196F3;
        }

        .calendar-day.selected {
          background: #fff3e0;
          border-color: #FF9800;
        }

        .day-number {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
          font-size: 16px;
        }

        .day-audits {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .audit-indicator {
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 11px;
          color: white;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: opacity 0.3s;
        }

        .audit-indicator:hover {
          opacity: 0.8;
        }

        .audit-icon {
          font-size: 10px;
        }

        .audit-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .more-audits {
          font-size: 11px;
          color: #666;
          font-weight: 500;
          text-align: center;
          padding: 2px;
        }

        .calendar-list-view {
          margin-top: 20px;
        }

        .no-audits {
          text-align: center;
          padding: 60px 20px;
          background: #fafafa;
          border: 2px dashed #ddd;
          border-radius: 8px;
        }

        .no-audits p {
          margin: 0 0 20px 0;
          color: #999;
          font-size: 16px;
        }

        .create-btn {
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: background 0.3s;
        }

        .create-btn:hover {
          background: #45a049;
        }

        .audits-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .audit-list-item {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .audit-list-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .audit-list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .audit-list-title {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .audit-list-title h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .recurrence-badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .audit-list-date {
          font-weight: 600;
          color: #2196F3;
          font-size: 14px;
          white-space: nowrap;
        }

        .audit-list-description {
          margin: 0 0 12px 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }

        .audit-list-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #999;
        }

        .audit-list-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 1024px) {
          .calendar-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .calendar-title {
            font-size: 24px;
          }
        }

        @media (max-width: 768px) {
          .audit-calendar {
            padding: 16px;
          }

          .calendar-days-grid {
            gap: 1px;
            min-height: 400px;
          }

          .calendar-day {
            min-height: 80px;
            padding: 6px;
          }

          .day-number {
            font-size: 14px;
          }

          .audit-indicator {
            font-size: 10px;
            padding: 3px 5px;
          }

          .audit-name {
            display: none;
          }

          .audit-list-header {
            flex-direction: column;
          }

          .audit-list-meta {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuditCalendar;
