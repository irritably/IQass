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
  badgeColor = 'bg-blue-100 text-blue-800'
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
      <div className="p-4 bg-white">
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
      <div className="text-center py-8">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Technical analysis data not available for this image.</p>
      </div>
    );
  }

  const { compositeScore, exposureAnalysis, noiseAnalysis, metadata, descriptorAnalysis } = analysis;

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
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(compositeScore.technical)}`}>
                {compositeScore.technical}
              </div>
              <div className="text-sm text-gray-600">Technical</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(compositeScore.descriptor || 0)}`}>
                {compositeScore.descriptor || 0}
              </div>
              <div className="text-sm text-gray-600">Features</div>
            </div>
          </div>

          {/* Quick Recommendation */}
          <div className={`p-4 rounded-lg border ${getRecommendationColor(compositeScore.recommendation)}`}>
            <h4 className="font-medium mb-2">Recommendation</h4>
            <p className="text-sm">
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
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Exposure Metrics</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Histogram Balance:</span>
                  <span className={`font-medium ${
                    exposureAnalysis.histogramBalance === 'balanced' ? 'text-green-600' : 
                    exposureAnalysis.histogramBalance === 'high-contrast' ? 'text-blue-600' : 
                    exposureAnalysis.histogramBalance === 'low-contrast' ? 'text-purple-600' : 'text-yellow-600'
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

          {/* Exposure Analysis Explanation */}
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <h6 className="font-medium text-orange-900 mb-2">Understanding Exposure Analysis</h6>
            <div className="text-sm text-orange-800 space-y-1">
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
            icon={<Target className="w-5 h-5 text-cyan-600" />}
            isExpanded={expandedSections.has('features')}
            onToggle={() => toggleSection('features')}
            badge={`${descriptorAnalysis.keypointCount} keypoints`}
            badgeColor="bg-cyan-100 text-cyan-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Feature Detection</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Keypoint Count:</span>
                    <span className={`font-medium ${descriptorAnalysis.keypointCount > 500 ? 'text-green-600' : 
                      descriptorAnalysis.keypointCount > 200 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {descriptorAnalysis.keypointCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Feature Density:</span>
                    <span className="font-medium">{descriptorAnalysis.keypointDensity.toFixed(2)}/1k px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distribution Uniformity:</span>
                    <span className={`font-medium ${getScoreColor(descriptorAnalysis.keypointDistribution.uniformity)}`}>
                      {descriptorAnalysis.keypointDistribution.uniformity}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coverage:</span>
                    <span className={`font-medium ${getScoreColor(descriptorAnalysis.keypointDistribution.coverage)}`}>
                      {descriptorAnalysis.keypointDistribution.coverage}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Quality Metrics</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matchability:</span>
                    <span className={`font-medium ${getScoreColor(descriptorAnalysis.descriptorQuality.matchability)}`}>
                      {descriptorAnalysis.descriptorQuality.matchability}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Photogrammetric Score:</span>
                    <span className={`font-medium ${getScoreColor(descriptorAnalysis.photogrammetricScore)}`}>
                      {descriptorAnalysis.photogrammetricScore}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scale Invariance:</span>
                    <span className={`font-medium ${getScoreColor(descriptorAnalysis.scaleInvariance)}`}>
                      {descriptorAnalysis.scaleInvariance}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rotation Invariance:</span>
                    <span className={`font-medium ${getScoreColor(descriptorAnalysis.rotationInvariance)}`}>
                      {descriptorAnalysis.rotationInvariance}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Analysis Explanation */}
            <div className="mt-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
              <h6 className="font-medium text-cyan-900 mb-2">Understanding Feature Analysis</h6>
              <div className="text-sm text-cyan-800 space-y-1">
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
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          isExpanded={expandedSections.has('noise')}
          onToggle={() => toggleSection('noise')}
          badge={`${noiseAnalysis.noiseScore}/100`}
          badgeColor={`${getScoreColor(noiseAnalysis.noiseScore).replace('text-', 'bg-').replace('-600', '-100')} ${getScoreColor(noiseAnalysis.noiseScore).replace('-600', '-800')}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Noise Measurements</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Raw Std Deviation (σ):</span>
                  <span className="font-medium">{noiseAnalysis.rawStandardDeviation.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Noise Level:</span>
                  <span className={`font-medium ${noiseAnalysis.noiseLevel < 10 ? 'text-green-600' : 
                    noiseAnalysis.noiseLevel < 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {noiseAnalysis.noiseLevel.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SNR Ratio:</span>
                  <span className={`font-medium ${noiseAnalysis.snrRatio > 20 ? 'text-green-600' : 
                    noiseAnalysis.snrRatio > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {noiseAnalysis.snrRatio.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Artifact Detection</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Compression Artifacts:</span>
                  <span className={`font-medium ${noiseAnalysis.compressionArtifacts < 10 ? 'text-green-600' : 
                    noiseAnalysis.compressionArtifacts < 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {noiseAnalysis.compressionArtifacts.toFixed(1)}
                  </span>
                </div>
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
          </div>

          {/* Enhanced Noise Analysis Explanation */}
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <h6 className="font-medium text-purple-900 mb-2">Understanding Noise & Artifact Metrics</h6>
            <div className="text-sm text-purple-800 space-y-1">
              <p><strong>Raw Standard Deviation (σ):</strong> Direct measurement of pixel value variation in 8×8 blocks</p>
              <p><strong>Noise Level:</strong> User-friendly 0-100 scale derived from σ (lower is better, &lt;10 is excellent)</p>
              <p><strong>SNR Ratio:</strong> Signal-to-noise ratio (higher is better, &gt;20 is excellent)</p>
              <p><strong>Compression Artifacts:</strong> JPEG blocking and edge discontinuities (&lt;10 is good)</p>
              <p><strong>Chromatic Aberration:</strong> Color fringing using Sobel gradient analysis (&lt;5 is excellent)</p>
              <p><strong>Vignetting:</strong> Corner darkening using radial brightness modeling (&lt;10% is good)</p>
            </div>
          </div>

          {/* Algorithm Details */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h6 className="font-medium text-gray-900 mb-2">Detection Algorithms</h6>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Compression:</strong> Enhanced DCT-based blocking detection with edge continuity analysis</p>
              <p><strong>Chromatic Aberration:</strong> Multi-channel Sobel gradient comparison for color misalignment</p>
              <p><strong>Vignetting:</strong> Radial brightness profiling with polynomial model fitting</p>
              <p><strong>Noise:</strong> Block-based standard deviation with perceptual scaling</p>
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

            {/* Camera Settings Explanation */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h6 className="font-medium text-gray-900 mb-2">Camera Settings Impact</h6>
              <div className="text-sm text-gray-700 space-y-1">
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 flex items-center mb-2">
              <Layers className="w-4 h-4 mr-2" />
              Photogrammetric Reconstruction Assessment
            </h5>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="flex items-center space-x-2">
                {descriptorAnalysis.photogrammetricScore >= 70 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : descriptorAnalysis.photogrammetricScore >= 55 ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <p>
                  <strong>Suitability:</strong> {descriptorAnalysis.reconstructionSuitability.charAt(0).toUpperCase() + descriptorAnalysis.reconstructionSuitability.slice(1)}
                </p>
              </div>
              <p>
                <strong>Feature Quality:</strong> {descriptorAnalysis.keypointCount} keypoints detected with {descriptorAnalysis.descriptorQuality.matchability}% predicted matchability
              </p>
              <p>
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