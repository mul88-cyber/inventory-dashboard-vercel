from fastapi import APIRouter, HTTPException
from google.oauth2.service_account import Credentials
import gspread
import os
import json
from typing import Dict, Any

router = APIRouter()

def get_gsheet_client():
    """Get authenticated Google Sheets client"""
    try:
        credentials_info = json.loads(os.environ.get('GCP_SERVICE_ACCOUNT', '{}'))
        if not credentials_info:
            raise Exception("GCP_SERVICE_ACCOUNT not configured")
        
        scopes = ["https://www.googleapis.com/auth/spreadsheets"]
        credentials = Credentials.from_service_account_info(credentials_info, scopes=scopes)
        client = gspread.authorize(credentials)
        return client
    except Exception as e:
        raise Exception(f"Google Sheets auth failed: {str(e)}")

@router.get("/all-data")
async def get_all_data():
    """Get all data from Google Sheets"""
    result = {}
    sheets = ["Product_Master", "Sales", "Rofo", "PO", "Stock_Onhand"]
    
    try:
        client = get_gsheet_client()
        gsheet_url = os.environ.get('GSHEET_URL')
        
        if not gsheet_url:
            return {"success": False, "error": "GSHEET_URL not configured"}
        
        workbook = client.open_by_url(gsheet_url)
        
        for sheet_name in sheets:
            try:
                worksheet = workbook.worksheet(sheet_name)
                records = worksheet.get_all_records()
                result[sheet_name] = records
            except Exception as e:
                result[sheet_name] = []
        
        return {"success": True, "data": result}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": "2026-04-02"}
