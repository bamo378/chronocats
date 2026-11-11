import { useEffect, useRef, useState } from 'react'
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

const DURATION = 45

export function TrueFalse({ profile, update, onExit, onAgain }: { profile: Profile; update: UpdateProfile; onExit: () => void; onAgain: () => void }) {
  const def = GAME_BY_ID.vraifaux
  const tables = profile.selection
  const best = profile.records.vraifaux
  const mk = (p: Profile) => generateFor(tables, Math.random, 'trueFalse', factWeights(p.learner))
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [ex, setEx] = useState<Exercise>(() => mk(profile))
  const [left, setLeft] = useState(DURATION)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [flash, setFlash] = useState<null | 'ok' | 'ko'>(null)
  const [misses, setMisses] = useState<Miss[]>([])
  const [result, setResult] = useState<{ record: boolean; xp: number; coins: number; cubes: number } | null>(null)
  const st = useRef({ score: 0, total: 0, best: 0, t: 0, lock: false })
  const prof = useRef(profile)
  prof.current = profile
  const card = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => {
      const l = Math.max(0, DURATION - (Date.now() - st.current.t) / 1000)
      setLeft(l)
      if (l <= 0) finish()
    }, 100)
    return () => clearInterval(id)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'v') judge(true)
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'f') judge(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function judge(saysTrue: boolean) {
    if (phase !== 'play' || st.current.lock) return
    st.current.lock = true
    const correct = saysTrue === ex.answer
    st.current.total++
    const np: Profile = structuredClone(prof.current)
    recordSpeedAnswer(np.learner, ex, correct, undefined, 0)
    update((p) => Object.assign(p, np))
    if (correct) {
      st.current.score++
      setScore(st.current.score)
      const c = combo + 1
      setCombo(c)
      st.current.best = Math.max(st.current.best, c)
      setFlash('ok')
      sfx.coin()
      fx.at(card.current, 'stars', 10)
      setTimeout(() => { setFlash(null); setEx(mk(np)); st.current.lock = false }, 160)
    } else {
      setCombo(0)
      setFlash('ko')
      sfx.soft()
      const n = ex.a === ex.table ? ex.b : ex.a
      setMisses((m) => (m.some((x) => x.p === ex.product) ? m : [...m, { a: ex.a, b: ex.b, p: ex.product, tip: strategy(ex.table, n) }]))
      setTimeout(() => { setFlash(null); setEx(mk(np)); st.current.lock = false }, 1000)
    }
  }

  function finish() {
    if (phase === 'end') return
    setPhase('end')
    const np: Profile = structuredClone(prof.current)
    addPlayTime(np, DURATION * 1000)
    const record = recordGame(np, { game: 'vraifaux', score: st.current.score, correct: st.current.score, total: st.current.total, tables })
    const rw = applyRewards(np, { correct: Math.round(st.current.score * 0.7), record })
    update((p) => Object.assign(p, np))
    setResult({ record, ...rw })
    if (record) { sfx.fanfare(); setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 90), 150) }
  }

  if (phase === 'intro') return <Intro def={def} tables={tables} best={best} onStart={() => { st.current.t = Date.now(); setPhase('play') }} onExit={onExit} note="Au clavier : flèche gauche = vrai, flèche droite = faux." />

  if (phase === 'end' && result)
    return (
      <ResultView
        profile={profile}
        title="Vrai ou faux"
        score={score}
        unit="points"
        record={result.record}
        best={best}
        stats={[['réponses', st.current.total], ['précision', st.current.total ? `${Math.round((st.current.score / st.current.total) * 100)} %` : '–'], ['meilleure série', st.current.best]]}
        rewards={result}
        misses={misses}
        onAgain={onAgain}
        onExit={onExit}
      />
    )

  return (
    <div className="screen play truefalse">
      <GameBar onExit={onExit}>
        <span className="gb-title">Vrai ou faux<small>{tablesLabel(tables)}</small></span>
        <span className="score-chip"><Icon name="star" size={16} fill /> {score}</span>
        {combo >= 2 && <span key={combo} className="combo"><Icon name="flame" size={16} fill /> {combo}</span>}
        <span className={`time-chip ${left < 10 ? 'low' : ''}`}><Icon name="timer" size={16} /> {Math.ceil(left)}</span>
      </GameBar>
      <div className="timebar"><i style={{ width: `${(left / DURATION) * 100}%` }} /></div>
      <div className="tf-body">
        <div ref={card} key={ex.id} className={`calc tf-calc ${flash === 'ok' ? 'calc-ok' : ''} ${flash === 'ko' ? 'calc-shake' : ''}`}>
          <span>{ex.a}</span><span className="op">×</span><span>{ex.b}</span><span className="op">=</span>
          <span className={flash === 'ko' ? (ex.answer ? 'claimed yes' : 'claimed no') : 'claimed'}>{ex.claimed}</span>
        </div>
        {flash === 'ko' && <p className="tf-correction">{ex.a} × {ex.b} = {ex.product}</p>}
        <div className="tf-btns">
          <button className="tf-btn yes" onPointerDown={(e) => { e.preventDefault(); judge(true) }}><Icon name="check" size={40} stroke={3} /> Vrai</button>
          <button className="tf-btn no" onPointerDown={(e) => { e.preventDefault(); judge(false) }}><Icon name="x" size={40} stroke={3} /> Faux</button>
        </div>
      </div>
    </div>
  )
}
