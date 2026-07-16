import hashlib
import secrets
from enum import StrEnum

from redis.asyncio import Redis

from app.core.config import get_settings
from app.services.notification_sender import NotificationSender

OTP_LENGTH = 6
OTP_TTL_SECONDS = 5 * 60
OTP_MAX_ATTEMPTS = 5


class OtpChannel(StrEnum):
    EMAIL = "email"
    PHONE = "phone"


class OtpError(Exception):
    pass


def _redis_key(channel: OtpChannel, identifier: str) -> str:
    return f"otp:{channel.value}:{identifier}"


def _attempts_key(channel: OtpChannel, identifier: str) -> str:
    return f"otp_attempts:{channel.value}:{identifier}"


def _hash_code(code: str, identifier: str) -> str:
    settings = get_settings()
    return hashlib.sha256(f"{settings.jwt_secret}:{identifier}:{code}".encode()).hexdigest()


class OtpService:
    def __init__(self, redis: Redis, notification_sender: NotificationSender) -> None:
        self._redis = redis
        self._notification_sender = notification_sender

    async def request_otp(self, channel: OtpChannel, identifier: str) -> None:
        code = f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"
        hashed = _hash_code(code, identifier)

        await self._redis.set(_redis_key(channel, identifier), hashed, ex=OTP_TTL_SECONDS)
        await self._redis.delete(_attempts_key(channel, identifier))

        if channel == OtpChannel.EMAIL:
            await self._notification_sender.send_email(
                identifier, "Your PropLease AI verification code", f"Your code is {code}"
            )
        else:
            await self._notification_sender.send_sms(identifier, f"Your PropLease AI code is {code}")

    async def verify_otp(self, channel: OtpChannel, identifier: str, code: str) -> bool:
        attempts_key = _attempts_key(channel, identifier)
        attempts = await self._redis.incr(attempts_key)
        if attempts == 1:
            await self._redis.expire(attempts_key, OTP_TTL_SECONDS)
        if attempts > OTP_MAX_ATTEMPTS:
            raise OtpError("Too many attempts. Request a new code.")

        stored_hash = await self._redis.get(_redis_key(channel, identifier))
        if stored_hash is None:
            return False
        if isinstance(stored_hash, bytes):
            stored_hash = stored_hash.decode()

        if not secrets.compare_digest(stored_hash, _hash_code(code, identifier)):
            return False

        await self._redis.delete(_redis_key(channel, identifier))
        await self._redis.delete(attempts_key)
        return True
