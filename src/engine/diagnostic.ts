// Diagnostic en forme d'aventure : on monte l'échelle des compétences
// tant que l'enfant réussit, et on s'arrête à la première difficulté.

import { Exercise, ExerciseKind, generate, Rng } from './exercises'
import { LearnerState, DAY, scheduleNext } from './learner'
import { SKILL_ORDER, SkillId } from './skills'

interface Rung { skill: SkillId; kinds: ExerciseKind[] }

export const LADDER: Rung[] = [
  { skill: 'aiguilles', kinds: ['tapHand', 'handRole'] },
  { skill: 'heures', kinds: ['readChoice', 'setClock'] },
  { skill: 'minutes', kinds: ['minutesChoice', 'minutesChoice'] },
  { skill: 'demi', kinds: ['readChoice', 'setClock'] },
  { skill: 'quart', kinds: ['matchSpoken', 'readChoice'] },
  { skill: 'moinsquart', kinds: ['matchSpoken', 'setClock'] },
  { skill: 'cinq', kinds: ['readChoice', 'setClock'] },
  { skill: 'toutes', kinds: ['readChoice', 'setClock'] },
  { skill: 'moins', kinds: ['matchSpoken', 'readChoice'] },
]

export interface DiagState {
  rung: number
  inRung: number
  results: boolean[]
  passed: SkillId[]
  stopped: boolean
  asked: number
}

export function newDiag(): DiagState {
  return { rung: 0, inRung: 0, results: [], passed: [], stopped: false, asked: 0 }
}

export function nextDiagExercise(d: DiagState, rng: Rng = Math.random): Exercise | null {
  if (d.stopped || d.rung >= LADDER.length) return null
  const r = LADDER[d.rung]
  return generate(r.skill, rng, r.kinds[d.inRung])
}

export function diagAnswer(d: DiagState, correct: boolean): void {
  d.asked++
  d.results.push(correct)
  if (!correct) { d.stopped = true; return }
  d.inRung++
  if (d.inRung >= LADDER[d.rung].kinds.length) {
    d.passed.push(LADDER[d.rung].skill)
    d.rung++
    d.inRung = 0
  }
}

export function diagProgress(d: DiagState): number {
  return Math.min(1, d.asked / (LADDER.length * 2))
}

/** Applique le résultat : chapitres réussis = maîtrisés, à revoir demain pour vérifier. */
export function applyDiagnostic(L: LearnerState, d: DiagState, now = Date.now()): SkillId {
  for (const id of d.passed) {
    const s = L.skills[id]
    s.mastered = true
    s.masteredAt = now
    s.score = 0.85
    s.attempts = Math.max(s.attempts, 2)
    s.correct = Math.max(s.correct, 2)
    s.box = 0
    s.due = Math.min(scheduleNext(s, now), now + DAY)
    s.introSeen = true
  }
  L.diagnosticDone = true
  return SKILL_ORDER.find((id) => !L.skills[id].mastered) ?? 'defi'
}
