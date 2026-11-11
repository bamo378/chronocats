import { useEffect, useRef, useState } from 'react'
import { Profile, addPlayTime, recordGame } from '../profiles/store'
import { UpdateProfile } from '../App'
import { Exercise, generateFor, checkTyped, strategy } from '../engine/exercises'
import { factWeights, recordSpeedAnswer } from '../engine/learner'
import { GAME_BY_ID, tablesLabel } from '../game/games'
import { applyRewards } from '../game/rewards'
import { GameBar, Keypad, ResultView, Miss } from '../components/ui'
import { Icon } from '../components/Icon'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { Intro } from './Intro'

const SPRINT = 60

/** Éclair (60 s) et Survie (3 vies, chrono par calcul qui raccourcit). */
export function Speed({ profile, update, mode, onExit, onAgain }: { profile: Profile; update: UpdateProfile; mode: 'eclair' | 'survie'; onExit: () => void; onAgain: () => void }) {
  const def = GAME_BY_ID[mode]
  const tables = profile.selection
  const best = profile.records[mode]
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const mk = (p: Profile) => generateFor(tables, Math.random, 'type', factWeights(p.learner))
  const [ex, setEx] = useState<Exercise>(() => mk(profile))
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState(0)
  const [good, setGood] = useState(0)
  const [total, setTotal] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [lives, setLives] = useState(3)
  const [left, setLeft] = useState(SPRINT)
  const [qLeft, setQLeft] = useState(1)
  const [flash, setFlash] = useState<null | 'ok' | 'ko'>(null)
  const [misses, setMisses] = useState<Miss[]>([])
  const [result, setResult] = useState<{ record: boolean; xp: number; coins: number; cubes: number } | null>(null)
  const t0 = useRef(0)
  const q0 = useRef(0)
  const lock = useRef(false)
  const card = useRef<HTMLDivElement>(null)
  const prof = useRef(profile)
  const st = useRef({ score: 0, good: 0, total: 0 })
  prof.current = profile

  const qLimit = (n: number) => Math.max(2.6, 8 - n * 0.22) * 1000

  // Horloge du jeu.
  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => {
      if (mode === 'eclair') {
        const l = Math.max(0, SPRINT - (Date.now() - t0.current) / 1000)
        setLeft(l)
        if (l <= 0) finish()
      } else if (!lock.current) {
        const frac = 1 - (Date.now() - q0.current) / qLimit(good)
        setQLeft(Math.max(0, frac))
        if (frac <= 0) answer(null)
      }
    }, 50)
    return () => clearInterval(id)
  })

  function start() {
    setPhase('play')
    t0.current = Date.now()
    q0.current = Date.now()
  }

  function next(p: Profile) {
    let n: Exercise
    let guard = 0
    do { n = mk(p); guard++ } while (n.a === ex.a && n.b === ex.b && guard < 8)
    setEx(n)
    setTyped('')
    q0.current = Date.now()
    setQLeft(1)
    lock.current = false
  }

  function answer(value: number | null) {
    if (lock.current || phase !== 'play') return
    lock.current = true
    const r = value === null ? { correct: false, error: undefined } : checkTyped(ex, value)
    const ms = Date.now() - q0.current
    const np: Profile = structuredClone(prof.current)
    recordSpeedAnswer(np.learner, ex, r.correct, r.error, ms)
    addPlayTime(np, Math.min(ms, 20000))
    update((p) => Object.assign(p, np))
    st.current.total++
    setTotal(st.current.total)
    if (r.correct) {
      const c = combo + 1
      setCombo(c)
      setBestCombo((b) => Math.max(b, c))
      st.current.good++
      st.current.score += 1 + (mode === 'eclair' && c % 5 === 0 ? 1 : 0)
      setGood(st.current.good)
      setScore(st.current.score)
      setFlash('ok')
      sfx.coin()
      fx.at(card.current, c >= 5 ? 'confetti' : 'stars', c >= 5 ? 20 : 10)
      setTimeout(() => { setFlash(null); next(np) }, 180)
    } else {
      setCombo(0)
      setFlash('ko')
      sfx.soft()
      const n = ex.a === ex.table ? ex.b : ex.a
      setMisses((m) => (m.some((x) => x.p === ex.product) ? m : [...m, { a: ex.a, b: ex.b, p: ex.product, tip: strategy(ex.table, n) }]))
      const lv = mode === 'survie' ? lives - 1 : lives
      if (mode === 'survie') setLives(lv)
      setTimeout(() => {
        setFlash(null)
        if (mode === 'survie' && lv <= 0) finish(np)
        else next(np)
      }, 1000)
    }
  }

  function press(k: string) {
    if (phase !== 'play' || lock.current) return
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

  function finish(from?: Profile) {
    if (phase === 'end') return
    setPhase('end')
    const { score: finalScore, good, total } = st.current
    let rec = false
    let rw = { xp: 0, coins: 0, cubes: 0 }
    const np: Profile = structuredClone(from ?? prof.current)
    rec = recordGame(np, { game: mode, score: finalScore, correct: good, total, tables })
    rw = applyRewards(np, { correct: good, record: rec })
    update((p) => Object.assign(p, np))
    setResult({ record: rec, ...rw })
    if (rec) { sfx.fanfare(); setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 90), 150) }
    else sfx.good()
  }

  if (phase === 'intro') return <Intro def={def} tables={tables} best={best} onStart={start} onExit={onExit} />

  if (phase === 'end' && result)
    return (
      <ResultView
        profile={profile}
        title={def.name}
        score={score}
        unit="points"
        record={result.record}
        best={best}
        stats={[['bonnes réponses', `${good}/${total}`], ['meilleure série', bestCombo], ['livrets', tables.join(', ')]]}
        rewards={result}
        misses={misses}
        onAgain={onAgain}
        onExit={onExit}
      />
    )

  return (
    <div className="screen play speed">
      <GameBar onExit={onExit}>
        <span className="gb-title">{def.name}<small>{tablesLabel(tables)}</small></span>
        <span className="score-chip"><Icon name="star" size={16} fill /> {score}</span>
        {combo >= 2 && <span key={combo} className="combo"><Icon name="flame" size={16} fill /> {combo}</span>}
        {mode === 'eclair' ? (
          <span className={`time-chip ${left < 10 ? 'low' : ''}`}><Icon name="timer" size={16} /> {Math.ceil(left)}</span>
        ) : (
          <span className="lives">{[0, 1, 2].map((i) => <Icon key={i} name="heart" size={22} fill={i < lives} className={i < lives ? 'live' : 'lost'} />)}</span>
        )}
      </GameBar>
      <div className="timebar"><i style={{ width: `${(mode === 'eclair' ? left / SPRINT : qLeft) * 100}%` }} className={mode === 'survie' && qLeft < 0.3 ? 'low' : ''} /></div>
      <div className="arena-body">
        <div ref={card} className={`calc ${flash === 'ok' ? 'calc-ok' : ''} ${flash === 'ko' ? 'calc-shake' : ''}`}>
          <span>{ex.a}</span><span className="op">×</span><span>{ex.b}</span><span className="op">=</span>
          <span className={`slot ${typed ? 'filled' : ''} ${flash === 'ko' ? 'bad' : ''}`}>{flash === 'ko' ? ex.product : typed || '?'}</span>
        </div>
        <Keypad onKey={press} okDisabled={!typed} />
      </div>
    </div>
  )
}
