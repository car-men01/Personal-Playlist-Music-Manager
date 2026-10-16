from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.playlist_repository import PlaylistRepository
from repositories.track_repository import TrackRepository
from schemas.playlist import PlaylistCreate, PlaylistUpdate

class PlaylistService:
    def __init__(self):
        self.repository = PlaylistRepository()
        self.track_repository = TrackRepository()

    def get_playlists(self, db: Session, skip: int, limit: int):
        return self.repository.get_all(db, skip, limit)

    def get_playlist(self, db: Session, playlist_id: int):
        playlist = self.repository.get_by_id(db, playlist_id)
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        return playlist

    def create_playlist(self, db: Session, playlist: PlaylistCreate):
        return self.repository.create(db, playlist)

    def update_playlist(self, db: Session, playlist_id: int, playlist_update: PlaylistUpdate):
        db_playlist = self.get_playlist(db, playlist_id)
        return self.repository.update(db, db_playlist, playlist_update)

    def delete_playlist(self, db: Session, playlist_id: int):
        db_playlist = self.repository.get_by_id(db, playlist_id)
        if not db_playlist:
            return {"message": f"Playlist with ID {playlist_id} does not exist."}
        self.repository.delete(db, db_playlist)
        return {"message": "Playlist deleted successfully"}

    def add_track_to_playlist(self, db: Session, playlist_id: int, track_id: int):
        playlist = self.get_playlist(db, playlist_id)
        track = self.track_repository.get_by_id(db, track_id)
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        return self.repository.add_track(db, playlist, track)

    def remove_track_from_playlist(self, db: Session, playlist_id: int, track_id: int):
        playlist = self.get_playlist(db, playlist_id)
        track = self.track_repository.get_by_id(db, track_id)
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        return self.repository.remove_track(db, playlist, track)