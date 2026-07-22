'use client'

import { useEffect, useRef, useState } from 'react'

const INSTALL = 'npx scaffold-foc'

/* ---------- scroll reveal ---------- */
function useReveal() {
  useEffect(() => {
    document.body.classList.add('js-ready')
    const els = document.querySelectorAll('[data-reveal]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('shown'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('shown')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ---------- typing terminal ---------- */
type Line = { text: string; tone?: 'dim' | 'ok' | 'cmd' }

const SEQUENCE: Line[] = [
  { text: '$ npx scaffold-foc my-project', tone: 'cmd' },
  { text: 'creating my-project', tone: 'dim' },
  { text: '$ npm run foc:check', tone: 'cmd' },
  { text: 'wallet          connected', tone: 'ok' },
  { text: 'calibration RPC reachable', tone: 'ok' },
  { text: 'tFIL for gas    2.41', tone: 'ok' },
  { text: 'USDFC balance   funded', tone: 'ok' },
  { text: 'storage provider selected', tone: 'ok' },
  { text: 'operator approval granted', tone: 'ok' },
  { text: 'ready to store on Filecoin', tone: 'dim' },
]

function Terminal() {
  const [visible, setVisible] = useState<number>(0)
  const [typed, setTyped] = useState('')
  const started = useRef(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    function start() {
      if (started.current) return
      started.current = true
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        setTyped(SEQUENCE[0].text)
        setVisible(SEQUENCE.length)
        return
      }
      const first = SEQUENCE[0].text
      let i = 0
      const typeTimer = setInterval(() => {
        i++
        setTyped(first.slice(0, i))
        if (i >= first.length) {
          clearInterval(typeTimer)
          setVisible(1)
          let n = 1
          const streamTimer = setInterval(() => {
            n++
            setVisible(n)
            if (n >= SEQUENCE.length) clearInterval(streamTimer)
          }, 380)
        }
      }, 55)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { start(); io.disconnect(); break }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="term" ref={wrapRef} data-reveal>
      <div className="term-bar">
        <span className="tdot" />
        <span className="tdot" />
        <span className="tdot" />
        <span className="term-title">my-project — foc:check</span>
      </div>
      <div className="term-body" aria-hidden="true">
        {SEQUENCE.map((line, idx) => {
          if (idx > visible) return null
          const isTypingLine = idx === 0
          const content = isTypingLine ? typed : line.text
          if (!content) return null
          const showCaret = isTypingLine && visible < 1
          return (
            <div key={idx} className={`t-line ${line.tone ?? ''}`}>
              {line.tone === 'ok' && <span className="t-tick">✓</span>}
              <span>{content}</span>
              {showCaret && <span className="caret" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- copy command ---------- */
function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(text) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button className="copyblock" onClick={copy} aria-label="Copy install command">
      <span className="cb-prompt">$</span>
      <span className="cb-cmd">{text}</span>
      <span className="cb-icon" aria-hidden="true">
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        )}
      </span>
    </button>
  )
}

const STEPS = [
  { k: '01', title: 'Scaffold the project', body: 'One command gives you a Next.js app with the Synapse SDK, upload and retrieve routes, and the foc: scripts already wired up.', code: 'npx scaffold-foc my-project\ncd my-project\nnpm install' },
  { k: '02', title: 'Check and fund', body: 'Add your calibration key, then let the CLI tell you exactly what is missing and provision it for you.', code: 'npm run foc:check\nnpm run foc:setup' },
  { k: '03', title: 'Store your first file', body: 'Start the dev server and upload to real Filecoin storage. The round trip is already built.', code: 'npm run dev' },
]

const SCRIPTS = [
  { name: 'foc:check', body: 'Inspects wallet, RPC, gas, USDFC balance, providers, and approvals — with a fix for every failing line.' },
  { name: 'foc:setup', body: 'Deposits USDFC and grants operator approval in one transaction so uploads stop getting rejected.' },
  { name: 'foc:test-upload', body: 'Uploads a small file and pulls it back, proving a real round trip against live storage.' },
  { name: 'foc:status', body: 'Reports account funds, data sets, and proof state — the health of everything you have stored.' },
]

const INCLUDED = [
  'Next.js 16 and TypeScript',
  'Synapse SDK, pre-configured',
  'Upload and retrieve routes',
  'Live storage status endpoint',
  'Wallet key normalization',
  'AGENTS.md for AI editors',
  'Calibration testnet defaults',
  'Ready-to-edit env template',
]

export default function Home() {
  useReveal()
  return (
    <>
      <div className="aurora" />

      <div className="nav-wrapper">
        <header className="nav">
          <div className="nav-inner">
            <a className="brand" href="#top">
              <img
                src="/ChatGPT_Image_Jul_22__2026__01_27_48_PM-removebg-preview.png"
                alt="scaffold-foc logo"
                className="brand-logo"
              />
              scaffold-foc
            </a>
            <nav className="nav-links">
              <a href="#see-it">See it</a>
              <a href="#how">Workflow</a>
              <a href="#scripts">Scripts</a>
              <a className="nav-btn" href="https://www.npmjs.com/package/scaffold-foc" target="_blank" rel="noreferrer">npm</a>
            </nav>
          </div>
        </header>
      </div>

      <main id="top">
        {/* -------- HERO (centered, full fold) -------- */}
        <section className="hero">
          <div className="hero-inner wrap">
            <h1 data-reveal style={{ ['--i' as string]: 1 }}>
              Ship on Filecoin<br />
              in one command.
            </h1>
            <p className="lede" data-reveal style={{ ['--i' as string]: 2 }}>
              scaffold-foc generates a working Next.js app that uploads, retrieves, and verifies real
              storage — and checks your whole setup before you waste an afternoon on wallets and
              approvals.
            </p>
            <div className="hero-cta" data-reveal style={{ ['--i' as string]: 3 }}>
              <CopyBlock text={INSTALL} />
              <a className="btn-ghost" href="https://github.com/aabxtract/Filecoin-FOC-scaffold" target="_blank" rel="noreferrer">
                GitHub <span className="arrow">→</span>
              </a>
            </div>
            <p className="hero-note" data-reveal style={{ ['--i' as string]: 4 }}>
              Node 20+ · Runs against the Filecoin calibration testnet
            </p>
          </div>
          <a className="scroll-hint" href="#see-it" aria-label="See it in action">
            <span>See it in action</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
          </a>
        </section>

        <section id="see-it" className="section wrap" data-reveal>
          <div className="sec-head centered" data-reveal>
            <span className="label">Live preview</span>
            <h2>Watch the setup run itself.</h2>
            <p className="sec-lede">
              Every scaffolded project ships with <code>foc:check</code> — a script that verifies your
              entire Filecoin setup and tells you exactly what to fix.
            </p>
          </div>
          <div className="term-frame"><Terminal /></div>
        </section>

        <section id="how" className="section wrap" data-reveal>
          <div className="sec-head centered" data-reveal>
            <span className="label">Workflow</span>
            <h2>From nothing to stored, in three steps.</h2>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" data-reveal style={{ ['--i' as string]: i }} key={s.k}>
                <div className="step-key">{s.k}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <pre><code>{s.code}</code></pre>
              </div>
            ))}
          </div>
        </section>

        <section id="scripts" className="section wrap" data-reveal>
          <div className="sec-head centered" data-reveal>
            <span className="label">The foc: scripts</span>
            <h2>Filecoin&apos;s trickiest setup, as one-liners.</h2>
          </div>
          <div className="scripts">
            {SCRIPTS.map((s, i) => (
              <div className="script" data-reveal style={{ ['--i' as string]: i }} key={s.name}>
                <code className="s-name"><span className="s-run">npm run</span> {s.name}</code>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="inside" className="section wrap" data-reveal>
          <div className="sec-head centered" data-reveal>
            <span className="label">In the box</span>
            <h2>Everything a scaffolded project ships with.</h2>
          </div>
          <ul className="inside">
            {INCLUDED.map((t, i) => (
              <li data-reveal style={{ ['--i' as string]: i }} key={t}>
                <span className="tick" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="final wrap" data-reveal>
          <h2>Start building on Filecoin.</h2>
          <CopyBlock text={INSTALL} />
        </section>
      </main>

      <footer className="footer" data-reveal>
        <div className="wrap footer-inner">
          <span>Built for Filecoin Onchain Cloud · MIT licensed</span>
          <div className="footer-links">
            <a href="https://www.npmjs.com/package/scaffold-foc" target="_blank" rel="noreferrer">npm</a>
            <a href="https://github.com/aabxtract/Filecoin-FOC-scaffold" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </>
  )
}
