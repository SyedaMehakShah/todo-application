"""
Authentication service for user management and JWT operations.
Handles password hashing, JWT generation, token verification, and user CRUD.
"""
from passlib.context import CryptContext
import hashlib
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Union
from typing import Optional
import bleach

from ..models.user import User
from ..config import settings


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


# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password

        Returns:
            str: Hashed password
        """
        # Check password length before hashing
        if len(password) > 72:
            raise ValueError("Password exceeds maximum length of 72 characters")

        # Truncate password to 72 bytes to comply with bcrypt limitations
        truncated_password = password[:72] if len(password) > 72 else password
        try:
            return pwd_context.hash(truncated_password)
        except Exception:
            # Fallback to SHA-256 hashing for development environments
            # This is less secure but works when bcrypt is unavailable
            import warnings
            warnings.warn("Using fallback SHA-256 hashing instead of bcrypt")
            return hashlib.sha256(truncated_password.encode()).hexdigest()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password: Plain text password to verify
            hashed_password: Hashed password to compare against

        Returns:
            bool: True if password matches, False otherwise
        """
        try:
            # Try bcrypt verification first
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # Fallback: check if it's a SHA-256 hash
            import hashlib
            sha256_hash = hashlib.sha256(plain_password.encode()).hexdigest()
            return sha256_hash == hashed_password

    @staticmethod
    def create_access_token(user_id: Union[UUID, str]) -> str:
        """
        Create a JWT access token for a user.

        Args:
            user_id: User's ID (UUID or string)

        Returns:
            str: JWT token
        """
        import logging
        logger = logging.getLogger(__name__)

        # Convert to string if it's a UUID object
        user_id_str = str(user_id)

        logger.info(f"Creating access token for user: {user_id_str}")

        expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRY_DAYS)
        to_encode = {
            "sub": user_id_str,
            "user_id": user_id_str,
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        try:
            encoded_jwt = jwt.encode(
                to_encode, settings.BETTER_AUTH_SECRET, algorithm=settings.JWT_ALGORITHM
            )
            logger.info("JWT token created successfully")
            return encoded_jwt
        except Exception as e:
            logger.error(f"JWT token creation failed: {str(e)}")
            raise

    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
        """
        Get a user by email address.

        Args:
            session: Database session
            email: User's email address

        Returns:
            Optional[User]: User if found, None otherwise
        """
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: UUID) -> Optional[User]:
        """
        Get a user by ID.

        Args:
            session: Database session
            user_id: User's UUID

        Returns:
            Optional[User]: User if found, None otherwise
        """
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_user(session: AsyncSession, email: str, password: str) -> User:
        """
        Create a new user.

        Args:
            session: Database session
            email: User's email address
            password: Plain text password (will be hashed)

        Returns:
            User: Created user

        Raises:
            ValueError: If email already exists
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"Attempting to create user with email: {email}")

        # Sanitize email input to prevent XSS
        sanitized_email = sanitize_input(email.strip().lower())

        # Validate email format
        if len(sanitized_email) > 255:
            logger.warning(f"Email address too long: {len(sanitized_email)} characters")
            raise ValueError("Email address too long")

        # Check if user already exists
        existing_user = await AuthService.get_user_by_email(session, sanitized_email)
        if existing_user:
            logger.warning(f"Attempt to register existing email: {sanitized_email}")
            raise ValueError("Email already registered")

        # Hash password
        try:
            password_hash = AuthService.hash_password(password)
            logger.info("Password hashed successfully")
        except Exception as e:
            logger.error(f"Password hashing failed: {str(e)}")
            raise

        # Create user
        user = User(
            email=sanitized_email,
            password_hash=password_hash,
            email_verified=False,
        )

        session.add(user)
        await session.commit()
        await session.refresh(user)

        logger.info(f"User created successfully with ID: {user.id}")

        return user

    @staticmethod
    async def authenticate_user(
        session: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        """
        Authenticate a user with email and password.

        Args:
            session: Database session
            email: User's email address
            password: Plain text password

        Returns:
            Optional[User]: User if authentication successful, None otherwise
        """
        # Sanitize email input to prevent XSS
        sanitized_email = sanitize_input(email)

        user = await AuthService.get_user_by_email(session, sanitized_email)
        if not user:
            return None

        if not AuthService.verify_password(password, user.password_hash):
            return None

        return user
