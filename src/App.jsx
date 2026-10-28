import { useCallback, useEffect, useRef, useState } from 'react'
import { useStageScale } from './hooks.js'
import Orb from './Orb.jsx'
import { Background, Overlays, OrbRings, Platform, Connectors, Reticle, SignalGlobe } from './Decor.jsx'
import { SystemDiagnostics, NetworkStatus, AnalyticsA, AnalyticsB } from './Panels.jsx'
import { TextTerminal, CommandTerminal } from './Terminals.jsx'
import {
  askGroq,
  cleanForSpeech,
  speakText,
  stopSpeech,
  unlockSpeech,
  SpeechRecognitionCtor,
} from './flux.js'

const W = 1408
const H = 768
const MW = 400
const MH = 1034

let uid = 0
const mk = (from, text, typing = false) => ({ id: ++uid, from, text, typing })

const INITIAL = [
  mk('ai', 'Hello, world. Systems are online and ready to enhance your technological experience with intelligence.'),
  mk('user', 'Run a system diagnostic.'),
  mk('ai', 'Diagnostics complete. All subsystems are within normal range. Shall I proceed with a deep scan?'),
  mk('user', 'Yes, please do.'),
]

const M = {
  orb: { left: -20, top: -20, transform: 'scale(0.82)', transformOrigin: 'center' },
  rings: { left: -30, top: -30, transform: 'scale(0.82)', transformOrigin: 'center' },
  platform: { left: -60, top: 340, transform: 'scale(0.75)', transformOrigin: 'center' },
  text: { left: 12, top: 392, width: 376, height: 230 },
  cmd: { left: 12, top: 634, width: 376, height: 128 },
  diag: { left: 12, top: 776, width: 184, height: 100 },
  net: { left: 204, top: 776, width: 184, height: 100 },
  anA: { left: 12, top: 884, width: 184, height: 136 },
  anB: { left: 204, top: 884, width: 184, height: 136 },
}

const RB = 'https://de1.api.radio-browser.info'

/* ---------- Weather helpers ---------- */

function conditionLabel(code) {
  const c = code ?? -1
  if (c === 0) return 'SUNNY'
  if (c === 1) return 'MAINLY CLEAR'
  if (c === 2) return 'PARTLY CLOUDY'
  if (c === 3) return 'OVERCAST'
  if (c === 45 || c === 48) return 'FOGGY'
  if (c >= 51 && c <= 55) return 'DRIZZLE'
  if (c >= 56 && c <= 57) return 'FREEZING DRIZZLE'
  if (c >= 61 && c <= 65) return 'RAINING'
  if (c >= 66 && c <= 67) return 'FREEZING RAIN'
  if (c >= 71 && c <= 77) return 'SNOWING'
  if (c >= 80 && c <= 82) return 'SHOWERS'
  if (c >= 85 && c <= 86) return 'SNOW SHOWERS'
  if (c >= 95 && c <= 99) return 'THUNDERSTORM'
  return 'UNKNOWN'
}

function conditionSpoken(code) {
  const c = code ?? -1
  if (c === 0) return 'it is sunny and clear'
  if (c === 1) return 'it is mainly clear'
  if (c === 2) return 'it is partly cloudy'
  if (c === 3) return 'it is overcast'
  if (c === 45 || c === 48) return 'it is foggy'
  if (c >= 51 && c <= 55) return 'there is light drizzle'
  if (c >= 56 && c <= 57) return 'there is freezing drizzle'
  if (c >= 61 && c <= 63) return 'it is raining'
  if (c >= 64 && c <= 65) return 'it is raining heavily'
  if (c >= 66 && c <= 67) return 'there is freezing rain'
  if (c >= 71 && c <= 75) return 'it is snowing'
  if (c === 77) return 'there are snow grains'
  if (c >= 80 && c <= 82) return 'there are rain showers'
  if (c >= 85 && c <= 86) return 'there are snow showers'
  if (c >= 95 && c <= 99) return 'there is a thunderstorm'
  return 'conditions are mixed'
}

