from pydantic import BaseModel, Field, UUID4
from typing import List
from ledger.models import EntryType

class LineItemInput(BaseModel):
    account_id: UUID4
    amount: int = Field(..., gt=0, description="Amount in Kobo (must be positive)")
    entry_type: EntryType

class JournalEntryInput(BaseModel):
    reference_id: str = Field(..., description="External system reference, such as a Paystack reference")
    description: str = Field(..., min_length=3, max_length=255)
    lines: List[LineItemInput] = Field(..., min_length=2, description="Must contain at least two entries")