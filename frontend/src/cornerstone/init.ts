/**
 * Cornerstone3D Initialization
 * 
 * This module initializes the Cornerstone3D rendering engine, tools, and image loaders.
 */

import {
  RenderingEngine,
  Enums,
  init as csInit,
  volumeLoader,
  setVolumesForViewports,
  cache,
} from '@cornerstonejs/core';
import {
  init as csToolsInit,
  addTool,
  ToolGroupManager,
  ZoomTool,
  PanTool,
  WindowLevelTool,
  StackScrollTool,
  LengthTool,
  ProbeTool,
  RectangleROITool,
  EllipticalROITool,
  BidirectionalTool,
  AngleTool,
  ArrowAnnotateTool,
  CrosshairsTool,
  Enums as csToolsEnums,
} from '@cornerstonejs/tools';
import {
  init as dicomImageLoaderInit,
  wadouri,
} from '@cornerstonejs/dicom-image-loader';

let initialized = false;

export async function initCornerstone(): Promise<void> {
  if (initialized) {
    return;
  }

  // Initialize Cornerstone Core
  await csInit();

  // Initialize DICOM Image Loader
  dicomImageLoaderInit({
    maxWebWorkers: navigator.hardwareConcurrency || 4,
  });

  // Register wadouri scheme
  wadouri.register();

  // Initialize Cornerstone Tools
  await csToolsInit();

  // Register all tools
  addTool(ZoomTool);
  addTool(PanTool);
  addTool(WindowLevelTool);
  addTool(StackScrollTool);
  addTool(LengthTool);
  addTool(ProbeTool);
  addTool(RectangleROITool);
  addTool(EllipticalROITool);
  addTool(BidirectionalTool);
  addTool(AngleTool);
  addTool(ArrowAnnotateTool);
  addTool(CrosshairsTool);

  // Set cache size (2GB)
  cache.setMaxCacheSize(2 * 1024 * 1024 * 1024);

  initialized = true;
  console.log('Cornerstone3D initialized successfully');
}

export function createToolGroup(toolGroupId: string): ReturnType<typeof ToolGroupManager.createToolGroup> {
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
  
  if (!toolGroup) {
    throw new Error(`Failed to create tool group: ${toolGroupId}`);
  }

  // Add all tools to the group
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(WindowLevelTool.toolName);
  toolGroup.addTool(StackScrollTool.toolName);
  toolGroup.addTool(LengthTool.toolName);
  toolGroup.addTool(ProbeTool.toolName);
  toolGroup.addTool(RectangleROITool.toolName);
  toolGroup.addTool(EllipticalROITool.toolName);
  toolGroup.addTool(BidirectionalTool.toolName);
  toolGroup.addTool(AngleTool.toolName);
  toolGroup.addTool(ArrowAnnotateTool.toolName);

  // Set default tool bindings
  // Left click: Window/Level
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }],
  });

  // Middle click: Pan
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Auxiliary }],
  });

  // Right click: Zoom
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary }],
  });

  // Mouse wheel: Stack scroll (StackScrollTool handles wheel by default)
  toolGroup.setToolActive(StackScrollTool.toolName);

  // Set measurement tools as passive (can be enabled on demand)
  toolGroup.setToolPassive(LengthTool.toolName);
  toolGroup.setToolPassive(ProbeTool.toolName);
  toolGroup.setToolPassive(RectangleROITool.toolName);
  toolGroup.setToolPassive(EllipticalROITool.toolName);
  toolGroup.setToolPassive(BidirectionalTool.toolName);
  toolGroup.setToolPassive(AngleTool.toolName);
  toolGroup.setToolPassive(ArrowAnnotateTool.toolName);

  return toolGroup;
}

export { RenderingEngine, Enums, volumeLoader, setVolumesForViewports };
export { ToolGroupManager, csToolsEnums };
