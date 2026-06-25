import contextvars
from typing import Optional

# This variable holds the UUID of the active tenant for the current request.
# It defaults to None for public endpoints like login or signup.
current_tenant_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_tenant_id", default=None
)

def get_current_tenant() -> str:
    tenant_id = current_tenant_id.get()
    if not tenant_id:
        raise ValueError("Tenant context is missing. Ensure the user is authenticated within a workspace.")
    return tenant_id