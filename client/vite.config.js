import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
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
    // 환경변수를 빌드 시점에 확실히 적용
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || 'https://pattaku.onrender.com'),
    __VITE_UPLOADS_URL__: JSON.stringify(process.env.VITE_UPLOADS_URL || 'https://pattaku.onrender.com/uploads'),
    __VITE_WS_URL__: JSON.stringify(process.env.VITE_WS_URL || 'wss://pattaku.onrender.com'),
  },
});
