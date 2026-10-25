import { useEffect, useState } from 'react'

// Landscape/laptop: scale the fixed stage to fit the window (aspect kept).
// Portrait phones: fill width and allow vertical scroll of the stage.
export function useStageScale(designW = 1440, designH = 900) {
  const [scale, setScale] = useState(1)
  const [mode, setMode] = useState('fit') // 'fit' | 'scroll'

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const isPortrait = h > w
      if (isPortrait) {
        setMode('scroll')
        setScale(w / designW)
      } else {
        setMode('fit')
        setScale(Math.min(w / designW, h / designH))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [designW, designH])

  return { scale, mode }
}

export function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}
