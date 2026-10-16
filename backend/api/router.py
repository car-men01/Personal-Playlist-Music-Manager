from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from schemas.track import TrackResponse, TrackCreate, TrackUpdate
from services.track_service import TrackService

router = APIRouter(prefix="/tracks", tags=["Tracks"])
track_service = TrackService()

@router.get("/", response_model=List[TrackResponse])
def get_tracks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return track_service.get_tracks(db, skip, limit)

@router.get("/{track_id}", response_model=TrackResponse)
def get_track(track_id: int, db: Session = Depends(get_db)):
    return track_service.get_track_or_404(db, track_id)

@router.post("/", response_model=TrackResponse)
def create_track(track: TrackCreate, db: Session = Depends(get_db)):
    return track_service.create_track(db, track)

@router.put("/{track_id}", response_model=TrackResponse)
def update_track(track_id: int, track: TrackUpdate, db: Session = Depends(get_db)):
    return track_service.update_track(db, track_id, track)

@router.delete("/{track_id}")
def delete_track(track_id: int, db: Session = Depends(get_db)):
    return track_service.delete_track(db, track_id)