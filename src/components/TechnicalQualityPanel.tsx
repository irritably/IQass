import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { Camera, Aperture, Zap, Gauge, MapPin, Calendar, Settings, ChevronDown, ChevronRight, Info, Eye, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { getScoreColor, getRecommendationColor } from '../utils/compositeScoring';
import { DebugVisualizationModal } from './DebugVisualizationModal';

interface TechnicalQualityPanelProps {
  analysis: ImageAnalysis;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  recommendations?: string[];
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  badge,
  badgeColor = 'bg-blue-100 text-blue-800',
  recommendations = []
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-gray-900">{title}</span>
        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      {isExpanded ? (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500" />
      )}
    </button>
    {isExpanded && (
      <div className="bg-white">
        <div className="p-4">
          {children}
        </div>
        {/* Contextual Recommendations */}
        {recommendations.length > 0 && (
          <div className="px-4 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-amber-900 mb-1">Recommendations</h5>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

export const TechnicalQualityPanel: React.FC<TechnicalQualityPanelProps> = ({ analysis }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [showDebugModal, setShowDebugModal] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  if (!analysis.compositeScore || !analysis.exposureAnalysis || !analysis.noiseAnalysis) {
    return (
      <div className="text-center py-8">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Technical analysis data not available for this image.</p>
      </div>
    );
  }

  const { compositeScore, exposureAnalysis, noiseAnalysis, metadata } = analysis;

  // Generate contextual recommendations based on scores
  const getExposureRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (exposureAnalysis.exposureScore < 60) {
      if (exposureAnalysis.overexposurePercentage > 5) {
        recommendations.push("Reduce exposure or use graduated ND filters to prevent highlight clipping");
      }
      if (exposureAnalysis.underexposurePercentage > 5) {
        recommendations.push("Increase exposure or use exposure bracketing for better shadow detail");
      }
      if (exposureAnalysis.dynamicRange < 150) {
        recommendations.push("Consider HDR capture or exposure bracketing for high-contrast scenes");
      }
    }
    
    if (exposureAnalysis.localContrast < 25) {
      recommendations.push("Increase local contrast in post-processing or capture during better lighting conditions");
    }
    
    return recommendations;
  };

  const getNoiseRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (noiseAnalysis.noiseScore < 70) {
      if (metadata?.settings.iso && metadata.settings.iso > 800) {
        recommendations.push("Lower ISO settings (≤800) to reduce noise in future captures");
      }
      if (noiseAnalysis.compressionArtifacts > 10) {
        recommendations.push("Use higher quality JPEG settings or shoot in RAW format");
      }
      if (noiseAnalysis.chromaticAberration > 10) {
        recommendations.push("Enable lens corrections in camera or apply chromatic aberration correction in post");
      }
    }
    
    return recommendations;
  };

  const getCameraRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (metadata?.settings) {
      if (metadata.settings.iso && metadata.settings.iso > 400) {
        recommendations.push("Use lower ISO settings (≤400) for optimal image quality");
      }
      
      if (metadata.settings.aperture && metadata.settings.aperture < 4) {
        recommendations.push("Consider using f/4-f/8 for optimal lens sharpness and depth of field");
      }
      
      if (!metadata.settings.shutterSpeed) {
        recommendations.push("Ensure fast enough shutter speed (1/500s+) to prevent motion blur");
      }
    }
    
    return recommendations;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Quick Overview Section */}
        <CollapsibleSection
          title="Quality Overview"
          icon={<Gauge className="w-5 h-5 text-blue-600" />}
          isExpanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
          badge={compositeScore.recommendation}
          badgeColor={getRecommendationColor(compositeScore.recommendation).replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', '')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(compositeScore.overall)}`}>
                {compositeScore.overall}
              </div>
              <div className="text-sm text-gray-600">Overall</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(compositeScore.blur)}`}>
                {compositeScore.blur}
              </div>
              <div className="text-sm text-gray-600">Sharpness</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(compositeScore.exposure)}`}>
                {compositeScore.exposure}
              </div>
              <div className="text-sm text-gray-600">Exposure</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(compositeScore.noise)}`}>
                {compositeScore.noise}
              </div>
              <div className="text-sm text-gray-600">Noise</div>
            </div>
          </div>

          {/* Quick Recommendation */}
          <div className={`p-4 rounded-lg border ${getRecommendationColor(compositeScore.recommendation)}`}>
            <div className="flex items-start space-x-2">
              {compositeScore.recommendation === 'excellent' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
              {(compositeScore.recommendation === 'poor' || compositeScore.recommendation === 'unsuitable') && <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />}
              {(compositeScore.recommendation === 'good' || compositeScore.recommendation === 'acceptable') && <Info className="w-5 h-5 text-blue-600 mt-0.5" />}
              <div>
                <h4 className="font-medium mb-2">Recommendation</h4>
                <p className="text-sm">
                  {compositeScore.recommendation === 'excellent' && 
                    'This image is excellent with high-quality characteristics and optimal exposure.'}
                  {compositeScore.recommendation === 'good' && 
                    'This image is good quality and should produce reliable results in most scenarios.'}
                  {compositeScore.recommendation === 'acceptable' && 
                    'This image is acceptable but may require careful handling or additional processing.'}
                  {compositeScore.recommendation === 'poor' && 
                    'This image has quality issues that may affect results. Consider retaking if possible.'}
                  {compositeScore.recommendation === 'unsuitable' && 
                    'This image is not recommended for use due to significant quality issues.'}
                </p>
              </div>
            </div>
          </div>

          {/* Debug Visualization Button */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDebugModal(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Debug Visualization
              </button>
              <p className="text-xs text-gray-500 mt-1">
                View shader outputs and analysis visualizations (Development mode)
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Enhanced Exposure Analysis */}
        <CollapsibleSection
          title="Exposure Analysis"
          icon={<Aperture className="w-5 h-5 text-orange-600" />}
          isExpanded={expandedSections.has('exposure')}
          onToggle={() => toggleSection('exposure')}
          badge={`${exposureAnalysis.exposureScore}/100`}
          badgeColor={`${getScoreColor(exposureAnalysis.exposureScore).replace('text-', 'bg-').replace('-600', '-100')} ${getScoreColor(exposureAnalysis.exposureScore).replace('-600', '-800')}`}
          recommendations={getExposureRecommendations()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Exposure Metrics</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Histogram Balance:</span>
                  <span className={`font-medium ${
                    exposureAnalysis.histogramBalance === 'balanced' ? 'text-green-600' : 
                    exposureAnalysis.histogramBalance === 'high-contrast' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {exposureAnalysis.histogramBalance.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dynamic Range:</span>
                  <span className="font-medium">{exposureAnalysis.dynamicRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Brightness:</span>
                  <span className="font-medium">{exposureAnalysis.averageBrightness}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contrast Ratio:</span>
                  <span className="font-medium">{exposureAnalysis.contrastRatio}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Advanced Metrics</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Local Contrast:</span>
                  <span className={`font-medium ${exposureAnalysis.localContrast > 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {exposureAnalysis.localContrast}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Highlight Recovery:</span>
                  <span className={`font-medium ${exposureAnalysis.highlightRecovery > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {exposureAnalysis.highlightRecovery}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shadow Detail:</span>
                  <span className={`font-medium ${exposureAnalysis.shadowDetail > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {exposureAnalysis.shadowDetail}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Perceptual Score:</span>
                  <span className={`font-medium ${getScoreColor(exposureAnalysis.perceptualExposureScore)}`}>
                    {exposureAnalysis.perceptualExposureScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Noise & Artifacts */}
        <CollapsibleSection
          title="Noise & Artifacts"
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          isExpanded={expandedSections.has('noise')}
          onToggle={() => toggleSection('noise')}
          badge={`${noiseAnalysis.noiseScore}/100`}
          badgeColor={`${getScoreColor(noiseAnalysis.noiseScore).replace('text-', 'bg-').replace('-600', '-100')} ${getScoreColor(noiseAnalysis.noiseScore).replace('-600', '-800')}`}
          recommendations={getNoiseRecommendations()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Noise Level:</span>
                <span className={`font-medium ${noiseAnalysis.noiseLevel < 10 ? 'text-green-600' : 
                  noiseAnalysis.noiseLevel < 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {noiseAnalysis.noiseLevel.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SNR Ratio:</span>
                <span className="font-medium">{noiseAnalysis.snrRatio.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compression Artifacts:</span>
                <span className={`font-medium ${noiseAnalysis.compressionArtifacts < 5 ? 'text-green-600' : 
                  noiseAnalysis.compressionArtifacts < 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {noiseAnalysis.compressionArtifacts.toFixed(1)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Chromatic Aberration:</span>
                <span className={`font-medium ${noiseAnalysis.chromaticAberration < 5 ? 'text-green-600' : 
                  noiseAnalysis.chromaticAberration < 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {noiseAnalysis.chromaticAberration.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vignetting:</span>
                <span className={`font-medium ${noiseAnalysis.vignetting < 10 ? 'text-green-600' : 
                  noiseAnalysis.vignetting < 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {noiseAnalysis.vignetting.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overall Artifact Score:</span>
                <span className={`font-medium ${getScoreColor(100 - noiseAnalysis.overallArtifactScore)}`}>
                  {noiseAnalysis.overallArtifactScore}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Camera Metadata */}
        {metadata && (
          <CollapsibleSection
            title="Camera Information"
            icon={<Camera className="w-5 h-5 text-gray-600" />}
            isExpanded={expandedSections.has('metadata')}
            onToggle={() => toggleSection('metadata')}
            badge={metadata.camera.make && metadata.camera.model ? `${metadata.camera.make} ${metadata.camera.model}` : 'Available'}
            recommendations={getCameraRecommendations()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {metadata.camera.make && metadata.camera.model && (
                <div>
                  <span className="text-gray-600">Camera:</span>
                  <div className="font-medium">{metadata.camera.make} {metadata.camera.model}</div>
                </div>
              )}
              {metadata.camera.lens && (
                <div>
                  <span className="text-gray-600">Lens:</span>
                  <div className="font-medium">{metadata.camera.lens}</div>
                </div>
              )}
              {metadata.settings.iso && (
                <div>
                  <span className="text-gray-600">ISO:</span>
                  <div className={`font-medium ${metadata.settings.iso <= 400 ? 'text-green-600' : 
                    metadata.settings.iso <= 800 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metadata.settings.iso}
                  </div>
                </div>
              )}
              {metadata.settings.aperture && (
                <div>
                  <span className="text-gray-600">Aperture:</span>
                  <div className="font-medium">f/{metadata.settings.aperture}</div>
                </div>
              )}
              {metadata.settings.shutterSpeed && (
                <div>
                  <span className="text-gray-600">Shutter Speed:</span>
                  <div className="font-medium">{metadata.settings.shutterSpeed}</div>
                </div>
              )}
              {metadata.settings.focalLength && (
                <div>
                  <span className="text-gray-600">Focal Length:</span>
                  <div className="font-medium">{metadata.settings.focalLength}mm</div>
                </div>
              )}
            </div>

            {/* GPS Information */}
            {metadata.location.latitude && metadata.location.longitude && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="font-medium text-gray-900 flex items-center mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location Data
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Latitude:</span>
                    <div className="font-medium">{metadata.location.latitude.toFixed(6)}°</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Longitude:</span>
                    <div className="font-medium">{metadata.location.longitude.toFixed(6)}°</div>
                  </div>
                  {metadata.location.altitude && (
                    <div>
                      <span className="text-gray-600">Altitude:</span>
                      <div className="font-medium">{metadata.location.altitude.toFixed(1)}m</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}
      </div>

      {/* Debug Visualization Modal */}
      {showDebugModal && (
        <DebugVisualizationModal
          analysis={analysis}
          onClose={() => setShowDebugModal(false)}
        />
      )}
    </>
  );
};