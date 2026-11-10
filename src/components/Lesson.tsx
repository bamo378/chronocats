import { useEffect, useState } from 'react'
import { Clock } from './Clock'
import { SKILL_BY_ID, SkillId } from '../engine/skills'
import { Time, digital, spoken } from '../engine/clock'

const EXAMPLES: Record<SkillId, Time[]> = {
  aiguilles: [{ h: 3, m: 0 }, { h: 3, m: 0 }],
  heures: [{ h: 3, m: 0 }, { h: 7, m: 0 }, { h: 11, m: 0 }],
  minutes: [{ h: 2, m: 5 }, { h: 2, m: 10 }, { h: 2, m: 15 }, { h: 2, m: 20 }],
  demi: [{ h: 4, m: 0 }, { h: 4, m: 30 }, { h: 9, m: 30 }],
  quart: [{ h: 2, m: 0 }, { h: 2, m: 15 }, { h: 6, m: 15 }],
  moinsquart: [{ h: 8, m: 30 }, { h: 8, m: 45 }, { h: 9, m: 0 }],
  cinq: [{ h: 5, m: 35 }, { h: 10, m: 50 }, { h: 1, m: 25 }],
  toutes: [{ h: 3, m: 20 }, { h: 3, m: 23 }, { h: 7, m: 48 }],
  moins: [{ h: 8, m: 40 }, { h: 3, m: 50 }, { h: 11, m: 55 }],
  regler: [{ h: 6, m: 20 }, { h: 6, m: 50 }],
  quotidien: [{ h: 3, m: 0 }, { h: 7, m: 30 }],
  defi: [{ h: 9, m: 12 }, { h: 4, m: 45 }],
}

export function Lesson({ skill, onDone }: { skill: SkillId; onDone: () => void }) {
  const s = SKILL_BY_ID[skill]
  const ex = EXAMPLES[skill]
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ex.length), 2200)
    return () => clearInterval(id)
  }, [ex.length])
  const t = ex[i]
  const hl = skill === 'aiguilles' ? (i % 2 ? 'minute' : 'hour') : undefined
  return (
    <div className="lesson panel">
      <div className="lesson-chip">Chapitre {s.chapter}</div>
      <h1>{s.title}</h1>
      <div className="lesson-body">
        <div className="lesson-clock">
          <Clock time={t} size="100%" highlight={hl} showMinuteLabels={['minutes', 'cinq'].includes(skill)} />
          <div className="lesson-time">
            {skill === 'aiguilles' ? (hl === 'hour' ? 'La petite aiguille : les heures' : 'La grande aiguille : les minutes') : <>{digital(t)} · <i>{spoken(t)}</i></>}
          </div>
        </div>
        <ul className="lesson-lines">
          {s.intro.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </div>
      <button className="btn btn-primary big" onClick={onDone}>J’ai compris, on joue !</button>
    </div>
  )
}
