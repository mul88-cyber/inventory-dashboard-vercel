import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const menuItems = [
  { path: '/', name: '📈 Forecast Accuracy', icon: '🎯' },
  { path: '/inventory', name: '📦 Inventory Analysis', icon: '📊' },
  { path: '/forecast', name: '🎯 Forecast Performance', icon: '📈' },
  { path: '/financial', name: '💰 Financial & Profitability', icon: '💵' },
  { path: '/sku-analysis', name: '🔍 SKU 360 Analysis', icon: '🔬' },
  { path: '/ecommerce-forecast', name: '🛒 Ecommerce Forecast', icon: '📊' },
  { path: '/reseller', name: '🤝 Reseller Performance', icon: '👥' },
  { path: '/fulfillment', name: '🚚 Fulfillment Cost', icon: '💰' },
  { path: '/data-explorer', name: '📋 Data Explorer', icon: '🗄️' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '70px',
        backgroundColor: '#1F2937',
        color: 'white',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 50
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #374151', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              {sidebarOpen ? 'Inventory Pro' : '📊'}
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>
        
        <nav>
          {menuItems.map((item) => (
            <Link href={item.path} key={item.path}>
              <div style={{
                padding: '0.75rem 1rem',
                margin: '0.25rem 0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                backgroundColor: router.pathname === item.path ? '#374151' : 'transparent',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: sidebarOpen ? '280px' : '70px',
        flex: 1,
        transition: 'margin-left 0.3s',
        width: '100%'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          padding: '1rem 2rem',
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                {menuItems.find(m => m.path === router.pathname)?.name || 'Dashboard'}
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
                Last updated: {new Date().toLocaleString('id-ID')}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
