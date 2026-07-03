import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import auditorService from '../services/auditorService';
import type { ComplianceMetrics } from '../../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CompliancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceMetrics();
  }, []);

  const fetchComplianceMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditorService.getComplianceMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load compliance metrics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-650';
  };

  const getScoreBgClass = (score: number): string => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  const getTrendData = () => {
    if (!metrics || !metrics.trends) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let gradient: any = '#4f46e5';
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
    }

    return {
      labels: metrics.trends.map((t) => {
        const date = new Date(t.date);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Compliance Score',
          data: metrics.trends.map((t) => t.score),
          borderColor: '#4f46e5',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-between font-semibold">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="px-3 py-1 bg-red-650 text-white rounded-lg">Dismiss</button>
        </div>
      </DashboardLayout>
    );
  }

  const trendData = getTrendData();
  const overallTrend =
    metrics && metrics.trends.length > 1
      ? metrics.trends[metrics.trends.length - 1].score - metrics.trends[0].score
      : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-655 max-w-5xl mx-auto">
        
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold font-display text-slate-905">Compliance Metrics</h2>
          <p className="text-slate-455 mt-1">Monitor compliance scores and trends across all categories</p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-card flex flex-col md:flex-row items-center gap-6">
          <div className="text-center md:border-r border-slate-100 md:pr-10">
            <h1 className={`text-6xl font-extrabold font-display ${getScoreColorClass(metrics?.overallScore || 0)}`}>
              {metrics?.overallScore || 0}
            </h1>
            <p className="text-slate-400 uppercase font-bold text-[9px] mt-1.5">Overall Compliance Score</p>
            <p className="font-bold text-slate-900 mt-0.5 text-xs">{getScoreLabel(metrics?.overallScore || 0)}</p>
          </div>
          
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
              {overallTrend >= 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
              )}
              <span className={`font-bold ${overallTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overallTrend >= 0 ? '+' : ''}{overallTrend.toFixed(1)}%
              </span>
              <span className="text-slate-400 font-medium">over last 12 months</span>
            </div>
            <p className="text-slate-500 leading-relaxed font-semibold">
              Your compliance score represents how well your assets meet audit standards,
              documentation requirements, and condition expectations.
            </p>
          </div>
        </div>

        {/* Category Scores */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-905 font-display">Category Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics &&
              Object.entries(metrics.categoryScores).map(([category, score]) => (
                <div key={category} className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {score >= 80 ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                      )}
                      <div>
                        <h4 className="font-bold text-slate-905 text-xs">{category}</h4>
                        <p className="text-[10px] text-slate-400">{getScoreLabel(score)}</p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColorClass(score)} font-display`}>
                      {score}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getScoreBgClass(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-card space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-905 font-display">Compliance Trend (Last 12 Months)</h3>
            <p className="text-slate-405 mt-0.5">Track how your compliance score has changed over time</p>
          </div>
          <div className="h-64 pt-2">
            {trendData && <Line options={chartOptions} data={trendData} />}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-105 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-blue-900 text-xs">Strategic Recommendations</h3>
          <ul className="list-disc pl-4 space-y-1.5 text-blue-800 font-semibold">
            {metrics && metrics.overallScore < 80 ? (
              <>
                <li>Focus on categories with scores below 80% to improve overall compliance</li>
                <li>Ensure all assets are audited at least once per year</li>
                <li>Update asset documentation and verify location accuracy</li>
              </>
            ) : (
              <>
                <li>Maintain regular audit schedules to sustain high compliance</li>
                <li>Continue monitoring asset conditions and addressing issues promptly</li>
                <li>Share best practices with your team to keep scores high</li>
              </>
            )}
          </ul>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CompliancePage;
