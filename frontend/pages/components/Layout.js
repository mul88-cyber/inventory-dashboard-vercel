import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const NAV = [
  { path: '/',                    label: 'Forecast Accuracy',       icon: '🎯' },
  { path: '/inventory',           label: 'Inventory Analysis',       icon: '📦' },
  { path: '/forecast',            label: 'Forecast Performance',     icon: '📈' },
  { path: '/financial',           label: 'Financial & Margin',       icon: '💰' },
  { path: '/sku-analysis',        label: 'SKU 360° Analysis',        icon: '🔍' },
  { path: '/ecommerce-forecast',  label: 'Ecommerce Forecast',       icon: '🛒' },
  { path: '/reseller',            label: 'Reseller Performance',     icon: '🤝' },
  { path: '/fulfillment',         label: 'Fulfillment Cost',         icon: '🚚' },
  { path: '/data-explorer',       label: 'Data Explorer',            icon: '🗄️' },
];

export default function Layout({ children, lastUpdated, onRefresh, loading }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState('');

  useEffect(() => {
    setNow(new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }));
  }, []);

  const activeItem = NAV.find(n => n.path === router.pathname);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --sidebar-w: 260px;
          --sidebar-collapsed: 64px;
          --bg-base: #0a0f1e;
          --bg-surface: #111827;
          --bg-card: #1a2235;
          --border: rgba(255,255,255,0.07);
          --accent: #6366f1;
          --accent-glow: rgba(99,102,241,0.25);
          --teal: #14b8a6;
          --amber: #f59e0b;
          --red: #ef4444;
          --green: #10b981;
          --text-primary: #f1f5f9;
          --text-muted: #64748b;
          --text-dim: #334155;
          --transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }

        html, body { font-family: 'DM Sans', sans-serif; background: var(--bg-base); color: var(--text-primary); min-height: 100vh; }

        /* ── SIDEBAR ── */
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: var(--sidebar-w);
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          transition: var(--transition);
          z-index: 100;
          overflow: hidden;
        }
        .sidebar.collapsed { width: var(--sidebar-collapsed); }

        .sidebar-header {
          padding: 20px 16px 16px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .brand {
          display: flex; align-items: center; gap: 10px; overflow: hidden;
          text-decoration: none;
        }
        .brand-icon {
          width: 32px; height: 32px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent), #8b5cf6);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .brand-text {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px; font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          opacity: 1; transition: opacity 0.2s;
        }
        .sidebar.collapsed .brand-text { opacity: 0; pointer-events: none; }

        .collapse-btn {
          background: none; border: 1px solid var(--border);
          color: var(--text-muted); cursor: pointer;
          width: 28px; height: 28px;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0;
          transition: var(--transition);
        }
        .collapse-btn:hover { background: var(--border); color: var(--text-primary); }

        /* Nav items */
        .nav { padding: 12px 8px; flex: 1; overflow-y: auto; overflow-x: hidden; }
        .nav::-webkit-scrollbar { width: 4px; }
        .nav::-webkit-scrollbar-track { background: transparent; }
        .nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        .nav-label {
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 1.5px; color: var(--text-dim);
          padding: 4px 8px 8px;
          opacity: 1; transition: opacity 0.2s;
          white-space: nowrap;
        }
        .sidebar.collapsed .nav-label { opacity: 0; }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px;
          cursor: pointer; text-decoration: none;
          color: var(--text-muted);
          transition: var(--transition);
          white-space: nowrap;
          margin-bottom: 2px;
          position: relative;
        }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .nav-item.active {
          background: var(--accent-glow);
          color: #a5b4fc;
          box-shadow: inset 2px 0 0 var(--accent);
        }
        .nav-icon { font-size: 17px; flex-shrink: 0; width: 24px; text-align: center; }
        .nav-text { font-size: 13px; font-weight: 500; opacity: 1; transition: opacity 0.2s; }
        .sidebar.collapsed .nav-text { opacity: 0; pointer-events: none; }

        /* Sidebar footer */
        .sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        /* ── MAIN ── */
        .main-wrap {
          margin-left: var(--sidebar-w);
          transition: margin-left 0.25s cubic-bezier(0.4,0,0.2,1);
          min-height: 100vh;
          display: flex; flex-direction: column;
        }
        .main-wrap.collapsed { margin-left: var(--sidebar-collapsed); }

        /* Top bar */
        .topbar {
          position: sticky; top: 0; z-index: 50;
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 0 24px;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
        }

        .topbar-left { display: flex; flex-direction: column; }
        .page-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px; font-weight: 700; color: var(--text-primary);
          line-height: 1.2;
        }
        .page-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

        .topbar-right { display: flex; align-items: center; gap: 10px; }

        .refresh-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          background: var(--accent); border: none;
          color: white; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: var(--transition);
          font-family: 'DM Sans', sans-serif;
        }
        .refresh-btn:hover { background: #4f46e5; transform: translateY(-1px); }
        .refresh-btn:active { transform: translateY(0); }
        .refresh-btn.spinning .spin-icon { animation: spin 1s linear infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { display: inline-block; }

        .status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Page content */
        .page-content { padding: 24px; flex: 1; }

        /* ── CARD SYSTEM ── */
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: var(--transition);
        }
        .card:hover { border-color: rgba(255,255,255,0.12); }
        .card-pad { padding: 20px; }

        /* Loading overlay */
        .loading-bar {
          position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--accent), var(--teal));
          z-index: 999;
          animation: loading-anim 1.2s ease-in-out infinite;
        }
        @keyframes loading-anim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.mobile-open { transform: translateX(0); }
          .main-wrap { margin-left: 0 !important; }
        }
      `}</style>

      {loading && <div className="loading-bar" />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <a href="/" className="brand">
            <div className="brand-icon">📊</div>
            <span className="brand-text">Inventory Pro</span>
          </a>
          <button className="collapse-btn" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="nav">
          <div className="nav-label">Navigation</div>
          {NAV.map(item => (
            <Link href={item.path} key={item.path} passHref legacyBehavior>
              <a className={`nav-item ${router.pathname === item.path ? 'active' : ''}`} title={collapsed ? item.label : ''}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </a>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" style={{ cursor: 'default' }}>
            <span className="nav-icon">🕐</span>
            <span className="nav-text" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{now}</span>
          </div>
        </div>
      </aside>

      <div className={`main-wrap ${collapsed ? 'collapsed' : ''}`}>
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-title">
              {activeItem?.icon} {activeItem?.label || 'Dashboard'}
            </div>
            <div className="page-sub">
              <span className="status-dot" style={{ display: 'inline-block', marginRight: 6 }} />
              Live · Updated {lastUpdated || now}
            </div>
          </div>

          <div className="topbar-right">
            <button className={`refresh-btn ${loading ? 'spinning' : ''}`} onClick={onRefresh}>
              <span className="spin-icon">🔄</span>
              Refresh
            </button>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </>
  );
}
