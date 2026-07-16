import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.redis import get_redis
from app.core.security import InvalidTokenError, TokenType, decode_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.google_oauth import GoogleOAuthService
from app.services.notification_sender import ConsoleNotificationSender
from app.services.otp_service import OtpService

bearer_scheme = HTTPBearer(auto_error=False)


def get_user_repository(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserRepository:
    return UserRepository(session)


def get_otp_service() -> OtpService:
    return OtpService(get_redis(), ConsoleNotificationSender())


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
