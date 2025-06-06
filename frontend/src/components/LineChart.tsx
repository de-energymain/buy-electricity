import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

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

interface ChartData {
  time: string;
  value: number;
}

interface LineChartProps {
  data: ChartData[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.time),
    datasets: [
      {
        label: 'Energy Generated (kWh)',
        data: data.map(item => item.value),
        borderColor: '#E9423A', 
        backgroundColor: 'rgba(233, 66, 58, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: '#E9423A',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1A1A1A',
        titleColor: '#FFFFFF',
        bodyColor: '#E0E0E0',
        borderColor: '#333333',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            return ` ${context.parsed.y.toFixed(2)} kWh`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#A0A0A0',
        },
      },
      y: {
        grid: {
          color: '#2A2A2A',
        },
        ticks: {
          color: '#A0A0A0',
          callback: (value: any) => `${value} kWh`,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default LineChart;