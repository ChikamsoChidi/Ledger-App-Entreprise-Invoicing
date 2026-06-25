import logging
from sqlalchemy.orm import Session

# Import your database session maker (usually defined in core/database.py)
from core.database import SessionLocal 
from core.context import current_tenant_id
from core.events.schemas import IntegrationEvent

from invoicing.models import Invoice
from notifications.email import EmailService

logger = logging.getLogger(__name__)

def handle_invoice_sent_event(raw_event_dict: dict):
    """
    The background consumer that processes 'invoice.sent' topics.
    """
    # 1. Unpack the standard event envelope
    event = IntegrationEvent(**raw_event_dict)
    logger.info(f"⚙️ Worker picked up event: {event.topic} [ID: {event.event_id}]")

    # 2. THE MULTI-TENANT MAGIC: Set the context!
    # This automatically applies the WHERE tenant_id = X filter to all queries below.
    current_tenant_id.set(event.tenant_id)

    # 3. Extract the domain payload
    payload = event.payload
    invoice_id = payload.get("invoice_id")
    customer_email = payload.get("customer_email")

    # 4. Open a fresh database session for this worker thread
    db: Session = SessionLocal()
    
    try:
        # Fetch the invoice. It is completely safe because of Step 2!
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        
        if not invoice:
            logger.error(f"Invoice {invoice_id} not found for tenant {event.tenant_id}")
            return

        # 5. Execute the business logic
        EmailService.send_invoice_email(
            to_email=customer_email,
            invoice_number=invoice.invoice_number,
            amount_kobo=invoice.total_amount
        )
        
    except Exception as e:
        logger.error(f"Failed to process email for invoice {invoice_id}: {str(e)}")
        # Re-raise the exception so the queue broker knows the job failed and can retry it
        raise e
    finally:
        # Always close the connection to prevent connection pool exhaustion
        db.close()