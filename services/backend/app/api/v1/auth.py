from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    get_google_oauth_service,
    get_otp_service,
    get_user_repository,
)
from app.core.database import get_db_session
from app.core.rate_limit import RateLimiter
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AuthResponse,
    GoogleAuthRequest,
    OtpRequestSchema,
    OtpVerifySchema,
    RefreshRequest,
    TokenPairResponse,
)
from app.schemas.common import ApiResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthError, AuthService
from app.services.google_oauth import GoogleOAuthService, GoogleTokenError
from app.services.otp_service import OtpChannel, OtpError, OtpService

router = APIRouter(prefix="/auth", tags=["auth"])

otp_request_rate_limiter = RateLimiter(limit=5, window_seconds=300, scope="otp_request")
otp_verify_rate_limiter = RateLimiter(limit=10, window_seconds=300, scope="otp_verify")


def get_auth_service(
    users: Annotated[UserRepository, Depends(get_user_repository)],
    otp_service: Annotated[OtpService, Depends(get_otp_service)],
    google_oauth_service: Annotated[GoogleOAuthService, Depends(get_google_oauth_service)],
) -> AuthService:
    return AuthService(users, otp_service, google_oauth_service)


def _channel_and_identifier(payload: OtpRequestSchema) -> tuple[OtpChannel, str]:
    if payload.email is not None:
        return OtpChannel.EMAIL, payload.email
    assert payload.phone is not None
    return OtpChannel.PHONE, payload.phone


@router.post("/google", response_model=ApiResponse[AuthResponse])
async def login_with_google(
    payload: GoogleAuthRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthResponse]:
    try:
        user, access_token, refresh_token = await auth_service.login_with_google(
            payload.id_token
        )
    except GoogleTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    await session.commit()

    return ApiResponse(
        success=True,
        data=AuthResponse(
            user=UserRead.model_validate(user),
            tokens=TokenPairResponse(access_token=access_token, refresh_token=refresh_token),
        ),
    )


@router.post(
    "/otp/request",
    response_model=ApiResponse[dict[str, str]],
    dependencies=[Depends(otp_request_rate_limiter)],
)
async def request_otp(
    payload: OtpRequestSchema,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict[str, str]]:
    channel, identifier = _channel_and_identifier(payload)
    await auth_service.request_otp(channel, identifier)
    return ApiResponse(success=True, data={"status": "sent"})


@router.post(
    "/otp/verify",
    response_model=ApiResponse[AuthResponse],
    dependencies=[Depends(otp_verify_rate_limiter)],
)
async def verify_otp(
    payload: OtpVerifySchema,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthResponse]:
    channel, identifier = _channel_and_identifier(payload)

    try:
        user, access_token, refresh_token = await auth_service.verify_otp_and_login(
            channel, identifier, payload.code
        )
    except (AuthError, OtpError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    await session.commit()

    return ApiResponse(
        success=True,
        data=AuthResponse(
            user=UserRead.model_validate(user),
            tokens=TokenPairResponse(access_token=access_token, refresh_token=refresh_token),
        ),
    )


@router.post("/refresh", response_model=ApiResponse[TokenPairResponse])
async def refresh_token(
    payload: RefreshRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[TokenPairResponse]:
    try:
        access_token, refresh_token_value = await auth_service.refresh_tokens(
            payload.refresh_token
        )
    except AuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return ApiResponse(
        success=True,
        data=TokenPairResponse(access_token=access_token, refresh_token=refresh_token_value),
    )


@router.get("/me", response_model=ApiResponse[UserRead])
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> ApiResponse[UserRead]:
    return ApiResponse(success=True, data=UserRead.model_validate(current_user))
