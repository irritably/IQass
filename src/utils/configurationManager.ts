/**
 * Configuration Manager for Quality Thresholds and Scene Adaptation
 * 
 * This module provides centralized configuration management with
 * adaptive thresholds based on scene type and user preferences.
 */

import { QualityThresholds, SceneConfiguration } from '../types';

/**
 * Default quality thresholds configuration
 */
export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  blur: {
    excellent: 85,
    good: 70,
    acceptable: 55,
    poor: 40,
    unsuitable: 0
  },
  exposure: {
    overexposureLimit: 5,        // 5% default
    underexposureLimit: 5,       // 5% default
    dynamicRangeMin: 120         // 120 default
  },
  noise: {
    acceptableLevel: 20,         // 0-100 scale
    snrMinimum: 10,              // Signal-to-noise ratio
    artifactTolerance: 15        // 0-100 scale
  },
  features: {
    minimumCount: 100,           // Minimum keypoints
    densityMinimum: 0.5,         // Per 1000 pixels
    distributionMinimum: 50      // 50% uniformity
  },
  composite: {
    weights: {
      blur: 0.30,
      exposure: 0.25,
      noise: 0.20,
      technical: 0.10,
      descriptor: 0.15
    },
    photogrammetricWeights: {
      descriptor: 0.40,          // Higher weight for 3D reconstruction
      blur: 0.30,
      exposure: 0.20,
      noise: 0.10
    }
  }
};

/**
 * Scene-specific configuration presets
 */
export const SCENE_CONFIGURATIONS: Record<string, Partial<SceneConfiguration>> = {
  aerial_sky: {
    sceneType: 'aerial_sky',
    adaptiveThresholds: {
      blur: {
        normalizationFactor: 12,
        sceneExpectation: 'medium'
      },
      exposure: {
        overexposureThreshold: 245,
        underexposureThreshold: 10,
        skyTolerance: 30
      },
      features: {
        densityExpectation: 0.3,
        uniformityRequirement: 40
      }
    }
  },
  ground_detail: {
    sceneType: 'ground_detail',
    adaptiveThresholds: {
      blur: {
        normalizationFactor: 18,
        sceneExpectation: 'high'
      },
      exposure: {
        overexposureThreshold: 250,
        underexposureThreshold: 5,
        skyTolerance: 5
      },
      features: {
        densityExpectation: 1.0,
        uniformityRequirement: 60
      }
    }
  },
  mixed: {
    sceneType: 'mixed',
    adaptiveThresholds: {
      blur: {
        normalizationFactor: 15,
        sceneExpectation: 'medium'
      },
      exposure: {
        overexposureThreshold: 248,
        underexposureThreshold: 7,
        skyTolerance: 15
      },
      features: {
        densityExpectation: 0.7,
        uniformityRequirement: 50
      }
    }
  }
};

/**
 * Configuration Manager Class
 */
export class ConfigurationManager {
  private currentThresholds: QualityThresholds;
  private currentScene: SceneConfiguration | null = null;

  constructor(initialThresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS) {
    this.currentThresholds = { ...initialThresholds };
  }

  /**
   * Get current quality thresholds
   */
  getThresholds(): QualityThresholds {
    return { ...this.currentThresholds };
  }

  /**
   * Update quality thresholds
   */
  updateThresholds(newThresholds: Partial<QualityThresholds>): void {
    this.currentThresholds = {
      ...this.currentThresholds,
      ...newThresholds
    };
  }

  /**
   * Get adaptive thresholds based on scene type
   */
  getAdaptiveThresholds(sceneType: string): QualityThresholds {
    const baseThresholds = this.getThresholds();
    const sceneConfig = SCENE_CONFIGURATIONS[sceneType];

    if (!sceneConfig?.adaptiveThresholds) {
      return baseThresholds;
    }

    const adaptiveThresholds: QualityThresholds = {
      ...baseThresholds,
      exposure: {
        ...baseThresholds.exposure,
        overexposureLimit: this.calculateAdaptiveLimit(
          baseThresholds.exposure.overexposureLimit,
          sceneConfig.adaptiveThresholds.exposure?.overexposureThreshold || 250,
          'exposure'
        ),
        underexposureLimit: this.calculateAdaptiveLimit(
          baseThresholds.exposure.underexposureLimit,
          sceneConfig.adaptiveThresholds.exposure?.underexposureThreshold || 5,
          'exposure'
        )
      },
      features: {
        ...baseThresholds.features,
        densityMinimum: sceneConfig.adaptiveThresholds.features?.densityExpectation || baseThresholds.features.densityMinimum,
        distributionMinimum: sceneConfig.adaptiveThresholds.features?.uniformityRequirement || baseThresholds.features.distributionMinimum
      }
    };

    return adaptiveThresholds;
  }

  /**
   * Set scene configuration
   */
  setSceneConfiguration(sceneType: string, metadata?: any): void {
    const baseConfig = SCENE_CONFIGURATIONS[sceneType];
    
    if (baseConfig) {
      this.currentScene = {
        ...baseConfig,
        metadata: {
          altitude: metadata?.location?.altitude || null,
          cameraType: this.detectCameraType(metadata),
          detectionConfidence: this.calculateDetectionConfidence(sceneType, metadata)
        }
      } as SceneConfiguration;
    }
  }

  /**
   * Get current scene configuration
   */
  getSceneConfiguration(): SceneConfiguration | null {
    return this.currentScene;
  }

  /**
   * Get blur normalization factor for scene
   */
  getBlurNormalizationFactor(sceneType: string): number {
    const sceneConfig = SCENE_CONFIGURATIONS[sceneType];
    return sceneConfig?.adaptiveThresholds?.blur?.normalizationFactor || 15;
  }

