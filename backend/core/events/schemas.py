import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Any, Dict

class IntegrationEvent(BaseModel):
    """
    The standard envelope for all asynchronous messages in the system.
    """
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str = Field(..., description="The routing key, e.g., 'invoice.sent'")
    tenant_id: str = Field(..., description="Crucial for background worker database isolation")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload: Dict[str, Any] = Field(..., description="The domain-specific event data")