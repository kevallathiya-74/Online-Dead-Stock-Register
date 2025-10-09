import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Box, Card, CardContent, Typography } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  title: string;
  type: 'line' | 'bar' | 'doughnut';
  data: {
    labels: string[];
    datasets: Array<{
      label?: string;
      data: number[];
      borderColor?: string | string[];
      backgroundColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  height?: number;
}

const ChartComponent = ({
  title,
  type,
  data,
  height = 300,
}: ChartComponentProps) => {
  const getOptions = (): ChartOptions<any> => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        title: {
          display: false,
        },
      },
    };

    if (type === 'doughnut') {
      return baseOptions;
    }

    return {
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };
  };

  const options = getOptions();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height }}>
          {type === 'line' ? (
            <Line options={options} data={data} />
          ) : type === 'bar' ? (
            <Bar options={options} data={data} />
          ) : (
            <Doughnut options={options} data={data} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartComponent;