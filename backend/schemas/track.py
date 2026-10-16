from pydantic import BaseModel
from typing import Optional

class TrackBase(BaseModel):
    title: str
    artist: str
    duration: Optional[str] = None
    genre: Optional[str] = None
    bpm: Optional[int] = None
    energy: Optional[float] = None

class TrackCreate(TrackBase):
    pass

class TrackUpdate(TrackBase):
    pass

class TrackResponse(TrackBase):
    id: int

    class Config:
        from_attributes = True