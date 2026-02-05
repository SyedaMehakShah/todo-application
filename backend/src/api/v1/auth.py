"""
Authentication API endpoints.
Handles user signup, signin, token refresh, and profile retrieval.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID

from slowapi import Limiter
from slowapi.util import get_remote_address

from ...database import get_session
from ...services.auth_service import AuthService
from ...models.user import User
from ..middleware.jwt_auth import get_current_user_id
from ...config import settings

# Initialize rate limiter for auth endpoints
auth_limiter = Limiter(key_func=get_remote_address)


router = APIRouter()

# Rate limiting for auth endpoints
limiter = Limiter(key_func=get_remote_address)


# Request/Response models
class SignupRequest(BaseModel):
    """Signup request payload."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class SigninRequest(BaseModel):
    """Signin request payload."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response payload."""

    id: str
    email: str
    email_verified: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response with user and token."""

    user: UserResponse
    token: str


class TokenResponse(BaseModel):
    """Token refresh response."""

    token: str


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
# @auth_limiter.limit(settings.AUTH_RATE_LIMIT)  # Temporarily disabled due to parameter conflicts
async def signup(
    request_data: SignupRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new user account.

    - **email**: Valid email address (RFC 5322)
    - **password**: Minimum 8 characters

    Returns user data and JWT token.
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"Signup request received for email: {request_data.email}")

    try:
        # Create user
        user = await AuthService.create_user(session, request_data.email, request_data.password)

        # Generate JWT token
        token = AuthService.create_access_token(user.id)

        logger.info(f"User {user.id} signed up successfully")

        # Return user and token
        return AuthResponse(
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                email_verified=user.email_verified,
                created_at=user.created_at.isoformat(),
                updated_at=user.updated_at.isoformat(),
            ),
            token=token,
        )
    except ValueError as e:
        logger.warning(f"Signup failed due to validation error: {str(e)}")
        # Email already exists
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup failed due to unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )


@router.post("/signin", response_model=AuthResponse)
# @auth_limiter.limit(settings.AUTH_RATE_LIMIT)  # Temporarily disabled due to parameter conflicts
async def signin(
    request_data: SigninRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Sign in an existing user.

    - **email**: User's email address
    - **password**: User's password

    Returns user data and JWT token.
    """
    # Authenticate user
    user = await AuthService.authenticate_user(session, request_data.email, request_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate JWT token
    token = AuthService.create_access_token(user.id)

    # Return user and token
    return AuthResponse(
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            email_verified=user.email_verified,
            created_at=user.created_at.isoformat(),
            updated_at=user.updated_at.isoformat(),
        ),
        token=token,
    )


@router.post("/refresh", response_model=TokenResponse)
# @auth_limiter.limit(settings.AUTH_RATE_LIMIT)  # Temporarily disabled due to parameter conflicts
async def refresh_token(
    user_id: UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Refresh JWT token.

    Requires valid (but possibly expiring) JWT token in Authorization header.
    Returns new JWT token with extended expiry.
    """
    # Verify user still exists
    user = await AuthService.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Generate new token
    token = AuthService.create_access_token(user.id)

    return TokenResponse(token=token)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    Get current user profile.

    Requires valid JWT token in Authorization header.
    Returns authenticated user's profile information.
    """
    # Get user from database
    user = await AuthService.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserResponse(
        id=str(user.id),
        email=user.email,
        email_verified=user.email_verified,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat(),
    )
