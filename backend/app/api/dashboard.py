from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.models import user as user_model
from app.api.endpoints import get_current_active_user

router = APIRouter()

# --- Combined Dashboard Endpoint ---
@router.get("/", tags=["Dashboard"])
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: user_model.UserDB = Depends(get_current_active_user)
):
    """
    Fetches all aggregated data needed for the main dashboard in a single call.
    """
    try:
        # Query for KPI Card 1: Total number of active stations
        # CORRECTED: Changed table name to 'table_station_info'
        station_count_query = text("SELECT COUNT(id) as total_stations FROM station_info WHERE active = 1")
        station_count_result = db.execute(station_count_query).first()

        # CORRECTED: Added the required 'FROM' keyword to each SELECT statement.
        combined_sales_query = """
            (SELECT MAT_ID, total_valume, PAYMENT, date_completed FROM summary_station_2023_materialized)
            UNION ALL
            (SELECT MAT_ID, total_valume, PAYMENT, date_completed FROM summary_station_2024_materialized)
            UNION ALL
            (SELECT MAT_ID, total_valume, PAYMENT, date_completed FROM summary_station_2025_materialized)
        """

        # Query for KPI Card 2: Total volume of specific products
        total_volume_query = text(f"""
            SELECT
                SUM(CASE WHEN MAT_ID = '500033' THEN total_valume ELSE 0 END) as hds_volume,
                SUM(CASE WHEN MAT_ID = '500024' THEN total_valume ELSE 0 END) as ulg95_volume,
                SUM(CASE WHEN MAT_ID = '500014' THEN total_valume ELSE 0 END) as ulr91_volume
            FROM ({combined_sales_query}) as sales
        """)
        total_volume_result = db.execute(total_volume_query).first()
        
        # Query for Chart 1: Sales by Payment Type
        payment_chart_query = text(f"""
            SELECT PAYMENT as name, COUNT(PAYMENT) as value
            FROM ({combined_sales_query}) as sales
            GROUP BY PAYMENT
        """)
        payment_chart_result = db.execute(payment_chart_query).fetchall()

        # Query for Chart 2: Volume by Product (MAT_ID)
        product_chart_query = text(f"""
            SELECT 
                CASE 
                    WHEN MAT_ID = '500033' THEN 'HDS'
                    WHEN MAT_ID = '500024' THEN 'ULG95'
                    WHEN MAT_ID = '500014' THEN 'ULR91'
                    ELSE 'Other'
                END as name,
                SUM(total_valume) as value
            FROM ({combined_sales_query}) as sales
            GROUP BY name
        """)
        product_chart_result = db.execute(product_chart_query).fetchall()

        return {
            "kpi": {
                "total_stations": station_count_result._mapping['total_stations'] if station_count_result else 0,
                "hds_volume": total_volume_result._mapping['hds_volume'] if total_volume_result else 0,
                "ulg95_volume": total_volume_result._mapping['ulg95_volume'] if total_volume_result else 0,
                "ulr91_volume": total_volume_result._mapping['ulr91_volume'] if total_volume_result else 0,
            },
            "charts": {
                "sales_by_payment": [dict(row._mapping) for row in payment_chart_result],
                "volume_by_product": [dict(row._mapping) for row in product_chart_result],
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch dashboard data. Error: {e}")