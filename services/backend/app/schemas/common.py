from typing import Generic, TypeVar

from pydantic import BaseModel

TData = TypeVar("TData")


class ApiErrorSchema(BaseModel):
    code: str
    message: str
    details: dict[str, object] | None = None


class ApiResponse(BaseModel, Generic[TData]):
    success: bool
    data: TData | None = None
    meta: dict[str, object] | None = None
    error: ApiErrorSchema | None = None
