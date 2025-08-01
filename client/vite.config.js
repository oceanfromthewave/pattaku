import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  console.log('🏗️ Vite 빌드 모드:', mode);
  
  // 프로덕션 환경변수 강제 설정
  const productionEnv = {
    VITE_API_URL: 'https://pattaku.onrender.com',
    VITE_UPLOADS_URL: 'https://pattaku.onrender.com/uploads',
    VITE_WS_URL: 'wss://pattaku.onrender.com'
  };

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": "http://localhost:5000",
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    define: {
      // 프로덕션 모드에서는 강제로 설정
      ...(mode === 'production' && {
        'import.meta.env.VITE_API_URL': JSON.stringify(productionEnv.VITE_API_URL),
        'import.meta.env.VITE_UPLOADS_URL': JSON.stringify(productionEnv.VITE_UPLOADS_URL),
        'import.meta.env.VITE_WS_URL': JSON.stringify(productionEnv.VITE_WS_URL),
      }),
      // 개발 모드에서는 기본 환경변수 사용
      ...(mode === 'development' && {
        'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000'),
        'import.meta.env.VITE_UPLOADS_URL': JSON.stringify(process.env.VITE_UPLOADS_URL || 'http://localhost:5000/uploads'),
        'import.meta.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || 'ws://localhost:5000'),
      })
    },
  };
});
