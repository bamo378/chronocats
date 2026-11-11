import { ReactNode, useMemo, useState } from 'react'
import { Profile, ParentSettings, today, loadArena } from '../../profiles/store'
import { UpdateProfile, Go } from '../../App'
import { Icon } from '../../components/Icon'
import { Cat } from '../../components/Cat'
import { LevelBadge, Res, Ring, TablePicker } from '../../components/ui'
import { currentSkill, correctOnDay, weakFacts, isDue } from '../../engine/learner'
import { SKILL_BY_ID, skillForTable } from '../../engine/skills'
import { GAMES, tablesLabel } from '../../game/games'
import { sfx } from '../../audio/sound'
import { Arena } from './Arena'
import { Progress } from './Progress'
import { Island } from './Island'

export type Tab = 'today' | 'practice' | 'games' | 'arena' | 'progress' | 'island'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Accueil', icon: 'home' },
  { id: 'practice', label: 'S’entraîner', icon: 'target' },
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
        {tab === 'today' && <Today {...props} />}
        {tab === 'practice' && <Practice {...props} />}
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

// ---------------- Accueil ----------------

function Today({ profile: p, go, setTab, parent }: TabProps) {
  const L = p.learner
  const doneToday = correctOnDay(L)
  const sug = SKILL_BY_ID[currentSkill(L)]
  const sugTables = sug.id === 'defi' ? [2, 3, 4, 5, 6, 7, 8, 9, 11, 12] : sug.tables
  const weak = weakFacts(L).length
  const arena = useMemo(() => loadArena(), [])
  const dailyDone = !!arena.daily[today()]?.[p.id]
  const eclair = p.records.eclair
  const due = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((t) => isDue(L.skills[skillForTable(t)], Date.now()))
  const minutes = Math.round((p.playByDay[today()] ?? 0) / 60000)
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Bonjour' : hour < 18 ? 'Salut' : 'Bonsoir'
  const dateStr = new Date().toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section className="view today">
      <TabHeader title={`${hello} ${p.name}`} sub={dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} profile={p} />

      <div className="hero">
        <div className="hero-main">
          <div className="eyebrow">Conseillé pour toi</div>
          <h2>{sug.id === 'defi' ? 'Le grand mélange' : sug.title}</h2>
          <p className="hero-sub">{due.length ? `Avec une révision : ${due.map((t) => `livret ${t}`).slice(0, 2).join(', ')}.` : '10 calculs choisis selon ton niveau, avec astuces.'}</p>
          <div className="hero-actions">
            <button className="btn btn-primary big" onClick={() => go({ name: 'session', mode: 'learn', tables: due.length ? [...new Set([...sugTables, ...due])] : sugTables })}>
              <Icon name="play" fill /> Commencer
            </button>
            <button className="btn btn-ghost big" onClick={() => setTab('practice')}>Choisir mes livrets</button>
          </div>
        </div>
        <div className="hero-side">
          <Ring value={doneToday / DAILY_GOAL} size={132} stroke={10} color="url(#lvlgrad)">
            <span className="goal"><b>{Math.min(doneToday, DAILY_GOAL)}</b><small>/ {DAILY_GOAL}</small></span>
          </Ring>
          <span className="goal-lbl">{doneToday >= DAILY_GOAL ? 'Objectif du jour atteint' : 'Objectif du jour'}</span>
        </div>
        <div className="hero-cat" aria-hidden><Cat coat={p.cat.coat} accessory={p.cat.accessory} mood={doneToday >= DAILY_GOAL ? 'cheer' : 'happy'} size="100%" /></div>
      </div>

      {minutes >= parent.sessionMinutes && (
        <div className="note"><Icon name="timer" size={18} /> {minutes} minutes aujourd’hui : belle séance. {p.cat.name} te propose une pause, rien ne sera perdu.</div>
      )}

      <div className="tiles">
        <button className={`qtile ${dailyDone ? 'done' : ''}`} onClick={() => go({ name: 'daily' })}>
          <span className="tile-ico t-amber"><Icon name="calendar" /></span>
          <span className="tile-t">Défi du jour</span>
          <span className="tile-s">{dailyDone ? `Fait : ${arena.daily[today()]![p.id]!.score}/20` : '20 calculs, les mêmes pour vous deux'}</span>
        </button>
        <button className="qtile" onClick={() => go({ name: 'game', id: 'eclair' })}>
          <span className="tile-ico t-coral"><Icon name="bolt" /></span>
          <span className="tile-t">Éclair</span>
          <span className="tile-s">{eclair ? `Record : ${eclair} pts` : '60 secondes chrono'}</span>
        </button>
        <button className="qtile" disabled={!weak} onClick={() => go({ name: 'session', mode: 'errors', tables: [] })}>
          <span className="tile-ico t-mint"><Icon name="refresh" /></span>
          <span className="tile-t">Mes erreurs</span>
          <span className="tile-s">{weak ? `${weak} calcul${weak > 1 ? 's' : ''} à consolider` : 'Rien à revoir pour l’instant'}</span>
        </button>
        <button className="qtile" onClick={() => setTab('arena')}>
          <span className="tile-ico t-violet"><Icon name="swords" /></span>
          <span className="tile-t">Duel</span>
          <span className="tile-s">Affronte ta sœur sur le même écran</span>
        </button>
      </div>
    </section>
  )
}

