/**
 * Validation Test Suite for Image Analysis
 * 
 * This module provides comprehensive testing and validation tools
 * for ensuring the accuracy and reliability of image analysis algorithms.
 */

import { ImageAnalysis } from '../types';

interface ValidationExpectations {
  blurScore?: { min: number; max: number };
  recommendation?: string[];
  exposureScore?: { min: number; max: number };
  overexposurePercentage?: { min: number; max: number };
  underexposurePercentage?: { min: number; max: number };
  noiseScore?: { min: number; max: number };
  noiseLevel?: { min: number; max: number };
  keypointCount?: { min: number; max: number };
  descriptorScore?: { min: number; max: number };
}

interface ValidationResult {
  testName: string;
  passed: boolean;
  details?: string;
  error?: string;
}

interface TestSuiteResult {
  results: Record<string, ImageAnalysis>;
  failures: ValidationResult[];
  passed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

/**
 * Create validation test suite with reference expectations
 */
export const createValidationSuite = () => {
  const referenceExpectations: Record<string, ValidationExpectations> = {
    sharpImage: {
      blurScore: { min: 70, max: 100 },
      recommendation: ["excellent", "good"]
    },
    blurryImage: {
      blurScore: { min: 0, max: 30 },
      recommendation: ["poor", "unsuitable"]
    },
    overexposedImage: {
      exposureScore: { min: 0, max: 40 },
      overexposurePercentage: { min: 20, max: 100 }
    },
    underexposedImage: {
      exposureScore: { min: 0, max: 40 },
      underexposurePercentage: { min: 20, max: 100 }
    },
    noisyImage: {
      noiseScore: { min: 0, max: 40 },
      noiseLevel: { min: 20, max: 100 }
    },
    lowFeatureImage: {
      keypointCount: { min: 0, max: 200 },
      descriptorScore: { min: 0, max: 40 }
    },
    highFeatureImage: {
      keypointCount: { min: 500, max: 5000 },
      descriptorScore: { min: 60, max: 100 }
    }
  };

  return {
    referenceExpectations,

    /**
     * Validate analysis results against reference expectations
     */
    async validateAnalysis(
      analyzer: (file: File) => Promise<ImageAnalysis>,
      testImages: Record<string, File>
    ): Promise<TestSuiteResult> {
      const results: Record<string, ImageAnalysis> = {};
      const failures: ValidationResult[] = [];

      console.group("🧪 Running Validation Test Suite");

      for (const [testName, imageFile] of Object.entries(testImages)) {
        try {
          console.log(`🔍 Testing ${testName}...`);
          const result = await analyzer(imageFile);
          results[testName] = result;

          // Validate against expectations
          const expectations = referenceExpectations[testName];
          if (expectations) {
            const validation = this.validateResult(result, expectations, testName);
            if (!validation.passed) {
              failures.push(validation);
            } else {
              console.log(`✅ ${testName} passed`);
            }
          } else {
            console.warn(`⚠️ No expectations defined for ${testName}`);
          }
        } catch (error) {
          console.error(`❌ Test ${testName} failed:`, error);
          failures.push({ 
            testName, 
            passed: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Summary
      const summary = {
        total: Object.keys(testImages).length,
        passed: Object.keys(testImages).length - failures.length,
        failed: failures.length
      };

      console.log(`\n📊 Validation Summary:`);
      console.log(`  Total tests: ${summary.total}`);
      console.log(`  Passed: ${summary.passed}`);
      console.log(`  Failed: ${summary.failed}`);

      if (failures.length > 0) {
        console.log(`\n❌ Failures:`);
        failures.forEach(failure => {
          console.log(`  ${failure.testName}: ${failure.error || failure.details}`);
        });
      }

      console.groupEnd();

      return { 
        results, 
        failures, 
        passed: failures.length === 0,
        summary
      };
    },

    /**
     * Validate individual result against expectations
     */
    validateResult(
      result: ImageAnalysis, 
      expectations: ValidationExpectations, 
      testName: string
    ): ValidationResult {
      const failures: string[] = [];

      // Check blur score
      if (expectations.blurScore) {
        const { min, max } = expectations.blurScore;
        if (result.blurScore < min || result.blurScore > max) {
          failures.push(`Blur score ${result.blurScore} not in range [${min}, ${max}]`);
        }
      }

      // Check recommendation
      if (expectations.recommendation) {
        const recommendation = result.compositeScore?.recommendation;
        if (!expectations.recommendation.includes(recommendation || '')) {
          failures.push(`Recommendation '${recommendation}' not in expected [${expectations.recommendation.join(', ')}]`);
        }
      }

      // Check exposure score
      if (expectations.exposureScore) {
        const score = result.exposureAnalysis?.exposureScore || 0;
        const { min, max } = expectations.exposureScore;
        if (score < min || score > max) {
          failures.push(`Exposure score ${score} not in range [${min}, ${max}]`);
        }
      }

      // Check overexposure percentage
      if (expectations.overexposurePercentage) {
        const percentage = result.exposureAnalysis?.overexposurePercentage || 0;
        const { min, max } = expectations.overexposurePercentage;
        if (percentage < min || percentage > max) {
          failures.push(`Overexposure ${percentage}% not in range [${min}, ${max}]%`);
        }
      }

      // Check underexposure percentage
      if (expectations.underexposurePercentage) {
        const percentage = result.exposureAnalysis?.underexposurePercentage || 0;
        const { min, max } = expectations.underexposurePercentage;
        if (percentage < min || percentage > max) {
          failures.push(`Underexposure ${percentage}% not in range [${min}, ${max}]%`);
        }
      }

      // Check noise metrics
      if (expectations.noiseScore) {
        const score = result.noiseAnalysis?.noiseScore || 0;
        const { min, max } = expectations.noiseScore;
        if (score < min || score > max) {
          failures.push(`Noise score ${score} not in range [${min}, ${max}]`);
        }
      }

      if (expectations.noiseLevel) {
        const level = result.noiseAnalysis?.noiseLevel || 0;
        const { min, max } = expectations.noiseLevel;
        if (level < min || level > max) {
          failures.push(`Noise level ${level} not in range [${min}, ${max}]`);
        }
      }

      // Check feature detection
      if (expectations.keypointCount) {
        const count = result.descriptorAnalysis?.keypointCount || 0;
        const { min, max } = expectations.keypointCount;
        if (count < min || count > max) {
          failures.push(`Keypoint count ${count} not in range [${min}, ${max}]`);
        }
      }

      if (expectations.descriptorScore) {
        const score = result.descriptorAnalysis?.photogrammetricScore || 0;
        const { min, max } = expectations.descriptorScore;
        if (score < min || score > max) {
          failures.push(`Descriptor score ${score} not in range [${min}, ${max}]`);
        }
      }

      return {
        testName,
        passed: failures.length === 0,
        details: failures.join('; ')
      };
    },

    /**
     * Create synthetic test images for validation
     */
    createSyntheticTestImages(): Record<string, ImageData> {
      const testImages: Record<string, ImageData> = {};

      // Sharp test pattern
      testImages.sharpPattern = this.createSharpTestPattern(400, 400);
      
      // Blurry test pattern
      testImages.blurryPattern = this.createBlurryTestPattern(400, 400);
      
      // Overexposed pattern
      testImages.overexposedPattern = this.createOverexposedPattern(400, 400);
      
      // Underexposed pattern
      testImages.underexposedPattern = this.createUnderexposedPattern(400, 400);
      
      // High noise pattern
      testImages.noisyPattern = this.createNoisyPattern(400, 400);
      
      // Low feature pattern (uniform)
      testImages.uniformPattern = this.createUniformPattern(400, 400);
      
      // High feature pattern (textured)
      testImages.texturedPattern = this.createTexturedPattern(400, 400);

      return testImages;
    },

    /**
     * Create sharp test pattern with high-frequency content
     */
    createSharpTestPattern(width: number, height: number): ImageData {
      const imageData = new ImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Create checkerboard pattern with high frequency
          const checkSize = 4;
          const isWhite = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0;
          const value = isWhite ? 255 : 0;
          
          data[idx] = value;     // R
          data[idx + 1] = value; // G
          data[idx + 2] = value; // B
          data[idx + 3] = 255;   // A
        }
      }

      return imageData;
    },

    /**
     * Create blurry test pattern
     */
    createBlurryTestPattern(width: number, height: number): ImageData {
      // Start with sharp pattern
      const sharp = this.createSharpTestPattern(width, height);
      
      // Apply Gaussian blur
      return this.applyGaussianBlur(sharp, 5);
    },

    /**
     * Create overexposed test pattern
     */
    createOverexposedPattern(width: number, height: number): ImageData {
      const imageData = new ImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Most pixels are very bright (overexposed)
          const brightness = Math.random() > 0.3 ? 255 : Math.random() * 100 + 155;
          
          data[idx] = brightness;     // R
          data[idx + 1] = brightness; // G
          data[idx + 2] = brightness; // B
          data[idx + 3] = 255;        // A
        }
      }

      return imageData;
    },

    /**
     * Create underexposed test pattern
     */
    createUnderexposedPattern(width: number, height: number): ImageData {
      const imageData = new ImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Most pixels are very dark (underexposed)
          const brightness = Math.random() > 0.3 ? 0 : Math.random() * 50;
          
          data[idx] = brightness;     // R
          data[idx + 1] = brightness; // G
          data[idx + 2] = brightness; // B
          data[idx + 3] = 255;        // A
        }
      }

      return imageData;
    },

