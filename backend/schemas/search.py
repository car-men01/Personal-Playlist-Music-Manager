from pydantic import BaseModel
from typing import List
from schemas.track import TrackResponse

class AutocompleteResponse(BaseModel):
    query: str
    suggestions: List[TrackResponse]
    total_matches: int
    indexed_tracks: int
    trie_ms: float
    linear_ms: float
