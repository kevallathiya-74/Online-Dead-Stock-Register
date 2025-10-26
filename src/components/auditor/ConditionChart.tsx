import React from 'react';
import { Box } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData } from '../../types';

// Register ChartJS components
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
    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Doughnut options={options} data={data} />
    </Box>
  );
};

export default ConditionChart;