    /**
     * Create noisy test pattern
     */
    createNoisyPattern(width: number, height: number): ImageData {
      const imageData = new ImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Base gray value with high noise
          const base = 128;
          const noise = (Math.random() - 0.5) * 100;
          const value = Math.max(0, Math.min(255, base + noise));
          
          data[idx] = value;     // R
          data[idx + 1] = value; // G
          data[idx + 2] = value; // B
          data[idx + 3] = 255;   // A
        }
      }

      return imageData;
    },

    /**
     * Create uniform pattern (low features)
     */
    createUniformPattern(width: number, height: number): ImageData {
      const imageData = new ImageData(width, height);
      const data = imageData.data;

      const grayValue = 128;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          data[idx] = grayValue;     // R
          data[idx + 1] = grayValue; // G
          data[idx + 2] = grayValue; // B
          data[idx + 3] = 255;       // A
        }
      }

      return imageData;
    },

    /**
     * Create textured pattern (high features)
     */
    createTexturedPattern(width: number, height: number): ImageData {
      const imageData = new ImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Create complex texture with multiple frequencies
          const freq1 = Math.sin(x * 0.1) * Math.cos(y * 0.1);
          const freq2 = Math.sin(x * 0.05) * Math.cos(y * 0.05);
          const freq3 = Math.sin(x * 0.2) * Math.cos(y * 0.2);
          
          const value = Math.floor(128 + (freq1 + freq2 + freq3) * 40);
          
          data[idx] = value;     // R
          data[idx + 1] = value; // G
          data[idx + 2] = value; // B
          data[idx + 3] = 255;   // A
        }
      }

      return imageData;
    },

    /**
     * Apply Gaussian blur to ImageData
     */
    applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
      const { width, height } = imageData;
      const result = new ImageData(width, height);
      const source = imageData.data;
      const target = result.data;

      // Simple box blur approximation
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                const nidx = (ny * width + nx) * 4;
                r += source[nidx];
                g += source[nidx + 1];
                b += source[nidx + 2];
                count++;
              }
            }
          }
          
          target[idx] = r / count;
          target[idx + 1] = g / count;
          target[idx + 2] = b / count;
          target[idx + 3] = 255;
        }
      }

      return result;
    }
  };
};

