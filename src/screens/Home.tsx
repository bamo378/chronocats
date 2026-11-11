import { useMemo } from 'react'
import { Cat } from '../components/Cat'
import { Icon } from '../components/Icon'
import { PROFILES, ProfileId, loadProfile } from '../profiles/store'
import { levelFromXp, tableMastery } from '../engine/learner'
import { Ring } from '../components/ui'
import { Mark } from './hub/Hub'
import { sfx } from '../audio/sound'

interface Props {
  onChoose: (id: ProfileId) => void
  onParent: () => void
  sound: boolean
  toggleSound: () => void
}

export function Home({ onChoose, onParent, sound, toggleSound }: Props) {
  const profiles = useMemo(() => PROFILES.map((p) => loadProfile(p.id)), [])
  return (
    <div className="screen home">
      <div className="home-glow" aria-hidden />
      <header className="home-head">
        <Mark size={64} />
        <h1 className="wordmark">ChronoCats</h1>
        <p>Maîtrise tes livrets, de 1 à 12.</p>
      </header>

      <div className="profile-cards">
        {profiles.map((p, i) => {
          const lv = levelFromXp(p.xp)
          const m = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, t) => s + tableMastery(p.learner, t), 0) / 12
          return (
            <button key={p.id} className="profile-card" style={{ ['--pc' as any]: p.color, animationDelay: `${i * 0.08}s` }} onClick={() => { sfx.meow(); onChoose(p.id) }}>
              <span className="pc-cat"><Cat coat={p.cat.coat} accessory={p.cat.accessory} mood="happy" size="100%" /></span>
              <span className="pc-name">{p.name}</span>
              {p.setupDone ? (
                <span className="pc-stats">
                  <span className="pcs"><b>{lv.level}</b><small>niveau</small></span>
                  <span className="pcs"><Ring value={m} size={38} stroke={4} color="var(--pc)"><small>{Math.round(m * 100)}%</small></Ring><small>des livrets</small></span>
                  <span className="pcs"><b>{p.records.eclair ?? '–'}</b><small>record Éclair</small></span>
                </span>
              ) : (
                <span className="pc-new">Nouvelle partie</span>
              )}
              <span className="pc-go">Jouer <Icon name="right" size={18} /></span>
            </button>
          )
        })}
      </div>

      <footer className="home-foot">
        <button className="btn btn-ghost small" onClick={toggleSound}><Icon name={sound ? 'volume' : 'mute'} size={18} /> {sound ? 'Son activé' : 'Son coupé'}</button>
        <button className="btn btn-ghost small" onClick={onParent}><Icon name="shield" size={18} /> Espace parents</button>
      </footer>
    </div>
  )
}
