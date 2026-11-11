// Générateur d'exercices de livrets : variantes infinies, distracteurs tirés
// des vraies erreurs d'enfants, explications et astuces par livret.

import { SKILL_BY_ID, SkillId, MAX_FACTOR, skillForTable } from './skills'

export type Rng = () => number

export type ExerciseKind =
  | 'choice' // a × b = ? parmi 4 réponses
  | 'type' // a × b = ? je tape
  | 'missing' // a × ? = c, je tape
  | 'trueFalse' // a × b = c, vrai ou faux ?
  | 'array' // quadrillage de cubes : combien ?

/** Types d'erreurs suivis par le moteur adaptatif. */
export type ErrorType =
  | 'voisin' // résultat d'à côté dans le livret (7 × 8 → 49 ou 63)
  | 'addition' // a additionné au lieu de multiplier (7 × 8 → 15)
  | 'chiffres' // chiffres inversés (56 → 65)
  | 'calcul' // petite erreur de calcul
  | 'autre'

export interface Choice {
  label: string
  value: number | boolean
  correct: boolean
  error?: ErrorType
}

export interface Exercise {
  id: string
  skill: SkillId
  kind: ExerciseKind
  /** Le livret travaillé. */
  table: number
  /** Les deux facteurs, dans l'ordre d'affichage. */
  a: number
  b: number
  product: number
  /** Réponse attendue (produit, facteur manquant, ou vrai/faux). */
  answer: number | boolean
  /** Résultat proposé pour vrai/faux. */
  claimed?: number
  prompt: string
  choices?: Choice[]
}

