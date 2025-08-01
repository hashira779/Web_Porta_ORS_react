from fastapi import FastAPI
from app.api import endpoints, admin, dashboard, reports ,stations, telegram

app = FastAPI(
    title="Portal API",
    version="1.0.0"
)

# Include all the routers
app.include_router(endpoints.router, prefix="/api", tags=["Authentication & Users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(stations.router, prefix="/api/stations", tags=["stations"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["Telegram"])

@app.get("/")
def read_root():
    return {"message": "API is running"}