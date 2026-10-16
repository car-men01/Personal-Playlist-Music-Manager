from core.database import SessionLocal, engine
from models.track import Base, Track

def seed_data():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(Track).count() == 0:
        tracks = [
            Track(title="Velvet Skies", artist="Nova Lane", duration="3:48", genre="Dream Pop", bpm=112, energy=78.0),
            Track(title="Neon Tides", artist="Kaia Bloom", duration="4:12", genre="Alt R&B", bpm=118, energy=84.0),
            Track(title="Afterglow", artist="Lumen", duration="3:36", genre="Electronic", bpm=124, energy=92.0),
            Track(title="Soft Static", artist="The Sundry", duration="4:05", genre="Indie Pop", bpm=108, energy=65.0),
            Track(title="Pink Mirage", artist="Mira Sol", duration="3:29", genre="Nu Disco", bpm=120, energy=88.0),
            Track(title="Slow Orbit", artist="Juno Vale", duration="5:01", genre="Ambient", bpm=96, energy=48.0),
            Track(title="Midnight Echo", artist="Echo Valley", duration="2:55", genre="Synthwave", bpm=105, energy=70.0),
            Track(title="Solar Drift", artist="Aura", duration="4:22", genre="Chillwave", bpm=98, energy=55.0)
        ]
        
        db.add_all(tracks)
        db.commit()
        print(f"Database seeded successfully with {len(tracks)} tracks.")
    else:
        print("Database already contains data. Skipping seed.")
        
    db.close()

if __name__ == "__main__":
    seed_data()