import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, FileText, Clock, Database, Upload, AlertCircle } from 'lucide-react';
import { getSavedSessions, deleteSession, SessionData, importSessionFromFile, exportSessionAsFile } from '../../utils/sessionManager';

interface SessionLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (sessionData: SessionData) => void;
}

export const SessionLoadModal: React.FC<SessionLoadModalProps> = ({
  isOpen,
  onClose,
  onLoadSession
}) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = () => {
    try {
      const savedSessions = getSavedSessions();
      setSessions(savedSessions);
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
    }
  };

  const handleLoadSession = (sessionData: SessionData) => {
    setIsLoading(true);
    try {
      onLoadSession(sessionData);
      onClose();
    } catch (err) {
      setError('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        deleteSession(sessionId);
        loadSessions();
      } catch (err) {
        setError('Failed to delete session');
      }
    }
  };

  const handleExportSession = (sessionData: SessionData, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      exportSessionAsFile(sessionData);
    } catch (err) {
      setError('Failed to export session');
    }
  };

  const handleImportSession = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const sessionData = await importSessionFromFile(file);
      handleLoadSession(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import session');
    }
    
    // Reset file input
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] border border-gray-600">
        {/* Header */}
        <div className="p-6 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-100">Load Session</h2>
              <p className="text-sm text-gray-400">Continue from a saved analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Import Session */}
          <div className="mb-6">
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Import Session File
              <input
                type="file"
                accept=".json"
                onChange={handleImportSession}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">Import a previously exported session file</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No saved sessions found</p>
                <p className="text-sm text-gray-500 mt-1">Save your current analysis to create a session</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                    selectedSession === session.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100 mb-1">{session.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className="w-3 h-3" />
                          <span>{session.stats.totalImages} images</span>
                        </div>
                      </div>
                      
                      {/* Session Stats */}
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Threshold:</span>
                          <span className="text-blue-400 ml-1">{session.threshold}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Score:</span>
                          <span className="text-emerald-400 ml-1">{session.stats.averageScore.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Recommended:</span>
                          <span className="text-cyan-400 ml-1">{session.stats.recommendedCount}</span>
                        </div>
                      </div>

                      {/* Mission Data */}
                      {session.missionData?.name && (
                        <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/30">
                          <div className="flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-blue-400" />
                            <span className="text-xs text-blue-300">{session.missionData.name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => handleExportSession(session, e)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Export session"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-600">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full px-4 py-3 text-gray-300 hover:text-gray-100 font-medium rounded-lg hover:bg-gray-700/50 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};