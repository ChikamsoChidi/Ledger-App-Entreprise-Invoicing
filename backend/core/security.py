import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from core.config import settings

# Existing password hashing setup...
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# --- NEW: JWT Logic ---

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Generates a secure JWT token containing the user's multi-tenant context.
    """
    to_encode = data.copy()
    
    # Calculate expiration time securely using UTC
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add the expiration claim ('exp') to the payload
    to_encode.update({"exp": expire})
    
    # Sign the token using our secret key and the HS256 algorithm
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt