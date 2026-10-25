import { useEffect, useState, useRef, useCallback } from 'react'

export function useClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export function useSpeechRecognition({ onResult, onStart, onEnd, onError } = {}) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onstart = () => { setListening(true); onStart?.() }
    rec.onend = () => { setListening(false); onEnd?.() }
    rec.onerror = (e) => { setListening(false); onError?.(e) }
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript
      if (text) onResult?.(text)
    }
    recRef.current = rec
    return () => { try { rec.abort() } catch {} }
  }, [onResult, onStart, onEnd, onError])

  const start = useCallback(() => {
    try { recRef.current?.start() } catch {}
  }, [])
  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch {}
  }, [])

  return {
    listening,
    start,
    stop,
    supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }
}
