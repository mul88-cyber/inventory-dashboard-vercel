import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';

export default function Inventory() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await axios.get('/api/sheets/all-data');
      if (res.data.success) {
        setStockData(res.data.data.Stock_Onhand || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalStock = stockData.reduce((sum, item) => sum + (Number(item.Qty_Available) || 0), 0);
  const lowStock = stockData.filter(item => (Number(item.Qty_Available) || 0) < 100).length;
  const highStock = stockData.filter(item => (Number(item.Qty_Available) || 0) > 1000).length;

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #3B82F6' }}>
          <p style={{ color: '#6B7280' }}>Total Stock</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{totalStock.toLocaleString()}</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>units</p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #EF4444' }}>
          <p style={{ color: '#6B7280' }}>Low Stock SKUs</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#EF4444' }}>{lowStock}</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>need replenishment</p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #F59E0B' }}>
          <p style={{ color: '#6B7280' }}>High Stock SKUs</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#F59E0B' }}>{highStock}</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>overstock risk</p>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', borderLeft: '4px solid #10B981' }}>
          <p style={{ color: '#6B7280' }}>Healthy SKUs</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stockData.length - lowStock - highStock}</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>optimal stock</p>
        </div>
      </div>

      {/* Stock Table */}
      <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>📦 Stock Detail</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#F9FAFB' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>SKU ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Product Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Qty Available</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((item, idx) => {
                const qty = Number(item.Qty_Available) || 0;
                const status = qty > 1000 ? 'High' : qty > 100 ? 'Normal' : 'Low';
                const statusColor = qty > 1000 ? '#FEF3C7' : qty > 100 ? '#D1FAE5' : '#FEE2E2';
                const textColor = qty > 1000 ? '#92400E' : qty > 100 ? '#065F46' : '#991B1B';
                
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.75rem' }}>{item.SKU_ID}</td>
                    <td style={{ padding: '0.75rem' }}>{item.Product_Name || '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{qty.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: statusColor, color: textColor, fontSize: '0.75rem' }}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
