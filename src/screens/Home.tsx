import { useMemo } from 'react'
import { Cat } from '../components/Cat'
import { PROFILES, ProfileId, loadProfile } from '../profiles/store'
import { currentSkill } from '../engine/learner'
import { SKILL_BY_ID } from '../engine/skills'
import { sfx } from '../audio/sound'
import { Logo } from '../components/Logo'

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
      <div className="sky" />
      <div className="clouds" />
      <img className="home-art" src="/assets/archipel.jpg" alt="" />
      <div className="home-top">
        <Logo />
        <p className="slogan">Construis ton monde, maîtrise le temps !</p>
      </div>

      <div className="profile-cards">
        {profiles.map((p) => {
          const ch = p.setupDone ? SKILL_BY_ID[currentSkill(p.learner)] : null
          return (
            <button key={p.id} className="profile-card" style={{ ['--pc' as any]: p.color }} onClick={() => { sfx.meow(); onChoose(p.id) }}>
              <div className="pc-cat">
                <Cat coat={p.cat.coat} accessory={p.cat.accessory} mood="happy" size="100%" />
              </div>
              <div className="pc-name">{p.name}</div>
              <div className="pc-sub">
                {p.setupDone ? (
                  <>
                    <span>⭐ {p.stars}</span>
                    <span>Chapitre {ch!.chapter}</span>
                  </>
                ) : (
                  <span>Nouvelle aventure !</span>
                )}
              </div>
              {p.setupDone && p.cat.name && <div className="pc-catname">avec {p.cat.name}</div>}
            </button>
          )
        })}
      </div>

      <div className="home-foot">
        <button className="btn btn-ghost small" onClick={toggleSound}>{sound ? '🔊 Son' : '🔇 Muet'}</button>
        <button className="btn btn-ghost small" onClick={onParent}>🔒 Espace parents</button>
      </div>
    </div>
  )
}
