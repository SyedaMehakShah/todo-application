"""
WSGI/ASGI configuration for deployment platforms.
This file helps deployment platforms like Railway identify the application.
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

# Import the main application
from src.main import app as application

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )