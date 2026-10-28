import { useEffect, useMemo, useRef, useState } from 'react'
import { Galaxy } from './Galaxy'
import { calendarDate, coverage, formatYears, frontRadius, spanYears, UNIVERSE_YEARS } from './model'

const milestones = [
  { name: 'Big Bang', age: 13_800_000_000, note: 'The observable universe begins expanding.', precision: '≈' },
  { name: 'Milky Way begins forming', age: 13_600_000_000, note: 'Its earliest stars formed very early; the galaxy assembled over time.', precision: '≈, uncertain' },
  { name: 'Sun and Earth form', age: 4_600_000_000, note: 'A planetary system takes shape in one spiral arm.', precision: '≈' },
  { name: 'Earliest evidence of life', age: 3_500_000_000, note: 'Evidence on Earth is ancient, and its exact date is debated.', precision: '≈, uncertain' },
  { name: 'Complex multicellular life', age: 600_000_000, note: 'Life begins diversifying into many large forms.', precision: '≈' },
  { name: 'Dinosaurs appear', age: 230_000_000, note: 'They will dominate land ecosystems for millions of years.', precision: '≈' },
  { name: 'Homo sapiens', age: 300_000, note: 'Our species arrives astonishingly late.', precision: '≈' },
  { name: 'Recorded history', age: 5_000, note: 'Writing captures only a sliver of the story.', precision: '≈' },
  { name: 'Technological civilization', age: 200, note: 'Industrial technology and radio emerge only moments ago.', precision: '≈, illustrative' },
  { name: 'You are here', age: 0, note: 'The final instant of the cosmic year.', precision: '' },
] as const

const windows = [
  { label: 'All time', years: UNIVERSE_YEARS },
  { label: 'Recent life', years: 600_000_000 },
  { label: 'Humanity', years: 1_000_000 },
  { label: 'Civilization', years: 10_000 },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return reduced
}

function TimeSection() {
  const [windowIndex, setWindowIndex] = useState(0)
  const [selected, setSelected] = useState(0)
  const [calendar, setCalendar] = useState(false)
  const range = windows[windowIndex].years
  const visible = milestones.map((event, i) => ({ ...event, index: i })).filter(event => event.age <= range)
  const active = milestones[selected]
  const position = Math.max(0, Math.min(100, (1 - active.age / range) * 100))
  return <section id="time" className="section time-section">
    <div className="section-intro"><span className="eyebrow">01 / THE SCALE OF TIME</span><h2>Nearly all of history<br /><em>happened without us.</em></h2><p>The universe is about 13.8 billion years old. Pull time closer and watch humanity appear at the very edge.</p></div>
    <div className="time-experience">
      <div className="time-topline"><span>{calendar ? 'ONE YEAR = 13.8 BILLION YEARS' : `VIEWING THE LAST ${formatYears(range).toUpperCase()}`}</span><button className="text-button" onClick={() => setCalendar(!calendar)} aria-pressed={calendar}>{calendar ? '↩ Geological time' : '◷ Cosmic calendar'}</button></div>
      <div className="time-readout"><span>{calendar ? calendarDate(active.age) : active.precision + ' ' + (active.age === 0 ? 'Now' : `${formatYears(active.age)} ago`)}</span><h3>{active.name}</h3><p>{active.note}</p></div>
      <div className="timeline-wrap">
        <div className="timeline-line"><div className="timeline-progress" style={{ width: `${position}%` }} /><div className="timeline-cursor" style={{ left: `${position}%` }} />{visible.map(event => <button key={event.name} className={`timeline-point ${event.index === selected ? 'selected' : ''}`} style={{ left: `${(1 - event.age / range) * 100}%` }} onClick={() => setSelected(event.index)} aria-label={`Select ${event.name}`} title={event.name} />)}</div>
        <div className="timeline-labels"><span>{calendar ? calendarDate(range) : formatYears(range) + ' ago'}</span><span>YOU ARE HERE ↑</span></div>
        <input className="timeline-slider" aria-label="Explore cosmic time" type="range" min="0" max="1000" value={Math.round(position * 10)} onChange={e => { const age = range * (1 - Number(e.target.value) / 1000); setSelected(visible.reduce((best, event) => Math.abs(event.age - age) < Math.abs(milestones[best].age - age) ? event.index : best, visible[0].index)) }} />
      </div>
      <div className="zoom-control" aria-label="Timeline zoom">{windows.map((view, i) => <button key={view.label} className={windowIndex === i ? 'active' : ''} onClick={() => { setWindowIndex(i); if (milestones[selected].age > view.years) setSelected(milestones.findIndex(event => event.age <= view.years)) }}>{view.label}</button>)}</div>
      <div className="event-strip">{visible.map(event => <button key={event.name} className={event.index === selected ? 'active' : ''} onClick={() => setSelected(event.index)}>{event.name}</button>)}</div>
    </div>
    <p className="section-aside">On a one-year cosmic calendar, our recorded history occupies only the final seconds of December 31.</p>
  </section>
}

