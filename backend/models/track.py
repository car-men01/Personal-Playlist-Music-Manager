from sqlalchemy import Column, Integer, String, Float
from core.database import Base

class Track(Base):
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    artist = Column(String, index=True)
    duration = Column(String)
    genre = Column(String, index=True)
    bpm = Column(Integer)
    energy = Column(Float)