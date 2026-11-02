import path from "path"
import crypto from "crypto"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// Content Security Policy for the production build: the browser only runs our own scripts and only
// talks to our API, so even injected HTML could not load or send anything elsewhere.
const contentSecurityPolicy = apiUrl => ({
  name: "medora-csp",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler(html) {
      // the small inline theme script is allowed by its exact hash, nothing else inline can run.
      // Browsers read Windows line endings as "\n" before hashing, so the hash is taken the same way
      const inlineHashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
        ([, code]) => `'sha256-${crypto.createHash("sha256").update(code.replace(/\r\n?/g, "\n")).digest("base64")}'`
      )
      const api = apiUrl ? new URL(apiUrl).origin : "http://localhost:5000"
      const socket = api.replace(/^http/, "ws")
      const policy = [
        "default-src 'self'",
        `script-src 'self' ${inlineHashes.join(" ")}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://res.cloudinary.com",
        `connect-src 'self' ${api} ${socket} https://api.cloudinary.com`,
        "frame-src 'none'",
        "media-src 'self' blob:",
        "object-src 'self' blob:",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")
      return html.replace(/<meta charset="UTF-8" \/>/, match => `${match}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
    },
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_")
  return {
    plugins: [react(), contentSecurityPolicy(env.VITE_API_URL)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // nothing is written to the browser console in the production build
    esbuild: mode === "production" ? { drop: ["console", "debugger"] } : undefined,
    build: {
      rollupOptions: {
        output: {
          // libraries in their own files: they rarely change, so browsers keep them cached between deploys,
          // and all icons in one file instead of dozens of tiny ones
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined
            if (id.includes("lucide-react")) return "icons"
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(id)) return "react"
            if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "motion"
            if (/[\\/]node_modules[\\/](socket\.io-client|engine\.io-client|socket\.io-parser|engine\.io-parser|@socket\.io)[\\/]/.test(id)) return "socket"
            return undefined
          },
        },
      },
    },
  }
})
