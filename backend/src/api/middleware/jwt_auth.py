"""
JWT Authentication Middleware.
Provides JWT token verification and user context extraction for protected routes.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from uuid import UUID
from typing import Union

from ...config import settings


# HTTP Bearer token security scheme
security = HTTPBearer()


class JWTAuth:
    """JWT Authentication handler."""

    @staticmethod
    def verify_token(token: str) -> dict:
        """
        Verify JWT token and extract payload.

        Args:
            token: JWT token string

        Returns:
            dict: Token payload containing user information

        Raises:
            HTTPException: If token is invalid, expired, or malformed
        """
        try:
            payload = jwt.decode(
                token,
                settings.BETTER_AUTH_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @staticmethod
    def extract_user_id(payload: dict) -> str:
        """
        Extract user_id from JWT payload.

        Args:
            payload: Decoded JWT payload

        Returns:
            str: User ID from token

        Raises:
            HTTPException: If user_id is missing or invalid
        """
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            # Validate that it's a valid UUID string
            UUID(user_id)
            return user_id
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: malformed user identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency function to extract and verify current user ID from JWT token.

    This function should be used as a dependency in protected route handlers.

    Args:
        credentials: HTTP Bearer credentials from request header

    Returns:
        str: Authenticated user's ID

    Raises:
        HTTPException: If token is missing, invalid, or expired (401 Unauthorized)

    Example:
        @app.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user_id)):
            return {"user_id": user_id}
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = JWTAuth.verify_token(token)

    # Extract user_id from payload
    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Return as string to be compatible with SQLite
    return str(user_id)


async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Dependency function to optionally extract user ID from JWT token.

    This function can be used for routes that work with or without authentication.

    Args:
        credentials: HTTP Bearer credentials from request header (optional)

    Returns:
        Optional[str]: Authenticated user's ID if token is valid, None otherwise

    Example:
        @app.get("/public-or-private")
        async def mixed_route(user_id: Optional[str] = Depends(get_optional_user_id)):
            if user_id:
                return {"message": "Authenticated", "user_id": user_id}
            return {"message": "Public access"}
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = JWTAuth.verify_token(token)
        user_id = JWTAuth.extract_user_id(payload)
        return user_id
    except HTTPException:
        return None
