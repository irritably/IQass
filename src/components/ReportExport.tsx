import React, { useState } from 'react';
import { ImageAnalysis, MissionMetadata } from '../types';
import { Download, FileText, Package, Settings } from 'lucide-react';
import { exportQualityDataToCSV, generateQualityReport } from '../utils/qualityAssessment';

interface ReportExportProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

export const ReportExport: React.FC<ReportExportProps> = ({ analyses, threshold }) => {
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [missionData, setMissionData] = useState<MissionMetadata>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    operator: '',
    notes: ''
  });

  /**
   * Handles CSV export of analysis data
   */
  const handleExportCSV = () => {
    const finalMissionData = missionData.name ? missionData : undefined;
    exportQualityDataToCSV(analyses, threshold, finalMissionData);
  };

  /**
   * Handles full report export as text file
   */
  const handleExportReport = () => {
    const finalMissionData = missionData.name ? missionData : undefined;
    const report = generateQualityReport(analyses, threshold, finalMissionData);
    const reportContent = generateReportText(report, threshold);

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filename = missionData.name 
      ? `${missionData.name}_quality_report_${new Date().toISOString().split('T')[0]}.txt`
      : `drone_image_quality_report_${new Date().toISOString().split('T')[0]}.txt`;
    
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (analyses.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Export Results</h3>
        <button
          onClick={() => setShowMissionForm(!showMissionForm)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Mission Info
        </button>
      </div>

      {/* Mission Information Form */}
      {showMissionForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Mission Information (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mission Name
              </label>
              <input
                type="text"
                value={missionData.name}
                onChange={(e) => setMissionData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Site Survey 2024-01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={missionData.date}
                onChange={(e) => setMissionData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={missionData.location}
                onChange={(e) => setMissionData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Construction Site A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
              </label>
              <input
                type="text"
                value={missionData.operator}
                onChange={(e) => setMissionData(prev => ({ ...prev, operator: e.target.value }))}
                placeholder="e.g., John Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={missionData.notes}
                onChange={(e) => setMissionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the mission..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Export CSV Data
        </button>
        
        <button
          onClick={handleExportReport}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <FileText className="w-5 h-5 mr-2" />
          Export Full Report
        </button>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Package className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">Export Options</h4>
            <p className="text-sm text-gray-600 mt-1">
              CSV format includes all analysis data with improved formatting for integration with photogrammetry software. 
              Full report provides detailed recommendations and statistics in text format.
              {missionData.name && (
                <span className="block mt-1 text-blue-600">
                  Mission "{missionData.name}" information will be included in exports.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Generates formatted text report content with mission information
 * @param report - Quality report data
 * @param threshold - Quality threshold used
 * @returns Formatted report text
 */
const generateReportText = (report: any, threshold: number): string => {
  let content = 'DRONE IMAGE QUALITY ANALYSIS REPORT\n';
  content += '=====================================\n\n';
  
  // Mission information header
  if (report.missionData?.name) {
    content += `MISSION INFORMATION\n`;
    content += `==================\n`;
    content += `Mission: ${report.missionData.name}\n`;
    if (report.missionData.date) content += `Date: ${report.missionData.date}\n`;
    if (report.missionData.location) content += `Location: ${report.missionData.location}\n`;
    if (report.missionData.operator) content += `Operator: ${report.missionData.operator}\n`;
    if (report.missionData.notes) content += `Notes: ${report.missionData.notes}\n`;
    content += '\n';
  }
  
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `Quality Threshold: ${threshold}\n\n`;

  content += `SUMMARY STATISTICS\n`;
  content += `==================\n`;
  content += `Total Images: ${report.stats.totalImages}\n`;
  content += `Average Blur Score: ${report.stats.averageBlurScore.toFixed(2)}\n`;
  content += `Average Composite Score: ${report.stats.averageCompositeScore.toFixed(2)}\n`;
  content += `Average Descriptor Score: ${report.stats.averageDescriptorScore.toFixed(2)}\n`;
  content += `Average Keypoint Count: ${Math.round(report.stats.averageKeypointCount)}\n`;
  content += `Average Processing Time: ${report.stats.averageProcessingTime.toFixed(1)}ms\n`;
  content += `Recommended for Reconstruction: ${report.stats.recommendedForReconstruction} (${((report.stats.recommendedForReconstruction / report.stats.totalImages) * 100).toFixed(1)}%)\n\n`;

  content += `QUALITY DISTRIBUTION\n`;
  content += `===================\n`;
  content += `Excellent (85-100): ${report.stats.excellentCount}\n`;
  content += `Good (70-84): ${report.stats.goodCount}\n`;
  content += `Acceptable (55-69): ${report.stats.acceptableCount}\n`;
  content += `Poor (40-54): ${report.stats.poorCount}\n`;
  content += `Unsuitable (0-39): ${report.stats.unsuitableCount}\n\n`;

  content += `DETAILED RESULTS\n`;
  content += `===============\n`;
  content += report.recommendations.map((r: any) => 
    `${r.filename}: Composite ${r.compositeScore} | Blur ${r.blurScore} | Descriptor ${r.descriptorScore} | Keypoints ${r.keypointCount} | Time ${r.processingTime} (${r.quality}) - ${r.recommended ? 'RECOMMENDED' : 'NOT RECOMMENDED'}`
  ).join('\n');
  content += '\n\n';

  content += `RECOMMENDATIONS\n`;
  content += `==============\n`;
  content += `- Use images with composite scores ≥ ${threshold} for photogrammetry reconstruction\n`;
  content += `- Consider retaking images with scores below ${threshold}\n`;
  content += `- For high-precision work, consider using only images with scores ≥ 70\n`;
  content += `- Review images flagged as "poor" or "unsuitable" for potential issues\n`;
  content += `- Pay attention to descriptor scores and keypoint counts for feature matching quality\n`;
  content += `- Monitor processing times to optimize workflow efficiency\n`;

  return content;
};