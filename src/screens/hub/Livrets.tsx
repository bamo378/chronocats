import { useMemo } from 'react'
import { loadArena, today } from '../../profiles/store'
import { correctOnDay, weakFacts } from '../../engine/learner'
import { Icon } from '../../components/Icon'
import { Ring } from '../../components/ui'
import { tablesLabel } from '../../game/games'
import { medalFor, MEDALS } from '../../game/medals'
import { sfx } from '../../audio/sound'
import { TabHeader, TabProps, DAILY_GOAL } from './Hub'

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const PRESETS: { label: string; t: number[] }[] = [
  { label: 'Tous', t: ALL },
  { label: '2, 5, 10', t: [2, 5, 10] },
  { label: '3, 4, 6', t: [3, 4, 6] },
  { label: '7, 8, 9', t: [7, 8, 9] },
  { label: '11, 12', t: [11, 12] },
]

export function MedalIcon({ tier, size = 26 }: { tier: number; size?: number }) {
  const c = tier ? MEDALS[tier - 1].color : 'rgba(255,255,255,0.18)'
  return (
    <svg className="medal" width={size} height={size} viewBox="0 0 24 24" aria-label={tier ? `Médaille ${MEDALS[tier - 1].name}` : 'Pas encore de médaille'}>
      <path d="M7 2h4l2 5-3 2zM17 2h-4l-2 5 3 2z" fill={tier ? '#8b5cf6' : 'rgba(255,255,255,0.1)'} />
      <circle cx="12" cy="15" r="7" fill={c} />
      {tier > 0 && <circle cx="12" cy="15" r="4.6" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.4" />}
      {tier > 0 && <text x="12" y="17.6" textAnchor="middle" fontSize="7" fontWeight="800" fill="rgba(0,0,0,0.45)">{tier}</text>}
    </svg>
  )
}

/** Onglet principal : choisir ses livrets, puis s'entraîner (points, médailles) ou se tester (diplômes). */
export function Livrets({ profile: p, update, go }: TabProps) {
  const sel = p.selection
  const set = new Set(sel)
  const setSel = (t: number[]) => update((x) => { x.selection = [...t].sort((a, b) => a - b) })
  const toggle = (t: number) => {
    sfx.tap()
    const n = new Set(set)
    if (n.has(t)) n.delete(t)
    else n.add(t)
    setSel([...n])
  }
  const none = sel.length === 0
  const selPoints = sel.reduce((s, t) => s + (p.points[t] ?? 0), 0)
  const diplomas = ALL.filter((t) => p.tests[t]?.passed).length
  const medals = ALL.filter((t) => medalFor(p.points[t] ?? 0).tier > 0).length
  const weak = weakFacts(p.learner).length
  const doneToday = correctOnDay(p.learner)
  const arena = useMemo(() => loadArena(), [])
  const dailyDone = !!arena.daily[today()]?.[p.id]
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Salut' : 'Bonsoir'

  return (
    <section className="view livrets">
      <TabHeader title={`${hello} ${p.name}`} sub="Choisis tes livrets, puis entraîne-toi ou teste-toi." profile={p} />

      <div className="panel">
        <div className="step">
          <span className="step-n">1</span>
          <h2>Choisis tes livrets</h2>
          <span className="muted step-sub">{none ? 'Touche un ou plusieurs livrets' : tablesLabel(sel)}</span>
        </div>
        <div className="lgrid">
          {ALL.map((t) => {
            const pts = p.points[t] ?? 0
            const m = medalFor(pts)
            const on = set.has(t)
            const dip = p.tests[t]?.passed
            return (
              <button key={t} className={`lt ${on ? 'on' : ''}`} onClick={() => toggle(t)} aria-pressed={on}>
                <span className="lt-top">
                  <MedalIcon tier={m.tier} size={24} />
                  {dip && <span className="lt-dip" title="Diplôme obtenu"><Icon name="check" size={13} stroke={3} /></span>}
                </span>
                <span className="lt-n"><small>×</small>{t}</span>
                <span className="lt-bar"><i style={{ width: `${m.frac * 100}%` }} /></span>
                <span className="lt-pts">{pts} pts</span>
                {on && <span className="lt-sel"><Icon name="check" size={14} stroke={3} /></span>}
              </button>
            )
          })}
        </div>
        <div className="presets">
          {PRESETS.map((x) => <button key={x.label} className="chip" onClick={() => { sfx.tap(); setSel(x.t) }}>{x.label}</button>)}
          {!none && <button className="chip chip-quiet" onClick={() => setSel([])}>Effacer</button>}
          <span className="legend-medals">
            {MEDALS.map((m, i) => <span key={m.name}><MedalIcon tier={i + 1} size={18} /> {m.at}</span>)}
          </span>
        </div>
      </div>

      <div className="step outside">
        <span className="step-n">2</span>
        <h2>Choisis ton mode</h2>
      </div>
      <div className="bigmodes">
        <button className="bigmode train" disabled={none} onClick={() => { sfx.tap(); go({ name: 'train', tables: sel }) }}>
          <span className="bm-ico"><Icon name="target" size={34} /></span>
          <span className="bm-title">S’entraîner</span>
          <span className="bm-text">20 questions avec astuces et une deuxième chance. Chaque bonne réponse rapporte des points : vise les médailles !</span>
          <span className="bm-foot"><Icon name="star" size={16} fill /> {selPoints} points sur ces livrets · {medals} médaille{medals > 1 ? 's' : ''}</span>
          <span className="bm-go"><Icon name="play" fill size={22} /></span>
        </button>
        <button className="bigmode test" disabled={none} onClick={() => { sfx.tap(); go({ name: 'test', tables: sel }) }}>
          <span className="bm-ico"><Icon name="medal" size={34} /></span>
          <span className="bm-title">Tester mes connaissances</span>
          <span className="bm-text">Sans aide, comme une interro. 90 % de bonnes réponses sur un livret = son diplôme.</span>
          <span className="bm-foot"><Icon name="check" size={16} /> {diplomas} diplôme{diplomas > 1 ? 's' : ''} sur 12</span>
          <span className="bm-go"><Icon name="play" fill size={22} /></span>
        </button>
      </div>

      <div className="extras">
        <button className="extra" disabled={none} onClick={() => go({ name: 'lesson', table: sel[0] })}>
          <span className="tile-ico c-amber"><Icon name="book" /></span>
          <span><b>Revoir le livret {none ? '' : sel[0]}</b><small>Le livret en entier, avec les astuces</small></span>
        </button>
        <button className="extra" disabled={!weak} onClick={() => go({ name: 'session', mode: 'errors', tables: [] })}>
          <span className="tile-ico c-mint"><Icon name="refresh" /></span>
          <span><b>Mes erreurs</b><small>{weak ? `${weak} calcul${weak > 1 ? 's' : ''} à consolider` : 'Rien à revoir'}</small></span>
        </button>
        <button className="extra" onClick={() => go({ name: 'daily' })}>
          <span className="tile-ico c-violet"><Icon name="calendar" /></span>
          <span><b>Défi du jour</b><small>{dailyDone ? `Fait : ${arena.daily[today()]![p.id]!.score}/20` : 'Les mêmes 20 calculs que ta sœur'}</small></span>
        </button>
        <div className="extra goal-mini">
          <Ring value={doneToday / DAILY_GOAL} size={46} stroke={5} color="url(#lvlgrad)"><small>{Math.min(doneToday, DAILY_GOAL)}</small></Ring>
          <span><b>Objectif du jour</b><small>{doneToday >= DAILY_GOAL ? 'Atteint, bravo !' : `${DAILY_GOAL} bonnes réponses`}</small></span>
        </div>
      </div>
    </section>
  )
}
