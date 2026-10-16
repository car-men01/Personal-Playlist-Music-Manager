import sys
import os

# Fix module imports when running script directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.database import SessionLocal, engine
from models.track import Base, Track
from models.playlist import Playlist

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    try:
        # Prevent duplicate seeding
        if db.query(Track).first():
            print("Database already contains data.")
            return

        # Create Sample Tracks
        t1 = Track(title="Velvet Skies", artist="Nova Lane", duration="3:48", genre="Dream Pop", bpm=112, energy=0.78)
        t2 = Track(title="Neon Tides", artist="Kaia Bloom", duration="4:12", genre="Alt R&B", bpm=118, energy=0.84)
        t3 = Track(title="Afterglow", artist="Lumen", duration="3:36", genre="Electronic", bpm=124, energy=0.92)
        t4 = Track(title="Pink Mirage", artist="Mira Sol", duration="3:29", genre="Nu Disco", bpm=115, energy=0.80)

        db.add_all([t1, t2, t3, t4])
        db.commit()

        # Refresh instances to get assigned IDs
        for track in [t1, t2, t3, t4]:
            db.refresh(track)

        # Create Sample Playlists & Add Tracks
        p1 = Playlist(name="Midnight Reverie")
        p2 = Playlist(name="Rose Quartz Radio")

        p1.tracks.extend([t1, t2])
        p2.tracks.extend([t2, t3, t4])

        db.add_all([p1, p2])
        db.commit()

        print("Successfully seeded tracks and playlists!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()