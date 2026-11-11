import { useEffect, useRef, useState } from 'react'
import { Profile, Placed, GRID } from '../../profiles/store'
import { IsoIsland } from '../../components/IsoIsland'
import { Cat, Mood } from '../../components/Cat'
import { ItemIcon } from '../../components/Sprites'
import { ITEMS, ITEM_BY_ID, Item, ACCESSORIES, COATS, COAT_UNLOCK, AccessoryId, CoatId } from '../../game/catalog'
import { SKILL_BY_ID } from '../../engine/skills'
import { TabHeader, TabProps } from './Hub'
import { Icon } from '../../components/Icon'
import { UpdateProfile } from '../../App'
import { sfx } from '../../audio/sound'


type Tool = 'place' | 'move' | 'erase'
const CATS: Item['category'][] = ['Sol', 'Nature', 'Maisons', 'Chats', 'Déco', 'Blocs']

export function Island({ profile, update }: TabProps) {
  const [mode, setMode] = useState<'view' | 'build'>('view')
  const [panel, setPanel] = useState<null | 'cat'>(null)
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
  const unlocked = (i: Item) => (i.bonus ? profile.bonusItems.includes(i.id) : mastered(i.unlock))
  const lockText = (i: Item) => (i.bonus ? 'Récompense de l’objectif commun (Arène).' : `Maîtrise ${SKILL_BY_ID[i.unlock!].title.toLowerCase()} pour le débloquer.`)

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
    if (!unlocked(it)) { setMsg(lockText(it)); return }
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
    <section className={`view village ${mode === 'build' ? 'is-build' : ''}`}>
      <TabHeader title="Mon île" sub="Construis avec ce que tu gagnes en jouant." profile={profile}>
        {mode === 'view' && (
          <>
            <button className="btn btn-ghost small" onClick={() => setPanel('cat')}><Icon name="paw" size={18} /> {profile.cat.name || 'Mon chat'}</button>
            <button className="btn btn-primary small" onClick={() => { setMode('build'); setMsg('Choisis un objet, puis touche une case.') }}><Icon name="hammer" size={18} /> Construire</button>
          </>
        )}
      </TabHeader>
      <div className="island-stage">
        <div className="stars" aria-hidden />
        <div className="island-wrap">
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
        </div>
      </div>

      {mode === 'build' && (
        <section className="build-tray">
          <div className="tray-top">
            <div className="tools">
              {([['place', 'Poser'], ['move', 'Déplacer'], ['erase', 'Ranger']] as [Tool, string][]).map(([t, l]) => (
                <button key={t} className={`chip ${tool === t ? 'on' : ''}`} onClick={() => { setTool(t); setMoving(null); setMsg(t === 'place' ? 'Choisis un objet, puis touche une case.' : t === 'move' ? 'Touche un objet à déplacer.' : 'Touche un objet pour le ranger, ou un sol pour remettre de l’herbe.') }}>{l}</button>
              ))}
            </div>
            <div className="tray-msg">{msg}</div>
            <button className="btn btn-primary" onClick={() => { setMode('view'); setMoving(null) }}><Icon name="check" size={18} /> Terminé</button>
          </div>
          {tool === 'place' && (
            <>
              <div className="cats">
                {CATS.map((c) => <button key={c} className={`tab ${cat === c ? 'on' : ''}`} onClick={() => setCatCat(c)}>{c}</button>)}
              </div>
              <div className="items">
                {items.map((i) => {
                  const locked = !unlocked(i)
                  return (
                    <button key={i.id} className={`item ${sel === i.id ? 'on' : ''} ${locked ? 'locked' : ''} ${!canAfford(i) ? 'poor' : ''}`} onClick={() => { sfx.tap(); setSel(i.id); setMsg(locked ? lockText(i) : `${i.name} : touche une case.`) }}>
                      <span className="item-ico"><ItemIcon item={i.id} layer={i.layer} /></span>
                      <span className="item-name">{locked && <Icon name="lock" size={12} />} {i.name}</span>
                      <span className="item-cost">{i.coins ? <><Icon name="coin" size={12} />{i.coins}</> : null}{i.cubes ? <> <Icon name="cube" size={12} />{i.cubes}</> : null}{!i.coins && !i.cubes ? 'Gratuit' : ''}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </section>
      )}

      {panel === 'cat' && <CatPanel profile={profile} update={update} onClose={() => setPanel(null)} />}
    </section>
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
                <button key={c.id} className={`coat ${profile.cat.coat === c.id ? 'on' : ''}`} disabled={!!locked} onClick={() => setCoat(c.id)} title={locked ? SKILL_BY_ID[need!].title : c.name}>
                  <Cat coat={c.id} size={48} />
                  <span>{locked ? SKILL_BY_ID[need!].short : c.name}</span>
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
                  {locked ? `${a.name} · ${SKILL_BY_ID[a.unlock!].short}` : a.name}
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
