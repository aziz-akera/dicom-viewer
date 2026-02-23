# DICOM Medical Imaging Viewer

A full-featured DICOM viewer built with **Cornerstone3D** (frontend) and **FastAPI** (backend).

![DICOM Viewer](https://img.shields.io/badge/DICOM-Viewer-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)

## Features

### Current (Phase 1)
- ✅ DICOM file upload (single & multiple files)
- ✅ Study/Series browser with hierarchical navigation
- ✅ 2D Stack viewport for image viewing
- ✅ Basic manipulation tools:
  - Window/Level adjustment
  - Zoom (mouse wheel + right click)
  - Pan (middle click)
  - Stack scroll through slices

### Coming Soon
- 📐 Measurement tools (Length, ROI, Angle)
- 🔄 MPR (Multi-Planar Reconstruction)
- 📝 Annotations with persistence
- 🏥 PACS integration (C-FIND, C-MOVE)
- 📤 Export to PNG/JPEG/DICOM

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** for fast development
- **Cornerstone3D** for DICOM rendering
- **Zustand** for state management
- **TailwindCSS** for styling

### Backend
- **FastAPI** (Python 3.11+)
- **pydicom** for DICOM parsing
- **pynetdicom** for PACS integration (coming soon)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. Click **Upload DICOM** in the toolbar
2. Drag & drop DICOM files or browse to select
3. Click a study in the left panel to expand series
4. Click a series to load it in the viewport
5. Use tools from the toolbar:
   - **Left click + drag**: Window/Level
   - **Right click + drag**: Zoom
   - **Middle click + drag**: Pan
   - **Mouse wheel**: Scroll through slices

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/upload/` | POST | Upload DICOM files |
| `/api/v1/studies/` | GET | List all studies |
| `/api/v1/studies/{uid}` | GET | Get study details |
| `/api/v1/studies/{uid}/series/{uid}` | GET | Get series instances |
| `/api/v1/dicomweb/...` | GET | DICOMweb WADO-RS endpoints |

## Project Structure

```
dicom-viewer/
├── frontend/
│   ├── src/
│   │   ├── cornerstone/     # Cornerstone3D setup
│   │   ├── components/      # React components
│   │   ├── stores/          # Zustand stores
│   │   ├── services/        # API services
│   │   └── App.tsx          # Main app
│   └── package.json
├── backend/
│   └── app/
│       ├── api/v1/          # API endpoints
│       ├── services/        # Business logic
│       └── main.py          # FastAPI app
└── README.md
```

## Development

### Adding New Tools

1. Import tool from `@cornerstonejs/tools`
2. Register in `cornerstone/init.ts`
3. Add to tool group with desired bindings
4. Add toolbar button in `Toolbar.tsx`

### Custom Metadata Provider

For advanced DICOM metadata handling, extend `cornerstone/metadataProvider.ts`.

## License

MIT

## Acknowledgments

- [Cornerstone3D](https://www.cornerstonejs.org/) - DICOM rendering engine
- [OHIF Viewer](https://ohif.org/) - Reference implementation
- [pydicom](https://pydicom.github.io/) - Python DICOM library
