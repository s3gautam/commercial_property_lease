import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_session
from app.repositories.property_repository import PropertyRepository
from app.schemas.common import ApiResponse
from app.services.property_seed_service import seed_dummy_properties

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_valid_seed_token(token: str) -> None:
    settings = get_settings()
    # Unset ADMIN_SEED_TOKEN disables this endpoint entirely rather than
    # accepting an empty token - the check below would otherwise let an
    # empty query param through as "valid" against an unset setting.
    if not settings.admin_seed_token or not hmac.compare_digest(token, settings.admin_seed_token):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")


@router.get("/seed-properties", response_model=ApiResponse[dict[str, int]])
async def seed_properties(
    token: str,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ApiResponse[dict[str, int]]:
    """Dev/test convenience only - inserts 35 randomized dummy LISTED
    properties. Guarded by ADMIN_SEED_TOKEN; 404s (not 401/403) if unset
    or the token doesn't match, so its existence isn't revealed. Meant to
    be removed once a real admin/listings flow exists."""
    _require_valid_seed_token(token)

    count = await seed_dummy_properties(PropertyRepository(session), count=35)
    await session.commit()

    return ApiResponse(success=True, data={"seeded": count})
