import uuid

from app.ai.agents.landlord_chat_agent import LandlordChatAgent, LandlordChatMessage
from app.repositories.property_repository import PropertyRepository
from app.services.property_service import PropertyNotFoundError


class ChatService:
    """Powers the tenant-facing "chat with landlord" feature.

    Listings don't reliably have a real landlord user attached yet (see
    Property.landlord_id, nullable), so replies are generated on the fly
    by LandlordChatAgent rather than persisted through ChatThread/Message -
    there's no real landlord to attribute a persisted thread to. The
    conversation history is round-tripped by the client and passed back in
    on each request instead.
    """

    def __init__(self, properties: PropertyRepository) -> None:
        self._properties = properties

    async def reply(
        self,
        property_id: uuid.UUID,
        message: str,
        history: list[LandlordChatMessage],
    ) -> str:
        property_ = await self._properties.get_by_id(property_id)
        if property_ is None:
            raise PropertyNotFoundError("Property not found")

        agent = LandlordChatAgent()
        agent_response = await agent.run(property_, message, history)
        return agent_response.response.reply
