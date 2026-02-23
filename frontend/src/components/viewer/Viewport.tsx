/**
 * Cornerstone3D Viewport Component
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { RenderingEngine, Enums, Types } from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import { useViewerStore } from '../../stores/viewerStore';

interface ViewportProps {
  viewportId: string;
  toolGroupId: string;
  imageIds?: string[];
  className?: string;
}

export const Viewport: React.FC<ViewportProps> = ({
  viewportId,
  toolGroupId,
  imageIds = [],
  className = '',
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { renderingEngine } = useViewerStore();

  useEffect(() => {
    if (!renderingEngine || !elementRef.current || imageIds.length === 0) {
      return;
    }

    const element = elementRef.current;

    // Enable the viewport
    const viewportInput: Types.PublicViewportInput = {
      viewportId,
      type: Enums.ViewportType.STACK,
      element,
      defaultOptions: {
        background: [0, 0, 0] as Types.Point3,
      },
    };

    renderingEngine.enableElement(viewportInput);

    // Get the viewport and set the stack
    const viewport = renderingEngine.getViewport(viewportId) as Types.IStackViewport;
    
    if (viewport) {
      viewport.setStack(imageIds).then(() => {
        viewport.render();
      });

      // Add viewport to tool group
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (toolGroup) {
        toolGroup.addViewport(viewportId, renderingEngine.id);
      }
    }

    return () => {
      // Cleanup
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (toolGroup) {
        toolGroup.removeViewports(renderingEngine.id, viewportId);
      }
      renderingEngine.disableElement(viewportId);
    };
  }, [renderingEngine, viewportId, toolGroupId, imageIds]);

  return (
    <div className={`viewport-container ${className}`}>
      <div
        ref={elementRef}
        className="viewport-element"
        style={{ width: '100%', height: '100%' }}
      />
      <ViewportOverlay viewportId={viewportId} />
    </div>
  );
};

interface ViewportOverlayProps {
  viewportId: string;
}

const ViewportOverlay: React.FC<ViewportOverlayProps> = ({ viewportId }) => {
  const { currentStudy, currentSeries } = useViewerStore();

  return (
    <div className="viewport-overlay pointer-events-none">
      <div className="viewport-overlay-tl">
        <div>{currentStudy?.patient_name || 'Unknown'}</div>
        <div>{currentStudy?.patient_id || ''}</div>
      </div>
      <div className="viewport-overlay-tr">
        <div>{currentStudy?.study_date || ''}</div>
        <div>{currentSeries?.modality || ''}</div>
      </div>
      <div className="viewport-overlay-bl">
        <div>{currentSeries?.series_description || ''}</div>
      </div>
      <div className="viewport-overlay-br">
        <div>W/L: ---</div>
        <div>Zoom: 100%</div>
      </div>
    </div>
  );
};

export default Viewport;
