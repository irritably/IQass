import React, { useCallback } from 'react';
import { Upload, Image, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isProcessing 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isProcessing ? 'bg-gray-100' : 'bg-blue-100'
          }`}>
            <Upload className={`w-8 h-8 ${isProcessing ? 'text-gray-400' : 'text-blue-600'}`} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isProcessing ? 'Processing Images...' : 'Upload Drone Photos'}
            </h3>
            <p className="text-gray-600">
              {isProcessing 
                ? 'Please wait while we analyze your images for blur detection'
                : 'Drag and drop your images here, or click to browse'
              }
            </p>
          </div>

          {!isProcessing && (
            <>
              <input
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
                <Image className="w-5 h-5 mr-2" />
                Select Images
              </label>
            </>
          )}

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>Supports JPG, PNG, TIFF</span>
            <span>•</span>
            <span>Batch processing available</span>
          </div>

          {!isProcessing && (
            <div className="flex items-start space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                For best results, upload high-resolution drone photos. 
                The analyzer will automatically resize images for optimal processing speed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};