import random
import time
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from repositories.track_repository import TrackRepository
from schemas.track import TrackResponse
from services.playlist_service import PlaylistService
from services.shuffle_algorithms import feature_points, distance, match_percent, greedy_flow, mean_pairwise_distance
from services.sorting_algorithms import energy_percent


class ShuffleService:
    def __init__(self):
        self.track_repository = TrackRepository()
        self.playlist_service = PlaylistService()

    def smart_shuffle(self, db: Session, playlist_id: Optional[int], start_track_id: Optional[int],
                      previous_start_id: Optional[int]):
        """Orders a playlist (or the whole library) so each track flows into its nearest neighbour.

        With no start track, a random one is picked - avoiding `previous_start_id` so that
        "Regenerate" visibly changes the flow.
        """
        source = (self.playlist_service.get_playlist(db, playlist_id).tracks if playlist_id is not None
                  else self.track_repository.list_all(db))
        tracks = [t for t in source if t.bpm is not None and t.energy is not None]
        skipped = len(source) - len(tracks)

        if not tracks:
            return {"steps": [], "harmony_score": 0.0, "random_baseline": 0.0,
                    "skipped_tracks": skipped, "elapsed_ms": 0.0}

        ids = [t.id for t in tracks]
        if start_track_id is not None:
            if start_track_id not in ids:
                raise HTTPException(status_code=400, detail="Start track is not part of this selection")
            start = ids.index(start_track_id)
        else:
            candidates = [i for i, tid in enumerate(ids) if tid != previous_start_id] or list(range(len(ids)))
            start = random.choice(candidates)

        energies = [energy_percent(t.energy) for t in tracks]
        started = time.perf_counter()
        points = feature_points([t.bpm for t in tracks], energies)
        order = greedy_flow(points, start)
        elapsed_ms = (time.perf_counter() - started) * 1000

        steps = []
        for position, index in enumerate(order):
            step = {"track": TrackResponse.model_validate(tracks[index])}
            if position > 0:
                prev = order[position - 1]
                step["match"] = round(match_percent(distance(points[prev], points[index])), 1)
                step["bpm_change"] = tracks[index].bpm - tracks[prev].bpm
                step["energy_change"] = round(energies[index] - energies[prev], 1)
            steps.append(step)

        transitions = [s["match"] for s in steps[1:]]
        return {
            "steps": steps,
            "harmony_score": round(sum(transitions) / len(transitions), 1) if transitions else 100.0,
            "random_baseline": round(match_percent(mean_pairwise_distance(points)), 1) if transitions else 100.0,
            "skipped_tracks": skipped,
            "elapsed_ms": round(elapsed_ms, 4),
        }
