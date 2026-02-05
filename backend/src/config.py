"""
Environment configuration for the Todo application.
Loads configuration from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import logging
import sys


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str

    # Authentication
    BETTER_AUTH_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7

    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text

    # Rate Limiting
    AUTH_RATE_LIMIT: str = "5/minute"  # Rate limit for auth endpoints

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


def configure_logging():
    """
    Configure structured logging for the application.

    Supports both JSON and text formats.
    Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Set log levels for third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)

    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured: level={settings.LOG_LEVEL}, format={settings.LOG_FORMAT}, environment={settings.ENVIRONMENT}")


# Configure logging on module import
configure_logging()
