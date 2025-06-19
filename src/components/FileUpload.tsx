import React, { useCallback, useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, X, FolderOpen, FileImage } from 'lucide-react';
import { FileValidationResult, FileValidationError } from '../types';
import { getFileSizeLimit } from '../utils/config';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  validation: FileValidationResult;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): FileValidationResult => {
    const errors: FileValidationError[] = [];
    const warnings: string[] = [];
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
    const maxSize = getFileSizeLimit(file.type);

    // Check file type
    if (!validTypes.includes(file.type.toLowerCase())) {
      errors.push({
        type: 'format',
        message: 'Invalid file type. Please use JPG, PNG, or TIFF files.'
      });
    }

    // Check file size with format-specific limits
    if (file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      errors.push({
        type: 'size',
        message: `File too large. Maximum size for ${file.type} is ${sizeMB}MB.`
      });
    }

    // Add warnings for very large TIFF files
    if (file.type.toLowerCase().includes('tiff') && file.size > 100 * 1024 * 1024) {
      warnings.push('Large TIFF files will be down-sampled for analysis to ensure performance.');
    }

    // Basic corruption check (very basic - just check if file has content)
    if (file.size === 0) {
      errors.push({
        type: 'corruption',
        message: 'File appears to be empty or corrupted.'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const createFilePreview = async (file: File): Promise<FilePreview> => {
    const id = Math.random().toString(36).substr(2, 9);
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      return { file, id, validation };
    }

    try {
      const preview = await createThumbnail(file);
      return { file, id, preview, validation };
    } catch (err) {
      console.warn('Failed to create thumbnail for', file.name, err);
      // Add warning but don't mark as invalid
      validation.warnings.push('Could not generate preview thumbnail');
      return { file, id, validation };
    }
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type first
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      // Create image element
      const img = new Image();
      let objectUrl: string | null = null;
      
      // Set up timeout to prevent hanging
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Thumbnail creation timeout'));
      }, 15000); // 15 second timeout

      const cleanup = () => {
        clearTimeout(timeout);
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            cleanup();
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate dimensions
          const size = 80;
          const ratio = Math.min(size / img.width, size / img.height);
          const newWidth = Math.floor(img.width * ratio);
          const newHeight = Math.floor(img.height * ratio);
          
          // Set canvas size
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Clear canvas with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, newWidth, newHeight);
          
          // Draw image
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Convert to data URL
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                cleanup();
                resolve(reader.result as string);
              };
              reader.onerror = () => {
                cleanup();
                reject(new Error('Failed to read blob'));
              };
              reader.readAsDataURL(blob);
            } else {
              cleanup();
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.8);
          
        } catch (drawError) {
          cleanup();
          reject(new Error('Failed to draw image on canvas'));
        }
      };
      
      img.onerror = () => {
        cleanup();
        reject(new Error('Failed to load image'));
      };

      // Create object URL and load image
      try {
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (urlError) {
        cleanup();
        reject(new Error('Failed to create object URL'));
      }
    });
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const newPreviews: FilePreview[] = [];

    for (const file of fileArray) {
      const preview = await createFilePreview(file);
      newPreviews.push(preview);
    }

    setSelectedFiles(prev => [...prev, ...newPreviews]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isProcessing) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles, isProcessing]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const startProcessing = useCallback(() => {
    const validFiles = selectedFiles
      .filter(fp => fp.validation.isValid)
      .map(fp => fp.file);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      setSelectedFiles([]);
    }
  }, [selectedFiles, onFilesSelected]);

  const validFileCount = selectedFiles.filter(fp => fp.validation.isValid).length;
  const errorFileCount = selectedFiles.filter(fp => !fp.validation.isValid).length;
  const warningFileCount = selectedFiles.filter(fp => fp.validation.warnings.length > 0).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Main Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg transition-all duration-200 ${
          isProcessing 
            ? 'border-gray-200 bg-gray-50' 
            : isDragOver
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
        } ${selectedFiles.length === 0 ? 'p-16' : 'p-8'}`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isProcessing 
              ? 'bg-gray-100' 
              : isDragOver
              ? 'bg-blue-200'
              : 'bg-blue-100'
          }`}>
            {isProcessing ? (
              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className={`w-8 h-8 ${isDragOver ? 'text-blue-700' : 'text-blue-600'}`} />
            )}
          </div>
          
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {isProcessing 
                ? 'Processing Images...' 
                : selectedFiles.length > 0
                ? 'Add More Images or Start Processing'
                : 'Upload Drone Photos'
              }
            </h3>
            <p className="text-gray-600 max-w-md">
              {isProcessing 
                ? 'Please wait while we analyze your images for quality assessment'
                : selectedFiles.length > 0
                ? 'Drag and drop more images here, or click to browse additional files'
                : 'Drag and drop your images here, or click to browse. Supports batch processing of multiple images.'
              }
            </p>
          </div>

          {!isProcessing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FolderOpen className="w-5 h-5 mr-2" />
                Browse Files
              </label>
            </>
          )}

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>JPG, PNG, TIFF</span>
            <span>•</span>
            <span>Smart size limits</span>
            <span>•</span>
            <span>Batch processing</span>
          </div>
        </div>
      </div>

      {/* File Preview Grid */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h4 className="font-medium text-gray-900">
                Selected Files ({selectedFiles.length})
              </h4>
              {validFileCount > 0 && (
                <span className="text-sm text-green-600">
                  {validFileCount} ready to process
                </span>
              )}
              {errorFileCount > 0 && (
                <span className="text-sm text-red-600">
                  {errorFileCount} with errors
                </span>
              )}
              {warningFileCount > 0 && (
                <span className="text-sm text-yellow-600">
                  {warningFileCount} with warnings
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {validFileCount > 0 && !isProcessing && (
                <button
                  onClick={startProcessing}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Start Analysis ({validFileCount})
                </button>
              )}
              <button
                onClick={clearAllFiles}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-64 overflow-y-auto">
            {selectedFiles.map((filePreview) => (
              <div
                key={filePreview.id}
                className={`relative group border-2 rounded-lg p-2 transition-colors ${
                  !filePreview.validation.isValid
                    ? 'border-red-200 bg-red-50' 
                    : filePreview.validation.warnings.length > 0
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                }`}
              >
                <div className="aspect-square relative mb-2">
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <FileImage className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  {!isProcessing && (
                    <button
                      onClick={() => removeFile(filePreview.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-900 truncate" title={filePreview.file.name}>
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(filePreview.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {/* Display errors */}
                  {filePreview.validation.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 truncate" title={error.message}>
                      {error.message}
                    </p>
                  ))}
                  
                  {/* Display warnings */}
                  {filePreview.validation.warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-yellow-600 truncate" title={warning}>
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Help Text */}
      {selectedFiles.length === 0 && !isProcessing && (
        <div className="mt-6 flex items-start space-x-2 text-sm text-amber-600 bg-amber-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Tips for Best Results:</p>
            <ul className="space-y-1 text-sm">
              <li>• Upload high-resolution drone photos for accurate analysis</li>
              <li>• Ensure images are properly exposed and in focus</li>
              <li>• Include EXIF metadata for enhanced quality assessment</li>
              <li>• TIFF files support up to 200MB, JPEG/PNG up to 50-100MB</li>
              <li>• Large files will be intelligently down-sampled for performance</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};