import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    Tooltip,
} from 'chart.js';
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData } from '../../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ConditionChartProps {
  data: ChartData;
}

const ConditionChart: React.FC<ConditionChartProps> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      <Doughnut options={options} data={data} />
    </div>
  );
};

export default ConditionChart;
