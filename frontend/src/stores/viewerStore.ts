/**
 * Viewer State Store (Zustand)
 */

import { create } from 'zustand';
import { RenderingEngine } from '@cornerstonejs/core';

export interface Study {
  study_instance_uid: string;
  patient_name?: string;
  patient_id?: string;
  study_date?: string;
  study_description?: string;
  modality?: string;
  series_count?: number;
  instance_count?: number;
}

export interface Series {
  series_instance_uid: string;
  series_description?: string;
  series_number?: number;
  modality?: string;
  instance_count?: number;
}

export interface Instance {
  sop_instance_uid: string;
  instance_number?: number;
  image_position_patient?: number[];
  rows?: number;
  columns?: number;
}

interface ViewerState {
  // Rendering engine
  renderingEngine: RenderingEngine | null;
  setRenderingEngine: (engine: RenderingEngine | null) => void;

  // Studies
  studies: Study[];
  setStudies: (studies: Study[]) => void;
  addStudy: (study: Study) => void;

  // Current selection
  currentStudy: Study | null;
  currentSeries: Series | null;
  setCurrentStudy: (study: Study | null) => void;
  setCurrentSeries: (series: Series | null) => void;

  // Series list for current study
  seriesList: Series[];
  setSeriesList: (series: Series[]) => void;

  // Instances for current series
  instances: Instance[];
  setInstances: (instances: Instance[]) => void;

  // Active tool
  activeTool: string;
  setActiveTool: (tool: string) => void;

  // Layout
  layout: { rows: number; cols: number };
  setLayout: (layout: { rows: number; cols: number }) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  // Rendering engine
  renderingEngine: null,
  setRenderingEngine: (engine) => set({ renderingEngine: engine }),

  // Studies
  studies: [],
  setStudies: (studies) => set({ studies }),
  addStudy: (study) => set((state) => ({
    studies: [...state.studies.filter(s => s.study_instance_uid !== study.study_instance_uid), study]
  })),

  // Current selection
  currentStudy: null,
  currentSeries: null,
  setCurrentStudy: (study) => set({ currentStudy: study }),
  setCurrentSeries: (series) => set({ currentSeries: series }),

  // Series list
  seriesList: [],
  setSeriesList: (seriesList) => set({ seriesList }),

  // Instances
  instances: [],
  setInstances: (instances) => set({ instances }),

  // Active tool
  activeTool: 'WindowLevel',
  setActiveTool: (activeTool) => set({ activeTool }),

  // Layout
  layout: { rows: 1, cols: 1 },
  setLayout: (layout) => set({ layout }),

  // Loading
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // Error
  error: null,
  setError: (error) => set({ error }),
}));
