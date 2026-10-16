from sqlalchemy.orm import Session
from models.track import Track
from schemas.track import TrackCreate, TrackUpdate

class TrackRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Track).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, track_id: int):
        return db.query(Track).filter(Track.id == track_id).first()

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