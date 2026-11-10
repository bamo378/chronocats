import { useState } from 'react'
import { Profile, addPlayTime } from '../profiles/store'
import { UpdateProfile } from '../App'
import { MISSIONS } from '../game/missions'
import { composeMission, recordAnswer, rewardFor, currentSkill, isDue } from '../engine/learner'
import { Exercise } from '../engine/exercises'
import { SKILL_BY_ID, SkillId } from '../engine/skills'
import { ExerciseView, ExerciseOutcome } from '../components/ExerciseView'
import { Cat, Mood } from '../components/Cat'
import { Scene } from '../components/Scene'
import { Lesson } from '../components/Lesson'
import { ITEMS, ACCESSORIES, COATS, COAT_UNLOCK } from '../game/catalog'
import { sfx } from '../audio/sound'

interface Props {
  profile: Profile
  update: UpdateProfile
  missionId: string
  focus?: SkillId
  onExit: () => void
}

interface Gains { coins: number; cubes: number; firstTry: number; persevere: number; mastered: SkillId[]; reviewsOk: number }

export function MissionScreen({ profile, update, missionId, focus, onExit }: Props) {
  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0]
  const [list] = useState<Exercise[]>(() => composeMission(profile.learner, 6, Math.random, focus))
  const lessonSkill = focus ?? currentSkill(profile.learner)
  const needLesson = !profile.learner.skills[lessonSkill].introSeen
  const [phase, setPhase] = useState<'story' | 'lesson' | 'play' | 'reward'>('story')
  const [idx, setIdx] = useState(0)
  const [mood, setMood] = useState<Mood>('idle')
  const [bubble, setBubble] = useState('')
  const [gains, setGains] = useState<Gains>({ coins: 0, cubes: 0, firstTry: 0, persevere: 0, mastered: [], reviewsOk: 0 })
  const cat = profile.cat
  const ex = list[idx]

  function onDone(o: ExerciseOutcome) {
    // Travail sur une copie : on lit les résultats tout de suite, puis on enregistre.
    const next: Profile = structuredClone(profile)
    const wasReview = isDue(next.learner.skills[ex.skill], Date.now())
    const res = recordAnswer(next.learner, ex, { correct: o.firstTry, hint: o.hint, error: o.error, ms: o.ms })
    const r = rewardFor(next.learner, ex, o.firstTry, o.eventually)
    let coins = r.coins
    let cubes = r.cubes
    const persevere = !o.firstTry && o.eventually ? 1 : 0
    if (persevere) coins += 4
    if (res.newlyMastered) { coins += 50; cubes += 5 }
    next.coins += coins
    next.cubes += cubes
    addPlayTime(next, Math.min(o.ms, 120000))
    update((p) => Object.assign(p, next))

    const g: Gains = {
      coins: gains.coins + coins,
      cubes: gains.cubes + cubes,
      firstTry: gains.firstTry + (o.firstTry ? 1 : 0),
      persevere: gains.persevere + persevere,
      mastered: res.newlyMastered ? [...gains.mastered, ex.skill] : gains.mastered,
      reviewsOk: gains.reviewsOk + (wasReview && res.reviewPassed ? 1 : 0),
    }
    setGains(g)
    setBubble(o.eventually ? mission.steps[Math.min(idx, mission.steps.length - 1)] : 'On continue, je suis avec toi !')
    if (idx + 1 >= list.length) {
      const stars = g.firstTry >= 5 ? 3 : g.firstTry >= 3 ? 2 : 1
      update((p) => { p.stars += stars; p.missionsDone += 1 })
      sfx.fanfare()
      setTimeout(() => setPhase('reward'), 400)
    } else {
      setIdx(idx + 1)
      setMood('idle')
    }
  }

  const stars = gains.firstTry >= 5 ? 3 : gains.firstTry >= 3 ? 2 : 1

  if (phase === 'story')
    return (
      <div className="screen story">
        <div className="sky" />
        <button className="btn btn-ghost back" onClick={onExit}>← Village</button>
        <div className="panel story-panel">
          <div className="mission-emoji">{mission.emoji}</div>
          <h1>{mission.title}</h1>
          <Scene kind={mission.scene} step={0} total={list.length} coat={cat.coat} />
          <p className="lead">{mission.start(cat.name)}</p>
          {focus && <p className="small-note">Chapitre {SKILL_BY_ID[focus].chapter} : {SKILL_BY_ID[focus].title}</p>}
          <button className="btn btn-primary big" onClick={() => setPhase(needLesson ? 'lesson' : 'play')}>En route !</button>
        </div>
      </div>
    )

  if (phase === 'lesson')
    return (
      <div className="screen story">
        <div className="sky" />
        <Lesson skill={lessonSkill} onDone={() => { update((p) => { p.learner.skills[lessonSkill].introSeen = true }); setPhase('play') }} />
      </div>
    )

  if (phase === 'reward') {
    const unlockedItems = ITEMS.filter((i) => i.unlock && gains.mastered.includes(i.unlock))
    const unlockedAcc = ACCESSORIES.filter((a) => a.unlock && gains.mastered.includes(a.unlock))
    const unlockedCoats = COATS.filter((c) => COAT_UNLOCK[c.id] && gains.mastered.includes(COAT_UNLOCK[c.id]!))
    return (
      <div className="screen story">
        <div className="sky" />
        <div className="confetti" aria-hidden>{Array.from({ length: 24 }).map((_, i) => <i key={i} style={{ ['--i' as any]: i }} />)}</div>
        <div className="panel story-panel">
          <Cat coat={cat.coat} accessory={cat.accessory} mood="cheer" size={150} className="jump" />
          <h1>Mission réussie !</h1>
          <p className="lead">{mission.end(cat.name)}</p>
          <div className="stars-big">{[1, 2, 3].map((s) => <span key={s} className={s <= stars ? 'on' : ''}>★</span>)}</div>
          <div className="reward-row">
            <span className="pill">🪙 +{gains.coins}</span>
            {gains.cubes > 0 && <span className="pill">🧊 +{gains.cubes} cubes</span>}
            <span className="pill">⭐ +{stars}</span>
          </div>
          {gains.persevere > 0 && <p className="badge-line">💪 Persévérance : tu as corrigé {gains.persevere} erreur{gains.persevere > 1 ? 's' : ''} toute seule !</p>}
          {gains.reviewsOk > 0 && <p className="badge-line">🧠 Mémoire : {gains.reviewsOk} révision{gains.reviewsOk > 1 ? 's' : ''} réussie{gains.reviewsOk > 1 ? 's' : ''}.</p>}
          {gains.mastered.map((s) => (
            <div key={s} className="mastered">🏅 Chapitre maîtrisé : <b>{SKILL_BY_ID[s].title}</b></div>
          ))}
          {(unlockedItems.length > 0 || unlockedAcc.length > 0 || unlockedCoats.length > 0) && (
            <div className="unlocks">
              <b>Nouveau !</b> {[...unlockedItems.map((i) => i.name), ...unlockedAcc.map((a) => a.name), ...unlockedCoats.map((c) => `Pelage ${c.name}`)].join(' · ')}
            </div>
          )}
          <button className="btn btn-primary big" onClick={onExit}>Retour au village</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen play">
      <div className="sky" />
      <div className="play-top">
        <button className="btn btn-ghost small" onClick={onExit}>✕</button>
        <div className="mission-title">{mission.emoji} {mission.title}</div>
        <div className="dots">{list.map((_, i) => <span key={i} className={i < idx ? 'done' : i === idx ? 'now' : ''} />)}</div>
        <div className="coins">🪙 {profile.coins}</div>
      </div>
      <Scene kind={mission.scene} step={idx} total={list.length} coat={cat.coat} />
      <div className="play-body">
        <div className="buddy">
          <Cat coat={cat.coat} accessory={cat.accessory} mood={mood} size={100} onClick={() => { sfx.meow(); setMood('happy') }} />
          {bubble && <div className="bubble">{bubble}</div>}
          {isDue(profile.learner.skills[ex.skill], Date.now()) && <div className="tag-review">🧠 Révision</div>}
        </div>
        <ExerciseView key={ex.id} ex={ex} onDone={onDone} onCatMood={setMood} />
      </div>
    </div>
  )
}
