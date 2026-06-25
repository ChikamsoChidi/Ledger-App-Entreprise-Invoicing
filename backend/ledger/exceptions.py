class LedgerError(Exception):
    """Base exception for all ledger operations."""
    pass

class UnbalancedJournalEntryError(LedgerError):
    """Raised when total debits do not equal total credits."""
    pass

class InvalidAccountError(LedgerError):
    """Raised when an account is missing or inactive."""
    pass