import { useState } from 'react'
import { useLive, useSeries } from './hooks.js'

/* ---------- shared bits ---------- */

export function Panel({ title, style, className = '', children }) {
  return (
    <section className={`panel ${className}`} style={style}>
      {title && <h3 className="panel-title">{title}</h3>}
      <div className="panel-body">{children}</div>
    </section>
  )
}

function Ring({ value, size = 40, stroke = 3, label, children, spin = false }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(79,209,255,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--c)"
          strokeWidth={stroke}
          strokeDasharray={`${(value / 100) * circ} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={spin ? 'spin-med' : undefined}
        />
      </svg>
      <div className="ring-center">{children || <span className="ring-text"><b>{Math.round(value)}</b><small>{label}</small></span>}</div>
    </div>
  )
}

export function SystemDiagnostics({ style }) {
  const cpu = useLive(42, 12)
  const mem = useLive(61, 8)
  const net = useLive(78, 10)
  return (
    <Panel title="SYSTEM DIAGNOSTICS" style={style}>
      <div className="diag">
        <Ring value={cpu} size={48} label="CPU" />
        <div className="diag-stats">
          <div className="stat"><small>CPU</small><b>{cpu.toFixed(0)}%</b></div>
          <div className="stat"><small>MEM</small><b>{mem.toFixed(0)}%</b></div>
          <div className="stat"><small>NET</small><b>{net.toFixed(0)}%</b></div>
        </div>
      </div>
    </Panel>
  )
}

export function NetworkStatus({ style }) {
  const up = useLive(24, 15)
  const down = useLive(67, 18)
  return (
    <Panel title="NETWORK STATUS" style={style}>
      <div className="net">
        <div className="net-top">
          <div className="net-rings">
            <Ring value={up} size={36} label="UP" />
            <Ring value={down} size={36} label="DN" />
          </div>
        </div>
        <div className="bar-row"><span>UP</span><div className="bar"><i style={{ width: `${up}%` }} /></div></div>
        <div className="bar-row"><span>DN</span><div className="bar"><i style={{ width: `${down}%` }} /></div></div>
      </div>
    </Panel>
  )
}

export function AnalyticsA({ style }) {
  const series = useSeries(12)
  return (
    <Panel title="FEATURE ANALYTICS" style={style}>
      <div className="an-a">
        <div className="an-a-top">
          <Ring value={series[series.length - 1]} size={44} label="LD" />
          <div className="an-bars">
            {series.slice(-6).map((v, i) => (
              <div key={i} className="bar-row"><span>{i}</span><div className="bar"><i style={{ width: `${v}%` }} /></div></div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function AnalyticsB({ style }) {
  const [on, setOn] = useState(0)
  const series = useSeries(10, 1100, 40)
  return (
    <Panel title="FEATURE ANALYTICS" style={style}>
      <div className="an-b">
        <div className="an-b-top">
          <Ring value={series[series.length - 1]} size={48} label="TH" spin />
          <div className="vmeter">
            <div className="vticks"><span>100</span><span>50</span><span>0</span></div>
            <div className="vtrack"><i style={{ height: `${series[series.length - 1]}%` }} /></div>
          </div>
        </div>
        <div className="chips">
          {['A', 'B', 'C', 'D'].map((c, i) => (
            <button key={c} className={on === i ? 'chip on' : 'chip'} onClick={() => setOn(i)}>{c}</button>
          ))}
        </div>
      </div>
    </Panel>
  )
}