async function fetchWeatherData(location) {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
  )
  if (!geoRes.ok) throw new Error('Geocoding service unavailable')
  const geo = await geoRes.json()
  const place = geo?.results?.[0]
  if (!place) throw new Error(`I could not find a location matching "${location}".`)

  const { latitude, longitude, name, admin1, country } = place
  const label = [name, admin1, country].filter(Boolean).join(', ')
  const shortPlace = name || location

  const wxRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weathercode`
  )
  if (!wxRes.ok) throw new Error('Weather service unavailable')
  const wx = await wxRes.json()
  const temp = wx?.current?.temperature_2m
  const humidity = wx?.current?.relative_humidity_2m
  const code = wx?.current?.weathercode
  if (temp == null) throw new Error('Weather data was incomplete')

  const condition = conditionLabel(code)
  const howItIs = conditionSpoken(code)
  const spoken = `In ${label}, ${howItIs}. Temperature is ${Math.round(temp)} degrees.`

  return { place: shortPlace, label, temp, humidity, code, condition, spoken }
}

function isWeatherCommand(text) {
  const t = text.trim().toLowerCase()
  return t.startsWith('/weather') || t.startsWith('/wheather')
}

function extractWeatherLocation(text) {
  return text.trim().replace(/^\/(?:weather|wheather)\s*/i, '').trim()
}

/* ---------- Radio (/rad) helpers — Radio Browser ---------- */

function isRadCommand(text) {
  return text.trim().toLowerCase().startsWith('/rad')
}

function extractRadQuery(text) {
  return text.trim().replace(/^\/rad\s*/i, '').trim()
}

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

async function fetchRadioStations(query) {
  const q = query.trim()
  if (!q) throw new Error('Specify a place or tag. Example: /rad philippines')

  const country = titleCase(q)
  const params = new URLSearchParams({
    hidebroken: 'true',
    limit: '24',
    order: 'clickcount',
    reverse: 'true',
  })
  params.set('country', country)

  let res = await fetch(`${RB}/json/stations/search?${params}`, {
    headers: { 'User-Agent': 'FluxHUD/1.0' },
  })
  if (!res.ok) throw new Error('Radio directory unavailable')
  let list = await res.json()

  if (!Array.isArray(list) || list.length === 0) {
    const p2 = new URLSearchParams({
      hidebroken: 'true',
      limit: '24',
      order: 'clickcount',
      reverse: 'true',
      name: q,
    })
    res = await fetch(`${RB}/json/stations/search?${p2}`, {
      headers: { 'User-Agent': 'FluxHUD/1.0' },
    })
    if (!res.ok) throw new Error('Radio directory unavailable')
    list = await res.json()
  }

  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`No working radio signals found for "${q}".`)
  }

  return list
    .filter((s) => s.url_resolved || s.url)
    .slice(0, 20)
    .map((s) => ({
      id: s.stationuuid,
      name: s.name?.trim() || 'Unknown station',
      url: s.url_resolved || s.url,
      country: s.country || '',
      tags: s.tags || '',
      bitrate: s.bitrate || 0,
      codec: s.codec || '',
      favicon: s.favicon || '',
    }))
}

/* ---------- Radio side panel ---------- */

function RadioSidePanel({ open, minimized, query, stations, playingId, onSelect, onClose, onToggleMin }) {
  if (!open) return null
  return (
    <aside className={`radio-panel ${minimized ? 'min' : ''}`}>
      <header className="radio-panel-head">
        <span className="radio-panel-title">SIGNAL LOCK · {query ? query.toUpperCase() : '—'}</span>
        <div className="radio-panel-actions">
          <button type="button" className="rp-btn" onClick={onToggleMin} title={minimized ? 'Expand' : 'Minimize'}>
            {minimized ? '▢' : '–'}
          </button>
          <button type="button" className="rp-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>
      </header>
      {!minimized && (
        <div className="radio-panel-body">
          <div className="radio-panel-meta">{stations.length} signals · select to transmit</div>
          <ul className="radio-list">
            {stations.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`radio-item ${playingId === s.id ? 'playing' : ''}`}
                  onClick={() => onSelect(s)}
                >
                  <span className="ri-name">{s.name}</span>
                  <span className="ri-meta">
                    {[s.bitrate ? `${s.bitrate}k` : null, s.codec, s.country].filter(Boolean).join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

export default function App() {
  const { scale, mobile } = useStageScale(W, H, MW)
  const [messages, setMessages] = useState(INITIAL)
  const [pulse, setPulse] = useState(0)
  const [status, setStatus] = useState('ready')
  const [weather, setWeather] = useState(null)

  // radio state
  const [globeMode, setGlobeMode] = useState('idle') // idle | scanning | locked
  const [radioQuery, setRadioQuery] = useState('')
  const [stations, setStations] = useState([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMin, setPanelMin] = useState(false)
  const [playingId, setPlayingId] = useState(null)

  const timer = useRef(null)
  const history = useRef([])
  const recRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(
    () => () => {
      clearInterval(timer.current)
      stopSpeech()
      recRef.current?.abort?.()
      audioRef.current?.pause?.()
    },
    []
  )

  const typeReply = useCallback((full) => {
    const reply = mk('ai', '', true)
    clearInterval(timer.current)
    setMessages((m) => [...m, reply])
    let i = 0
    timer.current = setInterval(() => {
      i += 2
      setMessages((m) =>
        m.map((x) => (x.id === reply.id ? { ...x, text: full.slice(0, i), typing: i < full.length } : x))
      )
      if (i >= full.length) clearInterval(timer.current)
    }, 22)
  }, [])

  const playStation = useCallback((station) => {
    if (!audioRef.current) audioRef.current = new Audio()
    const a = audioRef.current
    a.pause()
    a.src = station.url
    a.play().catch(() => {
      typeReply(`Unable to open stream for ${station.name}.`)
    })
    setPlayingId(station.id)
    // register click with Radio Browser (optional, helps ranking)
    fetch(`${RB}/json/url/${station.id}`, { headers: { 'User-Agent': 'FluxHUD/1.0' } }).catch(() => {})
  }, [typeReply])

  const stopRadio = useCallback(() => {
    audioRef.current?.pause?.()
    setPlayingId(null)
  }, [])

  const handleSubmit = useCallback(
    async (text) => {
      if (text.toLowerCase() === 'clear') {
        stopSpeech()
        clearInterval(timer.current)
        history.current = []
        setMessages([])
        setStatus('ready')
        return
      }

      unlockSpeech()
      stopSpeech()
      clearInterval(timer.current)

      setMessages((m) => [...m, mk('user', text)])
      setPulse((p) => p + 1)
      setStatus('processing')

      // ---------- /rad (Radio Browser) ----------
      if (isRadCommand(text)) {
        const q = extractRadQuery(text)
        try {
          if (!q) {
            const msg = 'Specify a place or tag. Example: /rad philippines'
            typeReply(msg)
            speakText(msg, {
              onStart: () => setStatus('speaking'),
              onEnd: () => setStatus('ready'),
            })
            return
          }
          setGlobeMode('scanning')
          setRadioQuery(q)
          setPanelOpen(false)
          const list = await fetchRadioStations(q)
          setStations(list)
          setGlobeMode('locked')
          setPanelOpen(true)
          setPanelMin(false)
          const msg = `Signal lock on ${q}: ${list.length} working stations. Open the signal panel or tap the globe to choose.`
          history.current.push({ role: 'user', content: text })
          history.current.push({ role: 'assistant', content: msg })
          typeReply(msg)
          speakText(msg, {
            onStart: () => setStatus('speaking'),
            onEnd: () => setStatus('ready'),
          })
        } catch (err) {
          setGlobeMode('idle')
          const msg = err?.message || 'Radio scan failed.'
          typeReply(msg)
          speakText(msg, {
            onStart: () => setStatus('speaking'),
            onEnd: () => setStatus('ready'),
          })
        }
        return
      }

      // ---------- Weather ----------
      if (isWeatherCommand(text)) {
        const location = extractWeatherLocation(text)
        try {
          if (!location) {
            const msg = 'Please specify a location after the command. For example: /weather pandi.'
            typeReply(msg)
            speakText(msg, {
              onStart: () => setStatus('speaking'),
              onEnd: () => setStatus('ready'),
            })
            return
          }
          const data = await fetchWeatherData(location)
          setWeather({
            place: data.place,
            temp: data.temp,
            humidity: data.humidity,
            code: data.code,
            condition: data.condition,
          })
          history.current.push({ role: 'user', content: text })
          history.current.push({ role: 'assistant', content: data.spoken })
          typeReply(data.spoken)
          const clean = cleanForSpeech(data.spoken)
          if (clean) {
            speakText(clean, {
              onStart: () => setStatus('speaking'),
              onEnd: () => setStatus('ready'),
            })
          } else setStatus('ready')
        } catch (err) {
          const msg = err?.message || 'Weather lookup failed.'
          typeReply(msg)
          speakText(msg, {
            onStart: () => setStatus('speaking'),
            onEnd: () => setStatus('ready'),
          })
        }
        return
      }

      // ---------- Groq ----------
      history.current.push({ role: 'user', content: text })
      try {
        const raw = (await askGroq(history.current)) || '...'
        history.current.push({ role: 'assistant', content: raw })
        typeReply(raw)
        const clean = cleanForSpeech(raw)
        if (clean) {
          speakText(clean, {
            onStart: () => setStatus('speaking'),
            onEnd: () => setStatus('ready'),
          })
        } else setStatus('ready')
      } catch (err) {
        history.current.pop()
        typeReply(`Connection fault: ${err.message}`)
        setStatus('ready')
      }
    },
    [typeReply]
  )

  const handleMic = useCallback(() => {
    if (status === 'listening') {
      recRef.current?.stop()
      return
    }
    if (status === 'speaking') {
      stopSpeech()
      setStatus('ready')
      return
    }
    if (status === 'processing') return
    if (!SpeechRecognitionCtor) {
      typeReply('Voice input is not supported in this browser. Try Chrome, Edge or Safari.')
      return
    }
    unlockSpeech()
    stopSpeech()
    const rec = new SpeechRecognitionCtor()
    rec.lang = 'en-AU'
    rec.continuous = false
    rec.interimResults = false
    rec.onstart = () => setStatus('listening')
    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript?.trim()
      if (t) handleSubmit(t)
    }
    rec.onerror = (e) => {
      setStatus('ready')
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        typeReply('Microphone access was blocked. Please allow the microphone in your browser settings.')
      }
    }
    rec.onend = () => setStatus((s) => (s === 'listening' ? 'ready' : s))
    recRef.current = rec
    try {
      rec.start()
    } catch {
      setStatus('ready')
    }
  }, [status, handleSubmit, typeReply])

  const stageW = mobile ? MW : W
  const stageH = mobile ? MH : H
  const stageStyle = mobile
    ? { width: MW, height: MH, left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${scale})` }
    : { width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }

  const stage = (
    <div className={mobile ? 'stage mobile' : 'stage'} style={stageStyle}>
      <Background slice={mobile} />
      <Overlays />

      <Platform style={mobile ? M.platform : undefined} />
      <OrbRings style={mobile ? M.rings : undefined} />
      <div className="orb-wrap" style={mobile ? M.orb : undefined}>
        <Orb pulse={pulse} mode={status} />
      </div>

      {!mobile && (
        <>
          <Connectors />
          <div className="cluster-frame" />
        </>
      )}

      <SystemDiagnostics style={mobile ? M.diag : { left: 70, top: 76, width: 154, height: 100 }} />
      <NetworkStatus style={mobile ? M.net : { left: 231, top: 76, width: 122, height: 100 }} />
      <AnalyticsA style={mobile ? M.anA : { left: 70, top: 184, width: 154, height: 136 }} />
      <AnalyticsB
        style={mobile ? M.anB : { left: 231, top: 184, width: 122, height: 136 }}
        weather={weather}
      />

      {!mobile && (
        <>
          <Reticle size={150} cls="ret-left" dense>
            <div className="ret-readout left">
              <span>LAT 14.5995</span>
              <span>LNG 120.9842</span>
            </div>
          </Reticle>
          <div className="signal-globe-wrap">
            <SignalGlobe
              size={178}
              mode={globeMode}
              label={radioQuery}
              playing={!!playingId}
              onClick={() => {
                if (stations.length) {
                  setPanelOpen(true)
                  setPanelMin(false)
                }
              }}
            />
          </div>
          <div className="deco-lines left">
            <span>▸ SECTOR 07 · LOCKED</span>
            <span>▸ TRACE 0x4F2A19</span>
            <span>▸ LINK ESTABLISHED</span>
          </div>
        </>
      )}

      <RadioSidePanel
        open={panelOpen && stations.length > 0}
        minimized={panelMin}
        query={radioQuery}
        stations={stations}
        playingId={playingId}
        onSelect={playStation}
        onClose={() => {
          setPanelOpen(false)
          stopRadio()
        }}
        onToggleMin={() => setPanelMin((v) => !v)}
      />

      <TextTerminal
        messages={messages}
        style={mobile ? M.text : { left: 1010, top: 65, width: 335, height: 262 }}
      />
      <CommandTerminal
        onSubmit={handleSubmit}
        onMic={handleMic}
        status={status}
        autoFocus={!mobile}
        style={mobile ? M.cmd : { left: 298, top: 603, width: 812, height: 128 }}
      />
    </div>
  )

  if (mobile) {
    return (
      <div className="viewport mobile">
        <div style={{ position: 'relative', width: stageW * scale, height: stageH * scale }}>{stage}</div>
      </div>
    )
  }

  return <div className="viewport">{stage}</div>
}