function Slider({ label, value, min, max, step, onChange, display }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; display: string }) {
  return <label className="control-slider"><span><b>{label}</b><strong>{display}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>
}

function Simulator({ speed, setSpeed, delay, setDelay, span, reduced }: { speed: number; setSpeed: (n: number) => void; delay: number; setDelay: (n: number) => void; span: number; reduced: boolean }) {
  const [elapsed, setElapsed] = useState(() => span * 0.18)
  const [playing, setPlaying] = useState(false)
  const [playback, setPlayback] = useState(250_000)
  const [seedVersion, setSeedVersion] = useState(0)
  const lastTime = useRef(0)
  useEffect(() => { if (reduced) setPlaying(false) }, [reduced])
  useEffect(() => {
    if (!playing) return
    let frame = 0
    const tick = (time: number) => {
      if (lastTime.current) {
        const delta = Math.min((time - lastTime.current) / 1000, 0.1)
        setElapsed(prev => {
          const next = Math.min(span, prev + delta * playback)
          if (next >= span) setPlaying(false)
          return next
        })
      }
      lastTime.current = time
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); lastTime.current = 0 }
  }, [playing, playback, span])
  const radius = frontRadius(elapsed, speed, delay)
  const covered = coverage(radius)
  return <section id="expansion" className="section simulator-section"><div className="section-intro"><span className="eyebrow">02 / THE GALACTIC EXPANSION SIMULATOR</span><h2>What if one civilization<br /><em>kept going?</em></h2><p>Place an imaginary civilization in the Milky Way. Change its travel speed and the wait between settlement waves.</p></div>
    <div className="sim-layout"><div className="galaxy-stage"><Galaxy radius={radius} seedVersion={seedVersion} /><div className="galaxy-legend"><span><i className="legend-dot cyan" />Reached in the model</span><span><i className="legend-dot muted" />Unreached sample</span></div></div>
    <div className="sim-console"><div className="sim-time"><span className="eyebrow">TIME ELAPSED</span><strong>{formatYears(elapsed)}</strong><span>of ≈ {formatYears(span)} to reach the farthest edge</span></div><div className="coverage"><span>ESTIMATED STARS REACHED</span><strong>{(covered * 100).toFixed(covered < 0.01 ? 2 : 1)}%</strong><div><i style={{ width: `${covered * 100}%` }} /></div></div>
      <div className="sim-play"><button className="play-button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>{playing ? 'Ⅱ' : '▶'}</button><button className="reset-button" onClick={() => { setPlaying(false); setElapsed(0); setSeedVersion(v => v + 1) }}>↺ Reset</button><select aria-label="Simulation playback speed" value={playback} onChange={e => setPlayback(Number(e.target.value))}><option value={50000}>50,000 years/s</option><option value={250000}>250,000 years/s</option><option value={1000000}>1 million years/s</option></select></div>
      <Slider label="Time elapsed" value={Math.min(elapsed, span)} min={0} max={span} step={Math.max(1, span / 1000)} onChange={setElapsed} display={`${Math.round(elapsed / span * 100)}%`} />
      <div className="sim-parameters"><Slider label="Travel speed" value={speed} min={0.01} max={0.3} step={0.01} onChange={setSpeed} display={`${Math.round(speed * 100)}% of light speed`} /><Slider label="Wait between waves" value={delay} min={0} max={2000} step={50} onChange={setDelay} display={`${delay.toLocaleString()} years`} /></div>
      <p className="model-note">Thought experiment: each wave travels 5 light-years, then waits before launching the next. The glow shows a sample of stars inside a uniform expansion front. It assumes continuous, outward settlement; real civilizations may behave very differently.</p>
    </div></div>
  </section>
}

function HeadStart({ span }: { span: number }) {
  const [headStart, setHeadStart] = useState(100_000_000)
  const spans = headStart / span
  return <section id="headstart" className="section headstart-section"><div className="section-intro"><span className="eyebrow">03 / THE COSMIC HEAD START</span><h2>Imagine arriving<br /><em>before us.</em></h2><p>For Earth, a million years is vast. Against a galaxy’s age, it is a narrow head start.</p></div>
    <div className="headstart-layout"><div className="headstart-visual"><div className="compare-top"><span>AN EARLIER CIVILIZATION</span><b>{formatYears(headStart)} before us</b></div><div className="compare-track"><div className="compare-fill" style={{ width: `${Math.min(100, spans * 14 + 3)}%` }} />{Array.from({ length: Math.min(7, Math.floor(spans)) }, (_, i) => <i key={i} className="span-mark" style={{ left: `${(i + 1) / Math.max(spans, 1) * 100}%` }} />)}<span className="alien-marker">✦</span><span className="human-marker">YOU<br />ARE HERE</span></div><div className="compare-bottom"><span>EARLIER</span><span>NOW</span></div><div className="headstart-figure"><strong>{spans < 0.1 ? spans.toFixed(2) : spans < 10 ? spans.toFixed(1) : Math.round(spans).toLocaleString()}×</strong><p>the model’s galaxy-spanning time fits inside that head start.</p></div></div>
    <div className="headstart-controls"><span className="eyebrow">CHOOSE A HEAD START</span><div className="preset-list">{[1_000_000, 10_000_000, 100_000_000, 1_000_000_000].map(years => <button key={years} className={headStart === years ? 'active' : ''} onClick={() => setHeadStart(years)}><span>{formatYears(years)}</span><span>↗</span></button>)}</div><p>At your current simulator settings, the expansion front takes about <b>{formatYears(span)}</b> to reach the farthest edge.</p><p className="muted-copy">This is a time comparison, not a claim that anyone survived, expanded, or crossed the galaxy repeatedly.</p></div></div>
  </section>
}

