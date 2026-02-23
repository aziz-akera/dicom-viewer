"""Study-level API endpoints"""

from fastapi import APIRouter, HTTPException
from pathlib import Path
from typing import List, Dict, Any

from app.config import settings
from app.services.dicom_parser import DICOMParserService

router = APIRouter()
parser = DICOMParserService()


@router.get("/")
async def list_studies() -> List[Dict[str, Any]]:
    """List all available studies."""
    
    studies = []
    storage_path = settings.STORAGE_PATH
    
    if not storage_path.exists():
        return []
    
    for study_dir in storage_path.iterdir():
        if study_dir.is_dir():
            study_uid = study_dir.name
            
            # Get first DICOM file for metadata
            first_file = None
            series_count = 0
            instance_count = 0
            
            for series_dir in study_dir.iterdir():
                if series_dir.is_dir():
                    series_count += 1
                    for dcm_file in series_dir.glob("*.dcm"):
                        instance_count += 1
                        if first_file is None:
                            first_file = dcm_file
            
            if first_file:
                metadata = parser.parse_file(first_file)
                studies.append({
                    "study_instance_uid": study_uid,
                    "patient_name": metadata.get("patient_name"),
                    "patient_id": metadata.get("patient_id"),
                    "study_date": metadata.get("study_date"),
                    "study_description": metadata.get("study_description"),
                    "modality": metadata.get("modality"),
                    "series_count": series_count,
                    "instance_count": instance_count,
                })
    
    return studies


@router.get("/{study_uid}")
async def get_study(study_uid: str) -> Dict[str, Any]:
    """Get study details including all series."""
    
    study_path = settings.STORAGE_PATH / study_uid
    
    if not study_path.exists():
        raise HTTPException(status_code=404, detail="Study not found")
    
    series_list = []
    
    for series_dir in study_path.iterdir():
        if series_dir.is_dir():
            series_uid = series_dir.name
            instances = list(series_dir.glob("*.dcm"))
            
            if instances:
                # Get series metadata from first instance
                metadata = parser.parse_file(instances[0])
                
                series_list.append({
                    "series_instance_uid": series_uid,
                    "series_description": metadata.get("series_description"),
                    "series_number": metadata.get("series_number"),
                    "modality": metadata.get("modality"),
                    "instance_count": len(instances),
                })
    
    # Sort by series number
    series_list.sort(key=lambda x: x.get("series_number") or 0)
    
    return {
        "study_instance_uid": study_uid,
        "series": series_list,
    }


@router.get("/{study_uid}/series/{series_uid}")
async def get_series(study_uid: str, series_uid: str) -> Dict[str, Any]:
    """Get series details including all instances."""
    
    series_path = settings.STORAGE_PATH / study_uid / series_uid
    
    if not series_path.exists():
        raise HTTPException(status_code=404, detail="Series not found")
    
    instances = []
    
    for dcm_file in sorted(series_path.glob("*.dcm")):
        metadata = parser.parse_file(dcm_file)
        instances.append({
            "sop_instance_uid": metadata["sop_instance_uid"],
            "instance_number": metadata.get("instance_number"),
            "image_position_patient": metadata.get("image_position_patient"),
            "rows": metadata.get("rows"),
            "columns": metadata.get("columns"),
        })
    
    # Sort by instance number or image position
    instances.sort(key=lambda x: x.get("instance_number") or 0)
    
    return {
        "study_instance_uid": study_uid,
        "series_instance_uid": series_uid,
        "instances": instances,
    }


@router.delete("/{study_uid}")
async def delete_study(study_uid: str):
    """Delete a study and all its files."""
    
    study_path = settings.STORAGE_PATH / study_uid
    
    if not study_path.exists():
        raise HTTPException(status_code=404, detail="Study not found")
    
    import shutil
    shutil.rmtree(study_path)
    
    return {"message": f"Study {study_uid} deleted"}
