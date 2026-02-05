@echo off
echo Setting up Python virtual environment...
cd /d "C:\Users\Admin\hackathon-2\backend"

REM Check if virtual environment exists, create if not
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo Running database migrations...
alembic upgrade head

echo Starting FastAPI backend server...
echo Backend will be available at: http://localhost:8000
echo API docs will be available at: http://localhost:8000/docs
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000