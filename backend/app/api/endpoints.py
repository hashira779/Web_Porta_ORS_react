from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from typing import List
from jose import JWTError, jwt

# Import dependencies and models/schemas
from app.db.session import get_db
from app.core import security, config
from app.models import user as user_model
from app.models import station as station_model # <-- NEW IMPORT
from app.schemas import user as user_schema
from app.schemas import sale as sale_schema
from app.schemas import station as station_schema # <-- NEW IMPORT


# --- Setup ---
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


# --- Helper Dependency ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> user_model.UserDB:
    """
    Decodes the JWT token to get the current user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(user_model.UserDB).filter(user_model.UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: user_model.UserDB = Depends(get_current_user)) -> user_model.UserDB:
    """Checks if the user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# --- Authentication Endpoints ---
@router.post("/register", response_model=user_schema.User, tags=["Authentication"])
def register_user(user: user_schema.UserCreate, db: Session = Depends(get_db)):
    """
    Creates a new user in the database.
    """
    db_user = db.query(user_model.UserDB).filter(user_model.UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = security.get_password_hash(user.password)
    new_user = user_model.UserDB(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role_id=2 # Default to role 'user'
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/token", response_model=user_schema.Token, tags=["Authentication"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticates a user and returns a JWT access token.
    """
    user = db.query(user_model.UserDB).filter(user_model.UserDB.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# --- User Endpoints ---
@router.get("/users/me", response_model=user_schema.User, tags=["Users"])
def read_users_me(current_user: user_model.UserDB = Depends(get_current_active_user)):
    """
    Fetches the details of the currently logged-in user.
    """
    return current_user


# --- Data Endpoints (Protected) ---
@router.get("/sales/{year}", response_model=List[sale_schema.Sale], tags=["Sales Data"])
def get_sales_data(
    year: int, 
    db: Session = Depends(get_db), 
    current_user: user_model.UserDB = Depends(get_current_active_user)
):
    """
    Fetches sales data for a specific year based on user permissions.
    """
    report_name = f"data_sale_by_year_{year}"
    permission = db.query(user_model.RolePermission).filter(
        user_model.RolePermission.role_id == current_user.role_id,
        user_model.RolePermission.report_name == report_name,
        user_model.RolePermission.can_view == True
    ).first()

    if not permission:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")

    if not report_name.isidentifier():
        raise HTTPException(status_code=400, detail="Invalid year format.")
    
    try:
        query = text(f"SELECT * FROM `{report_name}` LIMIT 100")
        result = db.execute(query).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Data for year {year} not found. Error: {e}")


# --- NEW ENDPOINT WITH RELATIONSHIPS ---
