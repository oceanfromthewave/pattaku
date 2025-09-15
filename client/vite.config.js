import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  console.log("🏗️ Vite 빌드 모드:", mode);

  // 환경별 API URL 설정
  const isProduction = mode === "production";
  const API_BASE_URL = isProduction
    ? "https://pattaku.onrender.com"
    : "http://localhost:5000";

  const UPLOADS_URL = isProduction
    ? "https://pattaku.onrender.com/uploads"
    : "http://localhost:5000/uploads";

  const WS_URL = isProduction
    ? "wss://pattaku.onrender.com"
    : "ws://localhost:5000";

  console.log("🌐 API URL 설정:", {
    mode,
    API_BASE_URL,
    UPLOADS_URL,
    WS_URL,
  });

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
      target: "es2015",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          // 청크 분할로 로딩 성능 향상
          manualChunks: {
            vendor: ["react", "react-dom"],
            ui: ["@mui/material", "@emotion/react", "@emotion/styled"],
            charts: ["chart.js", "react-chartjs-2"],
            icons: ["lucide-react", "@mui/icons-material"],
            utils: ["axios", "socket.io-client", "react-router-dom"],
            toast: ["react-toastify"],
          },
          // 파일명 최적화
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      // 청크 크기 제한
      chunkSizeWarningLimit: 1000,
    },
    define: {
      // 환경별 API URL 설정
      "import.meta.env.VITE_API_URL": JSON.stringify(API_BASE_URL),
      "import.meta.env.VITE_UPLOADS_URL": JSON.stringify(UPLOADS_URL),
      "import.meta.env.VITE_WS_URL": JSON.stringify(WS_URL),
    },
  };
});
