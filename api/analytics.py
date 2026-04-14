from fastapi import APIRouter
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional

router = APIRouter()


def validate_month_format(month_str: str):
    """Convert various month string formats to datetime."""
    month_map = {
        "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
        "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
    }
    if not month_str or pd.isna(month_str):
        return pd.Timestamp.now()

    s = str(month_str).strip().upper()
    for fmt in ["%b-%Y", "%b-%y", "%B %Y", "%m/%Y", "%Y-%m"]:
        try:
            return pd.to_datetime(month_str, format=fmt)
        except Exception:
            pass

    for name, num in month_map.items():
        if name in s:
            year_part = s.replace(name, "").replace("-", "").replace(" ", "").strip()
            if year_part.isdigit():
                year = int("20" + year_part) if len(year_part) == 2 else int(year_part)
            else:
                year = pd.Timestamp.now().year
            return pd.Timestamp(year=year, month=num, day=1)

    return pd.Timestamp.now()


def _melt_wide(df: pd.DataFrame, id_cols: List[str], value_col: str) -> pd.DataFrame:
    """Melt wide-format month columns to long format."""
    month_keywords = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    month_cols = [c for c in df.columns if any(k in str(c).upper() for k in month_keywords)]
    safe_id_cols = [c for c in id_cols if c in df.columns]

    if not month_cols or "SKU_ID" not in df.columns:
        return pd.DataFrame()

    df_long = df.melt(
        id_vars=safe_id_cols,
        value_vars=month_cols,
        var_name="Month_Label",
        value_name=value_col,
    )
    df_long[value_col] = pd.to_numeric(df_long[value_col], errors="coerce").fillna(0)
    df_long["Month"] = df_long["Month_Label"].apply(validate_month_format)
    return df_long


# ---------------------------------------------------------------------------
# MONTHLY PERFORMANCE  (Hit Rate + WMAPE)
# ---------------------------------------------------------------------------

@router.post("/monthly-performance")
async def calculate_monthly_performance(data: Dict[str, Any]):
    """
    Calculate forecast accuracy per month using:
      - Hit Rate  = Accurate SKUs / Total SKUs  (80-120% band = Accurate)
      - WMAPE     = |PO-Forecast| / Forecast  (weighted, outlier-safe)
    """
    try:
        df_forecast_raw = pd.DataFrame(data.get("forecast", []))
        df_po_raw = pd.DataFrame(data.get("po", []))
        df_product = pd.DataFrame(data.get("product", []))

        if df_forecast_raw.empty or df_po_raw.empty:
            return {"success": False, "error": "No forecast or PO data"}

        # Melt if wide
        if any("JAN" in str(c).upper() for c in df_forecast_raw.columns):
            df_f = _melt_wide(df_forecast_raw, ["SKU_ID", "Product_Name", "Brand", "SKU_Tier"], "Forecast_Qty")
            df_p = _melt_wide(df_po_raw, ["SKU_ID"], "PO_Qty")
        else:
            df_f = df_forecast_raw.copy()
            df_p = df_po_raw.copy()
            for df in [df_f, df_p]:
                if "Month" in df.columns:
                    df["Month"] = pd.to_datetime(df["Month"], errors="coerce")

        df_f = df_f[df_f["Forecast_Qty"] > 0]

        results = []
        all_months = sorted(set(df_f["Month"].dropna()) | set(df_p["Month"].dropna() if "Month" in df_p else set()))

        for month in all_months:
            f_month = df_f[df_f["Month"] == month]
            p_month = df_p[df_p["Month"] == month] if "Month" in df_p.columns else pd.DataFrame()

            if f_month.empty or p_month.empty:
                continue

            merged = pd.merge(
                f_month[["SKU_ID", "Forecast_Qty"]],
                p_month[["SKU_ID", "PO_Qty"]],
                on="SKU_ID",
                how="inner",
            )

            if merged.empty:
                continue

            merged["Ratio"] = (merged["PO_Qty"] / merged["Forecast_Qty"]) * 100
            merged["Status"] = pd.cut(
                merged["Ratio"],
                bins=[0, 80, 120, np.inf],
                labels=["Under", "Accurate", "Over"],
                right=True,
            ).astype(str)

            total = len(merged)
            counts = merged["Status"].value_counts().to_dict()
            accuracy = counts.get("Accurate", 0) / total * 100 if total else 0

            total_rofo = merged["Forecast_Qty"].sum()
            wmape = (abs(merged["PO_Qty"] - merged["Forecast_Qty"]).sum() / total_rofo * 100) if total_rofo else 0

            # Per-SKU detail
            detail_rows = []
            for _, row in merged.iterrows():
                detail_rows.append({
                    "sku_id": row["SKU_ID"],
                    "forecast_qty": int(row["Forecast_Qty"]),
                    "po_qty": int(row["PO_Qty"]),
                    "ratio": round(float(row["Ratio"]), 1),
                    "status": row["Status"],
                })

            results.append({
                "month": month.strftime("%Y-%m-%d") if hasattr(month, "strftime") else str(month),
                "month_label": month.strftime("%b %Y") if hasattr(month, "strftime") else str(month),
                "accuracy": round(accuracy, 1),
                "wmape": round(wmape, 1),
                "total_skus": total,
                "under": counts.get("Under", 0),
                "accurate": counts.get("Accurate", 0),
                "over": counts.get("Over", 0),
                "total_forecast": int(merged["Forecast_Qty"].sum()),
                "total_po": int(merged["PO_Qty"].sum()),
                "detail": detail_rows,
            })

        return {"success": True, "data": results}

    except Exception as e:
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# INVENTORY METRICS  (3-month average cover)
# ---------------------------------------------------------------------------

