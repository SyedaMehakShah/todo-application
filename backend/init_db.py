"""
Script to initialize the database.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the project root to the path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.database.connection import init_db, engine
from src.models.user import User
from src.models.task import Task
from sqlmodel import SQLModel
from src.config import settings

async def create_tables():
    """Create all tables in the database."""
    print(f"Database URL: {settings.DATABASE_URL}")
    print(f"Current working directory: {os.getcwd()}")

    try:
        # For SQLite, we call init_db directly since it handles the sync operations
        await init_db()
        print("Tables created successfully!")

        # Check if the database file exists
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        print(f"Database file path: {db_path}")
        if os.path.exists(db_path):
            print("Database file exists!")
        else:
            print("Database file does not exist!")

    except Exception as e:
        print(f"Error creating tables: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_tables())