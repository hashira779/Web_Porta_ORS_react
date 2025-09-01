from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.schemas import external_sale as external_sale_schema
# This import now points to our new, dedicated API security file.
from app.core.secure_api import require_api_key_with_scope

router = APIRouter()

@router.get(
    "/external/sales/{year}",
    response_model=List[external_sale_schema.ExternalSale],
    summary="Get Yearly Sales Report (API Key Required)",
    tags=["External API"]
)
def get_external_sales_report(
        year: int,
        start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
        end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
        db: Session = Depends(get_db),
        # This is the crucial part: it requires a valid API key with the "external_sales" scope to proceed.
        api_key: str = Depends(require_api_key_with_scope("external_sales"))
):
    """
    Fetches the sales report for a specific year for external systems.

    Access is protected by an API key provided in the 'X-API-Key' header, which must have the 'external_sales' scope.
    Allows optional filtering by a date range.
    """
    params = {}
    conditions = []

    # Handle date filtering
    if start_date:
        try:
            datetime.strptime(start_date, "%Y-%m-%d")
            conditions.append("date_completed >= :start_date")
            params["start_date"] = start_date
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start date format. Use YYYY-MM-DD")

    if end_date:
        try:
            datetime.strptime(end_date, "%Y-%m-%d")
            conditions.append("date_completed <= :end_date")
            params["end_date"] = end_date
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end date format. Use YYYY-MM-DD")

    # Construct the final SQL query
    table_name = f"summary_station_{year}_materialized"

    try:
        # Simple validation to prevent obvious SQL injection risks
        if not table_name.startswith("summary_station_") or not table_name.endswith("_materialized"):
            raise HTTPException(status_code=400, detail="Invalid year format resulting in a bad table name.")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = text(f"SELECT * FROM {table_name} {where_clause}")

        result = db.execute(query, params).fetchall()

        # The response_model will automatically process each row using our ExternalSale schema,
        # which includes the logic to convert MAT_ID to MAT_Name.
        return [dict(row._mapping) for row in result]

    except Exception as e:
        # This handles cases where the table for the given year doesn't exist or another DB error occurs
        print(f"Report Error: {e}")
        raise HTTPException(status_code=404, detail=f"Data for year {year} not found or a database error occurred.")