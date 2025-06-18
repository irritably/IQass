/**
 * Session Management Utilities
 * 
 * Handles saving and loading analysis sessions for user convenience
 */

import { ImageAnalysis, AnalysisStats } from '../types';

export interface AnalysisSession {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  threshold: number;
  analyses: ImageAnalysis[];
  stats: AnalysisStats;
  tags: string[];
  notes?: string;
}

const STORAGE_KEY = 'drone-analyzer-sessions';
const MAX_SESSIONS = 10;

/**
 * Save current analysis session
 */
export const saveSession = (
  name: string,
  analyses: ImageAnalysis[],
  threshold: number,
  stats: AnalysisStats,
  notes?: string
): AnalysisSession => {
  const session: AnalysisSession = {
    id: generateSessionId(),
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    threshold,
    analyses: analyses.map(analysis => ({
      ...analysis,
      // Don't save the actual file object to avoid storage issues
      file: null as any,
      thumbnail: analysis.thumbnail || ''
    })),
    stats,
    tags: extractTagsFromAnalyses(analyses),
    notes
  };

  const sessions = getSessions();
  sessions.unshift(session);

  // Keep only the most recent sessions
  const trimmedSessions = sessions.slice(0, MAX_SESSIONS);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSessions));
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error);
    // Try to save without thumbnails if storage is full
    const sessionWithoutThumbnails = {
      ...session,
      analyses: session.analyses.map(a => ({ ...a, thumbnail: '' }))
    };
    try {
      const sessionsWithoutThumbnails = [sessionWithoutThumbnails, ...sessions.slice(1, MAX_SESSIONS)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsWithoutThumbnails));
    } catch (secondError) {
      console.error('Failed to save session even without thumbnails:', secondError);
    }
  }

  return session;
};

/**
 * Load all saved sessions
 */
export const getSessions = (): AnalysisSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const sessions = JSON.parse(stored);
    return sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt)
    }));
  } catch (error) {
    console.warn('Failed to load sessions from localStorage:', error);
    return [];
  }
};

/**
 * Load a specific session by ID
 */
export const loadSession = (sessionId: string): AnalysisSession | null => {
  const sessions = getSessions();
  return sessions.find(session => session.id === sessionId) || null;
};

/**
 * Delete a session
 */
export const deleteSession = (sessionId: string): void => {
  const sessions = getSessions();
  const filteredSessions = sessions.filter(session => session.id !== sessionId);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions));
  } catch (error) {
    console.warn('Failed to delete session:', error);
  }
};

/**
 * Update an existing session
 */
export const updateSession = (
  sessionId: string,
  updates: Partial<Omit<AnalysisSession, 'id' | 'createdAt'>>
): AnalysisSession | null => {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(session => session.id === sessionId);
  
  if (sessionIndex === -1) return null;

  const updatedSession = {
    ...sessions[sessionIndex],
    ...updates,
    updatedAt: new Date()
  };

  sessions[sessionIndex] = updatedSession;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return updatedSession;
  } catch (error) {
    console.warn('Failed to update session:', error);
    return null;
  }
};

/**
 * Export session as JSON
 */
export const exportSession = (session: AnalysisSession): void => {
  const exportData = {
    ...session,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `drone-analysis-session-${session.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Import session from JSON
 */
export const importSession = (file: File): Promise<AnalysisSession> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate session data
        if (!data.id || !data.name || !data.analyses) {
          throw new Error('Invalid session file format');
        }

        const session: AnalysisSession = {
          ...data,
          id: generateSessionId(), // Generate new ID to avoid conflicts
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Save the imported session
        const sessions = getSessions();
        sessions.unshift(session);
        const trimmedSessions = sessions.slice(0, MAX_SESSIONS);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSessions));
        resolve(session);
      } catch (error) {
        reject(new Error('Failed to parse session file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read session file'));
    reader.readAsText(file);
  });
};

/**
 * Clear all sessions
 */
export const clearAllSessions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear sessions:', error);
  }
};

/**
 * Get storage usage information
 */
export const getStorageInfo = (): { used: number; available: number; percentage: number } => {
  try {
    const sessions = getSessions();
    const sessionsData = JSON.stringify(sessions);
    const used = new Blob([sessionsData]).size;
    
    // Estimate available storage (localStorage typically has 5-10MB limit)
    const estimated = 5 * 1024 * 1024; // 5MB estimate
    const available = Math.max(0, estimated - used);
    const percentage = (used / estimated) * 100;

    return { used, available, percentage };
  } catch (error) {
    return { used: 0, available: 0, percentage: 0 };
  }
};

// Helper functions

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const extractTagsFromAnalyses = (analyses: ImageAnalysis[]): string[] => {
  const tags = new Set<string>();
  
  // Extract tags from file names and metadata
  analyses.forEach(analysis => {
    // Extract potential tags from filename patterns
    const filename = analysis.name.toLowerCase();
    if (filename.includes('flight')) tags.add('flight');
    if (filename.includes('area')) tags.add('area');
    if (filename.includes('morning')) tags.add('morning');
    if (filename.includes('afternoon')) tags.add('afternoon');
    if (filename.includes('survey')) tags.add('survey');
    
    // Extract camera model as tag
    if (analysis.metadata?.camera.model) {
      tags.add(analysis.metadata.camera.model.toLowerCase().replace(/\s+/g, '-'));
    }
  });

  return Array.from(tags);
};