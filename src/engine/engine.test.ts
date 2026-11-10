import { describe, it, expect } from 'vitest'
import { handAngles, spoken, digital, dragMinuteHand, dragHourHand, fromTotal, toTotal, pointAngle } from './clock'
import { generate, checkSetClock, typicalMistakes } from './exercises'
import { newLearner, recordAnswer, currentSkill, composeMission, DAY, rewardFor, isDue } from './learner'
import { newDiag, nextDiagExercise, diagAnswer, applyDiagnostic } from './diagnostic'
import { SKILL_ORDER } from './skills'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

describe('horloge', () => {
  it('angles exacts', () => {
    expect(handAngles({ h: 12, m: 0 })).toEqual({ hour: 0, minute: 0 })
    expect(handAngles({ h: 3, m: 0 })).toEqual({ hour: 90, minute: 0 })
    expect(handAngles({ h: 6, m: 30 })).toEqual({ hour: 195, minute: 180 })
    // 8 h 45 : petite aiguille entre 8 et 9, proche du 9 (8 = 240°, 9 = 270°)
    const a = handAngles({ h: 8, m: 45 })
    expect(a.hour).toBe(262.5)
    expect(a.minute).toBe(270)
  })
  it('chaque minute fait avancer la petite aiguille de 0,5°', () => {
    for (let t = 0; t < 720; t++) {
      const time = fromTotal(t)
      expect(handAngles(time).hour).toBeCloseTo((t * 0.5) % 360)
      expect(handAngles(time).minute).toBeCloseTo((time.m * 6) % 360)
      expect(toTotal(time)).toBe(t)
    }
  })
  it('angle d’un point', () => {
    expect(pointAngle(0, 0, 0, -10)).toBeCloseTo(0)
    expect(pointAngle(0, 0, 10, 0)).toBeCloseTo(90)
    expect(pointAngle(0, 0, 0, 10)).toBeCloseTo(180)
    expect(pointAngle(0, 0, -10, 0)).toBeCloseTo(270)
  })
  it('expressions françaises', () => {
    expect(spoken({ h: 8, m: 45 })).toBe('9 heures moins le quart')
    expect(spoken({ h: 12, m: 45 })).toBe('1 heure moins le quart')
    expect(spoken({ h: 3, m: 15 })).toBe('3 heures et quart')
    expect(spoken({ h: 1, m: 30 })).toBe('1 heure et demie')
    expect(spoken({ h: 4, m: 40 })).toBe('5 heures moins 20')
    expect(spoken({ h: 7, m: 10 })).toBe('7 heures 10')
    expect(digital({ h: 7, m: 5 })).toBe('7 h 05')
  })
  it('tirer la grande aiguille fait suivre la petite (passage du 12)', () => {
    expect(dragMinuteHand({ h: 8, m: 55 }, 6)).toEqual({ h: 9, m: 1 })
    expect(dragMinuteHand({ h: 9, m: 2 }, 354)).toEqual({ h: 8, m: 59 })
    expect(dragMinuteHand({ h: 12, m: 58 }, 12)).toEqual({ h: 1, m: 2 })
    expect(dragMinuteHand({ h: 3, m: 10 }, 90, 5)).toEqual({ h: 3, m: 15 })
  })
  it('tirer la petite aiguille règle heure et minutes', () => {
    expect(dragHourHand({ h: 12, m: 0 }, 262.5)).toEqual({ h: 8, m: 45 })
    expect(dragHourHand({ h: 12, m: 0 }, 95, 5)).toEqual({ h: 3, m: 10 })
  })
})

describe('exercices', () => {
  it('génère des exercices valides pour tous les chapitres', () => {
    const rng = seeded(7)
    for (const id of SKILL_ORDER) for (let i = 0; i < 200; i++) {
      const ex = generate(id, rng)
      expect(ex.target.h).toBeGreaterThanOrEqual(1)
      expect(ex.target.h).toBeLessThanOrEqual(12)
      expect(ex.target.m).toBeGreaterThanOrEqual(0)
      expect(ex.target.m).toBeLessThan(60)
      if (ex.choices) {
        expect(ex.choices.filter((c) => c.correct).length).toBe(1)
        expect(new Set(ex.choices.map((c) => c.label)).size).toBe(ex.choices.length)
        expect(ex.choices.length).toBeGreaterThanOrEqual(2)
      }
      if (ex.kind === 'setClock' || ex.kind === 'fixClock') expect(toTotal(ex.start!)).not.toBe(toTotal(ex.target))
    }
  })
  it('détecte les erreurs typiques', () => {
    expect(checkSetClock({ h: 8, m: 45 }, { h: 8, m: 45 }).correct).toBe(true)
    expect(checkSetClock({ h: 8, m: 45 }, { h: 9, m: 45 }).error).toBe('heureSuivante')
    expect(checkSetClock({ h: 3, m: 45 }, { h: 9, m: 15 }).error).toBe('aiguilles')
    expect(checkSetClock({ h: 4, m: 45 }, { h: 4, m: 9 }).error).toBe('minutesNombre')
    expect(typicalMistakes({ h: 8, m: 45 }).map((x) => x.error)).toContain('heureSuivante')
  })
})

