from sqlalchemy.orm import Session
from models.playlist import Playlist
from models.track import Track
from schemas.playlist import PlaylistCreate, PlaylistUpdate

class PlaylistRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Playlist).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, playlist_id: int):
        return db.query(Playlist).filter(Playlist.id == playlist_id).first()

    def create(self, db: Session, playlist: PlaylistCreate):
        db_playlist = Playlist(name=playlist.name)
        db.add(db_playlist)
        db.commit()
        db.refresh(db_playlist)
        return db_playlist

    def update(self, db: Session, db_playlist: Playlist, playlist_update: PlaylistUpdate):
        db_playlist.name = playlist_update.name
        db.commit()
        db.refresh(db_playlist)
        return db_playlist

    def delete(self, db: Session, db_playlist: Playlist):
        db.delete(db_playlist)
        db.commit()
        return True
        
    def add_track(self, db: Session, playlist: Playlist, track: Track):
        if track not in playlist.tracks:
            playlist.tracks.append(track)
            db.commit()
            db.refresh(playlist)
        return playlist
        
    def remove_track(self, db: Session, playlist: Playlist, track: Track):
        if track in playlist.tracks:
            playlist.tracks.remove(track)
            db.commit()
            db.refresh(playlist)
        return playlist