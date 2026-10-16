from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from schemas.track import TrackResponse, TrackCreate, TrackUpdate
from services.track_service import TrackService
from schemas.playlist import PlaylistResponse, PlaylistCreate, PlaylistUpdate
from services.playlist_service import PlaylistService

router = APIRouter(prefix="/tracks", tags=["Tracks"])
track_service = TrackService()
playlist_service = PlaylistService()

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

@router.get("/playlists/", response_model=List[PlaylistResponse], tags=["Playlists"])
def get_playlists(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return playlist_service.get_playlists(db, skip, limit)

@router.get("/playlists/{playlist_id}", response_model=PlaylistResponse, tags=["Playlists"])
def get_playlist(playlist_id: int, db: Session = Depends(get_db)):
    return playlist_service.get_playlist(db, playlist_id)

@router.post("/playlists/", response_model=PlaylistResponse, tags=["Playlists"])
def create_playlist(playlist: PlaylistCreate, db: Session = Depends(get_db)):
    return playlist_service.create_playlist(db, playlist)

@router.put("/playlists/{playlist_id}", response_model=PlaylistResponse, tags=["Playlists"])
def update_playlist(playlist_id: int, playlist: PlaylistUpdate, db: Session = Depends(get_db)):
    return playlist_service.update_playlist(db, playlist_id, playlist)

@router.delete("/playlists/{playlist_id}", tags=["Playlists"])
def delete_playlist(playlist_id: int, db: Session = Depends(get_db)):
    return playlist_service.delete_playlist(db, playlist_id)

@router.post("/playlists/{playlist_id}/tracks/{track_id}", response_model=PlaylistResponse, tags=["Playlists"])
def add_track_to_playlist(playlist_id: int, track_id: int, db: Session = Depends(get_db)):
    return playlist_service.add_track_to_playlist(db, playlist_id, track_id)

@router.delete("/playlists/{playlist_id}/tracks/{track_id}", response_model=PlaylistResponse, tags=["Playlists"])
def remove_track_from_playlist(playlist_id: int, track_id: int, db: Session = Depends(get_db)):
    return playlist_service.remove_track_from_playlist(db, playlist_id, track_id)