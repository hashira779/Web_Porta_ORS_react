from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints, dashboard, admin
# Create the FastAPI app instance
app = FastAPI(
    title="Modern Web Portal API",
    description="API for sales data reporting and user management.",
    version="1.0.0"
)

# Define the list of allowed origins for CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost:3000",
]

# Add the CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
# All routes defined in endpoints.py will be prefixed with /api
app.include_router(endpoints.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# A simple root endpoint to confirm the API is running
@app.get("/", tags=["Root"])
def read_root():
    """
    Welcome endpoint for the API.
    """
    return {"message": "Welcome to the Web Portal API! 🚀"}