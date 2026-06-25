import uuid
import enum
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import TenantAwareBase

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class Invoice(TenantAwareBase):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String(100), nullable=False, index=True) # e.g., INV-2026-001
    
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    
    # Financial fields stored in Kobo (Integers)
    subtotal = Column(Integer, default=0, nullable=False)
    vat_amount = Column(Integer, default=0, nullable=False) # Standard 7.5% in Nigeria
    wht_amount = Column(Integer, default=0, nullable=False) # Withholding Tax if applicable
    total_amount = Column(Integer, default=0, nullable=False) # Final net payable amount
    
    due_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(TenantAwareBase):
    __tablename__ = "invoice_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Integer, nullable=False) # Stored in Kobo
    total_price = Column(Integer, nullable=False) # quantity * unit_price

    # Relationships
    invoice = relationship("Invoice", back_populates="items")