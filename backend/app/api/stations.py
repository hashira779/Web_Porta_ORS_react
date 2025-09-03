from fastapi import APIRouter, Depends, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.db.session import get_db
from app.models import station as station_model
from app.schemas import station as station_schema
from app.core.security import get_current_active_user # For security

router = APIRouter()

@router.get("/search", response_model=List[station_schema.StationSuggestion])
def search_stations(
        q: Optional[str] = Query(None, min_length=2, description="Search query for station ID or name"),
        db: Session = Depends(get_db),
        # You can add this back later to make it secure
        # current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Provides a list of station suggestions based on a search query.
    Searches against station_ID and station_name.
    """
    if not q:
        return []

    search_term = f"%{q}%"

    # Query the station_info table for matches in either ID or name
    stations = db.query(
        station_model.Station.station_id,
        station_model.Station.station_name
    ).filter(
        station_model.Station.active == True, # Optional: only show active stations
        or_(
            station_model.Station.station_id.ilike(search_term),
            station_model.Station.station_name.ilike(search_term)
        )
    ).limit(10).all()

    return stations