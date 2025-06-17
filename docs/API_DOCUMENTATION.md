# API Documentation

## Core Analysis Functions

### `analyzeImage(file: File): Promise<ImageAnalysis>`

Performs comprehensive image quality analysis using multiple computer vision algorithms.

**Parameters:**
- `file` (File): Image file to analyze (JPEG, PNG, TIFF supported)

**Returns:**
Promise resolving to `ImageAnalysis` object containing:

```typescript
interface ImageAnalysis {
  id: string;                           // Unique identifier
  file: File;                          // Original file reference
  name: string;                        // Filename
  size: number;                        // File size in bytes
  blurScore: number;                   // Blur quality (0-100)
  quality: QualityLevel;               // Overall quality category
  thumbnail: string;                   // Base64 thumbnail
  processed: boolean;                  // Processing completion status
  error?: string;                      // Error message if failed
  exposureAnalysis?: ExposureAnalysis; // Detailed exposure metrics
  noiseAnalysis?: NoiseAnalysis;       // Noise and artifact analysis
  metadata?: CameraMetadata;           // EXIF and camera data
  compositeScore?: CompositeQualityScore; // Weighted quality scores
  descriptorAnalysis?: DescriptorAnalysis; // Feature detection results
}
```

**Example Usage:**
```typescript
const file = document.getElementById('fileInput').files[0];
const analysis = await analyzeImage(file);

console.log(`Image: ${analysis.name}`);
console.log(`Overall Score: ${analysis.compositeScore?.overall}`);
console.log(`Recommendation: ${analysis.compositeScore?.recommendation}`);
```

---

### `calculateBlurScore(imageData: ImageData): number`

Calculates image sharpness using Laplacian variance algorithm.

**Parameters:**
- `imageData` (ImageData): Canvas ImageData object

**Returns:**
- `number`: Blur score (0-100, higher = sharper)

**Algorithm Details:**
- Uses Laplacian edge detection kernel
- Calculates variance of edge responses
- Normalizes to 0-100 scale using logarithmic scaling

**Example:**
```typescript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// ... load image into canvas
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const blurScore = calculateBlurScore(imageData);
```

---

### `analyzeEnhancedExposure(imageData: ImageData): ExposureAnalysis`

Performs advanced exposure analysis using YCrCb color space and perceptual metrics.

**Parameters:**
- `imageData` (ImageData): Canvas ImageData object

**Returns:**
```typescript
interface ExposureAnalysis {
  overexposurePercentage: number;      // % of overexposed pixels
  underexposurePercentage: number;     // % of underexposed pixels
  dynamicRange: number;                // Tonal range (0-255)
  averageBrightness: number;           // Mean luminance
  contrastRatio: number;               // Max/min luminance ratio
  histogramBalance: HistogramBalance;   // Exposure distribution
  exposureScore: number;               // Overall exposure quality (0-100)
  localContrast: number;               // Spatial contrast metric
  highlightRecovery: number;           // Recoverable highlight detail (%)
  shadowDetail: number;                // Shadow detail preservation (%)
  colorBalance: ColorBalance;          // YCrCb channel analysis
  perceptualExposureScore: number;     // Human visual system score
  spatialExposureVariance: number;     // Regional exposure consistency
}
```

**Advanced Features:**
- YCrCb color space conversion for perceptual accuracy
- Local contrast analysis using sliding windows
- Highlight recovery assessment
- Shadow detail preservation measurement
- Bias correction using gray-world assumption

---

### `analyzeDescriptors(imageData: ImageData): DescriptorAnalysis`

Performs feature descriptor analysis for photogrammetric quality assessment.

**Parameters:**
- `imageData` (ImageData): Canvas ImageData object

**Returns:**
```typescript
interface DescriptorAnalysis {
  keypointCount: number;               // Total detected features
  keypointDensity: number;             // Features per 1000 pixels
  keypointDistribution: {
    uniformity: number;                // Distribution evenness (0-100)
    coverage: number;                  // Image coverage percentage
    clustering: number;                // Feature clustering metric
  };
  featureStrength: {
    average: number;                   // Mean feature response
    median: number;                    // Median feature response
    standardDeviation: number;         // Response consistency
  };
  descriptorQuality: {
    distinctiveness: number;           // Feature uniqueness (0-100)
    repeatability: number;             // Detection consistency (0-100)
    matchability: number;              // Predicted matching success (0-100)
  };
  photogrammetricScore: number;        // Overall descriptor quality (0-100)
  reconstructionSuitability: string;   // Quality category
  featureTypes: {
    corners: number;                   // Corner feature count
    edges: number;                     // Edge feature count
    blobs: number;                     // Blob feature count
    textured: number;                  // Textured region count
  };
  scaleInvariance: number;             // Scale robustness (0-100)
  rotationInvariance: number;          // Rotation robustness (0-100)
}
```

