from pydantic import BaseModel
from typing import List, Optional
from schemas.track import TrackResponse

class FlowStep(BaseModel):
    track: TrackResponse
    match: Optional[float] = None          # similarity to the previous track, 0-100; None for the first
    bpm_change: Optional[int] = None
    energy_change: Optional[float] = None  # in percentage points

class SmartShuffleResponse(BaseModel):
    steps: List[FlowStep]
    harmony_score: float                   # average match across all transitions
    random_baseline: float                 # expected average match of a random shuffle of the same tracks
    skipped_tracks: int                    # tracks left out because they have no BPM or energy
    elapsed_ms: float
