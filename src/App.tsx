import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FLOWS } from './data/flows'
import { Schematic } from './components/Schematic'
import './index.css'

const AUTO_MS = 4200

export default function App() {
  const [flowId, setFlowId] = useState(FLOWS[0].id)
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(true)

  const flow = useMemo(() => FLOWS.find((f) => f.id === flowId) ?? FLOWS[0], [flowId])
  const step = flow.steps[stepIdx] ?? flow.steps[0]

  const goFlow = (id: string) => {
    setFlowId(id)
    setStepIdx(0)
  }

  const next = useCallback(() => {
    setStepIdx((i) => (i + 1) % flow.steps.length)
  }, [flow.steps.length])

  const prev = useCallback(() => {
    setStepIdx((i) => (i - 1 + flow.steps.length) % flow.steps.length)
  }, [flow.steps.length])

  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(next, AUTO_MS)
    return () => window.clearInterval(t)
  }, [playing, next, flowId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'p' || e.key === 'P') {
        setPlaying((p) => !p)
      } else if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1
        if (FLOWS[idx]) goFlow(FLOWS[idx].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">QRify Platform</div>
          <div className="brand-sub">Interactive schematic · interview walkthrough</div>
        </div>

        <nav className="flow-tabs" aria-label="Platform flows">
          {FLOWS.map((f, i) => (
            <button
              key={f.id}
              type="button"
              className={`flow-tab${f.id === flowId ? ' active' : ''}`}
              onClick={() => goFlow(f.id)}
            >
              {i + 1}. {f.title}
            </button>
          ))}
        </nav>

        <div className="controls">
          <button type="button" className="ctrl" onClick={prev} aria-label="Previous step">
            ‹
          </button>
          <button
            type="button"
            className={`ctrl primary${playing ? ' on' : ''}`}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? '❚❚ Auto' : '▶ Auto'}
          </button>
          <button type="button" className="ctrl" onClick={next} aria-label="Next step">
            ›
          </button>
        </div>
      </header>

      <main className="stage">
        <section className="canvas-wrap">
          <p className="flow-blurb">{flow.blurb}</p>
          <Schematic flow={flow} step={step} playing={playing} />
        </section>

        <aside className="panel">
          <div className="step-meta">
            <span className="step-index">
              STEP {String(stepIdx + 1).padStart(2, '0')} / {String(flow.steps.length).padStart(2, '0')}
            </span>
            <div className="step-dots" aria-hidden>
              {flow.steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`dot${i === stepIdx ? ' on' : ''}`}
                  onClick={() => setStepIdx(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${flow.id}-${step.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <h2 className="step-title">{step.title}</h2>
              <p className="step-body">{step.body}</p>
            </motion.div>
          </AnimatePresence>

          {step.callout && <div className="callout">{step.callout}</div>}

          <p className="hint">Keys: ← → step · Space next · P autoplay · 1–4 switch flow</p>
        </aside>
      </main>
    </div>
  )
}
