import { useState } from 'react'
import { Profile, addPlayTime } from '../profiles/store'
import { UpdateProfile } from '../App'
import { composeSession, recordAnswer } from '../engine/learner'
import { Exercise, strategy } from '../engine/exercises'
import { ExerciseView, ExerciseOutcome } from '../components/ExerciseView'
import { Cat, Mood } from '../components/Cat'
import { Icon } from '../components/Icon'
import { GameBar, Miss } from '../components/ui'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { tablesLabel } from '../game/games'
import { medalFor, trainPoints, MEDALS } from '../game/medals'
import { MedalIcon } from './hub/Livrets'

const COUNT = 20

/** Mode S'entraîner : 20 questions avec astuces et deuxième chance ; chaque bonne réponse rapporte des points au livret. */
export function Train({ profile, update, tables, onExit, onAgain, onTest }: { profile: Profile; update: UpdateProfile; tables: number[]; onExit: () => void; onAgain: () => void; onTest: () => void }) {
  const [list] = useState<Exercise[]>(() => composeSession(profile.learner, tables, COUNT))
  const [before] = useState<Record<number, number>>(() => ({ ...profile.points }))
  const [idx, setIdx] = useState(0)
  const [mood, setMood] = useState<Mood>('happy')
  const [combo, setCombo] = useState(0)
  const [gained, setGained] = useState(0)
  const [first, setFirst] = useState(0)
  const [pop, setPop] = useState<{ id: number; v: number } | null>(null)
  const [misses, setMisses] = useState<Miss[]>([])
  const [done, setDone] = useState(false)
  const ex = list[idx]

  function onDone(o: ExerciseOutcome) {
    const c = o.firstTry ? combo + 1 : 0
    const pts = trainPoints(o.firstTry, o.eventually, o.hint, c)
    const next: Profile = structuredClone(profile)
    recordAnswer(next.learner, ex, { correct: o.firstTry, hint: o.hint, error: o.error, ms: o.ms })
    const prevMedal = medalFor(next.points[ex.table] ?? 0).tier
    next.points = { ...next.points, [ex.table]: (next.points[ex.table] ?? 0) + pts }
    const newMedal = medalFor(next.points[ex.table]).tier > prevMedal
    next.xp = (next.xp ?? 0) + pts
    next.coins += o.firstTry ? 2 : o.eventually ? 1 : 0
    if (newMedal) next.cubes += 3
    addPlayTime(next, Math.min(o.ms, 120000))
    update((p) => Object.assign(p, next))

    setCombo(c)
    setGained((g) => g + pts)
    if (o.firstTry) setFirst((f) => f + 1)
    if (pts) setPop({ id: Date.now(), v: pts })
    const chip = document.querySelector('.gamebar .pts-chip')
    if (chip && pts) { const r = chip.getBoundingClientRect(); fx.fly(innerWidth / 2, innerHeight / 2, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, 'stars', Math.min(9, 3 + c)) }
    if (newMedal) { sfx.fanfare(); setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 80), 200) }
    if (!o.firstTry) {
      const n = ex.a === ex.table ? ex.b : ex.a
      setMisses((m) => (m.some((x) => x.p === ex.product) ? m : [...m, { a: ex.a, b: ex.b, p: ex.product, tip: strategy(ex.table, n) }]))
    }
    setMood(o.firstTry ? 'happy' : 'think')
    if (idx + 1 >= list.length) { sfx.fanfare(); setDone(true) }
    else setIdx(idx + 1)
  }

  if (done) {
    const ts = [...new Set(tables)].sort((a, b) => a - b)
    return (
      <div className="screen result">
        <div className="result-card">
          <div className="result-top">
            <Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood="cheer" size={92} className="jump" />
            <div>
              <div className="eyebrow">Entraînement terminé</div>
              <h1>+{gained} points</h1>
            </div>
          </div>
          <p className="muted">{first} bonnes réponses du premier coup sur {COUNT}.</p>
          <div className="medal-list">
            {ts.map((t) => {
              const now = profile.points[t] ?? 0
              const was = before[t] ?? 0
              const m = medalFor(now)
              const up = m.tier > medalFor(was).tier
              return (
                <div key={t} className={`ml ${up ? 'up' : ''}`}>
                  <span className="ml-n">{t}</span>
                  <MedalIcon tier={m.tier} size={30} />
                  <span className="ml-body">
                    <span className="ml-bar"><i style={{ width: `${m.frac * 100}%` }} /></span>
                    <small>{now} pts{m.next ? ` · encore ${m.next.at - now} pour ${m.next.name.toLowerCase()}` : ' · médaille d’or !'}{now > was ? ` · +${now - was}` : ''}</small>
                  </span>
                  {up && <span className="ml-new">Nouvelle médaille : {MEDALS[m.tier - 1].name}</span>}
                </div>
              )
            })}
          </div>
          {misses.length > 0 && (
            <div className="misses">
              <div className="eyebrow">À revoir</div>
              <ul>{misses.slice(0, 5).map((m, i) => <li key={i}><span className="mono">{m.a} × {m.b} = <b>{m.p}</b></span><small>{m.tip}</small></li>)}</ul>
            </div>
          )}
          <div className="result-actions">
            <button className="btn btn-primary big" onClick={onAgain}><Icon name="refresh" /> Continuer à m’entraîner</button>
            <button className="btn btn-ghost big" onClick={onTest}><Icon name="medal" /> Passer le test</button>
          </div>
          <button className="btn btn-ghost" onClick={onExit}>Retour aux livrets</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen play">
      <GameBar onExit={onExit}>
        <span className="gb-title">S’entraîner<small>{tablesLabel(tables)}</small></span>
        <span className="gb-step">{idx + 1} / {COUNT}</span>
        <span className="gb-progress"><i style={{ width: `${(idx / COUNT) * 100}%` }} /></span>
        {combo >= 3 && <span key={combo} className="combo"><Icon name="flame" size={16} fill /> {combo}</span>}
        <span className="pts-chip">
          <Icon name="star" size={18} fill /> {gained}
          {pop && <span key={pop.id} className="pts-pop">+{pop.v}</span>}
        </span>
        <span className="gb-cat"><Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood={mood} size="100%" /></span>
      </GameBar>
      <ExerciseView key={ex.id} ex={ex} onDone={onDone} onCatMood={(m) => setMood(m)} />
    </div>
  )
}
