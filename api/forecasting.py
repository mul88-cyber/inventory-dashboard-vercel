from fastapi import APIRouter
import pandas as pd
import numpy as np
from typing import Dict, Any

router = APIRouter()

@router.post("/ai-forecast")
async def ai_forecast(data: Dict[str, Any]):
    """Generate AI forecast using statistical methods"""
    try:
        historical = pd.DataFrame(data.get('historical', []))
        method = data.get('method', 'moving_average')
        months = data.get('months', 12)
        
        if historical.empty:
            return {"success": False, "error": "No historical data"}
        
        # Extract time series
        ts = historical.set_index('Month')['Sales_Qty'].sort_index()
        
        if method == 'moving_average':
            window = data.get('window', 3)
            forecast = ts.rolling(window=window).mean().iloc[-1]
            predictions = [forecast] * months
        elif method == 'exponential_smoothing':
            # Simple exponential smoothing
            alpha = data.get('alpha', 0.3)
            smoothed = ts.ewm(alpha=alpha).mean()
            predictions = [smoothed.iloc[-1]] * months
        else:
            # Linear trend
            x = np.arange(len(ts))
            z = np.polyfit(x, ts.values, 1)
            trend = np.poly1d(z)
            next_x = np.arange(len(ts), len(ts) + months)
            predictions = trend(next_x).tolist()
        
        # Generate forecast dates
        last_date = pd.to_datetime(ts.index[-1])
        forecast_dates = [last_date + pd.DateOffset(months=i+1) for i in range(months)]
        
        return {
            "success": True,
            "forecast": [
                {"date": d.strftime("%Y-%m-%d"), "value": max(0, round(v))}
                for d, v in zip(forecast_dates, predictions)
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
