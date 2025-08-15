from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models import station as station_model
from app.schemas import lookups as lookup_schema
from .admin import get_current_admin_user
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/am-controls", response_model=List[lookup_schema.AMControl])
def get_am_controls(db: Session = Depends(get_db), admin: UserModel = Depends(get_current_admin_user)):
    return db.query(station_model.AMControl).order_by(station_model.AMControl.name).all()

@router.get("/supporters", response_model=List[lookup_schema.Supporter])
def get_supporters(db: Session = Depends(get_db), admin: UserModel = Depends(get_current_admin_user)):
    return db.query(station_model.Supporter).order_by(station_model.Supporter.supporter_name).all()

@router.get("/provinces", response_model=List[lookup_schema.Province])
def get_provinces(db: Session = Depends(get_db), admin: UserModel = Depends(get_current_admin_user)):
    return db.query(station_model.Province).order_by(station_model.Province.name).all()