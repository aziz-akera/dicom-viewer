"""DICOMweb WADO-RS and QIDO-RS endpoints for Cornerstone3D"""

from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import StreamingResponse
from pathlib import Path
from typing import Optional
import io
import json

from app.config import settings
from app.services.dicom_parser import DICOMParserService

router = APIRouter()
parser = DICOMParserService()


# ==================== QIDO-RS Endpoints ====================

@router.get("/studies")
async def search_studies(
    PatientID: Optional[str] = Query(None),
    PatientName: Optional[str] = Query(None),
    StudyDate: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
):
    """QIDO-RS: Search for studies."""
    
    storage_path = settings.STORAGE_PATH
    
    if not storage_path.exists():
        return Response(content="[]", media_type="application/dicom+json")
    
    studies = []
    
    for study_dir in storage_path.iterdir():
        if not study_dir.is_dir():
            continue
            
        # Find first DICOM file to extract study metadata
        study_metadata = None
        for series_dir in study_dir.iterdir():
            if series_dir.is_dir():
                for dcm_file in series_dir.glob("*.dcm"):
                    try:
                        study_metadata = parser.parse_file(dcm_file)
                        break
                    except:
                        continue
            if study_metadata:
                break
        
        if not study_metadata:
            continue
            
        # Apply filters
        if PatientID and PatientID not in study_metadata.get("patient_id", ""):
            continue
        if PatientName and PatientName.lower() not in study_metadata.get("patient_name", "").lower():
            continue
        if StudyDate and StudyDate != study_metadata.get("study_date", ""):
            continue
        
        # Count series and instances
        series_count = sum(1 for d in study_dir.iterdir() if d.is_dir())
        instance_count = sum(
            len(list(s.glob("*.dcm"))) 
            for s in study_dir.iterdir() 
            if s.is_dir()
        )
        
        studies.append({
            "0020000D": {"vr": "UI", "Value": [study_metadata.get("study_instance_uid", "")]},
            "00100010": {"vr": "PN", "Value": [{"Alphabetic": study_metadata.get("patient_name", "")}]},
            "00100020": {"vr": "LO", "Value": [study_metadata.get("patient_id", "")]},
            "00080020": {"vr": "DA", "Value": [study_metadata.get("study_date", "")]},
            "00080030": {"vr": "TM", "Value": [study_metadata.get("study_time", "")]},
            "00080050": {"vr": "SH", "Value": [study_metadata.get("accession_number", "")]},
            "00080061": {"vr": "CS", "Value": [study_metadata.get("modality", "")]},
            "00081030": {"vr": "LO", "Value": [study_metadata.get("study_description", "")]},
            "00201206": {"vr": "IS", "Value": [series_count]},
            "00201208": {"vr": "IS", "Value": [instance_count]},
        })
    
    # Apply pagination
    paginated = studies[offset:offset + limit]
    
    return Response(
        content=json.dumps(paginated),
        media_type="application/dicom+json",
    )


@router.get("/studies/{study_uid}/series")
async def search_series(
    study_uid: str,
    Modality: Optional[str] = Query(None),
    SeriesNumber: Optional[int] = Query(None),
):
    """QIDO-RS: Search for series within a study."""
    
    study_path = settings.STORAGE_PATH / study_uid
    
    if not study_path.exists():
        raise HTTPException(status_code=404, detail="Study not found")
    
    series_list = []
    
    for series_dir in study_path.iterdir():
        if not series_dir.is_dir():
            continue
        
        # Get first DICOM file for series metadata
        series_metadata = None
        dcm_files = list(series_dir.glob("*.dcm"))
        
        if dcm_files:
            try:
                series_metadata = parser.parse_file(dcm_files[0])
            except:
                continue
        
        if not series_metadata:
            continue
        
        # Apply filters
        if Modality and Modality != series_metadata.get("modality", ""):
            continue
        if SeriesNumber is not None and SeriesNumber != series_metadata.get("series_number"):
            continue
        
        series_list.append({
            "0020000E": {"vr": "UI", "Value": [series_metadata.get("series_instance_uid", "")]},
            "0020000D": {"vr": "UI", "Value": [study_uid]},
            "00080060": {"vr": "CS", "Value": [series_metadata.get("modality", "")]},
            "0008103E": {"vr": "LO", "Value": [series_metadata.get("series_description", "")]},
            "00200011": {"vr": "IS", "Value": [series_metadata.get("series_number", 0)]},
            "00201209": {"vr": "IS", "Value": [len(dcm_files)]},
        })
    
    return Response(
        content=json.dumps(series_list),
        media_type="application/dicom+json",
    )


# ==================== WADO-RS Endpoints ====================


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
