import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import dynamic from 'next/dynamic';

// Dynamic imports for charts (reduce initial load)
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/sheets/all-data');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  // Process forecast accuracy data
  const forecastData = data?.Rofo || [];
  const poData = data?.PO || [];
  
  // Combine forecast and PO for chart
  const chartData = forecastData.slice(0, 12).map((item, idx) => ({
    month: item.Month || `Month ${idx + 1}`,
    forecast: Number(item.Forecast_Qty) || 0,
    actual: poData[idx] ? Number(poData[idx].PO_Qty) || 0 : 0
  }));

  const totalForecast = chartData.reduce((sum, d) => sum + d.forecast, 0);
  const totalActual = chartData.reduce((sum, d) => sum + d.actual, 0);
  const accuracy = totalForecast > 0 ? (totalActual / totalForecast * 100).toFixed(1) : 0;

  return (
    <Layout>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #3B82F6' }}>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Total Forecast</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{totalForecast.toLocaleString()}</p>
          <p style={{ color: '#10B981', fontSize: '0.875rem' }}>units</p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #10B981' }}>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Total Actual (PO)</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{totalActual.toLocaleString()}</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>units</p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #F59E0B' }}>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Forecast Accuracy</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{accuracy}%</p>
          <p style={{ color: accuracy > 80 ? '#10B981' : '#EF4444', fontSize: '0.875rem' }}>
            {accuracy > 80 ? '✓ Good' : '⚠️ Need Improvement'}
          </p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #8B5CF6' }}>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Active SKUs</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{data?.Product_Master?.length || 0}</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>products</p>
        </div>
      </div>

      {/* Accuracy Trend Chart */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>📈 Forecast vs Actual Trend</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="forecast" fill="#8884D8" name="Forecast" />
            <Bar dataKey="actual" fill="#82CA9D" name="Actual PO" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Under/Over Forecast Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#EF4444' }}>📉 Under Forecast SKUs</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>SKU</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Forecast</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Actual</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Gap</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.slice(0, 10).map((item, idx) => {
                  const forecast = Number(item.Forecast_Qty) || 0;
                  const actual = Number(poData[idx]?.PO_Qty) || 0;
                  const gap = actual - forecast;
                  if (gap < -100) return null;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0.5rem' }}>{item.SKU_ID}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{forecast.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{actual.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', color: '#EF4444' }}>{gap.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#F59E0B' }}>📈 Over Forecast SKUs</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>SKU</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Forecast</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Actual</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Gap</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.slice(0, 10).map((item, idx) => {
                  const forecast = Number(item.Forecast_Qty) || 0;
                  const actual = Number(poData[idx]?.PO_Qty) || 0;
                  const gap = actual - forecast;
                  if (gap < 0) return null;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0.5rem' }}>{item.SKU_ID}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{forecast.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{actual.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', color: '#F59E0B' }}>+{gap.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
