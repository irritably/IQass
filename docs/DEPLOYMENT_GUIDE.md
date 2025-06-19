# Deployment Guide - Drone Image Quality Analyzer

## Overview

This guide provides comprehensive instructions for deploying the Drone Image Quality Analyzer in various environments, from development to production. The application is designed as a static web application that can be deployed to any modern web hosting platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Process](#build-process)
3. [Deployment Options](#deployment-options)
4. [Environment Configuration](#environment-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Security Considerations](#security-considerations)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Development Environment:**
- Node.js 18.0 or higher
- npm 8.0 or higher
- Git (for version control)
- Modern web browser for testing

**Production Environment:**
- Static web hosting service
- HTTPS support (required for WebGL and File API)
- CDN support (recommended for global distribution)

### Browser Compatibility

| Browser | Minimum Version | Recommended | Notes |
|---------|----------------|-------------|-------|
| Chrome | 90+ | Latest | Best performance with WebGL |
| Firefox | 88+ | Latest | Full feature support |
| Safari | 14+ | Latest | WebKit optimizations |
| Edge | 90+ | Latest | Chromium-based versions |

---

## Build Process

### Development Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

### Production Build

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview

# Build output will be in the 'dist' directory
```

### Build Configuration

The build process is configured in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,        // Disabled for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['exifr', 'lucide-react']
        }
      }
    }
  },
  server: {
    fs: { strict: false }
  }
});
```

### Build Optimization

**Automatic Optimizations:**
- Tree shaking for minimal bundle size
- Code splitting for optimal loading
- Asset optimization and compression
- Modern ES modules output

**Manual Optimizations:**
- WebGL shader minification
- Image asset optimization
- Service worker integration (future)

---

## Deployment Options

### 1. Netlify (Recommended)

**Advantages:**
- Automatic builds from Git
- Global CDN distribution
- HTTPS by default
- Branch previews

**Deployment Steps:**

1. **Connect Repository:**
   ```bash
   # Push code to Git repository
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Configure Netlify:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

3. **Environment Variables:**
   ```
   NODE_VERSION=18
   NPM_VERSION=8
   ```

4. **Deploy:**
   - Automatic deployment on push
   - Manual deployment via Netlify CLI

### 2. Vercel

**Deployment Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configuration (vercel.json):**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

### 3. GitHub Pages

**Deployment Steps:**

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add Deploy Script:**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### 4. AWS S3 + CloudFront

**Deployment Steps:**

1. **Build Application:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **Configure CloudFront:**
   - Origin: S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Compress Objects Automatically: Yes

### 5. Docker Deployment

**Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Environment Configuration

### Production Environment Variables

```bash
# Build environment
NODE_ENV=production
VITE_APP_VERSION=2.0.0
VITE_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Feature flags
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_REPORTING=true
```

### Configuration Files

**Production Config (`src/config/production.ts`):**
```typescript
export const productionConfig = {
  logging: {
    level: 'warn',
    enableConsole: false,
    enableRemote: true
  },
  performance: {
    enableBenchmarking: true,
    enableGPUAcceleration: true,
    maxImageSize: 1600
  },
  features: {
    debugVisualization: false,
    performancePanel: false,
    advancedSettings: false
  }
};
```

---

## Performance Optimization

### 1. Asset Optimization

**Image Optimization:**
```bash
# Optimize images before deployment
npm install -g imagemin-cli
imagemin src/assets/*.{jpg,png} --out-dir=dist/assets --plugin=imagemin-mozjpeg --plugin=imagemin-pngquant
```

**Bundle Analysis:**
```bash
# Analyze bundle size
npm run build -- --analyze
```

### 2. CDN Configuration

**Recommended CDN Settings:**
- Cache static assets for 1 year
- Enable gzip/brotli compression
- Use HTTP/2 push for critical resources
- Implement proper cache headers

**Cache Headers:**
```
# Static assets
Cache-Control: public, max-age=31536000, immutable

# HTML files
Cache-Control: public, max-age=0, must-revalidate

# Service worker
Cache-Control: public, max-age=0
```

### 3. Performance Monitoring

**Core Web Vitals Targets:**
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

**Monitoring Tools:**
- Google PageSpeed Insights
- WebPageTest
- Lighthouse CI
- Real User Monitoring (RUM)

---

## Security Considerations

### 1. Content Security Policy (CSP)

**Recommended CSP Header:**
```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: blob:; 
  connect-src 'self'; 
  worker-src 'self' blob:;
```

### 2. Security Headers

**Essential Headers:**
```
# Prevent clickjacking
X-Frame-Options: DENY

# XSS protection
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block

# HTTPS enforcement
Strict-Transport-Security: max-age=31536000; includeSubDomains

# Referrer policy
Referrer-Policy: strict-origin-when-cross-origin
```

### 3. Privacy Considerations

**Data Handling:**
- All processing occurs client-side
- No data transmitted to servers
- No persistent storage of user data
- EXIF data processed locally only

**GDPR Compliance:**
- No cookies or tracking
- No personal data collection
- Local processing only
- User consent not required

---

## Monitoring & Maintenance

### 1. Health Monitoring

**Key Metrics to Monitor:**
- Application load time
- Error rates and types
- WebGL compatibility rates
- Browser usage statistics
- Performance benchmarks

**Monitoring Setup:**
```javascript
// Error tracking
window.addEventListener('error', (event) => {
  // Log to monitoring service
  console.error('Application error:', event.error);
});

// Performance monitoring
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  // Send performance data to monitoring service
});
```

### 2. Update Strategy

**Deployment Pipeline:**
1. Development → Staging → Production
2. Automated testing at each stage
3. Gradual rollout with monitoring
4. Rollback capability

**Version Management:**
```bash
# Semantic versioning
npm version patch  # Bug fixes
npm version minor  # New features
npm version major  # Breaking changes
```

### 3. Backup & Recovery

**Static Site Backup:**
- Source code in version control
- Build artifacts in CI/CD pipeline
- Configuration backups
- Deployment scripts

**Recovery Procedures:**
1. Identify issue scope
2. Rollback to previous version
3. Investigate root cause
4. Deploy fix
5. Monitor for stability

---

## Troubleshooting

### Common Deployment Issues

#### 1. Build Failures

**Symptom:** Build process fails with errors
**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+

# Verify dependencies
npm audit fix
```

#### 2. WebGL Not Working

**Symptom:** GPU acceleration unavailable
**Solutions:**
- Ensure HTTPS deployment
- Check browser WebGL support
- Verify CSP allows WebGL
- Test on different devices

#### 3. File Upload Issues

**Symptom:** Cannot upload large files
**Solutions:**
- Check server upload limits
- Verify client-side file size limits
- Test with different file types
- Monitor browser memory usage

#### 4. Performance Issues

**Symptom:** Slow loading or processing
**Solutions:**
- Enable CDN and compression
- Optimize image assets
- Check WebGL acceleration
- Monitor memory usage

### Debug Mode

**Enable Debug Mode:**
```bash
# Development environment
VITE_ENABLE_DEBUG_MODE=true npm run dev
```

**Debug Features:**
- Detailed console logging
- Performance metrics display
- WebGL shader visualization
- Memory usage monitoring

### Support Resources

**Documentation:**
- Technical Architecture Guide
- API Reference
- Performance Optimization Guide
- Security Best Practices

**Community:**
- GitHub Issues for bug reports
- Discussions for feature requests
- Wiki for community documentation

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Drone Image Quality Analyzer in production environments. The application's static nature makes it highly portable and easy to deploy across various platforms while maintaining excellent performance and security.

For additional support or questions about deployment, please refer to the project documentation or create an issue in the repository.