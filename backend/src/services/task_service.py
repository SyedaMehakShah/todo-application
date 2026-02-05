"""
Task service for CRUD operations with user isolation.
All operations enforce user_id filtering to ensure data isolation.
"""
from sqlmodel import select, delete
from sqlalchemy import and_
from sqlmodel.ext.asyncio.session import AsyncSession
from uuid import UUID
from datetime import datetime
from typing import List, Optional
import logging
import bleach

from ..models.task import Task

logger = logging.getLogger(__name__)


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent XSS attacks.

    Args:
        text: Input text to sanitize

    Returns:
        Sanitized text with dangerous HTML removed
    """
    if not text:
        return text

    # Strip all HTML tags and attributes to prevent XSS
    sanitized = bleach.clean(
        text,
        tags=[],  # No HTML tags allowed
        attributes={},  # No attributes allowed
        strip=True  # Remove tags entirely
    )

    return sanitized.strip()


class TaskService:
    """
    Service layer for task operations.

    All methods enforce user isolation by filtering queries with user_id.
    This ensures users can only access their own tasks.
    """

    @staticmethod
    async def get_user_tasks(
        session: AsyncSession,
        user_id: str,
        completed: Optional[bool] = None,
        offset: int = 0,
        limit: int = 100
    ) -> List[Task]:
        """
        Get tasks for a specific user with pagination.

        Args:
            session: Database session
            user_id: User ID to filter tasks
            completed: Optional filter by completion status
            offset: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of tasks belonging to the user
        """
        query = select(Task).where(Task.user_id == user_id)

        if completed is not None:
            query = query.where(Task.completed == completed)

        query = query.order_by(Task.created_at.desc()).offset(offset).limit(limit)

        result = await session.execute(query)
        tasks = result.scalars().all()

        logger.info(f"Retrieved {len(tasks)} tasks for user {user_id} with offset {offset} and limit {limit}")
        return tasks

    @staticmethod
    async def count_user_tasks(
        session: AsyncSession,
        user_id: str,
        completed: Optional[bool] = None
    ) -> int:
        """
        Count tasks for a specific user.

        Args:
            session: Database session
            user_id: User ID to filter tasks
            completed: Optional filter by completion status

        Returns:
            Total count of tasks for the user
        """
        from sqlalchemy import func
        query = select(func.count(Task.id)).where(Task.user_id == user_id)

        if completed is not None:
            query = query.where(Task.completed == completed)

        result = await session.execute(query)
        count = result.scalar()

        logger.info(f"Counted {count} tasks for user {user_id}")
        return count

    @staticmethod
    async def get_task_by_id(
        session: AsyncSession,
        task_id: str,
        user_id: str
    ) -> Optional[Task]:
        """
        Get a specific task by ID, verifying it belongs to the user.

        Args:
            session: Database session
            task_id: Task ID to retrieve
            user_id: User ID to verify ownership

        Returns:
            Task if found and belongs to user, None otherwise
        """
        query = select(Task).where(
            and_(Task.id == task_id, Task.user_id == user_id)  # CRITICAL: User isolation
        )

        result = await session.execute(query)
        task = result.scalar_one_or_none()

        if task:
            logger.info(f"Retrieved task {task_id} for user {user_id}")
        else:
            logger.warning(f"Task {task_id} not found for user {user_id}")

        return task

    @staticmethod
    async def create_task(
        session: AsyncSession,
        user_id: str,
        title: str,
        description: Optional[str] = None,
        category: str = "General",
        priority: str = "Low",
        due_date: Optional[str] = None
    ) -> Task:
        """
        Create a new task for a user.

        Args:
            session: Database session
            user_id: User ID (from JWT token)
            title: Task title (required, not empty)
            description: Optional task description
            category: Task category (default: General)
            priority: Task priority (default: Low)
            due_date: Due date for the task (optional, ISO format)

        Returns:
            Created task

        Raises:
            ValueError: If title is empty
        """
        # Sanitize inputs to prevent XSS
        sanitized_title = sanitize_input(title)
        sanitized_description = sanitize_input(description) if description else None
        sanitized_category = sanitize_input(category) if category else "General"
        sanitized_priority = sanitize_input(priority) if priority else "Low"

        # Validate title
        if not sanitized_title or not sanitized_title.strip():
            raise ValueError("Task title cannot be empty")

        if len(sanitized_title) > 500:
            raise ValueError("Task title exceeds maximum length of 500 characters")

        # Validate description if provided
        if sanitized_description and len(sanitized_description) > 10000:
            raise ValueError("Task description exceeds maximum length of 10000 characters")

        # Parse due_date if provided
        parsed_due_date = None
        if due_date:
            try:
                parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            except ValueError:
                # If parsing fails, ignore the due_date
                logger.warning(f"Invalid due_date format: {due_date}")
                parsed_due_date = None

        task = Task(
            user_id=user_id,
            title=sanitized_title.strip(),
            description=sanitized_description.strip() if sanitized_description else None,
            completed=False,
            category=sanitized_category,
            priority=sanitized_priority,
            due_date=parsed_due_date
        )

        session.add(task)
        await session.commit()
        await session.refresh(task)

        logger.info(f"Created task {task.id} for user {user_id}")
        return task

    @staticmethod
    async def update_task(
        session: AsyncSession,
        task_id: str,
        user_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None
    ) -> Optional[Task]:
        """
        Update a task's title and/or description.

        Args:
            session: Database session
            task_id: Task ID to update
            user_id: User ID to verify ownership
            title: New title (optional)
            description: New description (optional)
            category: New category (optional)
            priority: New priority (optional)
            due_date: New due date (optional, ISO format)

        Returns:
            Updated task if found and belongs to user, None otherwise

        Raises:
            ValueError: If title is provided but empty
        """
        # Verify ownership and get task
        task = await TaskService.get_task_by_id(session, task_id, user_id)
        if not task:
            return None

        # Update fields if provided
        if title is not None:
            # Sanitize input to prevent XSS
            sanitized_title = sanitize_input(title)
            if not sanitized_title.strip():
                raise ValueError("Task title cannot be empty")

            if len(sanitized_title) > 500:
                raise ValueError("Task title exceeds maximum length of 500 characters")

            task.title = sanitized_title.strip()

        if description is not None:
            # Sanitize input to prevent XSS
            sanitized_description = sanitize_input(description)

            if len(sanitized_description) > 10000:
                raise ValueError("Task description exceeds maximum length of 10000 characters")

            task.description = sanitized_description.strip() if sanitized_description else None

        if category is not None:
            # Sanitize input to prevent XSS
            sanitized_category = sanitize_input(category)
            task.category = sanitized_category if sanitized_category else "General"

        if priority is not None:
            # Sanitize input to prevent XSS
            sanitized_priority = sanitize_input(priority)
            task.priority = sanitized_priority if sanitized_priority else "Low"

        if due_date is not None:
            # Parse due_date if provided
            try:
                if due_date:
                    task.due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                else:
                    task.due_date = None
            except ValueError:
                # If parsing fails, ignore the due_date
                logger.warning(f"Invalid due_date format: {due_date}")

        # Update timestamp
        task.updated_at = datetime.now()

        session.add(task)
        await session.commit()
        await session.refresh(task)

        logger.info(f"Updated task {task_id} for user {user_id}")
        return task

    @staticmethod
    async def delete_task(
        session: AsyncSession,
        task_id: str,
        user_id: str
    ) -> bool:
        """
        Delete a task.

        Args:
            session: Database session
            task_id: Task ID to delete
            user_id: User ID to verify ownership

        Returns:
            True if task was deleted, False if not found or not owned by user
        """
        # Verify ownership and get task
        task = await TaskService.get_task_by_id(session, task_id, user_id)
        if not task:
            return False

        try:
            # Alternative approach: Use direct delete query instead of session.delete()
            from sqlmodel import delete
            stmt = delete(Task).where(Task.id == task_id, Task.user_id == user_id)
            result = await session.exec(stmt)
            await session.commit()
            
            # Check if any rows were affected
            if result.rowcount > 0:
                logger.info(f"Deleted task {task_id} for user {user_id}")
                return True
            else:
                logger.warning(f"No task deleted with id {task_id} for user {user_id}")
                return False
        except Exception as e:
            logger.error(f"Error during delete operation for task {task_id}: {str(e)}")
            await session.rollback()
            raise

    @staticmethod
    async def toggle_completion(
        session: AsyncSession,
        task_id: str,
        user_id: str
    ) -> Optional[Task]:
        """
        Toggle a task's completion status.

        Args:
            session: Database session
            task_id: Task ID to toggle
            user_id: User ID to verify ownership

        Returns:
            Updated task if found and belongs to user, None otherwise
        """
        # Verify ownership and get task
        task = await TaskService.get_task_by_id(session, task_id, user_id)
        if not task:
            return None

        # Toggle completion status
        task.completed = not task.completed
        task.updated_at = datetime.now()

        session.add(task)
        await session.commit()
        await session.refresh(task)

        logger.info(
            f"Toggled task {task_id} completion to {task.completed} for user {user_id}"
        )
        return task
