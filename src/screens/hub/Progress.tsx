import { useMemo, useState } from 'react'
import { loadArena } from '../../profiles/store'
import { factLevel, isDue, stats, tableMastery, levelFromXp, FactLevel } from '../../engine/learner'
import { factKey } from '../../engine/exercises'
import { skillForTable } from '../../engine/skills'
import { Icon } from '../../components/Icon'
import { TabHeader, TabProps } from './Hub'

const LVL_LABEL: Record<FactLevel, string> = { new: 'Pas encore vu', weak: 'À retravailler', ok: 'En bonne voie', strong: 'Maîtrisé' }

export function Progress({ profile: p, go }: TabProps) {
  const L = p.learner
  const s7 = stats(L, 7)
  const totalOk = Object.values(L.facts).reduce((s, f) => s + f.ok, 0)
  const [cell, setCell] = useState<{ a: number; b: number } | null>(null)
  const arena = useMemo(() => loadArena(), [])
  const now = Date.now()
  const lvl = levelFromXp(p.xp)

  const strongCount = useMemo(() => {
    let n = 0
    for (let a = 1; a <= 12; a++) for (let b = a; b <= 12; b++) if (factLevel(L, a, b) === 'strong') n++
    return n
  }, [L])

  const badges = [
    { id: 'start', icon: 'star', name: 'Premiers pas', desc: '10 bonnes réponses', ok: totalOk >= 10 },
    { id: 'c100', icon: 'sparkles', name: 'Centurie', desc: '100 bonnes réponses', ok: totalOk >= 100 },
    { id: 'c1000', icon: 'medal', name: 'Mille', desc: '1000 bonnes réponses', ok: totalOk >= 1000 },
    { id: 'eclair', icon: 'bolt', name: 'Foudroyante', desc: '25 points à Éclair', ok: (p.records.eclair ?? 0) >= 25 },
    { id: 'survie', icon: 'heart', name: 'Increvable', desc: '20 points à Survie', ok: (p.records.survie ?? 0) >= 20 },
    { id: 'memory', icon: 'grid', name: 'Mémoire d’éléphant', desc: 'Memory en moins de 40 s', ok: (p.records.memory ?? 999) <= 40 },
    { id: 'seven', icon: 'target', name: 'Le 7 dompté', desc: 'Livret 7 maîtrisé', ok: L.skills.x7.mastered },
    { id: 'all', icon: 'trophy', name: 'Maîtresse des livrets', desc: 'Les 78 calculs maîtrisés', ok: strongCount >= 78 },
    { id: 'duel', icon: 'swords', name: 'Duelliste', desc: 'Jouer un duel', ok: arena.duels.some((d) => d.a === p.id || d.b === p.id) },
    { id: 'daily', icon: 'calendar', name: 'Fidèle au poste', desc: 'Jouer 5 défis du jour', ok: Object.values(arena.daily).filter((d) => d[p.id]).length >= 5 },
  ]

  return (
    <section className="view progress">
      <TabHeader title="Progrès" sub="Tout ce que tu as appris, calcul par calcul." profile={p} />

      <div className="kpis">
        <div className="kpi"><span className="kpi-ico c-violet"><Icon name="sparkles" /></span><b>{lvl.level}</b><span>niveau</span></div>
        <div className="kpi"><span className="kpi-ico c-mint"><Icon name="check" /></span><b>{totalOk}</b><span>bonnes réponses</span></div>
        <div className="kpi"><span className="kpi-ico c-cyan"><Icon name="target" /></span><b>{s7.answers ? Math.round(s7.accuracy * 100) + ' %' : '–'}</b><span>précision (7 jours)</span></div>
        <div className="kpi"><span className="kpi-ico c-amber"><Icon name="medal" /></span><b>{strongCount}<small>/78</small></b><span>calculs maîtrisés</span></div>
      </div>

      <div className="progress-grid">
        <div className="panel heat-panel">
          <div className="panel-head">
            <h2>La grande table</h2>
            <span className="muted">Touche une case pour voir le calcul</span>
          </div>
          <div className="heat" role="grid" aria-label="Table de multiplication">
            <span className="hh corner">×</span>
            {Array.from({ length: 12 }, (_, i) => <span key={'c' + i} className="hh">{i + 1}</span>)}
            {Array.from({ length: 12 }, (_, r) => (
              <Row key={r} r={r + 1} L={L} cell={cell} onCell={setCell} />
            ))}
          </div>
          <div className="heat-foot">
            {cell ? (
              <span className="heat-detail">
                <b className="mono">{cell.a} × {cell.b} = {cell.a * cell.b}</b>
                <span className={`lvl-dot l-${factLevel(L, cell.a, cell.b)}`} /> {LVL_LABEL[factLevel(L, cell.a, cell.b)]}
                {(() => { const f = L.facts[factKey(cell.a, cell.b)]; return f ? <span className="muted"> · {f.ok} juste{f.ok > 1 ? 's' : ''}, {f.ko} erreur{f.ko > 1 ? 's' : ''}</span> : null })()}
              </span>
            ) : (
              <span className="legend">
                {(['new', 'weak', 'ok', 'strong'] as FactLevel[]).map((l) => <span key={l}><span className={`lvl-dot l-${l}`} /> {LVL_LABEL[l]}</span>)}
              </span>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Livrets</h2></div>
          <ul className="tlist">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => {
              const m = tableMastery(L, t)
              const sk = L.skills[skillForTable(t)]
              const status = isDue(sk, now) ? 'À réviser' : m >= 0.85 ? 'Maîtrisé' : m > 0 ? 'En cours' : 'Nouveau'
              return (
                <li key={t}>
                  <button onClick={() => go({ name: 'lesson', table: t })}>
                    <span className="tl-n">{t}</span>
                    <span className="tl-bar"><i style={{ width: `${Math.round(m * 100)}%` }} /></span>
                    <span className={`tl-s s-${status === 'Maîtrisé' ? 'ok' : status === 'À réviser' ? 'due' : 'n'}`}>{status}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Badges</h2><span className="muted">{badges.filter((b) => b.ok).length} / {badges.length}</span></div>
        <div className="badges">
          {badges.map((b) => (
            <div key={b.id} className={`badge-c ${b.ok ? 'on' : ''}`}>
              <span className="bc-ico"><Icon name={b.ok ? b.icon : 'lock'} /></span>
              <b>{b.name}</b>
              <small>{b.desc}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Row({ r, L, cell, onCell }: { r: number; L: any; cell: { a: number; b: number } | null; onCell: (c: { a: number; b: number }) => void }) {
  return (
    <>
      <span className="hh">{r}</span>
      {Array.from({ length: 12 }, (_, i) => {
        const c = i + 1
        const lv = factLevel(L, r, c)
        const on = cell && ((cell.a === r && cell.b === c) || (cell.a === c && cell.b === r))
        return <button key={c} className={`hc l-${lv} ${on ? 'on' : ''}`} onClick={() => onCell({ a: r, b: c })} aria-label={`${r} fois ${c}`} />
      })}
    </>
  )
}
