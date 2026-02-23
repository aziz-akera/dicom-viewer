/**
 * DICOM Viewer Application
 */

import React, { useEffect, useState, useCallback } from 'react';
import { RenderingEngine } from '@cornerstonejs/core';
import { initCornerstone, createToolGroup } from './cornerstone/init';
import { useViewerStore } from './stores/viewerStore';
import { dicomwebApi, studiesApi } from './services/api';
import { Toolbar } from './components/toolbar/Toolbar';
import { StudyBrowser } from './components/panels/StudyBrowser';
import { Viewport } from './components/viewer/Viewport';
import { UploadDialog } from './components/panels/UploadDialog';
import { Loader2 } from 'lucide-react';

const RENDERING_ENGINE_ID = 'dicomViewerEngine';
const TOOL_GROUP_ID = 'dicomViewerToolGroup';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [imageIds, setImageIds] = useState<string[]>([]);

  const {
    setRenderingEngine,
    currentStudy,
    currentSeries,
    instances,
    setStudies,
    layout,
    isLoading,
    error,
  } = useViewerStore();

  // Initialize Cornerstone3D
  useEffect(() => {
    const init = async () => {
      try {
        await initCornerstone();
        
        // Create rendering engine
        const renderingEngine = new RenderingEngine(RENDERING_ENGINE_ID);
        setRenderingEngine(renderingEngine);
        
        // Create tool group
        createToolGroup(TOOL_GROUP_ID);
        
        setIsInitialized(true);
      } catch (error: any) {
        console.error('Failed to initialize Cornerstone:', error);
        setInitError(error.message || 'Failed to initialize viewer');
      }
    };

    init();

    return () => {
      // Cleanup
      const engine = RenderingEngine.getOrCreateRenderingEngine(RENDERING_ENGINE_ID);
      if (engine) {
        engine.destroy();
      }
    };
  }, []);

  // Build imageIds when series changes
  useEffect(() => {
    if (!currentStudy || !currentSeries || instances.length === 0) {
      setImageIds([]);
      return;
    }

    const ids = instances.map((instance) => {
      const url = dicomwebApi.getInstanceUrl(
        currentStudy.study_instance_uid,
        currentSeries.series_instance_uid,
        instance.sop_instance_uid
      );
      return `wadouri:${url}`;
    });

    setImageIds(ids);
  }, [currentStudy, currentSeries, instances]);

  const handleUploadComplete = async () => {
    // Refresh study list
    try {
      const response = await studiesApi.list();
      setStudies(response.data);
    } catch (error) {
      console.error('Failed to refresh studies:', error);
    }
  };

  // Show loading/error states
  if (initError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Failed to Initialize</div>
          <div className="text-gray-400">{initError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
          <div className="text-gray-300">Initializing DICOM Viewer...</div>
        </div>
      </div>
    );
  }

  // Generate viewport grid
  const viewports = [];
  for (let i = 0; i < layout.rows * layout.cols; i++) {
    viewports.push(
      <Viewport
        key={`viewport-${i}`}
        viewportId={`viewport-${i}`}
        toolGroupId={TOOL_GROUP_ID}
        imageIds={i === 0 ? imageIds : []}
        className="border border-gray-700"
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        toolGroupId={TOOL_GROUP_ID}
        onUploadClick={() => setIsUploadOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Study Browser Sidebar */}
        <div className="w-64 flex-shrink-0">
          <StudyBrowser />
        </div>

        {/* Viewport Grid */}
        <div
          className="flex-1 grid gap-1 p-1 bg-gray-950"
          style={{
            gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          }}
        >
          {viewports}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <Loader2 size={40} className="animate-spin text-white" />
        </div>
      )}

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

export default App;
