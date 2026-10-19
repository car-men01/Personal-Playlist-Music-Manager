from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import List, Literal, Optional

from core.database import get_db
from schemas.track import TrackResponse, TrackCreate, TrackUpdate
from services.track_service import TrackService
from schemas.playlist import PlaylistResponse, PlaylistCreate, PlaylistUpdate
from services.playlist_service import PlaylistService
from services.search_service import SearchService
from schemas.browse import TrackFilters, TrackSort
from services.sorting_algorithms import ALGORITHM_NAMES
from schemas.shuffle import SmartShuffleResponse
from services.shuffle_service import ShuffleService

router = APIRouter()
track_service = TrackService()
playlist_service = PlaylistService()
search_service = SearchService()
shuffle_service = ShuffleService()

def _set_sort_headers(response: Response, sort: TrackSort, sort_ms: float):
    # Headers rather than body fields so the list response shape stays unchanged
    response.headers["X-Sort-Algorithm"] = ALGORITHM_NAMES[sort.algorithm]
    response.headers["X-Sort-Time-Ms"] = f"{sort_ms:.4f}"

@router.get("/tracks/", response_model=List[TrackResponse], tags=["Tracks"])
def get_tracks(response: Response, skip: int = 0, limit: int = 100,
               filters: TrackFilters = Depends(), sort: TrackSort = Depends(), db: Session = Depends(get_db)):
    tracks, sort_ms = track_service.get_tracks(db, skip, limit, filters, sort)
    _set_sort_headers(response, sort, sort_ms)
    return tracks

@router.get("/tracks/{track_id}", response_model=TrackResponse, tags=["Tracks"])
def get_track(track_id: int, db: Session = Depends(get_db)):
    return track_service.get_track(db, track_id)

@router.post("/tracks/", response_model=TrackResponse, tags=["Tracks"])
def create_track(track: TrackCreate, db: Session = Depends(get_db)):
    return track_service.create_track(db, track)

@router.put("/tracks/{track_id}", response_model=TrackResponse, tags=["Tracks"])
def update_track(track_id: int, track: TrackUpdate, db: Session = Depends(get_db)):
    return track_service.update_track(db, track_id, track)

@router.delete("/tracks/{track_id}", tags=["Tracks"])
def delete_track(track_id: int, db: Session = Depends(get_db)):
    return track_service.delete_track(db, track_id)

# ==================== SEARCH ENDPOINTS ====================

@router.get("/search/exact", response_model=List[TrackResponse], tags=["Search"])
def exact_search(response: Response, q: str, field: Literal["any", "title", "artist"] = "any",
                 filters: TrackFilters = Depends(), sort: TrackSort = Depends(), db: Session = Depends(get_db)):
    tracks, sort_ms = search_service.exact_search(db, q, field, filters, sort)
    _set_sort_headers(response, sort, sort_ms)
    return tracks

@router.get("/search/autocomplete", response_model=List[TrackResponse], tags=["Search"])
def autocomplete(q: str, limit: int = Query(8, ge=1, le=50), db: Session = Depends(get_db)):
    return search_service.autocomplete(db, q, limit)

# ==================== PLAYLISTS ENDPOINTS ====================

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
# ==================== SMART SHUFFLE ENDPOINTS ====================

@router.get("/shuffle/smart", response_model=SmartShuffleResponse, tags=["Smart Shuffle"])
def smart_shuffle(playlist_id: Optional[int] = None, start_track_id: Optional[int] = None,
                  previous_start_id: Optional[int] = None, db: Session = Depends(get_db)):
    return shuffle_service.smart_shuffle(db, playlist_id, start_track_id, previous_start_id)
