// Server-side Groq call. The API key lives only here (never in the browser bundle).
// Used by api/chat.js on Vercel and by the dev/preview middleware in vite.config.js.

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'qwen/qwen3.8-27b'

const SYSTEM_PROMPT =
  'You are Flux, an articulate, sharp, concise and helpful AI companion. ' +
  'Keep replies short and conversational because they are spoken aloud. ' +
  'Do not use markdown, lists, asterisks or emojis.'

const fail = (status, message) => ({ status, json: { error: { message } } })

export async function chat(body, key, model) {
  if (!key) return fail(500, 'Server has no GROQ_API_KEY set. Add it to .env (local) or the Vercel project settings.')

  const messages = Array.isArray(body?.messages)
    ? body.messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    : []
  if (!messages.length) return fail(400, 'No messages provided.')

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(25000),
    })
    const text = await res.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      json = { error: { message: text.slice(0, 200) || `${res.status} ${res.statusText}` } }
    }
    return { status: res.status, json }
  } catch (e) {
    return fail(502, `Upstream request failed: ${e?.message || e}`)
  }
}
