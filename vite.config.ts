import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const HEALTH_RESPONSE = JSON.stringify({ status: "ok" })

function createHealthMiddleware() {
  return (req: { method?: string; url?: string }, res: {
    statusCode: number
    setHeader: (name: string, value: string) => void
    end: (chunk: string) => void
  }, next: () => void) => {
    const pathname = req.url?.split("?", 1)[0]

    if (req.method === "GET" && pathname === "/health") {
      res.statusCode = 200
      res.setHeader("Content-Type", "application/json; charset=utf-8")
      res.end(HEALTH_RESPONSE)
      return
    }

    next()
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "health-endpoint",
      configureServer(server) {
        server.middlewares.use(createHealthMiddleware())
      },
      configurePreviewServer(server) {
        server.middlewares.use(createHealthMiddleware())
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
