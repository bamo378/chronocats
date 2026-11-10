import { useMemo, useRef, useState } from 'react'
import { Profile, addPlayTime } from '../profiles/store'
import { UpdateProfile } from '../App'
import { newDiag, nextDiagExercise, diagAnswer, applyDiagnostic, diagProgress, LADDER } from '../engine/diagnostic'
import { ExerciseView } from '../components/ExerciseView'
import { Cat, Mood } from '../components/Cat'
import { SKILL_BY_ID, SKILL_ORDER, SkillId } from '../engine/skills'
import { sfx } from '../audio/sound'

export function Diagnostic({ profile, update, onDone }: { profile: Profile; update: UpdateProfile; onDone: () => void }) {
  const diag = useRef(newDiag())
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [ex, setEx] = useState(() => nextDiagExercise(diag.current))
  const [mood, setMood] = useState<Mood>('idle')
  const [start, setStart] = useState<SkillId | null>(null)
  const crystals = useMemo(() => LADDER.length, [])

  function done(o: { firstTry: boolean; ms: number }) {
    diagAnswer(diag.current, o.firstTry)
    update((p) => addPlayTime(p, Math.min(o.ms, 120000)))
    const n = nextDiagExercise(diag.current)
    if (n) { setEx(n); setMood('idle') }
    else finish()
  }

  function finish() {
    const passed = diag.current.passed
    const first = SKILL_ORDER.find((id) => !passed.includes(id) && !profile.learner.skills[id].mastered) ?? 'defi'
    update((p) => {
      applyDiagnostic(p.learner, diag.current)
      p.coins += 30
      if (!p.badges.includes('reveil')) p.badges.push('reveil')
    })
    setStart(first)
    sfx.fanfare()
    setPhase('end')
  }

  const cat = profile.cat
  if (phase === 'intro')
    return (
      <div className="screen story">
        <div className="sky dusk" />
        <div className="panel story-panel">
          <Cat coat={cat.coat} accessory={cat.accessory} mood="wow" size={170} />
          <h1>Le Grand Réveil</h1>
          <p className="lead">Oh non ! Les horloges de l’Archipel des Douze Heures se sont arrêtées.</p>
          <p className="lead">{cat.name} a besoin de toi pour rallumer les cristaux du temps. Montre-lui ce que tu sais déjà !</p>
          <p className="small-note">Ce n’est pas une interro : réponds comme tu peux, ça aide {cat.name} à préparer ton aventure.</p>
          <button className="btn btn-primary big" onClick={() => setPhase('play')}>Allumer les cristaux ✨</button>
        </div>
      </div>
    )

  if (phase === 'end' && start)
    return (
      <div className="screen story">
        <div className="sky" />
        <div className="panel story-panel">
          <Cat coat={cat.coat} accessory={cat.accessory} mood="cheer" size={170} className="jump" />
          <h1>Merci, {profile.name} !</h1>
          <p className="lead">{diag.current.passed.length} cristaux rallumés sur {crystals}.</p>
          <p className="lead">Ton aventure commence au chapitre {SKILL_BY_ID[start].chapter} : <b>{SKILL_BY_ID[start].title}</b>.</p>
          <div className="reward-row"><span className="pill">🪙 +30 pièces de bienvenue</span></div>
          <button className="btn btn-primary big" onClick={onDone}>Découvrir mon île 🏝️</button>
        </div>
      </div>
    )

  return (
    <div className="screen play">
      <div className="sky dusk" />
      <div className="play-top">
        <div className="crystals">
          {LADDER.map((r, i) => (
            <span key={r.skill} className={`crystal ${i < diag.current.passed.length ? 'lit' : ''}`} title={SKILL_BY_ID[r.skill].short}>◆</span>
          ))}
        </div>
        <div className="progress"><i style={{ width: `${diagProgress(diag.current) * 100}%` }} /></div>
      </div>
      <div className="play-body">
        <div className="buddy">
          <Cat coat={cat.coat} accessory={cat.accessory} mood={mood} size={110} />
          <div className="bubble">On essaie ensemble !</div>
        </div>
        {ex && <ExerciseView ex={ex} diagnostic onDone={done} onCatMood={setMood} />}
      </div>
    </div>
  )
}
