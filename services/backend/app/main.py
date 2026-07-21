import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    # RAILWAY_GIT_COMMIT_SHA is set automatically by Railway - logging it
    # on every boot makes it possible to confirm from the Deploy Logs
    # alone which commit is actually running, rather than inferring it
    # from behavior.
    logger.info(
        "app.startup",
        commit_sha=os.environ.get("RAILWAY_GIT_COMMIT_SHA", "unknown"),
        environment=get_settings().environment,
    )
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    if settings.is_production and not settings.cors_allowed_origins_list:
        raise RuntimeError(
            "CORS_ALLOWED_ORIGINS must be set in production, or the frontend "
            "will never be able to call this API."
        )

    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins_list if settings.is_production else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        # Every raise HTTPException(...) across the API (PropertyNotFoundError,
        # VisitConflictError, etc.) should surface its real message to the
        # frontend's ApiClient, which expects the {"success", "error"}
        # envelope shape (see packages/api/src/client.ts) - not FastAPI's
        # default {"detail": ...} shape, which ApiClient can't parse and
        # silently reduces to a generic "Request failed".
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "data": None,
                "meta": None,
                "error": {"code": f"HTTP_{exc.status_code}", "message": exc.detail},
            },
        )

    return app


app = create_app()
