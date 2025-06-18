# Debug Analysis Issues - Critical Fixes

This document addresses the critical issues identified in the Drone Image Quality Analyzer and provides debugging tools and fixes.

## 1. Blur Analysis (Laplacian Variance) Debugging

### Current Issues Identified
- Threshold sensitivity requiring manual tuning
- Log normalization potentially distorting values
- Scene-dependent threshold needs

### Debug Implementation

```javascript
// Enhanced blur score debugging
function debugBlurScore(imageData, blurScore, laplacianVariance) {
    console.group("🔍 Blur Analysis Debug");
    console.log("Image dimensions:", imageData.width, "x", imageData.height);
    console.log("Raw Laplacian Variance:", laplacianVariance);
    console.log("Applied Log Normalization:", Math.log(laplacianVariance + 1));
    console.log("Scaling factor (15x):", Math.log(laplacianVariance + 1) * 15);
    console.log("Final Blur Score (0-100):", blurScore);
    
    // Validate reasonable ranges
    if (laplacianVariance < 10) {
        console.warn("⚠️ Very low variance - possibly overblurred or uniform image");
    }
    if (laplacianVariance > 10000) {
        console.warn("⚠️ Extremely high variance - check calculation or very noisy image");
    }
    
    // Scene analysis
    const pixelCount = imageData.width * imageData.height;
    const avgVariancePerPixel = laplacianVariance / pixelCount;
    console.log("Average variance per pixel:", avgVariancePerPixel.toFixed(4));
    
    // Threshold recommendations
    if (blurScore < 30) {
        console.log("📊 Recommendation: Image likely unsuitable for photogrammetry");
    } else if (blurScore < 50) {
        console.log("📊 Recommendation: Marginal quality - review manually");
    } else if (blurScore > 80) {
        console.log("📊 Recommendation: Excellent sharpness for reconstruction");
    }
    
    console.groupEnd();
    return {
        laplacianVariance,
        normalizedScore: Math.log(laplacianVariance + 1) * 15,
        avgVariancePerPixel,
        recommendation: getBlurRecommendation(blurScore)
    };
}

function getBlurRecommendation(score) {
    if (score > 80) return "excellent";
    if (score > 60) return "good";
    if (score > 40) return "acceptable";
    if (score > 20) return "poor";
    return "unsuitable";
}
```

### Improved Blur Detection Algorithm

```javascript
// Multi-kernel blur detection for robustness
function improvedBlurDetection(imageData) {
    const { data, width, height } = imageData;
    
    // Convert to grayscale
    const grayscale = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        grayscale[i / 4] = gray;
    }
    
    // Multiple kernels for robust detection
    const kernels = {
        standard: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
        cross: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
        sobel: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
    };
    
    const variances = {};
    
    for (const [name, kernel] of Object.entries(kernels)) {
        const responses = [];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let response = 0;
                for (let ky = 0; ky < 3; ky++) {
                    for (let kx = 0; kx < 3; kx++) {
                        const idx = (y + ky - 1) * width + (x + kx - 1);
                        response += grayscale[idx] * kernel[ky][kx];
                    }
                }
                responses.push(Math.abs(response));
            }
        }
        
        // Calculate variance
        const mean = responses.reduce((sum, val) => sum + val, 0) / responses.length;
        const variance = responses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / responses.length;
        variances[name] = variance;
    }
    
    // Use median variance for robustness
    const varianceValues = Object.values(variances);
    varianceValues.sort((a, b) => a - b);
    const medianVariance = varianceValues[Math.floor(varianceValues.length / 2)];
    
    // Scene-adaptive normalization
    const sceneType = detectSceneType(imageData);
    const normalizationFactor = getSceneNormalizationFactor(sceneType);
    
    const normalizedScore = Math.min(100, Math.max(0, 
        Math.log(medianVariance + 1) * normalizationFactor
    ));
    
    return {
        score: Math.round(normalizedScore),
        variance: medianVariance,
        kernelVariances: variances,
        sceneType,
        debug: {
            rawVariances: variances,
            medianVariance,
            normalizationFactor,
            finalScore: normalizedScore
        }
    };
}

function detectSceneType(imageData) {
    // Simple scene classification based on color distribution
    const { data } = imageData;
    let skyPixels = 0;
    let groundPixels = 0;
    const totalPixels = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Sky detection (blue-ish, bright)
        if (b > r && b > g && (r + g + b) / 3 > 150) {
            skyPixels++;
        }
        // Ground detection (varied colors, lower brightness)
        else if ((r + g + b) / 3 < 180) {
            groundPixels++;
        }
    }
    
    const skyRatio = skyPixels / totalPixels;
    const groundRatio = groundPixels / totalPixels;
    
    if (skyRatio > 0.4) return "aerial_sky";
    if (groundRatio > 0.6) return "ground_detail";
    return "mixed";
}

function getSceneNormalizationFactor(sceneType) {
    switch (sceneType) {
        case "aerial_sky": return 12; // Lower factor for sky (less texture expected)
        case "ground_detail": return 18; // Higher factor for detailed ground
        case "mixed": return 15; // Standard factor
        default: return 15;
    }
}
```

