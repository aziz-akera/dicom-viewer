"""DICOM parsing service using pydicom"""

from pydicom import dcmread
from pydicom.dataset import Dataset
from pathlib import Path
from typing import Dict, Any, Optional
import json


class DICOMParserService:
    """Parse DICOM files and extract metadata."""
    
    def parse_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse a DICOM file and extract metadata."""
        ds = dcmread(file_path)
        return self._extract_metadata(ds)
    
    def parse_bytes(self, content: bytes) -> Optional[Dict[str, Any]]:
        """Parse DICOM from bytes."""
        try:
            import io
            ds = dcmread(io.BytesIO(content))
            return self._extract_metadata(ds)
        except Exception:
            return None
    
    def _extract_metadata(self, ds: Dataset) -> Dict[str, Any]:
        """Extract normalized metadata from Dataset."""
        return {
            # UIDs
            "study_instance_uid": str(ds.StudyInstanceUID) if "StudyInstanceUID" in ds else None,
            "series_instance_uid": str(ds.SeriesInstanceUID) if "SeriesInstanceUID" in ds else None,
            "sop_instance_uid": str(ds.SOPInstanceUID) if "SOPInstanceUID" in ds else None,
            "sop_class_uid": str(ds.SOPClassUID) if "SOPClassUID" in ds else None,
            
            # Patient info
            "patient_name": str(ds.PatientName) if "PatientName" in ds else None,
            "patient_id": str(ds.PatientID) if "PatientID" in ds else None,
            "patient_birth_date": str(ds.PatientBirthDate) if "PatientBirthDate" in ds else None,
            "patient_sex": str(ds.PatientSex) if "PatientSex" in ds else None,
            
            # Study info
            "study_date": str(ds.StudyDate) if "StudyDate" in ds else None,
            "study_time": str(ds.StudyTime) if "StudyTime" in ds else None,
            "study_description": str(ds.StudyDescription) if "StudyDescription" in ds else None,
            "accession_number": str(ds.AccessionNumber) if "AccessionNumber" in ds else None,
            
            # Series info
            "series_date": str(ds.SeriesDate) if "SeriesDate" in ds else None,
            "series_description": str(ds.SeriesDescription) if "SeriesDescription" in ds else None,
            "series_number": int(ds.SeriesNumber) if "SeriesNumber" in ds else None,
            "modality": str(ds.Modality) if "Modality" in ds else None,
            
            # Instance info
            "instance_number": int(ds.InstanceNumber) if "InstanceNumber" in ds else None,
            
            # Image info
            "rows": int(ds.Rows) if "Rows" in ds else None,
            "columns": int(ds.Columns) if "Columns" in ds else None,
            "bits_allocated": int(ds.BitsAllocated) if "BitsAllocated" in ds else None,
            "bits_stored": int(ds.BitsStored) if "BitsStored" in ds else None,
            "pixel_representation": int(ds.PixelRepresentation) if "PixelRepresentation" in ds else None,
            "photometric_interpretation": str(ds.PhotometricInterpretation) if "PhotometricInterpretation" in ds else None,
            "samples_per_pixel": int(ds.SamplesPerPixel) if "SamplesPerPixel" in ds else None,
            
            # Geometry
            "pixel_spacing": [float(x) for x in ds.PixelSpacing] if "PixelSpacing" in ds else None,
            "slice_thickness": float(ds.SliceThickness) if "SliceThickness" in ds else None,
            "image_position_patient": [float(x) for x in ds.ImagePositionPatient] if "ImagePositionPatient" in ds else None,
            "image_orientation_patient": [float(x) for x in ds.ImageOrientationPatient] if "ImageOrientationPatient" in ds else None,
            
            # Window/Level
            "window_center": self._get_window_value(ds, "WindowCenter"),
            "window_width": self._get_window_value(ds, "WindowWidth"),
            "rescale_intercept": float(ds.RescaleIntercept) if "RescaleIntercept" in ds else 0,
            "rescale_slope": float(ds.RescaleSlope) if "RescaleSlope" in ds else 1,
            
            # Transfer Syntax
            "transfer_syntax_uid": str(ds.file_meta.TransferSyntaxUID) if hasattr(ds, "file_meta") and "TransferSyntaxUID" in ds.file_meta else None,
            
            # Number of frames
            "number_of_frames": int(ds.NumberOfFrames) if "NumberOfFrames" in ds else 1,
        }
    
    def _get_window_value(self, ds: Dataset, tag: str) -> Optional[float]:
        if tag not in ds:
            return None
        val = getattr(ds, tag)
        if isinstance(val, (list, tuple)):
            return float(val[0])
        try:
            return float(val)
        except (TypeError, ValueError):
            return None
    
    def to_dicomweb_json(self, file_path: Path) -> str:
        """Convert DICOM to DICOMweb JSON format."""
        ds = dcmread(file_path)
        
        def tag_to_keyword(tag):
            """Convert tag to keyword string."""
            return f"{tag.group:04X}{tag.element:04X}"
        
        def value_to_json(elem):
            """Convert element value to JSON-serializable format."""
            if elem.VR == "SQ":
                return [{"Value": [value_to_json(item) for item in seq_item]} for seq_item in elem.value]
            elif elem.VR in ("OB", "OW", "OF", "OD", "UN"):
                return None  # Skip binary data
            elif elem.VR == "PN":
                return [{"Alphabetic": str(elem.value)}]
            elif elem.VM > 1:
                return list(elem.value)
            else:
                return [elem.value] if elem.value is not None else []
        
        result = {}
        
        for elem in ds:
            if elem.tag.group == 0x7FE0:  # Skip pixel data
                continue
            
            tag_str = tag_to_keyword(elem.tag)
            value = value_to_json(elem)
            
            if value is not None:
                result[tag_str] = {
                    "vr": elem.VR,
                    "Value": value,
                }
        
        return json.dumps(result)
    
    def get_pixel_data(self, file_path: Path, frame: int = 1) -> Optional[bytes]:
        """Get pixel data for a specific frame."""
        ds = dcmread(file_path)
        
        if "PixelData" not in ds:
            return None
        
        pixel_array = ds.pixel_array
        
        # Handle multi-frame
        if len(pixel_array.shape) > 2 and pixel_array.shape[0] > 1:
            if frame < 1 or frame > pixel_array.shape[0]:
                return None
            pixel_array = pixel_array[frame - 1]
        
        return pixel_array.tobytes()
