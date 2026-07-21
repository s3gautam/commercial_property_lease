"""Notification delivery is behind a single interface so a real provider
(SES, SNS, Twilio) can be swapped in without touching callers."""

import asyncio
import smtplib
from abc import ABC, abstractmethod
from email.mime.text import MIMEText

from app.core.logging import get_logger

logger = get_logger(__name__)


class NotificationSender(ABC):
    @abstractmethod
    async def send_email(self, to: str, subject: str, body: str) -> None: ...

    @abstractmethod
    async def send_sms(self, to: str, body: str) -> None: ...


class ConsoleNotificationSender(NotificationSender):
    """Development-only sender that logs instead of delivering. Used
    whenever SMTP isn't configured - see api/deps.py::get_notification_sender."""

    async def send_email(self, to: str, subject: str, body: str) -> None:
        logger.info("notification.email", to=to, subject=subject, body=body)

    async def send_sms(self, to: str, body: str) -> None:
        logger.info("notification.sms", to=to, body=body)


class SmtpNotificationSender(NotificationSender):
    """Sends real email over SMTP. smtplib is blocking, so the actual send
    runs in a thread via asyncio.to_thread to avoid stalling the event loop."""

    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        from_email: str,
        use_tls: bool = True,
    ) -> None:
        self._host = host
        self._port = port
        self._username = username
        self._password = password
        self._from_email = from_email or username
        self._use_tls = use_tls

    def _send_sync(self, to: str, subject: str, body: str) -> None:
        message = MIMEText(body, "plain", "utf-8")
        message["Subject"] = subject
        message["From"] = self._from_email
        message["To"] = to

        with smtplib.SMTP(self._host, self._port, timeout=10) as server:
            if self._use_tls:
                server.starttls()
            if self._username:
                server.login(self._username, self._password)
            server.sendmail(self._from_email, [to], message.as_string())

    async def send_email(self, to: str, subject: str, body: str) -> None:
        try:
            await asyncio.to_thread(self._send_sync, to, subject, body)
        except Exception:
            logger.error("notification.email_failed", to=to, subject=subject, exc_info=True)

    async def send_sms(self, to: str, body: str) -> None:
        logger.info("notification.sms", to=to, body=body)
