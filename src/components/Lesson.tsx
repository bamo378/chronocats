import { useEffect, useState } from 'react'
import { SKILL_BY_ID, SkillId, MAX_FACTOR } from '../engine/skills'
import { strategy } from '../engine/exercises'
import { Icon } from './Icon'

/** Mini-leçon : le livret complet, une ligne mise en avant avec son astuce. */
export function Lesson({ skill, onDone, startTable, cta = 'C’est parti' }: { skill: SkillId; onDone: () => void; startTable?: number; cta?: string }) {
  const s = SKILL_BY_ID[skill]
  const tables = skill === 'defi' ? [] : s.tables
  const [tab, setTab] = useState(Math.max(0, startTable ? tables.indexOf(startTable) : 0))
  const [row, setRow] = useState(1)
  const [auto, setAuto] = useState(true)
  const t = tables[tab]
  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => setRow((r) => (r % MAX_FACTOR) + 1), 1900)
    return () => clearInterval(id)
  }, [auto])
  return (
    <div className="lesson">
      <div className="lesson-head">
        <div className="eyebrow">Revoir</div>
        <h1>{s.title}</h1>
        {tables.length > 1 && (
          <div className="mini-chips">
            {tables.map((x, i) => <button key={x} className={`chip ${i === tab ? 'on' : ''}`} onClick={() => setTab(i)}>Livret {x}</button>)}
          </div>
        )}
      </div>
      <div className="lesson-body">
        {t !== undefined ? (
          <ol className="table-list">
            {Array.from({ length: MAX_FACTOR }).map((_, i) => {
              const n = i + 1
              return (
                <li key={n} className={n === row ? 'on' : ''} onClick={() => { setAuto(false); setRow(n) }}>
                  <span>{n} × {t}</span><b>{n * t}</b>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="defi-mix">2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 11 · 12</div>
        )}
        <div className="lesson-side">
          <ul className="lesson-lines">
            {s.intro.map((l) => <li key={l}>{l}</li>)}
          </ul>
          {t !== undefined && (
            <div className="lesson-trick" key={`${t}-${row}`}>
              <Icon name="bulb" size={20} />
              <span><b className="mono">{row} × {t} = {row * t}</b><br />{strategy(t, row)}</span>
            </div>
          )}
          <button className="btn btn-primary big" onClick={onDone}><Icon name="play" fill /> {cta}</button>
        </div>
      </div>
    </div>
  )
}
