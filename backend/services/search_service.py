import heapq
import threading
import time

from sqlalchemy.orm import Session

from models.track import Track
from repositories.track_repository import TrackRepository
from schemas.browse import TrackFilters, TrackSort
from schemas.track import TrackResponse
from services.search_algorithms import Trie, tokenize, linear_prefix_search
from services.sorting_algorithms import sort_tracks


class TrackSearchIndex:
    """In-memory autocomplete index over track titles and artists.

    Built lazily from the database on first use, then kept in sync by TrackService.
    """

    def __init__(self):
        self._trie = Trie()
        self._tokens = {}   # track_id -> set of tokens (also the linear-search dataset)
        self._labels = {}   # track_id -> sort key for ranking suggestions
        self._built = False
        self._lock = threading.Lock()

    def ensure_built(self, db: Session):
        with self._lock:
            if self._built:
                return
            for track_id, title, artist in db.query(Track.id, Track.title, Track.artist):
                self._index(track_id, title, artist)
            self._built = True

    def upsert(self, track: Track):
        with self._lock:
            if not self._built:
                return
            self._unindex(track.id)
            self._index(track.id, track.title, track.artist)

    def remove(self, track_id: int):
        with self._lock:
            if self._built:
                self._unindex(track_id)

    def prefix_search(self, db: Session, prefix: str, limit: int):
        """Runs the Trie and the linear scan on the same data and times both."""
        self.ensure_built(db)
        with self._lock:
            start = time.perf_counter()
            trie_ids = self._trie.starts_with(prefix)
            trie_ms = (time.perf_counter() - start) * 1000

            start = time.perf_counter()
            linear_prefix_search(self._tokens.items(), prefix)
            linear_ms = (time.perf_counter() - start) * 1000

            top_ids = heapq.nsmallest(limit, trie_ids, key=self._labels.__getitem__)
            return top_ids, len(trie_ids), len(self._tokens), trie_ms, linear_ms

    def _index(self, track_id, title, artist):
        tokens = tokenize(title, artist)
        self._tokens[track_id] = tokens
        self._labels[track_id] = ((title or "").lower(), (artist or "").lower())
        for token in tokens:
            self._trie.insert(token, track_id)

    def _unindex(self, track_id):
        for token in self._tokens.pop(track_id, ()):
            self._trie.remove(token, track_id)
        self._labels.pop(track_id, None)


search_index = TrackSearchIndex()


class SearchService:
    def __init__(self):
        self.repository = TrackRepository()

    def exact_search(self, db: Session, query: str, field: str, filters: TrackFilters, sort: TrackSort):
        """Returns (tracks, sort_ms)."""
        tracks = self.repository.find_exact(db, query.strip(), field, filters)
        return sort_tracks(tracks, sort.sort_by, sort.descending, sort.algorithm)

    def autocomplete(self, db: Session, query: str, limit: int):
        prefix = query.strip().lower()
        if not prefix:
            return {"query": query, "suggestions": [], "total_matches": 0,
                    "indexed_tracks": 0, "trie_ms": 0.0, "linear_ms": 0.0}

        top_ids, total, indexed, trie_ms, linear_ms = search_index.prefix_search(db, prefix, limit)
        by_id = {t.id: t for t in self.repository.get_by_ids(db, top_ids)}
        suggestions = [TrackResponse.model_validate(by_id[i]) for i in top_ids if i in by_id]

        return {
            "query": query,
            "suggestions": suggestions,
            "total_matches": total,
            "indexed_tracks": indexed,
            "trie_ms": round(trie_ms, 4),
            "linear_ms": round(linear_ms, 4),
        }
