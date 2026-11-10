import { Profile } from '../profiles/store'
import { ISLANDS } from '../game/catalog'
import { SKILL_BY_ID, SkillId } from '../engine/skills'
import { currentSkill, isUnlocked, isDue } from '../engine/learner'
import { sfx } from '../audio/sound'
import { Cat } from '../components/Cat'

export function MapScreen({ profile, onBack, onPlay }: { profile: Profile; onBack: () => void; onPlay: (s: SkillId) => void }) {
  const L = profile.learner
  const cur = currentSkill(L)
  const now = Date.now()
  return (
    <div className="screen map">
      <div className="sky" />
      <div className="clouds" />
      <header className="map-top">
        <button className="btn btn-ghost" onClick={onBack}>← Village</button>
        <h1>L’Archipel des Douze Heures</h1>
        <div />
      </header>
      <div className="islands">
        {ISLANDS.map((isl, i) => {
          const open = isUnlocked(L, isl.skills[0])
          const done = isl.skills.every((s) => L.skills[s].mastered)
          const here = isl.skills.includes(cur)
          return (
            <div key={isl.id} className={`isl ${open ? 'open' : 'locked'} ${done ? 'done' : ''}`} style={{ ['--ic' as any]: isl.color, ['--d' as any]: `${i * 0.4}s` }}>
              <div className="isl-rock">
                <div className="isl-top"><span className="isl-emoji">{open ? isl.emoji : '☁️'}</span></div>
              </div>
              {here && <div className="isl-cat"><Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood="happy" size={56} /></div>}
              <div className="isl-name">{isl.name}</div>
              <div className="isl-chapters">
                {isl.skills.map((s) => {
                  const st = L.skills[s]
                  const unlocked = isUnlocked(L, s)
                  const pct = st.mastered ? 100 : Math.round(Math.min(1, st.score / 0.8) * 100)
                  return (
                    <button key={s} className={`chap ${st.mastered ? 'm' : ''} ${s === cur ? 'cur' : ''}`} disabled={!unlocked} onClick={() => { sfx.tap(); onPlay(s) }}>
                      <span className="chap-n">{unlocked ? SKILL_BY_ID[s].chapter : '🔒'}</span>
                      <span className="chap-t">{SKILL_BY_ID[s].short}</span>
                      <span className="chap-bar"><i style={{ width: `${pct}%` }} /></span>
                      <span className="chap-s">{st.mastered ? (isDue(st, now) ? '🧠 à réviser' : '🏅 maîtrisé') : unlocked ? 'en cours' : 'bientôt'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p className="map-note">Touche un chapitre ouvert pour rejouer ou t’entraîner.</p>
    </div>
  )
}
