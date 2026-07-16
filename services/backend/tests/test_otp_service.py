from unittest.mock import patch

import pytest
from fakeredis.aioredis import FakeRedis

from app.services.notification_sender import ConsoleNotificationSender
from app.services.otp_service import OTP_MAX_ATTEMPTS, OtpChannel, OtpError, OtpService


@pytest.fixture
def otp_service(fake_redis: FakeRedis) -> OtpService:
    return OtpService(fake_redis, ConsoleNotificationSender())


async def _request_fixed_code(otp_service: OtpService, channel: OtpChannel, identifier: str, code: str) -> None:
    with patch("secrets.randbelow", return_value=int(code)):
        await otp_service.request_otp(channel, identifier)


@pytest.mark.asyncio
async def test_correct_code_is_accepted(otp_service: OtpService) -> None:
    await _request_fixed_code(otp_service, OtpChannel.EMAIL, "a@b.com", "123456")
    assert await otp_service.verify_otp(OtpChannel.EMAIL, "a@b.com", "123456") is True


@pytest.mark.asyncio
async def test_wrong_code_is_rejected(otp_service: OtpService) -> None:
    await _request_fixed_code(otp_service, OtpChannel.EMAIL, "a@b.com", "123456")
    assert await otp_service.verify_otp(OtpChannel.EMAIL, "a@b.com", "000000") is False


@pytest.mark.asyncio
async def test_code_is_single_use(otp_service: OtpService) -> None:
    await _request_fixed_code(otp_service, OtpChannel.EMAIL, "a@b.com", "123456")
    assert await otp_service.verify_otp(OtpChannel.EMAIL, "a@b.com", "123456") is True
    assert await otp_service.verify_otp(OtpChannel.EMAIL, "a@b.com", "123456") is False


@pytest.mark.asyncio
async def test_verify_without_request_returns_false(otp_service: OtpService) -> None:
    assert await otp_service.verify_otp(OtpChannel.EMAIL, "never-requested@b.com", "123456") is False


@pytest.mark.asyncio
async def test_too_many_attempts_raises(otp_service: OtpService) -> None:
    await _request_fixed_code(otp_service, OtpChannel.EMAIL, "a@b.com", "123456")
    for _ in range(OTP_MAX_ATTEMPTS):
        await otp_service.verify_otp(OtpChannel.EMAIL, "a@b.com", "000000")

    with pytest.raises(OtpError):
        await otp_service.verify_otp(OtpChannel.EMAIL, "a@b.com", "000000")


@pytest.mark.asyncio
async def test_email_and_phone_channels_are_independent(otp_service: OtpService) -> None:
    await _request_fixed_code(otp_service, OtpChannel.EMAIL, "shared-id", "111111")
    await _request_fixed_code(otp_service, OtpChannel.PHONE, "shared-id", "222222")

    assert await otp_service.verify_otp(OtpChannel.PHONE, "shared-id", "111111") is False
    assert await otp_service.verify_otp(OtpChannel.EMAIL, "shared-id", "111111") is True
    assert await otp_service.verify_otp(OtpChannel.PHONE, "shared-id", "222222") is True
