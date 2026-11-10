// Moteur adaptatif : maîtrise par livret, suivi de chaque calcul, répétition espacée, remédiation ciblée.

import { SKILL_ORDER, SkillId } from './skills'
import { ErrorType, Exercise, ExerciseKind, generate, Rng, factKey, FactWeight } from './exercises'

export const DAY = 24 * 3600 * 1000
/** Intervalles de révision indicatifs (jours), ajustés selon la réussite. */
export const INTERVALS = [1, 3, 7, 14, 30]

export interface SkillState {
  /** Moyenne mobile de réussite, 0 à 1. */
  score: number
  attempts: number
  correct: number
  streak: number
  hints: number
  mastered: boolean
  masteredAt?: number
  /** Niveau de révision (index dans INTERVALS). */
  box: number
  /** Prochaine révision (horodatage) si maîtrisé. */
  due?: number
  lastSeen?: number
  reviews: { ok: number; ko: number }
  /** Mini-leçon déjà vue. */
  introSeen: boolean
}

export interface FactState { ok: number; ko: number; last: number }

export interface AnswerLog {
  at: number
  skill: SkillId
  kind: ExerciseKind
  fact: string
  correct: boolean
  hint: boolean
  error?: ErrorType
  review: boolean
  ms: number
}

export interface LearnerState {
  subject: 'livrets'
  skills: Record<SkillId, SkillState>
  facts: Record<string, FactState>
  errors: Partial<Record<ErrorType, number>>
  log: AnswerLog[]
  diagnosticDone: boolean
}

export function newSkillState(): SkillState {
  return { score: 0, attempts: 0, correct: 0, streak: 0, hints: 0, mastered: false, box: 0, reviews: { ok: 0, ko: 0 }, introSeen: false }
}

export function newLearner(): LearnerState {
  return {
    subject: 'livrets',
    skills: Object.fromEntries(SKILL_ORDER.map((id) => [id, newSkillState()])) as Record<SkillId, SkillState>,
    facts: {},
    errors: {},
    log: [],
    diagnosticDone: false,
  }
}

/** Maîtrise : assez d'essais, bonne moyenne, une série en cours sans indice. */
export function meetsMastery(s: SkillState): boolean {
  return s.attempts >= 8 && s.score >= 0.8 && s.streak >= 4
}

export function scheduleNext(s: SkillState, now: number): number {
  const days = INTERVALS[Math.min(s.box, INTERVALS.length - 1)] * (0.75 + 0.5 * s.score)
  return now + Math.round(days * DAY)
}

export function isDue(s: SkillState, now: number): boolean {
  return s.mastered && s.due !== undefined && s.due <= now
}

export interface AnswerResult {
  newlyMastered: boolean
  reviewPassed?: boolean
  lostMastery?: boolean
}

/** Enregistre une réponse au premier essai et met à jour maîtrise, calculs et révisions. */
export function recordAnswer(
  L: LearnerState,
  ex: Exercise,
  a: { correct: boolean; hint: boolean; error?: ErrorType; ms: number },
  now = Date.now(),
): AnswerResult {
  const s = L.skills[ex.skill]
  const review = isDue(s, now)
  s.attempts++
  s.lastSeen = now
  if (a.hint) s.hints++
  const w = a.correct ? (a.hint ? 0.6 : 1) : 0
  s.score = s.attempts === 1 && !s.mastered ? w * 0.5 : s.score * 0.75 + w * 0.25
  if (a.correct) { s.correct++; s.streak = a.hint ? s.streak : s.streak + 1 } else s.streak = 0
  if (a.error) L.errors[a.error] = (L.errors[a.error] ?? 0) + 1

  const key = factKey(ex.a, ex.b)
  const f = (L.facts[key] ??= { ok: 0, ko: 0, last: now })
  if (a.correct && !a.hint) f.ok++
  else f.ko++
  f.last = now

  L.log.push({ at: now, skill: ex.skill, kind: ex.kind, fact: key, correct: a.correct, hint: a.hint, error: a.error, review, ms: a.ms })
  if (L.log.length > 3000) L.log.splice(0, L.log.length - 3000)

  const res: AnswerResult = { newlyMastered: false }
  if (review) {
    if (a.correct && !a.hint) {
      s.reviews.ok++
      s.box = Math.min(s.box + 1, INTERVALS.length - 1)
      s.due = scheduleNext(s, now)
      res.reviewPassed = true
    } else {
      s.reviews.ko++
      s.box = Math.max(s.box - 1, 0)
      s.due = now + DAY // la notion revient vite
      s.score = Math.max(0, s.score - 0.12)
      res.reviewPassed = false
      if (s.score < 0.4) { s.mastered = false; s.due = undefined; res.lostMastery = true }
    }
  } else if (!s.mastered && meetsMastery(s)) {
    s.mastered = true
    s.masteredAt = now
    s.box = 0
    s.due = scheduleNext(s, now)
    res.newlyMastered = true
  } else if (s.mastered && !a.correct) {
    s.score = Math.max(0, s.score - 0.05)
  }
  return res
}

/**
 * Défi éclair : on retient les calculs réussis ou ratés (ils reviendront plus souvent),
 * mais la vitesse ne compte jamais pour la maîtrise d'un livret.
 */
