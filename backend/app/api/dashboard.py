from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.db.session import get_db
from app.models import user as user_model
# Assuming this is your auth dependency
# Correct path, based on your original code
from app.api.endpoints import get_current_active_user

router = APIRouter()


@router.get("/", tags=["Dashboard"])
def get_dashboard_data(
        db: Session = Depends(get_db),
        current_user: user_model.UserDB = Depends(get_current_active_user),
        year: Optional[int] = Query(None, description="Filter by year (e.g., 2024)"),
        month: Optional[int] = Query(None, description="Filter by month (1-12)"),
        day: Optional[int] = Query(None, description="Filter by day (1-31)"),
        id_type: Optional[str] = Query(None, description="Filter by ID Type (COCO or DODO)")
):
    """
    Fetches all aggregated data for the dashboard, with optional filtering.
    """
    try:
        # --- 1. Dynamically build the base sales query ---
        base_select_fields = "MAT_ID, total_valume, PAYMENT, date_completed, ID_type"

        if year:
            base_query = f"(SELECT {base_select_fields} FROM summary_station_{year}_materialized)"
        else:
            # We will use data up to the current year, 2025
            all_years = [2023, 2024, 2025]
            union_parts = [
                f"(SELECT {base_select_fields} FROM summary_station_{y}_materialized)"
                for y in all_years
            ]
            base_query = " UNION ALL ".join(union_parts)

        # --- 2. CORRECTED: Build WHERE clause string and parameters separately ---
        where_clauses = []
        params = {}

        if id_type:
            # Reference the column from the derived table 'sales'
            where_clauses.append("sales.ID_type = :id_type")
            params["id_type"] = id_type

        if year:
            if month:
                where_clauses.append("EXTRACT(MONTH FROM sales.date_completed) = :month")
                params["month"] = month
            if day:
                where_clauses.append("EXTRACT(DAY FROM sales.date_completed) = :day")
                params["day"] = day

        where_string = ""
        if where_clauses:
            where_string = f"WHERE {' AND '.join(where_clauses)}"
        # --- End of correction ---

        # Station count query remains the same
        station_count_query = text("SELECT COUNT(id) as total_stations FROM station_info WHERE active = 1")
        station_count_result = db.execute(station_count_query).first()

        # --- 3. Execute queries with the correctly placed WHERE clause ---
        total_volume_query = text(f"""
            SELECT
                SUM(CASE WHEN sales.MAT_ID = '500033' THEN sales.total_valume ELSE 0 END) as hds_volume,
                SUM(CASE WHEN sales.MAT_ID = '500024' THEN sales.total_valume ELSE 0 END) as ulg95_volume,
                SUM(CASE WHEN sales.MAT_ID = '500014' THEN sales.total_valume ELSE 0 END) as ulr91_volume
            FROM ({base_query}) as sales
            {where_string}
        """)
        total_volume_result = db.execute(total_volume_query, params).first()

        payment_chart_query = text(f"""
            SELECT sales.PAYMENT as name, COUNT(sales.PAYMENT) as value
            FROM ({base_query}) as sales
            {where_string}
            GROUP BY sales.PAYMENT
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
            FROM ({base_query}) as sales
            {where_string}
            GROUP BY name
        """)
        product_chart_result = db.execute(product_chart_query, params).fetchall()

        return {
            "kpi": {
                "total_stations": station_count_result._mapping['total_stations'] if station_count_result else 0,
                "hds_volume": float(total_volume_result._mapping['hds_volume']) if total_volume_result and total_volume_result._mapping['hds_volume'] else 0,
                "ulg95_volume": float(total_volume_result._mapping['ulg95_volume']) if total_volume_result and total_volume_result._mapping['ulg95_volume'] else 0,
                "ulr91_volume": float(total_volume_result._mapping['ulr91_volume']) if total_volume_result and total_volume_result._mapping['ulr91_volume'] else 0,
            },
            "charts": {
                "sales_by_payment": [dict(row._mapping) for row in payment_chart_result],
                "volume_by_product": [dict(row._mapping) for row in product_chart_result],
            }
        }

    except Exception as e:
        # This will now give more precise errors if something else goes wrong
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"Could not fetch dashboard data. Error: {e}")