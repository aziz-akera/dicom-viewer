/**
 * DICOM Upload Dialog
 */

import React, { useRef, useState, useCallback } from 'react';
import { uploadApi } from '../../services/api';
import { useViewerStore } from '../../stores/viewerStore';
import { X, Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    uploaded: number;
    failed: number;
    errors: Array<{ filename: string; error: string }>;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Filter to only DICOM files (or files without extension - common for DICOM)
      const dicomFiles = files.filter(
        (f) => f.name.endsWith('.dcm') || f.name.endsWith('.DCM') || !f.name.includes('.')
      );
      setSelectedFiles((prev) => [...prev, ...dicomFiles]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const dicomFiles = files.filter(
      (f) => f.name.endsWith('.dcm') || f.name.endsWith('.DCM') || !f.name.includes('.')
    );
    setSelectedFiles((prev) => [...prev, ...dicomFiles]);
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const response = await uploadApi.uploadFiles(selectedFiles, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(response.data);

      if (response.data.uploaded > 0) {
        onUploadComplete();
      }
    } catch (error: any) {
      setUploadResult({
        uploaded: 0,
        failed: selectedFiles.length,
        errors: [{ filename: 'Upload', error: error.message || 'Upload failed' }],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    clearFiles();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Upload DICOM Files</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <Upload size={40} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-300 mb-2">
              Drag and drop DICOM files here, or
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".dcm,.DCM,*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {selectedFiles.length} file(s) selected
                </span>
                <button
                  onClick={clearFiles}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.slice(0, 10).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <File size={14} />
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-500 ml-auto">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
                {selectedFiles.length > 10 && (
                  <div className="text-sm text-gray-500">
                    ...and {selectedFiles.length - 10} more files
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span className="text-sm text-gray-300">
                  Uploading... {uploadProgress}%
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload result */}
          {uploadResult && (
            <div className="mt-4 p-3 rounded-lg bg-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                {uploadResult.failed === 0 ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <AlertCircle size={18} className="text-yellow-500" />
                )}
                <span className="text-sm text-gray-200">
                  {uploadResult.uploaded} uploaded, {uploadResult.failed} failed
                </span>
              </div>
              {uploadResult.errors.length > 0 && (
                <div className="text-xs text-red-400 space-y-1">
                  {uploadResult.errors.slice(0, 3).map((err, i) => (
                    <div key={i}>
                      {err.filename}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDialog;
