import { ReactNode, useState } from 'react'
import { Profile, ParentSettings } from '../../profiles/store'
import { UpdateProfile, Go } from '../../App'
import { Icon } from '../../components/Icon'
import { Cat } from '../../components/Cat'
import { LevelBadge, Res, TablePicker } from '../../components/ui'
import { GAMES, tablesLabel } from '../../game/games'
import { sfx } from '../../audio/sound'
import { Arena } from './Arena'
import { Progress } from './Progress'
import { Island } from './Island'
import { Livrets } from './Livrets'

export type Tab = 'today' | 'games' | 'arena' | 'progress' | 'island'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Livrets', icon: 'target' },
  { id: 'games', label: 'Jeux', icon: 'gamepad' },
  { id: 'arena', label: 'Arène', icon: 'swords' },
  { id: 'progress', label: 'Progrès', icon: 'chart' },
  { id: 'island', label: 'Mon île', icon: 'island' },
]

export const DAILY_GOAL = 40

export interface TabProps {
  profile: Profile
  update: UpdateProfile
  go: Go
  setTab: (t: Tab) => void
  parent: ParentSettings
}

export function Hub(props: TabProps & { tab: Tab; onSwitch: () => void; sound: boolean; toggleSound: () => void }) {
  const { profile: p, tab, setTab } = props
  return (
    <div className="shell" style={{ ['--pc' as any]: p.color }}>
      <nav className="rail" aria-label="Menu">
        <div className="rail-logo" aria-hidden><Mark /></div>
        <div className="rail-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`rail-btn ${tab === t.id ? 'on' : ''}`} onClick={() => { sfx.tap(); setTab(t.id) }} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} size={24} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="rail-foot">
          <button className="rail-mini" onClick={props.toggleSound} aria-label={props.sound ? 'Couper le son' : 'Activer le son'}><Icon name={props.sound ? 'volume' : 'mute'} size={20} /></button>
          <button className="rail-me" onClick={props.onSwitch} aria-label="Changer de joueuse">
            <Cat coat={p.cat.coat} accessory={p.cat.accessory} mood="happy" size="100%" />
          </button>
        </div>
      </nav>
      <main className="content" key={tab}>
        {tab === 'today' && <Livrets {...props} />}
        {tab === 'games' && <Arcade {...props} />}
        {tab === 'arena' && <Arena {...props} />}
        {tab === 'progress' && <Progress {...props} />}
        {tab === 'island' && <Island {...props} />}
      </main>
    </div>
  )
}

/** Petit emblème : un cadran-chat. */
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <linearGradient id="markg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#f472b6" /></linearGradient>
      </defs>
      <path d="M8 15 10 4l8 6M32 15 30 4l-8 6" fill="url(#markg)" />
      <circle cx="20" cy="23" r="14" fill="url(#markg)" />
      <text x="20" y="28.5" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="700" fontSize="15" fill="#fff">×</text>
    </svg>
  )
}

export function TabHeader({ title, sub, profile, children }: { title: string; sub?: string; profile: Profile; children?: ReactNode }) {
  return (
    <header className="tab-head">
      <div className="tab-title">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="tab-right">
        {children}
        <LevelBadge xp={profile.xp} compact />
        <Res icon="coin" value={profile.coins} title="Pièces" />
        <Res icon="cube" value={profile.cubes} title="Cubes" />
      </div>
    </header>
  )
}

// ---------------- Jeux ----------------

function Arcade({ profile: p, update, go, setTab }: TabProps) {
  const [edit, setEdit] = useState(false)
  const sel = p.selection
  return (
    <section className="view arcade">
      <TabHeader title="Jeux" sub="Sur les livrets que tu choisis. Bats tes records." profile={p} />
      <div className="selbar">
        <span className="selbar-lbl"><Icon name="target" size={18} /> {tablesLabel(sel)}</span>
        <button className="btn btn-ghost small" onClick={() => setEdit(true)}>Modifier</button>
      </div>
      <div className="games">
        {GAMES.map((g, i) => {
          const rec = p.records[g.id]
          return (
            <button key={g.id} className="game-card" style={{ ['--g1' as any]: g.from, ['--g2' as any]: g.to, animationDelay: `${i * 0.05}s` }} disabled={!sel.length} onClick={() => { sfx.tap(); go({ name: 'game', id: g.id }) }}>
              <span className="gc-art"><Icon name={g.icon} size={44} stroke={1.8} /></span>
              <span className="gc-body">
                <span className="gc-name">{g.name}</span>
                <span className="gc-pitch">{g.pitch}</span>
              </span>
              <span className="gc-rec">{rec !== undefined ? <><Icon name="trophy" size={15} /> {rec}{g.unit === 's' ? ' s' : ''}</> : 'Pas encore joué'}</span>
            </button>
          )
        })}
        <button className="game-card" style={{ ['--g1' as any]: '#7c3aed', ['--g2' as any]: '#db2777', animationDelay: '0.25s' }} onClick={() => { sfx.tap(); setTab('arena') }}>
          <span className="gc-art"><Icon name="swords" size={44} stroke={1.8} /></span>
          <span className="gc-body">
            <span className="gc-name">Duel</span>
            <span className="gc-pitch">À deux sur le même écran</span>
          </span>
          <span className="gc-rec">Dans l’Arène <Icon name="right" size={15} /></span>
        </button>
      </div>
      {!sel.length && <p className="muted center">Choisis au moins un livret pour jouer.</p>}
      {edit && (
        <div className="sheet-bg" onClick={() => setEdit(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Livrets pour les jeux</h2>
            <TablePicker L={p.learner} value={sel} onChange={(t) => update((x) => { x.selection = t })} />
            <button className="btn btn-primary" onClick={() => setEdit(false)}>Valider</button>
          </div>
        </div>
      )}
    </section>
  )
}
