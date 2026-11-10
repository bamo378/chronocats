import { useEffect, useState } from 'react'
import { SKILL_BY_ID, SkillId, MAX_FACTOR } from '../engine/skills'
import { strategy } from '../engine/exercises'

/** Mini-leçon : le livret complet, une ligne mise en avant avec son astuce. */
export function Lesson({ skill, onDone }: { skill: SkillId; onDone: () => void }) {
  const s = SKILL_BY_ID[skill]
  const tables = skill === 'defi' ? [] : s.tables
  const [tab, setTab] = useState(0)
  const [row, setRow] = useState(1)
  const t = tables[tab]
  useEffect(() => {
    const id = setInterval(() => setRow((r) => (r % MAX_FACTOR) + 1), 1800)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="lesson panel">
      <div className="lesson-chip">Chapitre {s.chapter}</div>
      <h1>{s.title}</h1>
      <div className="lesson-body">
        {t !== undefined ? (
          <div className="lesson-table">
            {tables.length > 1 && (
              <div className="row">
                {tables.map((x, i) => <button key={x} className={`chip ${i === tab ? 'on' : ''}`} onClick={() => setTab(i)}>Livret {x}</button>)}
              </div>
            )}
            <ol className="table-list">
              {Array.from({ length: MAX_FACTOR }).map((_, i) => {
                const n = i + 1
                return (
                  <li key={n} className={n === row ? 'on' : ''} onClick={() => setRow(n)}>
                    <span>{n} × {t}</span><b>{n * t}</b>
                  </li>
                )
              })}
            </ol>
          </div>
        ) : (
          <div className="lesson-table defi-mix">2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 11 · 12</div>
        )}
        <div className="lesson-side">
          <ul className="lesson-lines">
            {s.intro.map((l) => <li key={l}>{l}</li>)}
          </ul>
          {t !== undefined && <div className="lesson-trick">💡 {strategy(t, row)}</div>}
        </div>
      </div>
      <button className="btn btn-primary big" onClick={onDone}>J’ai compris, on joue !</button>
    </div>
  )
}
