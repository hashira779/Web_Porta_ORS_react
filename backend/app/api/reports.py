from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models import user as user_model, station as station_model
from app.schemas import sale as sale_schema
from app.core.security import get_current_active_user

router = APIRouter()

@router.get("/sales/{year}", response_model=List[sale_schema.Sale])
def get_sales_report_by_year(
        year: int,
        start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
        end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
        db: Session = Depends(get_db),
        current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Fetches the sales report for a specific year with optional date filtering.
    - Admins see all data.
    - Area Managers see data for stations in their assigned areas.
    - Station Owners see data for their assigned stations only.
    - Date filters apply to all roles.
    """
    params = {}
    conditions = []
    user_role = current_user.role.name.lower()

    # Handle user role-based filtering
    if user_role == 'area manager':
        if not current_user.managed_areas:
            return []
        area_ids = [area.id for area in current_user.managed_areas]
        stations_in_areas = db.query(station_model.Station.station_ID).filter(
            station_model.Station.area_id.in_(area_ids)
        ).all()
        station_ids = [s[0] for s in stations_in_areas if s[0]]
        if not station_ids:
            return []
        conditions.append("STATION_ID IN :station_ids")
        params["station_ids"] = station_ids

    elif user_role == 'owner':
        if not current_user.owned_stations:
            return []
        station_ids = [station.station_ID for station in current_user.owned_stations if station.station_ID]
        if not station_ids:
            return []
        conditions.append("STATION_ID IN :station_ids")
        params["station_ids"] = station_ids

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

    table_name = f"summary_station_{year}_materialized"

    try:
        # Validate table_name to prevent SQL injection
        if not table_name.isidentifier():
            raise HTTPException(status_code=400, detail="Invalid year format.")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = text(f"SELECT * FROM {table_name} {where_clause}")
        result = db.execute(query, params).fetchall()

        return [dict(row._mapping) for row in result]

    except Exception as e:
        print(f"Report Error: {e}")
        raise HTTPException(status_code=404, detail=f"Data for year {year} not found or error occurred.")