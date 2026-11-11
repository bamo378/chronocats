import { useEffect, useState } from 'react'
import { GameDef, tablesLabel } from '../game/games'
import { Icon } from '../components/Icon'
import { GameBar } from '../components/ui'
import { sfx } from '../audio/sound'

/** Écran d'avant-partie : règles, livrets, record, puis compte à rebours 3-2-1. */
export function Intro({ def, tables, best, onStart, onExit, note }: { def: Pick<GameDef, 'name' | 'icon' | 'rules' | 'from' | 'to' | 'unit'>; tables?: number[]; best?: number; onStart: () => void; onExit: () => void; note?: string }) {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    if (count === null) return
    if (count === 0) { onStart(); return }
    sfx.tick()
    const id = setTimeout(() => setCount((c) => (c ?? 1) - 1), 650)
    return () => clearTimeout(id)
  }, [count])
  return (
    <div className="screen intro" style={{ ['--g1' as any]: def.from, ['--g2' as any]: def.to }}>
      <GameBar onExit={onExit} />
      {count !== null ? (
        <div className="countdown" key={count}>{count || 'Go'}</div>
      ) : (
        <div className="intro-card">
          <span className="intro-art"><Icon name={def.icon} size={56} stroke={1.8} /></span>
          <h1>{def.name}</h1>
          <p className="intro-rules">{def.rules}</p>
          <div className="intro-meta">
            {tables && <span className="pill"><Icon name="target" size={16} /> {tablesLabel(tables)}</span>}
            {best !== undefined && <span className="pill"><Icon name="trophy" size={16} /> Record : {best}{def.unit === 's' ? ' s' : ''}</span>}
          </div>
          {note && <p className="muted small">{note}</p>}
          <button className="btn btn-primary big" onClick={() => setCount(3)}><Icon name="play" fill /> Jouer</button>
        </div>
      )}
    </div>
  )
}
