# Development Setup Guide

## Performance Analysis & Debugging Setup

This guide covers the comprehensive development environment setup for performance analysis, debugging, and optimization of the Drone Image Quality Analyzer.

## Prerequisites

- Node.js 18.0 or higher
- Chrome/Chromium browser (recommended for WebGL debugging)
- VS Code (recommended IDE with provided configuration)

## Development Environment Configuration

### 1. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Development flags
NODE_ENV=development
VITE_DEV_PERFORMANCE=true
VITE_DEV_DEBUG=true
VITE_WEBGL_DEBUG=true

# Performance monitoring
VITE_ENABLE_PROFILING=true
VITE_ENABLE_MEMORY_TRACKING=true
VITE_LOG_LEVEL=debug

# WebGL settings
VITE_WEBGL_PRECISION=high
VITE_WEBGL_FALLBACK=true
```

### 2. Browser Setup for Performance Analysis

#### Chrome DevTools Configuration

1. **Enable Performance Monitoring**:
   - Open Chrome DevTools (F12)
   - Go to Settings (⚙️) → Experiments
   - Enable "Performance monitor" and "Timeline: V8 Runtime Call Stats"

2. **Memory Profiling**:
   - Performance tab → Memory checkbox
   - Enable "Collect garbage" before recordings
   - Use Heap Snapshots for memory leak detection

3. **WebGL Debugging**:
   - Install "WebGL Inspector" extension
   - Enable "Break on WebGL errors" in console
   - Use `chrome://gpu/` for GPU information

#### Launch Chrome with Debug Flags

```bash
# Performance debugging
chrome --enable-precise-memory-info --enable-gpu-benchmarking --enable-logging --v=1

# WebGL debugging  
chrome --enable-webgl-developer-extensions --enable-webgl-draft-extensions --enable-unsafe-webgl
```

### 3. VS Code Configuration

The provided `.vscode/` configuration includes:

- **settings.json**: TypeScript, formatting, and debugging settings
- **launch.json**: Chrome debugging profiles for performance and WebGL analysis

#### Recommended Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-chrome-debug",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## Development Scripts

### Available Commands

```bash
# Standard development
npm run dev                    # Start development server
npm run dev:debug             # Start with enhanced debugging
npm run dev:performance       # Start with performance monitoring

# Building and analysis
npm run build                 # Production build
npm run build:analyze         # Build with bundle analysis
npm run analyze:bundle        # Analyze bundle size

# Testing and profiling
npm run test:performance      # Run performance tests
npm run lint                  # Code linting
```

### Performance Monitoring Commands

```bash
# Start with performance profiling
npm run dev:performance

# Access development tools in browser
# - Bottom-left: Development Tools Panel
# - Bottom-right: Performance Monitor
```

## Development Tools Usage

### 1. Performance Monitor Panel

Access via the purple settings icon (bottom-left of the app):

**Performance Tab**:
- Real-time performance metrics
- Operation breakdown by duration
- Performance recommendations
- Export performance reports

**Debug Tab**:
- Algorithm performance analysis
- WebGL operation tracking
- State snapshot management
- Debug data export

**WebGL Tab**:
- WebGL capabilities detection
- Hardware limits information
- Extension availability
- GPU performance statistics

**Memory Tab**:
- Real-time memory usage
- Memory growth tracking
- Peak memory analysis
- Optimization recommendations

### 2. Browser Console Commands

The development environment exposes several console utilities:

```javascript
// Performance analysis
debugUtils.analyzePerformance()    // Analyze performance bottlenecks
debugUtils.exportData()            // Export all debug data
debugUtils.clear()                 // Clear debug data

// WebGL debugging
window.debugUtils.getWebGLInfo()   // Get WebGL debug information
window.debugUtils.exportDebugData() // Export comprehensive debug data

// Memory monitoring
performance.memory                 // Browser memory information
```

### 3. Performance Measurement Integration

The development environment automatically measures:

- **Image Processing Steps**: Individual algorithm performance
- **Memory Usage**: Heap size tracking during processing
- **WebGL Operations**: GPU operation timing and success rates
- **User Interactions**: UI responsiveness metrics

