const fs = require('fs');
const path = require('path');

class ImageOptimizer {
  constructor() {
    this.maxWidth = 1920; // 최대 가로 크기
    this.maxHeight = 1080; // 최대 세로 크기
    this.jpegQuality = 85; // JPEG 품질 (85%)
    this.enableWebP = true; // WebP 지원
  }

  // 이미지 메타데이터 추출 (간단한 구현)
  async getImageInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        size: stats.size,
        extension: ext,
        lastModified: stats.mtime,
        isImage: ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
      };
    } catch (error) {
      console.error('이미지 정보 추출 실패:', error);
      return null;
    }
  }

  // 이미지 크기 최적화 (클라이언트 측에서 압축된 이미지 처리)
  async optimizeImageFile(inputPath, outputPath = null, options = {}) {
    try {
      const output = outputPath || inputPath;
      const info = await this.getImageInfo(inputPath);
      
      if (!info || !info.isImage) {
        throw new Error('유효한 이미지 파일이 아닙니다.');
      }

      // 파일 크기가 이미 작으면 최적화 스킵
      const maxFileSize = options.maxFileSize || 2 * 1024 * 1024; // 2MB
      if (info.size <= maxFileSize) {
        console.log('이미지가 이미 최적화되었습니다:', inputPath);
        return {
          optimized: false,
          originalSize: info.size,
          finalSize: info.size,
          savings: 0
        };
      }

      // 실제 압축은 클라이언트에서 browser-image-compression으로 처리
      // 서버에서는 추가 검증 및 메타데이터 처리
      
      return {
        optimized: true,
        originalSize: info.size,
        finalSize: info.size,
        savings: 0,
        note: 'Client-side compression used'
      };
      
    } catch (error) {
      console.error('이미지 최적화 실패:', error);
      throw error;
    }
  }

  // 썸네일 생성 (간단한 구현 - 실제로는 sharp 등 사용 권장)
  async generateThumbnail(inputPath, outputPath, width = 200, height = 200) {
    try {
      // 썸네일 생성 로직은 클라이언트에서 Canvas API로 처리
      console.log(`썸네일 생성 요청: ${inputPath} -> ${outputPath} (${width}x${height})`);
      
      // 파일 복사로 대체 (실제 환경에서는 이미지 처리 라이브러리 사용)
      fs.copyFileSync(inputPath, outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('썸네일 생성 실패:', error);
      throw error;
    }
  }

  // 이미지 캐시 헤더 설정
  getImageCacheHeaders(req) {
    const oneYear = 365 * 24 * 60 * 60; // 1년
    const oneMonth = 30 * 24 * 60 * 60; // 1개월
    
    return {
      'Cache-Control': `public, max-age=${oneMonth}, immutable`,
      'Expires': new Date(Date.now() + oneMonth * 1000).toUTCString(),
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    };
  }

  // 이미지 포맷 최적화 추천
  getOptimalFormat(userAgent, originalFormat) {
    const supportsWebP = userAgent && userAgent.includes('Chrome');
    const supportsAVIF = userAgent && userAgent.includes('Chrome/') && 
                        parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || 0) >= 85;
    
    if (supportsAVIF && this.enableWebP) {
      return 'avif';
    } else if (supportsWebP && this.enableWebP) {
      return 'webp';
    }
    
    return originalFormat;
  }

  // 반응형 이미지 크기 생성
  generateResponsiveSizes(originalWidth, originalHeight) {
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 300, height: 300 },
      { name: 'medium', width: 600, height: 600 },
      { name: 'large', width: 1200, height: 1200 }
    ];

    return sizes.filter(size => 
      size.width <= originalWidth && size.height <= originalHeight
    );
  }

  // 지연 로딩을 위한 base64 플레이스홀더 생성
  generatePlaceholder(width = 20, height = 20) {
    // SVG 플레이스홀더 생성
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="12">
          로딩중...
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  // 이미지 최적화 통계
  getOptimizationStats() {
    return {
      totalProcessed: 0,
      totalSavings: 0,
      averageSavings: 0,
      lastOptimized: null
    };
  }
}

module.exports = new ImageOptimizer();