/**
 * Performance benchmark suite
 */
export const createPerformanceBenchmark = () => {
  return {
    /**
     * Benchmark analysis performance
     */
    async benchmarkAnalysis(
      analyzer: (file: File) => Promise<ImageAnalysis>,
      testFiles: File[]
    ): Promise<{
      averageTime: number;
      minTime: number;
      maxTime: number;
      results: Array<{ filename: string; time: number; success: boolean }>;
    }> {
      const results: Array<{ filename: string; time: number; success: boolean }> = [];

      console.group("⚡ Performance Benchmark");

      for (const file of testFiles) {
        const startTime = performance.now();
        let success = true;

        try {
          await analyzer(file);
        } catch (error) {
          success = false;
          console.error(`Failed to analyze ${file.name}:`, error);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        results.push({
          filename: file.name,
          time: duration,
          success
        });

        console.log(`${file.name}: ${duration.toFixed(2)}ms ${success ? '✅' : '❌'}`);
      }

      const successfulResults = results.filter(r => r.success);
      const times = successfulResults.map(r => r.time);

      const stats = {
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        results
      };

      console.log(`\n📊 Performance Summary:`);
      console.log(`  Average time: ${stats.averageTime.toFixed(2)}ms`);
      console.log(`  Min time: ${stats.minTime.toFixed(2)}ms`);
      console.log(`  Max time: ${stats.maxTime.toFixed(2)}ms`);
      console.log(`  Success rate: ${(successfulResults.length / results.length * 100).toFixed(1)}%`);

      console.groupEnd();

      return stats;
    }
  };
};