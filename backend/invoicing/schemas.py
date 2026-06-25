from pydantic import BaseModel, Field, EmailStr
from typing import List
from datetime import datetime

class InvoiceItemInput(BaseModel):
    description: str = Field(..., min_length=3, max_length=255)
    quantity: int = Field(default=1, gt=0)
    unit_price: int = Field(..., gt=0, description="Price per unit in Kobo")

class InvoiceCreateInput(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=255)
    customer_email: EmailStr
    due_date: datetime
    wht_rate_percentage: int = Field(default=0, ge=0, le=10, description="WHT rate (e.g., 0, 5, or 10)")
    items: List[InvoiceItemInput] = Field(..., min_length=1)