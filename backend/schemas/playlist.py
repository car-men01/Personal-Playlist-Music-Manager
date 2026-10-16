from pydantic import BaseModel
from typing import List, Optional
from schemas.track import TrackResponse

class PlaylistBase(BaseModel):
    name: str

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistUpdate(PlaylistBase):
    pass

class PlaylistResponse(PlaylistBase):
    id: int
    tracks: List[TrackResponse] = []

    class Config:
        from_attributes = True