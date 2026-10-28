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

/** Earth-like signal globe + satellite + play indicator. Modes: idle | scanning | locked */
export function SignalGlobe({
  size = 178,
  mode = 'idle',
  label = '',
  onClick,
  playing = false,
}) {
  const half = size / 2
  const R = half * 0.68
  const spinLand = mode === 'scanning' ? 'spin-med' : 'spin-slow'
  const spinSat = mode === 'scanning' ? 'sat-orbit-fast' : 'sat-orbit'
  const clickable = mode === 'locked' || (mode === 'idle' && playing)

  return (
    <button
      type="button"
      className={`signal-globe ${mode === 'scanning' ? 'globe-scan' : ''} ${playing ? 'on-air' : ''} ${clickable ? 'clickable' : ''}`}
      style={{ width: size, height: size }}
      onClick={clickable ? onClick : undefined}
      title={clickable ? 'Open signal list' : 'Run /rad <place> to scan'}
      aria-label="Signal globe"
    >
      <svg viewBox={`${-half} ${-half} ${size} ${size}`} width={size} height={size}>
        <defs>
          {/* ocean body */}
          <radialGradient id="sgOcean" cx="0.32" cy="0.28" r="0.75">
            <stop offset="0" stopColor="#7ec8ff" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#1a6a9e" stopOpacity="0.9" />
            <stop offset="1" stopColor="#062a45" stopOpacity="0.95" />
          </radialGradient>
          {/* limb / atmosphere */}
          <radialGradient id="sgAtmo" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.72" stopColor="#8fdfff" stopOpacity="0" />
            <stop offset="0.88" stopColor="#6fd0ff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#b8f0ff" stopOpacity="0.15" />
          </radialGradient>
          {/* specular highlight */}
          <radialGradient id="sgSpec" cx="0.3" cy="0.25" r="0.4">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="0.4" stopColor="#a8e8ff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id="sgClip">
            <circle r={R} />
          </clipPath>
        </defs>

        {/* outer HUD ring */}
        <circle r={half * 0.96} fill="none" stroke="#62d6ff" strokeWidth="0.7" opacity="0.28" />
        <circle
          r={half * 0.9}
          fill="none"
          stroke="#62d6ff"
          strokeWidth="0.6"
          strokeDasharray="3 5"
          opacity="0.45"
          className={mode === 'scanning' ? 'spin-med' : 'spin-slow'}
        />

        {/* planet */}
        <g className={spinLand} style={{ transformOrigin: '0px 0px' }}>
          <circle r={R} fill="url(#sgOcean)" stroke="#8fe0ff" strokeWidth="1.1" />
          <g clipPath="url(#sgClip)" opacity="0.85">
            {/* stylized continents (cyan land masses) */}
            <path
              d={`M ${-R * 0.55} ${-R * 0.15}
                  c ${R * 0.1} ${-R * 0.25} ${R * 0.35} ${-R * 0.35} ${R * 0.5} ${-R * 0.12}
                  c ${R * 0.12} ${R * 0.18} ${R * 0.05} ${R * 0.4} ${-R * 0.15} ${R * 0.42}
                  c ${-R * 0.25} ${0.02 * R} ${-R * 0.4} ${-R * 0.08} ${-R * 0.35} ${-R * 0.3} z`}
              fill="#3d9a6a"
              opacity="0.75"
            />
            <path
              d={`M ${R * 0.15} ${R * 0.05}
                  c ${R * 0.2} ${-R * 0.15} ${R * 0.45} ${-R * 0.05} ${R * 0.4} ${R * 0.2}
                  c ${-0.02 * R} ${R * 0.25} ${-R * 0.3} ${R * 0.35} ${-R * 0.45} ${R * 0.18}
                  c ${-R * 0.12} ${-R * 0.12} ${-R * 0.08} ${-R * 0.28} ${0.05 * R} ${-R * 0.38} z`}
              fill="#2f8a5c"
              opacity="0.7"
            />
            <path
              d={`M ${-R * 0.2} ${R * 0.35}
                  c ${R * 0.15} ${R * 0.05} ${R * 0.3} ${R * 0.2} ${R * 0.1} ${R * 0.32}
                  c ${-R * 0.2} ${0.08 * R} ${-R * 0.35} ${-0.05 * R} ${-R * 0.28} ${-R * 0.22}
                  c ${0.05 * R} ${-0.08 * R} ${0.12 * R} ${-0.12 * R} ${0.18 * R} ${-0.1 * R} z`}
              fill="#348f62"
              opacity="0.65"
            />
            <ellipse cx={-R * 0.1} cy={-R * 0.45} rx={R * 0.22} ry={R * 0.12} fill="#e8f6ff" opacity="0.35" />
            <ellipse cx={R * 0.25} cy={R * 0.4} rx={R * 0.18} ry={R * 0.1} fill="#e8f6ff" opacity="0.25" />
          </g>
          {/* lat / lon grid */}
          <ellipse rx={R} ry={R * 0.32} fill="none" stroke="#b8f0ff" strokeWidth="0.5" opacity="0.35" />
          <ellipse rx={R} ry={R * 0.55} fill="none" stroke="#b8f0ff" strokeWidth="0.4" opacity="0.25" />
          <ellipse rx={R * 0.35} ry={R} fill="none" stroke="#b8f0ff" strokeWidth="0.5" opacity="0.3" />
          <ellipse rx={R * 0.65} ry={R} fill="none" stroke="#b8f0ff" strokeWidth="0.4" opacity="0.22" />
          <line x1={-R} y1="0" x2={R} y2="0" stroke="#b8f0ff" strokeWidth="0.4" opacity="0.3" />
          <circle r={R} fill="url(#sgSpec)" stroke="none" />
        </g>

        {/* atmosphere halo */}
        <circle r={R * 1.08} fill="url(#sgAtmo)" stroke="none" />

        {/* orbital path */}
        <ellipse
          rx={R * 1.28}
          ry={R * 0.48}
          fill="none"
          stroke="#6fdcff"
          strokeWidth="0.6"
          strokeDasharray="2 3"
          opacity="0.5"
          transform="rotate(-18)"
        />

        {/* satellite */}
        <g className={spinSat}>
          <g transform={`translate(0, ${-R * 1.28})`}>
            <rect x="-5" y="-2" width="10" height="4" rx="0.8" fill="#c8f4ff" stroke="#7fe3ff" strokeWidth="0.6" />
            <rect x="-9" y="-1.2" width="3.5" height="2.4" fill="#4a9fd4" opacity="0.9" />
            <rect x="5.5" y="-1.2" width="3.5" height="2.4" fill="#4a9fd4" opacity="0.9" />
            <circle cx="0" cy="0" r="1.2" fill="#fff" />
            {/* tiny antenna */}
            <line x1="0" y1="-2" x2="0" y2="-5" stroke="#9ceaff" strokeWidth="0.7" />
            <circle cx="0" cy="-5.5" r="1" fill="none" stroke="#9ceaff" strokeWidth="0.6" />
          </g>
        </g>

        {/* scan pulse */}
        {mode === 'scanning' && (
          <circle r={R * 0.95} fill="none" stroke="#9ceaff" strokeWidth="1.4" className="pulse-ring" opacity="0.85" />
        )}

        {/* playing: radio waves */}
        {playing && (
          <g className="radio-waves" fill="none" stroke="#7dffb3" strokeWidth="1.2">
            <path d={`M ${R * 0.85} ${-R * 0.15} a ${R * 0.2} ${R * 0.2} 0 0 1 0 ${R * 0.3}`} opacity="0.9" className="wave-a" />
            <path d={`M ${R * 1.05} ${-R * 0.28} a ${R * 0.35} ${R * 0.35} 0 0 1 0 ${R * 0.56}`} opacity="0.65" className="wave-b" />
            <path d={`M ${R * 1.25} ${-R * 0.4} a ${R * 0.5} ${R * 0.5} 0 0 1 0 ${R * 0.8}`} opacity="0.4" className="wave-c" />
          </g>
        )}

        {/* locked lock pip */}
        {mode === 'locked' && !playing && (
          <circle r="3" cx={R * 0.55} cy={-R * 0.55} fill="#9ceaff" opacity="0.95" />
        )}
      </svg>

      <div className="globe-caption">
        <span className="globe-mode">
          {mode === 'scanning'
            ? 'SCANNING…'
            : playing
              ? '● ON AIR'
              : mode === 'locked'
                ? 'SIGNALS LOCKED'
                : 'SIGNAL GLOBE'}
        </span>
        {label ? <span className="globe-label">{label}</span> : null}
      </div>
    </button>
  )
}
