import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TemperatureData {
  year: string;
  maxTemp: number;
  minTemp: number;
  maxStation: string;
  minStation: string;
}

const XlsxGraph = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      // Process temperature data
      const years = jsonData[0].slice(1);
      const maxTempRow = jsonData[3];
      const minTempRow = jsonData[7];
      const maxStationRow = jsonData[2];
      const minStationRow = jsonData[6];

      const temperatureData: TemperatureData[] = years.map((year, index) => ({
        year: year.toString(),
        maxTemp: parseFloat(String(maxTempRow[index + 1]).replace(/[^\d.-]/g, '')) || 0,
        minTemp: parseFloat(String(minTempRow[index + 1]).replace(/[^\d.-]/g, '')) || 0,
        maxStation: maxStationRow[index + 1],
        minStation: minStationRow[index + 1]
      }));

      setChartData({
        labels: temperatureData.map(item => item.year),
        datasets: [
          {
            label: 'Maximum Temperature (°C)',
            data: temperatureData.map(item => item.maxTemp),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            stationInfo: temperatureData.map(item => item.maxStation)
          },
          {
            label: 'Minimum Temperature (°C)',
            data: temperatureData.map(item => item.minTemp),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            stationInfo: temperatureData.map(item => item.minStation)
          }
        ]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Temperature Data Visualization</h1>
      <input 
        type="file" 
        accept=".xlsx,.xls" 
        onChange={handleFileUpload}
        disabled={loading}
        style={{ marginBottom: '1rem' }}
      />
      {loading && <p>Loading file...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {chartData && (
        <div style={{ height: '500px', marginTop: '2rem' }}>
          <Bar 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  title: {
                    display: true,
                    text: 'Temperature (°C)'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Year'
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    afterBody: (context) => {
                      const dataIndex = context[0].dataIndex;
                      return [
                        `Max Station: ${chartData.datasets[0].stationInfo[dataIndex]}`,
                        `Min Station: ${chartData.datasets[1].stationInfo[dataIndex]}`
                      ];
                    }
                  }
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default XlsxGraph;