## 2. Exposure Assessment Debugging

### Debug Implementation

```javascript
function debugExposureAnalysis(imageData, exposureAnalysis) {
    console.group("📸 Exposure Analysis Debug");
    
    const { data, width, height } = imageData;
    
    // Validate histogram calculations
    const histogram = new Array(256).fill(0);
    const luminanceValues = [];
    
    for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        histogram[Math.floor(lum)]++;
        luminanceValues.push(lum);
    }
    
    // Verify percentile calculations
    const sortedPixels = [...luminanceValues].sort((a, b) => a - b);
    const p5 = sortedPixels[Math.floor(sortedPixels.length * 0.05)];
    const p95 = sortedPixels[Math.floor(sortedPixels.length * 0.95)];
    const calculatedDynamicRange = p95 - p5;
    
    console.log("Exposure Metrics:");
    console.log("  Overexposure %:", exposureAnalysis.overexposurePercentage);
    console.log("  Underexposure %:", exposureAnalysis.underexposurePercentage);
    console.log("  Dynamic Range (reported):", exposureAnalysis.dynamicRange);
    console.log("  Dynamic Range (calculated):", calculatedDynamicRange.toFixed(1));
    console.log("  Histogram Balance:", exposureAnalysis.histogramBalance);
    console.log("  Average Brightness:", exposureAnalysis.averageBrightness);
    
    // Validate percentile calculations
    console.log("Percentile Validation:");
    console.log("  P5:", p5.toFixed(1));
    console.log("  P95:", p95.toFixed(1));
    console.log("  Range Check:", Math.abs(calculatedDynamicRange - exposureAnalysis.dynamicRange) < 1 ? "✅ PASS" : "❌ FAIL");
    
    // Check for unrealistic values
    if (exposureAnalysis.overexposurePercentage > 50) {
        console.warn("⚠️ Excessive overexposure detected - may indicate processing error");
    }
    if (exposureAnalysis.dynamicRange < 50) {
        console.warn("⚠️ Very low dynamic range - check calculation or uniform image");
    }
    if (exposureAnalysis.averageBrightness < 20 || exposureAnalysis.averageBrightness > 235) {
        console.warn("⚠️ Extreme brightness values detected");
    }
    
    // Histogram analysis
    const peakBin = histogram.indexOf(Math.max(...histogram));
    const histogramSpread = histogram.filter(count => count > 0).length;
    
    console.log("Histogram Analysis:");
    console.log("  Peak bin:", peakBin, "(brightness level)");
    console.log("  Histogram spread:", histogramSpread, "bins");
    console.log("  Distribution:", getHistogramDistribution(histogram));
    
    console.groupEnd();
    
    return {
        calculatedDynamicRange,
        percentiles: { p5, p95 },
        histogramPeak: peakBin,
        histogramSpread,
        validation: {
            dynamicRangeMatch: Math.abs(calculatedDynamicRange - exposureAnalysis.dynamicRange) < 1,
            reasonableOverexposure: exposureAnalysis.overexposurePercentage <= 50,
            reasonableUnderexposure: exposureAnalysis.underexposurePercentage <= 50,
            reasonableBrightness: exposureAnalysis.averageBrightness >= 20 && exposureAnalysis.averageBrightness <= 235
        }
    };
}

function getHistogramDistribution(histogram) {
    const total = histogram.reduce((sum, count) => sum + count, 0);
    const shadows = histogram.slice(0, 85).reduce((sum, count) => sum + count, 0) / total * 100;
    const midtones = histogram.slice(85, 170).reduce((sum, count) => sum + count, 0) / total * 100;
    const highlights = histogram.slice(170, 256).reduce((sum, count) => sum + count, 0) / total * 100;
    
    return {
        shadows: shadows.toFixed(1) + "%",
        midtones: midtones.toFixed(1) + "%",
        highlights: highlights.toFixed(1) + "%"
    };
}
```

