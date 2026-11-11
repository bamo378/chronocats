import { ReactNode } from 'react'
import { Icon } from './Icon'
import { Cat } from './Cat'
import { LearnerState, tableMastery, levelFromXp, weakFacts } from '../engine/learner'
import { Profile } from '../profiles/store'
import { sfx } from '../audio/sound'

// ---------- Anneau de progression ----------

export function Ring({ value, size = 44, stroke = 4, color = 'var(--violet-2)', track = 'var(--line)', children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .6s ease' }} />
      </svg>
      {children !== undefined && <span className="ring-in">{children}</span>}
    </span>
  )
}

// ---------- Sélecteur de livrets ----------

const PRESETS: { label: string; tables: (L: LearnerState) => number[] }[] = [
  { label: 'Tous', tables: () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { label: 'Les faciles', tables: () => [1, 2, 5, 10] },
  { label: 'Les costauds', tables: () => [6, 7, 8, 9, 12] },
  {
    label: 'Mes points faibles',
    tables: (L) => {
      const w = weakFacts(L)
      const ts = [...new Set(w.flatMap((f) => [f.table, f.n]).filter((t) => t >= 2))]
      if (ts.length) return ts.slice(0, 5)
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort((a, b) => tableMastery(L, a) - tableMastery(L, b)).slice(0, 3)
    },
  },
]

export function TablePicker({ L, value, onChange }: { L: LearnerState; value: number[]; onChange: (t: number[]) => void }) {
  const set = new Set(value)
  const toggle = (t: number) => {
    sfx.tap()
    const n = new Set(set)
    if (n.has(t)) n.delete(t)
    else n.add(t)
    onChange([...n].sort((a, b) => a - b))
  }
  return (
    <div className="picker">
      <div className="picker-grid">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => {
          const m = tableMastery(L, t)
          const on = set.has(t)
          return (
            <button key={t} className={`ptile ${on ? 'on' : ''}`} onClick={() => toggle(t)} aria-pressed={on}>
              <span className="ptile-x">×</span>
              <span className="ptile-n">{t}</span>
              <span className="ptile-bar"><i style={{ width: `${Math.round(m * 100)}%` }} /></span>
              {on && <span className="ptile-check"><Icon name="check" size={14} stroke={3} /></span>}
            </button>
          )
        })}
      </div>
      <div className="presets">
        {PRESETS.map((p) => (
          <button key={p.label} className="chip" onClick={() => { sfx.tap(); onChange(p.tables(L)) }}>{p.label}</button>
        ))}
        {value.length > 0 && <button className="chip chip-quiet" onClick={() => onChange([])}>Effacer</button>}
      </div>
    </div>
  )
}

// ---------- Pavé numérique ----------

export function Keypad({ onKey, okDisabled, disabled, ok = true }: { onKey: (k: string) => void; okDisabled?: boolean; disabled?: boolean; ok?: boolean }) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'del', '0', ok ? 'OK' : '']
  return (
    <div className="pad" role="group" aria-label="Pavé de chiffres">
      {keys.map((k, i) =>
        k === '' ? <span key={i} /> : (
          <button
            key={k}
            className={`key ${k === 'OK' ? 'key-ok' : ''} ${k === 'del' ? 'key-del' : ''}`}
            disabled={disabled || (k === 'OK' && okDisabled)}
            onPointerDown={(e) => { e.preventDefault(); onKey(k === 'del' ? '⌫' : k) }}
            aria-label={k === 'del' ? 'Effacer' : k}
          >
            {k === 'del' ? <Icon name="delete" size={26} /> : k}
          </button>
        ),
      )}
    </div>
  )
}

// ---------- Barre du haut des jeux ----------

export function GameBar({ onExit, children }: { onExit: () => void; children?: ReactNode }) {
  return (
    <div className="gamebar">
      <button className="icon-btn" onClick={onExit} aria-label="Quitter"><Icon name="x" /></button>
      {children}
    </div>
  )
}

// ---------- Résultats ----------

export interface Miss { a: number; b: number; p: number; tip?: string }

export function ResultView(props: {
  profile: Profile
  title: string
  score: string | number
  unit?: string
  record?: boolean
  best?: string | number
  stats: [string, string | number][]
  rewards?: { xp: number; coins: number; cubes: number }
  misses?: Miss[]
  onAgain?: () => void
  onExit: () => void
  againLabel?: string
}) {
  const { profile: p } = props
  return (
    <div className="screen result">
      <div className="result-card">
        <div className="result-top">
          <Cat coat={p.cat.coat} accessory={p.cat.accessory} mood={props.record ? 'cheer' : 'happy'} size={92} className="jump" />
          <div>
            <div className="eyebrow">{props.record ? 'Nouveau record' : 'Partie terminée'}</div>
            <h1>{props.title}</h1>
          </div>
        </div>
        <div className="result-score">
          <span className="big-num">{props.score}</span>
          {props.unit && <span className="big-unit">{props.unit}</span>}
          {props.best !== undefined && !props.record && <span className="best">Record : {props.best}</span>}
          {props.record && <span className="best gold"><Icon name="trophy" size={16} /> Record battu</span>}
        </div>
        <div className="result-stats">
          {props.stats.map(([k, v]) => (
            <div key={k} className="rs"><b>{v}</b><span>{k}</span></div>
          ))}
        </div>
        {props.rewards && (
          <div className="rewards">
            <span className="reward"><Icon name="sparkles" size={16} /> +{props.rewards.xp} XP</span>
            <span className="reward"><Icon name="coin" size={16} /> +{props.rewards.coins}</span>
            {props.rewards.cubes > 0 && <span className="reward"><Icon name="cube" size={16} /> +{props.rewards.cubes}</span>}
          </div>
        )}
        {props.misses && props.misses.length > 0 && (
          <div className="misses">
            <div className="eyebrow">À revoir · ils reviendront plus souvent</div>
            <ul>
              {props.misses.slice(0, 6).map((m, i) => (
                <li key={i}><span className="mono">{m.a} × {m.b} = <b>{m.p}</b></span>{m.tip && <small>{m.tip}</small>}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="result-actions">
          {props.onAgain && <button className="btn btn-primary big" onClick={props.onAgain}><Icon name="refresh" /> {props.againLabel ?? 'Rejouer'}</button>}
          <button className="btn btn-ghost big" onClick={props.onExit}>Retour</button>
        </div>
      </div>
    </div>
  )
}

// ---------- Niveau ----------

export function LevelBadge({ xp, compact }: { xp: number; compact?: boolean }) {
  const l = levelFromXp(xp)
  return (
    <span className={`level ${compact ? 'compact' : ''}`}>
      <Ring value={l.into / l.need} size={compact ? 34 : 40} stroke={4} color="url(#lvlgrad)">
        <b>{l.level}</b>
      </Ring>
      {!compact && (
        <span className="level-txt">
          <b>Niveau {l.level}</b>
          <small>{l.into} / {l.need} XP</small>
        </span>
      )}
    </span>
  )
}

/** Dégradé partagé pour les anneaux (déclaré une fois dans la page). */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="lvlgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Res({ icon, value, title }: { icon: string; value: number | string; title: string }) {
  return <span className="res" title={title}><Icon name={icon} size={16} /> {value}</span>
}
