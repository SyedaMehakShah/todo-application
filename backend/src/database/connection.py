"""
Database connection setup for Neon PostgreSQL.
Provides async engine and session management.
Supports both async PostgreSQL and sync SQLite for local development.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker, AsyncEngine
from sqlalchemy import create_engine as sync_create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from typing import AsyncGenerator, Union
import asyncio
import logging

from ..config import settings

logger = logging.getLogger(__name__)

# Determine if we're using SQLite (for local development) or PostgreSQL
if settings.DATABASE_URL.startswith("sqlite"):
    # For SQLite, we need to use sync engine wrapped in async interface
    sync_engine = sync_create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},  # Required for SQLite
        poolclass=StaticPool,  # Required for SQLite in async contexts
    )

    # Create sync session factory
    SyncSessionLocal = sessionmaker(
        bind=sync_engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    # Create a wrapper to provide async interface for sync operations
    class AsyncSQLiteEngine:
        def __init__(self, sync_engine):
            self.sync_engine = sync_engine

        def begin(self):
            # Return a context manager that wraps the sync session
            class AsyncTransaction:
                def __init__(self, sync_engine):
                    self.sync_engine = sync_engine
                    self.session = None

                async def __aenter__(self):
                    self.session = SyncSessionLocal()
                    return self

                async def __aexit__(self, exc_type, exc_val, exc_tb):
                    if exc_type is None:
                        await asyncio.get_event_loop().run_in_executor(None, self.session.commit)
                    else:
                        await asyncio.get_event_loop().run_in_executor(None, self.session.rollback)
                    await asyncio.get_event_loop().run_in_executor(None, self.session.close)

                async def run_sync(self, func, *args, **kwargs):
                    # Call the function with the session and any additional args
                    def call_func(sess, *func_args, **func_kwargs):
                        return func(sess, *func_args, **func_kwargs)

                    return await asyncio.get_event_loop().run_in_executor(None, call_func, self.session, *args, **kwargs)

            return AsyncTransaction(self.sync_engine)

        async def dispose(self):
            # SQLite doesn't need explicit disposal in most cases
            pass

    engine = AsyncSQLiteEngine(sync_engine)

    # Create async session factory wrapper
    class AsyncSessionLocalWrapper:
        def __init__(self, sync_session_local):
            self.sync_session_local = sync_session_local

        async def __aenter__(self):
            sync_session = self.sync_session_local()
            return AsyncSessionWrapper(sync_session)

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass  # Handled in AsyncSessionWrapper

    class AsyncSessionWrapper:
        def __init__(self, sync_session):
            self.sync_session = sync_session


        def add(self, obj):
            """Add an object to the session."""
            # For sync session, add is synchronous
            self.sync_session.add(obj)

        async def commit(self):
            """Commit the transaction."""
            # For sync session, commit is synchronous but wrapped for async
            await asyncio.get_event_loop().run_in_executor(None, self.sync_session.commit)

        async def rollback(self):
            """Rollback the transaction."""
            # For sync session, rollback is synchronous but wrapped for async
            await asyncio.get_event_loop().run_in_executor(None, self.sync_session.rollback)

        async def close(self):
            # For sync session, close is synchronous but wrapped for async
            await asyncio.get_event_loop().run_in_executor(None, self.sync_session.close)

        async def refresh(self, obj):
            """Refresh an object from the database."""
            # For sync session, refresh is synchronous but wrapped for async
            await asyncio.get_event_loop().run_in_executor(None, self.sync_session.refresh, obj)

        def delete(self, obj):
            """Delete an object from the database."""
            # For sync session, delete is synchronous
            self.sync_session.delete(obj)

        async def execute(self, statement):
            """Execute a statement and return the result."""
            # Execute the statement synchronously in an executor
            # Add logging for debugging potential SQL injection
            try:
                result = await asyncio.get_event_loop().run_in_executor(
                    None, self.sync_session.execute, statement
                )
                return result
            except Exception as e:
                logger.error(f"Database execution error: {str(e)}, Statement: {statement}")
                raise

        async def exec(self, statement):
            """Execute a statement and return the result (SQLModel compatibility)."""
            # Execute the statement synchronously in an executor
            # Add logging for debugging potential SQL injection
            try:
                result = await asyncio.get_event_loop().run_in_executor(
                    None, self.sync_session.execute, statement
                )
                return result
            except Exception as e:
                logger.error(f"Database execution error: {str(e)}, Statement: {statement}")
                raise

        def __getattr__(self, name):
            # Delegate attribute access to the sync session
            return getattr(self.sync_session, name)

    async def get_session() -> AsyncGenerator[AsyncSessionWrapper, None]:
        """
        Dependency for getting async database sessions (wrapped for SQLite).

        Yields:
            AsyncSessionWrapper: Database session
        """
        sync_session = SyncSessionLocal()
        session_wrapper = AsyncSessionWrapper(sync_session)
        try:
            yield session_wrapper
            await session_wrapper.commit()  # Changed from sync commit to async
        except Exception:
            await session_wrapper.rollback()  # Changed from sync rollback to async
            raise
        finally:
            await session_wrapper.close()  # Changed from sync close to async

    async def init_db():
        """Initialize database tables."""
        # For SQLite, run sync operation in executor
        await asyncio.get_event_loop().run_in_executor(None, SQLModel.metadata.create_all, sync_engine)

    async def close_db():
        """Close database connections."""
        # For SQLite, nothing specific needed
        pass

else:
    # For PostgreSQL, use the original async approach
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

    # Create async engine for Neon PostgreSQL
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
        pool_size=20,  # Increased pool size for better concurrency
        max_overflow=40,  # Increased overflow for peak loads
        pool_recycle=3600,  # Recycle connections after 1 hour
        pool_timeout=30,  # Timeout for getting connection from pool
        pool_reset_on_return="commit",  # Reset connection state after each use
        echo_pool=True if settings.DEBUG else False,  # Log pool activities in debug mode
    )

    # Create async session factory
    AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def get_session() -> AsyncGenerator[AsyncSession, None]:
        """
        Dependency for getting async database sessions.

        Yields:
            AsyncSession: Database session
        """
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def init_db():
        """Initialize database tables."""
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)

    async def close_db():
        """Close database connections."""
        await engine.dispose()