### Adaptive Exposure Thresholds

```javascript
function adaptiveExposureThresholds(metadata, imageData) {
    // Determine if this is drone imagery
    const isDroneImage = (metadata?.location?.altitude && metadata.location.altitude > 50) ||
                        (metadata?.camera?.make && metadata.camera.make.toLowerCase().includes('dji')) ||
                        detectAerialCharacteristics(imageData);
    
    const isHighAltitude = metadata?.location?.altitude && metadata.location.altitude > 200;
    
    const thresholds = {
        base: {
            overexposure: 250,
            underexposure: 5,
            dynamicRangeMin: 120
        },
        drone: {
            overexposure: 245,  // More sensitive to sky overexposure
            underexposure: 10,  // Less sensitive to shadow underexposure
            dynamicRangeMin: 80 // Lower expectation for aerial scenes
        },
        highAltitude: {
            overexposure: 240,  // Very sensitive to sky overexposure
            underexposure: 15,  // Even less sensitive to shadows
            dynamicRangeMin: 60 // Much lower expectation
        }
    };
    
    if (isHighAltitude) return thresholds.highAltitude;
    if (isDroneImage) return thresholds.drone;
    return thresholds.base;
}

function detectAerialCharacteristics(imageData) {
    const { data } = imageData;
    let skyPixels = 0;
    let horizonIndicators = 0;
    const totalPixels = data.length / 4;
    
    // Check top third of image for sky characteristics
    const topThirdEnd = Math.floor(imageData.height / 3) * imageData.width * 4;
    
    for (let i = 0; i < topThirdEnd; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        // Sky detection: blue-ish and bright
        if (b > r && b > g && brightness > 150) {
            skyPixels++;
        }
    }
    
    const skyRatio = skyPixels / (totalPixels / 3);
    return skyRatio > 0.3; // 30% of top third is sky-like
}
```

## 3. Feature Detection Debugging

### Debug Implementation

