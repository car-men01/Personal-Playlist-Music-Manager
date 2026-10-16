from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def apply_migrations():
    # create_all() only creates missing tables, so bring databases made by older
    # versions of the app up to date. Every step is safe to run on each startup.
    with engine.begin() as conn:
        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(tracks)"))}
        if "release_year" not in columns:
            conn.execute(text("ALTER TABLE tracks ADD COLUMN release_year INTEGER"))

        # Case-insensitive B-tree indexes used by exact search
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tracks_title_nocase ON tracks (title COLLATE NOCASE)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tracks_artist_nocase ON tracks (artist COLLATE NOCASE)"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()