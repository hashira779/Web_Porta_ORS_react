# In app/api/dashboard.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.db.session import get_db
from app.models import user as user_model, station as station_model
from app.core.security import get_current_active_user

router = APIRouter()

@router.get("/")
def get_dashboard_data(
        db: Session = Depends(get_db),
        current_user: user_model.User = Depends(get_current_active_user),
        year: Optional[int] = Query(None, description="Filter by year (e.g., 2024)"),
        month: Optional[int] = Query(None, description="Filter by month (1-12)"),
        day: Optional[int] = Query(None, description="Filter by day (1-31)"),
        id_type: Optional[str] = Query(None, description="Filter by ID Type (COCO or DODO)")
):
    """
    Fetches aggregated dashboard data, automatically filtered based on the user's role and assignments.
    - Admins see all data and total station count.
    - Area Managers see data and station count for their assigned areas.
    - Station Owners see data and station count for their assigned stations.
    """
    try:
        # --- 1. Determine Station Scope and Count Based on User Role ---
        station_filter_clause = ""
        params = {}
        total_stations_count = 0
        station_ids = []

        user_role = current_user.role.name.lower()

        if user_role == 'area': # Assuming 'area' is the role name for Area Manager
            if not current_user.managed_areas:
                return {"kpi": {"total_stations": 0}, "charts": {}}

            area_ids = [area.id for area in current_user.managed_areas]
            # FIX #1: Changed station_ID to station_id
            stations_in_areas = db.query(station_model.Station.station_id).filter(
                station_model.Station.area_id.in_(area_ids),
                station_model.Station.active == True
            ).all()
            station_ids = [s[0] for s in stations_in_areas if s[0]]
            total_stations_count = len(station_ids)

        elif user_role == 'owner':
            if not current_user.owned_stations:
                return {"kpi": {"total_stations": 0}, "charts": {}}

            active_owned_stations = [s for s in current_user.owned_stations if s.active]
            # FIX #2: Changed station.station_ID to station.station_id
            station_ids = [station.station_id for station in active_owned_stations if station.station_id]
            total_stations_count = len(station_ids)

        else: # This is the Admin role
            station_count_query = text("SELECT COUNT(id) as total_stations FROM station_info WHERE active = 1")
            station_count_result = db.execute(station_count_query).first()
            if station_count_result:
                total_stations_count = station_count_result._mapping['total_stations']

        if user_role not in ['admin', 'moderator'] and not station_ids:
            return {"kpi": {"total_stations": 0}, "charts": {}}

        if station_ids:
            station_filter_clause = "AND sales.STATION_ID IN :station_ids"
            params["station_ids"] = station_ids

        # --- 2. Dynamically build the base sales query ---
        base_select_fields = "MAT_ID, total_valume, PAYMENT, date_completed, ID_type, STATION_ID"
        available_years = [2023, 2024, 2025]

        years_to_query = [year] if year and year in available_years else available_years
        union_parts = [
            f"(SELECT {base_select_fields} FROM summary_station_{y}_materialized)"
            for y in years_to_query
        ]
        if not union_parts:
            return {"kpi": {"total_stations": total_stations_count}, "charts": {}}

        base_query = " UNION ALL ".join(union_parts)

        # --- 3. Build WHERE clause for filtering sales data ---
        where_clauses = []
        if id_type:
            where_clauses.append("sales.ID_type = :id_type")
            params["id_type"] = id_type
        if year and month:
            where_clauses.append("EXTRACT(MONTH FROM sales.date_completed) = :month")
            params["month"] = month
        if year and month and day:
            where_clauses.append("EXTRACT(DAY FROM sales.date_completed) = :day")
            params["day"] = day

        where_string = ""
        if where_clauses:
            where_string = f"WHERE {' AND '.join(where_clauses)} {station_filter_clause}"
        elif station_filter_clause:
            where_string = f"WHERE 1=1 {station_filter_clause}"

        # --- 4. Execute Sales Data Queries ---
        total_volume_query = text(f"""
            SELECT
                SUM(CASE WHEN sales.MAT_ID = '500033' THEN sales.total_valume ELSE 0 END) as hds_volume,
                SUM(CASE WHEN sales.MAT_ID = '500024' THEN sales.total_valume ELSE 0 END) as ulg95_volume,
                SUM(CASE WHEN sales.MAT_ID = '500014' THEN sales.total_valume ELSE 0 END) as ulr91_volume
            FROM ({base_query}) as sales {where_string}
        """)
        total_volume_result = db.execute(total_volume_query, params).first()

        payment_chart_query = text(f"""
            SELECT sales.PAYMENT as name, COUNT(sales.PAYMENT) as value
            FROM ({base_query}) as sales {where_string} GROUP BY sales.PAYMENT
        """)
        payment_chart_result = db.execute(payment_chart_query, params).fetchall()

        product_chart_query = text(f"""
            SELECT 
                CASE 
                    WHEN sales.MAT_ID = '500033' THEN 'HDS'
                    WHEN sales.MAT_ID = '500024' THEN 'ULG95'
                    WHEN sales.MAT_ID = '500014' THEN 'ULR91'
                    ELSE 'Other'
                END as name,
                SUM(sales.total_valume) as value
            FROM ({base_query}) as sales {where_string} GROUP BY name
        """)
        product_chart_result = db.execute(product_chart_query, params).fetchall()

        return {
            "kpi": {
                "total_stations": total_stations_count,
                "hds_volume": float(total_volume_result._mapping['hds_volume'] or 0) if total_volume_result else 0,
                "ulg95_volume": float(total_volume_result._mapping['ulg95_volume'] or 0) if total_volume_result else 0,
                "ulr91_volume": float(total_volume_result._mapping['ulr91_volume'] or 0) if total_volume_result else 0,
            },
            "charts": {
                "sales_by_payment": [dict(row._mapping) for row in payment_chart_result],
                "volume_by_product": [dict(row._mapping) for row in product_chart_result],
            }
        }

    except Exception as e:
        print(f"An error occurred in dashboard endpoint: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch dashboard data.")