  /**
   * Get composite weights based on use case
   */
  getCompositeWeights(useCase: 'general' | 'photogrammetric' = 'general'): Record<string, number> {
    const thresholds = this.getThresholds();
    
    return useCase === 'photogrammetric' 
      ? thresholds.composite.photogrammetricWeights
      : thresholds.composite.weights;
  }

  /**
   * Create configuration preset
   */
  createPreset(name: string, config: Partial<QualityThresholds>): void {
    // Store preset in localStorage for persistence
    const presets = this.getStoredPresets();
    presets[name] = config;
    localStorage.setItem('qualityThresholdPresets', JSON.stringify(presets));
  }

  /**
   * Load configuration preset
   */
  loadPreset(name: string): boolean {
    const presets = this.getStoredPresets();
    const preset = presets[name];
    
    if (preset) {
      this.updateThresholds(preset);
      return true;
    }
    
    return false;
  }

  /**
   * Get available presets
   */
  getAvailablePresets(): Record<string, Partial<QualityThresholds>> {
    return {
      ...this.getDefaultPresets(),
      ...this.getStoredPresets()
    };
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.currentThresholds = { ...DEFAULT_QUALITY_THRESHOLDS };
    this.currentScene = null;
  }

  /**
   * Export current configuration
   */
  exportConfiguration(): string {
    return JSON.stringify({
      thresholds: this.currentThresholds,
      scene: this.currentScene,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfiguration(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.thresholds) {
        this.updateThresholds(config.thresholds);
      }
      
      if (config.scene) {
        this.currentScene = config.scene;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  // Private helper methods

  private calculateAdaptiveLimit(baseLimit: number, sceneThreshold: number, type: string): number {
    // Simple adaptive calculation - can be enhanced with more sophisticated logic
    const adaptationFactor = 0.3; // 30% adaptation
    return baseLimit + (sceneThreshold - 250) * adaptationFactor;
  }

  private detectCameraType(metadata?: any): 'drone' | 'handheld' | 'unknown' {
    if (!metadata?.camera?.make) return 'unknown';
    
    const make = metadata.camera.make.toLowerCase();
    const model = metadata.camera.model?.toLowerCase() || '';
    
    // Drone manufacturers
    if (make.includes('dji') || make.includes('autel') || make.includes('parrot')) {
      return 'drone';
    }
    
    // Check for drone-specific model names
    if (model.includes('mavic') || model.includes('phantom') || model.includes('inspire')) {
      return 'drone';
    }
    
    // Check altitude - if > 50m, likely drone
    if (metadata.location?.altitude && metadata.location.altitude > 50) {
      return 'drone';
    }
    
    return 'handheld';
  }

  private calculateDetectionConfidence(sceneType: string, metadata?: any): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on available metadata
    if (metadata?.location?.altitude) {
      confidence += 20;
      
      // High altitude strongly suggests aerial
      if (metadata.location.altitude > 100 && sceneType === 'aerial_sky') {
        confidence += 20;
      }
    }
    
    if (metadata?.camera?.make) {
      confidence += 10;
      
      // Drone camera suggests aerial
      if (this.detectCameraType(metadata) === 'drone' && sceneType === 'aerial_sky') {
        confidence += 15;
      }
    }
    
    return Math.min(100, confidence);
  }

  private getDefaultPresets(): Record<string, Partial<QualityThresholds>> {
    return {
      'High Precision': {
        blur: { excellent: 90, good: 80, acceptable: 70, poor: 50, unsuitable: 0 },
        composite: {
          weights: { blur: 0.40, exposure: 0.25, noise: 0.20, technical: 0.05, descriptor: 0.10 }
        }
      },
      'General Mapping': {
        blur: { excellent: 80, good: 65, acceptable: 50, poor: 35, unsuitable: 0 },
        composite: {
          weights: { blur: 0.25, exposure: 0.30, noise: 0.20, technical: 0.10, descriptor: 0.15 }
        }
      },
      'Quick Survey': {
        blur: { excellent: 70, good: 55, acceptable: 40, poor: 25, unsuitable: 0 },
        composite: {
          weights: { blur: 0.20, exposure: 0.25, noise: 0.15, technical: 0.15, descriptor: 0.25 }
        }
      }
    };
  }

  private getStoredPresets(): Record<string, Partial<QualityThresholds>> {
    try {
      const stored = localStorage.getItem('qualityThresholdPresets');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load stored presets:', error);
      return {};
    }
  }
}

/**
 * Global configuration manager instance
 */
export const configManager = new ConfigurationManager();

/**
 * Utility functions for configuration management
 */
export const getQualityClassification = (score: number, thresholds?: QualityThresholds): string => {
  const t = thresholds || DEFAULT_QUALITY_THRESHOLDS;
  
  if (score >= t.blur.excellent) return 'excellent';
  if (score >= t.blur.good) return 'good';
  if (score >= t.blur.acceptable) return 'acceptable';
  if (score >= t.blur.poor) return 'poor';
  return 'unsuitable';
};

export const getRecommendationThreshold = (sceneType: string = 'mixed'): number => {
  const sceneConfig = SCENE_CONFIGURATIONS[sceneType];
  
  // Return adaptive threshold based on scene
  switch (sceneType) {
    case 'aerial_sky': return 60;    // Lower threshold for aerial
    case 'ground_detail': return 75; // Higher threshold for ground
    case 'mixed': 
    default: return 70;              // Standard threshold
  }
};