export function recordSpeedAnswer(L: LearnerState, ex: Exercise, correct: boolean, error: ErrorType | undefined, ms: number, now = Date.now()): void {
  const key = factKey(ex.a, ex.b)
  const f = (L.facts[key] ??= { ok: 0, ko: 0, last: now })
  if (correct) f.ok++
  else f.ko++
  f.last = now
  if (error) L.errors[error] = (L.errors[error] ?? 0) + 1
  L.log.push({ at: now, skill: ex.skill, kind: ex.kind, fact: key, correct, hint: false, error, review: false, ms })
  if (L.log.length > 3000) L.log.splice(0, L.log.length - 3000)
}

/** Chapitre suggéré : le premier livret non maîtrisé. */
export function currentSkill(L: LearnerState): SkillId {
  return SKILL_ORDER.find((id) => !L.skills[id].mastered) ?? 'defi'
}

/** Tous les livrets restent ouverts : l'enfant peut choisir celui qu'elle veut travailler. */
export function isUnlocked(_L: LearnerState, _id: SkillId): boolean {
  return true
}

export function dueSkills(L: LearnerState, now = Date.now()): SkillId[] {
  return SKILL_ORDER.filter((id) => isDue(L.skills[id], now))
}

/** Confusion addition / multiplication récente → quadrillage de cubes pour revoir le sens. */
export function needsMeaningRemediation(L: LearnerState): boolean {
  return L.log.slice(-12).filter((l) => l.error === 'addition').length >= 2
}

/** Les calculs ratés reviennent plus souvent. */
export function factWeights(L: LearnerState): FactWeight {
  return (t, n) => {
    const f = L.facts[factKey(t, n)]
    if (!f) return 1.2 // jamais vu : un peu plus souvent
    return 1 + Math.min(3, f.ko * 1.5) / (1 + f.ok * 0.5)
  }
}

/** Calculs les plus difficiles (pour les parents et les révisions). */
export function hardestFacts(L: LearnerState, max = 6): { fact: string; ok: number; ko: number }[] {
  return Object.entries(L.facts)
    .filter(([, f]) => f.ko > 0)
    .map(([fact, f]) => ({ fact, ...f }))
    .sort((a, b) => b.ko - b.ok * 0.5 - (a.ko - a.ok * 0.5))
    .slice(0, max)
}

/**
 * Compose une mission : révisions dues d'abord (max 2), remédiation si besoin,
 * puis le livret choisi (ou suggéré), avec parfois un rappel d'un livret maîtrisé.
 */
export function composeMission(L: LearnerState, count = 8, rng: Rng = Math.random, focus?: SkillId, now = Date.now()): Exercise[] {
  const list: Exercise[] = []
  const cur = focus ?? currentSkill(L)
  const w = factWeights(L)
  if (!focus) {
    for (const id of dueSkills(L, now).slice(0, 2)) list.push(generate(id, rng, undefined, w))
  }
  if (needsMeaningRemediation(L)) list.push(generate(cur === 'x1x10' ? 'x2' : cur === 'defi' ? 'x3' : cur, rng, 'array', w))
  const mastered = SKILL_ORDER.filter((id) => L.skills[id].mastered && id !== cur)
  while (list.length < count) {
    if (mastered.length && rng() < 0.15) list.push(generate(mastered[Math.floor(rng() * mastered.length)], rng, undefined, w))
    else list.push(generate(cur, rng, undefined, w))
  }
  return list
}

/** Récompenses liées à la progression, pas à la répétition du plus facile. */
export function rewardFor(L: LearnerState, ex: Exercise, firstTry: boolean, correctEventually: boolean, now = Date.now()) {
  const s = L.skills[ex.skill]
  if (!correctEventually) return { coins: 2, cubes: 0 } // l'effort compte un peu
  const farming = s.mastered && !isDue(s, now) && SKILL_ORDER.indexOf(ex.skill) < SKILL_ORDER.indexOf(currentSkill(L))
  const mult = farming ? 0.3 : 1
  const coins = Math.round((firstTry ? 8 : 5) * mult)
  const cubes = firstTry && !farming ? 1 : 0
  return { coins, cubes }
}

/** Statistiques pour le tableau de bord parent. */
export function stats(L: LearnerState, days: number, now = Date.now()) {
  const from = now - days * DAY
  const logs = L.log.filter((l) => l.at >= from)
  const correct = logs.filter((l) => l.correct).length
  const ms = logs.reduce((a, l) => a + Math.min(l.ms, 120000), 0)
  const errs = new Map<ErrorType, number>()
  for (const l of logs) if (l.error) errs.set(l.error, (errs.get(l.error) ?? 0) + 1)
  const reviews = logs.filter((l) => l.review)
  return {
    answers: logs.length,
    accuracy: logs.length ? correct / logs.length : 0,
    minutes: Math.round(ms / 60000),
    errors: [...errs.entries()].sort((a, b) => b[1] - a[1]),
    reviewAccuracy: reviews.length ? reviews.filter((r) => r.correct).length / reviews.length : undefined,
    reviews: reviews.length,
  }
}
