import React, { useCallback, useState, useRef } from 'react';
import { Upload, Plus, Check, AlertTriangle, Zap } from 'lucide-react';
import { ProcessingProgress } from '../types';

interface CompactUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  progress: ProcessingProgress;
}

export const CompactUpload: React.FC<CompactUploadProps> = ({
  onFilesSelected,
  isProcessing,
  progress
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setShowDropZone(false);
    
    if (isProcessing) return;
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected, isProcessing]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragOver(true);
      setShowDropZone(true);
    }
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Keep drop zone visible for a moment
    setTimeout(() => setShowDropZone(false), 100);
  }, []);

  const handleClick = useCallback(() => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  }, [isProcessing]);

  return (
    <>
      {/* Compact Upload Button */}
      <div className="relative">
        <button
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isProcessing}
          className={`
            group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
            ${isProcessing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : isDragOver
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg hover:scale-105'
            }
          `}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Processing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-sm">Browse</span>
            </>
          )}
          
          {/* Progress indicator */}
          {isProcessing && progress.total > 0 && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Expanded Drop Zone Overlay */}
      {showDropZone && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm" />
          <div className="absolute inset-8 border-4 border-dashed border-blue-400 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Drop Images Here</h3>
              <p className="text-blue-700 text-lg">Release to start analysis</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};