**Feature Detection Algorithms:**
- Harris corner detection
- FAST corner detection
- Edge-based keypoints (Sobel)
- Blob detection (LoG approximation)

---

### `analyzeNoise(imageData: ImageData): NoiseAnalysis`

Analyzes image noise and compression artifacts.

**Parameters:**
- `imageData` (ImageData): Canvas ImageData object

**Returns:**
```typescript
interface NoiseAnalysis {
  noiseLevel: number;                  // Overall noise metric (0-100)
  snrRatio: number;                    // Signal-to-noise ratio
  compressionArtifacts: number;        // JPEG blocking artifacts
  chromaticAberration: number;         // Color fringing metric
  vignetting: number;                  // Radial brightness falloff (%)
  overallArtifactScore: number;        // Combined artifact metric
  noiseScore: number;                  // Quality score (0-100, higher = better)
}
```

**Detection Methods:**
- Local standard deviation for noise estimation
- Block boundary analysis for compression artifacts
- Color channel misalignment for chromatic aberration
- Radial brightness analysis for vignetting

---

## Composite Scoring

### `calculateCompositeScore(...scores): CompositeQualityScore`

Calculates weighted composite quality score optimized for photogrammetric applications.

**Parameters:**
- `blurScore` (number): Sharpness score (0-100)
- `exposureScore` (number): Exposure quality (0-100)
- `noiseScore` (number): Noise quality (0-100)
- `technicalScore` (number): Metadata quality (0-100)
- `descriptorScore` (number): Feature quality (0-100)

**Returns:**
```typescript
interface CompositeQualityScore {
  blur: number;                        // Input blur score
  exposure: number;                    // Input exposure score
  noise: number;                       // Input noise score
  technical: number;                   // Input technical score
  descriptor: number;                  // Input descriptor score
  overall: number;                     // Weighted composite (0-100)
  recommendation: QualityRecommendation; // Quality category
}
```

**Weighting System:**
```typescript
const weights = {
  blur: 0.30,        // 30% - Sharpness quality
  exposure: 0.25,    // 25% - Lighting consistency
  noise: 0.20,       // 20% - Artifact levels
  technical: 0.10,   // 10% - Metadata quality
  descriptor: 0.15   // 15% - Feature matching capability
};
```

**Quality Categories:**
- `excellent` (85-100): Optimal for high-precision photogrammetry
- `good` (70-84): Suitable for standard mapping workflows
- `acceptable` (55-69): Usable with additional processing
- `poor` (40-54): Marginal quality, consider retaking
- `unsuitable` (0-39): Not recommended for photogrammetric use

---

## Metadata Extraction

### `extractMetadata(file: File): Promise<CameraMetadata>`

Extracts comprehensive metadata from image files using EXIFR library.

**Parameters:**
- `file` (File): Image file with EXIF data

**Returns:**
```typescript
interface CameraMetadata {
  camera: {
    make?: string;                     // Camera manufacturer
    model?: string;                    // Camera model
    lens?: string;                     // Lens information
  };
  settings: {
    iso?: number;                      // ISO sensitivity
    aperture?: number;                 // F-stop value
    shutterSpeed?: string;             // Exposure time
    focalLength?: number;              // Lens focal length (mm)
    whiteBalance?: string;             // White balance setting
    meteringMode?: string;             // Exposure metering mode
  };
  location: {
    latitude?: number;                 // GPS latitude
    longitude?: number;                // GPS longitude
    altitude?: number;                 // GPS altitude (m)
  };
  timestamp?: Date;                    // Capture timestamp
  colorSpace?: string;                 // Color space (sRGB, Adobe RGB)
  fileFormat: {
    format: string;                    // File format (JPEG, PNG, TIFF)
    compression?: string;              // Compression method
    bitDepth?: number;                 // Color bit depth
    colorProfile?: string;             // ICC color profile
  };
}
```

