from typing import Literal

from pydantic import BaseModel, Field


class BookingNotificationRequest(BaseModel):
    property_title: str = Field(min_length=1, max_length=300)
    date: str = Field(description="Visit date, yyyy-mm-dd")
    time: str = Field(description="Visit time, e.g. '10:00 AM'")
    action: Literal["booked", "rescheduled"]


class BookingNotificationResponse(BaseModel):
    email_sent: bool
