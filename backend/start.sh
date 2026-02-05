#!/bin/bash
# Go to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI app on Railway port
uvicorn main:app --host 0.0.0.0 --port $PORT
