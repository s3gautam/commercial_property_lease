import uuid
from datetime import datetime, timedelta, timezone
from enum import StrEnum

from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import get_settings


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


class TokenPayload(BaseModel):
    sub: str
    type: TokenType
    exp: datetime
    jti: str


class InvalidTokenError(Exception):
    pass


def _create_token(subject: str, token_type: TokenType, expires_delta: timedelta) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type.value,
        "exp": now + expires_delta,
        "iat": now,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        TokenType.ACCESS,
        timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        TokenType.REFRESH,
        timedelta(days=settings.jwt_refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: TokenType) -> TokenPayload:
    settings = get_settings()
    try:
        raw_payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise InvalidTokenError("Token is invalid or expired") from exc

    payload = TokenPayload.model_validate(raw_payload)
    if payload.type != expected_type:
        raise InvalidTokenError(f"Expected a {expected_type.value} token")

    return payload
