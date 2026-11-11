import { useEffect, useRef, useState } from 'react'
import { Profile, PROFILES, ProfileId, loadProfile, saveProfile, loadArena, saveArena } from '../profiles/store'
import { UpdateProfile } from '../App'
import { Exercise, generateFor } from '../engine/exercises'
import { recordSpeedAnswer } from '../engine/learner'
import { applyRewards } from '../game/rewards'
import { tablesLabel } from '../game/games'
import { GameBar } from '../components/ui'
import { Icon } from '../components/Icon'
import { Cat } from '../components/Cat'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { playerName } from '../screens/hub/Arena'

const DURATION = 60
const GUEST_TABLES = [2, 3, 4, 5, 6, 7, 8, 9]

interface Side { id: string; name: string; color: string; tables: number[]; prof: Profile | null }
interface Live { ex: Exercise; score: number; total: number; lockUntil: number; flash: null | 'ok' | 'ko'; picked: number | null }

export function Duel({ profile, update, a, b, onExit, onAgain }: { profile: Profile; update: UpdateProfile; a: string; b: string; onExit: () => void; onAgain: () => void }) {
  const sides: Side[] = [a, b].map((id) => {
    const real = PROFILES.find((p) => p.id === id)
    const prof = real ? (id === profile.id ? profile : loadProfile(id as ProfileId)) : null
    return { id, name: playerName(id), color: real?.color ?? '#94a3b8', tables: prof?.selection?.length ? prof.selection : GUEST_TABLES, prof }
  })
  const [phase, setPhase] = useState<'intro' | 'count' | 'play' | 'end'>('intro')
  const [count, setCount] = useState(3)
  const [live, setLive] = useState<Live[]>(() => sides.map((s) => ({ ex: generateFor(s.tables, Math.random, 'choice'), score: 0, total: 0, lockUntil: 0, flash: null, picked: null })))
  const [left, setLeft] = useState(DURATION)
  const t0 = useRef(0)
  const events = useRef<{ side: number; ex: Exercise; ok: boolean }[]>([])
  const [, force] = useState(0)

  useEffect(() => {
    if (phase !== 'count') return
    if (count === 0) { t0.current = Date.now(); setPhase('play'); return }
    sfx.tick()
    const id = setTimeout(() => setCount((c) => c - 1), 650)
    return () => clearTimeout(id)
  }, [phase, count])

  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => {
      const l = Math.max(0, DURATION - (Date.now() - t0.current) / 1000)
      setLeft(l)
      force((x) => x + 1)
      if (l <= 0) finish()
    }, 100)
    return () => clearInterval(id)
  })

  function pick(si: number, ci: number, el: HTMLElement) {
    if (phase !== 'play') return
    const L = live[si]
    if (Date.now() < L.lockUntil || L.flash) return
    const c = L.ex.choices![ci]
    events.current.push({ side: si, ex: L.ex, ok: c.correct })
    const upd = (fn: (x: Live) => Live) => setLive((ls) => ls.map((x, i) => (i === si ? fn(x) : x)))
    if (c.correct) {
      sfx.coin()
      const r = el.getBoundingClientRect()
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, 'stars', 10)
      upd((x) => ({ ...x, score: x.score + 1, total: x.total + 1, flash: 'ok', picked: ci }))
      setTimeout(() => upd((x) => ({ ...x, ex: generateFor(sides[si].tables, Math.random, 'choice'), flash: null, picked: null })), 220)
    } else {
      sfx.soft()
      upd((x) => ({ ...x, total: x.total + 1, flash: 'ko', picked: ci, lockUntil: Date.now() + 1500 }))
      setTimeout(() => upd((x) => ({ ...x, ex: generateFor(sides[si].tables, Math.random, 'choice'), flash: null, picked: null })), 1500)
    }
  }

  function finish() {
    if (phase === 'end') return
    setPhase('end')
    const [sa, sb] = [live[0].score, live[1].score]
    const ar = loadArena()
    ar.duels = [...ar.duels, { a, b, sa, sb, at: Date.now() }].slice(-300)
    saveArena(ar)
    sides.forEach((s, i) => {
      if (!s.prof) return
      const won = (i === 0 ? sa > sb : sb > sa)
      const apply = (p: Profile) => {
        for (const e of events.current.filter((x) => x.side === i)) recordSpeedAnswer(p.learner, e.ex, e.ok, undefined, 0)
        applyRewards(p, { correct: live[i].score, bonus: won ? 40 : 0 })
      }
      if (s.id === profile.id) update(apply)
      else { const p = loadProfile(s.id as ProfileId); apply(p); saveProfile(p) }
    })
    sfx.fanfare()
    setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 100), 150)
  }

  if (phase === 'intro' || phase === 'count')
    return (
      <div className="screen intro duel-intro">
        <GameBar onExit={onExit} />
        {phase === 'count' ? (
          <div className="countdown" key={count}>{count || 'Go'}</div>
        ) : (
          <div className="intro-card">
            <div className="duel-faces">
              {sides.map((s, i) => (
                <div key={s.id} className="df" style={{ ['--c' as any]: s.color }}>
                  <span className="df-av">{s.prof ? <Cat coat={s.prof.cat.coat} accessory={s.prof.cat.accessory} mood="happy" size="100%" /> : <Icon name="users" size={40} />}</span>
                  <b>{s.name}</b>
                  <small>{tablesLabel(s.tables)}</small>
                  {i === 0 && <span className="vs">VS</span>}
                </div>
              ))}
            </div>
            <h1>Duel</h1>
            <p className="intro-rules">60 secondes. Chacune a sa moitié d’écran et ses propres calculs. Une erreur bloque 1,5 seconde. Le plus de bonnes réponses gagne.</p>
            <p className="muted small">Posez l’iPad à plat entre vous deux.</p>
            <button className="btn btn-primary big" onClick={() => { setCount(3); setPhase('count') }}><Icon name="play" fill /> Prêtes ?</button>
          </div>
        )}
      </div>
    )

  if (phase === 'end') {
    const [sa, sb] = [live[0].score, live[1].score]
    const win = sa === sb ? -1 : sa > sb ? 0 : 1
    return (
      <div className="screen result">
        <div className="result-card duel-end">
          <div className="eyebrow">Fin du duel</div>
          <h1>{win === -1 ? 'Égalité !' : `${sides[win].name} gagne !`}</h1>
          <div className="duel-score">
            {sides.map((s, i) => (
              <div key={s.id} className={`ds ${win === i ? 'win' : ''}`} style={{ ['--c' as any]: s.color }}>
                {win === i && <span className="crown"><Icon name="trophy" size={22} /></span>}
                <span className="df-av">{s.prof ? <Cat coat={s.prof.cat.coat} accessory={s.prof.cat.accessory} mood={win === i || win === -1 ? 'cheer' : 'happy'} size="100%" /> : <Icon name="users" size={40} />}</span>
                <b className="big-num">{live[i].score}</b>
                <span className="muted">{s.name} · {live[i].total ? Math.round((live[i].score / live[i].total) * 100) : 0} % justes</span>
              </div>
            ))}
          </div>
          <div className="result-actions">
            <button className="btn btn-primary big" onClick={onAgain}><Icon name="refresh" /> Revanche</button>
            <button className="btn btn-ghost big" onClick={onExit}>Retour</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen duel">
      {sides.map((s, si) => {
        const L = live[si]
        const locked = Date.now() < L.lockUntil
        return (
          <div key={s.id} className={`dside s${si} ${L.flash ?? ''}`} style={{ ['--c' as any]: s.color }}>
            <div className="dside-top">
              <span className="dname">{s.name}</span>
              <span className="dscore">{L.score}</span>
            </div>
            <div className="dq mono">{L.ex.a} × {L.ex.b}</div>
            <div className="dchoices">
              {L.ex.choices!.map((c, ci) => (
                <button key={ci} className={`dc ${L.picked === ci ? (c.correct ? 'right' : 'wrong') : ''} ${L.flash === 'ko' && c.correct ? 'reveal' : ''}`} disabled={locked} onPointerDown={(e) => { e.preventDefault(); pick(si, ci, e.currentTarget) }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      <div className="duel-mid">
        <button className="icon-btn" onClick={onExit} aria-label="Quitter"><Icon name="x" /></button>
        <span className={`time-chip ${left < 10 ? 'low' : ''}`}><Icon name="timer" size={16} /> {Math.ceil(left)}</span>
      </div>
    </div>
  )
}
