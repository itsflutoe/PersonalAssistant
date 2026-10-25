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
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(90,200,255,0.18)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#5fd8ff"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - value / 100)}
            style={{ transition: 'stroke-dashoffset 1.2s ease', filter: 'drop-shadow(0 0 3px #3ac8ff)' }}
          />
        </g>
        {spin && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r - stroke - 2}
            fill="none"
            stroke="#5fd8ff"
            strokeWidth="0.8"
            strokeDasharray="2 4"
            className="spin-rev"
            style={{ transformOrigin: 'center' }}
            opacity="0.7"
          />
        )}
      </svg>
      <div className="ring-center">{children ?? label}</div>
    </div>
  )
}

function Area({ data, w, h, grid = false, line = '#5fd8ff', id }) {
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => [i * step, h - (v / 100) * h])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="area">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={line} stopOpacity="0.45" />
          <stop offset="1" stopColor={line} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid &&
        [0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="rgba(90,200,255,0.18)" strokeWidth="0.5" />
        ))}
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={line} strokeWidth="1" style={{ filter: 'drop-shadow(0 0 2px #3ac8ff)' }} />
    </svg>
  )
}

function Bar({ label, value }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar">
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

const Icon = {
  cpu: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 9a15 15 0 0 1 20 0M5.5 12.8a10 10 0 0 1 13 0M9 16.4a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  ),
}

/* ---------- System Diagnostics ---------- */

export function SystemDiagnostics({ style }) {
  const cpu = useLive(15, 14, 1700, 4, 60)
  const mem = useLive(75, 8, 2100, 50, 92)
  const tmp = useLive(35, 7, 1900, 20, 60)

  return (
    <Panel title="SYSTEM DIAGNOSTICS" style={style}>
      <div className="diag">
        <Ring value={cpu * 1.4 + 20} size={62} stroke={4} spin>
          <span className="ic">{Icon.cpu}</span>
        </Ring>
        <div className="diag-stats">
          <div className="stat">
            <small>CPU LOAD</small>
            <b>{cpu.toFixed(0)}%</b>
            <Ring value={cpu} size={14} stroke={2} />
          </div>
          <div className="stat">
            <small>MEMORY</small>
            <b>{mem.toFixed(0)}%</b>
            <Ring value={mem} size={14} stroke={2} />
          </div>
          <div className="stat">
            <small>CORE TEMP</small>
            <b>{tmp.toFixed(0)}%</b>
            <Ring value={tmp} size={14} stroke={2} />
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Network Status ---------- */

function WorldDots() {
  // tiny dot-matrix "map"
  const dots = []
  const rows = [
    '..0011100..000000....',
    '.001111110.00111100..',
    '.0111111110.0111110..',
    '..01111110..01111110.',
    '...011110....011100..',
    '....0110......0010...',
  ]
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '1') dots.push(<circle key={`${x}-${y}`} cx={x * 3 + 2} cy={y * 3 + 2} r="0.9" />)
    })
  )
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="#5fd8ff" opacity="0.8">
      {dots}
      <circle cx="22" cy="8" r="2" fill="#fff" className="blink" />
    </svg>
  )
}

export function NetworkStatus({ style }) {
  const up = useLive(94, 6, 1800, 70, 100)
  const down = useLive(88, 8, 2200, 60, 100)
  const lat = useLive(12, 5, 1500, 5, 40)
  const loss = useLive(2, 2, 2600, 0, 8)
  const wave = useSeries(18, 700, 50)

  return (
    <Panel title="NETWORK STATUS" style={style}>
      <div className="net">
        <div className="net-top">
          <span className="ic big">{Icon.wifi}</span>
          <WorldDots />
        </div>
        <div className="net-rings">
          <Ring value={up} size={26} stroke={2.4}>
            <span className="tiny">{up.toFixed(0)}</span>
          </Ring>
          <Ring value={down} size={26} stroke={2.4}>
            <span className="tiny">{down.toFixed(0)}</span>
          </Ring>
          <div className="net-wave">
            <Area data={wave} w={44} h={22} id="netwave" />
          </div>
        </div>
        <Bar label="UPLINK" value={up} />
        <Bar label="LATENCY" value={lat * 2.2} />
        <Bar label="PKT LOSS" value={loss * 10} />
      </div>
    </Panel>
  )
}

/* ---------- Feature Analytics (left) ---------- */

export function AnalyticsA({ style }) {
  const a = useSeries(14, 1100, 40)
  const b = useSeries(14, 1300, 60)
  const big = useSeries(30, 800, 50)
  const b1 = useLive(70, 12, 1800, 20, 95)
  const b2 = useLive(45, 14, 2100, 15, 90)
  const b3 = useLive(82, 10, 1600, 30, 98)

  return (
    <Panel title="FEATURE ANALYTICS" style={style}>
      <div className="an-a">
        <div className="an-a-top">
          <div className="an-bars">
            <Bar label="ALPHA" value={b1} />
            <Bar label="BETA" value={b2} />
            <Bar label="GAMMA" value={b3} />
          </div>
          <div className="an-mini">
            <Area data={a} w={34} h={20} id="miniA" />
            <Area data={b} w={34} h={20} id="miniB" line="#8be9ff" />
          </div>
        </div>
        <div className="an-big">
          <Area data={big} w={136} h={52} grid id="bigA" />
          <div className="an-x">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Feature Analytics (right of the pair) ---------- */

const CHIPS = ['AI', 'NET', 'SEC', 'SYN', 'LNK', 'GEO', 'SIG', 'PWR']

export function AnalyticsB({ style }) {
  const level = useLive(68, 14, 1500, 20, 98)
  const val = useLive(72, 12, 1900, 30, 98)
  const [on, setOn] = useState(() => new Set(['AI', 'SEC', 'SIG']))
  const toggle = (c) =>
    setOn((s) => {
      const n = new Set(s)
      n.has(c) ? n.delete(c) : n.add(c)
      return n
    })

  return (
    <Panel title="FEATURE ANALYTICS" style={style}>
      <div className="an-b">
        <div className="an-b-top">
          <Ring value={val} size={54} stroke={4} spin>
            <div className="ring-text">
              <b>{val.toFixed(0)}</b>
              <small>SYNC</small>
            </div>
          </Ring>
          <div className="vmeter">
            <div className="vticks">
              {['2.0K', '1.5K', '1.0K', '500', '0'].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="vtrack">
              <i style={{ height: `${level}%` }} />
            </div>
          </div>
        </div>
        <div className="chips">
          {CHIPS.map((c) => (
            <button key={c} className={on.has(c) ? 'chip on' : 'chip'} onClick={() => toggle(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
}
