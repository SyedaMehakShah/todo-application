"""
Gunicorn configuration for production deployment.
"""
import os

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Worker processes
workers = 1  # For FastAPI/ASGI apps, usually 1-4 workers
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000

# Timeout
timeout = 30

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "todo_backend"

# Server mechanics
preload_app = True
daemon = False