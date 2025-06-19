import React, { useState } from 'react';
import { X, Save, Database, Clock, FileText, AlertCircle } from 'lucide-react';
import { saveSession, getStorageInfo } from '../../utils/sessionManager';
import { ImageAnalysis, MissionMetadata } from '../../types';

interface SessionSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: ImageAnalysis[];
  threshold: number;
  missionData?: MissionMetadata;
  onSaveSuccess: (sessionId: string) => void;
}

export const SessionSaveModal: React.FC<SessionSaveModalProps> = ({
  isOpen,
  onClose,
  analyses,
  threshold,
  missionData,
  onSaveSuccess
}) => {
  const [sessionName, setSessionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageInfo = getStorageInfo();

  const handleSave = async () => {
    if (!sessionName.trim()) {
      setError('Please enter a session name');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const sessionId = saveSession(analyses, threshold, missionData, sessionName.trim());
      onSaveSuccess(sessionId);
      onClose();
      setSessionName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      setSessionName('');
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-600">
        {/* Header */}
        <div className="p-6 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Save Session</h2>
              <p className="text-sm text-gray-400">Preserve your analysis for later</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{analyses.length}</div>
              <div className="text-xs text-gray-400">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length}
              </div>
              <div className="text-xs text-gray-400">Recommended</div>
            </div>
          </div>

          {/* Session Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Name
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter a descriptive name for this session"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              disabled={isSaving}
            />
          </div>

          {/* Mission Data Preview */}
          {missionData?.name && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">Mission Data Included</span>
              </div>
              <p className="text-sm text-blue-300">{missionData.name}</p>
              {missionData.location && (
                <p className="text-xs text-blue-400">{missionData.location}</p>
              )}
            </div>
          )}

          {/* Storage Info */}
          <div className="p-3 bg-gray-700/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Storage Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
              <div>
                <span>Sessions: {storageInfo.sessionCount}/{storageInfo.maxSessions}</span>
              </div>
              <div>
                <span>Size: {storageInfo.storageSize}</span>
              </div>
            </div>
            {!storageInfo.canSaveMore && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3" />
                <span>Storage limit reached. Oldest session will be replaced.</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 text-gray-300 hover:text-gray-100 font-medium rounded-lg hover:bg-gray-700/50 transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !sessionName.trim()}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};