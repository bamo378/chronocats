import { useEffect, useRef, useState } from 'react'
import { Profile, PROFILES, addPlayTime, loadArena, saveArena, today } from '../profiles/store'
import { UpdateProfile } from '../App'
import { Exercise, generateFor, checkTyped, strategy } from '../engine/exercises'
import { recordSpeedAnswer } from '../engine/learner'
import { applyRewards } from '../game/rewards'
import { GameBar, Keypad, Miss } from '../components/ui'
import { Icon } from '../components/Icon'
import { Cat } from '../components/Cat'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { Intro } from './Intro'

const N = 20
const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]

/** Générateur pseudo-aléatoire déterministe : le même défi pour les deux sœurs. */
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function dailySet(day = today()): Exercise[] {
  const rng = seeded(Number(day.replace(/-/g, '')))
  const out: Exercise[] = []
  const seen = new Set<string>()
  let guard = 0
  while (out.length < N && guard++ < 500) {
    const e = generateFor(TABLES, rng, 'type')
    const k = `${Math.min(e.a, e.b)}x${Math.max(e.a, e.b)}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out
}

export function Daily({ profile, update, onExit }: { profile: Profile; update: UpdateProfile; onExit: () => void }) {
  const day = today()
  const [set] = useState(() => dailySet(day))
  const already = loadArena().daily[day]?.[profile.id]
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>(already ? 'end' : 'intro')
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<null | 'ok' | 'ko'>(null)
  const [elapsed, setElapsed] = useState(0)
  const [misses, setMisses] = useState<Miss[]>([])
  const [xp, setXp] = useState(0)
  const t0 = useRef(0)
  const st = useRef({ score: 0, lock: false })
  const prof = useRef(profile)
  prof.current = profile
  const ex = set[i]

  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => setElapsed((Date.now() - t0.current) / 1000), 100)
    return () => clearInterval(id)
  }, [phase])

  function answer(v: number) {
    if (st.current.lock) return
    st.current.lock = true
    const r = checkTyped(ex, v)
    const np: Profile = structuredClone(prof.current)
    recordSpeedAnswer(np.learner, ex, r.correct, r.error, 0)
    update((p) => Object.assign(p, np))
    if (r.correct) { st.current.score++; setScore(st.current.score); setFlash('ok'); sfx.coin() }
    else {
      setFlash('ko'); sfx.soft()
      const n = ex.a === ex.table ? ex.b : ex.a
      setMisses((m) => [...m, { a: ex.a, b: ex.b, p: ex.product, tip: strategy(ex.table, n) }])
    }
    setTimeout(() => {
      setFlash(null)
      setTyped('')
      st.current.lock = false
      if (i + 1 >= set.length) end()
      else setI(i + 1)
    }, r.correct ? 250 : 900)
  }

  function press(k: string) {
    if (phase !== 'play' || st.current.lock) return
    if (k === '⌫') { setTyped((t) => t.slice(0, -1)); return }
    if (k === 'OK') { if (typed) answer(Number(typed)); return }
    const t = typed.length >= 3 ? typed : typed + k
    setTyped(t)
    if (t.length >= String(ex.product).length) answer(Number(t))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === 'Enter') press('OK')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function end() {
    const ms = Date.now() - t0.current
    const ar = loadArena()
    ar.daily[day] = { ...(ar.daily[day] ?? {}) }
    if (!ar.daily[day]![profile.id]) ar.daily[day]![profile.id] = { score: st.current.score, ms, at: Date.now() }
    saveArena(ar)
    const np: Profile = structuredClone(prof.current)
    addPlayTime(np, ms)
    const rw = applyRewards(np, { correct: st.current.score, bonus: 30 })
    update((p) => Object.assign(p, np))
    setXp(rw.xp)
    sfx.fanfare()
    fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 70)
    setPhase('end')
  }

  if (phase === 'intro')
    return <Intro def={{ name: 'Défi du jour', icon: 'calendar', rules: '20 calculs, les mêmes pour Anaëlle et Alice. Le score compte d’abord, puis le temps. Seul le premier essai de la journée compte.', from: '#f59e0b', to: '#ec4899' }} onStart={() => { t0.current = Date.now(); setPhase('play') }} onExit={onExit} />

  if (phase === 'end') {
    const res = loadArena().daily[day] ?? {}
    return (
      <div className="screen result">
        <div className="result-card">
          <div className="eyebrow">Défi du {new Date().toLocaleDateString('fr-CH', { day: 'numeric', month: 'long' })}</div>
          <h1>Résultats du jour</h1>
          <div className="duel-score">
            {PROFILES.map((p) => {
              const r = res[p.id]
              return (
                <div key={p.id} className="ds" style={{ ['--c' as any]: p.color }}>
                  <span className="df-av"><Cat coat={p.id === profile.id ? profile.cat.coat : p.coat} mood="happy" size="100%" /></span>
                  {r ? <><b className="big-num">{r.score}<small>/20</small></b><span className="muted">{p.name} · {(r.ms / 1000).toFixed(1)} s</span></> : <><b className="big-num dim">–</b><span className="muted">{p.name} n’a pas encore joué</span></>}
                </div>
              )
            })}
          </div>
          {xp > 0 && <div className="rewards"><span className="reward"><Icon name="sparkles" size={16} /> +{xp} XP</span></div>}
          {misses.length > 0 && (
            <div className="misses">
              <div className="eyebrow">À revoir</div>
              <ul>{misses.slice(0, 6).map((m, k) => <li key={k}><span className="mono">{m.a} × {m.b} = <b>{m.p}</b></span><small>{m.tip}</small></li>)}</ul>
            </div>
          )}
          <div className="result-actions"><button className="btn btn-primary big" onClick={onExit}>Retour</button></div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen play speed">
      <GameBar onExit={onExit}>
        <span className="gb-title">Défi du jour<small>Question {i + 1} / {N}</small></span>
        <span className="gb-progress"><i style={{ width: `${(i / N) * 100}%` }} /></span>
        <span className="score-chip"><Icon name="check" size={16} /> {score}</span>
        <span className="time-chip"><Icon name="timer" size={16} /> {elapsed.toFixed(1)} s</span>
      </GameBar>
      <div className="arena-body">
        <div className={`calc ${flash === 'ok' ? 'calc-ok' : ''} ${flash === 'ko' ? 'calc-shake' : ''}`}>
          <span>{ex.a}</span><span className="op">×</span><span>{ex.b}</span><span className="op">=</span>
          <span className={`slot ${typed ? 'filled' : ''} ${flash === 'ko' ? 'bad' : ''}`}>{flash === 'ko' ? ex.product : typed || '?'}</span>
        </div>
        <Keypad onKey={press} okDisabled={!typed} />
      </div>
    </div>
  )
}
