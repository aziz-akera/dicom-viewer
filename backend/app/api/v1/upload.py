"""DICOM file upload endpoints"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import aiofiles
from pathlib import Path
import uuid

from app.config import settings
from app.services.dicom_parser import DICOMParserService

router = APIRouter()
parser = DICOMParserService()


@router.post("/")
async def upload_dicom_files(files: List[UploadFile] = File(...)):
    """Upload one or more DICOM files."""
    
    results = []
    errors = []
    
    for file in files:
        try:
            # Read file content
            content = await file.read()
            
            # Parse DICOM to extract metadata
            metadata = parser.parse_bytes(content)
            
            if not metadata:
                errors.append({"filename": file.filename, "error": "Invalid DICOM file"})
                continue
            
            # Organize by Study/Series/Instance
            study_uid = metadata["study_instance_uid"]
            series_uid = metadata["series_instance_uid"]
            sop_uid = metadata["sop_instance_uid"]
            
            # Create directory structure
            study_dir = settings.STORAGE_PATH / study_uid / series_uid
            study_dir.mkdir(parents=True, exist_ok=True)
            
            # Save file
            file_path = study_dir / f"{sop_uid}.dcm"
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(content)
            
            results.append({
                "filename": file.filename,
                "study_uid": study_uid,
                "series_uid": series_uid,
                "sop_uid": sop_uid,
                "metadata": metadata,
            })
            
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    
    return {
        "uploaded": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
    }


@router.post("/folder")
async def upload_dicom_folder(files: List[UploadFile] = File(...)):
    """Upload multiple DICOM files from a folder selection."""
    return await upload_dicom_files(files)
