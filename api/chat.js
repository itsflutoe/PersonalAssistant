// Vercel serverless function: POST /api/chat
import { chat } from '../server/groq.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'POST only' } })
  }
  const out = await chat(req.body, process.env.GROQ_API_KEY, process.env.GROQ_MODEL)
  res.status(out.status).json(out.json)
}
