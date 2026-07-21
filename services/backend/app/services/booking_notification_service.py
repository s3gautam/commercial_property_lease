from datetime import datetime

from app.services.notification_sender import NotificationSender


def _format_date(date: str) -> str:
    try:
        return datetime.strptime(date, "%Y-%m-%d").strftime("%A, %d %B %Y")
    except ValueError:
        return date


class BookingNotificationService:
    def __init__(self, notification_sender: NotificationSender) -> None:
        self._sender = notification_sender

    async def notify(
        self, *, email: str, property_title: str, date: str, time: str, action: str
    ) -> None:
        pretty_date = _format_date(date)

        if action == "rescheduled":
            subject = f"Your visit to {property_title} has been rescheduled"
            headline = "Your property visit has been moved to a new time:"
        else:
            subject = f"Your visit to {property_title} is confirmed"
            headline = "Your property visit is confirmed:"

        body = (
            "Hi there,\n\n"
            f"{headline}\n\n"
            f"Property: {property_title}\n"
            f"Date: {pretty_date}\n"
            f"Time: {time}\n\n"
            "You can reschedule or cancel anytime from your Profile page on "
            "PropLease AI.\n\n"
            "See you then!\n"
            "The PropLease AI team"
        )

        await self._sender.send_email(email, subject, body)
