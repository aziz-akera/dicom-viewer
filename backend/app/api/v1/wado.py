"""DICOMweb WADO-RS endpoints for Cornerstone3D"""

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from pathlib import Path
import io

from app.config import settings
from app.services.dicom_parser import DICOMParserService

router = APIRouter()
parser = DICOMParserService()


@router.get("/studies/{study_uid}/series/{series_uid}/instances/{sop_uid}/metadata")
async def get_instance_metadata(study_uid: str, series_uid: str, sop_uid: str):
    """WADO-RS: Get instance metadata as DICOMweb JSON."""
    
    file_path = settings.STORAGE_PATH / study_uid / series_uid / f"{sop_uid}.dcm"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Instance not found")
    
    metadata = parser.parse_file(file_path)
    dicomweb_json = parser.to_dicomweb_json(file_path)
    
    return Response(
        content=f"[{dicomweb_json}]",
        media_type="application/dicom+json",
    )


@router.get("/studies/{study_uid}/series/{series_uid}/instances/{sop_uid}")
async def get_instance(study_uid: str, series_uid: str, sop_uid: str):
    """WADO-RS: Get DICOM instance (full file)."""
    
    file_path = settings.STORAGE_PATH / study_uid / series_uid / f"{sop_uid}.dcm"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Instance not found")
    
    with open(file_path, "rb") as f:
        content = f.read()
    
    return Response(
        content=content,
        media_type="application/dicom",
        headers={
            "Content-Disposition": f'attachment; filename="{sop_uid}.dcm"',
        },
    )


@router.get("/studies/{study_uid}/series/{series_uid}/instances/{sop_uid}/frames/{frame}")
async def get_frame(study_uid: str, series_uid: str, sop_uid: str, frame: int = 1):
    """WADO-RS: Get pixel data for a specific frame."""
    
    file_path = settings.STORAGE_PATH / study_uid / series_uid / f"{sop_uid}.dcm"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Instance not found")
    
    pixel_data = parser.get_pixel_data(file_path, frame)
    
    if pixel_data is None:
        raise HTTPException(status_code=404, detail="Frame not found")
    
    return Response(
        content=pixel_data,
        media_type="application/octet-stream",
    )


@router.get("/studies/{study_uid}/metadata")
async def get_study_metadata(study_uid: str):
    """WADO-RS: Get all instance metadata for a study."""
    
    study_path = settings.STORAGE_PATH / study_uid
    
    if not study_path.exists():
        raise HTTPException(status_code=404, detail="Study not found")
    
    metadata_list = []
    
    for series_dir in study_path.iterdir():
        if series_dir.is_dir():
            for dcm_file in series_dir.glob("*.dcm"):
                dicomweb_json = parser.to_dicomweb_json(dcm_file)
                metadata_list.append(dicomweb_json)
    
    return Response(
        content=f"[{','.join(metadata_list)}]",
        media_type="application/dicom+json",
    )


@router.get("/studies/{study_uid}/series/{series_uid}/metadata")
async def get_series_metadata(study_uid: str, series_uid: str):
    """WADO-RS: Get all instance metadata for a series."""
    
    series_path = settings.STORAGE_PATH / study_uid / series_uid
    
    if not series_path.exists():
        raise HTTPException(status_code=404, detail="Series not found")
    
    metadata_list = []
    
    for dcm_file in sorted(series_path.glob("*.dcm")):
        dicomweb_json = parser.to_dicomweb_json(dcm_file)
        metadata_list.append(dicomweb_json)
    
    return Response(
        content=f"[{','.join(metadata_list)}]",
        media_type="application/dicom+json",
    )
