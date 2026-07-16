import uuid

from app.core.security import (
    InvalidTokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.google_oauth import GoogleOAuthService
from app.services.otp_service import OtpChannel, OtpService


class AuthError(Exception):
    pass


def _issue_tokens(user: User) -> tuple[str, str]:
    subject = str(user.id)
    return create_access_token(subject), create_refresh_token(subject)


class AuthService:
    def __init__(
        self,
        user_repository: UserRepository,
        otp_service: OtpService,
        google_oauth_service: GoogleOAuthService,
    ) -> None:
        self._users = user_repository
        self._otp = otp_service
        self._google = google_oauth_service

    async def login_with_google(self, id_token: str) -> tuple[User, str, str]:
        identity = await self._google.verify_id_token(id_token)

        user = await self._users.get_by_google_id(identity.google_id)
        if user is None:
            user = await self._users.get_by_email(identity.email)

        if user is None:
            user = await self._users.create(
                User(
                    email=identity.email,
                    google_id=identity.google_id,
                    is_email_verified=identity.email_verified,
                )
            )
        elif user.google_id is None:
            user.google_id = identity.google_id

        access_token, refresh_token = _issue_tokens(user)
        return user, access_token, refresh_token

    async def request_otp(self, channel: OtpChannel, identifier: str) -> None:
        await self._otp.request_otp(channel, identifier)

    async def verify_otp_and_login(
        self, channel: OtpChannel, identifier: str, code: str
    ) -> tuple[User, str, str]:
        is_valid = await self._otp.verify_otp(channel, identifier, code)
        if not is_valid:
            raise AuthError("Invalid or expired code")

        if channel == OtpChannel.EMAIL:
            user = await self._users.get_by_email(identifier)
            if user is None:
                user = await self._users.create(User(email=identifier, is_email_verified=True))
            else:
                user.is_email_verified = True
        else:
            user = await self._users.get_by_phone(identifier)
            if user is None:
                user = await self._users.create(User(phone=identifier, is_phone_verified=True))
            else:
                user.is_phone_verified = True

        access_token, refresh_token = _issue_tokens(user)
        return user, access_token, refresh_token

    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str]:
        try:
            payload = decode_token(refresh_token, TokenType.REFRESH)
        except InvalidTokenError as exc:
            raise AuthError(str(exc)) from exc

        user = await self._users.get_by_id(uuid.UUID(payload.sub))
        if user is None or not user.is_active:
            raise AuthError("User is no longer active")

        return _issue_tokens(user)
