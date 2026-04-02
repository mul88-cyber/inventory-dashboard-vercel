from fastapi import APIRouter, HTTPException, Depends
from google.oauth2.service_account import Credentials
import gspread
import pandas as pd
import os
import json
from typing import Dict, Any

router = APIRouter()

def get_gsheet_client():
    """Get authenticated Google Sheets client"""
    try:
        # Get credentials from Vercel environment variables
        credentials_info = json.loads(os.environ.get('GCP_SERVICE_ACCOUNT', '{}'))
        scopes = ["https://www.googleapis.com/auth/spreadsheets"]
        credentials = Credentials.from_service_account_info(credentials_info, scopes=scopes)
        client = gspread.authorize(credentials)
        return client
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Sheets auth failed: {str(e)}")

@router.get("/product-master")
async def get_product_master():
    """Get product master data"""
    try:
        client = get_gsheet_client()
        gsheet_url = os.environ.get('GSHEET_URL')
        workbook = client.open_by_url(gsheet_url)
        worksheet = workbook.worksheet("Product_Master")
        records = worksheet.get_all_records()
        return {"success": True, "data": records}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/sales")
async def get_sales_data():
    """Get sales data"""
    try:
        client = get_gsheet_client()
        gsheet_url = os.environ.get('GSHEET_URL')
        workbook = client.open_by_url(gsheet_url)
        worksheet = workbook.worksheet("Sales")
        records = worksheet.get_all_records()
        return {"success": True, "data": records}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/forecast")
async def get_forecast_data():
    """Get forecast (ROFO) data"""
    try:
        client = get_gsheet_client()
        gsheet_url = os.environ.get('GSHEET_URL')
        workbook = client.open_by_url(gsheet_url)
        worksheet = workbook.worksheet("Rofo")
        records = worksheet.get_all_records()
        return {"success": True, "data": records}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/po")
async def get_po_data():
    """Get PO data"""
    try:
        client = get_gsheet_client()
        gsheet_url = os.environ.get('GSHEET_URL')
        workbook = client.open_by_url(gsheet_url)
        worksheet = workbook.worksheet("PO")
        records = worksheet.get_all_records()
        return {"success": True, "data": records}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/stock")
async def get_stock_data():
    """Get stock data"""
    try:
        client = get_gsheet_client()
        gsheet_url = os.environ.get('GSHEET_URL')
        workbook = client.open_by_url(gsheet_url)
        worksheet = workbook.worksheet("Stock_Onhand")
        records = worksheet.get_all_records()
        return {"success": True, "data": records}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/all-data")
async def get_all_data():
    """Get all data in parallel"""
    from concurrent.futures import ThreadPoolExecutor
    
    sheets = ["Product_Master", "Sales", "Rofo", "PO", "Stock_Onhand"]
    
    def fetch_sheet(sheet_name):
        try:
            client = get_gsheet_client()
            gsheet_url = os.environ.get('GSHEET_URL')
            workbook = client.open_by_url(gsheet_url)
            worksheet = workbook.worksheet(sheet_name)
            return sheet_name, worksheet.get_all_records()
        except Exception as e:
            return sheet_name, {"error": str(e)}
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = dict(executor.map(fetch_sheet, sheets))
    
    return {"success": True, "data": results}
