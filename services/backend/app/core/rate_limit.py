from fastapi import HTTPException, Request, status
from redis.asyncio import Redis

from app.core.redis import get_redis


class RateLimiter:
    """Fixed-window rate limiter backed by Redis. Use as a FastAPI dependency
    to cap requests per client per route, e.g. OTP request/verify endpoints."""

    def __init__(self, limit: int, window_seconds: int, scope: str) -> None:
        self._limit = limit
        self._window_seconds = window_seconds
        self._scope = scope

    async def __call__(self, request: Request) -> None:
        redis: Redis = get_redis()
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:{self._scope}:{client_ip}"

        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, self._window_seconds)

        if count > self._limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
