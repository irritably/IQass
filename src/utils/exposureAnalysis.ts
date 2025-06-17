export interface ExposureAnalysis {
  overexposurePercentage: number;
  underexposurePercentage: number;
  dynamicRange: number;
  averageBrightness: number;
  contrastRatio: number;
  histogramBalance: 'balanced' | 'underexposed' | 'overexposed' | 'high-contrast';
  exposureScore: number;
}

export const analyzeExposure = (imageData: ImageData): ExposureAnalysis => {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  // Calculate luminance histogram
  const histogram = new Array(256).fill(0);
  const luminanceValues: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate luminance using ITU-R BT.709 standard
    const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    histogram[luminance]++;
    luminanceValues.push(luminance);
  }
  
  // Calculate exposure metrics
  const overexposureThreshold = 250;
  const underexposureThreshold = 5;
  
  const overexposedPixels = histogram.slice(overexposureThreshold).reduce((sum, count) => sum + count, 0);
  const underexposedPixels = histogram.slice(0, underexposureThreshold).reduce((sum, count) => sum + count, 0);
  
  const overexposurePercentage = (overexposedPixels / totalPixels) * 100;
  const underexposurePercentage = (underexposedPixels / totalPixels) * 100;
  
  // Calculate average brightness
  const averageBrightness = luminanceValues.reduce((sum, val) => sum + val, 0) / luminanceValues.length;
  
  // Calculate dynamic range (difference between 95th and 5th percentiles)
  const sortedLuminance = [...luminanceValues].sort((a, b) => a - b);
  const p5 = sortedLuminance[Math.floor(sortedLuminance.length * 0.05)];
  const p95 = sortedLuminance[Math.floor(sortedLuminance.length * 0.95)];
  const dynamicRange = p95 - p5;
  
  // Calculate contrast ratio
  const maxLuminance = Math.max(...luminanceValues);
  const minLuminance = Math.min(...luminanceValues);
  const contrastRatio = maxLuminance > 0 ? (maxLuminance + 0.05) / (minLuminance + 0.05) : 1;
  
  // Determine histogram balance
  let histogramBalance: ExposureAnalysis['histogramBalance'];
  if (overexposurePercentage > 5) {
    histogramBalance = 'overexposed';
  } else if (underexposurePercentage > 5) {
    histogramBalance = 'underexposed';
  } else if (contrastRatio > 15) {
    histogramBalance = 'high-contrast';
  } else {
    histogramBalance = 'balanced';
  }
  
  // Calculate exposure score (0-100)
  let exposureScore = 100;
  
  // Penalize over/under exposure
  exposureScore -= Math.min(overexposurePercentage * 2, 30);
  exposureScore -= Math.min(underexposurePercentage * 2, 30);
  
  // Reward good dynamic range
  const optimalDynamicRange = 200;
  const dynamicRangeScore = Math.min(dynamicRange / optimalDynamicRange, 1) * 20;
  exposureScore = Math.max(0, exposureScore - 20 + dynamicRangeScore);
  
  // Adjust for brightness (penalize extreme values)
  const brightnessDeviation = Math.abs(averageBrightness - 128) / 128;
  exposureScore -= brightnessDeviation * 15;
  
  exposureScore = Math.max(0, Math.min(100, Math.round(exposureScore)));
  
  return {
    overexposurePercentage: Math.round(overexposurePercentage * 100) / 100,
    underexposurePercentage: Math.round(underexposurePercentage * 100) / 100,
    dynamicRange: Math.round(dynamicRange),
    averageBrightness: Math.round(averageBrightness),
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    histogramBalance,
    exposureScore
  };
};