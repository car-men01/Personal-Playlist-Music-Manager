from sqlalchemy import case, or_
from sqlalchemy.orm import Session
from models.track import Track
from schemas.browse import TrackFilters
from schemas.track import TrackCreate, TrackUpdate

# Energy is stored both as 0-1 and as 0-100; filter on the 0-100 scale
_energy_percent = case((Track.energy <= 1, Track.energy * 100), else_=Track.energy)

class TrackRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Track).offset(skip).limit(limit).all()

    def list_all(self, db: Session):
        return db.query(Track).all()

    def get_filtered(self, db: Session, filters: TrackFilters):
        return self.apply_filters(db.query(Track), filters).all()

    @staticmethod
    def apply_filters(query, filters: TrackFilters):
        if filters.genre:
            query = query.filter(Track.genre.collate("NOCASE") == filters.genre)
        if filters.min_bpm is not None:
            query = query.filter(Track.bpm >= filters.min_bpm)
        if filters.max_bpm is not None:
            query = query.filter(Track.bpm <= filters.max_bpm)
        if filters.min_energy is not None:
            query = query.filter(_energy_percent >= filters.min_energy)
        if filters.max_energy is not None:
            query = query.filter(_energy_percent <= filters.max_energy)
        return query

    def get_by_id(self, db: Session, track_id: int):
        return db.query(Track).filter(Track.id == track_id).first()

    def find_containing(self, db: Session, text: str, limit: int):
        # Case-insensitive substring match on title or artist (SQLite's LIKE ignores ASCII case).
        # Escape LIKE wildcards so a typed "%" or "_" is matched literally.
        escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        starts_with = Track.title.ilike(f"{escaped}%", escape="\\")
        return (db.query(Track)
                .filter(or_(Track.title.ilike(pattern, escape="\\"), Track.artist.ilike(pattern, escape="\\")))
                .order_by(case((starts_with, 0), else_=1), Track.title)  # titles starting with the text first
                .limit(limit)
                .all())

    def find_exact(self, db: Session, query: str, field: str, filters: TrackFilters):
        # COLLATE NOCASE matches the indexes created in core/database.py, so SQLite
        # answers with a B-tree lookup - O(log n) - instead of scanning the table.
        title_match = Track.title.collate("NOCASE") == query
        artist_match = Track.artist.collate("NOCASE") == query
        condition = {"title": title_match, "artist": artist_match}.get(field, or_(title_match, artist_match))
        return self.apply_filters(db.query(Track).filter(condition), filters).all()

    def create(self, db: Session, track: TrackCreate):
        db_track = Track(**track.model_dump())
        db.add(db_track)
        db.commit()
        db.refresh(db_track)
        return db_track

    def update(self, db: Session, db_track: Track, track_update: TrackUpdate):
        for key, value in track_update.model_dump(exclude_unset=True).items():
            setattr(db_track, key, value)
        db.commit()
        db.refresh(db_track)
        return db_track

    def delete(self, db: Session, db_track: Track):
        db.delete(db_track)
        db.commit()
        return True