/**
 * API Service
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Studies API
export const studiesApi = {
  list: () => api.get('/studies'),
  get: (studyUid: string) => api.get(`/studies/${studyUid}`),
  getSeries: (studyUid: string, seriesUid: string) => 
    api.get(`/studies/${studyUid}/series/${seriesUid}`),
  delete: (studyUid: string) => api.delete(`/studies/${studyUid}`),
};

// Upload API
export const uploadApi = {
  uploadFiles: (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

// DICOMweb API
export const dicomwebApi = {
  getInstanceMetadata: (studyUid: string, seriesUid: string, sopUid: string) =>
    api.get(`/dicomweb/studies/${studyUid}/series/${seriesUid}/instances/${sopUid}/metadata`),
  
  getStudyMetadata: (studyUid: string) =>
    api.get(`/dicomweb/studies/${studyUid}/metadata`),
  
  getSeriesMetadata: (studyUid: string, seriesUid: string) =>
    api.get(`/dicomweb/studies/${studyUid}/series/${seriesUid}/metadata`),
  
  // Get the URL for loading an instance (for Cornerstone)
  getInstanceUrl: (studyUid: string, seriesUid: string, sopUid: string) =>
    `${API_BASE}/dicomweb/studies/${studyUid}/series/${seriesUid}/instances/${sopUid}`,
};

export default api;
