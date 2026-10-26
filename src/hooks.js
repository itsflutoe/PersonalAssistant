import { useEffect, useState } from 'react'

// Phones are detected from the physical screen, not the window, so the phone keyboard opening
// (which shrinks the window) or "Desktop site" mode cannot flip the layout.
function isPhoneDevice() {
  const s = window.screen
  const short = Math.min(s?.width || 9999, s?.height || 9999)
  return short <= 600 || /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)
}

function isPortrait() {
  const o = window.screen?.orientation?.type
  if (o) return o.startsWith('portrait')
  return window.innerHeight >= window.innerWidth
}

// Laptop/desktop/tablet-landscape: scale the fixed stage to fit the window (aspect kept).
// Phones (and narrow portrait windows): stacked layout scaled to the screen width.
export function useStageScale(w, h, mobileW = 400) {
  const calc = () => {
    const iw = window.innerWidth
    const ih = window.innerHeight
    const phone = isPhoneDevice()
    const portrait = isPortrait()
    const mobile = phone || (ih > iw && iw < 900)
    let scale
    if (!mobile) scale = Math.min(iw / w, ih / h)
    else if (phone && !portrait) scale = Math.min(iw / mobileW, 1.25) // phone held sideways
    else scale = iw / mobileW
    // ultrawide window: the stage is letterboxed left/right, so the scene fades into the side bars
    const wide = !mobile && iw / ih > (w / h) * 1.12
    return { mobile, scale, wide }
  }

  const [s, setS] = useState(calc)
  useEffect(() => {
    const fit = () =>
      setS((prev) => {
        const n = calc()
        return n.mobile === prev.mobile && n.wide === prev.wide && Math.abs(n.scale - prev.scale) < 0.001
          ? prev
          : n
      })
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    window.screen?.orientation?.addEventListener?.('change', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
      window.screen?.orientation?.removeEventListener?.('change', fit)
    }
  }, [w, h, mobileW])
  return s
}

// A number that drifts randomly around `base` every `ms` milliseconds.
export function useLive(base, spread, ms = 1600, min = 0, max = 100) {
  const [v, setV] = useState(base)
  useEffect(() => {
    const id = setInterval(() => {
      setV((p) => {
        const next = p + (Math.random() - 0.5) * spread + (base - p) * 0.15
        return Math.max(min, Math.min(max, next))
      })
    }, ms)
    return () => clearInterval(id)
  }, [base, spread, ms, min, max])
  return v
}

// A scrolling data series (values 0-100) for sparklines and area charts.
export function useSeries(len, ms = 900, seed = 50) {
  const [data, setData] = useState(() => {
    const arr = []
    let p = seed
    for (let i = 0; i < len; i++) {
      p = Math.max(8, Math.min(92, p + (Math.random() - 0.5) * 26))
      arr.push(p)
    }
    return arr
  })
  useEffect(() => {
    const id = setInterval(() => {
      setData((d) => {
        const last = d[d.length - 1]
        const next = Math.max(8, Math.min(92, last + (Math.random() - 0.5) * 26))
        return [...d.slice(1), next]
      })
    }, ms)
    return () => clearInterval(id)
  }, [ms])
  return data
}

export function useClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}
