import { useMemo, useState } from 'react'
import { PROFILES, ProfileId, loadProfile, saveProfile, loadArena, saveArena, today, mondayKey, Profile } from '../../profiles/store'
import { correctThisWeek, levelFromXp } from '../../engine/learner'
import { GAMES } from '../../game/games'
import { Icon } from '../../components/Icon'
import { Cat } from '../../components/Cat'
import { TabHeader, TabProps } from './Hub'
import { fx } from '../../components/Fx'
import { sfx } from '../../audio/sound'

export const COOP_GOAL = 600
export const GUEST = 'invite'

export function playerName(id: string): string {
  return PROFILES.find((p) => p.id === id)?.name ?? 'Invité'
}

export function Arena({ profile: me, update, go }: TabProps) {
  const [tick, setTick] = useState(0)
  const arena = useMemo(() => loadArena(), [tick])
  // L'autre sœur est relue depuis l'appareil ; la joueuse active vient de l'état courant.
  const all: Record<ProfileId, Profile> = useMemo(() => {
    const o = {} as Record<ProfileId, Profile>
    for (const x of PROFILES) o[x.id] = x.id === me.id ? me : loadProfile(x.id)
    return o
  }, [me, tick])
  const other = PROFILES.find((x) => x.id !== me.id)!.id
  const [a, setA] = useState<string>(me.id)
  const [b, setB] = useState<string>(other)

  // Duels : bilan entre les deux sœurs
  const duelsAB = arena.duels.filter((d) => [d.a, d.b].sort().join() === ['alice', 'anaelle'].join())
  const wins = (id: string) => duelsAB.filter((d) => (d.a === id && d.sa > d.sb) || (d.b === id && d.sb > d.sa)).length

  // Défi du jour
  const day = arena.daily[today()] ?? {}

  // Objectif commun
  const week = mondayKey()
  const parts = PROFILES.map((x) => ({ id: x.id, name: x.name, color: x.color, n: all[x.id].setupDone ? correctThisWeek(all[x.id].learner) : 0 }))
  const total = parts.reduce((s, x) => s + x.n, 0)
  const claimed = arena.coopClaimed.includes(week)

  function claim() {
    const ar = loadArena()
    if (ar.coopClaimed.includes(week)) return
    ar.coopClaimed.push(week)
    saveArena(ar)
    for (const x of PROFILES) {
      const give = (p: Profile) => {
        p.coins += 100
        p.cubes += 10
        if (!p.bonusItems.includes('statue')) p.bonusItems = [...p.bonusItems, 'statue']
      }
      if (x.id === me.id) update(give)
      else { const p = loadProfile(x.id); give(p); saveProfile(p) }
    }
    sfx.fanfare()
    fx.burst(innerWidth / 2, innerHeight / 2, 'confetti', 90)
    setTick((t) => t + 1)
  }

  const players = [...PROFILES.map((x) => ({ id: x.id, name: x.name })), { id: GUEST, name: 'Invité' }]

  return (
    <section className="view arena">
      <TabHeader title="Arène" sub="Défis entre Anaëlle et Alice." profile={me} />
      <div className="arena-grid">
        <div className="panel duel-panel">
          <div className="panel-head">
            <h2><Icon name="swords" /> Duel</h2>
            <span className="muted">Même écran · 60 secondes</span>
          </div>
          <div className="versus">
            <PlayerPick value={a} onChange={setA} options={players} exclude={b} side="a" />
            <span className="vs">VS</span>
            <PlayerPick value={b} onChange={setB} options={players} exclude={a} side="b" />
          </div>
          <p className="muted small">Chacune répond sur ses propres livrets : le duel reste équitable, même entre niveaux différents.</p>
          <button className="btn btn-primary big" onClick={() => go({ name: 'duel', a, b })}><Icon name="play" fill /> Lancer le duel</button>
          {duelsAB.length > 0 && (
            <div className="h2h">
              <span style={{ color: PROFILES[0].color }}>{PROFILES[0].name} <b>{wins(PROFILES[0].id)}</b></span>
              <span className="muted">{duelsAB.length} duel{duelsAB.length > 1 ? 's' : ''}</span>
              <span style={{ color: PROFILES[1].color }}><b>{wins(PROFILES[1].id)}</b> {PROFILES[1].name}</span>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2><Icon name="calendar" /> Défi du jour</h2>
            <span className="muted">20 calculs identiques pour vous deux</span>
          </div>
          <div className="daily-row">
            {PROFILES.map((x) => {
              const r = day[x.id]
              return (
                <div key={x.id} className={`daily-p ${r ? 'played' : ''}`} style={{ ['--c' as any]: x.color }}>
                  <span className="dp-name">{x.name}</span>
                  {r ? <><b className="dp-score">{r.score}<small>/20</small></b><span className="muted">{(r.ms / 1000).toFixed(1)} s</span></> : <span className="muted">Pas encore joué</span>}
                </div>
              )
            })}
          </div>
          {day.anaelle && day.alice && <p className="winner-line">{winnerLine(day.anaelle, day.alice)}</p>}
          <button className="btn btn-primary" disabled={!!day[me.id]} onClick={() => go({ name: 'daily' })}>
            {day[me.id] ? 'Déjà joué aujourd’hui' : 'Jouer le défi'}
          </button>
          <p className="muted small">Seul le premier essai compte. Un nouveau défi chaque jour.</p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2><Icon name="users" /> Objectif commun</h2>
            <span className="muted">Cette semaine, à deux</span>
          </div>
          <div className="coop-num"><b>{Math.min(total, COOP_GOAL)}</b> / {COOP_GOAL} bonnes réponses</div>
          <div className="coop-bar">
            {parts.map((x) => <i key={x.id} style={{ width: `${Math.min(100, (x.n / COOP_GOAL) * 100)}%`, background: x.color }} />)}
          </div>
          <div className="coop-legend">{parts.map((x) => <span key={x.id}><i style={{ background: x.color }} /> {x.name} · {x.n}</span>)}</div>
          <p className="muted small">Récompense pour vous deux : 100 pièces, 10 cubes et la Statue dorée pour votre île.</p>
          {total >= COOP_GOAL && !claimed && <button className="btn btn-primary" onClick={claim}><Icon name="sparkles" /> Récupérer la récompense</button>}
          {claimed && <p className="ok-line"><Icon name="check" /> Récompense de la semaine récupérée</p>}
        </div>

        <div className="panel leader">
          <div className="panel-head">
            <h2><Icon name="trophy" /> Records</h2>
            <span className="muted">Meilleur score de chacune</span>
          </div>
          <table className="lb">
            <thead>
              <tr><th />{PROFILES.map((x) => <th key={x.id} style={{ color: x.color }}>{x.name}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                <td>Niveau</td>
                {PROFILES.map((x) => <td key={x.id}>{levelFromXp(all[x.id].xp).level}</td>)}
              </tr>
              <tr>
                <td>Bonnes réponses cette semaine</td>
                {parts.map((x) => <td key={x.id}>{x.n}</td>)}
              </tr>
              {GAMES.map((g) => {
                const vals = PROFILES.map((x) => all[x.id].records[g.id])
                const known = vals.filter((v): v is number => v !== undefined)
                const best = known.length ? (g.lowerIsBetter ? Math.min(...known) : Math.max(...known)) : undefined
                return (
                  <tr key={g.id}>
                    <td><Icon name={g.icon} size={16} /> {g.name}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={v !== undefined && v === best && known.length > 1 ? 'top' : ''}>{v === undefined ? '–' : `${v}${g.unit === 's' ? ' s' : ''}`}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="muted small">Les records ne dépendent pas des livrets choisis : chacune progresse à son rythme.</p>
        </div>
      </div>
    </section>
  )
}

function winnerLine(a: { score: number; ms: number }, b: { score: number; ms: number }) {
  const [n1, n2] = [PROFILES[0].name, PROFILES[1].name]
  if (a.score !== b.score) return `${a.score > b.score ? n1 : n2} gagne le défi du jour !`
  if (a.ms !== b.ms) return `Égalité de points, ${a.ms < b.ms ? n1 : n2} a été plus rapide.`
  return 'Égalité parfaite !'
}

function PlayerPick({ value, onChange, options, exclude, side }: { value: string; onChange: (v: string) => void; options: { id: string; name: string }[]; exclude: string; side: 'a' | 'b' }) {
  return (
    <div className={`ppick ${side}`}>
      {options.filter((o) => o.id !== exclude).map((o) => {
        const prof = PROFILES.find((p) => p.id === o.id)
        const coat = prof ? loadCoat(o.id) : null
        return (
          <button key={o.id} className={`pp ${value === o.id ? 'on' : ''}`} style={{ ['--c' as any]: prof?.color ?? '#94a3b8' }} onClick={() => onChange(o.id)}>
            <span className="pp-av">{coat ? <Cat coat={coat} mood="happy" size="100%" /> : <Icon name="users" />}</span>
            <span>{o.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function loadCoat(id: string) {
  return loadProfile(id as ProfileId).cat.coat
}
