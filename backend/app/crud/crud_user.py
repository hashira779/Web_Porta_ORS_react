from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text
from app.models.user import User
from app.models.station import Station, Area
from datetime import date

def get_am_summary_report_data(db: Session, user: User, start_date: date, end_date: date):
    """
    For a given Area Manager, fetches their assigned stations and calculates
    the sum of sales volume and amount for each station within a date range.
    """
    # [FIX] The logic is now much simpler.
    # user.managed_areas is a direct list of Area objects.
    managed_area_ids = [area.id for area in user.managed_areas]

    if not managed_area_ids:
        return []

    # Get the station IDs within those areas.
    station_ids_query = db.query(Station.station_id).filter(Station.area_id.in_(managed_area_ids))
    station_ids = [id_tuple[0] for id_tuple in station_ids_query.all()]

    if not station_ids:
        return []

    # The rest of this function is correct and remains the same
    union_parts = []
    for year in range(start_date.year, end_date.year + 1):
        table_name = f"data_sale_by_year_{year}"
        union_parts.append(f"(SELECT STATION_ID, VALUME, AMOUNT, COMPLETED_TS FROM {table_name})")

    if not union_parts:
        return []
    base_query_for_union = " UNION ALL ".join(union_parts)

    query = text(f"""
        SELECT
            si.station_ID, si.station_name, si.Province,
            COALESCE(sales.total_volume, 0) as total_volume,
            COALESCE(sales.total_amount, 0) as total_amount
        FROM station_info si
        LEFT JOIN (
            SELECT
                STATION_ID, SUM(VALUME) as total_volume, SUM(AMOUNT) as total_amount
            FROM ({base_query_for_union}) AS sales_data
            WHERE date(COMPLETED_TS) BETWEEN :start_date AND :end_date
            GROUP BY STATION_ID
        ) AS sales ON si.station_ID = sales.STATION_ID
        WHERE si.station_ID IN :station_ids
    """)

    results = db.execute(query, { "start_date": start_date, "end_date": end_date, "station_ids": station_ids }).mappings().all()
    return results

def get_am_station_assignments(db: Session, user: User) -> User:
    """
    For a given Area Manager, this function fetches their assigned areas and all
    stations within each of those areas.
    """
    return db.query(User).options(
        selectinload(User.managed_areas)
        .selectinload(Area.stations)
    ).filter(User.id == user.id).one()