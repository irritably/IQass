import { DescriptorAnalysis } from '../types';

export interface Keypoint {
  x: number;
  y: number;
  strength: number;
  scale: number;
  angle: number;
  type: 'corner' | 'edge' | 'blob' | 'textured';
}

export const analyzeDescriptors = (imageData: ImageData): DescriptorAnalysis => {
  const { data, width, height } = imageData;
  
  // Extract keypoints using Harris corner detection and other methods
  const keypoints = extractKeypoints(data, width, height);
  
  // Analyze keypoint distribution
  const distribution = analyzeKeypointDistribution(keypoints, width, height);
  
  // Calculate feature strength statistics
  const featureStrength = calculateFeatureStrength(keypoints);
  
  // Assess descriptor quality
  const descriptorQuality = assessDescriptorQuality(keypoints, data, width, height);
  
  // Calculate photogrammetric suitability
  const photogrammetricScore = calculatePhotogrammetricScore(
    keypoints,
    distribution,
    featureStrength,
    descriptorQuality
  );
  
  // Determine reconstruction suitability
  const reconstructionSuitability = getReconstructionSuitability(photogrammetricScore);
  
  // Analyze feature types
  const featureTypes = analyzeFeatureTypes(keypoints);
  
  // Calculate invariance metrics
  const scaleInvariance = calculateScaleInvariance(keypoints);
  const rotationInvariance = calculateRotationInvariance(keypoints);
  
  return {
    keypointCount: keypoints.length,
    keypointDensity: (keypoints.length / (width * height)) * 1000,
    keypointDistribution: distribution,
    featureStrength,
    descriptorQuality,
    photogrammetricScore,
    reconstructionSuitability,
    featureTypes,
    scaleInvariance,
    rotationInvariance
  };
};

const extractKeypoints = (data: Uint8ClampedArray, width: number, height: number): Keypoint[] => {
  const keypoints: Keypoint[] = [];
  
  // Convert to grayscale
  const grayscale = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale[i / 4] = gray;
  }
  
  // Harris corner detection
  const harrisKeypoints = harrisCornerDetection(grayscale, width, height);
  keypoints.push(...harrisKeypoints);
  
  // FAST corner detection
  const fastKeypoints = fastCornerDetection(grayscale, width, height);
  keypoints.push(...fastKeypoints);
  
  // Edge detection (Canny-based)
  const edgeKeypoints = edgeBasedKeypoints(grayscale, width, height);
  keypoints.push(...edgeKeypoints);
  
  // Blob detection (LoG approximation)
  const blobKeypoints = blobDetection(grayscale, width, height);
  keypoints.push(...blobKeypoints);
  
  // Remove duplicates and sort by strength
  const uniqueKeypoints = removeDuplicateKeypoints(keypoints);
  return uniqueKeypoints.sort((a, b) => b.strength - a.strength).slice(0, 2000); // Limit to top 2000
};

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
          x,
          y,
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
          x,
          y,
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

const edgeBasedKeypoints = (grayscale: Float32Array, width: number, height: number): Keypoint[] => {
  const keypoints: Keypoint[] = [];
  
  // Sobel edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx = 
        -1 * grayscale[(y-1) * width + (x-1)] + 1 * grayscale[(y-1) * width + (x+1)] +
        -2 * grayscale[y * width + (x-1)] + 2 * grayscale[y * width + (x+1)] +
        -1 * grayscale[(y+1) * width + (x-1)] + 1 * grayscale[(y+1) * width + (x+1)];
      
      const gy = 
        -1 * grayscale[(y-1) * width + (x-1)] + -2 * grayscale[(y-1) * width + x] + -1 * grayscale[(y-1) * width + (x+1)] +
        1 * grayscale[(y+1) * width + (x-1)] + 2 * grayscale[(y+1) * width + x] + 1 * grayscale[(y+1) * width + (x+1)];
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      if (magnitude > 50) {
        keypoints.push({
          x,
          y,
          strength: magnitude / 255,
          scale: 1.0,
          angle: Math.atan2(gy, gx),
          type: 'edge'
        });
      }
    }
  }
  
  return keypoints;
};

