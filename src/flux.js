// FLUX client: calls our own /api/chat proxy (which holds the Groq key),
// plus speech input (STT) and speech output (TTS).

export const STATUS = {
  ready: { label: 'SYSTEM READY', color: '#00f2ff' },
  listening: { label: 'LISTENING...', color: '#ff0055' },
  processing: { label: 'PROCESSING...', color: '#38bdf8' },
  speaking: { label: 'SPEAKING...', color: '#00ff88' },
}

const REQUEST_TIMEOUT = 30000

// Removes <think> blocks, including one that was cut off before it closed.
const stripThink = (t) =>
  t.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').trim()

/* ---------- chat ---------- */

export async function askGroq(history, signal) {
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    ctrl.abort()
  }, REQUEST_TIMEOUT)
  const onAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onAbort)

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-20) }),
      signal: ctrl.signal,
    })

    let data = null
    try {
      data = await res.json()
    } catch {
      /* non-JSON body */
    }

    if (!res.ok) {
      throw new Error(
        data?.error?.message ||
          (res.status === 404
            ? 'The /api/chat backend was not found. Deploy the api folder or use npm run dev.'
            : `${res.status} ${res.statusText}`)
      )
    }

    const choice = data?.choices?.[0]
    const raw = stripThink(choice?.message?.content ?? '')
    if (!raw) {
      throw new Error(
        choice?.finish_reason === 'length'
          ? 'The reply was cut off before it finished. Try a shorter question.'
          : 'The model returned an empty reply.'
      )
    }
    return raw
  } catch (e) {
    // A user cancel is rethrown as-is (name "AbortError"); App.jsx shows "Request cancelled."
    if (e.name === 'AbortError' && timedOut) throw new Error('The request timed out. Please try again.')
    throw e
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/* ---------- text cleaner for TTS ---------- */

export function cleanForSpeech(text) {
  return stripThink(text)
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

  let started = false
  let done = false
  let keepAlive
  let startGuard

  const finish = () => {
    if (done) return
    done = true
    clearInterval(keepAlive)
    clearTimeout(startGuard)
    if (token === my) onEnd?.()
  }

  utterance.onstart = () => {
    started = true
    clearTimeout(startGuard)
    if (token === my) onStart?.()
    // Chrome silently stops long utterances after ~15s unless nudged.
    keepAlive = setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause()
        synth.resume()
      }
    }, 10000)
  }
  utterance.onend = finish
  utterance.onerror = finish

  // Small gap after cancel(): speaking immediately after cancel() fails in some Chrome/Edge versions.
  setTimeout(() => {
    if (token !== my) return
    synth.speak(utterance)
    // If speech never begins (blocked by the browser), do not leave the HUD stuck.
    startGuard = setTimeout(() => {
      if (!started) {
        synth.cancel()
        finish()
      }
    }, 6000)
  }, 60)
}

/* ---------- speech input (en-AU, single shot) ---------- */

export const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
