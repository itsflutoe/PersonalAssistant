import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useStageScale } from './hooks.js'
import Orb from './Orb.jsx'
import { Background, Overlays, OrbRings, Platform, Connectors, Reticle } from './Decor.jsx'
import { SystemDiagnostics, NetworkStatus, AnalyticsA, AnalyticsB } from './Panels.jsx'
import { TextTerminal, CommandTerminal } from './Terminals.jsx'
import {
  askGroq,
  cleanForSpeech,
  speakText,
  stopSpeech,
  unlockSpeech,
  SpeechRecognitionCtor,
} from './flux.js'

// Static / slow-changing parts are memoised so the typewriter effect doesn't re-render them.
const MOrb = memo(Orb)
const MBackground = memo(Background)
const MOverlays = memo(Overlays)
const MOrbRings = memo(OrbRings)
const MPlatform = memo(Platform)
const MConnectors = memo(Connectors)
const MReticle = memo(Reticle)
const MDiag = memo(SystemDiagnostics)
const MNet = memo(NetworkStatus)
const MAnA = memo(AnalyticsA)
const MAnB = memo(AnalyticsB)

// desktop / laptop stage
const W = 1408
const H = 768
// phone stage (stacked layout)
const MW = 400
const MH = 1096

let uid = 0
const mk = (from, text, typing = false) => ({ id: ++uid, from, text, typing })

const INITIAL = [
  mk('ai', 'Hello, world. Systems are online and ready to enhance your technological experience with intelligence.'),
  mk('user', 'Run a system diagnostic.'),
  mk('ai', 'Diagnostics complete. All subsystems are within normal range. Shall I proceed with a deep scan?'),
  mk('user', 'Yes, please do.'),
]

// positions are kept at module level so the memoised components get stable props
const D = {
  diag: { left: 70, top: 76, width: 154, height: 100 },
  net: { left: 231, top: 76, width: 122, height: 100 },
  anA: { left: 70, top: 184, width: 154, height: 136 },
  anB: { left: 231, top: 184, width: 122, height: 136 },
  text: { left: 1010, top: 65, width: 335, height: 262 },
  cmd: { left: 298, top: 603, width: 812, height: 128 },
}

// Phone panels are magnified 1.25x (CSS zoom) so their small labels stay readable.
// zoom also scales left/top/width/height, so those are divided by Z to land on the intended spot.
const Z = 1.25
const zp = (left, top, width, height) => ({
  left: left / Z,
  top: top / Z,
  width: width / Z,
  height: height / Z,
  zoom: Z,
})
const M = {
  orb: { left: -20, top: -20, transform: 'scale(0.82)', transformOrigin: 'center' },
  rings: { left: -30, top: -30, transform: 'scale(0.82)', transformOrigin: 'center' },
  platform: { left: -60, top: 300, transform: 'scale(0.9)', transformOrigin: 'center' },
  diag: zp(16, 340, 180, 110),
  net: zp(210, 340, 170, 110),
  anA: zp(16, 470, 180, 150),
  anB: zp(210, 470, 170, 150),
  text: zp(16, 640, 364, 220),
  cmd: zp(16, 880, 364, 140),
}

const READOUT = (
  <>
    <span>SYS · ONLINE</span>
    <span>LAT · 12ms</span>
    <span>PWR · 98%</span>
  </>
)

