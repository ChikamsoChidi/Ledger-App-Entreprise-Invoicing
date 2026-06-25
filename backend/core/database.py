import uuid
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, declared_attr, Session, with_loader_criteria
from sqlalchemy.sql import func
from sqlalchemy import event
from core.context import current_tenant_id
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings

Base = declarative_base()

class TenantAwareBase(Base):
    """
    Abstract base class for all models that belong to a specific SME.
    It automatically adds a tenant_id column and sets it on creation.
    """
    __abstract__ = True

    @declared_attr
    def tenant_id(cls):
        return Column(
            UUID(as_uuid=True), 
            nullable=False, 
            index=True,
            # Automatically pull the tenant_id from the request context on insert
            default=lambda: current_tenant_id.get()
        )

# --- The Global Query Interceptor ---
@event.listens_for(Session, "do_orm_execute")
def _add_tenant_filter(execute_state):
    """
    Intercepts every SELECT, UPDATE, and DELETE query.
    If the model inherits from TenantAwareBase, it appends: WHERE tenant_id = current_tenant
    """
    if execute_state.is_select or execute_state.is_update or execute_state.is_delete:
        tenant_id = current_tenant_id.get()
        
        # We do not filter if there is no tenant in context (e.g., during signup)
        if tenant_id:
            execute_state.statement = execute_state.statement.options(
                with_loader_criteria(
                    TenantAwareBase,
                    lambda cls: cls.tenant_id == tenant_id,
                    include_aliases=True
                )
            )

if not settings.DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your .env file or environment variables.")

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()