import { exifr } from 'exifr';

export interface CameraMetadata {
  camera: {
    make?: string;
    model?: string;
    lens?: string;
  };
  settings: {
    iso?: number;
    aperture?: number;
    shutterSpeed?: string;
    focalLength?: number;
    whiteBalance?: string;
    meteringMode?: string;
  };
  location: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  timestamp?: Date;
  colorSpace?: string;
  fileFormat: {
    format: string;
    compression?: string;
    bitDepth?: number;
    colorProfile?: string;
  };
}

export const extractMetadata = async (file: File): Promise<CameraMetadata> => {
  try {
    const exifData = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: false,
      icc: true,
      jfif: true
    });

    const metadata: CameraMetadata = {
      camera: {
        make: exifData?.Make || undefined,
        model: exifData?.Model || undefined,
        lens: exifData?.LensModel || exifData?.LensSpecification?.join(' ') || undefined,
      },
      settings: {
        iso: exifData?.ISO || exifData?.ISOSpeedRatings || undefined,
        aperture: exifData?.FNumber || exifData?.ApertureValue || undefined,
        shutterSpeed: formatShutterSpeed(exifData?.ExposureTime || exifData?.ShutterSpeedValue),
        focalLength: exifData?.FocalLength || undefined,
        whiteBalance: getWhiteBalanceString(exifData?.WhiteBalance),
        meteringMode: getMeteringModeString(exifData?.MeteringMode),
      },
      location: {
        latitude: exifData?.latitude || undefined,
        longitude: exifData?.longitude || undefined,
        altitude: exifData?.GPSAltitude || undefined,
      },
      timestamp: exifData?.DateTimeOriginal || exifData?.DateTime || undefined,
      colorSpace: getColorSpaceString(exifData?.ColorSpace),
      fileFormat: {
        format: getFileFormat(file.type),
        compression: exifData?.Compression ? getCompressionString(exifData.Compression) : undefined,
        bitDepth: exifData?.BitsPerSample || undefined,
        colorProfile: exifData?.ColorSpace ? getColorSpaceString(exifData.ColorSpace) : undefined,
      }
    };

    return metadata;
  } catch (error) {
    console.warn('Failed to extract metadata:', error);
    return {
      camera: {},
      settings: {},
      location: {},
      fileFormat: {
        format: getFileFormat(file.type),
      }
    };
  }
};

const formatShutterSpeed = (exposureTime?: number): string | undefined => {
  if (!exposureTime) return undefined;
  
  if (exposureTime >= 1) {
    return `${exposureTime}s`;
  } else {
    const fraction = Math.round(1 / exposureTime);
    return `1/${fraction}s`;
  }
};

const getWhiteBalanceString = (whiteBalance?: number): string | undefined => {
  if (whiteBalance === undefined) return undefined;
  
  const wbMap: { [key: number]: string } = {
    0: 'Auto',
    1: 'Manual',
    2: 'Auto',
    3: 'Auto',
    4: 'Auto',
    9: 'Fine Weather',
    10: 'Cloudy',
    11: 'Shade',
    12: 'Daylight Fluorescent',
    13: 'Day White Fluorescent',
    14: 'Cool White Fluorescent',
    15: 'White Fluorescent',
    17: 'Standard Light A',
    18: 'Standard Light B',
    19: 'Standard Light C',
    20: 'D55',
    21: 'D65',
    22: 'D75',
    23: 'D50',
    24: 'ISO Studio Tungsten'
  };
  
  return wbMap[whiteBalance] || `Custom (${whiteBalance})`;
};

const getMeteringModeString = (meteringMode?: number): string | undefined => {
  if (meteringMode === undefined) return undefined;
  
  const meteringMap: { [key: number]: string } = {
    0: 'Unknown',
    1: 'Average',
    2: 'Center-weighted Average',
    3: 'Spot',
    4: 'Multi-spot',
    5: 'Pattern',
    6: 'Partial',
    255: 'Other'
  };
  
  return meteringMap[meteringMode] || `Unknown (${meteringMode})`;
};

const getColorSpaceString = (colorSpace?: number): string | undefined => {
  if (colorSpace === undefined) return undefined;
  
  const colorSpaceMap: { [key: number]: string } = {
    1: 'sRGB',
    2: 'Adobe RGB',
    65535: 'Uncalibrated'
  };
  
  return colorSpaceMap[colorSpace] || `Unknown (${colorSpace})`;
};

const getCompressionString = (compression?: number): string | undefined => {
  if (compression === undefined) return undefined;
  
  const compressionMap: { [key: number]: string } = {
    1: 'Uncompressed',
    2: 'CCITT 1D',
    3: 'T4/Group 3 Fax',
    4: 'T6/Group 4 Fax',
    5: 'LZW',
    6: 'JPEG (old-style)',
    7: 'JPEG',
    8: 'Adobe Deflate',
    9: 'JBIG B&W',
    10: 'JBIG Color',
    99: 'JPEG',
    262: 'Kodak 262',
    32766: 'Next',
    32767: 'Sony ARW Compressed',
    32769: 'Packed RAW',
    32770: 'Samsung SRW Compressed',
    32771: 'CCIRLEW',
    32772: 'Samsung SRW Compressed 2',
    32773: 'PackBits',
    32809: 'Thunderscan',
    32867: 'Kodak KDC Compressed',
    32895: 'IT8CTPAD',
    32896: 'IT8LW',
    32897: 'IT8MP',
    32898: 'IT8BL',
    32908: 'PixarFilm',
    32909: 'PixarLog',
    32946: 'Deflate',
    32947: 'DCS',
    34661: 'JBIG',
    34676: 'SGILog',
    34677: 'SGILog24',
    34712: 'JPEG 2000',
    34713: 'Nikon NEF Compressed',
    34715: 'JBIG2 TIFF FX',
    34718: 'Microsoft Document Imaging (MDI) Binary Level Codec',
    34719: 'Microsoft Document Imaging (MDI) Progressive Transform Codec',
    34720: 'Microsoft Document Imaging (MDI) Vector',
    34892: 'Lossy JPEG',
    65000: 'Kodak DCR Compressed',
    65535: 'Pentax PEF Compressed'
  };
  
  return compressionMap[compression] || `Unknown (${compression})`;
};

const getFileFormat = (mimeType: string): string => {
  const formatMap: { [key: string]: string } = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
    'image/tiff': 'TIFF',
    'image/tif': 'TIFF',
    'image/webp': 'WebP',
    'image/bmp': 'BMP',
    'image/gif': 'GIF'
  };
  
  return formatMap[mimeType.toLowerCase()] || 'Unknown';
};

export const calculateTechnicalScore = (metadata: CameraMetadata): number => {
  let score = 50; // Base score
  
  // Reward presence of complete metadata
  if (metadata.camera.make && metadata.camera.model) score += 10;
  if (metadata.settings.iso && metadata.settings.aperture) score += 10;
  if (metadata.location.latitude && metadata.location.longitude) score += 5;
  if (metadata.timestamp) score += 5;
  
  // Evaluate camera settings quality
  if (metadata.settings.iso) {
    if (metadata.settings.iso <= 400) score += 10;
    else if (metadata.settings.iso <= 800) score += 5;
    else if (metadata.settings.iso <= 1600) score += 0;
    else score -= 5;
  }
  
  // Evaluate file format
  if (metadata.fileFormat.format === 'TIFF') score += 10;
  else if (metadata.fileFormat.format === 'PNG') score += 5;
  else if (metadata.fileFormat.format === 'JPEG') score += 0;
  else score -= 5;
  
  return Math.max(0, Math.min(100, score));
};