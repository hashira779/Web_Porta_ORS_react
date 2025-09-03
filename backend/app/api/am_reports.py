from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

from app.db.session import get_db
from app.core.secure_api import require_api_key_with_scope
from app.crud import crud_user, crud_sales
from app.schemas import am_report as am_report_schema, external_sale as sale_schema
from app.models.api_key import APIKey
from app.models.station import Station

router = APIRouter()

@router.get(
    "/reports/am-summary",
    response_model=am_report_schema.AMReport,
    summary="Get a Summary Report for an Area Manager",
    tags=["On-Demand Reports"]
)
def get_am_summary_report(
        *,
        request: Request,
        db: Session = Depends(get_db),
        start_date: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
        end_date: date = Query(default_factory=date.today),
        api_key: APIKey = Depends(require_api_key_with_scope("am_summary_report"))
):
    """
    For the Area Manager associated with the provided API key, this returns
    a summary of their assigned areas and stations, including sales totals.
    """
    key_owner = getattr(request.state, "api_key_owner", None)

    # Authorization check for user and role
    if not key_owner or not key_owner.role or key_owner.role.name.lower() != 'area':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This key is not valid for an Area report.")

    # Get the raw station and sales data
    report_data = crud_user.get_am_summary_report_data(db=db, user=key_owner, start_date=start_date, end_date=end_date)

    # Create a map of which station belongs to which area for easy lookup
    station_to_area_map = {
        station.station_id: area.id  # Use the correct 'station_id' attribute
        for area in key_owner.managed_areas
        for station in area.stations
    }

    # Prepare the area dictionary
    areas_dict = {
        area.id: {"id": area.id, "name": area.name, "stations": []}
        for area in key_owner.managed_areas
    }

    # Distribute the station sales data into the correct area
    for row in report_data:
        station_id_from_data = row['station_ID'] # The key from the raw SQL result
        if station_id_from_data in station_to_area_map:
            area_id = station_to_area_map[station_id_from_data]
            areas_dict[area_id]['stations'].append(row)

    # Create the final report object using the Pydantic schema
    report = am_report_schema.AMReport(
        area_manager_name=key_owner.username,
        start_date=start_date,
        end_date=end_date,
        assigned_areas=list(areas_dict.values())
    )

    return report


@router.get(
    "/reports/sales/my-areas",
    response_model=List[sale_schema.ExternalSale],
    summary="Get a Sales Data Report for the Key's Owner",
    tags=["User Reports"]
)
def get_my_sales_report(
        *,
        request: Request,
        start_date: date = Query(..., description="Start date in YYYY-MM-DD format"),
        end_date: date = Query(..., description="End date in YYYY-MM-DD format"),
        db: Session = Depends(get_db),
        api_key: APIKey = Depends(require_api_key_with_scope("am_sales_report"))
):
    """
    For the user associated with the provided API key, returns a detailed
    sales report for their assigned stations within the specified date range.
    """
    key_owner = getattr(request.state, "api_key_owner", None)

    if not key_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This API key is not assigned to a user.")

    # Check for allowed roles
    allowed_roles = ['area', 'owner']
    if not key_owner.role or key_owner.role.name.lower() not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied. This key's owner does not have a valid role."
        )

    sales_data = crud_sales.get_sales_for_user(
        db=db, user=key_owner, start_date=start_date, end_date=end_date
    )

    return sales_data