// Diagnostic en forme d'aventure : on monte les livrets du plus simple au plus difficile.
// Un livret est validé avec 2 bonnes réponses sur 3 au maximum ; on s'arrête au premier livret raté.

import { Exercise, ExerciseKind, generate, Rng } from './exercises'
import { LearnerState, DAY, scheduleNext } from './learner'
import { SKILL_ORDER, SkillId } from './skills'

export const LADDER: SkillId[] = SKILL_ORDER.filter((s) => s !== 'defi')
const KINDS: ExerciseKind[] = ['choice', 'type', 'type']

export interface DiagState {
  rung: number
  ok: number
  ko: number
  passed: SkillId[]
  stopped: boolean
  asked: number
}

export function newDiag(): DiagState {
  return { rung: 0, ok: 0, ko: 0, passed: [], stopped: false, asked: 0 }
}

export function nextDiagExercise(d: DiagState, rng: Rng = Math.random): Exercise | null {
  if (d.stopped || d.rung >= LADDER.length) return null
  return generate(LADDER[d.rung], rng, KINDS[d.ok + d.ko])
}

export function diagAnswer(d: DiagState, correct: boolean): void {
  d.asked++
  if (correct) d.ok++
  else d.ko++
  if (d.ok >= 2) {
    d.passed.push(LADDER[d.rung])
    d.rung++
    d.ok = 0
    d.ko = 0
  } else if (d.ko >= 2) {
    d.stopped = true
  }
}

export function diagProgress(d: DiagState): number {
  return Math.min(1, (d.rung + (d.ok + d.ko) / 3) / LADDER.length)
}

/** Les livrets réussis sont considérés maîtrisés, avec une révision dès le lendemain pour vérifier. */
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