const blobDetection = (grayscale: Float32Array, width: number, height: number): Keypoint[] => {
  const keypoints: Keypoint[] = [];
  
  // Simplified LoG (Laplacian of Gaussian) approximation
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      let response = 0;
      
      // 5x5 LoG kernel approximation
      const kernel = [
        [0, 0, -1, 0, 0],
        [0, -1, -2, -1, 0],
        [-1, -2, 16, -2, -1],
        [0, -1, -2, -1, 0],
        [0, 0, -1, 0, 0]
      ];
      
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const idx = (y + dy) * width + (x + dx);
          response += grayscale[idx] * kernel[dy + 2][dx + 2];
        }
      }
      
      if (Math.abs(response) > 100) {
        keypoints.push({
          x,
          y,
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

const removeDuplicateKeypoints = (keypoints: Keypoint[]): Keypoint[] => {
  const unique: Keypoint[] = [];
  const minDistance = 5;
  
  for (const kp of keypoints) {
    let isDuplicate = false;
    for (const existing of unique) {
      const dist = Math.sqrt((kp.x - existing.x) ** 2 + (kp.y - existing.y) ** 2);
      if (dist < minDistance) {
        isDuplicate = true;
        if (kp.strength > existing.strength) {
          // Replace with stronger keypoint
          const index = unique.indexOf(existing);
          unique[index] = kp;
        }
        break;
      }
    }
    if (!isDuplicate) {
      unique.push(kp);
    }
  }
  
  return unique;
};

const analyzeKeypointDistribution = (keypoints: Keypoint[], width: number, height: number) => {
  if (keypoints.length === 0) {
    return { uniformity: 0, coverage: 0, clustering: 100 };
  }
  
  // Divide image into grid and count keypoints per cell
  const gridSize = 8;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  const grid = new Array(gridSize * gridSize).fill(0);
  
  for (const kp of keypoints) {
    const cellX = Math.floor(kp.x / cellWidth);
    const cellY = Math.floor(kp.y / cellHeight);
    if (cellX < gridSize && cellY < gridSize) {
      grid[cellY * gridSize + cellX]++;
    }
  }
  
  // Calculate uniformity (inverse of coefficient of variation)
  const mean = keypoints.length / (gridSize * gridSize);
  const variance = grid.reduce((sum, count) => sum + (count - mean) ** 2, 0) / grid.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 1;
  const uniformity = Math.max(0, 100 - cv * 50);
  
  // Calculate coverage (percentage of non-empty cells)
  const nonEmptyCells = grid.filter(count => count > 0).length;
  const coverage = (nonEmptyCells / grid.length) * 100;
  
  // Calculate clustering (average distance to nearest neighbor)
  let totalDistance = 0;
  for (let i = 0; i < keypoints.length; i++) {
    let minDistance = Infinity;
    for (let j = 0; j < keypoints.length; j++) {
      if (i !== j) {
        const dist = Math.sqrt(
          (keypoints[i].x - keypoints[j].x) ** 2 + 
          (keypoints[i].y - keypoints[j].y) ** 2
        );
        minDistance = Math.min(minDistance, dist);
      }
    }
    totalDistance += minDistance;
  }
  
  const avgNearestNeighborDistance = totalDistance / keypoints.length;
  const expectedDistance = Math.sqrt((width * height) / keypoints.length) / 2;
  const clustering = Math.max(0, 100 - (avgNearestNeighborDistance / expectedDistance) * 100);
  
  return {
    uniformity: Math.round(uniformity),
    coverage: Math.round(coverage),
    clustering: Math.round(clustering)
  };
};

const calculateFeatureStrength = (keypoints: Keypoint[]) => {
  if (keypoints.length === 0) {
    return { average: 0, median: 0, standardDeviation: 0 };
  }
  
  const strengths = keypoints.map(kp => kp.strength);
  const average = strengths.reduce((sum, s) => sum + s, 0) / strengths.length;
  
  const sortedStrengths = [...strengths].sort((a, b) => a - b);
  const median = sortedStrengths[Math.floor(sortedStrengths.length / 2)];
  
  const variance = strengths.reduce((sum, s) => sum + (s - average) ** 2, 0) / strengths.length;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    average: Math.round(average * 1000) / 1000,
    median: Math.round(median * 1000) / 1000,
    standardDeviation: Math.round(standardDeviation * 1000) / 1000
  };
};

const assessDescriptorQuality = (keypoints: Keypoint[], data: Uint8ClampedArray, width: number, height: number) => {
  if (keypoints.length === 0) {
    return { distinctiveness: 0, repeatability: 0, matchability: 0 };
  }
  
  // Calculate distinctiveness based on local contrast
  let totalDistinctiveness = 0;
  for (const kp of keypoints) {
    const x = Math.round(kp.x);
    const y = Math.round(kp.y);
    
    if (x >= 8 && x < width - 8 && y >= 8 && y < height - 8) {
      let localContrast = 0;
      const centerIdx = (y * width + x) * 4;
      const centerLum = 0.299 * data[centerIdx] + 0.587 * data[centerIdx + 1] + 0.114 * data[centerIdx + 2];
      
      // Sample 8x8 neighborhood
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          localContrast += Math.abs(lum - centerLum);
        }
      }
      
      totalDistinctiveness += localContrast / (9 * 9 * 255);
    }
  }
  
  const distinctiveness = Math.min(100, (totalDistinctiveness / keypoints.length) * 100);
  
  // Estimate repeatability based on feature strength consistency
  const strengths = keypoints.map(kp => kp.strength);
  const avgStrength = strengths.reduce((sum, s) => sum + s, 0) / strengths.length;
  const strengthVariance = strengths.reduce((sum, s) => sum + (s - avgStrength) ** 2, 0) / strengths.length;
  const repeatability = Math.max(0, 100 - (Math.sqrt(strengthVariance) / avgStrength) * 100);
  
  // Estimate matchability based on feature distribution and strength
  const matchability = Math.min(100, (distinctiveness + repeatability) / 2);
  
  return {
    distinctiveness: Math.round(distinctiveness),
    repeatability: Math.round(repeatability),
    matchability: Math.round(matchability)
  };
};

