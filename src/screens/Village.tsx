import { useEffect, useRef, useState } from 'react'
import { Profile, ParentSettings, Placed, today, GRID } from '../profiles/store'
import { UpdateProfile, Screen } from '../App'
import { IsoIsland } from '../components/IsoIsland'
import { Cat, Mood } from '../components/Cat'
import { ItemIcon } from '../components/Sprites'
import { ITEMS, ITEM_BY_ID, Item, ACCESSORIES, COATS, COAT_UNLOCK, AccessoryId, CoatId } from '../game/catalog'
import { MISSIONS } from '../game/missions'
import { currentSkill, dueSkills } from '../engine/learner'
import { SKILL_BY_ID, SKILLS } from '../engine/skills'
import { sfx } from '../audio/sound'
import { Logo } from '../components/Logo'

interface Props {
  profile: Profile
  update: UpdateProfile
  parent: ParentSettings
  go: (s: Screen) => void
}

type Tool = 'place' | 'move' | 'erase'
const CATS: Item['category'][] = ['Sol', 'Nature', 'Maisons', 'Chats', 'Déco', 'Blocs']

export function Village({ profile, update, parent, go }: Props) {
  const [mode, setMode] = useState<'view' | 'build'>('view')
  const [panel, setPanel] = useState<null | 'missions' | 'cat'>(null)
  const [rushMode, setRushMode] = useState(false)
  const [tool, setTool] = useState<Tool>('place')
  const [cat, setCatCat] = useState<Item['category']>('Nature')
  const [sel, setSel] = useState<string>('tree')
  const [moving, setMoving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [catPos, setCatPos] = useState({ x: 4, y: 5 })
  const [catMood, setCatMood] = useState<Mood>('idle')
  const [flip, setFlip] = useState(false)
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; text: string }[]>([])
  const burstId = useRef(0)

  const L = profile.learner
  const mastered = (s?: string) => !s || L.skills[s as keyof typeof L.skills]?.mastered
  const due = dueSkills(L)
  const cur = SKILL_BY_ID[currentSkill(L)]
  const playedToday = Math.round((profile.playByDay[today()] ?? 0) / 60000)
  const enough = playedToday >= parent.sessionMinutes

  const occupied = (x: number, y: number) => profile.objects.find((o) => o.x === x && o.y === y)
  const walkable = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false
    const o = occupied(x, y)
    if (profile.ground[y][x] === 'water') return !!o && o.item === 'bridge'
    return !o || ['flowers', 'cushion', 'bridge'].includes(o.item)
  }

  // Le chat se promène tout seul.
  useEffect(() => {
    if (mode !== 'view') return
    const id = setInterval(() => {
      setCatPos((p) => {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5)
        for (const [dx, dy] of dirs) {
          if (walkable(p.x + dx, p.y + dy)) {
            setFlip(dx - dy < 0)
            return { x: p.x + dx, y: p.y + dy }
          }
        }
        return p
      })
    }, 2600)
    return () => clearInterval(id)
  }, [mode, profile.objects, profile.ground])

  function burst(x: number, y: number, text: string) {
    const id = ++burstId.current
    setBursts((b) => [...b, { id, x, y, text }])
    setTimeout(() => setBursts((b) => b.filter((v) => v.id !== id)), 1200)
  }

  function petCat() {
    sfx.meow()
    setCatMood('happy')
    burst(catPos.x, catPos.y, '💖')
    setTimeout(() => setCatMood('idle'), 1800)
  }

  function canAfford(i: Item) {
    return profile.coins >= i.coins && profile.cubes >= i.cubes
  }

  function onTile(x: number, y: number) {
    if (mode === 'view') {
      // Le chat vient vers la case touchée (si possible).
      if (walkable(x, y)) { setFlip(x - y < catPos.x - catPos.y); setCatPos({ x, y }) }
      return
    }
    const here = occupied(x, y)
    if (tool === 'move' && moving) {
      const o = profile.objects.find((v) => v.id === moving)!
      const it = ITEM_BY_ID[o.item]
      if (here) { setMsg('Cette case est déjà prise.'); return }
      const water = profile.ground[y][x] === 'water'
      if (water !== !!it.onWater) { setMsg(it.onWater ? 'Le pont se pose sur l’eau.' : 'Pas sur l’eau !'); return }
      sfx.place()
      update((p) => { const t = p.objects.find((v) => v.id === moving)!; t.x = x; t.y = y })
      setMoving(null)
      setMsg('Déplacé !')
      return
    }
    if (tool === 'erase') {
      if (!here && profile.ground[y][x] !== 'grass') {
        sfx.remove()
        update((p) => { p.ground[y][x] = 'grass' })
      }
      return
    }
    if (tool !== 'place') return
    const it = ITEM_BY_ID[sel]
    if (!it) return
    if (!mastered(it.unlock)) { setMsg(`Débloqué au chapitre ${SKILL_BY_ID[it.unlock!].chapter}.`); return }
    if (!canAfford(it)) { setMsg('Il te faut plus de pièces ou de cubes. Joue une mission !'); return }
    if (it.layer === 'ground') {
      if (profile.ground[y][x] === it.id) return
      if (it.id === 'water' && here) { setMsg('Enlève d’abord l’objet.'); return }
      sfx.place()
      update((p) => { p.ground[y][x] = it.id; p.coins -= it.coins; p.cubes -= it.cubes })
      return
    }
    if (here) { setMsg('Cette case est déjà prise.'); return }
    const water = profile.ground[y][x] === 'water'
    if (water !== !!it.onWater) { setMsg(it.onWater ? 'Le pont se pose sur l’eau.' : 'Pas sur l’eau !'); return }
    sfx.place()
    const id = 'o' + Date.now().toString(36) + Math.floor(Math.random() * 1e4)
    update((p) => { p.objects.push({ id, item: it.id, x, y }); p.coins -= it.coins; p.cubes -= it.cubes })
    burst(x, y, '✨')
    setMsg(`${it.name} posé !`)
  }

  function onObject(o: Placed) {
    if (mode === 'view') return
    if (tool === 'erase') {
      const it = ITEM_BY_ID[o.item]
      sfx.remove()
      update((p) => {
        p.objects = p.objects.filter((v) => v.id !== o.id)
        p.coins += Math.floor(it.coins / 2)
        p.cubes += Math.floor(it.cubes / 2)
      })
      setMsg(`${it.name} rangé (la moitié du prix est rendue).`)
      return
    }
    if (tool === 'move') {
      sfx.tap()
      setMoving(o.id)
      setMsg('Touche la case où le poser.')
      return
    }
    setMsg('Case prise : choisis « Déplacer » ou « Ranger ».')
  }

  const items = ITEMS.filter((i) => i.category === cat)

  return (
    <div className={`screen village ${mode === 'build' ? 'is-build' : ''}`}>
      <div className="sky" />
      <div className="clouds" />
      <div className="ambient" aria-hidden>
        <div className="sun" />
        <span className="fly" style={{ ['--t' as any]: '19s', ['--d' as any]: '0s' }}>🦋</span>
        <span className="fly" style={{ ['--t' as any]: '26s', ['--d' as any]: '-9s', top: '-20vh' } as any}>🦋</span>
        {[[12, 30], [80, 22], [64, 70], [22, 76], [90, 55], [40, 14]].map(([x, y], i) => (
          <i key={i} className="spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>

      <header className="hud">
        <button className="hud-me" onClick={() => go({ name: 'home' })} style={{ ['--pc' as any]: profile.color }}>
          <span className="hud-avatar"><Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood="happy" size="100%" /></span>
          <span className="hud-name">{profile.name}</span>
        </button>
        <Logo small />
        <div className="hud-res">
          <span className="res">🪙 {profile.coins}</span>
          <span className="res">🧊 {profile.cubes}</span>
          <span className="res">⭐ {profile.stars}</span>
        </div>
      </header>

      {enough && mode === 'view' && (
        <div className="banner">😺 Belle séance aujourd’hui ({playedToday} min) ! {profile.cat.name} te propose une pause. Ta ville t’attendra.</div>
      )}

      <main className="island-wrap">
        <IsoIsland
          ground={profile.ground}
          objects={profile.objects}
          showGrid={mode === 'build'}
          selectedId={moving}
          onTile={onTile}
          onObject={onObject}
          bursts={bursts}
          actor={
            mode === 'view'
              ? {
                  ...catPos,
                  node: (
                    <g transform="translate(-26 -52)" onClick={(e) => { e.stopPropagation(); petCat() }} className="world-cat">
                      <Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood={catMood} size={54} flip={flip} />
                    </g>
                  ),
                }
              : undefined
          }
        />
      </main>

      {mode === 'view' && (
        <nav className="dock">
          <button className="dock-btn main" onClick={() => setPanel('missions')}>
            <span className="ico">🎮</span><span>Jouer</span>
            {due.length > 0 && <span className="badge">{due.length}</span>}
          </button>
          <button className="dock-btn" onClick={() => { setMode('build'); setMsg('Choisis un objet, puis touche une case.') }}>
            <span className="ico">🧱</span><span>Construire</span>
          </button>
          <button className="dock-btn" onClick={() => go({ name: 'map' })}>
            <span className="ico">🏝️</span><span>Archipel</span>
          </button>
          <button className="dock-btn" onClick={() => setPanel('cat')}>
            <span className="ico">🐱</span><span>{profile.cat.name || 'Mon chat'}</span>
          </button>
        </nav>
      )}

      {mode === 'build' && (
        <section className="build-tray">
          <div className="tray-top">
            <div className="tools">
              {([['place', '➕ Poser'], ['move', '✋ Déplacer'], ['erase', '🧺 Ranger']] as [Tool, string][]).map(([t, l]) => (
                <button key={t} className={`chip ${tool === t ? 'on' : ''}`} onClick={() => { setTool(t); setMoving(null); setMsg(t === 'place' ? 'Choisis un objet, puis touche une case.' : t === 'move' ? 'Touche un objet à déplacer.' : 'Touche un objet pour le ranger, ou un sol pour remettre de l’herbe.') }}>{l}</button>
              ))}
            </div>
            <div className="tray-msg">{msg}</div>
            <button className="btn btn-primary" onClick={() => { setMode('view'); setMoving(null) }}>✔ Fini</button>
          </div>
          {tool === 'place' && (
            <>
              <div className="cats">
                {CATS.map((c) => <button key={c} className={`tab ${cat === c ? 'on' : ''}`} onClick={() => setCatCat(c)}>{c}</button>)}
              </div>
              <div className="items">
                {items.map((i) => {
                  const locked = !mastered(i.unlock)
                  return (
                    <button key={i.id} className={`item ${sel === i.id ? 'on' : ''} ${locked ? 'locked' : ''} ${!canAfford(i) ? 'poor' : ''}`} onClick={() => { sfx.tap(); setSel(i.id); setMsg(locked ? `🔒 Maîtrise le chapitre ${SKILL_BY_ID[i.unlock!].chapter} pour débloquer.` : `${i.name} : touche une case.`) }}>
                      <span className="item-ico"><ItemIcon item={i.id} layer={i.layer} /></span>
                      <span className="item-name">{locked ? '🔒 ' : ''}{i.name}</span>
                      <span className="item-cost">{i.coins ? `🪙${i.coins}` : ''}{i.cubes ? ` 🧊${i.cubes}` : ''}{!i.coins && !i.cubes ? 'Gratuit' : ''}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </section>
      )}

      {panel === 'missions' && (
        <div className="sheet-bg" onClick={() => setPanel(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>On s’entraîne !</h2>
            <p className="sheet-sub">
              Conseillé : <b>{cur.title}</b>
              {due.length > 0 && <> · 🧠 {due.length} révision{due.length > 1 ? 's' : ''} incluse{due.length > 1 ? 's' : ''}</>}
            </p>
            <div className="mode-toggle" role="group" aria-label="Mode">
              <button className={!rushMode ? 'on' : ''} onClick={() => setRushMode(false)}>🎯 Apprendre</button>
              <button className={rushMode ? 'on' : ''} onClick={() => setRushMode(true)}>⚡ Défi éclair</button>
            </div>
            <h3>{rushMode ? 'Quel livret pour le défi de 60 secondes ?' : 'Choisis ton livret'}</h3>
            <div className="livret-pick">
              {SKILLS.map((s) => {
                const st = L.skills[s.id]
                return (
                  <button key={s.id} className={`lp ${st.mastered ? 'm' : ''} ${s.id === cur.id ? 'cur' : ''}`} onClick={() => { sfx.tap(); go(rushMode ? { name: 'rush', focus: s.id } : { name: 'mission', missionId: MISSIONS[Math.floor(Math.random() * MISSIONS.length)].id, focus: s.id }) }}>
                    <span className="lp-n">{s.id === 'defi' ? '★' : s.id === 'x1x10' ? '1·10' : s.id.slice(1)}</span>
                    <span className="lp-s">{rushMode ? `🏆 ${profile.records?.[s.id] ?? 0}` : st.mastered ? '🏅' : s.id === 'defi' ? 'Défi' : '×'}</span>
                  </button>
                )
              })}
            </div>
            {!rushMode && <h3>Ou une aventure guidée (avec les révisions)</h3>}
            {!rushMode && <div className="mission-list">
              {MISSIONS.map((m) => (
                <button key={m.id} className="mission-card" onClick={() => { sfx.tap(); go({ name: 'mission', missionId: m.id }) }}>
                  <span className="mc-emoji">{m.emoji}</span>
                  <span className="mc-title">{m.title}</span>
                  <span className="mc-sub">8 calculs · environ 4 min</span>
                </button>
              ))}
            </div>}
            <button className="btn btn-ghost" onClick={() => setPanel(null)}>Fermer</button>
          </div>
        </div>
      )}

      {panel === 'cat' && <CatPanel profile={profile} update={update} onClose={() => setPanel(null)} />}
    </div>
  )
}

function CatPanel({ profile, update, onClose }: { profile: Profile; update: UpdateProfile; onClose: () => void }) {
  const L = profile.learner
  const [name, setName] = useState(profile.cat.name)
  const [mood, setMood] = useState<Mood>('happy')
  const setAcc = (a: AccessoryId) => { sfx.tap(); update((p) => { p.cat.accessory = a }) }
  const setCoat = (c: CoatId) => { sfx.tap(); update((p) => { p.cat.coat = c }) }
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet cat-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cat-hero" onClick={() => { sfx.meow(); setMood('cheer'); setTimeout(() => setMood('happy'), 1200) }}>
          <Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood={mood} size="100%" />
        </div>
        <div className="cat-edit">
          <label className="field">
            <span>Nom</span>
            <input value={name} maxLength={14} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim().length >= 2 && update((p) => { p.cat.name = name.trim() })} />
          </label>
          <h3>Pelage</h3>
          <div className="coats small">
            {COATS.map((c) => {
              const need = COAT_UNLOCK[c.id]
              const locked = need && !L.skills[need].mastered
              return (
                <button key={c.id} className={`coat ${profile.cat.coat === c.id ? 'on' : ''}`} disabled={!!locked} onClick={() => setCoat(c.id)} title={locked ? `Chapitre ${SKILL_BY_ID[need!].chapter}` : c.name}>
                  <Cat coat={c.id} size={48} />
                  <span>{locked ? '🔒' : c.name}</span>
                </button>
              )
            })}
          </div>
          <h3>Accessoires</h3>
          <div className="accs">
            {ACCESSORIES.map((a) => {
              const locked = a.unlock && !L.skills[a.unlock].mastered
              return (
                <button key={a.id} className={`chip ${profile.cat.accessory === a.id ? 'on' : ''}`} disabled={!!locked} onClick={() => setAcc(a.id)}>
                  {locked ? `🔒 ${a.name} · ch. ${SKILL_BY_ID[a.unlock!].chapter}` : a.name}
                </button>
              )
            })}
          </div>
          <button className="btn btn-primary" onClick={() => { if (name.trim().length >= 2) update((p) => { p.cat.name = name.trim() }); onClose() }}>OK</button>
        </div>
      </div>
    </div>
  )
}
