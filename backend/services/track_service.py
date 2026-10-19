from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.track_repository import TrackRepository
from schemas.browse import TrackFilters, TrackSort
from schemas.track import TrackCreate, TrackUpdate
from services.sorting_algorithms import sort_tracks

class TrackService:
    def __init__(self):
        self.repository = TrackRepository()

    def get_tracks(self, db: Session, skip: int, limit: int, filters: TrackFilters, sort: TrackSort):
        """Filters in SQL, then sorts in Python with the chosen algorithm before paginating.

        Returns (tracks, sort_ms).
        """
        tracks = self.repository.get_filtered(db, filters)
        ordered, sort_ms = sort_tracks(tracks, sort.sort_by, sort.descending, sort.algorithm)
        return ordered[skip:skip + limit], sort_ms

    def get_track(self, db: Session, track_id: int):
        track = self.repository.get_by_id(db, track_id)
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        return track

    def create_track(self, db: Session, track: TrackCreate):
        return self.repository.create(db, track)

    def update_track(self, db: Session, track_id: int, track_update: TrackUpdate):
        db_track = self.get_track(db, track_id)
        return self.repository.update(db, db_track, track_update)

    def delete_track(self, db: Session, track_id: int):
        db_track = self.get_track(db, track_id)
        self.repository.delete(db, db_track)
        return {"message": "Track deleted successfully"}