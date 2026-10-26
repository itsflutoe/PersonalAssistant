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

/* ---------- Weather icon (WMO weathercode → simple SVG) ---------- */

function WeatherIcon({ code, size = 36 }) {
  const c = code ?? -1
  // 0 clear, 1–3 partly cloudy, 45/48 fog, 51–67 rain/drizzle, 71–77 snow, 80–82 showers, 95–99 thunder
  const isClear = c === 0
  const isCloud = c >= 1 && c <= 3
  const isFog = c === 45 || c === 48
  const isRain = (c >= 51 && c <= 67) || (c >= 80 && c <= 82)
  const isSnow = c >= 71 && c <= 77
  const isStorm = c >= 95

  const stroke = 'var(--c-bright, #9ceaff)'
  const fill = 'rgba(120,220,255,0.25)'

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      {isClear && (
        <>
          <circle cx="24" cy="24" r="9" stroke={stroke} strokeWidth="2" fill={fill} />
          {[0, 45, 90, 135].map((a) => (
            <line
              key={a}
              x1="24"
              y1="6"
              x2="24"
              y2="11"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${a} 24 24)`}
            />
          ))}
        </>
      )}
      {(isCloud || isFog || isRain || isSnow || isStorm || c < 0) && !isClear && (
        <path
          d="M16 30h18a7 7 0 0 0 0-14 9 9 0 0 0-17-3 6 6 0 0 0-1 17z"
          stroke={stroke}
          strokeWidth="2"
          fill={fill}
        />
      )}
      {isRain && (
        <>
          <line x1="18" y1="34" x2="16" y2="40" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="34" x2="22" y2="40" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="34" x2="28" y2="40" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {isSnow && (
        <>
          <circle cx="18" cy="36" r="1.5" fill={stroke} />
          <circle cx="24" cy="38" r="1.5" fill={stroke} />
          <circle cx="30" cy="36" r="1.5" fill={stroke} />
        </>
      )}
      {isStorm && (
        <path d="M26 28l-4 8h4l-2 6 8-10h-4l2-4z" fill={stroke} />
      )}
      {isFog && (
        <>
          <line x1="14" y1="34" x2="34" y2="34" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="38" x2="32" y2="38" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {c < 0 && !isClear && (
        <text x="24" y="28" textAnchor="middle" fill={stroke} fontSize="14" fontFamily="Share Tech Mono, monospace">
          —
        </text>
      )}
    </svg>
  )
}

/** Bottom-right panel: weather (follows last /weather). Other panels unchanged. */
export function AnalyticsB({ style, weather = null }) {
  const place = weather?.place || '—'
  const temp = weather?.temp
  const humidity = weather?.humidity
  const code = weather?.code
  const condition = weather?.condition || 'AWAITING'

  return (
    <Panel title="LOCAL WEATHER" style={style}>
      <div className="an-b" style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%' }}>
        <div className="an-b-top" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(79,209,255,0.35)',
              background: 'rgba(79,209,255,0.08)',
              flexShrink: 0,
            }}
          >
            <WeatherIcon code={code} size={36} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
            <b style={{ fontSize: 18, color: 'var(--c-bright, #9ceaff)', textShadow: '0 0 6px rgba(80,210,255,0.8)' }}>
              {temp != null ? `${Math.round(temp)}°` : '—'}
            </b>
            <small style={{ fontSize: 8, letterSpacing: 1, color: 'var(--c-dim, rgba(79,209,255,0.55))' }}>
              {condition}
            </small>
          </div>
        </div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 0.6,
            color: 'var(--c-dim, rgba(79,209,255,0.55))',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={place}
        >
          {place}
        </div>
        {humidity != null && (
          <div className="bar-row" style={{ marginTop: 2 }}>
            <span>HUM</span>
            <div className="bar">
              <i style={{ width: `${Math.min(100, Math.max(0, humidity))}%` }} />
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}
