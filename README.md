# 🚀 Inventory Intelligence Dashboard — Vercel Edition

Next.js frontend + FastAPI backend, deployed as a monorepo on Vercel.

---

## 📁 Struktur Repo

```
/
├── api/                   # FastAPI (Python) — di-serve Vercel as serverless
│   ├── index.py           # Main app + CORS
│   ├── sheets.py          # Google Sheets connection
│   ├── analytics.py       # Monthly performance, inventory, financial
│   └── forecasting.py     # AI forecasting methods
├── frontend/              # Next.js app
│   ├── pages/             # Route-based pages
│   │   ├── index.js       # Main dashboard (Forecast Accuracy)
│   │   ├── inventory.js   # Inventory Health
│   │   ├── financial.js   # P&L Analysis
│   │   └── ...
│   ├── components/
│   │   └── Layout.js      # Sidebar + topbar shell
│   └── package.json
├── requirements.txt       # Python deps
└── vercel.json            # Deployment config
```

---

## ⚙️ Environment Variables (Vercel Dashboard)

| Variable | Value |
|---|---|
| `GCP_SERVICE_ACCOUNT` | Full JSON string dari Google Cloud service account |
| `GSHEET_URL` | URL Google Spreadsheet Anda |

---

## 🚀 Deploy ke Vercel

### 1. Connect Repo
```
vercel.com → New Project → Import GitHub repo
```

### 2. Set Environment Variables
Vercel Dashboard → Settings → Environment Variables → tambahkan keduanya.

### 3. Deploy
Push ke `main` branch → Vercel auto-deploy.

---

## 🛠️ Local Development

### Backend
```bash
pip install -r requirements.txt
cd api && uvicorn index:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev
```

---

## 📊 Pages yang sudah ada

| Path | Status | Description |
|---|---|---|
| `/` | ✅ Complete | Forecast Accuracy + Trend Chart |
| `/inventory` | ✅ Basic | Stock Health Overview |
| `/financial` | 🔧 WIP | Revenue & Margin |
| `/sku-analysis` | 🔧 WIP | SKU 360° Deep Dive |
| `/ecommerce-forecast` | 🔧 WIP | AI Forecast Engine |
| `/reseller` | 🔧 WIP | Reseller Performance |
| `/fulfillment` | 🔧 WIP | Cost per Order |
| `/data-explorer` | 🔧 WIP | Raw Data View |

---

## 🔑 Security Notes

- API key Google Sheets **jangan** di-commit ke repo
- Gunakan Vercel Environment Variables atau `.env.local` untuk local dev
- Endpoint `/api/sheets/all-data` akan timeout jika data terlalu besar → pertimbangkan caching di backend

---

## 📦 Vercel Limitations (Python)

- Max execution time: 10s (Hobby), 60s (Pro)
- Max payload: 4.5MB per request
- Jika data Google Sheets besar → cache di Vercel KV atau gunakan streaming
