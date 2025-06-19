/**
 * Session Management Utilities
 * 
 * This module provides functionality to save and load analysis sessions,
 * allowing users to preserve their work and continue later.
 */

import { ImageAnalysis, MissionMetadata } from '../types';

export interface SessionData {
  id: string;
  name: string;
  timestamp: string;
  threshold: number;
  analyses: SessionAnalysis[];
  missionData?: MissionMetadata;
  stats: {
    totalImages: number;
    averageScore: number;
    recommendedCount: number;
  };
}

// Simplified analysis data for session storage (without File objects)
export interface SessionAnalysis {
  id: string;
  name: string;
  size: number;
  blurScore: number;
  quality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
  thumbnail: string;
  processed: boolean;
  error?: string;
  compositeScore?: {
    blur: number;
    exposure: number;
    noise: number;
    technical: number;
    descriptor: number;
    overall: number;
    recommendation: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsuitable';
  };
  exposureAnalysis?: {
    exposureScore: number;
    overexposurePercentage: number;
    underexposurePercentage: number;
    dynamicRange: number;
    averageBrightness: number;
    contrastRatio: number;
    histogramBalance: string;
  };
  noiseAnalysis?: {
    noiseScore: number;
    rawStandardDeviation: number;
    noiseLevel: number;
    snrRatio: number;
    compressionArtifacts: number;
    chromaticAberration: number;
    vignetting: number;
    overallArtifactScore: number;
  };
  descriptorAnalysis?: {
    keypointCount: number;
    keypointDensity: number;
    photogrammetricScore: number;
    reconstructionSuitability: string;
  };
  processingDuration?: number;
}

const SESSION_STORAGE_KEY = 'drone_analyzer_sessions';
const MAX_SESSIONS = 10; // Limit stored sessions to prevent storage bloat

/**
 * Converts ImageAnalysis to SessionAnalysis (removes File objects)
 */
export const convertToSessionAnalysis = (analysis: ImageAnalysis): SessionAnalysis => {
  return {
    id: analysis.id,
    name: analysis.name,
    size: analysis.size,
    blurScore: analysis.blurScore,
    quality: analysis.quality,
    thumbnail: analysis.thumbnail,
    processed: analysis.processed,
    error: analysis.error,
    compositeScore: analysis.compositeScore,
    exposureAnalysis: analysis.exposureAnalysis ? {
      exposureScore: analysis.exposureAnalysis.exposureScore,
      overexposurePercentage: analysis.exposureAnalysis.overexposurePercentage,
      underexposurePercentage: analysis.exposureAnalysis.underexposurePercentage,
      dynamicRange: analysis.exposureAnalysis.dynamicRange,
      averageBrightness: analysis.exposureAnalysis.averageBrightness,
      contrastRatio: analysis.exposureAnalysis.contrastRatio,
      histogramBalance: analysis.exposureAnalysis.histogramBalance,
    } : undefined,
    noiseAnalysis: analysis.noiseAnalysis,
    descriptorAnalysis: analysis.descriptorAnalysis ? {
      keypointCount: analysis.descriptorAnalysis.keypointCount,
      keypointDensity: analysis.descriptorAnalysis.keypointDensity,
      photogrammetricScore: analysis.descriptorAnalysis.photogrammetricScore,
      reconstructionSuitability: analysis.descriptorAnalysis.reconstructionSuitability,
    } : undefined,
    processingDuration: analysis.processingDuration,
  };
};

/**
 * Saves current session to localStorage
 */
export const saveSession = (
  analyses: ImageAnalysis[],
  threshold: number,
  missionData?: MissionMetadata,
  sessionName?: string
): string => {
  try {
    const sessionId = generateSessionId();
    const timestamp = new Date().toISOString();
    
    // Convert analyses to session format
    const sessionAnalyses = analyses.map(convertToSessionAnalysis);
    
    // Calculate stats
    const stats = {
      totalImages: analyses.length,
      averageScore: analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + (a.compositeScore?.overall || 0), 0) / analyses.length 
        : 0,
      recommendedCount: analyses.filter(a => (a.compositeScore?.overall || 0) >= threshold).length
    };
    
    const sessionData: SessionData = {
      id: sessionId,
      name: sessionName || `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      timestamp,
      threshold,
      analyses: sessionAnalyses,
      missionData,
      stats
    };
    
    // Get existing sessions
    const existingSessions = getSavedSessions();
    
    // Add new session and limit total count
    const updatedSessions = [sessionData, ...existingSessions].slice(0, MAX_SESSIONS);
    
    // Save to localStorage
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSessions));
    
    return sessionId;
  } catch (error) {
    console.error('Failed to save session:', error);
    throw new Error('Failed to save session. Storage may be full.');
  }
};

/**
 * Loads all saved sessions from localStorage
 */
export const getSavedSessions = (): SessionData[] => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
};

/**
 * Loads a specific session by ID
 */
export const loadSession = (sessionId: string): SessionData | null => {
  try {
    const sessions = getSavedSessions();
    return sessions.find(session => session.id === sessionId) || null;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
};

/**
 * Deletes a session by ID
 */
export const deleteSession = (sessionId: string): boolean => {
  try {
    const sessions = getSavedSessions();
    const filteredSessions = sessions.filter(session => session.id !== sessionId);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filteredSessions));
    return true;
  } catch (error) {
    console.error('Failed to delete session:', error);
    return false;
  }
};

/**
 * Clears all saved sessions
 */
export const clearAllSessions = (): boolean => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear sessions:', error);
    return false;
  }
};

/**
 * Gets storage usage information
 */
export const getStorageInfo = () => {
  try {
    const sessions = getSavedSessions();
    const storageData = localStorage.getItem(SESSION_STORAGE_KEY) || '';
    const sizeInBytes = new Blob([storageData]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    return {
      sessionCount: sessions.length,
      storageSize: `${sizeInKB} KB`,
      maxSessions: MAX_SESSIONS,
      canSaveMore: sessions.length < MAX_SESSIONS
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      sessionCount: 0,
      storageSize: '0 KB',
      maxSessions: MAX_SESSIONS,
      canSaveMore: true
    };
  }
};

/**
 * Generates a unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validates session data structure
 */
export const validateSessionData = (data: any): data is SessionData => {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.timestamp === 'string' &&
    typeof data.threshold === 'number' &&
    Array.isArray(data.analyses) &&
    data.stats &&
    typeof data.stats.totalImages === 'number'
  );
};

/**
 * Exports session data as JSON file
 */
export const exportSessionAsFile = (sessionData: SessionData): void => {
  try {
    const dataStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `drone_analysis_session_${sessionData.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export session:', error);
    throw new Error('Failed to export session file');
  }
};

/**
 * Imports session data from JSON file
 */
export const importSessionFromFile = (file: File): Promise<SessionData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const sessionData = JSON.parse(content);
        
        if (validateSessionData(sessionData)) {
          resolve(sessionData);
        } else {
          reject(new Error('Invalid session file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse session file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read session file'));
    };
    
    reader.readAsText(file);
  });
};