"""
Entry point for the FastAPI application.
This file helps Railway detect the project as a Python/FastAPI application.
"""
from src.main import app

# This creates an alias for the main FastAPI app instance
# Railway can detect this as a Python web application
application = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)