import uuid

from pydantic import BaseModel


class WatchlistAdd(BaseModel):
    property_id: uuid.UUID
