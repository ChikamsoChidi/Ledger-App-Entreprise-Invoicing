from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from invoicing.service import InvoiceService
from invoicing.schemas import InvoiceCreateInput
from invoicing.models import Invoice
from invoicing.exceptions import InvalidStateTransitionError

router = APIRouter(
    prefix="/invoices",
    tags=["Invoicing"]
)


@router.post(
    "/draft",
    status_code=status.HTTP_201_CREATED
)
def create_draft_invoice(
    payload: InvoiceCreateInput,
    db: Session = Depends(get_db)
):
    """
    Create a draft invoice.
    """

    try:
        invoice = InvoiceService.create_draft_invoice(db, payload)

        return {
            "message": "Invoice draft created successfully.",
            "invoice_id": str(invoice.id),
            "invoice_number": invoice.invoice_number,
            "status": invoice.status,
            "total_amount": invoice.total_amount
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/{invoice_id}")
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetch invoice by ID.
    """

    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found."
        )

    return invoice


@router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: str,
    db: Session = Depends(get_db)
):
    """
    Transition invoice from DRAFT -> SENT.
    """

    try:
        invoice = InvoiceService.mark_as_sent(db, invoice_id)

        return {
            "message": "Invoice sent successfully.",
            "invoice_id": str(invoice.id),
            "status": invoice.status
        }

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

    except InvalidStateTransitionError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )