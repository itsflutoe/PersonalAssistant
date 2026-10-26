import { useMemo } from 'react'

function mulberry(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* Blurred control-room scene: city skyline, window beams, consoles. */
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
      const rows = Math.floor(b.h / 18)
      const cols = Math.floor(b.w / 10)
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (r() > 0.55) lights.push({ x: b.x + 4 + col * 10, y: 520 - b.h + 6 + row * 18, on: r() > 0.3 })
        }
      }
    }
    return { buildings, lights }
  }, [])

  return (
    <div className="bg" aria-hidden>
      <div className="sky" />
      <div className="city">
        {scene.buildings.map((b, i) => (
          <div
            key={i}
            className="building"
            style={{
              left: b.x,
              width: b.w,
              height: b.h,
              opacity: 0.35 + b.shade * 0.4,
            }}
          />
        ))}
        {scene.lights.map((l, i) => (
          <i
            key={i}
            className={l.on ? 'win on' : 'win'}
            style={{ left: l.x, top: l.y }}
          />
        ))}
      </div>
      <div className="floor" />
      {slice && <div className="slice-mask" />}
    </div>
  )
}

export function Overlays() {
  return (
    <>
      <div className="vignette" />
      <div className="scanlines" />
      <div className="noise" />
    </>
  )
}

export function OrbRings({ style }) {
  return (
    <div className="orb-rings" style={style} aria-hidden>
      <div className="ring r1" />
      <div className="ring r2" />
      <div className="ring r3" />
    </div>
  )
}

export function Platform({ style }) {
  return (
    <div className="platform" style={style} aria-hidden>
      <div className="plat-base" />
      <div className="plat-glow" />
    </div>
  )
}

export function Connectors() {
  return (
    <svg className="connectors" viewBox="0 0 1408 768" preserveAspectRatio="none" aria-hidden>
      <path d="M220 180 C 400 180, 500 300, 700 360" className="conn" />
      <path d="M1180 180 C 1000 180, 900 300, 700 360" className="conn" />
      <path d="M220 320 C 380 400, 500 500, 700 560" className="conn" />
      <path d="M1180 320 C 1020 400, 900 500, 700 560" className="conn" />
    </svg>
  )
}

export function Reticle({ size = 150, cls = '', dense = false, children }) {
  return (
    <div className={`reticle ${cls}`} style={{ width: size, height: size }} aria-hidden>
      <div className="ret-ring" />
      <div className="ret-cross" />
      {dense && <div className="ret-ticks" />}
      {children && <div className="ret-readout">{children}</div>}
    </div>
  )
}
