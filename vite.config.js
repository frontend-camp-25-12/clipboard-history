import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",

  // 关键配置
  build: {
    outDir: "dist",
    target: "esnext",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "./src/index.html"),
      },
    },
  },

  resolve: {
    alias: {
      // 确保路径解析正确
      "@": path.resolve(__dirname, "src"),
    },
  },

  // 添加 Electron 特殊处理
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
});
