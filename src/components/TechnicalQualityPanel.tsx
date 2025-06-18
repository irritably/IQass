import React, { useState, useEffect, useRef } from 'react';
import { ImageAnalysis } from '../types';
import { Camera, Aperture, Zap, Gauge, MapPin, Calendar, Settings, Target, Grid, Layers, ChevronDown, ChevronRight, Info, Eye, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
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
  badgeColor = 'bg-blue-100 text-blue-800 border-blue-200',
  recommendations = []
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 flex items-center justify-between group"
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow duration-200">
          {icon}
        </div>
        <div className="text-left">
          <span className="font-semibold text-gray-900 text-lg">{title}</span>
          {badge && (
            <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {recommendations.length > 0 && (
          <div className="flex items-center space-x-1 text-amber-600">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-medium">{recommendations.length}</span>
          </div>
        )}
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
      </div>
    </button>
    {isExpanded && (
      <div className="bg-white border-t border-gray-100">
        <div className="p-6 space-y-6">
          {children}
        </div>
        {/* Enhanced Contextual Recommendations */}
        {recommendations.length > 0 && (
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h5 className="text-base font-semibold text-amber-900 mb-3">Recommendations</h5>
                  <ul className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-amber-800 leading-relaxed">{rec}</span>
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDebugModal) {
        setShowDebugModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDebugModal]);

  // Focus management for modal
  useEffect(() => {
    if (showDebugModal && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
      firstFocusable?.focus();
    }
  }, [showDebugModal]);

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
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Analysis Unavailable</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Technical analysis data is not available for this image. This may be due to processing errors or unsupported file formats.
        </p>
      </div>
    );
  }

  const { compositeScore, exposureAnalysis, noiseAnalysis, metadata, descriptorAnalysis } = analysis;

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

  const getFeatureRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (descriptorAnalysis) {
      if (descriptorAnalysis.keypointCount < 500) {
        recommendations.push("Ensure sufficient texture and detail in the scene for better feature detection");
        recommendations.push("Avoid smooth surfaces like water or uniform fields when possible");
      }
      
      if (descriptorAnalysis.keypointDistribution.uniformity < 60) {
        recommendations.push("Improve flight planning to ensure more uniform feature distribution across images");
      }
      
      if (descriptorAnalysis.descriptorQuality.matchability < 70) {
        recommendations.push("Increase image overlap (80%+ forward, 60%+ side) for better feature matching");
        recommendations.push("Maintain consistent altitude and camera settings throughout the flight");
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
      <div className="space-y-6">
        {/* Enhanced Quick Overview Section */}
        <CollapsibleSection
          title="Quality Overview"
          icon={<Gauge className="w-6 h-6 text-blue-600" />}
          isExpanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
          badge={compositeScore.recommendation}
          badgeColor={getRecommendationColor(compositeScore.recommendation).replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', 'border-')}
        >
          {/* Enhanced Score Display Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            {[
              { label: 'Overall', value: compositeScore.overall, icon: Gauge },
              { label: 'Sharpness', value: compositeScore.blur, icon: Zap },
              { label: 'Exposure', value: compositeScore.exposure, icon: Aperture },
              { label: 'Noise', value: compositeScore.noise, icon: Settings },
              { label: 'Technical', value: compositeScore.technical, icon: Camera },
              { label: 'Features', value: compositeScore.descriptor || 0, icon: Target }
            ].map((metric, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <metric.icon className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-1 ${getScoreColor(metric.value)}`}>
                  {metric.value}
                </div>
                <div className="text-sm font-medium text-gray-600">{metric.label}</div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metric.value >= 85 ? 'bg-green-500' :
                      metric.value >= 70 ? 'bg-blue-500' :
                      metric.value >= 55 ? 'bg-yellow-500' :
                      metric.value >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Quick Recommendation */}
          <div className={`p-6 rounded-lg border-2 ${getRecommendationColor(compositeScore.recommendation)} shadow-sm`}>
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {compositeScore.recommendation === 'excellent' && <CheckCircle className="w-6 h-6 text-green-600" />}
                {(compositeScore.recommendation === 'poor' || compositeScore.recommendation === 'unsuitable') && <AlertTriangle className="w-6 h-6 text-red-600" />}
                {(compositeScore.recommendation === 'good' || compositeScore.recommendation === 'acceptable') && <Info className="w-6 h-6 text-blue-600" />}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-3 capitalize">{compositeScore.recommendation} Quality</h4>
                <p className="text-base leading-relaxed">
                  {compositeScore.recommendation === 'excellent' && 
                    'This image is excellent for photogrammetric reconstruction with high-quality features and optimal exposure. It will produce reliable results in most reconstruction scenarios.'}
                  {compositeScore.recommendation === 'good' && 
                    'This image is good for reconstruction and should produce reliable results in most scenarios. Minor optimizations may improve quality further.'}
                  {compositeScore.recommendation === 'acceptable' && 
                    'This image is acceptable for reconstruction but may require additional overlap or careful processing. Consider reviewing specific metrics for improvement opportunities.'}
                  {compositeScore.recommendation === 'poor' && 
                    'This image has quality issues that may affect reconstruction accuracy. Review the detailed analysis below and consider retaking if possible.'}
                  {compositeScore.recommendation === 'unsuitable' && 
                    'This image is not recommended for photogrammetric reconstruction due to significant quality issues. Retaking with improved settings is strongly advised.'}
                </p>
              </div>
            </div>
          </div>

          {/* Debug Visualization Button */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDebugModal(true)}
                className="inline-flex items-center px-4 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md"
              >
                <Eye className="w-4 h-4 mr-2" />
                Debug Visualization
              </button>
              <p className="text-xs text-gray-500 mt-2">
                View shader outputs and analysis visualizations (Development mode)
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Enhanced Exposure Analysis */}
        <CollapsibleSection
          title="Exposure Analysis"
          icon={<Aperture className="w-6 h-6 text-orange-600" />}
          isExpanded={expandedSections.has('exposure')}
          onToggle={() => toggleSection('exposure')}
          badge={`${exposureAnalysis.exposureScore}/100`}
          badgeColor={`${getScoreColor(exposureAnalysis.exposureScore).replace('text-', 'bg-').replace('-600', '-100')} ${getScoreColor(exposureAnalysis.exposureScore).replace('-600', '-800')} border-current`}
          recommendations={getExposureRecommendations()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Metrics */}
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Exposure Metrics</h5>
              <div className="space-y-3">
                {[
                  { label: 'Histogram Balance', value: exposureAnalysis.histogramBalance.replace('-', ' '), 
                    color: exposureAnalysis.histogramBalance === 'balanced' ? 'text-green-600' : 
                           exposureAnalysis.histogramBalance === 'high-contrast' ? 'text-blue-600' : 'text-yellow-600' },
                  { label: 'Dynamic Range', value: exposureAnalysis.dynamicRange.toString(), color: 'text-gray-900' },
                  { label: 'Average Brightness', value: exposureAnalysis.averageBrightness.toString(), color: 'text-gray-900' },
                  { label: 'Contrast Ratio', value: exposureAnalysis.contrastRatio.toString(), color: 'text-gray-900' }
                ].map((metric, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{metric.label}:</span>
                    <span className={`text-sm font-semibold ${metric.color}`}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Advanced Metrics */}
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Advanced Metrics</h5>
              <div className="space-y-3">
                {[
                  { label: 'Local Contrast', value: exposureAnalysis.localContrast, 
                    color: exposureAnalysis.localContrast > 30 ? 'text-green-600' : 'text-yellow-600' },
                  { label: 'Highlight Recovery', value: `${exposureAnalysis.highlightRecovery}%`, 
                    color: exposureAnalysis.highlightRecovery > 80 ? 'text-green-600' : 'text-yellow-600' },
                  { label: 'Shadow Detail', value: `${exposureAnalysis.shadowDetail}%`, 
                    color: exposureAnalysis.shadowDetail > 80 ? 'text-green-600' : 'text-yellow-600' },
                  { label: 'Perceptual Score', value: exposureAnalysis.perceptualExposureScore, 
                    color: getScoreColor(exposureAnalysis.perceptualExposureScore) }
                ].map((metric, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{metric.label}:</span>
                    <span className={`text-sm font-semibold ${metric.color}`}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Enhanced Feature Analysis */}
        {descriptorAnalysis && (
          <CollapsibleSection
            title="Feature Analysis"
            icon={<Target className="w-6 h-6 text-cyan-600" />}
            isExpanded={expandedSections.has('features')}
            onToggle={() => toggleSection('features')}
            badge={`${descriptorAnalysis.keypointCount} keypoints`}
            badgeColor="bg-cyan-100 text-cyan-800 border-cyan-200"
            recommendations={getFeatureRecommendations()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature Detection */}
              <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Feature Detection</h5>
                <div className="space-y-3">
                  {[
                    { label: 'Keypoint Count', value: descriptorAnalysis.keypointCount, 
                      color: descriptorAnalysis.keypointCount > 500 ? 'text-green-600' : 
                             descriptorAnalysis.keypointCount > 200 ? 'text-yellow-600' : 'text-red-600' },
                    { label: 'Feature Density', value: `${descriptorAnalysis.keypointDensity.toFixed(2)}/1k px`, color: 'text-gray-900' },
                    { label: 'Distribution Uniformity', value: `${descriptorAnalysis.keypointDistribution.uniformity}%`, 
                      color: getScoreColor(descriptorAnalysis.keypointDistribution.uniformity) },
                    { label: 'Coverage', value: `${descriptorAnalysis.keypointDistribution.coverage}%`, 
                      color: getScoreColor(descriptorAnalysis.keypointDistribution.coverage) }
                  ].map((metric, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{metric.label}:</span>
                      <span className={`text-sm font-semibold ${metric.color}`}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quality Metrics */}
              <div className="space-y-4">
                <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Quality Metrics</h5>
                <div className="space-y-3">
                  {[
                    { label: 'Matchability', value: `${descriptorAnalysis.descriptorQuality.matchability}%`, 
                      color: getScoreColor(descriptorAnalysis.descriptorQuality.matchability) },
                    { label: 'Photogrammetric Score', value: descriptorAnalysis.photogrammetricScore, 
                      color: getScoreColor(descriptorAnalysis.photogrammetricScore) },
                    { label: 'Scale Invariance', value: `${descriptorAnalysis.scaleInvariance}%`, 
                      color: getScoreColor(descriptorAnalysis.scaleInvariance) },
                    { label: 'Rotation Invariance', value: `${descriptorAnalysis.rotationInvariance}%`, 
                      color: getScoreColor(descriptorAnalysis.rotationInvariance) }
                  ].map((metric, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{metric.label}:</span>
                      <span className={`text-sm font-semibold ${metric.color}`}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Enhanced Noise & Artifacts */}
        <CollapsibleSection
          title="Noise & Artifacts"
          icon={<Zap className="w-6 h-6 text-purple-600" />}
          isExpanded={expandedSections.has('noise')}
          onToggle={() => toggleSection('noise')}
          badge={`${noiseAnalysis.noiseScore}/100`}
          badgeColor={`${getScoreColor(noiseAnalysis.noiseScore).replace('text-', 'bg-').replace('-600', '-100')} ${getScoreColor(noiseAnalysis.noiseScore).replace('-600', '-800')} border-current`}
          recommendations={getNoiseRecommendations()}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Noise Metrics */}
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Noise Analysis</h5>
              <div className="space-y-3">
                {[
                  { label: 'Noise Level', value: noiseAnalysis.noiseLevel.toFixed(1), 
                    color: noiseAnalysis.noiseLevel < 10 ? 'text-green-600' : 
                           noiseAnalysis.noiseLevel < 20 ? 'text-yellow-600' : 'text-red-600' },
                  { label: 'SNR Ratio', value: noiseAnalysis.snrRatio.toFixed(1), color: 'text-gray-900' },
                  { label: 'Compression Artifacts', value: noiseAnalysis.compressionArtifacts.toFixed(1), 
                    color: noiseAnalysis.compressionArtifacts < 5 ? 'text-green-600' : 
                           noiseAnalysis.compressionArtifacts < 15 ? 'text-yellow-600' : 'text-red-600' }
                ].map((metric, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{metric.label}:</span>
                    <span className={`text-sm font-semibold ${metric.color}`}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Artifact Analysis */}
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Artifact Analysis</h5>
              <div className="space-y-3">
                {[
                  { label: 'Chromatic Aberration', value: noiseAnalysis.chromaticAberration.toFixed(1), 
                    color: noiseAnalysis.chromaticAberration < 5 ? 'text-green-600' : 
                           noiseAnalysis.chromaticAberration < 15 ? 'text-yellow-600' : 'text-red-600' },
                  { label: 'Vignetting', value: `${noiseAnalysis.vignetting.toFixed(1)}%`, 
                    color: noiseAnalysis.vignetting < 10 ? 'text-green-600' : 
                           noiseAnalysis.vignetting < 25 ? 'text-yellow-600' : 'text-red-600' },
                  { label: 'Overall Artifact Score', value: noiseAnalysis.overallArtifactScore, 
                    color: getScoreColor(100 - noiseAnalysis.overallArtifactScore) }
                ].map((metric, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{metric.label}:</span>
                    <span className={`text-sm font-semibold ${metric.color}`}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Enhanced Camera Metadata */}
        {metadata && (
          <CollapsibleSection
            title="Camera Information"
            icon={<Camera className="w-6 h-6 text-gray-600" />}
            isExpanded={expandedSections.has('metadata')}
            onToggle={() => toggleSection('metadata')}
            badge={metadata.camera.make && metadata.camera.model ? `${metadata.camera.make} ${metadata.camera.model}` : 'Available'}
            badgeColor="bg-gray-100 text-gray-800 border-gray-200"
            recommendations={getCameraRecommendations()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Camera Info */}
              {(metadata.camera.make || metadata.camera.model || metadata.camera.lens) && (
                <div className="space-y-3">
                  <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Camera</h5>
                  {metadata.camera.make && metadata.camera.model && (
                    <div className="py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Camera:</span>
                      <div className="font-semibold text-gray-900">{metadata.camera.make} {metadata.camera.model}</div>
                    </div>
                  )}
                  {metadata.camera.lens && (
                    <div className="py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Lens:</span>
                      <div className="font-semibold text-gray-900">{metadata.camera.lens}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Settings */}
              <div className="space-y-3">
                <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Settings</h5>
                {[
                  { label: 'ISO', value: metadata.settings.iso, 
                    color: metadata.settings.iso && metadata.settings.iso <= 400 ? 'text-green-600' : 
                           metadata.settings.iso && metadata.settings.iso <= 800 ? 'text-yellow-600' : 'text-red-600' },
                  { label: 'Aperture', value: metadata.settings.aperture ? `f/${metadata.settings.aperture}` : undefined, color: 'text-gray-900' },
                  { label: 'Shutter Speed', value: metadata.settings.shutterSpeed, color: 'text-gray-900' },
                  { label: 'Focal Length', value: metadata.settings.focalLength ? `${metadata.settings.focalLength}mm` : undefined, color: 'text-gray-900' }
                ].filter(setting => setting.value).map((setting, index) => (
                  <div key={index} className="py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{setting.label}:</span>
                    <div className={`font-semibold ${setting.color}`}>{setting.value}</div>
                  </div>
                ))}
              </div>

              {/* Location */}
              {metadata.location.latitude && metadata.location.longitude && (
                <div className="space-y-3">
                  <h5 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location
                  </h5>
                  {[
                    { label: 'Latitude', value: `${metadata.location.latitude.toFixed(6)}°` },
                    { label: 'Longitude', value: `${metadata.location.longitude.toFixed(6)}°` },
                    { label: 'Altitude', value: metadata.location.altitude ? `${metadata.location.altitude.toFixed(1)}m` : undefined }
                  ].filter(loc => loc.value).map((location, index) => (
                    <div key={index} className="py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{location.label}:</span>
                      <div className="font-semibold text-gray-900">{location.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Enhanced Photogrammetric Recommendation */}
        {descriptorAnalysis && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm">
            <h5 className="text-lg font-semibold text-blue-900 flex items-center mb-4">
              <Layers className="w-5 h-5 mr-2" />
              Photogrammetric Reconstruction Assessment
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-blue-800">Suitability</div>
                <div className={`text-lg font-bold ${getScoreColor(descriptorAnalysis.photogrammetricScore)}`}>
                  {descriptorAnalysis.reconstructionSuitability.charAt(0).toUpperCase() + descriptorAnalysis.reconstructionSuitability.slice(1)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-blue-800">Feature Quality</div>
                <div className="text-blue-700">
                  {descriptorAnalysis.keypointCount} keypoints with {descriptorAnalysis.descriptorQuality.matchability}% predicted matchability
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-blue-800">Recommendation</div>
                <div className="text-blue-700">
                  {descriptorAnalysis.photogrammetricScore >= 70 
                    ? 'Excellent for 3D reconstruction with high feature matching potential'
                    : descriptorAnalysis.photogrammetricScore >= 55
                    ? 'Good for reconstruction, may require additional overlap'
                    : descriptorAnalysis.photogrammetricScore >= 40
                    ? 'Acceptable but consider retaking for better results'
                    : 'Not recommended for photogrammetric reconstruction'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Debug Visualization Modal */}
      {showDebugModal && (
        <div 
          ref={modalRef}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowDebugModal(false)}
        >
          <DebugVisualizationModal
            analysis={analysis}
            onClose={() => setShowDebugModal(false)}
          />
        </div>
      )}
    </>
  );
};