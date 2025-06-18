/**
 * Enhanced WebGL-based Image Processing Utilities
 * 
 * This module provides GPU-accelerated image processing operations using WebGL shaders
 * with context pooling, performance benchmarking, and precision optimization.
 */

import { CONFIG } from '../config';

interface WebGLContext {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  programs: Map<string, WebGLProgram>;
  lastUsed: number;
  cleanup: () => void;
}

interface PerformanceBenchmark {
  operation: string;
  cpuTime: number;
  gpuTime: number;
  imageSize: number;
  speedup: number;
  timestamp: number;
}

interface WebGLCapabilities {
  webgl: boolean;
  webgl2: boolean;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  extensions: string[];
  supportsHighPrecision: boolean;
  supportsFloatTextures: boolean;
}

// Global context pool
const contextPool: WebGLContext[] = [];
const { MAX_POOL_SIZE, CONTEXT_TIMEOUT } = CONFIG.WEBGL;

// Performance tracking
const performanceBenchmarks: PerformanceBenchmark[] = [];
const { MAX_BENCHMARKS } = CONFIG.WEBGL;

/**
 * Vertex shader source code (standard for image processing)
 */
const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

/**
 * Fragment shader for Laplacian edge detection (blur analysis) with precision selection
 */
const getLaplacianFragmentShader = (useHighPrecision: boolean = false) => `
  precision ${useHighPrecision ? 'highp' : 'mediump'} float;
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
    
    // Convert to grayscale and output absolute value
    float gray = dot(colorSum.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(abs(gray), abs(gray), abs(gray), 1.0);
  }
`;

/**
 * Fixed Fragment shader for Harris corner detection with proper visualization
 */
