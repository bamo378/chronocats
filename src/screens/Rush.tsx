import { useEffect, useRef, useState } from 'react'
import { Profile, addPlayTime } from '../profiles/store'
import { UpdateProfile } from '../App'
import { SKILL_BY_ID, SkillId } from '../engine/skills'
import { Exercise, generate, checkTyped, strategy } from '../engine/exercises'
import { factWeights, recordSpeedAnswer } from '../engine/learner'
import { Cat, Mood } from '../components/Cat'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'

const DURATION = 60

interface Miss { a: number; b: number; p: number; table: number }

/** Défi éclair : 60 secondes, un calcul après l'autre, le chat court vers son record. */
export function Rush({ profile, update, focus, onExit, onAgain }: { profile: Profile; update: UpdateProfile; focus: SkillId; onExit: () => void; onAgain: () => void }) {
  const skill = SKILL_BY_ID[focus]
  const best = profile.records?.[focus] ?? 0
  const [phase, setPhase] = useState<'intro' | 'count' | 'play' | 'end'>('intro')
  const [count, setCount] = useState(3)
  const [ex, setEx] = useState<Exercise>(() => generate(focus, Math.random, 'type', factWeights(profile.learner)))
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState(0)
  const [good, setGood] = useState(0)
  const [total, setTotal] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [left, setLeft] = useState(DURATION)
  const [flash, setFlash] = useState<null | 'ok' | 'ko'>(null)
  const [misses, setMisses] = useState<Miss[]>([])
  const [mood, setMood] = useState<Mood>('happy')
  const [result, setResult] = useState<{ record: boolean; coins: number; cubes: number } | null>(null)
  const t0 = useRef(Date.now())
  const qStart = useRef(Date.now())
  const lock = useRef(false)
  const card = useRef<HTMLDivElement>(null)
  const lastKey = useRef('')

  // Compte à rebours 3, 2, 1.
  useEffect(() => {
    if (phase !== 'count') return
    if (count === 0) { setPhase('play'); t0.current = Date.now(); qStart.current = Date.now(); return }
    sfx.tap()
    const id = setTimeout(() => setCount((c) => c - 1), 700)
    return () => clearTimeout(id)
  }, [phase, count])

  // Chrono.
  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => {
      const l = Math.max(0, DURATION - (Date.now() - t0.current) / 1000)
      setLeft(l)
      if (l <= 0) finish()
    }, 100)
    return () => clearInterval(id)
  })

  function nextQuestion(from: Profile) {
    let n: Exercise
    let guard = 0
    do { n = generate(focus, Math.random, 'type', factWeights(from.learner)); guard++ } while (`${n.a}x${n.b}` === lastKey.current && guard < 8)
    lastKey.current = `${n.a}x${n.b}`
    setEx(n)
    setTyped('')
    qStart.current = Date.now()
    lock.current = false
  }

  function answer(value: number) {
    if (lock.current || phase !== 'play') return
    lock.current = true
    const r = checkTyped(ex, value)
    const ms = Date.now() - qStart.current
    const next: Profile = structuredClone(profile)
    recordSpeedAnswer(next.learner, ex, r.correct, r.error, ms)
    addPlayTime(next, Math.min(ms, 30000))
    update((p) => Object.assign(p, next))
    setTotal((t) => t + 1)
    if (r.correct) {
      const c = combo + 1
      setCombo(c)
      setBestCombo((b) => Math.max(b, c))
      setGood((g) => g + 1)
      setScore((s) => s + 1 + Math.floor(c / 5)) // bonus tous les 5 d'affilée
      setFlash('ok')
      setMood(c >= 5 ? 'cheer' : 'happy')
      sfx.coin()
      fx.at(card.current, c >= 5 ? 'confetti' : 'stars', c >= 5 ? 22 : 12)
      setTimeout(() => { setFlash(null); nextQuestion(next) }, 220)
    } else {
      setCombo(0)
      setFlash('ko')
      setMood('think')
      sfx.soft()
      setMisses((m) => (m.some((x) => x.p === ex.product && x.table === ex.table) ? m : [...m, { a: ex.a, b: ex.b, p: ex.product, table: ex.table }]))
      setTimeout(() => { setFlash(null); nextQuestion(next) }, 1100)
    }
  }

  function press(k: string) {
    if (phase !== 'play' || lock.current) return
    if (k === '⌫') { setTyped((t) => t.slice(0, -1)); return }
    if (k === 'OK') { if (typed) answer(Number(typed)); return }
    const t = typed.length >= 3 ? typed : typed + k
    setTyped(t)
    // Réponse vérifiée dès qu'il y a assez de chiffres : on enchaîne vite.
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

  function finish() {
    if (phase !== 'play') return
    setPhase('end')
    const record = score > best
    const coins = Math.min(40, good * 2) + (record ? 10 : 0)
    const cubes = record && score > 0 ? 3 : good >= 15 ? 1 : 0
    update((p) => {
      p.coins += coins
      p.cubes += cubes
      if (record) p.records = { ...(p.records ?? {}), [focus]: score }
    })
    setResult({ record, coins, cubes })
    if (record) { sfx.fanfare(); setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 80), 200) }
    else sfx.good()
  }

  const cat = profile.cat
  const goal = Math.max(best + 3, 15)
  const runner = Math.min(1, score / goal)
  const label = focus === 'defi' ? 'tous les livrets' : focus === 'x1x10' ? 'les livrets 1 et 10' : `le livret ${skill.tables[0]}`

  if (phase === 'intro' || phase === 'count')
    return (
      <div className="screen story rush-bg">
        <div className="sky dusk" />
        <button className="btn btn-ghost back" onClick={onExit}>← Village</button>
        <div className="panel story-panel">
          {phase === 'count' ? (
            <div key={count} className="countdown">{count || 'Go !'}</div>
          ) : (
            <>
              <div className="rush-bolt">⚡</div>
              <h1>Défi éclair</h1>
              <p className="lead">60 secondes sur {label}. Chaque bonne réponse fait courir {cat.name}.</p>
              <p className="lead">Enchaîne les bonnes réponses : toutes les 5 d’affilée, tu gagnes un point bonus !</p>
              <div className="reward-row">
                <span className="pill">🏆 Record : {best}</span>
              </div>
              <button className="btn btn-primary big" onClick={() => { setCount(3); setPhase('count') }}>Partir !</button>
            </>
          )}
        </div>
      </div>
    )

  if (phase === 'end' && result)
    return (
      <div className="screen story">
        <div className="sky" />
        <div className="panel story-panel">
          <Cat coat={cat.coat} accessory={cat.accessory} mood={result.record ? 'cheer' : 'happy'} size={140} className="jump" />
          <h1>{result.record ? 'Nouveau record !' : 'Bien joué !'}</h1>
          <div className="big-score">{score}<small> points</small></div>
          <p className="lead">{good} bonne{good > 1 ? 's' : ''} réponse{good > 1 ? 's' : ''} sur {total} · meilleure série : {bestCombo}{result.record ? '' : ` · record : ${best}`}</p>
          <div className="reward-row">
            <span className="pill">🪙 +{result.coins}</span>
            {result.cubes > 0 && <span className="pill">🧊 +{result.cubes}</span>}
          </div>
          {misses.length > 0 && (
            <div className="misses">
              <b>À revoir (ils reviendront plus souvent) :</b>
              <ul>{misses.slice(0, 6).map((m, i) => <li key={i}><span>{m.a} × {m.b} = <b>{m.p}</b></span><small>{strategy(m.table, m.a === m.table ? m.b : m.a)}</small></li>)}</ul>
            </div>
          )}
          <div className="row">
            <button className="btn btn-primary big" onClick={onAgain}>⚡ Rejouer</button>
            <button className="btn btn-ghost big" onClick={onExit}>Village</button>
          </div>
        </div>
      </div>
    )

  return (
    <div className="screen play rush">
      <div className="sky dusk" />
      <div className="play-top">
        <button className="btn btn-ghost small" onClick={onExit}>✕</button>
        <div className="rush-score">⭐ {score}</div>
        {combo >= 2 && <div key={combo} className="combo">🔥 {combo}<span className="combo-txt"> d’affilée</span></div>}
        <div className={`rush-time ${left < 10 ? 'low' : ''}`}>⏱ {Math.ceil(left)}</div>
      </div>
      <div className="timebar"><i style={{ width: `${(left / DURATION) * 100}%` }} /></div>
      <div className="track">
        {best > 0 && <div className="track-flag" style={{ left: `${Math.min(1, best / goal) * 90 + 4}%` }}>🏁<small>record {best}</small></div>}
        <div className="track-cat" style={{ left: `${runner * 90}%` }}>
          <Cat coat={cat.coat} accessory={cat.accessory} mood={mood} size={64} />
        </div>
      </div>
      <div className="rush-body">
        <div ref={card} className={`calc rush-calc ${flash === 'ok' ? 'calc-ok' : ''} ${flash === 'ko' ? 'calc-shake' : ''}`}>
          <span>{ex.a}</span><span className="op">×</span><span>{ex.b}</span><span className="op">=</span>
          <span className={`slot ${typed ? 'filled' : ''} ${flash === 'ko' ? 'bad' : ''}`}>{flash === 'ko' ? ex.product : typed || '?'}</span>
        </div>
        <div className="pad">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0', 'OK'].map((k) => (
            <button key={k} className={`key ${k === 'OK' ? 'key-ok' : ''} ${k === '⌫' ? 'key-del' : ''}`} onPointerDown={(e) => { e.preventDefault(); press(k) }}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
