import React, { useState } from 'react';
import { ImageAnalysis, MissionMetadata } from '../types';
import { Download, FileText, Package, Settings, Database, Share } from 'lucide-react';
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

  const handleExportCSV = () => {
    const finalMissionData = missionData.name ? missionData : undefined;
    exportQualityDataToCSV(analyses, threshold, finalMissionData);
  };

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
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Share className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Export Results</h3>
            <p className="text-sm text-gray-400">Download analysis data and reports</p>
          </div>
        </div>
        <button
          onClick={() => setShowMissionForm(!showMissionForm)}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            showMissionForm 
              ? 'bg-blue-500 text-white shadow-lg glow-blue' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <Settings className="w-4 h-4 mr-2" />
          Mission Info
        </button>
      </div>

      {/* Mission Information Form */}
      {showMissionForm && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-xl border border-blue-500/30 animate-fade-in-up">
          <h4 className="font-semibold text-blue-200 mb-4 flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Mission Information (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mission Name
              </label>
              <input
                type="text"
                value={missionData.name}
                onChange={(e) => setMissionData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Site Survey 2024-01"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={missionData.date}
                onChange={(e) => setMissionData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={missionData.location}
                onChange={(e) => setMissionData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Construction Site A"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Operator
              </label>
              <input
                type="text"
                value={missionData.operator}
                onChange={(e) => setMissionData(prev => ({ ...prev, operator: e.target.value }))}
                placeholder="e.g., John Smith"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={missionData.notes}
                onChange={(e) => setMissionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the mission..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl glow-blue group"
        >
          <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
          Export CSV Data
        </button>
        
        <button
          onClick={handleExportReport}
          className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl glow-emerald group"
        >
          <FileText className="w-5 h-5 mr-3 group-hover:animate-bounce" />
          Export Full Report
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-lg border border-gray-600/50">
        <div className="flex items-start space-x-3">
          <Package className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-200 mb-2">Export Options</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              CSV format includes all analysis data with improved formatting for integration with photogrammetry software. 
              Full report provides detailed recommendations and statistics in text format.
              {missionData.name && (
                <span className="block mt-2 text-blue-400 font-medium">
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

const generateReportText = (report: any, threshold: number): string => {
  let content = 'DRONE IMAGE QUALITY ANALYSIS REPORT\n';
  content += '=====================================\n\n';
  
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