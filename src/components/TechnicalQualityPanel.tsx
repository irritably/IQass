import React from 'react';
import { ImageAnalysis } from '../types';
import { Camera, Aperture, Zap, Gauge, MapPin, Calendar, Settings, Target, Grid, Layers } from 'lucide-react';
import { getScoreColor, getRecommendationColor } from '../utils/compositeScoring';

interface TechnicalQualityPanelProps {
  analysis: ImageAnalysis;
}

export const TechnicalQualityPanel: React.FC<TechnicalQualityPanelProps> = ({ analysis }) => {
  if (!analysis.compositeScore || !analysis.exposureAnalysis || !analysis.noiseAnalysis) {
    return null;
  }

  const { compositeScore, exposureAnalysis, noiseAnalysis, metadata, descriptorAnalysis } = analysis;

  return (
    <div className="space-y-6">
      {/* Header with Overall Recommendation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Technical Quality Analysis</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(compositeScore.recommendation)}`}>
          {compositeScore.recommendation.charAt(0).toUpperCase() + compositeScore.recommendation.slice(1)}
        </div>
      </div>

      {/* Composite Scores Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(compositeScore.overall)}`}>
            {compositeScore.overall}
          </div>
          <div className="text-sm text-gray-600">Overall</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(compositeScore.blur)}`}>
            {compositeScore.blur}
          </div>
          <div className="text-sm text-gray-600">Sharpness</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(compositeScore.exposure)}`}>
            {compositeScore.exposure}
          </div>
          <div className="text-sm text-gray-600">Exposure</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(compositeScore.noise)}`}>
            {compositeScore.noise}
          </div>
          <div className="text-sm text-gray-600">Noise</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(compositeScore.technical)}`}>
            {compositeScore.technical}
          </div>
          <div className="text-sm text-gray-600">Technical</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(compositeScore.descriptor || 0)}`}>
            {compositeScore.descriptor || 0}
          </div>
          <div className="text-sm text-gray-600">Features</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Exposure Analysis */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Aperture className="w-4 h-4 mr-2" />
            Enhanced Exposure Analysis
          </h4>
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
            <div className="flex justify-between">
              <span className="text-gray-600">Spatial Variance:</span>
              <span className="font-medium">{exposureAnalysis.spatialExposureVariance}</span>
            </div>
          </div>
        </div>

        {/* Descriptor-Based Quality Assessment */}
        {descriptorAnalysis && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Feature Descriptor Analysis
            </h4>
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
              <div className="flex justify-between">
                <span className="text-gray-600">Clustering:</span>
                <span className={`font-medium ${descriptorAnalysis.keypointDistribution.clustering < 30 ? 'text-green-600' : 
                  descriptorAnalysis.keypointDistribution.clustering < 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {descriptorAnalysis.keypointDistribution.clustering}%
                </span>
              </div>
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
            </div>
          </div>
        )}

        {/* Feature Type Distribution */}
        {descriptorAnalysis && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Grid className="w-4 h-4 mr-2" />
              Feature Type Distribution
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Corners:</span>
                <span className="font-medium">{descriptorAnalysis.featureTypes.corners}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Edges:</span>
                <span className="font-medium">{descriptorAnalysis.featureTypes.edges}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blobs:</span>
                <span className="font-medium">{descriptorAnalysis.featureTypes.blobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Textured:</span>
                <span className="font-medium">{descriptorAnalysis.featureTypes.textured}</span>
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
        )}

        {/* Noise & Artifacts */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Noise & Artifacts
          </h4>
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
          </div>
        </div>
      </div>

      {/* Camera Metadata */}
      {metadata && (
        <div className="pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 flex items-center mb-4">
            <Camera className="w-4 h-4 mr-2" />
            Camera Information
          </h4>
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
            {metadata.settings.whiteBalance && (
              <div>
                <span className="text-gray-600">White Balance:</span>
                <div className="font-medium">{metadata.settings.whiteBalance}</div>
              </div>
            )}
            {metadata.fileFormat.format && (
              <div>
                <span className="text-gray-600">Format:</span>
                <div className="font-medium">{metadata.fileFormat.format}</div>
              </div>
            )}
            {metadata.timestamp && (
              <div>
                <span className="text-gray-600">Captured:</span>
                <div className="font-medium">{metadata.timestamp.toLocaleDateString()}</div>
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
        </div>
      )}

      {/* Photogrammetric Recommendation */}
      {descriptorAnalysis && (
        <div className="pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 flex items-center mb-2">
              <Layers className="w-4 h-4 mr-2" />
              Photogrammetric Reconstruction Assessment
            </h5>
            <div className="text-sm text-blue-800">
              <p className="mb-2">
                <strong>Suitability:</strong> {descriptorAnalysis.reconstructionSuitability.charAt(0).toUpperCase() + descriptorAnalysis.reconstructionSuitability.slice(1)}
              </p>
              <p className="mb-2">
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
        </div>
      )}
    </div>
  );
};