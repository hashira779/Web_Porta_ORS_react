from fastapi import FastAPI
# Add 'external' and 'api_keys_admin' to your imports
from app.api import (
    endpoints,
    admin,
    dashboard,
    reports,
    stations,
    telegram,
    webview,
    station_info,
    lookups,
    external,
    api_keys_admin
)
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Portal API",
    version="1.0.0"
)

# ===============================
# Existing Routers
# ===============================
app.include_router(endpoints.router, prefix="/api", tags=["Authentication & Users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(stations.router, prefix="/api/stations", tags=["stations"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["Telegram"])
app.include_router(webview.router, prefix="/api", tags=["WebView Links"])
app.include_router(
    station_info.router,
    prefix="/api/admin/station-info",
    tags=["Admin - Station Info"]
)
app.include_router(
    lookups.router,
    prefix="/api/lookups",
    tags=["Lookups"]
)

# ===============================
# NEW Routers for External API and Key Management
# ===============================

# This adds the '/external/sales/{year}' endpoint
app.include_router(
    external.router,
    prefix="/api",
    tags=["External API"]
)

# This adds the '/admin/api-keys' endpoints for admins
app.include_router(
    api_keys_admin.router,
    prefix="/api",
    tags=["Admin: API Keys"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
# ===============================

@app.get("/")
def read_root():
    return {"message": "API is running"}