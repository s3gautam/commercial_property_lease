"""Notification delivery is behind a single interface so a real provider
(SES, SNS, Twilio) can be swapped in without touching callers."""

from abc import ABC, abstractmethod

from app.core.logging import get_logger

logger = get_logger(__name__)


class NotificationSender(ABC):
    @abstractmethod
    async def send_email(self, to: str, subject: str, body: str) -> None: ...

    @abstractmethod
    async def send_sms(self, to: str, body: str) -> None: ...


class ConsoleNotificationSender(NotificationSender):
    """Development-only sender that logs instead of delivering. Replace with
    an SES/SNS/Twilio-backed implementation before production use."""

    async def send_email(self, to: str, subject: str, body: str) -> None:
        logger.info("notification.email", to=to, subject=subject, body=body)

    async def send_sms(self, to: str, body: str) -> None:
        logger.info("notification.sms", to=to, body=body)