```javascript
function debugFeatureDetection(descriptorAnalysis, imageData) {
    console.group("🎯 Feature Detection Debug");
    
    const { keypointCount, featureTypes, keypointDistribution } = descriptorAnalysis;
    const total = Object.values(featureTypes).reduce((sum, count) => sum + count, 0);
    const imageArea = imageData.width * imageData.height;
    
    console.log("Feature Detection Results:");
    console.log("  Total keypoints:", keypointCount);
    console.log("  Image dimensions:", imageData.width, "x", imageData.height);
    console.log("  Density:", descriptorAnalysis.keypointDensity.toFixed(2), "per 1000 pixels");
    
    console.log("Feature Type Distribution:");
    Object.entries(featureTypes).forEach(([type, count]) => {
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : "0.0";
        console.log(`    ${type}: ${count} (${percentage}%)`);
    });
    
    console.log("Spatial Distribution:");
    console.log("  Uniformity:", keypointDistribution.uniformity + "%");
    console.log("  Coverage:", keypointDistribution.coverage + "%");
    console.log("  Clustering:", keypointDistribution.clustering);
    
    // Check for algorithm conflicts
    if (keypointDistribution.clustering > 80) {
        console.warn("⚠️ High clustering detected - may indicate algorithm bias or poor distribution");
    }
    
    // Validate density calculations
    const expectedDensity = keypointCount / (imageArea / 1000);
    const densityDiff = Math.abs(expectedDensity - descriptorAnalysis.keypointDensity);
    console.log("Density Validation:");
    console.log("  Expected:", expectedDensity.toFixed(2));
    console.log("  Reported:", descriptorAnalysis.keypointDensity.toFixed(2));
    console.log("  Difference:", densityDiff.toFixed(2), densityDiff < 0.1 ? "✅ PASS" : "❌ FAIL");
    
    // Feature quality assessment
    const qualityMetrics = descriptorAnalysis.descriptorQuality;
    console.log("Feature Quality:");
    console.log("  Distinctiveness:", qualityMetrics.distinctiveness);
    console.log("  Repeatability:", qualityMetrics.repeatability);
    console.log("  Matchability:", qualityMetrics.matchability);
    
    // Recommendations based on analysis
    const recommendations = generateFeatureRecommendations(descriptorAnalysis, imageArea);
    console.log("Recommendations:", recommendations);
    
    console.groupEnd();
    
    return {
        totalFeatures: total,
        densityValidation: densityDiff < 0.1,
        distributionQuality: getDistributionQuality(keypointDistribution),
        recommendations
    };
}

function generateFeatureRecommendations(analysis, imageArea) {
    const recommendations = [];
    
    if (analysis.keypointCount < 100) {
        recommendations.push("Low feature count - consider images with more texture");
    }
    
    if (analysis.keypointDensity < 0.5) {
        recommendations.push("Low feature density - may affect matching quality");
    }
    
    if (analysis.keypointDistribution.uniformity < 50) {
        recommendations.push("Poor feature distribution - features clustered in small areas");
    }
    
    if (analysis.keypointDistribution.coverage < 60) {
        recommendations.push("Low coverage - large areas without features");
    }
    
    if (analysis.descriptorQuality.matchability < 60) {
        recommendations.push("Low matchability - features may be difficult to match between images");
    }
    
    if (recommendations.length === 0) {
        recommendations.push("Good feature distribution and quality for photogrammetry");
    }
    
    return recommendations;
}

function getDistributionQuality(distribution) {
    const score = (distribution.uniformity + distribution.coverage) / 2 - distribution.clustering / 2;
    if (score > 70) return "excellent";
    if (score > 50) return "good";
    if (score > 30) return "acceptable";
    return "poor";
}
```

## 4. Composite Scoring Debug

### Debug Implementation