// ---------------- S'entraîner ----------------

function Practice({ profile: p, update, go }: TabProps) {
  const sel = p.selection
  const setSel = (t: number[]) => update((x) => { x.selection = t })
  const weak = weakFacts(p.learner, sel).length
  const none = sel.length === 0
  const [lessonT, setLessonT] = useState<number | null>(null)
  const lt = lessonT && sel.includes(lessonT) ? lessonT : sel[0]

  return (
    <section className="view practice">
      <TabHeader title="S’entraîner" sub="Choisis tes livrets, puis un mode." profile={p} />
      <div className="panel">
        <div className="panel-head">
          <h2>Tes livrets</h2>
          <span className="muted">{tablesLabel(sel)}</span>
        </div>
        <TablePicker L={p.learner} value={sel} onChange={setSel} />
      </div>

      <div className="modes">
        <Mode icon="sparkles" color="violet" title="Apprendre" text="10 calculs adaptés à ton niveau, avec astuces et explications." disabled={none} onPlay={() => go({ name: 'session', mode: 'learn', tables: sel })} />
        <Mode icon="infinity" color="cyan" title="Libre" text="Sans chrono et sans limite. Tu t’arrêtes quand tu veux." disabled={none} onPlay={() => go({ name: 'session', mode: 'zen', tables: sel })} />
        <Mode icon="refresh" color="mint" title="Mes erreurs" text={weak ? `${weak} calcul${weak > 1 ? 's' : ''} fragile${weak > 1 ? 's' : ''} dans ces livrets.` : 'Aucun calcul fragile dans ces livrets.'} disabled={!weak} onPlay={() => go({ name: 'session', mode: 'errors', tables: sel })} />
        <div className={`mode ${none ? 'disabled' : ''}`}>
          <span className="mode-ico c-amber"><Icon name="book" /></span>
          <div className="mode-txt">
            <h3>Revoir un livret</h3>
            <p>Le livret en entier, avec l’astuce pour chaque ligne.</p>
            {!none && (
              <div className="mini-chips">
                {sel.map((t) => <button key={t} className={`chip sm ${t === lt ? 'on' : ''}`} onClick={() => setLessonT(t)}>{t}</button>)}
              </div>
            )}
          </div>
          <button className="play-btn" disabled={none} onClick={() => go({ name: 'lesson', table: lt })} aria-label="Ouvrir"><Icon name="right" /></button>
        </div>
      </div>
    </section>
  )
}

function Mode({ icon, color, title, text, onPlay, disabled }: { icon: string; color: string; title: string; text: string; onPlay: () => void; disabled?: boolean }) {
  return (
    <button className={`mode ${disabled ? 'disabled' : ''}`} disabled={disabled} onClick={() => { sfx.tap(); onPlay() }}>
      <span className={`mode-ico c-${color}`}><Icon name={icon} /></span>
      <span className="mode-txt">
        <h3>{title}</h3>
        <p>{text}</p>
      </span>
      <span className="play-btn"><Icon name="play" fill size={18} /></span>
    </button>
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
