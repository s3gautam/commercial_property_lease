from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_notification_sender
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.notification import BookingNotificationRequest, BookingNotificationResponse
from app.services.booking_notification_service import BookingNotificationService
from app.services.notification_sender import NotificationSender

router = APIRouter(prefix="/notifications", tags=["notifications"])


def get_booking_notification_service(
    notification_sender: Annotated[NotificationSender, Depends(get_notification_sender)],
) -> BookingNotificationService:
    return BookingNotificationService(notification_sender)


@router.post("/booking", response_model=ApiResponse[BookingNotificationResponse])
async def send_booking_notification(
    payload: BookingNotificationRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    notification_service: Annotated[
        BookingNotificationService, Depends(get_booking_notification_service)
    ],
) -> ApiResponse[BookingNotificationResponse]:
    if not current_user.email:
        # Phone-only accounts have nowhere to send this - not an error,
        # just nothing to do.
        return ApiResponse(success=True, data=BookingNotificationResponse(email_sent=False))

    await notification_service.notify(
        email=current_user.email,
        property_title=payload.property_title,
        date=payload.date,
        time=payload.time,
        action=payload.action,
    )

    return ApiResponse(success=True, data=BookingNotificationResponse(email_sent=True))
