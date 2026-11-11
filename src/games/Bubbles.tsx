import { useRef, useState } from 'react'
import { Profile, addPlayTime, recordGame } from '../profiles/store'
import { UpdateProfile } from '../App'
import { Exercise, generateFor, strategy } from '../engine/exercises'
import { factWeights, recordSpeedAnswer } from '../engine/learner'
import { GAME_BY_ID, tablesLabel } from '../game/games'
import { applyRewards } from '../game/rewards'
import { GameBar, ResultView, Miss } from '../components/ui'
import { Icon } from '../components/Icon'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { Intro } from './Intro'

interface Bubble { v: number; ok: boolean; lane: number; delay: number; state: 'up' | 'pop' | 'bad' }

const HUES = ['#38bdf8', '#a78bfa', '#f472b6', '#34d399']

export function Bubbles({ profile, update, onExit, onAgain }: { profile: Profile; update: UpdateProfile; onExit: () => void; onAgain: () => void }) {
  const def = GAME_BY_ID.bulles
  const tables = profile.selection
  const best = profile.records.bulles
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [round, setRound] = useState(0)
  const [ex, setEx] = useState<Exercise | null>(null)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [misses, setMisses] = useState<Miss[]>([])
  const [result, setResult] = useState<{ record: boolean; xp: number; coins: number; cubes: number } | null>(null)
  const prof = useRef(profile)
  prof.current = profile
  const st = useRef({ score: 0, lives: 3, total: 0, logged: false, done: false, t: 0 })

  const speed = (r: number) => Math.max(3.4, 7.5 - r * 0.22)

  function newRound(r: number) {
    const e = generateFor(tables, Math.random, 'choice', factWeights(prof.current.learner))
    const lanes = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
    setEx(e)
    setBubbles(e.choices!.map((c, i) => ({ v: c.value as number, ok: c.correct, lane: lanes[i], delay: Math.random() * 0.7, state: 'up' })))
    setRound(r)
    st.current.logged = false
    st.current.done = false
  }

  function log(correct: boolean) {
    if (st.current.logged || !ex) return
    st.current.logged = true
    st.current.total++
    const np: Profile = structuredClone(prof.current)
    recordSpeedAnswer(np.learner, ex, correct, undefined, 0)
    update((p) => Object.assign(p, np))
    if (!correct) {
      const n = ex.a === ex.table ? ex.b : ex.a
      setMisses((m) => (m.some((x) => x.p === ex.product) ? m : [...m, { a: ex.a, b: ex.b, p: ex.product, tip: strategy(ex.table, n) }]))
    }
  }

  function loseLife() {
    st.current.lives--
    setLives(st.current.lives)
    sfx.soft()
    if (st.current.lives <= 0) { finish(); return true }
    return false
  }

  function tap(i: number, el: HTMLElement) {
    const b = bubbles[i]
    if (st.current.done || b.state !== 'up') return
    const r = el.getBoundingClientRect()
    if (b.ok) {
      st.current.done = true
      log(true)
      st.current.score++
      setScore(st.current.score)
      sfx.coin()
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, 'stars', 16)
      setBubbles((bs) => bs.map((x, j) => (j === i ? { ...x, state: 'pop' } : x)))
      setTimeout(() => newRound(round + 1), 450)
    } else {
      log(false)
      setBubbles((bs) => bs.map((x, j) => (j === i ? { ...x, state: 'bad' } : x)))
      loseLife()
    }
  }

  function escaped(b: Bubble) {
    if (!b.ok || b.state !== 'up' || st.current.done) return
    st.current.done = true
    log(false)
    if (!loseLife()) setTimeout(() => newRound(round + 1), 300)
  }

  function finish() {
    if (phase === 'end') return
    st.current.done = true
    const np: Profile = structuredClone(prof.current)
    addPlayTime(np, Date.now() - st.current.t)
    const record = recordGame(np, { game: 'bulles', score: st.current.score, correct: st.current.score, total: st.current.total, tables })
    const rw = applyRewards(np, { correct: st.current.score, record })
    update((p) => Object.assign(p, np))
    setResult({ record, ...rw })
    setTimeout(() => {
      setPhase('end')
      if (record) { sfx.fanfare(); fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 90) }
    }, 500)
  }

  if (phase === 'intro') return <Intro def={def} tables={tables} best={best} onStart={() => { st.current.t = Date.now(); setPhase('play'); newRound(0) }} onExit={onExit} />

  if (phase === 'end' && result)
    return (
      <ResultView
        profile={profile}
        title="Bulles"
        score={score}
        unit="bulles"
        record={result.record}
        best={best}
        stats={[['calculs', st.current.total], ['vitesse atteinte', `niveau ${round + 1}`], ['livrets', tables.join(', ')]]}
        rewards={result}
        misses={misses}
        onAgain={onAgain}
        onExit={onExit}
      />
    )

  return (
    <div className="screen play bubbles">
      <GameBar onExit={onExit}>
        <span className="gb-title">Bulles<small>{tablesLabel(tables)}</small></span>
        <span className="score-chip"><Icon name="star" size={16} fill /> {score}</span>
        <span className="lives">{[0, 1, 2].map((i) => <Icon key={i} name="heart" size={22} fill={i < lives} className={i < lives ? 'live' : 'lost'} />)}</span>
      </GameBar>
      {ex && (
        <div className="bub-q" key={ex.id}>
          <span className="mono">{ex.a} × {ex.b}</span>
        </div>
      )}
      <div className="bub-field">
        {bubbles.map((b, i) => (
          <button
            key={`${round}-${i}`}
            className={`bub ${b.state}`}
            style={{ left: `${12 + b.lane * 25}%`, animationDuration: `${speed(round)}s`, animationDelay: `${b.delay}s`, ['--h' as any]: HUES[b.lane] }}
            onPointerDown={(e) => { e.preventDefault(); tap(i, e.currentTarget) }}
            onAnimationEnd={(e) => { if (e.animationName === 'rise') escaped(b) }}
          >
            {b.v}
          </button>
        ))}
      </div>
    </div>
  )
}