---

## Export Functions

### `exportToCSV(analyses: ImageAnalysis[], threshold: number): void`

Exports analysis results to CSV format for integration with external tools.

**Parameters:**
- `analyses` (ImageAnalysis[]): Array of analysis results
- `threshold` (number): Quality threshold for recommendations

**CSV Columns:**
- Filename, Composite Score, Blur Score, Exposure Score
- Noise Score, Technical Score, Descriptor Score
- Keypoint Count, Keypoint Density, Feature Distribution
- Photogrammetric Suitability, Recommendation
- File Size, Camera Make/Model, ISO, Aperture
- Shutter Speed, Focal Length, Processing Status

**Example:**
```typescript
const analyses = await Promise.all(files.map(analyzeImage));
exportToCSV(analyses, 70); // Export with threshold of 70
```

---

### `generateReport(analyses: ImageAnalysis[], threshold: number): Report`

Generates comprehensive technical report with statistics and recommendations.

**Parameters:**
- `analyses` (ImageAnalysis[]): Analysis results
- `threshold` (number): Quality threshold

**Returns:**
```typescript
interface Report {
  stats: {
    totalImages: number;
    excellentCount: number;
    goodCount: number;
    acceptableCount: number;
    poorCount: number;
    unsuitableCount: number;
    averageBlurScore: number;
    averageCompositeScore: number;
    averageDescriptorScore: number;
    averageKeypointCount: number;
    recommendedForReconstruction: number;
  };
  recommendations: Array<{
    filename: string;
    blurScore: number;
    compositeScore: number;
    descriptorScore: number;
    keypointCount: number;
    quality: string;
    recommended: boolean;
    fileSize: string;
    exposureScore: number;
    noiseScore: number;
    photogrammetricSuitability: string;
    cameraInfo: string;
  }>;
}
```

---

## Utility Functions

### `createThumbnail(file: File): Promise<string>`

Generates base64-encoded thumbnail for image preview.

**Parameters:**
- `file` (File): Image file

**Returns:**
- `Promise<string>`: Base64 data URL

**Configuration:**
- Maximum size: 150x150 pixels
- Format: JPEG with 80% quality
- Maintains aspect ratio

---

### `getQualityLevel(compositeScore: number): QualityLevel`

Converts numeric score to quality category.

**Parameters:**
- `compositeScore` (number): Composite quality score (0-100)

**Returns:**
- `QualityLevel`: 'excellent' | 'good' | 'poor' | 'unsuitable'

---

## Error Handling

### Error Types

```typescript
interface AnalysisError {
  code: string;                        // Error code
  message: string;                     // Human-readable message
  details?: any;                       // Additional error details
}
```

**Common Error Codes:**
- `IMG_001`: Failed to load image
- `IMG_002`: Canvas processing error
- `META_001`: EXIF extraction failed
- `PROC_001`: Analysis timeout
- `EXP_001`: Export generation failed

### Error Handling Example

```typescript
try {
  const analysis = await analyzeImage(file);
  console.log('Analysis successful:', analysis);
} catch (error) {
  if (error.code === 'IMG_001') {
    console.error('Invalid image file:', error.message);
  } else {
    console.error('Analysis failed:', error);
  }
}
```

---

## Performance Considerations

### Processing Limits
- **Maximum file size**: 100MB per image
- **Recommended batch size**: 50 images for 8GB RAM
- **Processing time**: ~100ms per megapixel
- **Memory usage**: ~8MB per megapixel during processing

### Optimization Tips
- Images automatically resized to 800px max dimension for analysis
- Use modern browsers (Chrome/Firefox) for best performance
- Enable hardware acceleration in browser settings
- Process images in batches to manage memory usage

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core Analysis | 90+ | 88+ | 14+ | 90+ |
| Canvas Processing | ✓ | ✓ | ✓ | ✓ |
| File API | ✓ | ✓ | ✓ | ✓ |
| WebGL Acceleration | ✓ | ✓ | ✓ | ✓ |
| Large File Support | ✓ | ✓ | Limited | ✓ |

---

**API Version**: 2.0.0  
**Last Updated**: 2025  
**Compatibility**: ES2020+, WebGL 2.0