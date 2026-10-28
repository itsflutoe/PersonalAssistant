import { useEffect, useMemo, useRef } from 'react'
import { LAND, SEAS, SAUDI, antarcticaCoast } from './globeData.js'

function mulberry(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function Background({ slice = false }) {
  const scene = useMemo(() => {
    const r = mulberry(7)
    const buildings = []
    let x = -20
    while (x < 1430) {
      const w = 22 + r() * 54
      const h = 90 + r() * 230 * (0.4 + Math.abs(Math.sin(x / 260)) * 0.9)
      buildings.push({ x, w, h, shade: r() })
      x += w * (0.55 + r() * 0.5)
    }
    const lights = []
    for (const b of buildings) {
      const rows = Math.floor(b.h / 13)
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < Math.floor(b.w / 8); j++) {
          if (r() > 0.72) {
            lights.push({
              x: b.x + 4 + j * 8,
              y: 470 - b.h + 6 + i * 13,
              c: r() > 0.8 ? '#ffb86b' : r() > 0.5 ? '#7fe3ff' : '#d8f6ff',
              o: 0.25 + r() * 0.6,
            })
          }
        }
      }
    }
    const bokeh = Array.from({ length: 70 }, () => ({
      x: r() * 1408,
      y: 250 + r() * 260,
      r: 2 + r() * 7,
      c: r() > 0.7 ? '#ffb070' : r() > 0.4 ? '#5ad0ff' : '#c8f2ff',
      o: 0.15 + r() * 0.5,
    }))
    const screens = Array.from({ length: 26 }, (_, i) => {
      const left = i < 13
      const k = left ? i : i - 13
      return {
        x: left ? 20 + k * 22 : 1085 + k * 24,
        y: 478 + (left ? k * 1.4 : (12 - k) * 1.2),
        w: 16 + r() * 8,
        h: 9 + r() * 5,
        o: 0.25 + r() * 0.5,
      }
    })
    return { buildings, lights, bokeh, screens }
  }, [])

  return (
    <svg className="bg-scene" viewBox="0 0 1408 768" preserveAspectRatio={slice ? 'xMidYMid slice' : 'none'}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#020912" />
          <stop offset="0.45" stopColor="#06182a" />
          <stop offset="1" stopColor="#0a2a40" />
        </linearGradient>
        <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c2a42" />
          <stop offset="1" stopColor="#051523" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04121e" />
          <stop offset="1" stopColor="#01050a" />
        </linearGradient>
        <radialGradient id="centerglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1f7fc0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1f7fc0" stopOpacity="0" />
        </radialGradient>
        <filter id="blur3"><feGaussianBlur stdDeviation="2.6" /></filter>
        <filter id="blur8"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="blur14"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      <rect width="1408" height="768" fill="url(#sky)" />

      <g filter="url(#blur3)" opacity="0.95">
        {scene.buildings.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={470 - b.h}
            width={b.w}
            height={b.h + 40}
            fill="url(#bld)"
            opacity={0.55 + b.shade * 0.45}
          />
        ))}
        {scene.lights.map((l, i) => (
          <rect key={i} x={l.x} y={l.y} width="3" height="5" fill={l.c} opacity={l.o} />
        ))}
      </g>
      <g filter="url(#blur8)">
        {scene.bokeh.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={b.o} />
        ))}
      </g>

      <rect x="0" y="330" width="1408" height="160" fill="#0b3b5c" opacity="0.18" filter="url(#blur14)" />
      <ellipse cx="703" cy="380" rx="420" ry="260" fill="url(#centerglow)" />

      <g opacity="0.85">
        {[110, 330, 560, 850, 1080, 1300].map((x, i) => (
          <rect key={i} x={x - 9} y="0" width="18" height="500" fill="#010509" filter="url(#blur3)" />
        ))}
      </g>

      <rect x="0" y="0" width="1408" height="62" fill="#01060b" opacity="0.88" />
      <rect x="0" y="52" width="1408" height="14" fill="#06202f" opacity="0.5" filter="url(#blur8)" />

      <rect x="0" y="498" width="1408" height="270" fill="url(#floor)" />
      <ellipse cx="703" cy="600" rx="360" ry="60" fill="#1388d0" opacity="0.18" filter="url(#blur14)" />

      <g filter="url(#blur3)">
        <polygon points="0,470 340,462 420,520 0,560" fill="#06141f" />
        <polygon points="1408,470 1070,460 990,520 1408,560" fill="#06141f" />
        {scene.screens.map((s, i) => (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill="#3cc4ff" opacity={s.o} />
        ))}
      </g>
    </svg>
  )
}

