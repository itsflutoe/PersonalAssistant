import { useEffect, useRef } from 'react'

const SIZE = 440
const R0 = 128
const N = 2400
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

// Pre-compute points on a sphere (fibonacci lattice).
const base = Array.from({ length: N }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / N
  const r = Math.sqrt(1 - y * y)
  const th = i * GOLDEN
  return { x: Math.cos(th) * r, y, z: Math.sin(th) * r, s: Math.random() }
})

// Orbiting bands of particles around the sphere.
const bands = [
  { tilt: 0.5, speed: 0.35, radius: 1.18, count: 420, spin: 0.3 },
  { tilt: -0.9, speed: -0.25, radius: 1.3, count: 360, spin: 1.1 },
  { tilt: 1.3, speed: 0.18, radius: 1.12, count: 300, spin: 2.2 },
].map((b) => ({
  ...b,
  pts: Array.from({ length: b.count }, () => ({
    a: Math.random() * Math.PI * 2,
    j: (Math.random() - 0.5) * 0.09,
    s: Math.random(),
  })),
}))

export default function Orb({ pulse, mode = 'ready' }) {
  const ref = useRef(null)
  const pulseRef = useRef(0)
  const modeRef = useRef(mode)

  useEffect(() => {
    pulseRef.current = 1
  }, [pulse])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = SIZE
    canvas.height = SIZE

    let raf
    const c = SIZE / 2
    const t0 = performance.now()
    let last = t0
    let angle = 0

    const frame = (now) => {
      const t = (now - t0) / 1000
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const m = modeRef.current
      pulseRef.current *= 0.965

      let drive = 0.05 + 0.04 * Math.sin(t * 1.6)
      let spin = 1
      let grow = 0
      let wave = 0.08 // particle surface ripple strength
      if (m === 'listening') {
        drive = 0.32 + 0.1 * Math.sin(t * 5.5)
        spin = 1.6
        grow = 0.08
      } else if (m === 'processing') {
        drive = 0.16 + 0.1 * Math.sin(t * 9)
        spin = 3
      } else if (m === 'speaking') {
        // Exaggerated but still clean: stronger breath, reactive waveform, more spin & size
        drive =
          0.38 +
          0.48 *
            Math.abs(
              Math.sin(t * 12) * Math.sin(t * 4.2) + 0.35 * Math.sin(t * 22)
            )
        spin = 2.15
        grow = 0.1
        wave = 0.14
      }
      angle += dt * 0.28 * spin
      const pu = Math.max(pulseRef.current, drive)
      const R = R0 * (1 + grow + pu * (m === 'speaking' ? 0.07 : 0.04))

      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.globalCompositeOperation = 'lighter'

      // outer glow — brighter when speaking
      const glowAlpha = m === 'speaking' ? 0.38 + pu * 0.35 : 0.28 + pu * 0.25
      let g = ctx.createRadialGradient(c, c, 20, c, c, 215)
      g.addColorStop(0, `rgba(40,150,255,${glowAlpha})`)
      g.addColorStop(0.55, 'rgba(20,90,200,0.12)')
      g.addColorStop(1, 'rgba(0,40,120,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)

      const ay = angle
      const ax = 0.38
      const cy = Math.cos(ay),
        sy = Math.sin(ay)
      const cx = Math.cos(ax),
        sx = Math.sin(ax)

      for (let i = 0; i < N; i++) {
        const p = base[i]
        const n =
          Math.sin(p.x * 3.1 + t * 1.15) *
          Math.cos(p.y * 3.4 - t * 0.9) *
          Math.sin(p.z * 3.0 + t * 0.7)
        const d = 1 + 0.16 * n + pu * wave * Math.sin(p.y * 8 - t * 6)
        let x = p.x * d,
          y = p.y * d,
          z = p.z * d
        let x1 = x * cy + z * sy
        let z1 = -x * sy + z * cy
        let y1 = y * cx - z1 * sx
        let z2 = y * sx + z1 * cx
        const depth = (z2 + 1.3) / 2.6
        const f = 520 / (520 + z2 * R)
        const px = c + x1 * R * f
        const py = c + y1 * R * f
        const a = (0.12 + depth * 0.85) * (0.55 + p.s * 0.6)
        const sz = (0.5 + depth * 1.1) * (0.7 + p.s * 0.7)
        ctx.beginPath()
        ctx.arc(px, py, sz, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(120,220,255,${a})`
        ctx.fill()
      }

      // bright core — larger & hotter while speaking
      const coreR = m === 'speaking' ? 26 + pu * 14 : 22 + pu * 8
      g = ctx.createRadialGradient(c, c, 0, c, c, coreR)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.35, 'rgba(160,230,255,0.9)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(c, c, coreR + 8, 0, Math.PI * 2)
      ctx.fill()

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} className="orb-canvas" width={SIZE} height={SIZE} />
}
