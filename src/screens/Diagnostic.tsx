import { useMemo, useRef, useState } from 'react'
import { Profile, addPlayTime } from '../profiles/store'
import { UpdateProfile } from '../App'
import { newDiag, nextDiagExercise, diagAnswer, applyDiagnostic, diagProgress, LADDER } from '../engine/diagnostic'
import { ExerciseView } from '../components/ExerciseView'
import { Cat, Mood } from '../components/Cat'
import { Icon } from '../components/Icon'
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
        <div className="story-card">
          <Cat coat={cat.coat} accessory={cat.accessory} mood="wow" size={120} />
          <div className="eyebrow">2 à 4 minutes</div>
          <h1>Test de niveau</h1>
          <p className="lead">On passe les livrets du plus simple au plus costaud. Chaque livret réussi est validé tout de suite.</p>
          <p className="muted">Ce n’est pas une note : réponds comme tu peux, ça sert à te proposer les bons exercices.</p>
          <button className="btn btn-primary big" onClick={() => setPhase('play')}><Icon name="play" fill /> Commencer</button>
        </div>
      </div>
    )

  if (phase === 'end' && start)
    return (
      <div className="screen story">
        <div className="story-card">
          <Cat coat={cat.coat} accessory={cat.accessory} mood="cheer" size={120} className="jump" />
          <div className="eyebrow">Test terminé</div>
          <h1>{diag.current.passed.length} livret{diag.current.passed.length > 1 ? 's' : ''} validé{diag.current.passed.length > 1 ? 's' : ''} sur {crystals}</h1>
          <div className="diag-chips">
            {LADDER.map((r, i) => <span key={r} className={`dchip ${i < diag.current.passed.length ? 'ok' : ''}`}>{SKILL_BY_ID[r].short}</span>)}
          </div>
          <p className="lead">Conseillé pour commencer : <b>{SKILL_BY_ID[start].title.toLowerCase()}</b>. Tu peux aussi choisir librement tes livrets.</p>
          <div className="rewards"><span className="reward"><Icon name="coin" size={16} /> +30 pièces de bienvenue</span></div>
          <button className="btn btn-primary big" onClick={onDone}>C’est parti <Icon name="right" /></button>
        </div>
      </div>
    )

  return (
    <div className="screen play">
      <div className="gamebar">
        <span className="gb-title">Test de niveau<small>{SKILL_BY_ID[LADDER[Math.min(diag.current.rung, LADDER.length - 1)]].title}</small></span>
        <span className="gb-progress"><i style={{ width: `${diagProgress(diag.current) * 100}%` }} /></span>
        <span className="diag-dots">
          {LADDER.map((r, i) => <i key={r} className={i < diag.current.passed.length ? 'ok' : i === diag.current.rung ? 'now' : ''} title={SKILL_BY_ID[r].short} />)}
        </span>
        <span className="gb-cat"><Cat coat={cat.coat} accessory={cat.accessory} mood={mood} size="100%" /></span>
      </div>
      {ex && <ExerciseView ex={ex} diagnostic onDone={done} onCatMood={setMood} />}
    </div>
  )
}