export function Overlays() {
  return (
    <>
      <div className="grid-overlay" />
      <div className="flare" />
      <div className="scanlines" />
      <div className="vignette" />
    </>
  )
}

export function OrbRings({ style }) {
  const ticks = useMemo(() => {
    const out = []
    for (let a = 0; a < 360; a += 3) {
      const major = a % 30 === 0
      const rad = (a * Math.PI) / 180
      const r1 = 196
      const r2 = major ? 209 : 202
      out.push(
        <line
          key={a}
          x1={Math.cos(rad) * r1}
          y1={Math.sin(rad) * r1}
          x2={Math.cos(rad) * r2}
          y2={Math.sin(rad) * r2}
          strokeWidth={major ? 1.1 : 0.5}
          opacity={major ? 0.9 : 0.4}
        />
      )
    }
    return out
  }, [])

  return (
    <svg className="orb-rings" viewBox="-230 -230 460 460" style={style}>
      <g stroke="#6fdcff" fill="none">
        <circle r="196" strokeWidth="0.8" opacity="0.55" />
        <g className="spin-slow">{ticks}</g>
        <circle r="168" strokeWidth="0.6" strokeDasharray="2 5" opacity="0.6" className="spin-rev" />
        <circle r="152" strokeWidth="1" opacity="0.35" />
        <g className="spin-med">
          <path d="M -152 0 A 152 152 0 0 1 0 -152" strokeWidth="2" opacity="0.85" />
          <path d="M 152 0 A 152 152 0 0 1 0 152" strokeWidth="2" opacity="0.85" />
        </g>
        <g className="spin-rev">
          <path d="M -176 0 A 176 176 0 0 0 0 176" strokeWidth="1" opacity="0.6" />
          <path d="M 176 0 A 176 176 0 0 0 0 -176" strokeWidth="1" opacity="0.6" />
        </g>
        <circle r="3" fill="#bff" stroke="none" cx="0" cy="-196" className="spin-slow" />
      </g>
    </svg>
  )
}

export function Platform({ style }) {
  return (
    <svg className="platform" viewBox="-260 -50 520 100" style={style}>
      <defs>
        <radialGradient id="plat" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#38b6ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#38b6ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse rx="250" ry="38" fill="url(#plat)" />
      <g fill="none" stroke="#6fdcff">
        <ellipse rx="230" ry="30" strokeWidth="0.7" opacity="0.5" />
        <ellipse rx="170" ry="22" strokeWidth="0.7" opacity="0.5" strokeDasharray="3 4" />
        <ellipse rx="110" ry="14" strokeWidth="1" opacity="0.7" />
      </g>
    </svg>
  )
}

export function Connectors() {
  return (
    <svg className="connectors" viewBox="0 0 1408 768">
      <g stroke="#52cfff" strokeWidth="0.9" fill="none" opacity="0.75">
        <polyline points="368,172 482,172 566,256" />
        <polyline points="1000,172 936,172 822,286" />
      </g>
      <g fill="#8eeaff">
        <circle cx="368" cy="172" r="2.6" />
        <circle cx="1000" cy="172" r="2.6" />
        <circle cx="566" cy="256" r="2" />
        <circle cx="822" cy="286" r="2" />
      </g>
    </svg>
  )
}

