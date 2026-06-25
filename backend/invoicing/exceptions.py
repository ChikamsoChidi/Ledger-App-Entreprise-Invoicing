class InvoiceError(Exception):
    """Base exception for invoicing operations."""
    pass

class InvalidStateTransitionError(InvoiceError):
    """Raised when an invoice attempts an illegal status change."""
    pass