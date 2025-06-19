import React, { useCallback, useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, X, FolderOpen, FileImage, Zap } from 'lucide-react';
import { FileValidationResult, FileValidationError } from '../../types';
import { getFileSizeLimit } from '../../utils/config';

interface ModernFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  validation: FileValidationResult;
}

export const ModernFileUpload: React.FC<ModernFileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): FileValidationResult => {
    const errors: FileValidationError[] = [];
    const warnings: string[] = [];
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
    const maxSize = getFileSizeLimit(file.type);

    if (!validTypes.includes(file.type.toLowerCase())) {
      errors.push({
        type: 'format',
        message: 'Invalid file type. Please use JPG, PNG, or TIFF files.'
      });
    }

    if (file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      errors.push({
        type: 'size',
        message: `File too large. Maximum size for ${file.type} is ${sizeMB}MB.`
      });
    }

    if (file.type.toLowerCase().includes('tiff') && file.size > 100 * 1024 * 1024) {
      warnings.push('Large TIFF files will be down-sampled for analysis to ensure performance.');
    }

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
      validation.warnings.push('Could not generate preview thumbnail');
      return { file, id, validation };
    }
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const img = new Image();
      let objectUrl: string | null = null;
      
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Thumbnail creation timeout'));
      }, 15000);

      const cleanup = () => {
        clearTimeout(timeout);
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            cleanup();
            reject(new Error('Failed to get canvas context'));
            return;
          }

          const size = 80;
          const ratio = Math.min(size / img.width, size / img.height);
          const newWidth = Math.floor(img.width * ratio);
          const newHeight = Math.floor(img.height * ratio);
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(0, 0, newWidth, newHeight);
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
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
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-6">
      {/* Main Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl transition-all duration-300 ${
          isProcessing 
            ? 'border-gray-600 bg-gray-800/30' 
            : isDragOver
            ? 'border-blue-400 bg-blue-500/10 scale-[1.02] glow-blue'
            : 'border-gray-500 hover:border-blue-400 hover:bg-blue-500/5'
        } ${selectedFiles.length === 0 ? 'p-16' : 'p-8'}`}
      >
        <div className="flex flex-col items-center space-y-6">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isProcessing 
              ? 'bg-gray-600' 
              : isDragOver
              ? 'bg-blue-500 glow-blue scale-110'
              : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:scale-105'
          }`}>
            {isProcessing ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className={`w-10 h-10 text-white ${isDragOver ? 'animate-bounce' : ''}`} />
            )}
          </div>
          
          <div className="space-y-3 text-center">
            <h3 className="text-2xl font-bold text-gray-100">
              {isProcessing 
                ? 'Processing Images...' 
                : selectedFiles.length > 0
                ? 'Add More Images or Start Processing'
                : 'Upload Drone Photos'
              }
            </h3>
            <p className="text-gray-400 max-w-md">
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
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105"
              >
                <FolderOpen className="w-5 h-5 mr-3" />
                Browse Files
              </label>
            </>
          )}

          <div className="flex items-center space-x-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>JPG, PNG, TIFF</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Smart size limits</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>GPU accelerated</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Grid */}
      {selectedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <h4 className="text-lg font-semibold text-gray-100">
                Selected Files ({selectedFiles.length})
              </h4>
              {validFileCount > 0 && (
                <span className="px-3 py-1 text-sm bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  {validFileCount} ready to process
                </span>
              )}
              {errorFileCount > 0 && (
                <span className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                  {errorFileCount} with errors
                </span>
              )}
              {warningFileCount > 0 && (
                <span className="px-3 py-1 text-sm bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                  {warningFileCount} with warnings
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {validFileCount > 0 && !isProcessing && (
                <button
                  onClick={startProcessing}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl glow-emerald"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Start Analysis ({validFileCount})
                </button>
              )}
              <button
                onClick={clearAllFiles}
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 text-gray-400 hover:text-gray-200 font-medium rounded-lg hover:bg-gray-700/50 transition-all duration-300 disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-80 overflow-y-auto">
            {selectedFiles.map((filePreview) => (
              <div
                key={filePreview.id}
                className={`relative group border-2 rounded-xl p-3 transition-all duration-300 ${
                  !filePreview.validation.isValid
                    ? 'border-red-500/50 bg-red-500/10' 
                    : filePreview.validation.warnings.length > 0
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-gray-600/50 bg-gray-700/30 hover:border-blue-500/50 hover:bg-blue-500/10'
                }`}
              >
                <div className="aspect-square relative mb-3">
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 rounded-lg flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {!isProcessing && (
                    <button
                      onClick={() => removeFile(filePreview.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-200 truncate" title={filePreview.file.name}>
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(filePreview.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {filePreview.validation.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-400 truncate" title={error.message}>
                      {error.message}
                    </p>
                  ))}
                  
                  {filePreview.validation.warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-amber-400 truncate" title={warning}>
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
        <div className="mt-8 p-6 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-xl border border-amber-500/30">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-200 mb-2">Tips for Best Results:</h4>
              <ul className="space-y-2 text-sm text-amber-300">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span>Upload high-resolution drone photos for accurate analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span>Ensure images are properly exposed and in focus</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span>Include EXIF metadata for enhanced quality assessment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                  <span>TIFF files support up to 200MB, JPEG/PNG up to 50-100MB</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};