```javascript
function debugCompositeScoring(compositeScore, individualScores) {
    console.group("🏆 Composite Scoring Debug");
    
    const weights = { blur: 0.3, exposure: 0.25, noise: 0.2, technical: 0.1, descriptor: 0.15 };
    
    console.log("Individual Scores:");
    let calculatedTotal = 0;
    
    Object.entries(individualScores).forEach(([key, value]) => {
        if (weights[key]) {
            const weighted = value * weights[key];
            calculatedTotal += weighted;
            console.log(`  ${key}: ${value} (weight: ${weights[key]}, weighted: ${weighted.toFixed(1)})`);
        }
    });
    
    console.log("Composite Score Validation:");
    console.log("  Reported overall:", compositeScore.overall);
    console.log("  Calculated total:", calculatedTotal.toFixed(1));
    console.log("  Difference:", Math.abs(compositeScore.overall - calculatedTotal).toFixed(1));
    console.log("  Validation:", Math.abs(compositeScore.overall - calculatedTotal) < 1 ? "✅ PASS" : "❌ FAIL");
    
    // Check for score conflicts
    const scores = Object.values(individualScores);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreDiff = maxScore - minScore;
    
    console.log("Score Analysis:");
    console.log("  Score range:", minScore.toFixed(1), "-", maxScore.toFixed(1));
    console.log("  Score variance:", scoreDiff.toFixed(1));
    
    if (scoreDiff > 50) {
        console.warn("⚠️ Large score variance detected - review individual metrics");
        
        // Identify problematic scores
        scores.forEach((score, index) => {
            const keys = Object.keys(individualScores);
            if (score < 30 && maxScore > 80) {
                console.warn(`  ${keys[index]} score (${score}) significantly lower than others`);
            }
        });
    }
    
    // Weight optimization suggestions
    const weightOptimization = analyzeWeightOptimization(individualScores, compositeScore.recommendation);
    console.log("Weight Analysis:", weightOptimization);
    
    console.groupEnd();
    
    return {
        calculatedScore: calculatedTotal,
        scoreVariance: scoreDiff,
        validation: Math.abs(compositeScore.overall - calculatedTotal) < 1,
        weightOptimization
    };
}

function analyzeWeightOptimization(scores, recommendation) {
    const suggestions = [];
    
    // For drone imagery, blur and features are most critical
    if (scores.blur < 50 && scores.descriptor < 50) {
        suggestions.push("Consider increasing blur and descriptor weights for drone imagery");
    }
    
    // If exposure is consistently problematic for aerial images
    if (scores.exposure < 40 && scores.blur > 70) {
        suggestions.push("Exposure weight may be too high for aerial imagery with sky");
    }
    
    // If noise is consistently good, weight might be too high
    if (scores.noise > 80 && recommendation !== "excellent") {
        suggestions.push("Noise weight might be too high if consistently good");
    }
    
    return suggestions.length > 0 ? suggestions : ["Current weights appear balanced"];
}
```

## 5. Color Space Validation

### Debug Implementation

```javascript
function validateColorSpaceConversion(r, g, b, metadata) {
    console.group("🎨 Color Space Conversion Debug");
    
    // Current BT.601 conversion
    const y601 = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Modern BT.709 conversion
    const y709 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    // BT.2020 for HDR content
    const y2020 = 0.2627 * r + 0.6780 * g + 0.0593 * b;
    
    console.log("Luminance Comparison (R:", r, "G:", g, "B:", b, "):");
    console.log("  BT.601 (current):", y601.toFixed(2));
    console.log("  BT.709 (modern):", y709.toFixed(2));
    console.log("  BT.2020 (HDR):", y2020.toFixed(2));
    
    const diff601_709 = Math.abs(y601 - y709);
    const diff601_2020 = Math.abs(y601 - y2020);
    
    console.log("Differences:");
    console.log("  BT.601 vs BT.709:", diff601_709.toFixed(2));
    console.log("  BT.601 vs BT.2020:", diff601_2020.toFixed(2));
    
    // Determine appropriate color space
    const recommendedColorSpace = determineColorSpace(metadata);
    console.log("Recommended color space:", recommendedColorSpace);
    
    if (diff601_709 > 5) {
        console.warn("⚠️ Significant luminance difference - consider using", recommendedColorSpace);
    }
    
    console.groupEnd();
    
    return {
        current: y601,
        bt709: y709,
        bt2020: y2020,
        difference: diff601_709,
        recommended: recommendedColorSpace,
        shouldUpdate: diff601_709 > 5
    };
}

function determineColorSpace(metadata) {
    // Check EXIF color space
    if (metadata?.colorSpace) {
        if (metadata.colorSpace.includes("sRGB")) return "BT.709";
        if (metadata.colorSpace.includes("Adobe")) return "BT.709";
    }
    
    // Check camera make/model for modern cameras
    if (metadata?.camera?.make) {
        const make = metadata.camera.make.toLowerCase();
        const model = metadata.camera.model?.toLowerCase() || "";
        
        // Modern cameras typically use BT.709
        if (make.includes("canon") || make.includes("nikon") || 
            make.includes("sony") || make.includes("dji")) {
            return "BT.709";
        }
    }
    
    // Default to BT.601 for compatibility
    return "BT.601";
}
```

