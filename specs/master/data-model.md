# Data Model: Phase II Todo Full-Stack Web Application

**Date**: 2026-01-08
**Input**: Feature specification from specs/master/spec.md
**Purpose**: Define database schema, entities, relationships, and validation rules

## Overview

The application uses two primary entities: **User** (managed by Better Auth) and **Task** (custom implementation). User isolation is enforced at the database query level through foreign key relationships and query filters.

## Entities

### User Entity

**Purpose**: Represents an authenticated user account in the system.

**Management**: Handled by Better Auth library, which manages user table schema, password hashing, and authentication flows.

**Schema**:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**SQLModel Definition** (backend/src/models/user.py):

```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    email_verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Validation Rules**:
- Email must be valid format (RFC 5322)
- Email must be unique across all users
- Password must be hashed using bcrypt/argon2 (never stored plain)
- Password minimum length: 8 characters (enforced at API level)

**Relationships**:
- One User → Many Tasks (one-to-many)

**State Transitions**: N/A (users don't have state transitions)

---

### Task Entity

**Purpose**: Represents a todo item belonging to a specific user.

**Management**: Custom implementation with full CRUD operations.

**Schema**:

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

**SQLModel Definition** (backend/src/models/task.py):

```python
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=500, min_length=1)
    description: Optional[str] = Field(default=None)
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship (optional, for ORM convenience)
    # user: Optional["User"] = Relationship(back_populates="tasks")
```

**Validation Rules**:
- Title is required (cannot be empty or null)
- Title maximum length: 500 characters
- Description is optional (can be null)
- Description maximum length: 10,000 characters (enforced at API level)
- user_id must reference a valid user (foreign key constraint)
- completed defaults to False

**Relationships**:
- Many Tasks → One User (many-to-one via user_id foreign key)

**State Transitions**:

```
[Created] → completed = False
    ↓
[Mark Complete] → completed = True
    ↓
[Mark Incomplete] → completed = False
    ↓
[Update] → title/description changed, updated_at refreshed
    ↓
[Delete] → Task removed from database
```

**Query Patterns**:

All task queries MUST filter by user_id to enforce user isolation:

```python
# ✅ CORRECT: User-filtered query
tasks = session.exec(
    select(Task).where(Task.user_id == current_user_id)
).all()

# ❌ WRONG: No user filter (security violation)
tasks = session.exec(select(Task)).all()
```

---

## Relationships Diagram

```
┌─────────────────┐
│     User        │
│  (Better Auth)  │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ password_hash   │
│ email_verified  │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│      Task       │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │◄─── Foreign Key to users.id
│ title           │
│ description     │
│ completed       │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

---

## Index Strategy

### Performance Optimization

**User Table**:
- `idx_users_email` (UNIQUE): Fast lookup during authentication
- `idx_users_created_at`: Analytics queries (user growth over time)

**Task Table**:
- `idx_tasks_user_id`: Critical for user isolation queries (most common filter)
- `idx_tasks_completed`: Filter tasks by completion status
- `idx_tasks_user_completed` (composite): Optimizes "get user's completed tasks" queries
- `idx_tasks_created_at`: Sort tasks by creation date

**Query Performance Targets**:
- User lookup by email: <10ms
- Task list by user_id: <50ms (even with 10k tasks per user)
- Task update: <20ms
- Task creation: <30ms

---

## Migration Strategy

**Tool**: Alembic (SQLAlchemy migration tool, compatible with SQLModel)

**Migration Files** (backend/src/database/migrations/):

1. **001_create_users_table.py**: Create users table (Better Auth schema)
2. **002_create_tasks_table.py**: Create tasks table with foreign key to users
3. **003_add_indexes.py**: Add performance indexes

**Migration Commands**:
```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Data Integrity Rules

### Foreign Key Constraints

- `tasks.user_id` → `users.id` with `ON DELETE CASCADE`
  - When a user is deleted, all their tasks are automatically deleted
  - Prevents orphaned tasks in the database

### Unique Constraints

- `users.email` must be unique (enforced at database level)

### Not Null Constraints

- `users.email`, `users.password_hash`: Required for authentication
- `tasks.user_id`, `tasks.title`: Required for task functionality

### Check Constraints (optional, can be added later)

```sql
-- Ensure title is not empty string
ALTER TABLE tasks ADD CONSTRAINT check_title_not_empty
    CHECK (LENGTH(TRIM(title)) > 0);

-- Ensure email format (basic check)
ALTER TABLE users ADD CONSTRAINT check_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
```

---

## Security Considerations

### User Isolation Enforcement

**Database Level**:
- Foreign key constraints ensure tasks belong to valid users
- Indexes on user_id enable fast filtered queries

**Application Level** (CRITICAL):
- ALL task queries MUST include `WHERE user_id = ?` filter
- JWT middleware extracts user_id from token
- Service layer enforces user_id filter on all operations

**Example Service Pattern**:

```python
class TaskService:
    def get_user_tasks(self, user_id: UUID) -> List[Task]:
        """Get all tasks for a specific user."""
        return session.exec(
            select(Task).where(Task.user_id == user_id)
        ).all()

    def get_task_by_id(self, task_id: UUID, user_id: UUID) -> Optional[Task]:
        """Get a task only if it belongs to the user."""
        return session.exec(
            select(Task)
            .where(Task.id == task_id)
            .where(Task.user_id == user_id)  # CRITICAL: User isolation
        ).first()
```

### Password Security

- Passwords NEVER stored in plain text
- Hashing algorithm: bcrypt or argon2 (Better Auth default)
- Password validation at API level (length, complexity)

### Timestamp Integrity

- `created_at` set once on creation (immutable)
- `updated_at` refreshed on every update
- Timestamps use UTC timezone for consistency

---

## Validation Summary

| Field | Required | Type | Constraints | Validation Location |
|-------|----------|------|-------------|---------------------|
| user.email | Yes | String | Unique, valid format, max 255 chars | API + DB |
| user.password | Yes | String | Min 8 chars, hashed | API (plain) → DB (hashed) |
| task.user_id | Yes | UUID | Must reference valid user | DB (foreign key) |
| task.title | Yes | String | Not empty, max 500 chars | API + DB |
| task.description | No | String | Max 10k chars | API |
| task.completed | Yes | Boolean | Default false | DB |

---

## Future Enhancements (Out of Scope for Phase II)

- Task categories/tags (many-to-many relationship)
- Task priority levels (enum field)
- Task due dates (datetime field)
- Task sharing between users (permissions table)
- Task attachments (file storage integration)
- Soft deletes (deleted_at timestamp instead of hard delete)
