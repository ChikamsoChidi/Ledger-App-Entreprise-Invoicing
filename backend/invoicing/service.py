import uuid
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from invoicing.models import Invoice, InvoiceItem, InvoiceStatus
from invoicing.schemas import InvoiceCreateInput
from invoicing.exceptions import InvalidStateTransitionError

# A placeholder for our event broker (e.g., RabbitMQ, Redis, or simple background tasks)
from core.events.publisher import EventPublisher 

class InvoiceService:
    
    @staticmethod
    def generate_invoice_number() -> str:
        """Generates a unique human-readable invoice reference."""
        # In a real app, you might sequence this per tenant (e.g., INV-001)
        short_id = str(uuid.uuid4())[:8].upper()
        year = datetime.now(timezone.utc).year
        return f"INV-{year}-{short_id}"

    @staticmethod
    def create_draft_invoice(db: Session, data: InvoiceCreateInput) -> Invoice:
        """
        Calculates all line items and taxes, saving the invoice in DRAFT state.
        """
        subtotal = 0
        invoice_items = []

        # 1. Calculate line items and subtotal
        for item_data in data.items:
            total_price = item_data.quantity * item_data.unit_price
            subtotal += total_price
            
            invoice_items.append(
                InvoiceItem(
                    description=item_data.description,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    total_price=total_price
                )
            )

        # 2. Calculate taxes safely in Kobo
        # Standard Nigerian VAT is 7.5%
        vat_amount = int(round(subtotal * 0.075))
        
        # WHT based on user input (0%, 5%, or 10%)
        wht_amount = int(round(subtotal * (data.wht_rate_percentage / 100.0)))
        
        # 3. Final net total
        total_amount = subtotal + vat_amount - wht_amount

        # 4. Save to database
        new_invoice = Invoice(
            invoice_number=InvoiceService.generate_invoice_number(),
            customer_name=data.customer_name,
            customer_email=data.customer_email,
            status=InvoiceStatus.DRAFT,
            subtotal=subtotal,
            vat_amount=vat_amount,
            wht_amount=wht_amount,
            total_amount=total_amount,
            due_date=data.due_date,
            items=invoice_items
        )

        db.add(new_invoice)
        db.commit()
        db.refresh(new_invoice)
        
        return new_invoice

    @staticmethod
    def mark_as_sent(db: Session, invoice_id: str) -> Invoice:
        """
        Transitions the invoice to SENT and triggers an email event.
        """
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError("Invoice not found.")

        if invoice.status != InvoiceStatus.DRAFT:
            raise InvalidStateTransitionError(f"Cannot send invoice from state: {invoice.status}")

        invoice.status = InvoiceStatus.SENT
        db.commit()
        db.refresh(invoice)

        # Emit event for the Notification module to pick up
        EventPublisher.publish(
            topic="invoice.sent",
            payload={
                "invoice_id": str(invoice.id),
                "customer_email": invoice.customer_email,
                "amount": invoice.total_amount
            }
        )
        return invoice

    @staticmethod
    def mark_as_paid(db: Session, invoice_id: str, payment_reference: str) -> Invoice:
        """
        Transitions the invoice to PAID and triggers ledger reconciliation.
        """
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError("Invoice not found.")

        if invoice.status not in [InvoiceStatus.SENT, InvoiceStatus.OVERDUE]:
            raise InvalidStateTransitionError(f"Cannot mark as paid from state: {invoice.status}")

        invoice.status = InvoiceStatus.PAID
        db.commit()
        db.refresh(invoice)

        # Emit event for the Core Ledger module to record the double-entry journal
        EventPublisher.publish(
            topic="invoice.paid",
            payload={
                "invoice_id": str(invoice.id),
                "tenant_id": str(invoice.tenant_id),
                "amount": invoice.total_amount,
                "payment_reference": payment_reference
            }
        )
        return invoice