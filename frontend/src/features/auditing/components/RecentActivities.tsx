import {
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import type { AuditActivity } from '../../../types';

interface RecentActivitiesProps {
  activities: AuditActivity[];
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'audit_completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'discrepancy_found':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case 'asset_missing':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'compliance_check':
        return <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <ClipboardDocumentListIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 text-red-700 border border-red-105';
      case 'high': return 'bg-amber-50 text-amber-705 border border-amber-100';
      case 'medium': return 'bg-blue-50 text-blue-700 border border-blue-105';
      case 'low': return 'bg-green-50 text-green-700 border border-green-105';
      default: return 'bg-slate-50 text-slate-705 border border-slate-105';
    }
  };

  const getBorderColorClass = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-amber-500';
      case 'medium': return 'border-l-blue-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-slate-300';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 font-semibold text-xs">
        No recent activities
      </div>
    );
  }

  return (
    <ul className="max-h-[400px] overflow-y-auto space-y-2.5 text-xs text-slate-655 font-semibold">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className={`flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-card border-l-[3px] ${getBorderColorClass(activity.priority)}`}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-slate-905 font-bold font-display">{activity.title}</h4>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${getPriorityBadgeClass(activity.priority)}`}>
                {activity.priority.toUpperCase()}
              </span>
            </div>

            <p className="text-slate-655 font-normal text-[11px] leading-relaxed">{activity.description}</p>
            
            <div className="flex gap-3 text-[10px] text-slate-400 font-normal">
              <span>Asset ID: <span className="font-mono">{activity.asset_id}</span></span>
              <span>Location: {activity.location}</span>
              <span>
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default RecentActivities;
