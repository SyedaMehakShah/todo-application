#!/bin/bash
cd "C:\Users\Admin\hackathon-2\backend"

echo "🔧 Setting up Python virtual environment..."
python -m venv venv

echo "📦 Activating virtual environment..."
source venv/Scripts/activate

echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

echo "🗄️ Running database migrations..."
alembic upgrade head

echo "🚀 Starting FastAPI backend server..."
echo "Backend will be available at: http://localhost:8000"
echo "API docs will be available at: http://localhost:8000/docs"
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
