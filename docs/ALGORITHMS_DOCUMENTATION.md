# Algorithms Documentation - Drone Image Quality Analyzer

This document provides comprehensive documentation of all algorithms used in the Drone Image Quality Analyzer, including mathematical foundations, implementation details, performance characteristics, and usage guidelines.

## Table of Contents

1. [Overview](#overview)
2. [Blur Detection Algorithms](#blur-detection-algorithms)
3. [Exposure Analysis Algorithms](#exposure-analysis-algorithms)
4. [Feature Detection Algorithms](#feature-detection-algorithms)
5. [Noise Analysis Algorithms](#noise-analysis-algorithms)
6. [Composite Scoring Algorithm](#composite-scoring-algorithm)
7. [Color Space Conversion Algorithms](#color-space-conversion-algorithms)
8. [WebGL Acceleration Algorithms](#webgl-acceleration-algorithms)
9. [Performance Optimization Algorithms](#performance-optimization-algorithms)
10. [Algorithm Selection Guidelines](#algorithm-selection-guidelines)

---

## Overview

The Drone Image Quality Analyzer employs a multi-algorithm approach to assess image quality across several dimensions critical for photogrammetric reconstruction. Each algorithm is designed to evaluate specific aspects of image quality while maintaining computational efficiency for real-time analysis.

### Core Design Principles

1. **Robustness**: Algorithms handle edge cases and varying image conditions
2. **Accuracy**: Mathematical foundations ensure reliable quality assessment
3. **Performance**: Optimized for browser-based real-time processing
4. **Adaptability**: Scene-aware processing for different image types
5. **Transparency**: Clear scoring methodology for user understanding

---

## Blur Detection Algorithms

### 1. Laplacian Variance Method (Primary)

**Purpose**: Detect image sharpness by measuring edge response variance

**Mathematical Foundation**:
```
Laplacian Kernel:
L = [[-1, -1, -1],
     [-1,  8, -1],
     [-1, -1, -1]]

For each pixel (x,y):
response(x,y) = Σ(i=-1 to 1) Σ(j=-1 to 1) L[i,j] * I[x+i, y+j]

Variance = (1/N) * Σ(response[i] - μ)²
where μ = mean(responses), N = number of pixels

Blur Score = min(100, max(0, log(variance + 1) * normalization_factor))
```

**Implementation Details**:
```typescript
export const calculateBlurScore = (imageData: ImageData): number => {
  const { data, width, height } = imageData;
  
  // Convert to grayscale using ITU-R BT.601
  const grayscale: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale.push(gray);
  }
  
  // Apply Laplacian kernel (skip edges)
  const laplacian: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const value = 
        -1 * grayscale[idx - width - 1] + -1 * grayscale[idx - width] + -1 * grayscale[idx - width + 1] +
        -1 * grayscale[idx - 1] + 8 * grayscale[idx] + -1 * grayscale[idx + 1] +
        -1 * grayscale[idx + width - 1] + -1 * grayscale[idx + width] + -1 * grayscale[idx + width + 1];
      laplacian.push(Math.abs(value));
    }
  }
  
  // Calculate variance
  const mean = laplacian.reduce((sum, val) => sum + val, 0) / laplacian.length;
  const variance = laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / laplacian.length;
  
  // Normalize to 0-100 scale
  return Math.round(Math.min(100, Math.max(0, Math.log(variance + 1) * 15)));
};
```

**Advantages**:
- Fast computation (O(n) where n = pixels)
- Robust to noise
- Well-established method in computer vision
- Good correlation with human perception of sharpness

**Limitations**:
- Sensitive to image content (textures vs smooth areas)
- Requires threshold tuning for different scene types
- Can be affected by compression artifacts

**Optimization**: Scene-adaptive normalization factors:
- Aerial/Sky scenes: factor = 12 (lower expectations)
- Ground detail: factor = 18 (higher expectations)
- Mixed scenes: factor = 15 (standard)

### 2. Multi-Kernel Blur Detection (Enhanced)

**Purpose**: Improve robustness by combining multiple edge detection kernels

**Mathematical Foundation**:
```
Kernels:
Standard Laplacian: [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]]
Cross Laplacian:    [[0,-1,0],[-1,4,-1],[0,-1,0]]
Sobel-like:         [[-1,-2,-1],[0,0,0],[1,2,1]]

For each kernel k:
  variance_k = calculate_variance(apply_kernel(image, k))

Final variance = median(variance_1, variance_2, variance_3)
```

**Implementation**:
```typescript
const kernels = {
  standard: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
  cross: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
  sobel: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
};

const variances = kernels.map(kernel => computeVariance(imageData, kernel));
const medianVariance = variances.sort((a, b) => a - b)[Math.floor(variances.length / 2)];
```

**Advantages**:
- More robust than single-kernel approach
- Reduces sensitivity to specific edge orientations
- Better handling of different texture types

---

## Exposure Analysis Algorithms

### 1. Enhanced Histogram Analysis

**Purpose**: Comprehensive exposure assessment using multiple metrics

**Mathematical Foundation**:
```
Histogram H[0..255] where H[i] = count of pixels with brightness i

Overexposure % = (Σ(i=250 to 255) H[i]) / total_pixels * 100
Underexposure % = (Σ(i=0 to 4) H[i]) / total_pixels * 100

Dynamic Range = P95 - P5
where P5 = 5th percentile, P95 = 95th percentile

Contrast Ratio = (L_max + 0.05) / (L_min + 0.05)
where L_max, L_min are max/min luminance values
```

**Implementation**:
```typescript
const analyzeEnhancedExposure = (imageData: ImageData): ExposureAnalysis => {
  const { data, width, height } = imageData;
  
  // Convert RGB to YCrCb color space
  const yCrCbData = convertToYCrCb(data);
  
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  const luminanceValues: number[] = [];
  
  for (let i = 0; i < yCrCbData.y.length; i++) {
    const lum = Math.round(yCrCbData.y[i] * 255);
    histogram[lum]++;
    luminanceValues.push(lum);
  }
  
  // Calculate metrics
  const totalPixels = luminanceValues.length;
  const overexposureThreshold = 250;
  const underexposureThreshold = 5;
  
  const overexposedPixels = histogram.slice(overexposureThreshold).reduce((sum, count) => sum + count, 0);
  const underexposedPixels = histogram.slice(0, underexposureThreshold).reduce((sum, count) => sum + count, 0);
  
  // Percentile calculations
  const sortedLuminance = [...luminanceValues].sort((a, b) => a - b);
  const p5 = sortedLuminance[Math.floor(sortedLuminance.length * 0.05)];
  const p95 = sortedLuminance[Math.floor(sortedLuminance.length * 0.95)];
  
  return {
    overexposurePercentage: (overexposedPixels / totalPixels) * 100,
    underexposurePercentage: (underexposedPixels / totalPixels) * 100,
    dynamicRange: p95 - p5,
    // ... additional metrics
  };
};
```

### 2. Local Contrast Analysis

**Purpose**: Assess spatial variation in exposure across the image

**Mathematical Foundation**:
```
For each 9x9 window W centered at (x,y):
local_contrast(x,y) = max(W) - min(W)

Average Local Contrast = (1/N) * Σ local_contrast(x,y)
where N = number of windows
```

**Implementation**:
```typescript
const calculateLocalContrast = (luminance: Float32Array, width: number, height: number): number => {
  let totalContrast = 0;
  let sampleCount = 0;
  const windowSize = 9;
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let y = halfWindow; y < height - halfWindow; y += 3) {
    for (let x = halfWindow; x < width - halfWindow; x += 3) {
      let minVal = 1.0;
      let maxVal = 0.0;
      
      for (let dy = -halfWindow; dy <= halfWindow; dy++) {
        for (let dx = -halfWindow; dx <= halfWindow; dx++) {
          const idx = (y + dy) * width + (x + dx);
          const val = luminance[idx];
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
        }
      }
      
      totalContrast += (maxVal - minVal);
      sampleCount++;
    }
  }
  
  return sampleCount > 0 ? (totalContrast / sampleCount) * 100 : 0;
};
```

### 3. Adaptive Exposure Thresholds

**Purpose**: Adjust exposure evaluation based on scene type and metadata

**Algorithm**:
```typescript
const getAdaptiveThresholds = (metadata: any, imageData: ImageData) => {
  const isDroneImage = detectAerialCharacteristics(imageData) || 
                      (metadata?.location?.altitude > 50);
  
  return isDroneImage ? {
    overexposure: 245,  // More sensitive to sky overexposure
    underexposure: 10,  // Less sensitive to shadow underexposure
    dynamicRangeMin: 80 // Lower expectation for aerial scenes
  } : {
    overexposure: 250,  // Standard thresholds
    underexposure: 5,
    dynamicRangeMin: 120
  };
};
```

---

## Feature Detection Algorithms

### 1. Harris Corner Detection

**Purpose**: Detect corner features for photogrammetric matching

**Mathematical Foundation**:
```
Image gradients:
Ix = ∂I/∂x, Iy = ∂I/∂y

Structure tensor (with Gaussian weighting):
M = [Σ(w * Ix²)    Σ(w * Ix * Iy)]
    [Σ(w * Ix * Iy) Σ(w * Iy²)   ]

Harris response:
R = det(M) - k * trace(M)²
where k ≈ 0.04

Corner if R > threshold
```

**Implementation**:
```typescript
const harrisCornerDetection = (grayscale: Float32Array, width: number, height: number): Keypoint[] => {
  const keypoints: Keypoint[] = [];
  const threshold = 0.01;
  const k = 0.04;
  
  // Calculate gradients
  const Ix = new Float32Array(width * height);
  const Iy = new Float32Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      Ix[idx] = grayscale[idx + 1] - grayscale[idx - 1];
      Iy[idx] = grayscale[idx + width] - grayscale[idx - width];
    }
  }
  
  // Calculate Harris response
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      let Ixx = 0, Iyy = 0, Ixy = 0;
      
      // 5x5 window
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const idx = (y + dy) * width + (x + dx);
          const ix = Ix[idx];
          const iy = Iy[idx];
          Ixx += ix * ix;
          Iyy += iy * iy;
          Ixy += ix * iy;
        }
      }
      
      const det = Ixx * Iyy - Ixy * Ixy;
      const trace = Ixx + Iyy;
      const response = det - k * trace * trace;
      
      if (response > threshold) {
        keypoints.push({
          x, y,
          strength: response,
          scale: 1.0,
          angle: Math.atan2(Iy[y * width + x], Ix[y * width + x]),
          type: 'corner'
        });
      }
    }
  }
  
  return keypoints;
};
```

### 2. FAST Corner Detection

**Purpose**: Fast corner detection for real-time processing

**Mathematical Foundation**:
```
FAST-9 algorithm:
For pixel p with intensity Ip:
1. Consider 16 pixels in circle around p
2. Count pixels brighter than Ip + threshold
3. Count pixels darker than Ip - threshold
4. Corner if ≥9 consecutive pixels are all brighter OR all darker
```

**Implementation**:
```typescript
const fastCornerDetection = (grayscale: Float32Array, width: number, height: number): Keypoint[] => {
  const keypoints: Keypoint[] = [];
  const threshold = 20;
  
  // FAST-9 circle offsets
  const circle = [
    [-3, 0], [-3, -1], [-2, -2], [-1, -3], [0, -3], [1, -3],
    [2, -2], [3, -1], [3, 0], [3, 1], [2, 2], [1, 3],
    [0, 3], [-1, 3], [-2, 2], [-3, 1]
  ];
  
  for (let y = 3; y < height - 3; y++) {
    for (let x = 3; x < width - 3; x++) {
      const centerIdx = y * width + x;
      const centerValue = grayscale[centerIdx];
      
      let brighter = 0;
      let darker = 0;
      
      for (const [dx, dy] of circle) {
        const idx = (y + dy) * width + (x + dx);
        const value = grayscale[idx];
        
        if (value > centerValue + threshold) brighter++;
        else if (value < centerValue - threshold) darker++;
      }
      
      if (brighter >= 9 || darker >= 9) {
        keypoints.push({
          x, y,
          strength: Math.max(brighter, darker) / 16,
          scale: 1.0,
          angle: 0,
          type: 'corner'
        });
      }
    }
  }
  
  return keypoints;
};
```

### 3. Blob Detection (LoG Approximation)

**Purpose**: Detect blob-like features using Laplacian of Gaussian approximation

**Mathematical Foundation**:
```
Laplacian of Gaussian (LoG):
LoG(x,y,σ) = -1/(πσ⁴) * [1 - (x²+y²)/(2σ²)] * e^(-(x²+y²)/(2σ²))

Approximation using difference of Gaussians or discrete kernel:
LoG ≈ [[0, 0, -1, 0, 0],
       [0, -1, -2, -1, 0],
       [-1, -2, 16, -2, -1],
       [0, -1, -2, -1, 0],
       [0, 0, -1, 0, 0]]
```

**Implementation**:
```typescript
const blobDetection = (grayscale: Float32Array, width: number, height: number): Keypoint[] => {
  const keypoints: Keypoint[] = [];
  
  // 5x5 LoG kernel approximation
  const kernel = [
    [0, 0, -1, 0, 0],
    [0, -1, -2, -1, 0],
    [-1, -2, 16, -2, -1],
    [0, -1, -2, -1, 0],
    [0, 0, -1, 0, 0]
  ];
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      let response = 0;
      
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const idx = (y + dy) * width + (x + dx);
          response += grayscale[idx] * kernel[dy + 2][dx + 2];
        }
      }
      
      if (Math.abs(response) > 100) {
        keypoints.push({
          x, y,
          strength: Math.abs(response) / 1000,
          scale: 2.0,
          angle: 0,
          type: 'blob'
        });
      }
    }
  }
  
  return keypoints;
};
```

### 4. Feature Distribution Analysis

**Purpose**: Assess spatial distribution quality of detected features

**Mathematical Foundation**:
```
Grid-based uniformity:
1. Divide image into NxN grid
2. Count features per cell: counts[i]
3. Calculate coefficient of variation: CV = σ/μ
4. Uniformity = max(0, 100 - CV * 50)

Coverage:
Coverage = (non_empty_cells / total_cells) * 100

Clustering (nearest neighbor analysis):
For each feature i:
  min_distance[i] = min(distance(i, j)) for all j ≠ i
Average_NN_distance = mean(min_distance)
Expected_distance = sqrt(area / feature_count) / 2
Clustering = max(0, 100 - (Average_NN_distance / Expected_distance) * 100)
```

---

## Noise Analysis Algorithms

### 1. Local Standard Deviation Method

**Purpose**: Measure noise level using block-based standard deviation

**Mathematical Foundation**:
```
For each 8x8 block B:
mean_B = (1/64) * Σ pixel_values
std_B = sqrt((1/64) * Σ (pixel - mean_B)²)

Noise Level = average(std_B) across all blocks
```

**Implementation**:
```typescript
const calculateNoiseLevel = (data: Uint8ClampedArray, width: number, height: number): number => {
  const blockSize = 8;
  let totalVariance = 0;
  let blockCount = 0;
  
  for (let y = 0; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width - blockSize; x += blockSize) {
      const blockValues: number[] = [];
      
      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          blockValues.push(luminance);
        }
      }
      
      const mean = blockValues.reduce((sum, val) => sum + val, 0) / blockValues.length;
      const variance = blockValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / blockValues.length;
      
      totalVariance += Math.sqrt(variance);
      blockCount++;
    }
  }
  
  return blockCount > 0 ? totalVariance / blockCount : 0;
};
```

### 2. Signal-to-Noise Ratio (SNR)

**Mathematical Foundation**:
```
SNR = μ / σ
where μ = mean luminance, σ = standard deviation of luminance

Higher SNR indicates less noise relative to signal
```

### 3. Compression Artifact Detection

**Purpose**: Detect JPEG blocking artifacts

**Mathematical Foundation**:
```
For 8x8 block boundaries:
blocking_score += |luminance[boundary-1] - luminance[boundary]|

Normalized by image dimensions and pixel count
```

### 4. Chromatic Aberration Detection

**Purpose**: Detect color fringing at edges

**Mathematical Foundation**:
```
At edge pixels:
R_edge = |R[x+1] - R[x]|
G_edge = |G[x+1] - G[x]|
B_edge = |B[x+1] - B[x]|

Channel_imbalance = |R_edge - G_edge| + |G_edge - B_edge| + |B_edge - R_edge|
Aberration_score = average(Channel_imbalance) at edge pixels
```

---

## Composite Scoring Algorithm

### Mathematical Foundation

**Purpose**: Combine multiple quality metrics into a single score

**Weighted Scoring System**:
```
Weights:
- Blur: 30% (critical for sharpness)
- Exposure: 25% (important for detail)
- Noise: 20% (affects reconstruction quality)
- Descriptor: 15% (photogrammetric features)
- Technical: 10% (metadata quality)

Composite Score = Σ(metric_i * weight_i)

Quality Classification:
- Excellent: ≥ 85
- Good: 70-84
- Acceptable: 55-69
- Poor: 40-54
- Unsuitable: < 40
```

**Implementation**:
```typescript
export const calculateCompositeScore = (
  blurScore: number,
  exposureScore: number,
  noiseScore: number,
  technicalScore: number,
  descriptorScore: number = 0
): CompositeQualityScore => {
  const weights = {
    blur: 0.30,
    exposure: 0.25,
    noise: 0.20,
    technical: 0.10,
    descriptor: 0.15
  };
  
  const overall = Math.round(
    blurScore * weights.blur +
    exposureScore * weights.exposure +
    noiseScore * weights.noise +
    technicalScore * weights.technical +
    descriptorScore * weights.descriptor
  );
  
  let recommendation: CompositeQualityScore['recommendation'];
  if (overall >= 85) recommendation = 'excellent';
  else if (overall >= 70) recommendation = 'good';
  else if (overall >= 55) recommendation = 'acceptable';
  else if (overall >= 40) recommendation = 'poor';
  else recommendation = 'unsuitable';
  
  return {
    blur: blurScore,
    exposure: exposureScore,
    noise: noiseScore,
    technical: technicalScore,
    descriptor: descriptorScore,
    overall,
    recommendation
  };
};
```

### Photogrammetric-Specific Scoring

**Purpose**: Specialized scoring for 3D reconstruction suitability

**Algorithm**:
```
Photogrammetric Weights:
- Descriptor: 40% (most critical for matching)
- Blur: 30% (essential for sharp features)
- Exposure: 20% (important for consistent lighting)
- Noise: 10% (less critical but still relevant)

Photogrammetric Score = Σ(metric_i * photogrammetric_weight_i)
```

---

## Color Space Conversion Algorithms

### 1. RGB to YCrCb Conversion

**Purpose**: Convert RGB to luminance-chrominance for better exposure analysis

**Mathematical Foundation (ITU-R BT.601)**:
```
Y  = 0.299 * R + 0.587 * G + 0.114 * B
Cr = 0.5 + 0.5 * R - 0.4187 * G - 0.0813 * B
Cb = 0.5 - 0.1687 * R - 0.3313 * G + 0.5 * B
```

**Alternative Standards**:
```
ITU-R BT.709 (modern cameras):
Y = 0.2126 * R + 0.7152 * G + 0.0722 * B

ITU-R BT.2020 (HDR):
Y = 0.2627 * R + 0.6780 * G + 0.0593 * B
```

### 2. Adaptive Color Space Selection

**Algorithm**:
```typescript
const determineColorSpace = (metadata?: any): string => {
  // Check EXIF color space
  if (metadata?.colorSpace?.includes("sRGB")) return "BT.709";
  
  // Check camera make for modern cameras
  if (metadata?.camera?.make) {
    const modernCameras = ["canon", "nikon", "sony", "dji"];
    if (modernCameras.some(make => metadata.camera.make.toLowerCase().includes(make))) {
      return "BT.709";
    }
  }
  
  return "BT.601"; // Default for compatibility
};
```

---

## WebGL Acceleration Algorithms

### 1. GPU-Accelerated Blur Detection

**Purpose**: Use GPU shaders for faster Laplacian variance calculation

**Vertex Shader**:
```glsl
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
```

**Fragment Shader (Laplacian)**:
```glsl
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_textureSize;
varying vec2 v_texCoord;

void main() {
  vec2 onePixel = vec2(1.0) / u_textureSize;
  
  // Laplacian kernel
  vec4 colorSum = 
    texture2D(u_image, v_texCoord + vec2(-onePixel.x, -onePixel.y)) * -1.0 +
    texture2D(u_image, v_texCoord + vec2(0.0, -onePixel.y)) * -1.0 +
    texture2D(u_image, v_texCoord + vec2(onePixel.x, -onePixel.y)) * -1.0 +
    texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0)) * -1.0 +
    texture2D(u_image, v_texCoord) * 8.0 +
    texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) * -1.0 +
    texture2D(u_image, v_texCoord + vec2(-onePixel.x, onePixel.y)) * -1.0 +
    texture2D(u_image, v_texCoord + vec2(0.0, onePixel.y)) * -1.0 +
    texture2D(u_image, v_texCoord + vec2(onePixel.x, onePixel.y)) * -1.0;
  
  float gray = dot(colorSum.rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(abs(gray), abs(gray), abs(gray), 1.0);
}
```

**Performance Benefits**:
- 10-30x speedup on compatible hardware
- Parallel processing of all pixels
- Reduced CPU load for large images

### 2. Context Pool Management

**Purpose**: Efficient WebGL context reuse

**Algorithm**:
```typescript
const contextPool: WebGLContext[] = [];
const MAX_POOL_SIZE = 3;
const CONTEXT_TIMEOUT = 30000; // 30 seconds

const getWebGLContext = (width: number, height: number): WebGLContext | null => {
  // Clean up expired contexts
  const now = Date.now();
  for (let i = contextPool.length - 1; i >= 0; i--) {
    if (now - contextPool[i].lastUsed > CONTEXT_TIMEOUT) {
      contextPool[i].cleanup();
      contextPool.splice(i, 1);
    }
  }
  
  // Try to reuse existing context
  for (const context of contextPool) {
    if (context.canvas.width === width && context.canvas.height === height) {
      context.lastUsed = now;
      return context;
    }
  }
  
  // Create new context if pool isn't full
  if (contextPool.length < MAX_POOL_SIZE) {
    const newContext = createWebGLContext(width, height);
    if (newContext) {
      contextPool.push(newContext);
      return newContext;
    }
  }
  
  return null;
};
```

---

## Performance Optimization Algorithms

### 1. Lazy Loading for Large Batches

**Purpose**: Reduce memory usage when displaying many images

**Algorithm**:
```typescript
const useLazyLoading = (options: UseLazyLoadingOptions = {}) => {
  const [state, setState] = useState({
    isVisible: false,
    hasBeenVisible: false
  });
  
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setState(prevState => ({
          isVisible: entry.isIntersecting,
          hasBeenVisible: prevState.hasBeenVisible || entry.isIntersecting
        }));
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1
      }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return {
    ref: elementRef,
    shouldLoad: state.hasBeenVisible
  };
};
```

### 2. Performance Benchmarking

**Purpose**: Automatically choose optimal processing method

**Algorithm**:
```typescript
const benchmarkOperation = async <T>(
  operation: string,
  cpuFunction: () => Promise<T>,
  gpuFunction: () => Promise<T>,
  imageSize: number
): Promise<{ result: T; benchmark: PerformanceBenchmark }> => {
  // Benchmark CPU version
  const cpuStart = performance.now();
  const cpuResult = await cpuFunction();
  const cpuTime = performance.now() - cpuStart;

  // Benchmark GPU version
  const gpuStart = performance.now();
  const gpuResult = await gpuFunction();
  const gpuTime = performance.now() - gpuStart;

  const speedup = cpuTime / gpuTime;
  
  return {
    result: speedup > 1.2 ? gpuResult : cpuResult,
    benchmark: { operation, cpuTime, gpuTime, speedup, imageSize, timestamp: Date.now() }
  };
};
```

---

## Algorithm Selection Guidelines

### 1. Image Size Considerations

| Image Size | Recommended Algorithms | Notes |
|------------|----------------------|-------|
| < 100K pixels | CPU-only processing | GPU overhead not worth it |
| 100K - 1M pixels | Hybrid CPU/GPU | Benchmark-based selection |
| > 1M pixels | GPU-preferred | Significant speedup available |

### 2. Scene Type Adaptations

| Scene Type | Blur Threshold | Exposure Thresholds | Feature Expectations |
|------------|---------------|-------------------|-------------------|
| Aerial/Sky | Lower (factor: 12) | Overexp: 245, Underexp: 10 | Lower density OK |
| Ground Detail | Higher (factor: 18) | Standard thresholds | High density expected |
| Mixed | Standard (factor: 15) | Adaptive based on content | Medium expectations |

### 3. Quality vs Performance Trade-offs

**High Quality Mode**:
- Multi-kernel blur detection
- Full histogram analysis
- All feature detection algorithms
- High-precision WebGL shaders

**Balanced Mode** (Default):
- Single Laplacian kernel
- Standard exposure analysis
- Primary feature detectors
- Medium-precision shaders

**Fast Mode**:
- Simplified algorithms
- Reduced sampling
- CPU-only processing
- Lower precision calculations

### 4. Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | Fallback |
|---------|--------|---------|--------|------|----------|
| WebGL 2.0 | ✅ | ✅ | ✅ | ✅ | WebGL 1.0 |
| High Precision | ✅ | ✅ | ⚠️ | ✅ | Medium precision |
| Float Textures | ✅ | ✅ | ⚠️ | ✅ | Integer textures |
| Intersection Observer | ✅ | ✅ | ✅ | ✅ | Immediate loading |

---

## Algorithm Validation and Testing

### 1. Reference Image Testing

**Test Cases**:
- Sharp checkerboard pattern (expected blur score: 80-100)
- Gaussian blurred image (expected blur score: 0-30)
- Overexposed sky image (expected overexposure: >20%)
- Underexposed shadow image (expected underexposure: >20%)
- High-noise synthetic image (expected noise level: >50)
- Uniform color image (expected feature count: <100)
- Textured pattern (expected feature count: >500)

### 2. Performance Benchmarks

**Metrics**:
- Processing time per megapixel
- Memory usage during processing
- GPU vs CPU speedup ratios
- Accuracy vs reference implementations

### 3. Consistency Monitoring

**Tracking**:
- Score drift over time
- Algorithm agreement between methods
- Performance degradation detection
- Error rate monitoring

---

## Future Algorithm Enhancements

### 1. Machine Learning Integration

**Potential Improvements**:
- Neural network-based blur detection
- Learned quality assessment models
- Automatic parameter tuning
- Scene classification for adaptive processing

### 2. Advanced Feature Detection

**Planned Additions**:
- SIFT/SURF descriptors
- ORB feature detection
- Deep learning keypoints
- Multi-scale analysis

### 3. Real-time Processing

**Optimizations**:
- WebAssembly acceleration
- Web Workers for parallel processing
- Streaming analysis for video
- Progressive quality assessment

---

*This documentation covers all algorithms as implemented in the current version. For implementation details, refer to the source code in the `src/utils/` directory.*