const getHarrisFragmentShader = (useHighPrecision: boolean = true) => `
  precision ${useHighPrecision ? 'highp' : 'mediump'} float;
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_k;
  varying vec2 v_texCoord;
  
  void main() {
    vec2 onePixel = vec2(1.0) / u_textureSize;
    
    // Convert to grayscale first
    vec3 center = texture2D(u_image, v_texCoord).rgb;
    float gray = dot(center, vec3(0.299, 0.587, 0.114));
    
    // Calculate gradients using Sobel operators
    float Ix = 0.0;
    float Iy = 0.0;
    
    // Sobel X kernel
    Ix += dot(texture2D(u_image, v_texCoord + vec2(-onePixel.x, -onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * -1.0;
    Ix += dot(texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114)) * -2.0;
    Ix += dot(texture2D(u_image, v_texCoord + vec2(-onePixel.x, onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * -1.0;
    Ix += dot(texture2D(u_image, v_texCoord + vec2(onePixel.x, -onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * 1.0;
    Ix += dot(texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114)) * 2.0;
    Ix += dot(texture2D(u_image, v_texCoord + vec2(onePixel.x, onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * 1.0;
    
    // Sobel Y kernel
    Iy += dot(texture2D(u_image, v_texCoord + vec2(-onePixel.x, -onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * -1.0;
    Iy += dot(texture2D(u_image, v_texCoord + vec2(0.0, -onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * -2.0;
    Iy += dot(texture2D(u_image, v_texCoord + vec2(onePixel.x, -onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * -1.0;
    Iy += dot(texture2D(u_image, v_texCoord + vec2(-onePixel.x, onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * 1.0;
    Iy += dot(texture2D(u_image, v_texCoord + vec2(0.0, onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * 2.0;
    Iy += dot(texture2D(u_image, v_texCoord + vec2(onePixel.x, onePixel.y)).rgb, vec3(0.299, 0.587, 0.114)) * 1.0;
    
    // Harris matrix elements
    float Ixx = Ix * Ix;
    float Iyy = Iy * Iy;
    float Ixy = Ix * Iy;
    
    // Harris response calculation
    float det = Ixx * Iyy - Ixy * Ixy;
    float trace = Ixx + Iyy;
    float response = det - u_k * trace * trace;
    
    // Normalize and visualize the response
    // Scale the response to make it visible (adjust multiplier as needed)
    float normalizedResponse = response * 1000.0;
    
    // Clamp to [0,1] range and apply some contrast enhancement
    float visualResponse = clamp(abs(normalizedResponse), 0.0, 1.0);
    
    // Create a heat map visualization
    vec3 color;
    if (visualResponse > 0.8) {
      // Strong corners - red
      color = vec3(1.0, 0.0, 0.0);
    } else if (visualResponse > 0.5) {
      // Medium corners - yellow
      color = vec3(1.0, 1.0, 0.0);
    } else if (visualResponse > 0.2) {
      // Weak corners - green
      color = vec3(0.0, 1.0, 0.0);
    } else {
      // No corners - blue to black gradient
      color = vec3(0.0, 0.0, visualResponse * 2.0);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Enhanced WebGL capabilities detection
 */
export const getWebGLCapabilities = (): WebGLCapabilities => {
  const capabilities: WebGLCapabilities = {
    webgl: false,
    webgl2: false,
    maxTextureSize: 0,
    maxViewportDims: [0, 0],
    extensions: [],
    supportsHighPrecision: false,
    supportsFloatTextures: false
  };

  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    const gl = gl2 || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      capabilities.webgl = true;
      capabilities.webgl2 = !!gl2;
      capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      capabilities.maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      
      // Check for high precision support
      const fragmentPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      capabilities.supportsHighPrecision = fragmentPrecision ? fragmentPrecision.precision > 0 : false;
      
      // Check for useful extensions
      const extensionNames = [
        'OES_texture_float',
        'OES_texture_half_float',
        'WEBGL_color_buffer_float',
        'EXT_color_buffer_float',
        'OES_standard_derivatives'
      ];
      
      capabilities.extensions = extensionNames.filter(ext => gl.getExtension(ext));
      capabilities.supportsFloatTextures = capabilities.extensions.includes('OES_texture_float');
    }
  } catch (error) {
    console.warn('Error checking WebGL capabilities:', error);
  }

  return capabilities;
};

/**
 * Creates and compiles a shader with error handling
 */
const createShader = (
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    console.error('Shader source:', source);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

/**
 * Creates a shader program from vertex and fragment shaders
 */
const createProgram = (
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram | null => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  // Clean up shaders (they're now part of the program)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

/**
 * Context pool management - gets or creates a WebGL context
 */
const getWebGLContext = (width: number, height: number): WebGLContext | null => {
  // Clean up expired contexts
  const now = Date.now();
  for (let i = contextPool.length - 1; i >= 0; i--) {
    if (now - contextPool[i].lastUsed > CONTEXT_TIMEOUT) {
      contextPool[i].cleanup();
      contextPool.splice(i, 1);
    }
  }

  // Try to reuse an existing context
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

  // If pool is full, reuse the oldest context
  if (contextPool.length > 0) {
    const oldestContext = contextPool.reduce((oldest, current) => 
      current.lastUsed < oldest.lastUsed ? current : oldest
    );
    
    // Resize if needed
    if (oldestContext.canvas.width !== width || oldestContext.canvas.height !== height) {
      oldestContext.canvas.width = width;
      oldestContext.canvas.height = height;
      oldestContext.gl.viewport(0, 0, width, height);
    }
    
    oldestContext.lastUsed = now;
    return oldestContext;
  }

  return null;
};

/**
 * Creates a new WebGL context
 */
const createWebGLContext = (width: number, height: number): WebGLContext | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return null;
    }

    gl.viewport(0, 0, width, height);

    const programs = new Map<string, WebGLProgram>();
    const lastUsed = Date.now();

    const cleanup = () => {
      programs.forEach(program => gl.deleteProgram(program));
      programs.clear();
    };

    return { gl, canvas, programs, lastUsed, cleanup };
  } catch (error) {
    console.error('Failed to create WebGL context:', error);
    return null;
  }
};

/**
 * Gets or creates a shader program for the context
 */
const getProgram = (
  context: WebGLContext,
  programKey: string,
  fragmentShaderSource: string
): WebGLProgram | null => {
  if (context.programs.has(programKey)) {
    return context.programs.get(programKey)!;
  }

  const program = createProgram(context.gl, VERTEX_SHADER_SOURCE, fragmentShaderSource);
  if (program) {
    context.programs.set(programKey, program);
  }

  return program;
};

/**
 * Performance benchmarking utility
 */
export const benchmarkOperation = async <T>(
  operation: string,
  cpuFunction: () => Promise<T> | T,
  gpuFunction: () => Promise<T> | T,
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
  const benchmark: PerformanceBenchmark = {
    operation,
    cpuTime,
    gpuTime,
    imageSize,
    speedup,
    timestamp: Date.now()
  };

  // Store benchmark (keep only recent ones)
  performanceBenchmarks.push(benchmark);
  if (performanceBenchmarks.length > MAX_BENCHMARKS) {
    performanceBenchmarks.shift();
  }

  // Log in development
  if (CONFIG.BENCHMARK.ENABLE_LOGGING) {
    console.log(`Performance Benchmark - ${operation}:`, {
      cpuTime: `${cpuTime.toFixed(2)}ms`,
      gpuTime: `${gpuTime.toFixed(2)}ms`,
      speedup: `${speedup.toFixed(2)}x`,
      imageSize: `${imageSize} pixels`
    });
  }

  // Return GPU result (assuming it's more accurate/faster)
  return { result: gpuResult, benchmark };
};

/**
 * Gets performance statistics
 */
export const getPerformanceStats = () => {
  if (performanceBenchmarks.length === 0) {
    return null;
  }

  const avgSpeedup = performanceBenchmarks.reduce((sum, b) => sum + b.speedup, 0) / performanceBenchmarks.length;
  const avgCpuTime = performanceBenchmarks.reduce((sum, b) => sum + b.cpuTime, 0) / performanceBenchmarks.length;
  const avgGpuTime = performanceBenchmarks.reduce((sum, b) => sum + b.gpuTime, 0) / performanceBenchmarks.length;

  return {
    totalBenchmarks: performanceBenchmarks.length,
    averageSpeedup: avgSpeedup,
    averageCpuTime: avgCpuTime,
    averageGpuTime: avgGpuTime,
    recentBenchmarks: performanceBenchmarks.slice(-10)
  };
};

/**
 * Sets up geometry for full-screen quad (reusable)
 */
const setupGeometry = (gl: WebGLRenderingContext | WebGL2RenderingContext, program: WebGLProgram) => {
  const positions = new Float32Array([
    -1, -1,  0, 0,
     1, -1,  1, 0,
    -1,  1,  0, 1,
    -1,  1,  0, 1,
     1, -1,  1, 0,
     1,  1,  1, 1,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);

  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);

  return buffer;
};

/**
 * Creates texture from ImageData (optimized)
 */
const createTextureFromImageData = (
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  imageData: ImageData
): WebGLTexture | null => {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

  // Optimized texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
};

/**
 * Enhanced WebGL-accelerated Laplacian variance calculation for blur detection
 */
export const calculateBlurScoreWebGL = (imageData: ImageData): Promise<number> => {
  return new Promise((resolve, reject) => {
    const capabilities = getWebGLCapabilities();
    if (!capabilities.webgl) {
      reject(new Error('WebGL not supported'));
      return;
    }

    const context = getWebGLContext(imageData.width, imageData.height);
    if (!context) {
      reject(new Error('Failed to get WebGL context'));
      return;
    }

    const { gl } = context;

    try {
      const useHighPrecision = capabilities.supportsHighPrecision;
      const fragmentShader = getLaplacianFragmentShader(useHighPrecision);
      const program = getProgram(context, 'laplacian', fragmentShader);
      
      if (!program) throw new Error('Failed to create shader program');

      // Set up geometry
      const buffer = setupGeometry(gl, program);
      if (!buffer) throw new Error('Failed to setup geometry');

      // Create texture from image data
      const texture = createTextureFromImageData(gl, imageData);
      if (!texture) throw new Error('Failed to create texture');

      // Use the program
      gl.useProgram(program);

      // Set uniforms
      const imageLocation = gl.getUniformLocation(program, 'u_image');
      const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');

      gl.uniform1i(imageLocation, 0);
      gl.uniform2f(textureSizeLocation, imageData.width, imageData.height);

      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Render
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Read back the result
      const pixels = new Uint8Array(imageData.width * imageData.height * 4);
      gl.readPixels(0, 0, imageData.width, imageData.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // Calculate variance from the processed pixels
      let sum = 0;
      let sumSquares = 0;
      const pixelCount = imageData.width * imageData.height;

      for (let i = 0; i < pixels.length; i += 4) {
        const value = pixels[i]; // Red channel (all channels are the same for grayscale)
        sum += value;
        sumSquares += value * value;
      }

      const mean = sum / pixelCount;
      const variance = (sumSquares / pixelCount) - (mean * mean);

      // Normalize to 0-100 scale (similar to CPU version)
      const normalizedScore = Math.min(100, Math.max(0, Math.log(variance + 1) * 15));

      // Cleanup (but keep context in pool)
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);

      resolve(Math.round(normalizedScore));
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Enhanced WebGL-accelerated Harris corner detection
 */
export const detectCornersWebGL = (
  imageData: ImageData,
  k: number = 0.04
): Promise<Float32Array> => {
  return new Promise((resolve, reject) => {
    const capabilities = getWebGLCapabilities();
    if (!capabilities.webgl) {
      reject(new Error('WebGL not supported'));
      return;
    }

    const context = getWebGLContext(imageData.width, imageData.height);
    if (!context) {
      reject(new Error('Failed to get WebGL context'));
      return;
    }

    const { gl } = context;

    try {
      const useHighPrecision = capabilities.supportsHighPrecision;
      const fragmentShader = getHarrisFragmentShader(useHighPrecision);
      const program = getProgram(context, 'harris', fragmentShader);
      
      if (!program) throw new Error('Failed to create shader program');

      // Set up geometry
      const buffer = setupGeometry(gl, program);
      if (!buffer) throw new Error('Failed to setup geometry');

      // Create texture from image data
      const texture = createTextureFromImageData(gl, imageData);
      if (!texture) throw new Error('Failed to create texture');

      // Use the program
      gl.useProgram(program);

      // Set uniforms
      const imageLocation = gl.getUniformLocation(program, 'u_image');
      const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
      const kLocation = gl.getUniformLocation(program, 'u_k');

      gl.uniform1i(imageLocation, 0);
      gl.uniform2f(textureSizeLocation, imageData.width, imageData.height);
      gl.uniform1f(kLocation, k);

      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Render
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Read back the result
      const pixels = new Uint8Array(imageData.width * imageData.height * 4);
      gl.readPixels(0, 0, imageData.width, imageData.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // Convert to Float32Array (Harris response values)
      const responses = new Float32Array(imageData.width * imageData.height);
      for (let i = 0; i < responses.length; i++) {
        // Normalize from 0-255 to appropriate range
        responses[i] = (pixels[i * 4] / 255.0) * 2.0 - 1.0;
      }

      // Cleanup (but keep context in pool)
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);

      resolve(responses);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Debug visualization utilities
 */
export const generateDebugVisualization = async (
  imageData: ImageData,
  operation: 'laplacian' | 'harris'
): Promise<ImageData | null> => {
  const capabilities = getWebGLCapabilities();
  if (!capabilities.webgl) return null;

  const context = getWebGLContext(imageData.width, imageData.height);
  if (!context) return null;

  const { gl } = context;

  try {
    let fragmentShader: string;
    let programKey: string;

    switch (operation) {
      case 'laplacian':
        fragmentShader = getLaplacianFragmentShader(capabilities.supportsHighPrecision);
        programKey = 'laplacian_debug';
        break;
      case 'harris':
        fragmentShader = getHarrisFragmentShader(capabilities.supportsHighPrecision);
        programKey = 'harris_debug';
        break;
      default:
        return null;
    }

    const program = getProgram(context, programKey, fragmentShader);
    if (!program) return null;

    // Set up geometry
    const buffer = setupGeometry(gl, program);
    if (!buffer) return null;

    // Create texture from image data
    const texture = createTextureFromImageData(gl, imageData);
    if (!texture) return null;

    // Clear the canvas with black background
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use the program
    gl.useProgram(program);

    // Set uniforms
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');

    gl.uniform1i(imageLocation, 0);
    gl.uniform2f(textureSizeLocation, imageData.width, imageData.height);

    if (operation === 'harris') {
      const kLocation = gl.getUniformLocation(program, 'u_k');
      gl.uniform1f(kLocation, 0.04);
    }

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Render
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Read back the result
    const pixels = new Uint8Array(imageData.width * imageData.height * 4);
    gl.readPixels(0, 0, imageData.width, imageData.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Create new ImageData from the result
    const resultImageData = new ImageData(
      new Uint8ClampedArray(pixels),
      imageData.width,
      imageData.height
    );

    // Cleanup
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);

    return resultImageData;
  } catch (error) {
    console.error('Debug visualization failed:', error);
    return null;
  }
};

/**
 * Enhanced utility function to determine if WebGL should be used
 */
export const shouldUseWebGL = (imageData: ImageData): boolean => {
  const capabilities = getWebGLCapabilities();
  
  if (!capabilities.webgl) return false;
  
  // Use performance history to make smarter decisions
  const stats = getPerformanceStats();
  if (stats && stats.averageSpeedup < 1.5) {
    // If GPU isn't significantly faster, don't use it
    return false;
  }
  
  // Use WebGL for larger images where the performance benefit is significant
  const pixelCount = imageData.width * imageData.height;
  const minPixelsForWebGL = stats && stats.averageSpeedup > 3 ? 50000 : 100000;
  
  // Check if image fits within WebGL texture size limits
  const maxSize = capabilities.maxTextureSize;
  const fitsInTexture = imageData.width <= maxSize && imageData.height <= maxSize;
  
  return pixelCount >= minPixelsForWebGL && fitsInTexture;
};

/**
 * Cleanup function for the entire WebGL system
 */
export const cleanupWebGL = () => {
  contextPool.forEach(context => context.cleanup());
  contextPool.length = 0;
  performanceBenchmarks.length = 0;
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupWebGL);
}