from typing import Literal

from pydantic import BaseModel, Field


class ChatMessageSchema(BaseModel):
    role: Literal["tenant", "landlord"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessageSchema] = Field(default_factory=list, max_length=50)


class ChatBookingSchema(BaseModel):
    date: str
    time: str


class ChatReplyResponse(BaseModel):
    reply: str
    booking: ChatBookingSchema | None = None
