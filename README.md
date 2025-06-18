# Drone Image Quality Analyzer

A professional-grade web application for analyzing the quality of drone imagery for photogrammetric reconstruction. This tool provides comprehensive quality assessment including blur detection, exposure analysis, noise evaluation, and feature extraction to help drone operators and photogrammetrists make informed decisions about image suitability for 3D reconstruction projects.

## Key Features

- **Comprehensive Quality Analysis**: Multi-metric evaluation including blur detection, exposure analysis, noise assessment, and feature extraction
- **Batch Processing**: Efficient processing of multiple images with real-time progress tracking
- **Photogrammetric Assessment**: Specialized analysis for 3D reconstruction suitability with keypoint detection and descriptor quality evaluation
- **Interactive Results**: Detailed technical panels with progressive disclosure and visual quality indicators
- **Export Capabilities**: CSV and detailed report export for integration with photogrammetry workflows
- **Responsive Design**: Optimized for desktop and tablet use in field conditions
- **Real-time Feedback**: Live progress tracking with ETA calculations and processing speed metrics

## Installation

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- Modern web browser with Canvas API support

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd drone-image-quality-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173` in your web browser

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Requirements

### System Requirements
- **RAM**: Minimum 4GB, recommended 8GB+ for large image batches
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Storage**: 100MB+ free space for temporary processing

### Dependencies
- **React 18.3.1**: UI framework
- **TypeScript 5.5.3**: Type safety and development experience
- **Tailwind CSS 3.4.1**: Styling and responsive design
- **Vite 5.4.2**: Build tool and development server
- **exifr 7.1.3**: EXIF metadata extraction
- **lucide-react 0.344.0**: Icon library

## Quick Start Guide

### Basic Usage

1. **Upload Images**
   - Drag and drop drone images onto the upload area
   - Or click "Browse Files" to select images
   - Supported formats: JPG, PNG, TIFF (max 50MB per file)

2. **Configure Analysis**
   - Set quality threshold (default: 70)
   - Review file previews and remove any unwanted images
   - Click "Start Analysis" to begin processing

3. **Review Results**
   - Monitor real-time progress with ETA estimates
   - View quality overview with pass/fail statistics
   - Examine individual image details in the grid view

4. **Export Data**
   - Export CSV for integration with photogrammetry software
   - Generate detailed reports for documentation
   - Filter and sort results by quality metrics

### Example Workflow

```typescript
// Typical analysis workflow
1. Upload batch of 50-100 drone images
2. Set threshold to 70 for high-precision work
3. Start analysis (estimated 5-10 minutes)
4. Review 85% pass rate in overview
5. Examine failed images for retake planning
6. Export recommended images to Pix4D/Metashape
```

## Project Structure

```
src/
├── components/           # React components
│   ├── FileUpload.tsx   # File upload and preview
│   ├── ProgressBar.tsx  # Processing progress
│   ├── ImageGrid.tsx    # Results display
│   └── ...
├── utils/               # Core algorithms
│   ├── imageAnalysis.ts # Main analysis pipeline
│   ├── descriptorAnalysis.ts # Feature detection
│   ├── exposureAnalysis.ts   # Exposure evaluation
│   └── ...
├── types/               # TypeScript definitions
├── hooks/               # Custom React hooks
└── main.tsx            # Application entry point
```

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React hooks rules
- **Modular Architecture**: Clean separation of concerns
- **Performance**: Optimized for large image processing

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 90+           | Recommended for best performance |
| Firefox | 88+           | Full feature support |
| Safari  | 14+           | WebKit optimizations |
| Edge    | 90+           | Chromium-based versions |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the UX improvement plan for feature roadmap

## Acknowledgments

- Built with modern web technologies for cross-platform compatibility
- Optimized for professional drone operators and photogrammetrists
- Designed following industry best practices for image quality assessment