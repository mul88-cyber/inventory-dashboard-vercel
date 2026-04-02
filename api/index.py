from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.sheets import router as sheets_router
from api.analytics import router as analytics_router
from api.forecasting import router as forecasting_router

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sheets_router, prefix="/api/sheets", tags=["sheets"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(forecasting_router, prefix="/api/forecast", tags=["forecast"])

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2026-04-02"}

@app.get("/")
async def root():
    return {"message": "Inventory Intelligence API", "version": "2.0"}
