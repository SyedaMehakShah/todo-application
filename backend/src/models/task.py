"""
Task model for todo items.
Each task belongs to a specific user and supports CRUD operations.
"""
from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional
import uuid


class Task(SQLModel, table=True):
    """
    Task entity representing a todo item.

    Attributes:
        id: Unique identifier (UUID)
        user_id: Foreign key to users table (enforces user isolation)
        title: Task title (required, max 500 chars)
        description: Optional task description
        completed: Task completion status (default: False)
        category: Task category (default: General)
        priority: Task priority (default: Low)
        due_date: Due date for the task (optional)
        created_at: Timestamp when task was created
        updated_at: Timestamp when task was last updated
    """
    __tablename__ = "tasks"

    # For SQLite compatibility, use str type for IDs but handle UUID conversion
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=500, min_length=1)
    description: Optional[str] = Field(default=None)
    completed: bool = Field(default=False, index=True)
    category: str = Field(default="General", max_length=50)
    priority: str = Field(default="Low", max_length=20)
    due_date: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        """SQLModel configuration."""
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "title": "Complete project documentation",
                "description": "Write comprehensive docs for the API",
                "completed": False,
                "category": "General",
                "priority": "Low",
                "due_date": "2026-01-15T10:00:00Z",
                "created_at": "2026-01-08T10:00:00Z",
                "updated_at": "2026-01-08T10:00:00Z",
            }
        }
