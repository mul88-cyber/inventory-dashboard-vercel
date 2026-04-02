import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { format } from 'date-fns';

interface DashboardData {
  productMaster: any[];
  sales: any[];
  forecast: any[];
  po: any[];
  stock: any[];
  metrics: {
    totalStock: number;
    totalSKUs: number;
    avgAccuracy: number;
    totalRevenue: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sheets/all-data');
      
      if (response.data.success) {
        const rawData = response.data.data;
        
        // Process data for dashboard
        const processedData: DashboardData = {
          productMaster: rawData.Product_Master || [],
          sales: rawData.Sales || [],
          forecast: rawData.Rofo || [],
          po: rawData.PO || [],
          stock: rawData.Stock_Onhand || [],
          metrics: calculateMetrics(rawData)
        };
        
        setData(processedData);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (rawData: any) => {
    // Calculate total stock
    const stockData = rawData.Stock_Onhand || [];
    const totalStock = stockData.reduce((sum: number, item: any) => 
      sum + (Number(item.Qty_Available) || 0), 0);
    
    // Calculate total SKUs
    const productData = rawData.Product_Master || [];
    const totalSKUs = productData.length;
    
    // Calculate average forecast accuracy (simplified)
    const forecastData = rawData.Rofo || [];
    const poData = rawData.PO || [];
    let accuracySum = 0;
    let accuracyCount = 0;
    
    // Your accuracy calculation logic here
    
    return {
      totalStock,
      totalSKUs,
      avgAccuracy: 85.5, // Example
      totalRevenue: 1250000000 // Example
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button 
            onClick={() => fetchAllData()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📊 Inventory Intelligence Pro
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time analytics & inventory control | Last updated: {format(new Date(), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Stock</p>
            <p className="text-2xl font-bold">{data?.metrics.totalStock.toLocaleString()}</p>
            <p className="text-green-600 text-sm">units</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Active SKUs</p>
            <p className="text-2xl font-bold">{data?.metrics.totalSKUs.toLocaleString()}</p>
            <p className="text-gray-600 text-sm">products</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Forecast Accuracy</p>
            <p className="text-2xl font-bold">{data?.metrics.avgAccuracy}%</p>
            <p className="text-green-600 text-sm">↑ 5.2% from last month</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Total Revenue (YTD)</p>
            <p className="text-2xl font-bold">Rp {(data?.metrics.totalRevenue || 0) / 1e6}M</p>
            <p className="text-green-600 text-sm">↑ 12.3% growth</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">📈 Sales Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.sales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Sales_Qty" stroke="#3B82F6" name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Accuracy Chart */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">🎯 Forecast Accuracy</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.forecast || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Forecast_Qty" fill="#8884d8" name="Forecast" />
                <Bar dataKey="PO_Qty" fill="#82ca9d" name="Actual PO" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Analysis Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">📦 Stock Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data?.stock || []).slice(0, 10).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.SKU_ID}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.Product_Name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {Number(item.Qty_Available).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        Number(item.Qty_Available) > 1000 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : Number(item.Qty_Available) > 100
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Number(item.Qty_Available) > 1000 ? 'High Stock' : 
                         Number(item.Qty_Available) > 100 ? 'Normal' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
