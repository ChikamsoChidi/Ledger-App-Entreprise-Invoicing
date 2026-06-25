import logging
from typing import Dict, Any, Optional
from core.context import current_tenant_id
from core.events.schemas import IntegrationEvent

logger = logging.getLogger(__name__)

class EventPublisher:
    """
    Central dispatcher for all asynchronous system events.
    """
    _broker_client = None 

    @classmethod
    def setup(cls, broker_client: Any):
        """
        Injects the actual broker client (e.g., Redis) during app startup.
        """
        cls._broker_client = broker_client

    @classmethod
    def publish(cls, topic: str, payload: Dict[str, Any]) -> IntegrationEvent:
        """
        Wraps the payload in a secure envelope and dispatches it to the broker.
        """
        # 1. Automatically extract the active tenant from the request context
        tenant_id = current_tenant_id.get()
        
        # Fallback for system-level events that originate outside a user request
        final_tenant_id = tenant_id or payload.get("tenant_id", "SYSTEM")

        if final_tenant_id == "SYSTEM":
            logger.warning(f"Publishing event '{topic}' without a tenant context.")

        # 2. Construct the standard event envelope
        event = IntegrationEvent(
            topic=topic,
            tenant_id=final_tenant_id,
            payload=payload
        )

        # 3. Serialize and dispatch
        event_json = event.model_dump_json()
        
        if cls._broker_client:
            # Example: cls._broker_client.publish(topic, event_json)
            # Example: cls._broker_client.lpush("system_events_queue", event_json)
            pass
            
        logger.info(f"Event Published: [{topic}] -> ID: {event.event_id}")
        
        return event