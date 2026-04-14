import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';

// Lazy-load Recharts on client only
const ComposedChart = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtNum(n = 0) { return Number(n).toLocaleString('id-ID'); }

function accColor(val) {
  if (val >= 80) return '#10b981';
  if (val >= 70) return '#f59e0b';
  return '#ef4444';
}

// ─── sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, subColor, gradient, icon }) {
  return (
    <div style={{
      background: gradient,
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85, color: '#fff' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.1, fontFamily: "'Space Grotesk',sans-serif" }}>
        {icon && <span style={{ marginRight: 6, fontSize: 20 }}>{icon}</span>}
        {value}
      </div>
      <div style={{ fontSize: 12, color: subColor || 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{sub}</div>
    </div>
  );
}

function MonthCard({ month, accuracy, under, accurate, over, total }) {
  const color = accColor(accuracy);
  return (
    <div style={{
      background: '#1a2235',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderTop: `3px solid ${color}`,
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>{month}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color, fontFamily: "'Space Grotesk',sans-serif" }}>{accuracy.toFixed(1)}%</div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>Overall Hit Rate</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Under', count: under, bg: '#1e1215', fg: '#ef4444' },
          { label: 'On-target', count: accurate, bg: '#0e1a15', fg: '#10b981' },
          { label: 'Over', count: over, bg: '#1a1607', fg: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.fg }}>{s.count}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#334155', textAlign: 'center' }}>Total: {total} SKUs</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 4 }}>
          {p.name}: <strong>{fmtNum(p.value)}{p.name === 'Accuracy' ? '%' : ''}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [rawData, setRawData] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load sheets data
      const sheetsRes = await fetch('/api/sheets/all-data');
      const sheetsJson = await sheetsRes.json();
      if (!sheetsJson.success) throw new Error(sheetsJson.error);

      const sheets = sheetsJson.data;
      setRawData(sheets);

      // 2. Compute monthly performance via backend
      const perfRes = await fetch('/api/analytics/monthly-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forecast: sheets.Rofo || [],
          po: sheets.PO || [],
          product: sheets.Product_Master || [],
        }),
      });
      const perfJson = await perfRes.json();
      if (perfJson.success) setPerformance(perfJson.data || []);

      setLastUpdated(new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derive KPIs ──────────────────────────────────────────────────────────
  const sorted = [...performance].sort((a, b) => new Date(a.month) - new Date(b.month));
  const last3 = sorted.slice(-3);
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const currentAcc = last?.accuracy ?? 0;
  const prevAcc = prev?.accuracy ?? currentAcc;
  const delta = currentAcc - prevAcc;
  const avgAcc = sorted.length ? sorted.reduce((s, m) => s + m.accuracy, 0) / sorted.length : 0;
  const bestMonth = sorted.reduce((best, m) => m.accuracy > (best?.accuracy ?? 0) ? m : best, null);
  const stability = Math.max(0, 100 - (sorted.length > 1 ? Math.sqrt(sorted.reduce((s, m) => s + Math.pow(m.accuracy - avgAcc, 2), 0) / sorted.length) : 0));

  const totalSkus = rawData?.Product_Master?.length ?? 0;
  const totalStock = (rawData?.Stock_Onhand ?? []).reduce((s, r) => s + (Number(r.Qty_Available) || 0), 0);

  // ── chart data ───────────────────────────────────────────────────────────
  const chartData = sorted.map(m => ({
    name: m.month_label,
    Rofo: m.total_forecast,
    PO: m.total_po,
    Accuracy: m.accuracy,
  }));

  // Last-month detail table
  const lastDetail = last?.detail ?? [];
  const underSkus = lastDetail.filter(r => r.status === 'Under').sort((a, b) => a.ratio - b.ratio);
  const overSkus = lastDetail.filter(r => r.status === 'Over').sort((a, b) => b.ratio - a.ratio);

  return (
    <Layout lastUpdated={lastUpdated} onRefresh={fetchData} loading={loading}>
      <style>{`
        .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        @media(max-width:900px){ .grid-4,.grid-3,.grid-2 { grid-template-columns:1fr 1fr; } }
        @media(max-width:600px){ .grid-4,.grid-3,.grid-2 { grid-template-columns:1fr; } }

        .section-title {
          font-family: 'Space Grotesk',sans-serif;
          font-size: 16px; font-weight: 700; color: #f1f5f9;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
        }
        .section-title::after {
          content:''; flex:1; height:1px; background: rgba(255,255,255,0.06);
        }

        .tab-row { display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.07); }
        .tab { padding:8px 16px; border:none; background:none; color:#64748b; font-size:13px; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .tab.active { color:#a5b4fc; border-bottom-color:#6366f1; }
        .tab:hover { color:#cbd5e1; }

        .sku-table { width:100%; border-collapse:collapse; font-size:13px; }
        .sku-table th { padding:10px 12px; background:#111827; color:#64748b; font-weight:600; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
        .sku-table td { padding:9px 12px; border-bottom:1px solid rgba(255,255,255,0.04); color:#cbd5e1; }
        .sku-table tr:hover td { background:rgba(255,255,255,0.02); }

        .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; }
        .badge-red { background:#1e1215; color:#ef4444; }
        .badge-amber { background:#1a1607; color:#f59e0b; }
        .badge-green { background:#0e1a15; color:#10b981; }

        .insight-box {
          background:#1a2235; border:1px solid rgba(255,255,255,0.07);
          border-left:4px solid;
          border-radius:10px; padding:14px 18px;
          display:flex; align-items:flex-start; gap:12px;
          margin-bottom:24px;
        }
        .insight-icon { font-size:20px; flex-shrink:0; }
        .insight-title { font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
        .insight-text { font-size:13px; color:#94a3b8; line-height:1.5; }
      `}</style>

      {/* ── KPI Row 1 ── */}
      <div className="grid-4">
        <KpiCard
          label="Current Accuracy"
          value={`${currentAcc.toFixed(1)}%`}
          sub={`${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}% vs last month`}
          gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
        />
        <KpiCard
          label="YTD Average"
          value={`${avgAcc.toFixed(1)}%`}
          sub={`${avgAcc >= 80 ? '✅ Above target' : '⚠️ Below target'} (80%)`}
          gradient="linear-gradient(135deg, #0891b2 0%, #14b8a6 100%)"
        />
        <KpiCard
          label="Best Month"
          value={`${bestMonth?.accuracy?.toFixed(1) ?? '—'}%`}
          sub={bestMonth?.month_label ?? '—'}
          gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
        />
        <KpiCard
          label="Stability Score"
          value={stability.toFixed(0)}
          sub="Consistency 0–100"
          gradient="linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)"
        />
      </div>

      <div className="grid-4">
        <KpiCard
          label="Active SKUs"
          value={fmtNum(totalSkus)}
          sub="Product Master"
          gradient="linear-gradient(135deg, #334155 0%, #475569 100%)"
        />
        <KpiCard
          label="Total Stock"
          value={fmtNum(totalStock)}
          sub="Units on-hand"
          gradient="linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)"
        />
        <KpiCard
          label="Under Forecast"
          value={fmtNum(last?.under ?? 0)}
          sub={`${last?.month_label ?? '—'}`}
          gradient="linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)"
        />
        <KpiCard
          label="Over Forecast"
          value={fmtNum(last?.over ?? 0)}
          sub={`${last?.month_label ?? '—'}`}
          gradient="linear-gradient(135deg, #78350f 0%, #f59e0b 100%)"
        />
      </div>

      {/* ── Insight Banner ── */}
      {last && (
        <div className="insight-box" style={{ borderLeftColor: accColor(currentAcc) }}>
          <div className="insight-icon">💡</div>
          <div>
            <div className="insight-title" style={{ color: accColor(currentAcc) }}>
              {currentAcc >= 80 ? 'Excellent Performance 🚀' : currentAcc >= 70 ? 'Moderate Performance ⚠️' : 'Critical Attention Needed 🚨'}
            </div>
            <div className="insight-text">
              Accuracy bulan {last.month_label} adalah <strong>{currentAcc.toFixed(1)}%</strong> —{' '}
              {Math.abs(delta) < 2 ? 'stabil dari bulan sebelumnya.' :
                delta > 0 ? `naik ${delta.toFixed(1)}% dari bulan sebelumnya.` :
                  `turun ${Math.abs(delta).toFixed(1)}% dari bulan sebelumnya.`}{' '}
              Total {last.total_skus} SKU dievaluasi: {last.accurate} accurate, {last.under} under, {last.over} over.
            </div>
          </div>
        </div>
      )}

      {/* ── Trend Chart ── */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div className="section-title">📊 Forecast Accuracy Trend</div>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 16, color: '#94a3b8', fontSize: 13 }} />
              <Bar yAxisId="left" dataKey="Rofo" name="Forecast" fill="#6366f1" opacity={0.6} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="PO" name="PO" fill="#14b8a6" opacity={0.6} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Accuracy" name="Accuracy" stroke="#f59e0b" strokeWidth={3}
                dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#111827' }} activeDot={{ r: 8 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
            {loading ? 'Loading chart data...' : 'No performance data available'}
          </div>
        )}
      </div>

      {/* ── Last 3 Months ── */}
      {last3.length > 0 && (
        <>
          <div className="section-title">🎯 3 Bulan Terakhir</div>
          <div className="grid-3">
            {last3.map(m => (
              <MonthCard key={m.month} month={m.month_label} accuracy={m.accuracy}
                under={m.under} accurate={m.accurate} over={m.over} total={m.total_skus} />
            ))}
          </div>
        </>
      )}

      {/* ── Under / Over Tables ── */}
      {last && (
        <div className="grid-2">
          {/* Under */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#ef4444' }}>📉 Under Forecast — {last.month_label}</span>
              <span className="badge badge-red">{underSkus.length} SKUs</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="sku-table">
                <thead><tr><th>SKU ID</th><th>Rofo</th><th>PO</th><th>Ratio</th></tr></thead>
                <tbody>
                  {underSkus.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.sku_id}</td>
                      <td>{fmtNum(r.forecast_qty)}</td>
                      <td>{fmtNum(r.po_qty)}</td>
                      <td><span className="badge badge-red">{r.ratio}%</span></td>
                    </tr>
                  ))}
                  {underSkus.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#10b981' }}>✅ No under-forecast SKUs</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Over */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#f59e0b' }}>📈 Over Forecast — {last.month_label}</span>
              <span className="badge badge-amber">{overSkus.length} SKUs</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="sku-table">
                <thead><tr><th>SKU ID</th><th>Rofo</th><th>PO</th><th>Ratio</th></tr></thead>
                <tbody>
                  {overSkus.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.sku_id}</td>
                      <td>{fmtNum(r.forecast_qty)}</td>
                      <td>{fmtNum(r.po_qty)}</td>
                      <td><span className="badge badge-amber">{r.ratio}%</span></td>
                    </tr>
                  ))}
                  {overSkus.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#10b981' }}>✅ No over-forecast SKUs</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