## 6. Performance Monitoring

### Consistency Tracking

```javascript
function createConsistencyMonitor() {
    const analysisHistory = [];
    const MAX_HISTORY = 50;
    
    return {
        recordAnalysis(result) {
            const record = {
                timestamp: Date.now(),
                filename: result.name,
                scores: {
                    blur: result.blurScore,
                    composite: result.compositeScore?.overall || 0,
                    exposure: result.exposureAnalysis?.exposureScore || 0,
                    noise: result.noiseAnalysis?.noiseScore || 0,
                    descriptor: result.descriptorAnalysis?.photogrammetricScore || 0
                },
                processingTime: result.processingTime || 0,
                imageSize: result.file.size,
                dimensions: {
                    width: result.metadata?.width || 0,
                    height: result.metadata?.height || 0
                }
            };
            
            analysisHistory.push(record);
            
            // Keep only recent history
            if (analysisHistory.length > MAX_HISTORY) {
                analysisHistory.shift();
            }
            
            // Check for scoring drift
            this.checkScoringDrift();
            
            // Check for performance issues
            this.checkPerformanceIssues();
        },
        
        checkScoringDrift() {
            if (analysisHistory.length < 20) return;
            
            const recent = analysisHistory.slice(-10);
            const older = analysisHistory.slice(-20, -10);
            
            Object.keys(recent[0].scores).forEach(scoreType => {
                const avgRecent = recent.reduce((sum, r) => sum + r.scores[scoreType], 0) / 10;
                const avgOlder = older.reduce((sum, r) => sum + r.scores[scoreType], 0) / 10;
                const drift = Math.abs(avgRecent - avgOlder);
                
                if (drift > 10) {
                    console.warn(`📊 Scoring drift detected in ${scoreType}:`, 
                        `Recent avg: ${avgRecent.toFixed(1)}, Older avg: ${avgOlder.toFixed(1)}, Drift: ${drift.toFixed(1)}`);
                }
            });
        },
        
        checkPerformanceIssues() {
            if (analysisHistory.length < 5) return;
            
            const recent = analysisHistory.slice(-5);
            const avgProcessingTime = recent.reduce((sum, r) => sum + r.processingTime, 0) / 5;
            
            if (avgProcessingTime > 10000) { // 10 seconds
                console.warn("⚠️ Performance degradation detected:", 
                    `Average processing time: ${(avgProcessingTime / 1000).toFixed(1)}s`);
            }
            
            // Check for memory issues (large images taking disproportionately long)
            const timePerMB = recent.map(r => r.processingTime / (r.imageSize / 1024 / 1024));
            const avgTimePerMB = timePerMB.reduce((sum, t) => sum + t, 0) / timePerMB.length;
            
            if (avgTimePerMB > 2000) { // 2 seconds per MB
                console.warn("⚠️ Memory/processing efficiency issue detected:", 
                    `Average time per MB: ${(avgTimePerMB / 1000).toFixed(1)}s`);
            }
        },
        
        getStatistics() {
            if (analysisHistory.length === 0) return null;
            
            const stats = {
                totalAnalyses: analysisHistory.length,
                averageProcessingTime: analysisHistory.reduce((sum, r) => sum + r.processingTime, 0) / analysisHistory.length,
                scoreAverages: {},
                performanceTrends: this.getPerformanceTrends()
            };
            
            // Calculate score averages
            Object.keys(analysisHistory[0].scores).forEach(scoreType => {
                stats.scoreAverages[scoreType] = analysisHistory.reduce((sum, r) => sum + r.scores[scoreType], 0) / analysisHistory.length;
            });
            
            return stats;
        },
        
        getPerformanceTrends() {
            if (analysisHistory.length < 10) return null;
            
            const first5 = analysisHistory.slice(0, 5);
            const last5 = analysisHistory.slice(-5);
            
            const firstAvgTime = first5.reduce((sum, r) => sum + r.processingTime, 0) / 5;
            const lastAvgTime = last5.reduce((sum, r) => sum + r.processingTime, 0) / 5;
            
            return {
                processingTimeChange: lastAvgTime - firstAvgTime,
                trend: lastAvgTime > firstAvgTime * 1.2 ? "degrading" : 
                       lastAvgTime < firstAvgTime * 0.8 ? "improving" : "stable"
            };
        }
    };
}
```

