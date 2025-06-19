/**
 * Mission Context Types
 * 
 * This module defines types for managing mission-specific metadata
 * and context throughout the application.
 */

import { ImageAnalysis, MissionMetadata } from './index';

/**
 * Mission Context for passing mission data and analyses together
 */
export interface MissionContext {
  analyses: ImageAnalysis[];
  metadata: MissionMetadata;
  threshold: number;
  settings: MissionSettings;
}

/**
 * Mission-specific settings and preferences
 */
export interface MissionSettings {
  qualityProfile: 'general' | 'mapping' | 'high-precision' | 'custom';
  processingOptions: {
    useGPUAcceleration: boolean;
    highResolutionProcessing: boolean;
    generateDebugVisualizations: boolean;
  };
  exportOptions: {
    includeMetadata: boolean;
    includePerformanceMetrics: boolean;
    csvDecimalPlaces: number;
  };
}

/**
 * Mission validation result
 */
export interface MissionValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

/**
 * Mission summary for reporting
 */
export interface MissionSummary {
  name: string;
  totalImages: number;
  passRate: number;
  averageQuality: number;
  processingTime: number;
  cameraModels: string[];
  dateRange: {
    start: string;
    end: string;
  };
}