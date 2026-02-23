/**
 * Viewer Toolbar Component
 */

import React from 'react';
import { ToolGroupManager, Enums as csToolsEnums } from '@cornerstonejs/tools';
import { useViewerStore } from '../../stores/viewerStore';
import {
  ZoomIn,
  Move,
  Sun,
  Ruler,
  Circle,
  SquareDashed,
  ArrowUpRight,
  Triangle,
  Crosshair,
  RotateCcw,
  Grid2x2,
  Grid3x3,
  Maximize2,
  Download,
  Upload,
} from 'lucide-react';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  toolName: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
    title={label}
  >
    {icon}
  </button>
);

interface ToolbarProps {
  toolGroupId: string;
  onUploadClick: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ toolGroupId, onUploadClick }) => {
  const { activeTool, setActiveTool, setLayout } = useViewerStore();

  const setToolActive = (toolName: string) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) return;

    // Deactivate current primary tool
    if (activeTool !== toolName) {
      try {
        toolGroup.setToolPassive(activeTool);
      } catch (e) {
        // Tool might not exist
      }
    }

    // Activate new tool
    toolGroup.setToolActive(toolName, {
      bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }],
    });

    setActiveTool(toolName);
  };

  const tools = [
    { name: 'WindowLevel', icon: <Sun size={20} />, label: 'Window/Level' },
    { name: 'Zoom', icon: <ZoomIn size={20} />, label: 'Zoom' },
    { name: 'Pan', icon: <Move size={20} />, label: 'Pan' },
    { name: 'Length', icon: <Ruler size={20} />, label: 'Length' },
    { name: 'EllipticalROI', icon: <Circle size={20} />, label: 'Ellipse ROI' },
    { name: 'RectangleROI', icon: <SquareDashed size={20} />, label: 'Rectangle ROI' },
    { name: 'Bidirectional', icon: <ArrowUpRight size={20} />, label: 'Bidirectional' },
    { name: 'Angle', icon: <Triangle size={20} />, label: 'Angle' },
  ];

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
      {/* Upload button */}
      <button
        onClick={onUploadClick}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
      >
        <Upload size={18} />
        <span>Upload DICOM</span>
      </button>

      <div className="w-px h-8 bg-gray-600 mx-2" />

      {/* Tools */}
      {tools.map((tool) => (
        <ToolButton
          key={tool.name}
          icon={tool.icon}
          label={tool.label}
          toolName={tool.name}
          isActive={activeTool === tool.name}
          onClick={() => setToolActive(tool.name)}
        />
      ))}

      <div className="w-px h-8 bg-gray-600 mx-2" />

      {/* Layout buttons */}
      <button
        onClick={() => setLayout({ rows: 1, cols: 1 })}
        className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
        title="1x1 Layout"
      >
        <Maximize2 size={20} />
      </button>
      <button
        onClick={() => setLayout({ rows: 1, cols: 2 })}
        className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
        title="1x2 Layout"
      >
        <Grid2x2 size={20} />
      </button>
      <button
        onClick={() => setLayout({ rows: 2, cols: 2 })}
        className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
        title="2x2 Layout"
      >
        <Grid3x3 size={20} />
      </button>

      <div className="w-px h-8 bg-gray-600 mx-2" />

      {/* Reset */}
      <button
        onClick={() => {
          // Reset viewport (TODO: implement)
        }}
        className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
        title="Reset View"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
};

export default Toolbar;