@router.post("/inventory-metrics")
async def calculate_inventory_metrics(data: Dict[str, Any]):
    """
    Return inventory health using 3-month average sales.
    Cover < 0.8  → Need Replenishment
    Cover 0.8–2  → Ideal
    Cover > 2    → High Stock
    """
    try:
        df_stock = pd.DataFrame(data.get("stock", []))
        df_sales_raw = pd.DataFrame(data.get("sales", []))
        df_product = pd.DataFrame(data.get("product", []))

        if df_stock.empty:
            return {"success": False, "error": "No stock data"}

        # Aggregate stock to SKU level
        qty_col = next((c for c in df_stock.columns if "qty" in c.lower() or "available" in c.lower()), None)
        if qty_col:
            df_stock = df_stock.rename(columns={qty_col: "Stock_Qty"})
        df_stock["Stock_Qty"] = pd.to_numeric(df_stock.get("Stock_Qty", 0), errors="coerce").fillna(0)
        df_agg = df_stock.groupby("SKU_ID")["Stock_Qty"].sum().reset_index()

        # 3-month average sales
        avg_sales = pd.DataFrame(columns=["SKU_ID", "Avg_Sales_3M"])
        if not df_sales_raw.empty:
            if any("JAN" in str(c).upper() for c in df_sales_raw.columns):
                df_s = _melt_wide(df_sales_raw, ["SKU_ID"], "Sales_Qty")
            else:
                df_s = df_sales_raw.copy()
                if "Month" in df_s.columns:
                    df_s["Month"] = pd.to_datetime(df_s["Month"], errors="coerce")
            if not df_s.empty and "Month" in df_s.columns:
                months = sorted(df_s["Month"].dropna().unique())
                last3 = months[-3:] if len(months) >= 3 else months
                df_last3 = df_s[df_s["Month"].isin(last3)]
                avg_sales = df_last3.groupby("SKU_ID")["Sales_Qty"].mean().reset_index()
                avg_sales.columns = ["SKU_ID", "Avg_Sales_3M"]

        df_inv = pd.merge(df_agg, avg_sales, on="SKU_ID", how="left")
        df_inv["Avg_Sales_3M"] = df_inv["Avg_Sales_3M"].fillna(0)
        df_inv["Cover_Months"] = np.where(
            df_inv["Avg_Sales_3M"] > 0,
            df_inv["Stock_Qty"] / df_inv["Avg_Sales_3M"],
            999,
        )

        # Add product info
        if not df_product.empty and "SKU_ID" in df_product.columns:
            info_cols = [c for c in ["SKU_ID", "Product_Name", "Brand", "SKU_Tier", "Floor_Price", "Status"] if c in df_product.columns]
            df_inv = pd.merge(df_inv, df_product[info_cols], on="SKU_ID", how="left")

        conditions = [
            df_inv["Cover_Months"] < 0.8,
            (df_inv["Cover_Months"] >= 0.8) & (df_inv["Cover_Months"] <= 2),
            df_inv["Cover_Months"] > 2,
        ]
        choices = ["Need Replenishment", "Ideal/Healthy", "High Stock"]
        df_inv["Inventory_Status"] = np.select(conditions, choices, default="Unknown")

        # Build response
        def to_records(df):
            df = df.copy()
            if "Cover_Months" in df.columns:
                df["Cover_Months"] = df["Cover_Months"].apply(lambda x: round(x, 2) if x < 900 else None)
            return df.head(100).replace({np.nan: None}).to_dict(orient="records")

        return {
            "success": True,
            "data": {
                "total_stock": int(df_agg["Stock_Qty"].sum()),
                "total_skus": len(df_inv),
                "avg_cover_months": round(float(df_inv[df_inv["Cover_Months"] < 900]["Cover_Months"].mean()), 2) if not df_inv.empty else 0,
                "health_score": round(len(df_inv[df_inv["Inventory_Status"] == "Ideal/Healthy"]) / len(df_inv) * 100, 1) if len(df_inv) else 0,
                "need_replenishment": int((df_inv["Inventory_Status"] == "Need Replenishment").sum()),
                "high_stock": int((df_inv["Inventory_Status"] == "High Stock").sum()),
                "ideal": int((df_inv["Inventory_Status"] == "Ideal/Healthy").sum()),
                "low_stock_items": to_records(df_inv[df_inv["Inventory_Status"] == "Need Replenishment"].sort_values("Cover_Months")),
                "high_stock_items": to_records(df_inv[df_inv["Inventory_Status"] == "High Stock"].sort_values("Cover_Months", ascending=False)),
                "all_items": to_records(df_inv.sort_values("Stock_Qty", ascending=False)),
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# FINANCIAL METRICS
# ---------------------------------------------------------------------------

@router.post("/financial-metrics")
async def calculate_financial_metrics(data: Dict[str, Any]):
    """Calculate Revenue, COGS, and Gross Margin from sales + product prices."""
    try:
        df_sales_raw = pd.DataFrame(data.get("sales", []))
        df_product = pd.DataFrame(data.get("product", []))
        df_forecast_raw = pd.DataFrame(data.get("forecast", []))

        if df_sales_raw.empty or df_product.empty:
            return {"success": False, "error": "Missing sales or product data"}

        # Melt if wide
        if any("JAN" in str(c).upper() for c in df_sales_raw.columns):
            df_s = _melt_wide(df_sales_raw, ["SKU_ID"], "Sales_Qty")
        else:
            df_s = df_sales_raw.copy()
            if "Month" in df_s.columns:
                df_s["Month"] = pd.to_datetime(df_s["Month"], errors="coerce")

        # Attach prices
        price_cols = [c for c in ["SKU_ID", "Product_Name", "Brand", "SKU_Tier", "Floor_Price", "Net_Order_Price"] if c in df_product.columns]
        df_s = pd.merge(df_s, df_product[price_cols], on="SKU_ID", how="left")
        df_s["Floor_Price"] = pd.to_numeric(df_s.get("Floor_Price", 0), errors="coerce").fillna(0)
        df_s["Net_Order_Price"] = pd.to_numeric(df_s.get("Net_Order_Price", 0), errors="coerce").fillna(0)
        df_s["Revenue"] = df_s["Sales_Qty"] * df_s["Floor_Price"]
        df_s["COGS"] = df_s["Sales_Qty"] * df_s["Net_Order_Price"]
        df_s["Gross_Margin"] = df_s["Revenue"] - df_s["COGS"]

        total_rev = float(df_s["Revenue"].sum())
        total_cogs = float(df_s["COGS"].sum())
        total_margin = float(df_s["Gross_Margin"].sum())
        margin_pct = total_margin / total_rev * 100 if total_rev else 0

        # Monthly trend
        monthly = []
        if "Month" in df_s.columns:
            df_s["Month_Str"] = df_s["Month"].apply(lambda x: x.strftime("%b %Y") if hasattr(x, "strftime") else str(x))
            monthly_grp = df_s.groupby("Month_Str")[["Revenue", "COGS", "Gross_Margin", "Sales_Qty"]].sum().reset_index()
            monthly = monthly_grp.replace({np.nan: 0}).to_dict(orient="records")

        # By brand
        by_brand = []
        if "Brand" in df_s.columns:
            brand_grp = df_s.groupby("Brand")[["Revenue", "Gross_Margin", "Sales_Qty"]].sum().reset_index()
            brand_grp["Margin_Pct"] = (brand_grp["Gross_Margin"] / brand_grp["Revenue"].replace(0, np.nan) * 100).fillna(0)
            by_brand = brand_grp.sort_values("Revenue", ascending=False).head(15).replace({np.nan: 0}).to_dict(orient="records")

        return {
            "success": True,
            "data": {
                "total_revenue": round(total_rev, 0),
                "total_cogs": round(total_cogs, 0),
                "total_gross_margin": round(total_margin, 0),
                "margin_pct": round(margin_pct, 1),
                "monthly_trend": monthly,
                "by_brand": by_brand,
            },
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
