"""API v1 Router - Aggregates all endpoint routers"""

from fastapi import APIRouter
from app.api.v1 import studies, upload, wado

api_router = APIRouter()

api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(studies.router, prefix="/studies", tags=["Studies"])
api_router.include_router(wado.router, prefix="/dicomweb", tags=["DICOMweb"])
