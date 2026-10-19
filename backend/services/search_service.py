from sqlalchemy.orm import Session

from repositories.track_repository import TrackRepository
from schemas.browse import TrackFilters, TrackSort
from services.sorting_algorithms import sort_tracks


class SearchService:
    def __init__(self):
        self.repository = TrackRepository()

    def exact_search(self, db: Session, query: str, field: str, filters: TrackFilters, sort: TrackSort):
        """Returns (tracks, sort_ms)."""
        tracks = self.repository.find_exact(db, query.strip(), field, filters)
        return sort_tracks(tracks, sort.sort_by, sort.descending, sort.algorithm)

    def autocomplete(self, db: Session, query: str, limit: int):
        text = query.strip()
        if not text:
            return []
        return self.repository.find_containing(db, text, limit)
