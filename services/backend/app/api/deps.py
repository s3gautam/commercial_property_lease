import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_session
from app.core.logging import get_logger
from app.core.redis import get_redis
from app.core.security import InvalidTokenError, TokenType, decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.google_oauth import GoogleOAuthService
from app.services.notification_sender import (
    ConsoleNotificationSender,
    NotificationSender,
    SmtpNotificationSender,
)
from app.services.otp_service import OtpService

logger = get_logger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


def get_user_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserRepository:
    return UserRepository(session)


def get_notification_sender() -> NotificationSender:
    """Real SMTP delivery once SMTP_HOST is configured; otherwise logs
    instead of sending, so local dev never needs real credentials."""
    settings = get_settings()
    if not settings.smtp_host:
        logger.info("notification.sender_selected", sender="console")
        return ConsoleNotificationSender()

    logger.info("notification.sender_selected", sender="smtp", host=settings.smtp_host)
    return SmtpNotificationSender(
        host=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_username,
        password=settings.smtp_password,
        from_email=settings.smtp_from_email,
        use_tls=settings.smtp_use_tls,
    )


def get_otp_service() -> OtpService:
    return OtpService(get_redis(), get_notification_sender())


def get_google_oauth_service() -> GoogleOAuthService:
    return GoogleOAuthService()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    users: Annotated[UserRepository, Depends(get_user_repository)],
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    try:
        payload = decode_token(credentials.credentials, TokenType.ACCESS)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc

    user = await users.get_by_id(uuid.UUID(payload.sub))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User is not active"
        )

    return user
