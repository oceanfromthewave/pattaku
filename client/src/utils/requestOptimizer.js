// 네트워크 요청 최적화 유틸리티

class RequestOptimizer {
  constructor() {
    this.cache = new Map(); // 응답 캐시
    this.pendingRequests = new Map(); // 진행중인 요청
    this.debounceTimers = new Map(); // 디바운스 타이머
    this.batchQueue = new Map(); // 배치 요청 큐
    this.defaultCacheTTL = 60000; // 1분 기본 캐시
  }

  // 중복 요청 방지
  async dedupeRequest(key, requestFn) {
    // 이미 진행중인 동일한 요청이 있으면 그 결과를 기다림
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 중복 요청 대기: ${key}`);
      return this.pendingRequests.get(key);
    }

    // 새로운 요청 시작
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // 응답 캐싱
  async cachedRequest(key, requestFn, ttl = this.defaultCacheTTL) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`🚀 캐시에서 반환: ${key}`);
      return cached.data;
    }

    const data = await this.dedupeRequest(key, requestFn);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // 디바운스된 요청
  debouncedRequest(key, requestFn, delay = 300) {
    return new Promise((resolve, reject) => {
      // 기존 타이머 클리어
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // 새로운 타이머 설정
      const timer = setTimeout(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  // 배치 요청 (여러 요청을 묶어서 처리)
  async batchRequest(batchKey, requestKey, requestFn, batchDelay = 50) {
    return new Promise((resolve, reject) => {
      // 배치 큐 초기화
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, {
          requests: new Map(),
          timer: null
        });
      }

      const batch = this.batchQueue.get(batchKey);
      
      // 요청을 배치에 추가
      batch.requests.set(requestKey, { requestFn, resolve, reject });

      // 기존 타이머 클리어
      if (batch.timer) {
        clearTimeout(batch.timer);
      }

      // 배치 처리 타이머 설정
      batch.timer = setTimeout(async () => {
        const requests = Array.from(batch.requests.entries());
        this.batchQueue.delete(batchKey);

        // 병렬로 모든 요청 실행
        const results = await Promise.allSettled(
          requests.map(([key, { requestFn }]) => 
            requestFn().then(result => ({ key, result }))
          )
        );

        // 결과를 각각의 Promise에 반환
        results.forEach((result, index) => {
          const [key, { resolve, reject }] = requests[index];
          
          if (result.status === 'fulfilled') {
            resolve(result.value.result);
          } else {
            reject(result.reason);
          }
        });
      }, batchDelay);
    });
  }

  // 검색 요청 최적화 (디바운스 + 캐시)
  async optimizedSearch(query, searchFn, delay = 500) {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      return [];
    }

    const cacheKey = `search:${trimmedQuery}`;
    const debounceKey = `search_debounce:${trimmedQuery}`;

    return this.debouncedRequest(
      debounceKey,
      () => this.cachedRequest(cacheKey, () => searchFn(trimmedQuery), 300000) // 5분 캐시
    );
  }

  // 무한 스크롤 요청 최적화
  async optimizedPagination(page, limit, baseCacheKey, requestFn) {
    const cacheKey = `${baseCacheKey}:${page}:${limit}`;
    
    return this.cachedRequest(
      cacheKey,
      () => requestFn(page, limit),
      180000 // 3분 캐시
    );
  }

  // 캐시 무효화
  invalidateCache(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 캐시 무효화: ${keysToDelete.length}개 항목 삭제`);
  }

  // 메모리 정리
  cleanup() {
    // 만료된 캐시 정리
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.defaultCacheTTL * 5) { // 5배 넘은 것들 정리
        this.cache.delete(key);
      }
    }

    // 모든 타이머 정리
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // 배치 큐 정리
    for (const batch of this.batchQueue.values()) {
      if (batch.timer) {
        clearTimeout(batch.timer);
      }
    }
    this.batchQueue.clear();
  }

  // 통계 정보
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      debounceTimers: this.debounceTimers.size,
      batchQueues: this.batchQueue.size
    };
  }
}

// 싱글톤 인스턴스
const requestOptimizer = new RequestOptimizer();

// 주기적 정리 (5분마다)
setInterval(() => {
  requestOptimizer.cleanup();
}, 300000);

export default requestOptimizer;