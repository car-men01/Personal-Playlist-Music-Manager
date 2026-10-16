from core.database import SessionLocal
from models.track import Track

def clear_data():
    db = SessionLocal()
    try:
        # Delete all records from the Track table
        num_deleted = db.query(Track).delete()
        db.commit()
        print(f"Database cleared successfully. Deleted {num_deleted} tracks.")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_data()