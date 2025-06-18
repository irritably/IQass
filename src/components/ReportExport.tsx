import React from 'react';
import { ImageAnalysis } from '../types';
import { Download, FileText, Package } from 'lucide-react';
import { exportQualityDataToCSV, generateQualityReport } from '../utils/qualityAssessment';

interface ReportExportProps {
  analyses: ImageAnalysis[];
  threshold: number;
}

export const ReportExport: React.FC<ReportExportProps> = ({ analyses, threshold }) => {
  /**
   * Handles CSV export of analysis data
   */
  const handleExportCSV = () => {
    exportQualityDataToCSV(analyses, threshold);
  };

  /**
   * Handles full report export as text file
   */
  const handleExportReport = () => {
    const report = generateQualityReport(analyses, threshold);
    const reportContent = generateReportText(report, threshold);

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drone_image_quality_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (analyses.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Results</h3>
      
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
              CSV format includes all analysis data for integration with software. 
              Full report provides detailed recommendations and statistics in text format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Generates formatted text report content
 * @param report - Quality report data
 * @param threshold - Quality threshold used
 * @returns Formatted report text
 */
const generateReportText = (report: any, threshold: number): string => {
  return `
DRONE IMAGE QUALITY ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Threshold: ${threshold}

SUMMARY STATISTICS
==================
Total Images: ${report.stats.totalImages}
Average Blur Score: ${report.stats.averageBlurScore.toFixed(2)}
Average Composite Score: ${report.stats.averageCompositeScore.toFixed(2)}
Recommended for Use: ${report.stats.recommendedForReconstruction} (${((report.stats.recommendedForReconstruction / report.stats.totalImages) * 100).toFixed(1)}%)

QUALITY DISTRIBUTION
===================
Excellent (85-100): ${report.stats.excellentCount}
Good (70-84): ${report.stats.goodCount}
Acceptable (55-69): ${report.stats.acceptableCount}
Poor (40-54): ${report.stats.poorCount}
Unsuitable (0-39): ${report.stats.unsuitableCount}

DETAILED RESULTS
===============
${report.recommendations.map((r: any) => 
  `${r.filename}: Composite ${r.compositeScore} | Blur ${r.blurScore} | Exposure ${r.exposureScore} | Noise ${r.noiseScore} (${r.quality}) - ${r.recommended ? 'RECOMMENDED' : 'NOT RECOMMENDED'}`
).join('\n')}

RECOMMENDATIONS
==============
- Use images with composite scores ≥ ${threshold} for your applications
- Consider retaking images with scores below ${threshold}
- For high-precision work, consider using only images with scores ≥ 70
- Review images flagged as "poor" or "unsuitable" for potential issues
- Pay attention to exposure and noise scores for overall image quality
    `;
};