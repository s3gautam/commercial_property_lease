from pydantic import BaseModel

from app.schemas.property import PropertyRead


class SearchCriteriaRead(BaseModel):
    city: str | None
    max_rent: float | None
    min_area_sqft: float | None
    keywords: list[str]
    explanation: str


class PropertySearchResponse(BaseModel):
    criteria: SearchCriteriaRead
    properties: list[PropertyRead]
    confidence: float