describe('moteur adaptatif', () => {
  it('maîtrise après une série réussie, puis révision programmée', () => {
    const L = newLearner()
    const now = 1_000_000_000_000
    let mastered = false
    for (let i = 0; i < 10 && !mastered; i++) {
      const ex = generate('aiguilles', seeded(i))
      mastered = recordAnswer(L, ex, { correct: true, hint: false, ms: 3000 }, now).newlyMastered
    }
    expect(mastered).toBe(true)
    expect(currentSkill(L)).toBe('heures')
    const s = L.skills.aiguilles
    expect(isDue(s, now)).toBe(false)
    expect(isDue(s, now + 2 * DAY)).toBe(true)
  })
  it('pas de maîtrise avec des erreurs fréquentes', () => {
    const L = newLearner()
    for (let i = 0; i < 20; i++) recordAnswer(L, generate('heures', seeded(i)), { correct: i % 2 === 0, hint: false, ms: 1000 })
    expect(L.skills.heures.mastered).toBe(false)
  })
  it('une révision ratée fait revenir la notion plus vite', () => {
    const L = newLearner()
    const now = 1_000_000_000_000
    const s = L.skills.heures
    Object.assign(s, { mastered: true, score: 0.9, box: 2, due: now - 1 })
    recordAnswer(L, generate('heures', seeded(1)), { correct: false, hint: false, ms: 1000 }, now)
    expect(s.box).toBe(1)
    expect(s.due).toBe(now + DAY)
  })
  it('mission : révisions dues incluses et remédiation des aiguilles', () => {
    const L = newLearner()
    const now = 1_000_000_000_000
    Object.assign(L.skills.aiguilles, { mastered: true, score: 0.9, due: now - 10 })
    Object.assign(L.skills.heures, { mastered: true, score: 0.9, due: now + DAY })
    L.log.push({ at: now, skill: 'demi', kind: 'setClock', correct: false, firstTry: true, hint: false, error: 'aiguilles', review: false, ms: 1 })
    L.log.push({ at: now, skill: 'demi', kind: 'setClock', correct: false, firstTry: true, hint: false, error: 'aiguilles', review: false, ms: 1 })
    const m = composeMission(L, 6, seeded(3), undefined, now)
    expect(m).toHaveLength(6)
    expect(m[0].skill).toBe('aiguilles')
    expect(m.some((e) => e.kind === 'tapHand')).toBe(true)
    expect(m.filter((e) => e.skill === 'minutes').length).toBeGreaterThanOrEqual(2)
  })
  it('répéter un chapitre facile rapporte moins', () => {
    const L = newLearner()
    Object.assign(L.skills.aiguilles, { mastered: true, due: Date.now() + DAY })
    Object.assign(L.skills.heures, { mastered: true, due: Date.now() + DAY })
    const easy = rewardFor(L, generate('aiguilles', seeded(1)), true, true)
    const hard = rewardFor(L, generate('minutes', seeded(1)), true, true)
    expect(easy.coins).toBeLessThan(hard.coins)
  })
})

describe('diagnostic', () => {
  it('place l’enfant au premier chapitre raté', () => {
    const d = newDiag()
    const L = newLearner()
    // réussit aiguilles + heures, échoue aux minutes
    for (const ok of [true, true, true, true, false]) { expect(nextDiagExercise(d)).not.toBeNull(); diagAnswer(d, ok) }
    expect(nextDiagExercise(d)).toBeNull()
    expect(applyDiagnostic(L, d)).toBe('minutes')
    expect(L.skills.heures.mastered).toBe(true)
    expect(L.diagnosticDone).toBe(true)
  })
})
