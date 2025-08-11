from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.webview_link import WebViewLink, WebViewLinkCreate, WebViewLinkUpdate
from app.models.webview_link import WebViewLink as WebViewLinkModel
from app.db.session import get_db # Assuming you have this session dependency

router = APIRouter()

@router.get("/webview-links", response_model=List[WebViewLink])
def read_webview_links(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Retrieve all active webview links.
    """
    links = db.query(WebViewLinkModel).filter(WebViewLinkModel.is_active == True).offset(skip).limit(limit).all()
    return links

@router.get("/webview-links/all", response_model=List[WebViewLink])
def read_all_webview_links(db: Session = Depends(get_db)):
    """
    Retrieve all links for the admin panel (both active and inactive).
    """
    return db.query(WebViewLinkModel).all()


@router.post("/webview-links", response_model=WebViewLink, status_code=201)
def create_webview_link(link: WebViewLinkCreate, db: Session = Depends(get_db)):
    """
    Create a new webview link.
    """
    db_link = WebViewLinkModel(**link.dict())
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

@router.put("/webview-links/{link_id}", response_model=WebViewLink)
def update_webview_link(link_id: int, link: WebViewLinkUpdate, db: Session = Depends(get_db)):
    """
    Update an existing webview link.
    """
    db_link = db.query(WebViewLinkModel).filter(WebViewLinkModel.id == link_id).first()
    if db_link is None:
        raise HTTPException(status_code=404, detail="Link not found")

    update_data = link.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_link, key, value)

    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

@router.delete("/webview-links/{link_id}", status_code=204)
def delete_webview_link(link_id: int, db: Session = Depends(get_db)):
    """
    Delete a webview link.
    """
    db_link = db.query(WebViewLinkModel).filter(WebViewLinkModel.id == link_id).first()
    if db_link is None:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(db_link)
    db.commit()
    return {"ok": True}