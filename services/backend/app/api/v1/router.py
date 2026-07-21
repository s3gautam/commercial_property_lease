from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.leases import router as leases_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.properties import router as properties_router
from app.api.v1.tenant_profile import router as tenant_profile_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(properties_router)
api_v1_router.include_router(tenant_profile_router)
api_v1_router.include_router(leases_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(notifications_router)
