import { useCallback, useEffect, useRef, useState } from 'react'
import { useStageScale } from './hooks.js'
import Orb from './Orb.jsx'
import { Background, Overlays, OrbRings, Platform, Connectors, Reticle } from './Decor.jsx'
import { SystemDiagnostics, NetworkStatus, AnalyticsA, AnalyticsB } from './Panels.jsx'
import { TextTerminal, CommandTerminal } from './Terminals.jsx'

const W = 1408
const H = 768

let uid = 0
const mk = (from, text, typing = false) => ({ id: ++uid, from, text, typing })

const INITIAL = [
  mk('ai', 'Hello, world. Systems are online and ready to enhance your technological experience with intelligence.'),
  mk('user', 'Run a system diagnostic.'),
  mk('ai', 'Diagnostics complete. All subsystems are within normal range. Shall I proceed with a deep scan?'),
  mk('user', 'Yes, please do.'),
]

function respond(input) {
  const t = input.toLowerCase()
  if (/^(hi|hello|hey)\b/.test(t)) return 'Hello, world. All systems are nominal and I am ready to help.'
  if (t.includes('help')) return 'Try: status, network, scan, clear, or simply say hello.'
  if (t.includes('status') || t.includes('diagnos'))
    return 'Diagnostics complete: CPU 15%, memory 75%, core temperature 35%. All subsystems within normal range.'
  if (t.includes('network')) return 'Network link stable. Latency 12 ms, uplink 94%, downlink 88%.'
  if (t.includes('scan')) return 'Deep scan initiated. No anomalies detected across 4,812 nodes.'
  if (t.includes('who') || t.includes('name')) return 'I am the core intelligence of this console. Ask me anything.'
  if (/^(yes|ok|sure)/.test(t)) return 'Understood. Executing the requested operation now.'
  return `Command received: "${input}". Processing complete. Awaiting further instructions.`
}

export default function App() {
  const scale = useStageScale(W, H)
  const [messages, setMessages] = useState(INITIAL)
  const [pulse, setPulse] = useState(0)
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  const handleSubmit = useCallback((text) => {
    if (text.toLowerCase() === 'clear') {
      clearInterval(timer.current)
      setMessages([])
      return
    }
    setMessages((m) => [...m, mk('user', text)])
    setPulse((p) => p + 1)

    const full = respond(text)
    const reply = mk('ai', '', true)
    clearInterval(timer.current)
    setTimeout(() => {
      setMessages((m) => [...m, reply])
      let i = 0
      timer.current = setInterval(() => {
        i += 2
        setMessages((m) =>
          m.map((x) => (x.id === reply.id ? { ...x, text: full.slice(0, i), typing: i < full.length } : x))
        )
        if (i >= full.length) clearInterval(timer.current)
      }, 22)
    }, 450)
  }, [])

  return (
    <div className="viewport">
      <div
        className="stage"
        style={{
          width: W,
          height: H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <Background />
        <Overlays />

        {/* centre piece */}
        <Platform />
        <OrbRings />
        <div className="orb-wrap">
          <Orb pulse={pulse} />
        </div>
        <Connectors />

        {/* left cluster */}
        <div className="cluster-frame" />
        <SystemDiagnostics style={{ left: 70, top: 76, width: 154, height: 100 }} />
        <NetworkStatus style={{ left: 231, top: 76, width: 122, height: 100 }} />
        <AnalyticsA style={{ left: 70, top: 184, width: 154, height: 136 }} />
        <AnalyticsB style={{ left: 231, top: 184, width: 122, height: 136 }} />

        {/* reticles */}
        <Reticle size={150} cls="ret-left" dense>
          <div className="ret-readout left">
            <span>LAT 14.5995</span>
            <span>LNG 120.9842</span>
          </div>
        </Reticle>
        <Reticle size={178} cls="ret-right" />
        <div className="deco-lines left">
          <span>▸ SECTOR 07 · LOCKED</span>
          <span>▸ TRACE 0x4F2A19</span>
          <span>▸ LINK ESTABLISHED</span>
        </div>

        {/* right + bottom terminals */}
        <TextTerminal messages={messages} style={{ left: 1010, top: 65, width: 335, height: 262 }} />
        <CommandTerminal onSubmit={handleSubmit} style={{ left: 298, top: 603, width: 812, height: 128 }} />
      </div>
    </div>
  )
}
