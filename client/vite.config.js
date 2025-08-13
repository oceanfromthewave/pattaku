import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  console.log('🏗️ Vite 빌드 모드:', mode);
  
  // 🚨 EMERGENCY - 무조건 Render URL 강제 설정
  const FORCED_RENDER_URL = 'https://pattaku.onrender.com';
  
  console.log('🔥 FORCED API URL:', FORCED_RENDER_URL);

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
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          // 청크 분할로 로딩 성능 향상
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
            charts: ['chart.js', 'react-chartjs-2'],
            icons: ['lucide-react', '@mui/icons-material'],
            utils: ['axios', 'socket.io-client', 'react-router-dom'],
            toast: ['react-toastify']
          },
          // 파일명 최적화
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
      },
      // 청크 크기 제한
      chunkSizeWarningLimit: 1000,
    },
    define: {
      // 🚨 모든 환경에서 강제로 Render URL 사용
      'import.meta.env.VITE_API_URL': JSON.stringify(FORCED_RENDER_URL),
      'import.meta.env.VITE_UPLOADS_URL': JSON.stringify(FORCED_RENDER_URL + '/uploads'),
      'import.meta.env.VITE_WS_URL': JSON.stringify('wss://pattaku.onrender.com'),
      // 추가 보안
      'window.EMERGENCY_API_URL': JSON.stringify(FORCED_RENDER_URL),
    },
  };
});
