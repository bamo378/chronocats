import { useState } from 'react'
import { Profile, addPlayTime } from '../profiles/store'
import { UpdateProfile } from '../App'
import { composeSession, composeErrors, recordAnswer, rewardFor, factWeights, factLevel } from '../engine/learner'
import { Exercise, generateFor, strategy } from '../engine/exercises'
import { SKILL_BY_ID, SkillId, skillForTable } from '../engine/skills'
import { ExerciseView, ExerciseOutcome } from '../components/ExerciseView'
import { Lesson } from '../components/Lesson'
import { Cat, Mood } from '../components/Cat'
import { Icon } from '../components/Icon'
import { GameBar, ResultView, Miss } from '../components/ui'
import { fx } from '../components/Fx'
import { sfx } from '../audio/sound'
import { tablesLabel } from '../game/games'

export type SessionMode = 'learn' | 'zen' | 'errors'

interface Props {
  profile: Profile
  update: UpdateProfile
  mode: SessionMode
  tables: number[]
  onExit: () => void
  onAgain: () => void
}

const TITLES: Record<SessionMode, string> = { learn: 'Apprendre', zen: 'Libre', errors: 'Mes erreurs' }

export function Session({ profile, update, mode, tables, onExit, onAgain }: Props) {
  const [list, setList] = useState<Exercise[]>(() => {
    if (mode === 'errors') return composeErrors(profile.learner, tables, 10)
    if (mode === 'zen') return [generateFor(tables, Math.random, undefined, factWeights(profile.learner), (t, n) => factLevel(profile.learner, t, n))]
    return composeSession(profile.learner, tables, 10)
  })
  const lessonSkill: SkillId | null = mode === 'learn' && tables.length === 1 ? skillForTable(tables[0]) : null
  const [phase, setPhase] = useState<'lesson' | 'play' | 'end'>(lessonSkill && !profile.learner.skills[lessonSkill].introSeen ? 'lesson' : 'play')
  const [idx, setIdx] = useState(0)
  const [mood, setMood] = useState<Mood>('happy')
  const [combo, setCombo] = useState(0)
  const [g, setG] = useState({ xp: 0, coins: 0, cubes: 0, first: 0, done: 0, bestCombo: 0, mastered: [] as SkillId[] })
  const [misses, setMisses] = useState<Miss[]>([])
  const ex = list[idx]

  function onDone(o: ExerciseOutcome) {
    const next: Profile = structuredClone(profile)
    const res = recordAnswer(next.learner, ex, { correct: o.firstTry, hint: o.hint, error: o.error, ms: o.ms })
    const r = rewardFor(next.learner, ex, o.firstTry, o.eventually)
    const c = o.firstTry ? combo + 1 : 0
    let xp = o.firstTry ? 10 : o.eventually ? 4 : 1
    let coins = r.coins + (c >= 3 ? 1 : 0)
    let cubes = r.cubes
    if (res.newlyMastered) { xp += 100; coins += 50; cubes += 5 }
    next.xp = (next.xp ?? 0) + xp
    next.coins += coins
    next.cubes += cubes
    addPlayTime(next, Math.min(o.ms, 120000))
    update((p) => Object.assign(p, next))

    setCombo(c)
    if (!o.firstTry) {
      const n = ex.a === ex.table ? ex.b : ex.a
      setMisses((m) => (m.some((x) => x.p === ex.product) ? m : [...m, { a: ex.a, b: ex.b, p: ex.product, tip: strategy(ex.table, n) }]))
    }
    const coinEl = document.querySelector('.gamebar .xp-chip')
    if (coinEl && o.eventually) { const rr = coinEl.getBoundingClientRect(); fx.fly(innerWidth / 2, innerHeight / 2, { x: rr.left + rr.width / 2, y: rr.top + rr.height / 2 }, 'stars', Math.min(8, 3 + c)) }
    if (res.newlyMastered) { sfx.fanfare(); setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 3, 'confetti', 80), 250) }
    const ng = {
      xp: g.xp + xp, coins: g.coins + coins, cubes: g.cubes + cubes,
      first: g.first + (o.firstTry ? 1 : 0), done: g.done + 1, bestCombo: Math.max(g.bestCombo, c),
      mastered: res.newlyMastered ? [...g.mastered, ex.skill] : g.mastered,
    }
    setG(ng)
    if (mode === 'zen') {
      setList((l) => [...l, generateFor(tables, Math.random, undefined, factWeights(next.learner), (t, n) => factLevel(next.learner, t, n))])
      setIdx(idx + 1)
    } else if (idx + 1 >= list.length) {
      sfx.fanfare()
      setPhase('end')
    } else setIdx(idx + 1)
    setMood(o.firstTry ? 'happy' : 'think')
  }

  if (phase === 'lesson' && lessonSkill)
    return (
      <div className="screen lesson-screen">
        <GameBar onExit={onExit}><span className="gb-title">{SKILL_BY_ID[lessonSkill].title}</span></GameBar>
        <Lesson skill={lessonSkill} onDone={() => { update((p) => { p.learner.skills[lessonSkill].introSeen = true }); setPhase('play') }} />
      </div>
    )

  if (phase === 'end' || !ex)
    return (
      <ResultView
        profile={profile}
        title={TITLES[mode]}
        score={`${g.first}/${g.done}`}
        unit="du premier coup"
        stats={[
          ['précision', g.done ? `${Math.round((g.first / g.done) * 100)} %` : '–'],
          ['meilleure série', g.bestCombo],
          ['livrets', tables.length ? tables.join(', ') : 'mélangés'],
        ]}
        rewards={{ xp: g.xp, coins: g.coins, cubes: g.cubes }}
        misses={misses}
        onAgain={onAgain}
        againLabel="Encore"
        onExit={onExit}
      />
    )

  const progress = mode === 'zen' ? null : idx / list.length
  return (
    <div className="screen play">
      <GameBar onExit={onExit}>
        <span className="gb-title">{TITLES[mode]}<small>{mode === 'errors' ? 'Calculs fragiles' : tablesLabel(tables)}</small></span>
        {progress !== null ? (
          <span className="gb-progress"><i style={{ width: `${progress * 100}%` }} /></span>
        ) : (
          <span className="gb-count">{g.done} calcul{g.done > 1 ? 's' : ''}</span>
        )}
        {combo >= 2 && <span key={combo} className="combo"><Icon name="flame" size={16} fill /> {combo}</span>}
        <span className="xp-chip"><Icon name="sparkles" size={16} /> {g.xp} XP</span>
        <span className="gb-cat"><Cat coat={profile.cat.coat} accessory={profile.cat.accessory} mood={mood} size="100%" /></span>
        {mode === 'zen' && g.done > 0 && <button className="btn btn-ghost small" onClick={() => setPhase('end')}>Terminer</button>}
      </GameBar>
      <ExerciseView key={ex.id} ex={ex} onDone={onDone} onCatMood={(m) => setMood(m)} />
    </div>
  )
}
