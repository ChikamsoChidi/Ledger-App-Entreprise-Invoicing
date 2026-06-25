import hmac
import hashlib
import os
from fastapi import Request, HTTPException

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "sk_test_...")

async def verify_paystack_signature(request: Request):
    # Get the raw request body
    payload = await request.body()
    # Hash the body with your secret key
    signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode('utf-8'),
        payload,
        hashlib.sha512
    ).hexdigest()
    
    # Compare with the signature provided by Paystack
    if not hmac.compare_digest(signature, request.headers.get("x-paystack-signature", "")):
        raise HTTPException(status_code=400, detail="Invalid signature")