Example integration in your code:

```typescript
import { measurePerformance, debugUtils } from './utils/devSettings';

// Measure async operations
const { result, duration } = await measurePerformance.async(
  'image_analysis',
  () => analyzeImage(file),
  { fileName: file.name, fileSize: file.size }
);

// Log processing steps
debugUtils.logImageStep(
  imageId,
  'blur_detection',
  { width: 800, height: 600 },
  duration,
  result,
  { algorithm: 'laplacian_variance' }
);
```

## Performance Analysis Workflow

### 1. Baseline Measurement

1. Start the development server: `npm run dev:performance`
2. Open Chrome with performance flags
3. Load a representative image batch (10-50 images)
4. Record baseline metrics in the Performance Monitor

### 2. Optimization Testing

1. Make code changes
2. Test with the same image batch
3. Compare metrics in the Development Tools Panel
4. Export performance reports for detailed analysis

### 3. Memory Leak Detection

1. Process multiple batches without refreshing
2. Monitor memory growth in the Memory tab
3. Use Chrome DevTools Heap Snapshots for detailed analysis
4. Check for unreleased object references

### 4. WebGL Performance Analysis

1. Enable WebGL debugging in the WebGL tab
2. Monitor shader compilation success rates
3. Check GPU vs CPU performance ratios
4. Verify fallback behavior on different hardware

## Debugging Specific Issues

### Image Processing Performance

```typescript
// Enable detailed algorithm debugging
debugUtils.analyzeAlgorithm(
  'blur_detection',
  imagePixelCount,
  processingDuration,
  { algorithm: 'laplacian', useWebGL: true }
);
```

### Memory Issues

```typescript
// Take memory snapshots at key points
measurePerformance.memory('before_batch', 0);
// ... process images
measurePerformance.memory('after_batch', imageCount);
```

### WebGL Problems

```typescript
// Log WebGL operations
debugUtils.logWebGL(
  'shader_compilation',
  { shaderType: 'fragment', shaderName: 'laplacian' },
  success,
  errorMessage
);
```

## Performance Benchmarking

### Automated Benchmarking

The system automatically benchmarks CPU vs GPU performance:

```typescript
import { usePerformanceBenchmark } from './hooks/usePerformanceBenchmark';

const { runBenchmark, getRecommendation } = usePerformanceBenchmark();

// Benchmark blur detection
const { result, benchmark } = await runBenchmark(
  'blur_detection',
  () => calculateBlurScoreCPU(imageData),
  () => calculateBlurScoreWebGL(imageData),
  imageData.width * imageData.height
);
```

### Manual Performance Testing

1. **Load Testing**: Process batches of 100+ images
2. **Memory Stress Testing**: Process multiple batches without refresh
3. **Hardware Compatibility**: Test on different GPU configurations
4. **Algorithm Comparison**: Compare CPU vs WebGL implementations

## Troubleshooting

### Common Issues

1. **WebGL Context Loss**:
   - Check browser GPU process stability
   - Monitor context pool usage
   - Verify proper cleanup

2. **Memory Leaks**:
   - Use Heap Snapshots to identify retained objects
   - Check for unreleased canvas contexts
   - Verify proper cleanup of object URLs

3. **Performance Degradation**:
   - Monitor algorithm efficiency metrics
   - Check for memory pressure
   - Verify WebGL vs CPU decision logic

### Debug Information Export

Export comprehensive debug data for analysis:

```javascript
// In browser console
const debugData = debugUtils.exportData();
console.save(debugData, 'debug-report.json');
```

## Production Considerations

### Performance Monitoring in Production

While development tools are disabled in production, consider:

1. **Error Tracking**: Implement production error logging
2. **Performance Metrics**: Basic timing for critical operations
3. **User Feedback**: Collect performance feedback from users
4. **Graceful Degradation**: Ensure fallbacks work reliably

### Build Optimization

```bash
# Analyze production bundle
npm run build:analyze

# Check bundle size impact
npm run analyze:bundle
```

This development setup provides comprehensive tools for analyzing, debugging, and optimizing the Drone Image Quality Analyzer's performance across different hardware configurations and use cases.