#!/usr/bin/env bash
set -e  # Exit on any error

echo "Starting deployment process..."

# Check if we're in the right directory
echo "Current directory: $(pwd)"
echo "Files in directory: $(ls -la)"

# Check if Python is available
echo "Python version: $(python --version 2>/dev/null || echo 'Python not found')"

# Check if pip is available
if ! command -v pip &> /dev/null; then
    echo "pip not found, checking for pip3..."
    if command -v pip3 &> /dev/null; then
        alias pip=pip3
        echo "Using pip3 as pip"
    else
        echo "Neither pip nor pip3 found!"
        exit 1
    fi
fi

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# Verify the main module exists
if [ ! -f "src/main.py" ]; then
    echo "Error: src/main.py not found!"
    exit 1
fi

# Start FastAPI app on Railway port
echo "Starting FastAPI application on port $PORT..."
python -m uvicorn src.main:app --host 0.0.0.0 --port $PORT --reload=false
