import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    memberships = relationship("TenantMember", back_populates="user")

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    rc_number = Column(String(50), nullable=True) # Corporate Affairs Commission number
    status = Column(String(50), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    members = relationship("TenantMember", back_populates="tenant")

class TenantMember(Base):
    __tablename__ = "tenant_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False) # Owner, Admin, Accountant, Cashier
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User", back_populates="memberships")
    tenant = relationship("Tenant", back_populates="members")