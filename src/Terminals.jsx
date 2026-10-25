import { useEffect, useRef, useState } from 'react'
import { useClock } from './hooks.js'

/* ---------- Text terminal (chat log) ---------- */

export function TextTerminal({ messages, style }) {
  const bodyRef = useRef(null)

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <section className="term text-term" style={style}>
      <header className="term-head">
        <span>TEXT TERMINAL</span>
        <i className="x">×</i>
      </header>
      <div className="log" ref={bodyRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.from}`}>
            <div className="msg-label">{m.from === 'ai' ? 'Received text (AI)' : 'Sent text (user)'}</div>
            <div className="msg-text">
              {m.text}
              {m.typing && <span className="caret" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Command terminal ---------- */

const TOOLS = [
  <path key="0" d="M4 6h16M4 12h16M4 18h10" />,
  <g key="1"><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M8 12h8M12 8v8" /></g>,
  <g key="2"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></g>,
  <path key="3" d="M4 18 10 6l4 8 3-5 3 9" />,
  <g key="4"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></g>,
]

export function CommandTerminal({ onSubmit, style }) {
  const [value, setValue] = useState('')
  const [active, setActive] = useState(0)
  const hist = useRef([])
  const hIdx = useRef(-1)
  const now = useClock()

  const send = () => {
    const v = value.trim()
    if (!v) return
    hist.current.unshift(v)
    hIdx.current = -1
    onSubmit(v)
    setValue('')
  }

  const onKey = (e) => {
    if (e.key === 'Enter') send()
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      hIdx.current = Math.min(hIdx.current + 1, hist.current.length - 1)
      if (hist.current[hIdx.current]) setValue(hist.current[hIdx.current])
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      hIdx.current = Math.max(hIdx.current - 1, -1)
      setValue(hIdx.current === -1 ? '' : hist.current[hIdx.current])
    }
  }

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  return (
    <section className="term cmd-term" style={style}>
      <header className="term-head">
        <span>TERMINAL</span>
        <i className="x">×</i>
      </header>

      <div className="toolbar">
        <i className="tb-dot" />
        {TOOLS.map((p, i) => (
          <button
            key={i}
            className={i === active ? 'tool active' : 'tool'}
            onClick={() => setActive(i)}
            aria-label={`tool ${i + 1}`}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              {p}
            </svg>
          </button>
        ))}
        <span className="tb-spacer" />
        <span className="tb-meter">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </span>
        <span className="tb-clock">{`${hh}:${mm}:${ss}`}</span>
      </div>

      <div className="cmd-row">
        <label className="cmd-label" htmlFor="cmd">TYPE COMMAND :</label>
        <div className="cmd-line">
          <input
            id="cmd"
            className="cmd-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
            spellCheck="false"
            autoFocus
          />
          <button className="submit" onClick={send}>SUBMIT</button>
        </div>
      </div>
    </section>
  )
}