const calculatePhotogrammetricScore = (
  keypoints: Keypoint[],
  distribution: any,
  featureStrength: any,
  descriptorQuality: any
): number => {
  // Weighted scoring for photogrammetric suitability
  const weights = {
    keypointDensity: 0.20,    // 20% - Need sufficient features
    distribution: 0.25,       // 25% - Even distribution is crucial
    featureStrength: 0.20,    // 20% - Strong features are more reliable
    descriptorQuality: 0.35   // 35% - Most important for matching
  };
  
  // Normalize keypoint density (optimal range: 0.5-2.0 per 1000 pixels)
  const density = (keypoints.length / 1000);
  const densityScore = Math.min(100, Math.max(0, density / 2 * 100));
  
  // Distribution score (average of uniformity and coverage, penalize clustering)
  const distributionScore = (distribution.uniformity + distribution.coverage) / 2 - distribution.clustering / 2;
  
  // Feature strength score (normalized)
  const strengthScore = Math.min(100, featureStrength.average * 100);
  
  // Descriptor quality score (average of all quality metrics)
  const qualityScore = (descriptorQuality.distinctiveness + descriptorQuality.repeatability + descriptorQuality.matchability) / 3;
  
  const photogrammetricScore = 
    densityScore * weights.keypointDensity +
    Math.max(0, distributionScore) * weights.distribution +
    strengthScore * weights.featureStrength +
    qualityScore * weights.descriptorQuality;
  
  return Math.round(Math.max(0, Math.min(100, photogrammetricScore)));
};

const getReconstructionSuitability = (score: number): DescriptorAnalysis['reconstructionSuitability'] => {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'acceptable';
  if (score >= 40) return 'poor';
  return 'unsuitable';
};

const analyzeFeatureTypes = (keypoints: Keypoint[]) => {
  const types = { corners: 0, edges: 0, blobs: 0, textured: 0 };
  
  for (const kp of keypoints) {
    types[kp.type]++;
  }
  
  return types;
};

const calculateScaleInvariance = (keypoints: Keypoint[]): number => {
  // Simplified scale invariance based on scale distribution
  const scales = keypoints.map(kp => kp.scale);
  const uniqueScales = [...new Set(scales)].length;
  return Math.min(100, (uniqueScales / Math.max(1, scales.length)) * 200);
};

const calculateRotationInvariance = (keypoints: Keypoint[]): number => {
  // Simplified rotation invariance based on angle distribution
  const angles = keypoints.map(kp => kp.angle);
  const angleVariance = angles.reduce((sum, angle, _, arr) => {
    const mean = arr.reduce((s, a) => s + a, 0) / arr.length;
    return sum + (angle - mean) ** 2;
  }, 0) / angles.length;
  
  return Math.min(100, Math.sqrt(angleVariance) * 50);
};