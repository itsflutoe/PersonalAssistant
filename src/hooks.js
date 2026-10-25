import { useEffect, useState } from 'react'

// Scales a fixed-size stage to fit the window, keeping aspect ratio.
export function useStageScale(w, h) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / w, window.innerHeight / h))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [w, h])
  return scale
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
