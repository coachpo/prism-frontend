import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const backendPort = process.env.BACKEND_PORT ?? "8000"
const proxyTarget = process.env.VITE_PROXY_TARGET ?? `http://localhost:${backendPort}`

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": { target: proxyTarget, changeOrigin: true },
      "/v1": { target: proxyTarget, changeOrigin: true },
      "/v1beta": { target: proxyTarget, changeOrigin: true },
      "/health": { target: proxyTarget, changeOrigin: true },
      "/docs": { target: proxyTarget, changeOrigin: true },
      "/redoc": { target: proxyTarget, changeOrigin: true },
      "/openapi.json": { target: proxyTarget, changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
