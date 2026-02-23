/**
 * Study Browser Panel
 */

import React, { useEffect, useState } from 'react';
import { useViewerStore, Study, Series } from '../../stores/viewerStore';
import { studiesApi } from '../../services/api';
import { Folder, Image, ChevronRight, ChevronDown, Trash2, RefreshCw } from 'lucide-react';

export const StudyBrowser: React.FC = () => {
  const {
    studies,
    setStudies,
    currentStudy,
    setCurrentStudy,
    seriesList,
    setSeriesList,
    currentSeries,
    setCurrentSeries,
    setInstances,
    setIsLoading,
    setError,
  } = useViewerStore();

  const [expandedStudies, setExpandedStudies] = useState<Set<string>>(new Set());

  const loadStudies = async () => {
    setIsLoading(true);
    try {
      const response = await studiesApi.list();
      setStudies(response.data);
    } catch (error: any) {
      setError(error.message || 'Failed to load studies');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudyDetails = async (study: Study) => {
    try {
      const response = await studiesApi.get(study.study_instance_uid);
      setSeriesList(response.data.series || []);
    } catch (error: any) {
      setError(error.message || 'Failed to load study details');
    }
  };

  const loadSeriesInstances = async (studyUid: string, series: Series) => {
    try {
      const response = await studiesApi.getSeries(studyUid, series.series_instance_uid);
      setInstances(response.data.instances || []);
      setCurrentSeries(series);
    } catch (error: any) {
      setError(error.message || 'Failed to load series');
    }
  };

  const toggleStudyExpanded = (studyUid: string) => {
    const newExpanded = new Set(expandedStudies);
    if (newExpanded.has(studyUid)) {
      newExpanded.delete(studyUid);
    } else {
      newExpanded.add(studyUid);
    }
    setExpandedStudies(newExpanded);
  };

  const handleStudyClick = async (study: Study) => {
    setCurrentStudy(study);
    toggleStudyExpanded(study.study_instance_uid);
    
    if (!expandedStudies.has(study.study_instance_uid)) {
      await loadStudyDetails(study);
    }
  };

  const handleSeriesClick = async (study: Study, series: Series) => {
    setCurrentStudy(study);
    await loadSeriesInstances(study.study_instance_uid, series);
  };

  const handleDeleteStudy = async (e: React.MouseEvent, study: Study) => {
    e.stopPropagation();
    if (confirm(`Delete study for ${study.patient_name || 'Unknown'}?`)) {
      try {
        await studiesApi.delete(study.study_instance_uid);
        await loadStudies();
      } catch (error: any) {
        setError(error.message || 'Failed to delete study');
      }
    }
  };

  useEffect(() => {
    loadStudies();
  }, []);

  return (
    <div className="h-full bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-200">Studies</h2>
        <button
          onClick={loadStudies}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Study List */}
      <div className="flex-1 overflow-y-auto">
        {studies.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No studies loaded.<br />
            Upload DICOM files to begin.
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {studies.map((study) => (
              <div key={study.study_instance_uid}>
                {/* Study row */}
                <div
                  onClick={() => handleStudyClick(study)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    currentStudy?.study_instance_uid === study.study_instance_uid
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  {expandedStudies.has(study.study_instance_uid) ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <Folder size={16} className="text-yellow-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">
                      {study.patient_name || 'Unknown Patient'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {study.study_date || 'No date'} • {study.modality || '?'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteStudy(e, study)}
                    className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>

                {/* Series list (expanded) */}
                {expandedStudies.has(study.study_instance_uid) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {seriesList.map((series) => (
                      <div
                        key={series.series_instance_uid}
                        onClick={() => handleSeriesClick(study, series)}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          currentSeries?.series_instance_uid === series.series_instance_uid
                            ? 'bg-green-600/20 border border-green-500/50'
                            : 'hover:bg-gray-800'
                        }`}
                      >
                        <Image size={14} className="text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-300 truncate">
                            {series.series_description || `Series ${series.series_number || '?'}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {series.instance_count || 0} images • {series.modality || '?'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyBrowser;
