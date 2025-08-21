from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload # <-- 1. Make sure joinedload is imported
from typing import List

# Project Imports
from app.db.session import get_db
from app.models import station as station_model
from app.schemas import station_info as station_info_schema
from .admin import get_current_admin_user
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/", response_model=station_info_schema.StationInfo, status_code=status.HTTP_201_CREATED)
def create_station_info(
        station_info: station_info_schema.StationInfoCreate,
        db: Session = Depends(get_db),
        admin: UserModel = Depends(get_current_admin_user)
):
    """
    Create a new station information record.
    """
    db_station = db.query(station_model.Station).filter(station_model.Station.station_id == station_info.station_id).first()
    if db_station:
        raise HTTPException(status_code=400, detail=f"Station with ID '{station_info.station_id}' already exists.")

    new_station = station_model.Station(**station_info.model_dump(exclude_unset=True))
    db.add(new_station)
    db.commit()
    db.refresh(new_station)
    return new_station

# === THIS IS THE CORRECTED FUNCTION ===
@router.get("/", response_model=List[station_info_schema.StationInfo])
def get_all_station_info(
        skip: int = 0,
        limit: int = 100000,
        db: Session = Depends(get_db),
        admin: UserModel = Depends(get_current_admin_user)
):
    """
    Retrieve all station information records with pagination.
    """
    # 2. Add .options() to the query to load related data
    stations = db.query(station_model.Station).options(
        joinedload(station_model.Station.am_control),
        joinedload(station_model.Station.supporter),
        joinedload(station_model.Station.province)
    ).order_by(station_model.Station.station_id).offset(skip).limit(limit).all()

    return stations
# ====================================

@router.get("/{station_db_id}", response_model=station_info_schema.StationInfo)
def get_station_info_by_id(
        station_db_id: int,
        db: Session = Depends(get_db),
        admin: UserModel = Depends(get_current_admin_user)
):
    """
    Retrieve a single station by its database ID.
    """
    db_station = db.query(station_model.Station).options(
        joinedload(station_model.Station.am_control),
        joinedload(station_model.Station.supporter)
    ).filter(station_model.Station.id == station_db_id).first()

    if not db_station:
        raise HTTPException(status_code=404, detail="Station not found")
    return db_station

@router.put("/{station_db_id}", response_model=station_info_schema.StationInfo)
def update_station_info(
        station_db_id: int,
        station_update: station_info_schema.StationInfoUpdate,
        db: Session = Depends(get_db),
        admin: UserModel = Depends(get_current_admin_user)
):
    """
    Update an existing station information record.
    """
    db_station = db.get(station_model.Station, station_db_id)
    if not db_station:
        raise HTTPException(status_code=404, detail="Station not found")

    update_data = station_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_station, key, value)

    db.commit()
    db.refresh(db_station)
    return db_station

@router.delete("/{station_db_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_station_info(
        station_db_id: int,
        db: Session = Depends(get_db),
        admin: UserModel = Depends(get_current_admin_user)
):
    """
    Delete a station information record.
    """
    db_station = db.get(station_model.Station, station_db_id)
    if not db_station:
        raise HTTPException(status_code=404, detail="Station not found")

    db.delete(db_station)
    db.commit()
    return