from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import user as user_model, station as station_model

# --- [MODIFIED] Replace the old function with this simpler version ---
def get_sales_for_user(db: Session, *, user: user_model.User, start_date: date, end_date: date):
    """
    For a given user, this fetches their specific sales data from the
    data_sale_by_year tables within a date range.
    """
    station_ids = []
    # Simplified logic to get station IDs based on role
    if user.role.name.lower() == 'area manager':
        managed_area_ids = [ua.area_id for ua in user.managed_areas]
        if managed_area_ids:
            station_ids = [id[0] for id in db.query(station_model.Station.station_id).filter(station_model.Station.area_id.in_(managed_area_ids)).all()]
    elif user.role.name.lower() == 'owner':
        station_ids = [s.station_id for s in user.owned_stations if s.station_id]

    if not station_ids:
        return []

    # The rest of the query logic is unchanged.
    union_parts = []
    for year in range(start_date.year, end_date.year + 1):
        table_name = f"data_sale_by_year_{year}"
        union_parts.append(f"(SELECT * FROM {table_name})")

    if not union_parts:
        return []

    base_query_for_union = " UNION ALL ".join(union_parts)

    sales_query = text(f"""
        SELECT * FROM ({base_query_for_union}) as sales_data
        WHERE COMPLETED_TS BETWEEN :start_date AND :end_date 
        AND STATION_ID IN :station_ids
        ORDER BY COMPLETED_TS, STATION_ID
    """)

    sales_results = db.execute(sales_query, {
        "start_date": start_date.strftime('%Y-%m-%d 00:00:00'),
        "end_date": end_date.strftime('%Y-%m-%d 23:59:59'),
        "station_ids": station_ids
    }).mappings().all()

    return sales_results