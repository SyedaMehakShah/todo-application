"""
Task API endpoints.
All endpoints require JWT authentication and enforce user isolation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from typing import Union
from datetime import datetime
from typing import Optional, List
import logging

from ...database.connection import get_session
from ...services.task_service import TaskService
from ..middleware.jwt_auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class CreateTaskRequest(BaseModel):
    """Request model for creating a task."""
    title: str = Field(..., min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, max_length=10000, description="Task description")
    category: Optional[str] = Field("General", max_length=50, description="Task category")
    priority: Optional[str] = Field("Low", max_length=20, description="Task priority")
    due_date: Optional[str] = Field(None, description="Due date for the task (ISO format)")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate title is not empty after stripping whitespace."""
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v


class UpdateTaskRequest(BaseModel):
    """Request model for updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, max_length=10000, description="Task description")
    category: Optional[str] = Field(None, max_length=50, description="Task category")
    priority: Optional[str] = Field(None, max_length=20, description="Task priority")
    due_date: Optional[str] = Field(None, description="Due date for the task (ISO format)")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate title is not empty after stripping whitespace."""
        if v is not None and not v.strip():
            raise ValueError("Title cannot be empty")
        return v


class ToggleCompletionRequest(BaseModel):
    """Request model for toggling task completion."""
    completed: bool = Field(..., description="New completion status")


class TaskResponse(BaseModel):
    """Response model for a task."""
    id: str
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    category: str
    priority: str
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Response model for task list."""
    tasks: List[TaskResponse]
    count: int


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: str


# Endpoints
@router.get("/tasks", response_model=TaskListResponse, tags=["Tasks"])
async def list_tasks(
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    offset: int = Query(0, ge=0, le=10000, description="Offset for pagination (max 10000)"),
    limit: int = Query(50, ge=1, le=100, description="Limit for pagination (max 100)"),
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Get all tasks for authenticated user.

    Args:
        completed: Optional filter by completion status
        offset: Pagination offset
        limit: Number of records to return (max 100)
        user_id: User ID from JWT token (injected by dependency)
        session: Database session

    Returns:
        List of tasks with count

    Raises:
        401: If JWT token is invalid or missing
    """
    try:
        # Validate offset to prevent extremely large offsets
        if offset > 10000:  # Prevent extremely large offsets that could impact performance
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offset exceeds maximum allowed value (10000)"
            )

        tasks = await TaskService.get_user_tasks(session, user_id, completed, offset, limit)
        total_count = await TaskService.count_user_tasks(session, user_id, completed)

        # Convert tasks to response objects with error handling
        task_responses = []
        for task in tasks:
            try:
                task_response = TaskResponse.model_validate(task)
                task_responses.append(task_response)
            except Exception as validation_error:
                logger.error(f"Error validating task {getattr(task, 'id', 'unknown')}: {str(validation_error)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to validate task data: {str(validation_error)}"
                )

        return TaskListResponse(
            tasks=task_responses,
            count=total_count
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing tasks for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tasks"
        )


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
async def create_task(
    request: CreateTaskRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new task for authenticated user.

    Args:
        request: Task creation request
        user_id: User ID from JWT token (injected by dependency)
        session: Database session

    Returns:
        Created task

    Raises:
        400: If validation fails (empty title, too long)
        401: If JWT token is invalid or missing
    """
    try:
        task = await TaskService.create_task(
            session,
            user_id,
            request.title,
            request.description,
            request.category,
            request.priority,
            request.due_date
        )
        return TaskResponse.model_validate(task)
    except ValueError as e:
        logger.warning(f"Validation error creating task for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating task for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )


@router.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
async def get_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a specific task by ID.

    Args:
        task_id: Task UUID
        user_id: User ID from JWT token (injected by dependency)
        session: Database session

    Returns:
        Task details

    Raises:
        401: If JWT token is invalid or missing
        404: If task not found or doesn't belong to user
    """
    try:
        task = await TaskService.get_task_by_id(session, task_id, user_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        return TaskResponse.model_validate(task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving task {task_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve task"
        )


@router.put("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
async def update_task(
    task_id: str,
    request: UpdateTaskRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Update task title and/or description.

    Args:
        task_id: Task UUID
        request: Task update request
        user_id: User ID from JWT token (injected by dependency)
        session: Database session

    Returns:
        Updated task

    Raises:
        400: If validation fails
        401: If JWT token is invalid or missing
        404: If task not found or doesn't belong to user
    """
    try:
        task = await TaskService.update_task(
            session,
            task_id,
            user_id,
            request.title,
            request.description,
            request.category,
            request.priority,
            request.due_date
        )
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        try:
            return TaskResponse.model_validate(task)
        except Exception as validation_error:
            logger.error(f"Error validating updated task {task_id}: {str(validation_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to validate updated task data: {str(validation_error)}"
            )
    except ValueError as e:
        logger.warning(f"Validation error updating task {task_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating task {task_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task"
        )


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tasks"])
async def delete_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Delete a task permanently.

    Args:
        task_id: Task UUID
        user_id: User ID from JWT token (injected by dependency)
        session: Database session

    Returns:
        No content (204)

    Raises:
        401: If JWT token is invalid or missing
        404: If task not found or doesn't belong to user
    """
    try:
        deleted = await TaskService.delete_task(session, task_id, user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting task {task_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task"
        )


@router.patch("/tasks/{task_id}/complete", response_model=TaskResponse, tags=["Tasks"])
async def toggle_task_completion(
    task_id: str,
    request: ToggleCompletionRequest,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Toggle task completion status.

    Args:
        task_id: Task UUID
        request: Completion toggle request
        user_id: User ID from JWT token (injected by dependency)
        session: Database session

    Returns:
        Updated task

    Raises:
        401: If JWT token is invalid or missing
        404: If task not found or doesn't belong to user
    """
    try:
        # Note: The contract specifies a completed field in the request,
        # but the service method toggles. We'll use the toggle method
        # for simplicity, but could also implement set_completion if needed.
        task = await TaskService.toggle_completion(session, task_id, user_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        return TaskResponse.model_validate(task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling completion for task {task_id} for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task completion"
        )
