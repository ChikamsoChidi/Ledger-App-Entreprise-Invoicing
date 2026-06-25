from fastapi import APIRouter, Depends, Request, HTTPException
from payments.security import verify_paystack_signature
from invoicing.service import InvoiceService
from invoicing.models import Invoice
from core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/webhooks", tags=["Payments"])

@router.post("/paystack")
async def paystack_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    # 1. Verify authenticity
    await verify_paystack_signature(request)
    
    # 2. Parse the Paystack payload
    event_data = await request.json()
    event_type = event_data.get("event")
    
    # 3. Only handle charge success events
    if event_type == "charge.success":
        data = event_data.get("data", {})
        reference = data.get("reference")  # Paystack reference = our invoice_number

        # 4. Look up the invoice by invoice_number, not by UUID id
        invoice = db.query(Invoice).filter(Invoice.invoice_number == reference).first()
        if not invoice:
            # Return 200 anyway so Paystack doesn't keep retrying for unknown references
            return {"status": "ignored", "reason": "invoice not found"}

        # 5. Mark as paid — correct arg order: (db, invoice_id, payment_reference)
        InvoiceService.mark_as_paid(db, str(invoice.id), payment_reference=reference)

        return {"status": "success"}

    return {"status": "ignored"}