import React, { useState, useCallback } from 'react';
import { Save, FolderOpen, Download, Upload, Trash2, Calendar, FileText, Tag, X } from 'lucide-react';
import { AnalysisSession, saveSession, getSessions, loadSession, deleteSession, exportSession, importSession, clearAllSessions, getStorageInfo } from '../utils/sessionManager';
import { ImageAnalysis, AnalysisStats } from '../types';

interface SessionManagerProps {
  analyses: ImageAnalysis[];
  threshold: number;
  stats: AnalysisStats;
  onLoadSession?: (session: AnalysisSession) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  analyses,
  threshold,
  stats,
  onLoadSession,
  isVisible,
  onClose
}) => {
  const [sessions, setSessions] = useState<AnalysisSession[]>(getSessions());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedTab, setSelectedTab] = useState<'save' | 'load' | 'manage'>('save');

  const refreshSessions = useCallback(() => {
    setSessions(getSessions());
  }, []);

  const handleSaveSession = useCallback(() => {
    if (!sessionName.trim()) return;

    const session = saveSession(sessionName.trim(), analyses, threshold, stats, sessionNotes.trim() || undefined);
    setSessionName('');
    setSessionNotes('');
    setShowSaveDialog(false);
    refreshSessions();
  }, [sessionName, sessionNotes, analyses, threshold, stats, refreshSessions]);

  const handleLoadSession = useCallback((sessionId: string) => {
    const session = loadSession(sessionId);
    if (session && onLoadSession) {
      onLoadSession(session);
      onClose();
    }
  }, [onLoadSession, onClose]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId);
      refreshSessions();
    }
  }, [refreshSessions]);

  const handleExportSession = useCallback((session: AnalysisSession) => {
    exportSession(session);
  }, []);

  const handleImportSession = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importSession(file)
      .then(() => {
        refreshSessions();
        alert('Session imported successfully!');
      })
      .catch((error) => {
        alert(`Failed to import session: ${error.message}`);
      });

    // Reset input
    event.target.value = '';
  }, [refreshSessions]);

  const handleClearAllSessions = useCallback(() => {
    if (confirm('Are you sure you want to delete all saved sessions? This cannot be undone.')) {
      clearAllSessions();
      refreshSessions();
    }
  }, [refreshSessions]);

  const storageInfo = getStorageInfo();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Save className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Session Manager</h2>
              <p className="text-sm text-gray-600">Save, load, and manage analysis sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'save', label: 'Save Session', icon: Save },
              { id: 'load', label: 'Load Session', icon: FolderOpen },
              { id: 'manage', label: 'Manage Sessions', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'save' && (
            <SaveSessionTab
              analyses={analyses}
              threshold={threshold}
              stats={stats}
              sessionName={sessionName}
              setSessionName={setSessionName}
              sessionNotes={sessionNotes}
              setSessionNotes={setSessionNotes}
              onSave={handleSaveSession}
            />
          )}

          {selectedTab === 'load' && (
            <LoadSessionTab
              sessions={sessions}
              onLoad={handleLoadSession}
            />
          )}

          {selectedTab === 'manage' && (
            <ManageSessionsTab
              sessions={sessions}
              onDelete={handleDeleteSession}
              onExport={handleExportSession}
              onImport={handleImportSession}
              onClearAll={handleClearAllSessions}
              storageInfo={storageInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Save Session Tab
interface SaveSessionTabProps {
  analyses: ImageAnalysis[];
  threshold: number;
  stats: AnalysisStats;
  sessionName: string;
  setSessionName: (name: string) => void;
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;
  onSave: () => void;
}

const SaveSessionTab: React.FC<SaveSessionTabProps> = ({
  analyses,
  threshold,
  stats,
  sessionName,
  setSessionName,
  sessionNotes,
  setSessionNotes,
  onSave
}) => {
  const canSave = analyses.length > 0 && sessionName.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Current Session Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-lg font-bold text-blue-600">{analyses.length}</div>
            <div className="text-blue-700">Images</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{stats.recommendedForReconstruction}</div>
            <div className="text-green-700">Recommended</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">{threshold}</div>
            <div className="text-purple-700">Threshold</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{stats.averageCompositeScore?.toFixed(1) || '0'}</div>
            <div className="text-orange-700">Avg Score</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Name *
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g., Flight 1 - North Field Survey"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Add any notes about this analysis session..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <button
          onClick={onSave}
          disabled={!canSave}
          className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Session
        </button>

        {!canSave && (
          <p className="text-sm text-gray-500 text-center">
            {analyses.length === 0 ? 'No images to save' : 'Please enter a session name'}
          </p>
        )}
      </div>
    </div>
  );
};

// Load Session Tab
interface LoadSessionTabProps {
  sessions: AnalysisSession[];
  onLoad: (sessionId: string) => void;
}

const LoadSessionTab: React.FC<LoadSessionTabProps> = ({ sessions, onLoad }) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No saved sessions found</p>
        <p className="text-sm text-gray-500 mt-1">Save your first session to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{session.name}</h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{session.createdAt.toLocaleDateString()}</span>
                </div>
                <div>{session.analyses.length} images</div>
                <div>Threshold: {session.threshold}</div>
                <div>{session.stats.recommendedForReconstruction} recommended</div>
              </div>
              {session.tags.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <Tag className="w-3 h-3 text-gray-400" />
                  <div className="flex flex-wrap gap-1">
                    {session.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {session.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{session.tags.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
              {session.notes && (
                <p className="text-sm text-gray-600 mt-2 italic">{session.notes}</p>
              )}
            </div>
            <button
              onClick={() => onLoad(session.id)}
              className="ml-4 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Load Session
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Manage Sessions Tab
interface ManageSessionsTabProps {
  sessions: AnalysisSession[];
  onDelete: (sessionId: string) => void;
  onExport: (session: AnalysisSession) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
  storageInfo: { used: number; available: number; percentage: number };
}

const ManageSessionsTab: React.FC<ManageSessionsTabProps> = ({
  sessions,
  onDelete,
  onExport,
  onImport,
  onClearAll,
  storageInfo
}) => {
  return (
    <div className="space-y-6">
      {/* Storage Info */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Storage Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {(storageInfo.used / 1024).toFixed(1)} KB</span>
            <span>{storageInfo.percentage.toFixed(1)}% of estimated limit</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Import/Export Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
            <div className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
              <Upload className="w-5 h-5 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Import Session</span>
            </div>
          </label>
        </div>
        
        <button
          onClick={onClearAll}
          disabled={sessions.length === 0}
          className="flex items-center justify-center px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Clear All</span>
        </button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No sessions to manage</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Saved Sessions ({sessions.length})</h3>
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{session.name}</h4>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span>{session.createdAt.toLocaleDateString()}</span>
                  <span>{session.analyses.length} images</span>
                  <span>{session.stats.recommendedForReconstruction} recommended</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onExport(session)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export session"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(session.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};