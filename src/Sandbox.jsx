import { useEffect, useRef, useState, useCallback } from 'react'

export function extractCodeBlocks(text) {
  if (!text || typeof text !== 'string') return []
  const re = /```(\w*)\s*\n?([\s\S]*?)```/g
  const out = []
  let m
  while ((m = re.exec(text)) !== null) {
    const lang = (m[1] || '').toLowerCase().trim()
    const code = (m[2] || '').trim()
    if (code) out.push({ lang, code })
  }
  return out
}

export function pickRunnableBlock(blocks) {
  if (!blocks?.length) return null
  const rank = (lang) => {
    if (['html', 'htm'].includes(lang)) return 0
    if (['javascript', 'js', 'jsx'].includes(lang)) return 1
    if (lang === 'css') return 2
    if (!lang) return 3
    return 9
  }
  const sorted = [...blocks].sort((a, b) => rank(a.lang) - rank(b.lang))
  const best = sorted[0]
  if (rank(best.lang) > 3) return null
  return best
}

function buildPreviewHtml(block) {
  const { lang, code } = block
  const looksFullDoc = /^\s*<(!doctype|html)/i.test(code)
  if (looksFullDoc || lang === 'html' || lang === 'htm') {
    if (looksFullDoc) return code
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body>${code}</body></html>`
  }
  if (lang === 'css') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${code}</style></head><body>
      <div style="font-family:system-ui;padding:24px;color:#333">
        <h2>CSS payload applied to this page</h2>
        <p class="demo">Sample text with class "demo"</p>
        <button>Sample button</button>
      </div>
    </body></html>`
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>
    <div id="root" style="font-family:system-ui;padding:20px;color:#e8f4ff;background:#0a121c;min-height:100vh">
      <p style="opacity:0.7;font-size:13px">JS payload executing…</p>
    </div>
    <script>
      try {
        ${code}
      } catch (e) {
        document.getElementById('root').innerHTML =
          '<pre style="color:#f88">Runtime error:\n' + (e && e.message ? e.message : e) + '</pre>';
      }
    </script>
  </body></html>`
}

export default function Sandbox({ payload, active, onClose }) {
  const [phase, setPhase] = useState('idle')
  const [streamed, setStreamed] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const frameRef = useRef(null)
  const blobRef = useRef(null)
  const injectTimer = useRef(null)

  const clearBlob = () => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current)
      blobRef.current = null
    }
  }

  const loadFrame = useCallback((html) => {
    clearBlob()
    const frame = frameRef.current
    if (!frame) return
    try {
      const blob = new Blob([html], { type: 'text/html' })
      blobRef.current = URL.createObjectURL(blob)
      frame.src = blobRef.current
    } catch {
      frame.removeAttribute('src')
      frame.srcdoc = html
    }
  }, [])

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      setStreamed('')
      setFullscreen(false)
      clearInterval(injectTimer.current)
      clearBlob()
      if (frameRef.current) {
        frameRef.current.removeAttribute('src')
        frameRef.current.removeAttribute('srcdoc')
      }
      return
    }

    if (!payload?.code) {
      clearInterval(injectTimer.current)
      setStreamed('')
      setFullscreen(false)
      setPhase('awaiting')
      return
    }

    setPhase('injecting')
    setStreamed('')
    setFullscreen(false)
    clearInterval(injectTimer.current)

    const full = payload.code
    let i = 0
    const step = Math.max(2, Math.floor(full.length / 120))
    injectTimer.current = setInterval(() => {
      i = Math.min(full.length, i + step)
      setStreamed(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(injectTimer.current)
        setPhase('ready')
      }
    }, 16)

    return () => clearInterval(injectTimer.current)
  }, [active, payload])

  useEffect(() => () => {
    clearInterval(injectTimer.current)
    clearBlob()
  }, [])

  const execute = () => {
    if (!payload) return
    const html = buildPreviewHtml(payload)
    loadFrame(html)
    setPhase('preview')
  }

  const inspect = () => {
    setStreamed(payload?.code || '')
    setPhase('ready')
  }

  if (!active) return null

  return (
    <div className={`sandbox-root${fullscreen ? ' is-fs' : ''}`}>
      <div className="sandbox-layer">
        <div className="sandbox-head">
          <span>▸ SANDBOX CHANNEL · INJECTION</span>
          <div className="sandbox-head-actions">
            {phase === 'preview' && (
              <button type="button" className="sb-btn" onClick={() => setFullscreen((f) => !f)}>
                {fullscreen ? 'EXIT FS' : 'FULLSCREEN'}
              </button>
            )}
            <button type="button" className="sb-btn sb-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="sandbox-body">
          {phase === 'awaiting' && (
            <div className="sandbox-awaiting">
              <div className="sandbox-awaiting-title">CHANNEL OPEN</div>
              <div className="sandbox-awaiting-msg">
                Sandbox is active. When Flux returns HTML, JS, or CSS, it will inject here automatically.
              </div>
              <div className="sandbox-awaiting-hint">/sandbox off · CLOSE</div>
            </div>
          )}

          {phase !== 'preview' && phase !== 'awaiting' && (
            <pre className="sandbox-code">
              {streamed}
              {phase === 'injecting' && <span className="sandbox-caret" />}
            </pre>
          )}

          {phase === 'preview' && (
            <iframe
              ref={frameRef}
              className="sandbox-frame"
              title="Sandbox preview"
              sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
            />
          )}

          {phase === 'ready' && (
            <div className="sandbox-overlay">
              <div className="sandbox-card">
                <div className="sandbox-card-label">{'>>'} COMPILATION COMPLETE</div>
                <div className="sandbox-card-msg">PAYLOAD READY. EXECUTE TEST ENVIRONMENT?</div>
                <div className="sandbox-card-actions">
                  <button type="button" className="sb-btn sb-exec" onClick={execute}>
                    EXECUTE PREVIEW
                  </button>
                  <button type="button" className="sb-btn" onClick={inspect}>
                    INSPECT CODE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sandbox-foot">
          <span>
            {phase === 'awaiting' && 'SANDBOX ACTIVE · AWAITING PAYLOAD'}
            {phase === 'injecting' && 'INJECTING PAYLOAD…'}
            {phase === 'ready' && 'AWAITING EXECUTE / INSPECT'}
            {phase === 'preview' && `PREVIEW · ${(payload?.lang || 'code').toUpperCase()}`}
            {phase === 'idle' && 'IDLE'}
          </span>
          {phase === 'preview' && (
            <button type="button" className="sb-btn" onClick={() => setPhase('ready')}>
              BACK TO PROMPT
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