const pick = <T,>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)]
const shuffle = <T,>(rng: Rng, arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
let seq = 0
const uid = () => `ex${Date.now().toString(36)}${(seq++).toString(36)}`

/** Clé d'un calcul, indépendante de l'ordre : « 7x8 ». */
export const factKey = (a: number, b: number) => (a <= b ? `${a}x${b}` : `${b}x${a}`)

/** Poids optionnel par calcul (les calculs ratés reviennent plus souvent). */
export type FactWeight = (table: number, n: number) => number

export function pickFact(skill: SkillId, rng: Rng, weight?: FactWeight): { table: number; n: number } {
  return pickFactFrom(SKILL_BY_ID[skill].tables, rng, weight, skill !== 'x1x10')
}

/** Tire un calcul parmi plusieurs livrets. `dampEasy` : fois 1 et fois 10 moins souvent. */
export function pickFactFrom(tables: number[], rng: Rng, weight?: FactWeight, dampEasy = true): { table: number; n: number } {
  const all: { table: number; n: number; w: number }[] = []
  const onlyEasy = tables.every((t) => t === 1 || t === 10)
  for (const t of tables) for (let n = 1; n <= MAX_FACTOR; n++) {
    let w = dampEasy && !onlyEasy && (n === 1 || n === 10) && t !== 1 && t !== 10 ? 0.35 : 1
    if (weight) w *= weight(t, n)
    all.push({ table: t, n, w })
  }
  let r = rng() * all.reduce((s, x) => s + x.w, 0)
  for (const x of all) { r -= x.w; if (r <= 0) return x }
  return all[all.length - 1]
}

/** Réponses fausses typiques pour a × b, avec leur type d'erreur. */
export function typicalMistakes(table: number, n: number): { value: number; error: ErrorType }[] {
  const p = table * n
  const out: { value: number; error: ErrorType }[] = []
  const add = (value: number, error: ErrorType) => {
    if (value > 0 && value !== p && !out.some((o) => o.value === value)) out.push({ value, error })
  }
  if (n < MAX_FACTOR) add(table * (n + 1), 'voisin')
  if (n > 1) add(table * (n - 1), 'voisin')
  if (table > 1) add((table - 1) * n, 'voisin')
  add((table + 1) * n, 'voisin')
  add(table + n, 'addition')
  if (p >= 10 && p < 100) {
    const rev = Number(String(p).split('').reverse().join(''))
    if (rev % 10 !== 0 || p % 10 !== 0) add(rev, 'chiffres')
  }
  add(p + 1, 'calcul'); add(p - 1, 'calcul'); add(p + 2, 'calcul'); add(p - 2, 'calcul'); add(p + 10, 'calcul'); add(p - 10, 'calcul')
  return out
}

/** Classe une réponse tapée. */
export function classify(table: number, n: number, value: number): ErrorType {
  const m = typicalMistakes(table, n).find((x) => x.value === value)
  return m ? m.error : 'autre'
}

function numberChoices(rng: Rng, table: number, n: number): Choice[] {
  const p = table * n
  const mistakes = typicalMistakes(table, n)
  const byType = (e: ErrorType) => mistakes.filter((m) => m.error === e)
  // Un « voisin », puis un mélange des autres erreurs crédibles.
  const pool = [...shuffle(rng, byType('voisin')).slice(0, 2), ...shuffle(rng, [...byType('addition'), ...byType('chiffres'), ...byType('calcul')])]
  const chosen: typeof mistakes = []
  for (const m of pool) if (chosen.length < 3 && !chosen.some((c) => c.value === m.value)) chosen.push(m)
  return shuffle(rng, [
    { label: String(p), value: p, correct: true },
    ...chosen.map((m) => ({ label: String(m.value), value: m.value, correct: false, error: m.error })),
  ])
}

const KINDS: Record<SkillId, ExerciseKind[]> = {
  x1x10: ['choice', 'choice', 'type', 'trueFalse'],
  x2: ['choice', 'array', 'type', 'type', 'missing'],
  x5: ['choice', 'array', 'type', 'type', 'missing'],
  x3: ['choice', 'array', 'type', 'type', 'missing', 'trueFalse'],
  x4: ['choice', 'array', 'type', 'type', 'missing', 'trueFalse'],
  x9: ['choice', 'type', 'type', 'missing', 'trueFalse'],
  x6: ['choice', 'array', 'type', 'type', 'missing', 'trueFalse'],
  x11: ['choice', 'type', 'type', 'missing'],
  x7: ['choice', 'array', 'type', 'type', 'missing', 'trueFalse'],
  x8: ['choice', 'array', 'type', 'type', 'missing', 'trueFalse'],
  x12: ['choice', 'type', 'type', 'missing', 'trueFalse'],
  defi: ['type', 'type', 'missing', 'choice', 'trueFalse'],
}

/** Fabrique un exercice pour un chapitre. `kind` peut être imposé, `weight` oriente vers les calculs fragiles. */
export function generate(skill: SkillId, rng: Rng = Math.random, kind?: ExerciseKind, weight?: FactWeight): Exercise {
  const { table, n } = pickFact(skill, rng, weight)
  return build(skillForTable(table), table, n, kind ?? pick(rng, KINDS[skill]), rng)
}

/** Exercice tiré parmi plusieurs livrets choisis. `level` donne le niveau d'un calcul pour adapter le type d'exercice. */
export function generateFor(tables: number[], rng: Rng = Math.random, kind?: ExerciseKind, weight?: FactWeight, level?: (t: number, n: number) => 'new' | 'weak' | 'ok' | 'strong'): Exercise {
  const { table, n } = pickFactFrom(tables.length ? tables : [2, 3, 4, 5, 6, 7, 8, 9], rng, weight)
  return generateFact(table, n, rng, kind, level?.(table, n))
}

/** Exercice sur un calcul précis (révision des erreurs). */
export function generateFact(table: number, n: number, rng: Rng = Math.random, kind?: ExerciseKind, lvl?: 'new' | 'weak' | 'ok' | 'strong'): Exercise {
  const k = kind ?? (lvl === 'new' || lvl === 'weak' ? pick(rng, ['choice', 'choice', 'type', 'array'] as ExerciseKind[]) : lvl === 'strong' ? pick(rng, ['type', 'type', 'missing', 'trueFalse'] as ExerciseKind[]) : pick(rng, ['choice', 'type', 'type', 'missing', 'trueFalse'] as ExerciseKind[]))
  return build(skillForTable(table), table, n, k, rng)
}

function build(skill: SkillId, table: number, n: number, kind: ExerciseKind, rng: Rng): Exercise {
  let k = kind
  // Quadrillage : on garde des tailles qu'on peut regarder (pas 12 × 12 cubes).
  if (k === 'array' && table * n > 60) k = 'choice'
  const swap = rng() < 0.5
  const a = swap ? n : table
  const b = swap ? table : n
  const p = table * n
  const base = { id: uid(), skill, table, a, b, product: p }

  switch (k) {
    case 'choice':
      return { ...base, kind: k, answer: p, prompt: `${a} × ${b} = ?`, choices: numberChoices(rng, table, n) }
    case 'array':
      return { ...base, kind: k, answer: p, prompt: `${a} rangées de ${b} cubes. Combien en tout ?`, choices: numberChoices(rng, table, n) }
    case 'type':
      return { ...base, kind: k, answer: p, prompt: `${a} × ${b} = ?` }
    case 'missing': {
      // On cache l'autre facteur que le livret : 7 × ? = 56 pour le livret 7.
      return { ...base, kind: k, a: table, b: n, answer: n, prompt: `${table} × ? = ${p}` }
    }
    case 'trueFalse': {
      const isTrue = rng() < 0.45
      const wrong = typicalMistakes(table, n)
      const m = isTrue || !wrong.length ? null : pick(rng, wrong.filter((w) => w.error !== 'addition').length ? wrong.filter((w) => w.error !== 'addition') : wrong)
      const claimed = m ? m.value : p
      return {
        ...base, kind: k, answer: isTrue || !m, claimed,
        prompt: `${a} × ${b} = ${claimed}`,
        choices: [
          { label: 'Vrai', value: true, correct: isTrue || !m, error: m ? m.error : undefined },
          { label: 'Faux', value: false, correct: !(isTrue || !m), error: m ? undefined : 'autre' },
        ],
      }
    }
  }
}

/** Vérifie une réponse tapée (produit ou facteur manquant). */
export function checkTyped(ex: Exercise, value: number): { correct: boolean; error?: ErrorType } {
  if (value === ex.answer) return { correct: true }
  if (ex.kind === 'missing') {
    // 7 × ? = 56 : répondre 49 ou 63 trahit une confusion avec le produit.
    return { correct: false, error: Math.abs(value - (ex.answer as number)) <= 1 ? 'voisin' : 'calcul' }
  }
  return { correct: false, error: classify(ex.table, ex.b === ex.table ? ex.a : ex.b, value) }
}

/** Astuce propre au livret. */
export function strategy(table: number, n: number): string {
  const p = table * n
  switch (table) {
    case 1: return `Fois 1, le nombre ne change pas : ${n} × 1 = ${n}.`
    case 10: return `Fois 10, on ajoute un zéro : ${n} × 10 = ${p}.`
    case 2: return `Fois 2, c’est le double : ${n} + ${n} = ${p}.`
    case 3: return `Le double, plus encore une fois : ${n * 2} + ${n} = ${p}.`
    case 4: return `Le double du double : ${n * 2}, puis ${p}.`
    case 5: return `La moitié de fois 10 : ${n * 10}, la moitié fait ${p}.`
    case 6: return `Fois 5, plus encore une fois : ${n * 5} + ${n} = ${p}.`
    case 7: return `Fois 5, plus fois 2 : ${n * 5} + ${n * 2} = ${p}.`
    case 8: return `Le double, trois fois de suite : ${n * 2}, ${n * 4}, ${p}.`
    case 9: return `Fois 10, moins une fois : ${n * 10} − ${n} = ${p}.`
    case 11: return n <= 9 ? `On répète le chiffre : ${n} × 11 = ${p}.` : `Fois 10, plus une fois : ${n * 10} + ${n} = ${p}.`
    case 12: return `Fois 10, plus fois 2 : ${n * 10} + ${n * 2} = ${p}.`
    default: return `${table} × ${n} = ${p}.`
  }
}

const otherFactor = (ex: Exercise) => (ex.a === ex.table ? ex.b : ex.a)

/** Indice avant de répondre (sans donner le résultat). */
export function hint(ex: Exercise): string {
  const n = otherFactor(ex)
  const t = ex.table
  if (ex.kind === 'missing') return `Récite le livret de ${t} : ${t}, ${t * 2}, ${t * 3}… et compte combien de fois tu avances jusqu’à ${ex.product}.`
  if (ex.kind === 'array') return `Compte les rangées de ${ex.b} : ${ex.b}, ${ex.b * 2}, ${ex.b * 3}…`
  switch (t) {
    case 2: return 'Fois 2, c’est le double.'
    case 3: return `Fais le double de ${n}, puis ajoute encore ${n}.`
    case 4: return `Fais le double de ${n}, puis encore le double.`
    case 5: return `Calcule ${n} × 10, puis prends la moitié.`
    case 6: return `Calcule ${n} × 5, puis ajoute ${n}.`
    case 7: return `Calcule ${n} × 5 et ${n} × 2, puis additionne.`
    case 8: return `Double ${n} trois fois de suite.`
    case 9: return `Calcule ${n} × 10, puis enlève ${n}.`
    case 11: return n <= 9 ? 'Jusqu’à 9 × 11, on répète le chiffre.' : `Calcule ${n} × 10, puis ajoute ${n}.`
    case 12: return `Calcule ${n} × 10 et ${n} × 2, puis additionne.`
    case 10: return 'Fois 10, on ajoute un zéro.'
    default: return 'Fois 1, le nombre ne change pas.'
  }
}

/**
 * Explication bienveillante d'une erreur.
 * reveal = false : on explique sans donner la réponse, pour un nouvel essai.
 */
export function explain(error: ErrorType | undefined, ex: Exercise, reveal = true): string {
  const t = ex.table
  const n = otherFactor(ex)
  const p = ex.product
  if (ex.kind === 'missing') {
    return reveal ? `${t} × ${n} = ${p}, donc le nombre caché est ${n}.` : `Récite le livret de ${t} jusqu’à ${p}, en comptant sur tes doigts.`
  }
  if (ex.kind === 'trueFalse' && reveal) {
    return ex.answer ? `C’était vrai : ${ex.a} × ${ex.b} = ${p}.` : `C’était faux : ${ex.a} × ${ex.b} = ${p}, pas ${ex.claimed}.`
  }
  if (!reveal) {
    switch (error) {
      case 'voisin': return 'Tu es tout près : c’est le résultat juste à côté dans le livret.'
      case 'addition': return 'Attention, c’est une multiplication, pas une addition !'
      case 'chiffres': return 'Les bons chiffres, mais dans le mauvais ordre.'
      default: return hint(ex)
    }
  }
  switch (error) {
    case 'voisin': return `Presque ! ${strategy(t, n)}`
    case 'addition': return `C’est une multiplication : ${n} fois ${t}. ${strategy(t, n)}`
    case 'chiffres': return `Les chiffres étaient inversés : la réponse est ${p}.`
    default: return strategy(t, n)
  }
}
