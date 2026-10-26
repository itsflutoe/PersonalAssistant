import { useEffect, useRef } from 'react'

/* Simple animated holographic orb – canvas based for performance */
export default function Orb({ pulse = 0, mode = 'ready', scale = 1, lite = false }) {
  const canvasRef = useRef(null)
  const raf = useRef(0)
  const pulseRef = useRef(pulse)
  pulseRef.current = pulse

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2)
    const size = lite ? 280 : 360
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    let t = 0
    const colors = {
      ready: ['#00f2ff', '#4fd1ff', '#0ea5e9'],
      listening: ['#ff0055', '#ff4d7a', '#f43f5e'],
      processing: ['#38bdf8', '#0ea5e9', '#0284c7'],
      speaking: ['#00ff88', '#34d399', '#10b981'],
    }

    const draw = () => {
      t += 0.016
      const cols = colors[mode] || colors.ready
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2
      const cy = size / 2
      const baseR = size * 0.22

      // outer glow
      const g = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, baseR * 2.2)
      g.addColorStop(0, cols[0] + '40')
      g.addColorStop(0.5, cols[1] + '18')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * 2.2, 0, Math.PI * 2)
      ctx.fill()

      // core
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR)
      core.addColorStop(0, '#fff')
      core.addColorStop(0.25, cols[0])
      core.addColorStop(0.7, cols[1] + 'cc')
      core.addColorStop(1, cols[2] + '00')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, baseR * (1 + Math.sin(t * 2) * 0.04 + (pulseRef.current % 2) * 0.02), 0, Math.PI * 2)
      ctx.fill()

      // rings
      for (let i = 0; i < (lite ? 2 : 3); i++) {
        const r = baseR * (1.4 + i * 0.35) + Math.sin(t * 1.5 + i) * 4
        ctx.strokeStyle = cols[i % 3] + (lite ? '55' : '77')
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // particles
      if (!lite) {
        for (let i = 0; i < 18; i++) {
          const a = t * 0.6 + (i / 18) * Math.PI * 2
          const rr = baseR * 1.6 + Math.sin(t + i) * 12
          const x = cx + Math.cos(a) * rr
          const y = cy + Math.sin(a) * rr
          ctx.fillStyle = cols[i % 3] + 'aa'
          ctx.beginPath()
          ctx.arc(x, y, 1.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      raf.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf.current)
  }, [mode, lite])

  return (
    <canvas
      ref={canvasRef}
      className="orb-canvas"
      style={{ transform: `scale(${scale})` }}
      aria-hidden
    />
  )
}
