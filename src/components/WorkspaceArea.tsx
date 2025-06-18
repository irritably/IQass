import React, { useState, useMemo } from 'react';
import { FloatingResultCard } from './FloatingResultCard';
import { ProcessingProgress, ImageAnalysis } from '../types';
import { Search, Filter, Grid, List, ArrowUpDown, Sparkles, Target } from 'lucide-react';

interface WorkspaceAreaProps {
  analyses: ImageAnalysis[];
  threshold: number;
  selectedCards: Set<string>;
  onCardSelect: (selected: Set<string>) => void;
  progress: ProcessingProgress;
}

export const WorkspaceArea: React.FC<WorkspaceAreaProps> = ({
  analyses,
  threshold,
  selectedCards,
  onCardSelect,
  progress
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recommended' | 'issues'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'recent'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort analyses
  const filteredAnalyses = useMemo(() => {
    let filtered = analyses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis =>
        analysis.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'recommended':
        filtered = filtered.filter(a => (a.compositeScore?.overall || 0) >= threshold);
        break;
      case 'issues':
        filtered = filtered.filter(a => (a.compositeScore?.overall || 0) < threshold);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'score':
        filtered.sort((a, b) => (b.compositeScore?.overall || 0) - (a.compositeScore?.overall || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        // Most recently processed first (reverse order)
        filtered.reverse();
        break;
    }

    return filtered;
  }, [analyses, searchTerm, filterType, sortBy, threshold]);

  const handleCardClick = (analysisId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      const newSelected = new Set(selectedCards);
      if (newSelected.has(analysisId)) {
        newSelected.delete(analysisId);
      } else {
        newSelected.add(analysisId);
      }
      onCardSelect(newSelected);
    } else {
      onCardSelect(new Set([analysisId]));
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Floating Controls Bar */}
      <div className="p-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Images</option>
                <option value="recommended">Recommended</option>
                <option value="issues">Issues</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="score">Quality Score</option>
                <option value="name">Name</option>
                <option value="recent">Recent</option>
              </select>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {selectedCards.size > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-lg">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {selectedCards.size} selected
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        {/* Empty State */}
        {analyses.length === 0 && !progress.isProcessing && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready for Analysis</h3>
              <p className="text-gray-600 max-w-md">
                Upload drone images using the browse button in the top-right corner to start your quality analysis
              </p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {progress.isProcessing && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Images</h3>
              <p className="text-gray-600 mb-4">
                {progress.currentImageName && `Processing: ${progress.currentImageName}`}
              </p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {progress.current} of {progress.total} images
              </p>
            </div>
          </div>
        )}

        {/* Results Grid/List */}
        {filteredAnalyses.length > 0 && (
          <div className="h-full overflow-y-auto">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-6">
                {filteredAnalyses.map((analysis, index) => (
                  <FloatingResultCard
                    key={analysis.id}
                    analysis={analysis}
                    threshold={threshold}
                    isSelected={selectedCards.has(analysis.id)}
                    onClick={(isMultiSelect) => handleCardClick(analysis.id, isMultiSelect)}
                    animationDelay={index * 50}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {filteredAnalyses.map((analysis, index) => (
                  <FloatingResultCard
                    key={analysis.id}
                    analysis={analysis}
                    threshold={threshold}
                    isSelected={selectedCards.has(analysis.id)}
                    onClick={(isMultiSelect) => handleCardClick(analysis.id, isMultiSelect)}
                    animationDelay={index * 30}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {filteredAnalyses.length === 0 && analyses.length > 0 && !progress.isProcessing && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};