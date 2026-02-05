#!/usr/bin/env bash
set -e  # Exit on any error

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Start FastAPI app on Railway port
echo "Starting FastAPI application..."
uvicorn src.main:app --host 0.0.0.0 --port $PORT
