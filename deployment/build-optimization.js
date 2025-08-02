const fs = require('fs');
const path = require('path');
const { gzipSync, brotliCompressSync } = require('zlib');

/**
 * Build optimization script for Korea Promise Tracker
 * Optimizes assets for AWS deployment with S3 + CloudFront
 */

class BuildOptimizer {
  constructor(buildPath = 'build') {
    this.buildPath = buildPath;
    this.stats = {
      originalSize: 0,
      compressedSize: 0,
      files: []
    };
  }

  /**
   * Main optimization process
   */
  async optimize() {
    console.log('🚀 Starting build optimization...');
    
    try {
      await this.compressAssets();
      await this.generateManifest();
      await this.optimizeImages();
      await this.generateServiceWorker();
      await this.createSecurityHeaders();
      
      this.printStats();
      console.log('✅ Build optimization completed successfully!');
    } catch (error) {
      console.error('❌ Build optimization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Compress static assets with gzip and brotli
   */
  async compressAssets() {
    console.log('📦 Compressing static assets...');
    
    const staticDir = path.join(this.buildPath, 'static');
    if (!fs.existsSync(staticDir)) return;

    const extensions = ['.js', '.css', '.html', '.json', '.svg'];
    
    await this.walkDirectory(staticDir, (filePath) => {
      const ext = path.extname(filePath);
      if (!extensions.includes(ext)) return;

      const content = fs.readFileSync(filePath);
      this.stats.originalSize += content.length;

      // Gzip compression
      const gzipped = gzipSync(content, { level: 9 });
      fs.writeFileSync(`${filePath}.gz`, gzipped);

      // Brotli compression
      const brotli = brotliCompressSync(content, {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
          [require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: content.length
        }
      });
      fs.writeFileSync(`${filePath}.br`, brotli);

      this.stats.compressedSize += Math.min(gzipped.length, brotli.length);
      this.stats.files.push({
        path: filePath,
        original: content.length,
        gzip: gzipped.length,
        brotli: brotli.length
      });
    });
  }

  /**
   * Generate asset manifest for cache busting
   */
  async generateManifest() {
    console.log('📋 Generating asset manifest...');
    
    const manifest = {
      version: Date.now(),
      assets: {},
      integrity: {}
    };

    await this.walkDirectory(this.buildPath, (filePath) => {
      const relativePath = path.relative(this.buildPath, filePath);
      const content = fs.readFileSync(filePath);
      
      // Generate integrity hash
      const crypto = require('crypto');
      const hash = crypto.createHash('sha384').update(content).digest('base64');
      
      manifest.assets[relativePath] = {
        size: content.length,
        hash: crypto.createHash('md5').update(content).digest('hex'),
        integrity: `sha384-${hash}`
      };
    });

    fs.writeFileSync(
      path.join(this.buildPath, 'asset-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  /**
   * Optimize images (placeholder - would use imagemin in production)
   */
  async optimizeImages() {
    console.log('🖼️  Optimizing images...');
    
    // In production, you would use imagemin or similar
    // For now, just log what would be optimized
    const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    let imageCount = 0;

    await this.walkDirectory(this.buildPath, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (imageExts.includes(ext)) {
        imageCount++;
      }
    });

    console.log(`📊 Found ${imageCount} images to optimize`);
  }

  /**
   * Generate service worker for offline caching
   */
  async generateServiceWorker() {
    console.log('⚙️  Generating service worker...');
    
    const swContent = `
const CACHE_NAME = 'korea-promise-tracker-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/korea-map.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
`;

    fs.writeFileSync(path.join(this.buildPath, 'sw.js'), swContent);
  }

  /**
   * Create security headers configuration
   */
  async createSecurityHeaders() {
    console.log('🔒 Creating security headers...');
    
    const headers = {
      '/*': {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://firestore.googleapis.com;"
      },
      '/static/*': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '/*.html': {
        'Cache-Control': 'public, max-age=3600'
      },
      '/*.json': {
        'Cache-Control': 'public, max-age=86400'
      }
    };

    fs.writeFileSync(
      path.join(this.buildPath, '_headers'),
      Object.entries(headers)
        .map(([path, headers]) => 
          `${path}\n${Object.entries(headers).map(([key, value]) => `  ${key}: ${value}`).join('\n')}`
        )
        .join('\n\n')
    );
  }

  /**
   * Recursively walk directory
   */
  async walkDirectory(dir, callback) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await this.walkDirectory(filePath, callback);
      } else {
        callback(filePath);
      }
    }
  }

  /**
   * Print optimization statistics
   */
  printStats() {
    const compressionRatio = ((this.stats.originalSize - this.stats.compressedSize) / this.stats.originalSize * 100).toFixed(1);
    
    console.log('\n📊 Optimization Results:');
    console.log(`   Original size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`   Compressed size: ${this.formatBytes(this.stats.compressedSize)}`);
    console.log(`   Compression ratio: ${compressionRatio}%`);
    console.log(`   Files processed: ${this.stats.files.length}`);
    
    // Show top 5 largest files
    const topFiles = this.stats.files
      .sort((a, b) => b.original - a.original)
      .slice(0, 5);
      
    if (topFiles.length > 0) {
      console.log('\n📁 Largest files:');
      topFiles.forEach(file => {
        const savings = ((file.original - Math.min(file.gzip, file.brotli)) / file.original * 100).toFixed(1);
        console.log(`   ${path.basename(file.path)}: ${this.formatBytes(file.original)} → ${this.formatBytes(Math.min(file.gzip, file.brotli))} (${savings}% savings)`);
      });
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize();
}

module.exports = BuildOptimizer;