## 7. Validation Test Suite

### Reference Image Testing

```javascript
function createValidationSuite() {
    return {
        // Define expected results for reference images
        referenceExpectations: {
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
        },
        
        async validateAnalysis(analyzer, testImages) {
            const results = {};
            const failures = [];
            
            for (const [testName, imageFile] of Object.entries(testImages)) {
                try {
                    console.log(`🧪 Testing ${testName}...`);
                    const result = await analyzer.analyzeImage(imageFile);
                    results[testName] = result;
                    
                    // Validate against expectations
                    const expectations = this.referenceExpectations[testName];
                    if (expectations) {
                        const validation = this.validateResult(result, expectations, testName);
                        if (!validation.passed) {
                            failures.push(validation);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Test ${testName} failed:`, error);
                    failures.push({ testName, error: error.message });
                }
            }
            
            // Summary
            console.log(`\n📊 Validation Summary:`);
            console.log(`  Total tests: ${Object.keys(testImages).length}`);
            console.log(`  Passed: ${Object.keys(testImages).length - failures.length}`);
            console.log(`  Failed: ${failures.length}`);
            
            if (failures.length > 0) {
                console.log(`\n❌ Failures:`);
                failures.forEach(failure => {
                    console.log(`  ${failure.testName}: ${failure.error || failure.details}`);
                });
            }
            
            return { results, failures, passed: failures.length === 0 };
        },
        
        validateResult(result, expectations, testName) {
            const failures = [];
            
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
                if (!expectations.recommendation.includes(recommendation)) {
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
            
            // Check noise metrics
            if (expectations.noiseScore) {
                const score = result.noiseAnalysis?.noiseScore || 0;
                const { min, max } = expectations.noiseScore;
                if (score < min || score > max) {
                    failures.push(`Noise score ${score} not in range [${min}, ${max}]`);
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
            
            return {
                testName,
                passed: failures.length === 0,
                details: failures.join('; ')
            };
        }
    };
}
```

## Usage Instructions

### 1. Enable Debug Mode
Add this to your analysis pipeline:

```javascript
// In imageAnalysis.ts
if (process.env.NODE_ENV === 'development') {
    const debugResults = {
        blur: debugBlurScore(imageData, blurScore, laplacianVariance),
        exposure: debugExposureAnalysis(imageData, exposureAnalysis),
        features: debugFeatureDetection(descriptorAnalysis, imageData),
        composite: debugCompositeScoring(compositeScore, {
            blur: blurScore,
            exposure: exposureAnalysis.exposureScore,
            noise: noiseAnalysis.noiseScore,
            technical: technicalScore,
            descriptor: descriptorAnalysis.photogrammetricScore
        })
    };
    
    console.log("🔍 Complete Debug Analysis:", debugResults);
}
```

### 2. Create Consistency Monitor
```javascript
// In App.tsx
const consistencyMonitor = createConsistencyMonitor();

// After each analysis
consistencyMonitor.recordAnalysis(analysis);

// Get statistics
const stats = consistencyMonitor.getStatistics();
console.log("📊 Analysis Statistics:", stats);
```

### 3. Run Validation Tests
```javascript
// Create test suite
const validator = createValidationSuite();

// Run validation with reference images
const testResults = await validator.validateAnalysis(analyzer, referenceImages);
```

These debugging tools will help identify and fix the critical issues in your image analysis pipeline, ensuring more accurate and reliable results for drone imagery quality assessment.