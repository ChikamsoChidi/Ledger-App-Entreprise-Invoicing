import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from core.database import TenantAwareBase

class AccountType(str, enum.Enum):
    ASSET = "ASSET"             # Cash, Bank Accounts, Receivables
    LIABILITY = "LIABILITY"     # Payables, Loans, Taxes owed
    EQUITY = "EQUITY"           # Owner's capital, Retained earnings
    REVENUE = "REVENUE"         # Sales, Service fees
    EXPENSE = "EXPENSE"         # Payroll, Rent, Bank charges

class EntryType(str, enum.Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"

class Account(TenantAwareBase):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False) # e.g., "Zenith Bank Corporate"
    code = Column(String(50), nullable=False)  # e.g., "1001"
    account_type = Column(Enum(AccountType), nullable=False)
    currency = Column(String(3), default="NGN")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lines = relationship("LedgerLine", back_populates="account")

class JournalEntry(TenantAwareBase):
    """Represents a single business transaction event."""
    __tablename__ = "journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_id = Column(String(255), index=True) # ID from external systems like Paystack or internal Invoices
    description = Column(String(255), nullable=False)
    posted_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    lines = relationship("LedgerLine", back_populates="journal_entry")

class LedgerLine(TenantAwareBase):
    """The individual debits and credits that make up a Journal Entry."""
    __tablename__ = "ledger_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    
    amount = Column(Integer, nullable=False) # Stored in minor units (Kobo)
    entry_type = Column(Enum(EntryType), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    journal_entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("Account", back_populates="lines")