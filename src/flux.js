// FLUX backend: Groq chat, speech input (STT) and speech output (TTS).

export const MODEL = 'qwen/qwen3.8-27b'
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT =
  'You are Flux, an ultra-advanced artificial intelligence modeled after J.A.R.V.I.S. ' +
      'You are impeccably polite, hyper-competent, and fiercely loyal, but you possess a dry, sophisticated wit and aren\'t afraid to deliver subtle roasts when the user asks redundant questions or makes avoidable errors. ' +
      'Keep replies short and conversational because they are spoken aloud. ' +
      'Do not use markdown, lists, asterisks or emojis.'

export const STATUS = {
  ready: { label: 'SYSTEM READY', color: '#00f2ff' },
  listening: { label: 'LISTENING...', color: '#ff0055' },
  processing: { label: 'PROCESSING...', color: '#38bdf8' },
  speaking: { label: 'SPEAKING...', color: '#00ff88' },
}

/* ---------- Groq ---------- */

export async function askGroq(history) {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key) {
    throw new Error('System error, core hasnt loaded. Check core if fully loadedd.')
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: import.meta.env.VITE_GROQ_MODEL || MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-20)],
      temperature: 0.7,
      max_tokens: 600,
    }),
  })

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const j = await res.json()
      if (j?.error?.message) detail = j.error.message
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  const data = await res.json()
  const raw = data?.choices?.[0]?.message?.content ?? ''
  // Some Qwen models emit <think> blocks; they should never be shown or spoken.
  return raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

/* ---------- text cleaner for TTS ---------- */

export function cleanForSpeech(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/[*_#~`]/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/* ---------- speech output (en-AU) ---------- */

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
if (synth) {
  synth.getVoices()
  synth.onvoiceschanged = () => synth.getVoices()
}

let token = 0 // lets us ignore callbacks from utterances that were cancelled

export function stopSpeech() {
  token++
  if (synth) synth.cancel()
}

// Mobile browsers only allow speech after a user gesture; call this inside the tap/click.
export function unlockSpeech() {
  if (!synth) return
  const u = new SpeechSynthesisUtterance('')
  u.volume = 0
  synth.speak(u)
}

export function speakText(text, { onStart, onEnd } = {}) {
  if (!synth || !text) {
    onEnd?.()
    return
  }
  const my = ++token
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const voices = synth.getVoices()
  const auVoice = voices.find(
    (v) =>
      v.lang === 'en-AU' ||
      v.name.includes('Australia') ||
      v.name.includes('Karen') ||
      v.name.includes('Natasha')
  )
  if (auVoice) utterance.voice = auVoice
  utterance.lang = 'en-AU'

  utterance.onstart = () => token === my && onStart?.()
  utterance.onend = () => token === my && onEnd?.()
  utterance.onerror = () => token === my && onEnd?.()
  synth.speak(utterance)
}

/* ---------- speech input (en-AU, single shot) ---------- */

export const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
