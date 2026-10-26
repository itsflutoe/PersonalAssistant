import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { chat } from './server/groq.js'

// Serves POST /api/chat in `npm run dev` and `npm run preview`, the same way
// api/chat.js does on Vercel, so the Groq key never has to be in the browser.
function apiPlugin(env) {
  const attach = (server) => {
    server.middlewares.use('/api/chat', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end()
        return
      }
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', async () => {
        let body = {}
        try {
          body = JSON.parse(raw || '{}')
        } catch {
          /* empty body */
        }
        const out = await chat(body, env.GROQ_API_KEY, env.GROQ_MODEL)
        res.statusCode = out.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(out.json))
      })
    })
  }
  return { name: 'flux-api', configureServer: attach, configurePreviewServer: attach }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // reads .env, including non-VITE_ keys
  return {
    plugins: [react(), apiPlugin(env)],
    base: './',
  }
})
