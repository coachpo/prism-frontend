import { execSync } from "node:child_process"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const HEALTH_RESPONSE = JSON.stringify({ status: "ok" })
const GIT_REVISION = resolveGitRevision()

function resolveGitRevision() {
  const revisionFromEnv =
    process.env.VITE_GIT_REVISION?.trim() || process.env.GIT_REVISION?.trim()
  if (revisionFromEnv) {
    return revisionFromEnv
  }

  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim()
  } catch {
    return "unknown"
  }
}

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
  define: {
    "import.meta.env.VITE_GIT_REVISION": JSON.stringify(GIT_REVISION),
  },
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
