"""Application configuration"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List


class Settings(BaseSettings):
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # Storage
    STORAGE_PATH: Path = Path("/tmp/dicom-storage")
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500MB
    
    # PACS (optional)
    PACS_HOST: str = ""
    PACS_PORT: int = 11112
    PACS_AE_TITLE: str = "PACS"
    LOCAL_AE_TITLE: str = "DICOM_VIEWER"
    
    class Config:
        env_file = ".env"


settings = Settings()

# Ensure storage directory exists
settings.STORAGE_PATH.mkdir(parents=True, exist_ok=True)
