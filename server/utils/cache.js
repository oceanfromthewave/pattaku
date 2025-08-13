// 메모리 기반 캐싱 시스템
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.maxSize = 1000; // 최대 캐시 항목 수
    this.defaultTTL = 300000; // 5분 기본 TTL
  }

  set(key, value, ttl = this.defaultTTL) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    // 기존 타이머 제거
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // 값 저장
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });

    // TTL 타이머 설정
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }

    return true;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 접근 횟수 증가
    item.accessCount++;
    item.lastAccess = Date.now();
    
    return item.value;
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    // 타이머 제거
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    return this.cache.delete(key);
  }

  clear() {
    // 모든 타이머 제거
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  // LRU 기반 가장 오래된 항목 제거
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      const lastAccess = value.lastAccess || value.timestamp;
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // 캐시 통계
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%'
    };
  }

  // 메모리 사용량 최적화
  optimize() {
    const now = Date.now();
    const oneHour = 3600000;

    for (const [key, value] of this.cache.entries()) {
      const lastAccess = value.lastAccess || value.timestamp;
      
      // 1시간 이상 접근되지 않은 항목 제거
      if (now - lastAccess > oneHour) {
        this.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스
const cache = new MemoryCache();

// 주기적 최적화 (10분마다)
setInterval(() => {
  cache.optimize();
  console.log('🧹 캐시 최적화 완료:', cache.getStats());
}, 600000);

module.exports = cache;