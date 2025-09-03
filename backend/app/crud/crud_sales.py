from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import user as user_model, station as station_model

def get_sales_for_user(db: Session, *, user: user_model.User, start_date: date, end_date: date):
    """
    For a given user, this fetches their specific sales data from the
    data_sale_by_year tables within a date range.
    """
    station_ids = []
    if user.role.name.lower() == 'area':
        # [FIX] Get the ID from the Area object directly. user.managed_areas is now a list of Areas.
        managed_area_ids = [area.id for area in user.managed_areas]
        if managed_area_ids:
            station_ids = [id[0] for id in db.query(station_model.Station.station_id).filter(station_model.Station.area_id.in_(managed_area_ids)).all()]
    elif user.role.name.lower() == 'owner':
        station_ids = [s.station_id for s in user.owned_stations if s.station_id]

    if not station_ids:
        return []

    # The rest of the query logic is correct.
    union_parts = []
    for year in range(start_date.year, end_date.year + 1):
        table_name = f"data_sale_by_year_{year}"
        union_parts.append(f"(SELECT * FROM {table_name})")

    if not union_parts:
        return []

    base_query_for_union = " UNION ALL ".join(union_parts)

    sales_query = text(f"""
        SELECT * FROM ({base_query_for_union}) as sales_data
        WHERE COMPLETED_TS >= :start_date 
        AND COMPLETED_TS < :end_date_exclusive
        AND STATION_ID IN :station_ids
        ORDER BY COMPLETED_TS, STATION_ID
    """)

    end_date_exclusive = end_date + timedelta(days=1)

    sales_results = db.execute(sales_query, {
        "start_date": start_date,
        "end_date_exclusive": end_date_exclusive,
        "station_ids": station_ids
    }).mappings().all()

    return sales_results