import { useLive, useSeries } from './hooks.js'

function Panel({ title, children, style, className = '' }) {
  return (
    <section className={`panel ${className}`} style={style}>
      <header className="panel-head">
        <span>{title}</span>
        <i className="x">×</i>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}

function Bar({ label, value, color = '#00f2ff' }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="bar-val">{Math.round(value)}</span>
    </div>
  )
}

function Spark({ data, color = '#00f2ff' }) {
  const w = 100
  const h = 28
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  )
}

export function SystemDiagnostics({ style }) {
  const cpu = useLive(42, 12, 1400)
  const mem = useLive(61, 8, 1600)
  const disk = useLive(38, 5, 2000)
  return (
    <Panel title="SYSTEM DIAG" style={style}>
      <Bar label="CPU" value={cpu} color="#00f2ff" />
      <Bar label="MEM" value={mem} color="#38bdf8" />
      <Bar label="DSK" value={disk} color="#0ea5e9" />
    </Panel>
  )
}

export function NetworkStatus({ style }) {
  const up = useLive(24, 15, 1100, 0, 100)
  const down = useLive(67, 18, 900, 0, 100)
  return (
    <Panel title="NETWORK" style={style}>
      <div className="net-row">
        <span>UP</span>
        <strong>{up.toFixed(0)} Mb</strong>
      </div>
      <div className="net-row">
        <span>DN</span>
        <strong>{down.toFixed(0)} Mb</strong>
      </div>
      <div className="net-row">
        <span>LAT</span>
        <strong>12 ms</strong>
      </div>
    </Panel>
  )
}

export function AnalyticsA({ style }) {
  const series = useSeries(14, 800, 55)
  return (
    <Panel title="ANALYTICS A" style={style}>
      <Spark data={series} color="#00f2ff" />
      <div className="ana-meta">
        <span>LOAD</span>
        <strong>{series[series.length - 1].toFixed(0)}%</strong>
      </div>
    </Panel>
  )
}

export function AnalyticsB({ style }) {
  const series = useSeries(14, 1100, 40)
  return (
    <Panel title="ANALYTICS B" style={style}>
      <Spark data={series} color="#00ff88" />
      <div className="ana-meta">
        <span>THRU</span>
        <strong>{series[series.length - 1].toFixed(0)}</strong>
      </div>
    </Panel>
  )
}
