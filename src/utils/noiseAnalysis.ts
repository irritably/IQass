export interface NoiseAnalysis {
  noiseLevel: number;
  snrRatio: number;
  compressionArtifacts: number;
  chromaticAberration: number;
  vignetting: number;
  overallArtifactScore: number;
  noiseScore: number;
}

export const analyzeNoise = (imageData: ImageData): NoiseAnalysis => {
  const { data, width, height } = imageData;
  
  // Calculate noise level using local standard deviation
  const noiseLevel = calculateNoiseLevel(data, width, height);
  
  // Calculate signal-to-noise ratio
  const snrRatio = calculateSNR(data, width, height);
  
  // Detect compression artifacts (simplified JPEG blocking detection)
  const compressionArtifacts = detectCompressionArtifacts(data, width, height);
  
  // Detect chromatic aberration (simplified color fringing detection)
  const chromaticAberration = detectChromaticAberration(data, width, height);
  
  // Detect vignetting
  const vignetting = detectVignetting(data, width, height);
  
  // Calculate overall artifact score
  const overallArtifactScore = Math.round(
    (compressionArtifacts + chromaticAberration + vignetting) / 3
  );
  
  // Calculate noise score (0-100, higher is better)
  let noiseScore = 100;
  noiseScore -= Math.min(noiseLevel * 2, 40); // Penalize high noise
  noiseScore -= Math.min(overallArtifactScore, 30); // Penalize artifacts
  noiseScore += Math.min(snrRatio / 2, 20); // Reward good SNR
  
  noiseScore = Math.max(0, Math.min(100, Math.round(noiseScore)));
  
  return {
    noiseLevel: Math.round(noiseLevel * 100) / 100,
    snrRatio: Math.round(snrRatio * 100) / 100,
    compressionArtifacts: Math.round(compressionArtifacts * 100) / 100,
    chromaticAberration: Math.round(chromaticAberration * 100) / 100,
    vignetting: Math.round(vignetting * 100) / 100,
    overallArtifactScore,
    noiseScore
  };
};

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

const calculateSNR = (data: Uint8ClampedArray, width: number, height: number): number => {
  const luminanceValues: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luminanceValues.push(luminance);
  }
  
  const mean = luminanceValues.reduce((sum, val) => sum + val, 0) / luminanceValues.length;
  const variance = luminanceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / luminanceValues.length;
  const standardDeviation = Math.sqrt(variance);
  
  return mean > 0 ? mean / standardDeviation : 0;
};

const detectCompressionArtifacts = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Simplified JPEG blocking artifact detection
  let blockingScore = 0;
  const blockSize = 8;
  
  // Check for 8x8 block boundaries (typical JPEG compression)
  for (let y = blockSize; y < height - blockSize; y += blockSize) {
    for (let x = 0; x < width; x++) {
      const idx1 = ((y - 1) * width + x) * 4;
      const idx2 = (y * width + x) * 4;
      
      const diff = Math.abs(
        (0.299 * data[idx1] + 0.587 * data[idx1 + 1] + 0.114 * data[idx1 + 2]) -
        (0.299 * data[idx2] + 0.587 * data[idx2 + 1] + 0.114 * data[idx2 + 2])
      );
      
      blockingScore += diff;
    }
  }
  
  return Math.min(blockingScore / (width * height / 64), 100);
};

const detectChromaticAberration = (data: Uint8ClampedArray, width: number, height: number): number => {
  // Simplified chromatic aberration detection by analyzing color channel misalignment
  let aberrationScore = 0;
  let edgeCount = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate edge strength
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const rNext = data[idx + 4];
      const gNext = data[idx + 5];
      const bNext = data[idx + 6];
      
      const rEdge = Math.abs(r - rNext);
      const gEdge = Math.abs(g - gNext);
      const bEdge = Math.abs(b - bNext);
      
      if (rEdge > 20 || gEdge > 20 || bEdge > 20) {
        // Check for color channel imbalance at edges
        const channelImbalance = Math.abs(rEdge - gEdge) + Math.abs(gEdge - bEdge) + Math.abs(bEdge - rEdge);
        aberrationScore += channelImbalance;
        edgeCount++;
      }
    }
  }
  
  return edgeCount > 0 ? Math.min(aberrationScore / edgeCount / 10, 100) : 0;
};

const detectVignetting = (data: Uint8ClampedArray, width: number, height: number): number => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  
  let centerBrightness = 0;
  let cornerBrightness = 0;
  let centerCount = 0;
  let cornerCount = 0;
  
  // Sample center region
  const centerRadius = Math.min(width, height) * 0.1;
  for (let y = Math.floor(centerY - centerRadius); y < centerY + centerRadius; y++) {
    for (let x = Math.floor(centerX - centerRadius); x < centerX + centerRadius; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        centerBrightness += luminance;
        centerCount++;
      }
    }
  }
  
  // Sample corner regions
  const cornerRadius = Math.min(width, height) * 0.05;
  const corners = [
    [cornerRadius, cornerRadius],
    [width - cornerRadius, cornerRadius],
    [cornerRadius, height - cornerRadius],
    [width - cornerRadius, height - cornerRadius]
  ];
  
  corners.forEach(([cx, cy]) => {
    for (let y = cy - cornerRadius; y < cy + cornerRadius; y++) {
      for (let x = cx - cornerRadius; x < cx + cornerRadius; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          cornerBrightness += luminance;
          cornerCount++;
        }
      }
    }
  });
  
  const avgCenterBrightness = centerCount > 0 ? centerBrightness / centerCount : 0;
  const avgCornerBrightness = cornerCount > 0 ? cornerBrightness / cornerCount : 0;
  
  const vignettingRatio = avgCenterBrightness > 0 ? 
    (avgCenterBrightness - avgCornerBrightness) / avgCenterBrightness : 0;
  
  return Math.max(0, Math.min(100, vignettingRatio * 100));
};