const possibilities = [
  ['Rare beginnings', 'Intelligent life may be exceptionally uncommon.'],
  ['Brief windows', 'Technological civilizations may not last long.'],
  ['Different ambitions', 'Expansion may not interest other civilizations.'],
  ['Harder journeys', 'Interstellar settlement may be far more difficult.'],
  ['Hidden signals', 'We may not recognize activity from far away.'],
  ['An early chapter', 'Humanity may have arrived early.'],
]

function QuestionSection() {
  const [open, setOpen] = useState<number | null>(null)
  return <section id="question" className="section question-section"><div className="question-content"><span className="eyebrow">04 / THE QUESTION</span><h2>A galaxy full of stars.<br /><em>A sky full of silence.</em></h2><p>The Milky Way holds roughly 100–400 billion stars. Many planetary systems are far older than ours. If some civilizations arose long ago, and if even a few expanded steadily, parts of the galaxy might be reachable on timescales far shorter than its age.</p><p>Yet we have <b>no confirmed evidence</b> of extraterrestrial civilizations. That tension is the Fermi Paradox.</p><div className="possibilities"><span className="eyebrow">POSSIBLE EXPLANATIONS · NONE ESTABLISHED</span>{possibilities.map(([title, description], i) => <button key={title} className={open === i ? 'open' : ''} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}><span><i>0{i + 1}</i>{title}</span><strong>{open === i ? '−' : '+'}</strong>{open === i && <small>{description}</small>}</button>)}</div></div></section>
}

export function App() {
  const reduced = useReducedMotion()
  const [speed, setSpeed] = useState(0.08)
  const [delay, setDelay] = useState(300)
  const span = useMemo(() => spanYears(speed, delay), [speed, delay])
  return <><div className="ambient-stars" aria-hidden="true" /><header className="site-header"><a className="brand" href="#top"><span className="brand-icon">✳</span>FERMI <span>PARADOX</span></a><nav aria-label="Sections"><a href="#time">Time</a><a href="#expansion">Expansion</a><a href="#headstart">Head start</a><a href="#question">The question</a></nav><a className="header-here" href="#time"><i />YOU ARE HERE</a></header>
    <main><section id="top" className="hero"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-glow" /><div className="hero-content"><span className="eyebrow">AN INTERACTIVE JOURNEY THROUGH COSMIC TIME</span><h1>The universe had<br /><em>time to happen.</em></h1><p>13.8 billion years. Hundreds of billions of stars. And one unsettling question.</p><a className="hero-cta" href="#time">BEGIN THE JOURNEY <span>↓</span></a></div><div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span>01 — 04</span></div></section>
    <TimeSection /><Simulator speed={speed} setSpeed={setSpeed} delay={delay} setDelay={setDelay} span={span} reduced={reduced} /><HeadStart span={span} /><QuestionSection />
    <section className="closing"><span className="eyebrow">THE FERMI PARADOX</span><h2>Where is<br /><em>everybody?</em></h2><span className="closing-star">✦</span></section></main>
    <footer><div><b>FERMI PARADOX</b><p>An interactive thought experiment, not a prediction.</p></div><details><summary>About the model & sources</summary><p>The simulator assumes a circular 100,000-light-year galaxy and an isotropic settlement front. Each 5-light-year hop takes distance / travel speed years, followed by the chosen delay. Coverage is the fraction of 8,000 deterministic display stars inside the front, not a forecast of actual inhabited stars. The origin is arbitrary; it starts away from the center. No claim about the existence, motives, longevity, or detection of extraterrestrial life is implied.</p><p>Dates and scale: <a href="https://science.nasa.gov/exoplanets/what-is-the-universe/" target="_blank" rel="noreferrer">NASA · Universe age</a>, <a href="https://spaceplace.nasa.gov/galaxies-age/en/" target="_blank" rel="noreferrer">NASA · Galaxy age</a>, <a href="https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/" target="_blank" rel="noreferrer">NASA · Milky Way scale</a>, <a href="https://humanorigins.si.edu/evidence/human-fossils/species/homo-sapiens" target="_blank" rel="noreferrer">Smithsonian · Homo sapiens</a>, <a href="https://science.nasa.gov/exoplanets/search-for-life/" target="_blank" rel="noreferrer">NASA · Search for life</a>. Earth milestones are rounded and some, especially early life and galaxy formation, are uncertain.</p></details><a href="#top">BACK TO THE BEGINNING ↑</a></footer>
  </>
}
