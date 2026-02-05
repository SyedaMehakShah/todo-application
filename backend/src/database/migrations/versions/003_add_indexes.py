"""Add performance indexes

Revision ID: 003
Revises: 002
Create Date: 2026-01-08

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add performance indexes for tasks table."""
    # Critical index for user isolation queries (most common filter)
    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'])

    # Index for filtering tasks by completion status
    op.create_index('idx_tasks_completed', 'tasks', ['completed'])

    # Composite index for "get user's completed tasks" queries
    op.create_index('idx_tasks_user_completed', 'tasks', ['user_id', 'completed'])

    # Index for sorting tasks by creation date
    op.create_index('idx_tasks_created_at', 'tasks', ['created_at'])


def downgrade() -> None:
    """Drop performance indexes."""
    op.drop_index('idx_tasks_created_at', table_name='tasks')
    op.drop_index('idx_tasks_user_completed', table_name='tasks')
    op.drop_index('idx_tasks_completed', table_name='tasks')
    op.drop_index('idx_tasks_user_id', table_name='tasks')