export function Reticle({ size, cls = '', dense = false, children }) {
  const half = size / 2
  const ticks = useMemo(() => {
    const out = []
    const step = dense ? 6 : 10
    for (let a = 0; a < 360; a += step) {
      const rad = (a * Math.PI) / 180
      const r1 = half * 0.88
      const r2 = half * (a % 30 === 0 ? 0.99 : 0.94)
      out.push(
        <line
          key={a}
          x1={Math.cos(rad) * r1}
          y1={Math.sin(rad) * r1}
          x2={Math.cos(rad) * r2}
          y2={Math.sin(rad) * r2}
        />
      )
    }
    return out
  }, [half, dense])

  return (
    <div className={`reticle ${cls}`} style={{ width: size, height: size }}>
      <svg viewBox={`${-half} ${-half} ${size} ${size}`} width={size} height={size}>
        <g stroke="#62d6ff" fill="none" strokeWidth="0.8">
          <circle r={half * 0.98} opacity="0.35" />
          <g className="spin-slow" opacity="0.8">{ticks}</g>
          <circle r={half * 0.78} strokeDasharray="1.5 4" opacity="0.7" className="spin-rev" />
          <g className="spin-med">
            <path
              d={`M ${-half * 0.66} 0 A ${half * 0.66} ${half * 0.66} 0 0 1 0 ${-half * 0.66}`}
              strokeWidth="2.4"
              opacity="0.9"
            />
            <path
              d={`M ${half * 0.66} 0 A ${half * 0.66} ${half * 0.66} 0 0 1 0 ${half * 0.66}`}
              strokeWidth="2.4"
              opacity="0.9"
            />
          </g>
          <circle r={half * 0.5} opacity="0.5" />
          <circle r={half * 0.3} strokeWidth="1.4" opacity="0.9" className="pulse-ring" />
          <circle r={half * 0.1} fill="#9ff0ff" stroke="none" opacity="0.9" />
          <line x1={-half * 0.42} y1="0" x2={-half * 0.2} y2="0" opacity="0.8" />
          <line x1={half * 0.42} y1="0" x2={half * 0.2} y2="0" opacity="0.8" />
        </g>
      </svg>
      {children}
    </div>
  )
}

/* ---------- Holographic signal globe (canvas) ---------- */

const D2R = Math.PI / 180
const VIEW_TILT = 15 * D2R
const START_LON = 40

function inRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function bbox(ring) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9
  for (const [x, y] of ring) {
    if (x < a) a = x
    if (x > c) c = x
    if (y < b) b = y
    if (y > d) d = y
  }
  return [a, b, c, d]
}

function densify(ring, maxStep = 2.5, closed = true) {
  const out = []
  const n = ring.length
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const [x0, y0] = ring[i]
    const [x1, y1] = ring[(i + 1) % n]
    const k = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / maxStep))
    for (let s = 0; s < k; s++) out.push([x0 + ((x1 - x0) * s) / k, y0 + ((y1 - y0) * s) / k])
  }
  if (!closed) out.push(ring[n - 1])
  return out
}

let GEO = null
function buildGeo() {
  if (GEO) return GEO
  const land = LAND.map((r) => ({ r, b: bbox(r) }))
  const seas = SEAS.map((r) => ({ r, b: bbox(r) }))
  const saudiB = bbox(SAUDI)
  const hit = (list, lon, lat) =>
    list.some(({ r, b }) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && inRing(lon, lat, r))
  const isLand = (lon, lat) => {
    if (lat < antarcticaCoast(lon)) return true
    return hit(land, lon, lat) && !hit(seas, lon, lat)
  }
  const inSaudi = (lon, lat) =>
    lon >= saudiB[0] && lon <= saudiB[2] && lat >= saudiB[1] && lat <= saudiB[3] && inRing(lon, lat, SAUDI)

  const pts = []
  const step = 3
  let row = 0
  for (let lat = -84; lat <= 84; lat += step, row++) {
    const c = Math.cos(lat * D2R)
    const lonStep = Math.max(step, step / Math.max(0.2, c))
    let col = 0
    for (let lon = -180; lon < 180; lon += lonStep, col++) {
      if (inSaudi(lon, lat)) continue
      if (isLand(lon, lat)) pts.push(lon, lat, 1)
      else if (row % 2 === 0 && col % 2 === 0) pts.push(lon, lat, 0)
    }
  }
  for (let lat = 16; lat <= 33; lat += 1.15) {
    for (let lon = 34; lon <= 56; lon += 1.15 / Math.cos(lat * D2R)) {
      if (inSaudi(lon, lat)) pts.push(lon, lat, 2)
    }
  }

  const outlines = LAND.map((r) => densify(r))
  const ant = []
  for (let lon = -180; lon <= 180; lon += 4) ant.push([lon, antarcticaCoast(lon)])
  outlines.push(ant)
  const seaLines = SEAS.map((r) => densify(r))

  GEO = { dots: new Float32Array(pts), outlines: outlines.concat(seaLines), saudi: densify(SAUDI, 1.2) }
  return GEO
}

const RINGS = [
  [0.82, 0.98, 0.3],
  [1.14, 0.45, 0.34],
  [1.26, -0.08, 0.42],
  [1.16, -0.58, 0.34],
  [0.92, -0.95, 0.3],
]
const SAT_RING = 2

