import { useEffect, useRef } from 'react'

const SIZE = 440
const R = 128
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

export default function Orb({ pulse }) {
  const ref = useRef(null)
  const pulseRef = useRef(0)

  useEffect(() => {
    pulseRef.current = 1
  }, [pulse])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    let raf
    const c = SIZE / 2
    const t0 = performance.now()

    const frame = (now) => {
      const t = (now - t0) / 1000
      pulseRef.current *= 0.965
      const pu = pulseRef.current

      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.globalCompositeOperation = 'lighter'

      // soft outer glow
      let g = ctx.createRadialGradient(c, c, 20, c, c, 215)
      g.addColorStop(0, `rgba(40,150,255,${0.28 + pu * 0.25})`)
      g.addColorStop(0.55, 'rgba(20,90,200,0.12)')
      g.addColorStop(1, 'rgba(0,40,120,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)

      const ay = t * 0.28
      const ax = 0.38
      const cy = Math.cos(ay), sy = Math.sin(ay)
      const cx = Math.cos(ax), sx = Math.sin(ax)

      // sphere particles
      for (let i = 0; i < N; i++) {
        const p = base[i]
        const n =
          Math.sin(p.x * 3.1 + t * 1.15) *
          Math.cos(p.y * 3.4 - t * 0.9) *
          Math.sin(p.z * 3.0 + t * 0.7)
        const d = 1 + 0.16 * n + pu * 0.08 * Math.sin(p.y * 8 - t * 6)
        let x = p.x * d, y = p.y * d, z = p.z * d
        // rotate Y then X
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
        const hot = Math.max(0, n) * 1.4
        ctx.fillStyle = `rgba(${90 + hot * 150},${190 + hot * 50},255,${Math.min(a, 1)})`
        ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz)
      }

      // orbiting particle bands
      for (const b of bands) {
        const ct = Math.cos(b.tilt), st = Math.sin(b.tilt)
        const cs = Math.cos(b.spin + t * 0.2), ss = Math.sin(b.spin + t * 0.2)
        for (const p of b.pts) {
          const a = p.a + t * b.speed
          const rr = b.radius + p.j + pu * 0.05
          let x = Math.cos(a) * rr
          let y = Math.sin(a) * rr * 0.28
          let z = Math.sin(a) * rr
          // tilt then spin
          const y1 = y * ct - z * st
          const z1 = y * st + z * ct
          const x2 = x * cs + z1 * ss
          const z2 = -x * ss + z1 * cs
          const depth = (z2 + 1.5) / 3
          const f = 520 / (520 + z2 * R)
          const px = c + x2 * R * f
          const py = c + y1 * R * f
          ctx.fillStyle = `rgba(120,215,255,${0.1 + depth * 0.6})`
          const sz = 0.6 + depth * 0.9 + p.s * 0.4
          ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz)
        }
      }

      // bright core
      const flick = 0.9 + Math.sin(t * 3.1) * 0.05 + pu * 0.3
      g = ctx.createRadialGradient(c, c, 0, c, c, 95)
      g.addColorStop(0, `rgba(255,255,255,${Math.min(flick, 1)})`)
      g.addColorStop(0.12, `rgba(190,240,255,${0.85 * flick})`)
      g.addColorStop(0.4, 'rgba(40,170,255,0.3)')
      g.addColorStop(1, 'rgba(0,80,200,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)

      // faint lens streaks through the core
      g = ctx.createLinearGradient(c - 120, 0, c + 120, 0)
      g.addColorStop(0, 'rgba(120,220,255,0)')
      g.addColorStop(0.5, `rgba(200,245,255,${0.35 + pu * 0.3})`)
      g.addColorStop(1, 'rgba(120,220,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(c - 120, c - 0.6, 240, 1.2)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={ref}
      className="orb-canvas"
      style={{ width: SIZE, height: SIZE }}
    />
  )
}
