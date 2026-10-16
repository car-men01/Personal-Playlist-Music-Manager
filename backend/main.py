from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import engine, apply_migrations
from models.track import Base
from models.playlist import Playlist
from api.router import router

# Create database tables automatically
Base.metadata.create_all(bind=engine)
apply_migrations()

app = FastAPI(title="Personal Music Playlist Manager API")

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Sort-Algorithm", "X-Sort-Time-Ms"],
)

# Connect the API endpoints
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Music Manager Backend is Running"}