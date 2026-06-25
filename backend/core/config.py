import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # In production, generate a secure random key using: openssl rand -hex 32
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_super_secret_development_key_do_not_use_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # Short-lived for security
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    class Config:
        env_file = ".env"


settings = Settings()