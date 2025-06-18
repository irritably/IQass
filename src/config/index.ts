/**
 * Application Configuration
 * 
 * Centralized configuration file for all application-wide constants
 * and configurable values to improve maintainability and avoid magic numbers.
 */

// WebGL Processing Configuration
export const WEBGL_CONFIG = {
  MAX_POOL_SIZE: 3,
  CONTEXT_TIMEOUT: 30000, // 30 seconds
  MAX_BENCHMARKS: 100,
} as const;

// Image Processing Configuration
export const IMAGE_CONFIG = {
  MAX_SIZE_FOR_ANALYSIS: 800, // Maximum size for analysis (pixels)
  THUMBNAIL_SIZE: 150, // Thumbnail size (pixels)
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB maximum file size
  SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'] as const,
} as const;

// Quality Assessment Configuration
export const QUALITY_CONFIG = {
  DEFAULT_THRESHOLD: 70,
  MIN_THRESHOLD: 0,
  MAX_THRESHOLD: 100,
  VIRTUALIZATION_THRESHOLD: 50, // Switch to virtualized grid for batches > 50 images
} as const;

// Lazy Loading Configuration
export const LAZY_LOADING_CONFIG = {
  ROOT_MARGIN: '100px',
  THRESHOLD: 0.1,
  UNLOAD_ON_EXIT: false,
} as const;

// Performance Benchmarking Configuration
export const BENCHMARK_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  SAMPLE_SIZE: 10,
  AUTO_OPTIMIZE: true,
} as const;

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms for threshold changes
  ANIMATION_DURATION: 200, // ms for transitions
  PROGRESS_UPDATE_INTERVAL: 500, // ms for progress updates
} as const;

// Export all configurations
export const CONFIG = {
  WEBGL: WEBGL_CONFIG,
  IMAGE: IMAGE_CONFIG,
  QUALITY: QUALITY_CONFIG,
  LAZY_LOADING: LAZY_LOADING_CONFIG,
  BENCHMARK: BENCHMARK_CONFIG,
  UI: UI_CONFIG,
} as const;

export default CONFIG;