export function SignalGlobe({
  size = 178,
  mode = 'idle',
  label = '',
  onClick,
  playing = false,
}) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ mode, playing })
  stateRef.current.mode = mode
  stateRef.current.playing = playing
  const clickable = mode === 'locked' || (mode === 'idle' && playing)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const geo = buildGeo()
    const dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 1))
    canvas.width = Math.round(size * dpr)
    canvas.height = Math.round(size * dpr)

    const half = size / 2
    const R = half * 0.68
    const cosT = Math.cos(VIEW_TILT)
    const sinT = Math.sin(VIEW_TILT)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let lonC = START_LON
    let speed = 4
    let satA = 0
    let last = 0
    let raf = 0
    let acc = 0

    const proj = (lon, lat, out) => {
      const la = lat * D2R
      const lo = (lon - lonC) * D2R
      const cl = Math.cos(la)
      const x = cl * Math.sin(lo)
      const y = Math.sin(la)
      const z = cl * Math.cos(lo)
      out[0] = R * x
      out[1] = -R * (y * cosT - z * sinT)
      out[2] = y * sinT + z * cosT
    }
    const p = [0, 0, 0]

    const strokeLine = (line, front, alpha, width, color) => {
      ctx.beginPath()
      let pen = false
      for (let i = 0; i < line.length; i++) {
        proj(line[i][0], line[i][1], p)
        const vis = front ? p[2] > 0 : p[2] <= 0
        if (vis) {
          if (pen) ctx.lineTo(p[0], p[1])
          else ctx.moveTo(p[0], p[1])
          pen = true
        } else pen = false
      }
      ctx.globalAlpha = alpha
      ctx.lineWidth = width
      ctx.strokeStyle = color
      ctx.stroke()
    }

    const ringPoint = (rr, h, a, out) => {
      const x = rr * Math.cos(a)
      const z = rr * Math.sin(a)
      out[0] = R * x
      out[1] = -R * (h * cosT - z * sinT)
      out[2] = h * sinT + z * cosT
    }

    const drawRing = (idx, front) => {
      const [rr, h, a0] = RINGS[idx]
      ctx.beginPath()
      let pen = false
      const N = 96
      for (let i = 0; i <= N; i++) {
        ringPoint(rr, h, (i / N) * Math.PI * 2, p)
        const vis = front ? p[2] > 0 : p[2] <= 0
        if (vis) {
          if (pen) ctx.lineTo(p[0], p[1])
          else ctx.moveTo(p[0], p[1])
          pen = true
        } else pen = false
      }
      ctx.globalAlpha = front ? a0 + 0.15 : a0 * 0.4
      ctx.lineWidth = front ? 0.8 : 0.6
      ctx.strokeStyle = '#8fe6ff'
      ctx.stroke()
    }

    const draw = (t) => {
      const { mode: m, playing: pl } = stateRef.current
      const scanning = m === 'scanning'
      ctx.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr)
      ctx.clearRect(-half, -half, size, size)

      const halo = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.5)
      halo.addColorStop(0, 'rgba(60,190,255,0.28)')
      halo.addColorStop(0.45, 'rgba(60,190,255,0.08)')
      halo.addColorStop(1, 'rgba(60,190,255,0)')
      ctx.globalAlpha = 1
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.5, 0, Math.PI * 2)
      ctx.fill()

      for (let i = 0; i < RINGS.length; i++) drawRing(i, false)

      const body = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R)
      body.addColorStop(0, 'rgba(40,120,170,0.20)')
      body.addColorStop(0.6, 'rgba(4,30,50,0.55)')
      body.addColorStop(1, 'rgba(1,8,14,0.75)')
      ctx.globalAlpha = 1
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(0, 0, R, 0, Math.PI * 2)
      ctx.fill()

      for (const line of geo.outlines) strokeLine(line, false, 0.1, 0.5, '#5cc8f0')

      const d = geo.dots
      for (let i = 0; i < d.length; i += 3) {
        proj(d[i], d[i + 1], p)
        if (p[2] <= 0.02) continue
        const kind = d[i + 2]
        const depth = p[2]
        if (kind === 0) {
          ctx.globalAlpha = 0.12 + depth * 0.22
          ctx.fillStyle = '#4aa8d8'
          ctx.fillRect(p[0] - 0.3, p[1] - 0.3, 0.6, 0.6)
        } else if (kind === 1) {
          ctx.globalAlpha = 0.3 + depth * 0.6
          ctx.fillStyle = '#9defff'
          ctx.fillRect(p[0] - 0.55, p[1] - 0.55, 1.1, 1.1)
        } else {
          ctx.globalAlpha = 0.55 + depth * 0.45
          ctx.fillStyle = '#42ff93'
          ctx.fillRect(p[0] - 0.65, p[1] - 0.65, 1.3, 1.3)
        }
      }

      for (const line of geo.outlines) strokeLine(line, true, 0.22, 2.2, '#4fd1ff')
      for (const line of geo.outlines) strokeLine(line, true, 0.9, 0.6, '#e6fbff')
      strokeLine(geo.saudi, true, 0.35, 2.4, '#3dff9a')
      strokeLine(geo.saudi, true, 1, 0.8, '#9dffc6')

      ctx.globalAlpha = 0.6
      ctx.lineWidth = 1
      ctx.strokeStyle = '#a9f1ff'
      ctx.beginPath()
      ctx.arc(0, 0, R, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 0.3
      ctx.lineWidth = 0.7
      ctx.setLineDash([0.8, 2.6])
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.07, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      for (let i = 0; i < RINGS.length; i++) drawRing(i, true)

      ringPoint(RINGS[SAT_RING][0], RINGS[SAT_RING][1], satA, p)
      const hidden = p[2] < 0 && Math.hypot(p[0], p[1]) < R
      if (!hidden) {
        ctx.globalAlpha = p[2] > 0 ? 1 : 0.45
        ctx.fillStyle = 'rgba(120,230,255,0.35)'
        ctx.beginPath()
        ctx.arc(p[0], p[1], 4.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#e8fbff'
        ctx.fillRect(p[0] - 1.8, p[1] - 1, 3.6, 2)
        ctx.fillStyle = '#4a9fd4'
        ctx.fillRect(p[0] - 4.6, p[1] - 0.7, 2.4, 1.4)
        ctx.fillRect(p[0] + 2.2, p[1] - 0.7, 2.4, 1.4)
      }

      if (scanning) {
        const k = ((t / 1000) % 1.2) / 1.2
        ctx.globalAlpha = 0.7 * (1 - k)
        ctx.lineWidth = 1.2
        ctx.strokeStyle = '#9ceaff'
        ctx.beginPath()
        ctx.arc(0, 0, R * (1.02 + k * 0.28), 0, Math.PI * 2)
        ctx.stroke()
      }

      if (pl) {
        ctx.lineWidth = 1.1
        ctx.strokeStyle = '#7dffb3'
        for (let w = 0; w < 3; w++) {
          const ph = ((((t / 1400) - w * 0.18) % 1) + 1) % 1
          ctx.globalAlpha = 0.15 + 0.8 * Math.sin(ph * Math.PI)
          const rr = R * (0.18 + w * 0.12)
          ctx.beginPath()
          ctx.arc(R * (0.9 + w * 0.18), 0, rr, -Math.PI / 2, Math.PI / 2)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
    }

    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      if (!last) last = t
      const dt = Math.min(0.1, (t - last) / 1000)
      acc += dt
      if (acc < 1 / 30) return
      last = t
      const target = stateRef.current.mode === 'scanning' ? 13 : 4
      speed += (target - speed) * Math.min(1, acc * 3)
      lonC -= speed * acc
      satA += (stateRef.current.mode === 'scanning' ? 1.3 : 0.5) * acc
      acc = 0
      draw(t)
    }

    if (reduce) draw(0)
    else raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [size])

  const caption =
    mode === 'scanning'
      ? 'SCANNING…'
      : playing
        ? 'SIGNAL LOCK · REDIRECTING'
        : mode === 'locked'
          ? 'SIGNALS LOCKED'
          : 'SIGNAL GLOBE'

  return (
    <button
      type="button"
      className={`signal-globe ${mode === 'scanning' ? 'globe-scan' : ''} ${playing ? 'on-air' : ''} ${clickable ? 'clickable' : ''}`}
      style={{ width: size, height: size }}
      onClick={clickable ? onClick : undefined}
      title={clickable ? 'Open signal list' : 'Run /rad <place> to scan'}
      aria-label="Signal globe"
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div className="globe-caption">
        <span className="globe-mode">{caption}</span>
        {label ? <span className="globe-label">{label}</span> : null}
      </div>
    </button>
  )
}
