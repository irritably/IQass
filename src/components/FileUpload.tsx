import React, { useCallback, useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, X, FolderOpen, FileImage, Tag, Check, AlertTriangle } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  error?: string;
  tags: string[];
}

interface ValidationError {
  type: 'size' | 'format' | 'corrupted' | 'metadata';
  message: string;
  suggestion?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): ValidationError | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    // Check file type
    if (!validTypes.includes(file.type.toLowerCase())) {
      return {
        type: 'format',
        message: `Unsupported format: ${file.type || 'unknown'}`,
        suggestion: 'Please use JPG, PNG, or TIFF files for drone imagery analysis.'
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        type: 'size',
        message: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        suggestion: `Maximum size is 50MB. Consider compressing the image or using a different format.`
      };
    }

    // Check for minimum size (too small might indicate issues)
    if (file.size < 10 * 1024) { // 10KB
      return {
        type: 'size',
        message: 'File suspiciously small',
        suggestion: 'This file may be corrupted or not a valid image.'
      };
    }

    return null;
  };

  const createFilePreview = async (file: File): Promise<FilePreview> => {
    const id = Math.random().toString(36).substr(2, 9);
    const validationError = validateFile(file);
    
    if (validationError) {
      return { 
        file, 
        id, 
        error: validationError.message,
        tags: []
      };
    }

    try {
      const preview = await createThumbnail(file);
      return { file, id, preview, tags: [] };
    } catch (err) {
      console.warn('Failed to create thumbnail for', file.name, err);
      return { 
        file, 
        id, 
        error: 'Failed to generate preview - file may be corrupted',
        tags: []
      };
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
        reject(new Error('Thumbnail creation timeout - file may be corrupted'));
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
          
          ctx.fillStyle = '#ffffff';
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
                reject(new Error('Failed to read thumbnail data'));
              };
              reader.readAsDataURL(blob);
            } else {
              cleanup();
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
          
        } catch (drawError) {
          cleanup();
          reject(new Error('Failed to process image - file may be corrupted'));
        }
      };
      
      img.onerror = () => {
        cleanup();
        reject(new Error('Failed to load image - file may be corrupted or in unsupported format'));
      };

      try {
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (urlError) {
        cleanup();
        reject(new Error('Failed to read file - file may be corrupted'));
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

  const addTag = useCallback((fileId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setSelectedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, tags: [...file.tags, tag.trim()] }
        : file
    ));
    setNewTag('');
    setShowTagInput(null);
  }, []);

  const removeTag = useCallback((fileId: string, tagIndex: number) => {
    setSelectedFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, tags: file.tags.filter((_, index) => index !== tagIndex) }
        : file
    ));
  }, []);

  const startProcessing = useCallback(() => {
    const validFiles = selectedFiles
      .filter(fp => !fp.error)
      .map(fp => fp.file);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      setSelectedFiles([]);
    }
  }, [selectedFiles, onFilesSelected]);

  const validFileCount = selectedFiles.filter(fp => !fp.error).length;
  const errorFileCount = selectedFiles.filter(fp => fp.error).length;

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
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
        } ${selectedFiles.length === 0 ? 'p-16' : 'p-8'}`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
            isProcessing 
              ? 'bg-gray-100' 
              : isDragOver
              ? 'bg-blue-200 scale-110'
              : 'bg-blue-100'
          }`}>
            {isProcessing ? (
              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className={`w-8 h-8 transition-colors ${isDragOver ? 'text-blue-700' : 'text-blue-600'}`} />
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
                : 'Drag and drop your images here, or click to browse. Supports batch processing with custom tagging.'
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
            <span>Supports JPG, PNG, TIFF</span>
            <span>•</span>
            <span>Max 50MB per file</span>
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
                <span className="inline-flex items-center text-sm text-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  {validFileCount} ready to process
                </span>
              )}
              {errorFileCount > 0 && (
                <span className="inline-flex items-center text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errorFileCount} with errors
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {selectedFiles.map((filePreview) => (
              <div
                key={filePreview.id}
                className={`relative group border-2 rounded-lg p-3 transition-all duration-200 ${
                  filePreview.error 
                    ? 'border-red-300 bg-red-50 shadow-sm' 
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Enhanced Error Display */}
                {filePreview.error && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  </div>
                )}

                <div className="aspect-square relative mb-3">
                  {filePreview.preview ? (
                    <img
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <FileImage className={`w-6 h-6 ${filePreview.error ? 'text-red-400' : 'text-gray-400'}`} />
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
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-900 truncate" title={filePreview.file.name}>
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(filePreview.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {/* Enhanced Error Information */}
                  {filePreview.error && (
                    <div className="space-y-1">
                      <p className="text-xs text-red-600 font-medium">
                        {filePreview.error}
                      </p>
                      {/* Add suggestion based on error type */}
                      <p className="text-xs text-red-500">
                        {filePreview.error.includes('format') && 'Use JPG, PNG, or TIFF format'}
                        {filePreview.error.includes('large') && 'Compress image or use different format'}
                        {filePreview.error.includes('small') && 'Check if file is corrupted'}
                        {filePreview.error.includes('corrupted') && 'Try re-exporting from source'}
                      </p>
                    </div>
                  )}

                  {/* Tags Section */}
                  {!filePreview.error && (
                    <div className="space-y-1">
                      {filePreview.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {filePreview.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(filePreview.id, index)}
                                className="ml-1 hover:text-blue-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {showTagInput === filePreview.id ? (
                        <div className="flex space-x-1">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTag(filePreview.id, newTag);
                              }
                            }}
                            placeholder="Add tag..."
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => addTag(filePreview.id, newTag)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowTagInput(filePreview.id)}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          Add tag
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Help Text */}
      {selectedFiles.length === 0 && !isProcessing && (
        <div className="mt-6 space-y-4">
          <div className="flex items-start space-x-2 text-sm text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-2">Tips for Best Results:</p>
              <ul className="space-y-1 text-sm">
                <li>• Upload high-resolution drone photos for accurate analysis</li>
                <li>• Ensure images are properly exposed and in focus</li>
                <li>• Include EXIF metadata for enhanced quality assessment</li>
                <li>• Use custom tags to organize images by flight, area, or purpose</li>
                <li>• Process similar images together for consistent thresholds</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Supported Formats</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• JPEG/JPG (most common)</li>
                <li>• PNG (lossless)</li>
                <li>• TIFF (professional)</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">File Requirements</h4>
              <ul className="text-green-700 space-y-1">
                <li>• Maximum: 50MB per file</li>
                <li>• Minimum: 10KB (prevents corruption)</li>
                <li>• Batch: Unlimited files</li>
              </ul>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">Organization</h4>
              <ul className="text-purple-700 space-y-1">
                <li>• Add custom tags</li>
                <li>• Group by flight/area</li>
                <li>• Filter by tags later</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};