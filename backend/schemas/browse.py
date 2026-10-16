from fastapi import Query
from typing import Literal, Optional

SortField = Literal["recent", "title", "duration", "release_year", "bpm", "energy"]
SortAlgorithm = Literal["merge", "quick"]


class TrackFilters:
    """Query parameters for filtering tracks. Energy bounds are percentages (0-100)."""

    def __init__(
        self,
        genre: Optional[str] = None,
        min_bpm: Optional[int] = Query(None, ge=0),
        max_bpm: Optional[int] = Query(None, ge=0),
        min_energy: Optional[float] = Query(None, ge=0, le=100),
        max_energy: Optional[float] = Query(None, ge=0, le=100),
    ):
        self.genre = genre.strip() if genre and genre.strip() else None
        self.min_bpm = min_bpm
        self.max_bpm = max_bpm
        self.min_energy = min_energy
        self.max_energy = max_energy


class TrackSort:
    """Query parameters for sorting tracks. Order defaults to newest-first for 'recent', ascending otherwise."""

    def __init__(
        self,
        sort_by: SortField = "recent",
        order: Optional[Literal["asc", "desc"]] = None,
        algorithm: SortAlgorithm = "merge",
    ):
        self.sort_by = sort_by
        self.descending = (order or ("desc" if sort_by == "recent" else "asc")) == "desc"
        self.algorithm = algorithm