export default function App() {
  const { mobile, scale, wide } = useStageScale(W, H, MW)
  const [messages, setMessages] = useState(INITIAL)
  const [status, setStatus] = useState('ready')
  const [pulse, setPulse] = useState(0)
  const history = useRef([])
  const timer = useRef(null)
  const typingRef = useRef(null)
  const busyRef = useRef(false)
  const abortRef = useRef(null)
  const epochRef = useRef(0)
  const recRef = useRef(null)

  // cleanup on unmount
  useEffect(() => () => {
    clearInterval(timer.current)
    stopSpeech()
    abortRef.current?.abort()
    try { recRef.current?.stop() } catch {}
  }, [])

  const flushTyping = useCallback(() => {
    clearInterval(timer.current)
    if (typingRef.current) {
      const { id, full } = typingRef.current
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: full, typing: false } : x)))
      typingRef.current = null
    }
  }, [])

  const typeReply = useCallback(
    (full) => {
      flushTyping()
      const reply = mk('ai', '', true)
      typingRef.current = { id: reply.id, full }
      setMessages((m) => [...m, reply])
      const stepSize = Math.max(2, Math.ceil(full.length / 220)) // long replies finish in ~5s
      let i = 0
      timer.current = setInterval(() => {
        i += stepSize
        const done = i >= full.length
        setMessages((m) =>
          m.map((x) => (x.id === reply.id ? { ...x, text: full.slice(0, i), typing: !done } : x))
        )
        if (done) {
          clearInterval(timer.current)
          typingRef.current = null
        }
      }, 22)
    },
    [flushTyping]
  )

  const run = useCallback(
    async (text) => {
      const epoch = epochRef.current
      const ctrl = new AbortController()
      abortRef.current = ctrl
      busyRef.current = true

      flushTyping()
      stopSpeech()
      unlockSpeech() // after stopSpeech, so phones keep permission to speak after the network call

      setMessages((m) => [...m, mk('user', text)])
      setPulse((p) => p + 1)
      history.current.push({ role: 'user', content: text })
      setStatus('processing')

      try {
        const raw = await askGroq(history.current, ctrl.signal)
        if (epoch !== epochRef.current) return // chat was cleared while waiting
        history.current.push({ role: 'assistant', content: raw })
        typeReply(raw)

        const clean = cleanForSpeech(raw)
        if (clean) {
          speakText(clean, {
            onStart: () => setStatus('speaking'),
            onEnd: () => setStatus('ready'),
          })
        } else {
          setStatus('ready')
        }
      } catch (err) {
        if (epoch !== epochRef.current) return
        history.current.pop() // drop the failed user turn so history stays consistent
        typeReply(err.name === 'AbortError' ? 'Request cancelled.' : `Connection fault: ${err.message}`)
        setStatus('ready')
      } finally {
        if (epoch === epochRef.current) {
          busyRef.current = false
          if (abortRef.current === ctrl) abortRef.current = null
        }
      }
    },
    [typeReply, flushTyping]
  )

  // returns false when the message was not accepted (a request is still running)
  const handleSubmit = useCallback(
    (text) => {
      if (text.toLowerCase() === 'clear') {
        epochRef.current++
        abortRef.current?.abort()
        abortRef.current = null
        busyRef.current = false
        stopSpeech()
        clearInterval(timer.current)
        typingRef.current = null
        history.current = []
        setMessages([])
        setStatus('ready')
        return true
      }
      if (busyRef.current) return false
      run(text)
      return true
    },
    [run]
  )

  const handleMic = useCallback(() => {
    if (status === 'processing') {
      abortRef.current?.abort()
      return
    }
    if (status === 'listening') {
      try { recRef.current?.stop() } catch {}
      setStatus('ready')
      return
    }
    if (!SpeechRecognitionCtor) {
      typeReply('Speech recognition is not supported on this device.')
      return
    }
    unlockSpeech()
    stopSpeech()
    const rec = new SpeechRecognitionCtor()
    rec.lang = 'en-AU'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setStatus('listening')
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim()
      if (text) handleSubmit(text)
    }
    rec.onerror = (e) => {
      setStatus('ready')
      if (e.error === 'not-allowed') {
        typeReply('Microphone permission denied. Allow mic access and try again.')
      } else if (e.error === 'no-speech') {
        typeReply('No speech detected. Please try again.')
      } else if (e.error === 'network') {
        typeReply('Voice recognition could not reach its speech service. Check your connection.')
      }
    }
    rec.onend = () => setStatus((s) => (s === 'listening' ? 'ready' : s))
    recRef.current = rec
    try {
      rec.start()
    } catch {
      setStatus('ready')
    }
  }, [status, handleSubmit, typeReply])

  const stageStyle = mobile
    ? { width: MW, height: MH, left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${scale})` }
    : { width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }

  const stageClass = 'stage' + (mobile ? ' mobile' : '') + (wide ? ' fade-x' : '')

  return (
    <div className={mobile ? 'viewport mobile' : 'viewport'}>
      <div className="sizer" style={mobile ? { width: MW * scale, height: MH * scale } : undefined}>
        <div className={stageClass} style={stageStyle}>
          <MBackground slice={mobile} />
          <MOverlays />

          {/* centre piece */}
          <MPlatform style={mobile ? M.platform : undefined} />
          <MOrbRings style={mobile ? M.rings : undefined} />
          <div className="orb-wrap" style={mobile ? M.orb : undefined}>
            <MOrb pulse={pulse} mode={status} scale={scale * (mobile ? 0.82 : 1)} lite={mobile} />
          </div>

          {!mobile && <MConnectors />}
          {!mobile && <div className="cluster-frame" />}

          {/* panels */}
          <MDiag style={mobile ? M.diag : D.diag} />
          <MNet style={mobile ? M.net : D.net} />
          <MAnA style={mobile ? M.anA : D.anA} />
          <MAnB style={mobile ? M.anB : D.anB} />

          {/* reticles (desktop only) */}
          {!mobile && (
            <MReticle size={150} cls="ret-left" dense>
              {READOUT}
            </MReticle>
          )}
          {!mobile && <MReticle size={178} cls="ret-right" />}
          {!mobile && (
            <div className="deco-lines left">
              <span>▸ SECTOR 07 · LOCKED</span>
              <span>▸ TRACE 0x4F2A19</span>
              <span>▸ LINK ESTABLISHED</span>
            </div>
          )}

          {/* terminals */}
          <TextTerminal messages={messages} style={mobile ? M.text : D.text} />
          <CommandTerminal
            onSubmit={handleSubmit}
            onMic={handleMic}
            status={status}
            autoFocus={!mobile}
            style={mobile ? M.cmd : D.cmd}
          />
        </div>
      </div>
    </div>
  )
}
