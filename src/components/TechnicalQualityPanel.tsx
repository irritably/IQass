import React, { useState } from 'react';
import { ImageAnalysis } from '../types';
import { Camera, Aperture, Zap, Gauge, MapPin, Calendar, Settings, Target, Grid, Layers, ChevronDown, ChevronRight, Info, Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  badge,
  badgeColor = 'badge-primary'
}) => (
  <div className="card animate-fade-in-up">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-300 flex items-center justify-between rounded-t-xl"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <span className="font-semibold text-slate-100 text-lg">{title}</span>
        {badge && (
          <span className={badgeColor}>
            {badge}
          </span>
        )}
      </div>
      <ChevronDown 
        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
      />
    </button>
    {isExpanded && (
      <div className="p-6 bg-slate-800/30 rounded-b-xl animate-fade-in-up">
        {children}
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
      <div className="text-center py-12">
        <Info className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">Technical analysis data not available for this image.</p>
      </div>
    );
  }

  const { compositeScore, exposureAnalysis, noiseAnalysis, metadata, descriptorAnalysis } = analysis;

  return (
    <>
      <div className="space-y-6">
        {/* Quick Overview Section */}
        <CollapsibleSection
          title="Quality Overview"
          icon={<Gauge className="w-5 h-5 text-white" />}
          isExpanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
          badge={compositeScore.recommendation}
          badgeColor={getRecommendationColor(compositeScore.recommendation).replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', '')}
        >
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(compositeScore.overall)}`}>
                {compositeScore.overall}
              </div>
              <div className="text-sm text-slate-400 font-medium">Overall</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(compositeScore.blur)}`}>
                {compositeScore.blur}
              </div>
              <div className="text-sm text-slate-400 font-medium">Sharpness</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(compositeScore.exposure)}`}>
                {compositeScore.exposure}
              </div>
              <div className="text-sm text-slate-400 font-medium">Exposure</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(compositeScore.noise)}`}>
                {compositeScore.noise}
              </div>
              <div className="text-sm text-slate-400 font-medium">Noise</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(compositeScore.technical)}`}>
                {compositeScore.technical}
              </div>
              <div className="text-sm text-slate-400 font-medium">Technical</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(compositeScore.descriptor || 0)}`}>
                {compositeScore.descriptor || 0}
              </div>
              <div className="text-sm text-slate-400 font-medium">Features</div>
            </div>
          </div>

          {/* Quick Recommendation */}
          <div className={`p-6 rounded-xl border ${getRecommendationColor(compositeScore.recommendation)}`}>
            <h4 className="font-semibold text-lg mb-3">Recommendation</h4>
            <p className="text-sm leading-relaxed">
              {compositeScore.recommendation === 'excellent' && 
                'This image is excellent for photogrammetric reconstruction with high-quality features and optimal exposure.'}
              {compositeScore.recommendation === 'good' && 
                'This image is good for reconstruction and should produce reliable results in most scenarios.'}
              {compositeScore.recommendation === 'acceptable' && 
                'This image is acceptable for reconstruction but may require additional overlap or careful processing.'}
              {compositeScore.recommendation === 'poor' && 
                'This image has quality issues that may affect reconstruction accuracy. Consider retaking if possible.'}
              {compositeScore.recommendation === 'unsuitable' && 
                'This image is not recommended for photogrammetric reconstruction due to significant quality issues.'}
            </p>
          </div>

          {/* Debug Visualization Button */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <button
                onClick={() => setShowDebugModal(true)}
                className="btn-primary"
              >
                <Eye className="w-4 h-4 mr-2" />
                Debug Visualization
              </button>
              <p className="text-xs text-slate-400 mt-2">
                View shader outputs and analysis visualizations (Development mode)
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Enhanced Exposure Analysis */}
        <CollapsibleSection
          title="Exposure Analysis"
          icon={<Aperture className="w-5 h-5 text-white" />}
          isExpanded={expandedSections.has('exposure')}
          onToggle={() => toggleSection('exposure')}
          badge={`${exposureAnalysis.exposureScore}/100`}
          badgeColor={`${getScoreColor(exposureAnalysis.exposureScore).replace('text-', 'bg-').replace('-600', '-100')} ${getScoreColor(exposureAnalysis.exposureScore).replace('-600', '-800')}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="font-semibold text-slate-200 text-lg">Exposure Metrics</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Histogram Balance:</span>
                  <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    exposureAnalysis.histogramBalance === 'balanced' ? 'bg-emerald-500/20 text-emerald-400' : 
                    exposureAnalysis.histogramBalance === 'high-contrast' ? 'bg-blue-500/20 text-blue-400' : 
                    exposureAnalysis.histogramBalance === 'low-contrast' ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {exposureAnalysis.histogramBalance.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Dynamic Range:</span>
                  <span className="font-semibold text-slate-200">{exposureAnalysis.dynamicRange}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Average Brightness:</span>
                  <span className="font-semibold text-slate-200">{exposureAnalysis.averageBrightness}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Contrast Ratio:</span>
                  <span className="font-semibold text-slate-200">{exposureAnalysis.contrastRatio}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-semibold text-slate-200 text-lg">Advanced Metrics</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Local Contrast:</span>
                  <span className={`font-semibold ${exposureAnalysis.localContrast > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {exposureAnalysis.localContrast}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Highlight Recovery:</span>
                  <span className={`font-semibold ${exposureAnalysis.highlightRecovery > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {exposureAnalysis.highlightRecovery}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Shadow Detail:</span>
                  <span className={`font-semibold ${exposureAnalysis.shadowDetail > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {exposureAnalysis.shadowDetail}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Perceptual Score:</span>
                  <span className={`font-semibold ${getScoreColor(exposureAnalysis.perceptualExposureScore)}`}>
                    {exposureAnalysis.perceptualExposureScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Exposure Analysis Explanation */}
          <div className="mt-6 p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
            <h6 className="font-semibold text-orange-200 mb-3">Understanding Exposure Analysis</h6>
            <div className="text-sm text-orange-300 space-y-2">
              <p><strong>Histogram Balance:</strong> Distribution of tones across the image (balanced is ideal)</p>
              <p><strong>Dynamic Range:</strong> Difference between darkest and brightest areas (higher is better)</p>
              <p><strong>Local Contrast:</strong> Spatial variation in brightness (30+ is good for detail)</p>
              <p><strong>Highlight/Shadow Recovery:</strong> Percentage of detail retained in bright/dark areas</p>
              <p><strong>Perceptual Score:</strong> Human vision-weighted quality assessment</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Feature Analysis */}
        {descriptorAnalysis && (
          <CollapsibleSection
            title="Feature Analysis"
            icon={<Target className="w-5 h-5 text-white" />}
            isExpanded={expandedSections.has('features')}
            onToggle={() => toggleSection('features')}
            badge={`${descriptorAnalysis.keypointCount} keypoints`}
            badgeColor="badge-success"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h5 className="font-semibold text-slate-200 text-lg">Feature Detection</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Keypoint Count:</span>
                    <span className={`font-semibold ${descriptorAnalysis.keypointCount > 500 ? 'text-emerald-400' : 
                      descriptorAnalysis.keypointCount > 200 ? 'text-amber-400' : 'text-red-400'}`}>
                      {descriptorAnalysis.keypointCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Feature Density:</span>
                    <span className="font-semibold text-slate-200">{descriptorAnalysis.keypointDensity.toFixed(2)}/1k px</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Distribution Uniformity:</span>
                    <span className={`font-semibold ${getScoreColor(descriptorAnalysis.keypointDistribution.uniformity)}`}>
                      {descriptorAnalysis.keypointDistribution.uniformity}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Coverage:</span>
                    <span className={`font-semibold ${getScoreColor(descriptorAnalysis.keypointDistribution.coverage)}`}>
                      {descriptorAnalysis.keypointDistribution.coverage}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="font-semibold text-slate-200 text-lg">Quality Metrics</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Matchability:</span>
                    <span className={`font-semibold ${getScoreColor(descriptorAnalysis.descriptorQuality.matchability)}`}>
                      {descriptorAnalysis.descriptorQuality.matchability}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Photogrammetric Score:</span>
                    <span className={`font-semibold ${getScoreColor(descriptorAnalysis.photogrammetricScore)}`}>
                      {descriptorAnalysis.photogrammetricScore}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Scale Invariance:</span>
                    <span className={`font-semibold ${getScoreColor(descriptorAnalysis.scaleInvariance)}`}>
                      {descriptorAnalysis.scaleInvariance}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-400">Rotation Invariance:</span>
                    <span className={`font-semibold ${getScoreColor(descriptorAnalysis.rotationInvariance)}`}>
                      {descriptorAnalysis.rotationInvariance}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Analysis Explanation */}
            <div className="mt-6 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <h6 className="font-semibold text-cyan-200 mb-3">Understanding Feature Analysis</h6>
              <div className="text-sm text-cyan-300 space-y-2">
                <p><strong>Keypoint Count:</strong> Number of distinctive features detected (500+ is excellent)</p>
                <p><strong>Feature Density:</strong> Features per 1000 pixels (higher density = more detail)</p>
                <p><strong>Distribution Uniformity:</strong> How evenly features are spread across the image</p>
                <p><strong>Matchability:</strong> Predicted success rate for feature matching between images</p>
                <p><strong>Scale/Rotation Invariance:</strong> Robustness to viewing angle changes</p>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Enhanced Noise & Artifacts */}
        <CollapsibleSection
          title="Noise & Artifacts"
          icon={<Zap className="w-5 h-5 text-white" />}
          isExpanded={expandedSections.has('noise')}
          onToggle={() => toggleSection('noise')}
          badge={`${noiseAnalysis.noiseScore}/100`}
          badgeColor={`${getScoreColor(noiseAnalysis.noiseScore).replace('text-', 'bg-').replace('-600', '-100')} ${getScoreColor(noiseAnalysis.noiseScore).replace('-600', '-800')}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="font-semibold text-slate-200 text-lg">Noise Measurements</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Raw Std Deviation (σ):</span>
                  <span className="font-semibold text-slate-200">{noiseAnalysis.rawStandardDeviation.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Noise Level:</span>
                  <span className={`font-semibold ${noiseAnalysis.noiseLevel < 10 ? 'text-emerald-400' : 
                    noiseAnalysis.noiseLevel < 25 ? 'text-amber-400' : 'text-red-400'}`}>
                    {noiseAnalysis.noiseLevel.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">SNR Ratio:</span>
                  <span className={`font-semibold ${noiseAnalysis.snrRatio > 20 ? 'text-emerald-400' : 
                    noiseAnalysis.snrRatio > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                    {noiseAnalysis.snrRatio.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="font-semibold text-slate-200 text-lg">Artifact Detection</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Compression Artifacts:</span>
                  <span className={`font-semibold ${noiseAnalysis.compressionArtifacts < 10 ? 'text-emerald-400' : 
                    noiseAnalysis.compressionArtifacts < 25 ? 'text-amber-400' : 'text-red-400'}`}>
                    {noiseAnalysis.compressionArtifacts.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Chromatic Aberration:</span>
                  <span className={`font-semibold ${noiseAnalysis.chromaticAberration < 5 ? 'text-emerald-400' : 
                    noiseAnalysis.chromaticAberration < 15 ? 'text-amber-400' : 'text-red-400'}`}>
                    {noiseAnalysis.chromaticAberration.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Vignetting:</span>
                  <span className={`font-semibold ${noiseAnalysis.vignetting < 10 ? 'text-emerald-400' : 
                    noiseAnalysis.vignetting < 25 ? 'text-amber-400' : 'text-red-400'}`}>
                    {noiseAnalysis.vignetting.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Overall Artifact Score:</span>
                  <span className={`font-semibold ${getScoreColor(100 - noiseAnalysis.overallArtifactScore)}`}>
                    {noiseAnalysis.overallArtifactScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Noise Analysis Explanation */}
          <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
            <h6 className="font-semibold text-purple-200 mb-3">Understanding Noise & Artifact Metrics</h6>
            <div className="text-sm text-purple-300 space-y-2">
              <p><strong>Raw Standard Deviation (σ):</strong> Direct measurement of pixel value variation in 8×8 blocks</p>
              <p><strong>Noise Level:</strong> User-friendly 0-100 scale derived from σ (lower is better, <10 is excellent)</p>
              <p><strong>SNR Ratio:</strong> Signal-to-noise ratio (higher is better, >20 is excellent)</p>
              <p><strong>Compression Artifacts:</strong> JPEG blocking and edge discontinuities (<10 is good)</p>
              <p><strong>Chromatic Aberration:</strong> Color fringing using Sobel gradient analysis (<5 is excellent)</p>
              <p><strong>Vignetting:</strong> Corner darkening using radial brightness modeling (<10% is good)</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Camera Metadata */}
        {metadata && (
          <CollapsibleSection
            title="Camera Information"
            icon={<Camera className="w-5 h-5 text-white" />}
            isExpanded={expandedSections.has('metadata')}
            onToggle={() => toggleSection('metadata')}
            badge={metadata.camera.make && metadata.camera.model ? `${metadata.camera.make} ${metadata.camera.model}` : 'Available'}
            badgeColor="badge-primary"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metadata.camera.make && metadata.camera.model && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-sm">Camera:</span>
                  <div className="font-semibold text-slate-200 text-lg">{metadata.camera.make} {metadata.camera.model}</div>
                </div>
              )}
              {metadata.camera.lens && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-sm">Lens:</span>
                  <div className="font-semibold text-slate-200">{metadata.camera.lens}</div>
                </div>
              )}
              {metadata.settings.iso && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-sm">ISO:</span>
                  <div className={`font-semibold text-lg ${metadata.settings.iso <= 400 ? 'text-emerald-400' : 
                    metadata.settings.iso <= 800 ? 'text-amber-400' : 'text-red-400'}`}>
                    {metadata.settings.iso}
                  </div>
                </div>
              )}
              {metadata.settings.aperture && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-sm">Aperture:</span>
                  <div className="font-semibold text-slate-200 text-lg">f/{metadata.settings.aperture}</div>
                </div>
              )}
              {metadata.settings.shutterSpeed && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-sm">Shutter Speed:</span>
                  <div className="font-semibold text-slate-200">{metadata.settings.shutterSpeed}</div>
                </div>
              )}
              {metadata.settings.focalLength && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400 text-sm">Focal Length:</span>
                  <div className="font-semibold text-slate-200">{metadata.settings.focalLength}mm</div>
                </div>
              )}
            </div>

            {/* GPS Information */}
            {metadata.location.latitude && metadata.location.longitude && (
              <div className="mt-6 pt-6 border-t border-slate-600/50">
                <h5 className="font-semibold text-slate-200 flex items-center mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location Data
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <span className="text-slate-400 text-sm">Latitude:</span>
                    <div className="font-semibold text-slate-200">{metadata.location.latitude.toFixed(6)}°</div>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <span className="text-slate-400 text-sm">Longitude:</span>
                    <div className="font-semibold text-slate-200">{metadata.location.longitude.toFixed(6)}°</div>
                  </div>
                  {metadata.location.altitude && (
                    <div className="p-4 bg-slate-700/30 rounded-xl">
                      <span className="text-slate-400 text-sm">Altitude:</span>
                      <div className="font-semibold text-slate-200">{metadata.location.altitude.toFixed(1)}m</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Camera Settings Explanation */}
            <div className="mt-6 p-4 bg-slate-700/20 rounded-xl border border-slate-600/50">
              <h6 className="font-semibold text-slate-200 mb-3">Camera Settings Impact</h6>
              <div className="text-sm text-slate-300 space-y-2">
                <p><strong>ISO:</strong> Lower values (≤400) reduce noise, higher values may introduce grain</p>
                <p><strong>Aperture:</strong> f/5.6-f/11 typically provides optimal sharpness for aerial photography</p>
                <p><strong>Shutter Speed:</strong> Faster speeds reduce motion blur from drone movement</p>
                <p><strong>Focal Length:</strong> Affects field of view and perspective distortion</p>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Photogrammetric Recommendation */}
        {descriptorAnalysis && (
          <div className="card p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30 animate-fade-in-up">
            <h5 className="font-semibold text-blue-200 flex items-center mb-4 text-lg">
              <Layers className="w-5 h-5 mr-2" />
              Photogrammetric Reconstruction Assessment
            </h5>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {descriptorAnalysis.photogrammetricScore >= 70 ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : descriptorAnalysis.photogrammetricScore >= 55 ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <p className="text-blue-200 font-semibold">
                  <strong>Suitability:</strong> {descriptorAnalysis.reconstructionSuitability.charAt(0).toUpperCase() + descriptorAnalysis.reconstructionSuitability.slice(1)}
                </p>
              </div>
              <p className="text-blue-300">
                <strong>Feature Quality:</strong> {descriptorAnalysis.keypointCount} keypoints detected with {descriptorAnalysis.descriptorQuality.matchability}% predicted matchability
              </p>
              <p className="text-blue-300">
                <strong>Recommendation:</strong> {
                  descriptorAnalysis.photogrammetricScore >= 70 
                    ? 'Excellent for 3D reconstruction with high feature matching potential'
                    : descriptorAnalysis.photogrammetricScore >= 55
                    ? 'Good for reconstruction, may require additional overlap'
                    : descriptorAnalysis.photogrammetricScore >= 40
                    ? 'Acceptable but consider retaking for better results'
                    : 'Not recommended for photogrammetric reconstruction'
                }
              </p>
            </div>
          </div>
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