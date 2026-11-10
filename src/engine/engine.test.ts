import { describe, it, expect } from 'vitest'
import { generate, checkTyped, typicalMistakes, classify, strategy, factKey, pickFact } from './exercises'
import { newLearner, recordAnswer, currentSkill, composeMission, DAY, rewardFor, isDue, hardestFacts } from './learner'
import { newDiag, nextDiagExercise, diagAnswer, applyDiagnostic } from './diagnostic'
import { SKILL_ORDER, SKILL_BY_ID } from './skills'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

describe('exercices', () => {
  it('génère des exercices justes pour tous les livrets, jusqu’à × 12', () => {
    const rng = seeded(7)
    const seen = new Set<number>()
    for (const id of SKILL_ORDER) for (let i = 0; i < 300; i++) {
      const ex = generate(id, rng)
      expect(SKILL_BY_ID[id].tables).toContain(ex.table)
      expect(ex.a * ex.b).toBe(ex.product)
      expect(Math.max(ex.a, ex.b)).toBeLessThanOrEqual(12)
      if (id === 'x7') seen.add(ex.a === 7 ? ex.b : ex.a)
      if (ex.kind === 'missing') expect(ex.table * (ex.answer as number)).toBe(ex.product)
      if (ex.kind === 'choice' || ex.kind === 'array') {
        expect(ex.choices!.filter((c) => c.correct)).toHaveLength(1)
        expect(ex.choices!.find((c) => c.correct)!.value).toBe(ex.product)
        expect(new Set(ex.choices!.map((c) => c.label)).size).toBe(ex.choices!.length)
        expect(ex.choices!.length).toBe(4)
      }
      if (ex.kind === 'trueFalse') {
        expect(ex.choices!.filter((c) => c.correct)).toHaveLength(1)
        expect(ex.answer).toBe(ex.claimed === ex.product)
      }
      if (ex.kind === 'array') expect(ex.product).toBeLessThanOrEqual(60)
    }
    for (let n = 1; n <= 12; n++) expect(seen.has(n)).toBe(true)
  })
  it('reconnaît les erreurs typiques', () => {
    expect(classify(7, 8, 49)).toBe('voisin')
    expect(classify(7, 8, 63)).toBe('voisin')
    expect(classify(7, 8, 15)).toBe('addition')
    expect(classify(7, 8, 65)).toBe('chiffres')
    expect(classify(7, 8, 57)).toBe('calcul')
    expect(typicalMistakes(6, 6).every((m) => m.value !== 36)).toBe(true)
    const ex = generate('x7', seeded(2), 'type')
    expect(checkTyped(ex, ex.product).correct).toBe(true)
    expect(checkTyped(ex, ex.product + 1).correct).toBe(false)
  })
  it('les astuces donnent le bon résultat', () => {
    for (let t = 1; t <= 12; t++) for (let n = 1; n <= 12; n++) expect(strategy(t, n)).toContain(String(t * n))
  })
  it('les calculs ratés reviennent plus souvent', () => {
    const rng = seeded(11)
    let hits = 0
    for (let i = 0; i < 2000; i++) if (pickFact('x8', rng, (_t, n) => (n === 7 ? 4 : 1)).n === 7) hits++
    expect(hits).toBeGreaterThan(400) // ~4/15 au lieu de ~1/12
  })
})

describe('moteur adaptatif', () => {
  it('maîtrise après une série réussie, puis révision programmée', () => {
    const L = newLearner()
    const now = 1_000_000_000_000
    let mastered = false
    for (let i = 0; i < 12 && !mastered; i++) mastered = recordAnswer(L, generate('x2', seeded(i)), { correct: true, hint: false, ms: 3000 }, now).newlyMastered
    expect(mastered).toBe(true)
    expect(isDue(L.skills.x2, now)).toBe(false)
    expect(isDue(L.skills.x2, now + 2 * DAY)).toBe(true)
  })
  it('le livret suggéré est le premier non maîtrisé', () => {
    const L = newLearner()
    L.skills.x1x10.mastered = true
    expect(currentSkill(L)).toBe('x2')
  })
  it('pas de maîtrise avec des erreurs fréquentes', () => {
    const L = newLearner()
    for (let i = 0; i < 20; i++) recordAnswer(L, generate('x3', seeded(i)), { correct: i % 2 === 0, hint: false, ms: 1000 })
    expect(L.skills.x3.mastered).toBe(false)
  })
  it('une révision ratée fait revenir le livret plus vite', () => {
    const L = newLearner()
    const now = 1_000_000_000_000
    Object.assign(L.skills.x5, { mastered: true, score: 0.9, box: 2, due: now - 1 })
    recordAnswer(L, generate('x5', seeded(1)), { correct: false, hint: false, ms: 1000 }, now)
    expect(L.skills.x5.box).toBe(1)
    expect(L.skills.x5.due).toBe(now + DAY)
  })
  it('suit chaque calcul et repère les plus difficiles', () => {
    const L = newLearner()
    const ex = generate('x7', seeded(3), 'type')
    recordAnswer(L, ex, { correct: false, hint: false, error: 'voisin', ms: 1000 })
    recordAnswer(L, ex, { correct: false, hint: false, ms: 1000 })
    expect(L.facts[factKey(ex.a, ex.b)].ko).toBe(2)
    expect(hardestFacts(L)[0].fact).toBe(factKey(ex.a, ex.b))
  })
  it('mission : révisions dues et livret choisi', () => {
    const L = newLearner()
    const now = 1_000_000_000_000
    Object.assign(L.skills.x1x10, { mastered: true, score: 0.9, due: now - 10 })
    const m = composeMission(L, 8, seeded(3), undefined, now)
    expect(m).toHaveLength(8)
    expect(m[0].skill).toBe('x1x10')
    const f = composeMission(L, 8, seeded(4), 'x9', now)
    expect(f.filter((e) => e.skill === 'x9').length).toBeGreaterThanOrEqual(6)
  })
  it('répéter un livret facile déjà maîtrisé rapporte moins', () => {
    const L = newLearner()
    Object.assign(L.skills.x1x10, { mastered: true, due: Date.now() + DAY })
    Object.assign(L.skills.x2, { mastered: true, due: Date.now() + DAY })
    expect(rewardFor(L, generate('x1x10', seeded(1)), true, true).coins).toBeLessThan(rewardFor(L, generate('x5', seeded(1)), true, true).coins)
  })
})

describe('diagnostic', () => {
  it('valide 2 bonnes réponses sur 3 et s’arrête au premier livret raté', () => {
    const d = newDiag()
    const L = newLearner()
    // ×1/10 : ok ok ; ×2 : ko ok ok ; ×5 : ko ko
    for (const ok of [true, true, false, true, true, false, false]) { expect(nextDiagExercise(d)).not.toBeNull(); diagAnswer(d, ok) }
    expect(nextDiagExercise(d)).toBeNull()
    expect(applyDiagnostic(L, d)).toBe('x5')
    expect(L.skills.x2.mastered).toBe(true)
    expect(L.diagnosticDone).toBe(true)
  })
})
