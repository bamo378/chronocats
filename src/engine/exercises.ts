// Générateur d'exercices : des variantes infinies pour chaque chapitre,
// avec des distracteurs qui correspondent à de vraies erreurs d'enfants.

import { Time, digital, spoken, fromTotal, toTotal, handAngles, angleDiff, digital24 } from './clock'
import { SkillId } from './skills'

export type Rng = () => number

export type ExerciseKind =
  | 'tapHand' // toucher la bonne aiguille
  | 'handRole' // à quoi sert cette aiguille ?
  | 'minutesChoice' // combien de minutes ?
  | 'readChoice' // lire l'horloge, choisir l'heure
  | 'matchSpoken' // lire l'horloge, choisir l'expression orale
  | 'pickClock' // choisir la bonne horloge
  | 'setClock' // régler l'horloge
  | 'fixClock' // corriger une horloge fausse

/** Types d'erreurs suivis par le moteur adaptatif. */
export type ErrorType =
  | 'aiguilles' // confond petite et grande aiguille
  | 'heureSuivante' // lit l'heure suivante trop tôt (8 h 45 lue 9 h 45)
  | 'heurePrecedente' // lit l'heure d'avant
  | 'minutesNombre' // lit le nombre comme des minutes (sur le 9 → 9 min)
  | 'minutes' // minutes fausses
  | 'heure' // heure fausse
  | 'expression' // confusion et quart / moins le quart…

export interface Choice {
  label: string
  /** Heure représentée (pour pickClock et lecture). */
  time?: Time
  correct: boolean
  error?: ErrorType
}

export interface Exercise {
  id: string
  skill: SkillId
  kind: ExerciseKind
  prompt: string
  /** Petite phrase de contexte (missions, vie quotidienne). */
  context?: string
  target: Time
  choices?: Choice[]
  /** Horloge de départ (setClock / fixClock). */
  start?: Time
  /** Aiguille à toucher (tapHand). */
  hand?: 'hour' | 'minute'
  /** Pas de réglage des minutes. */
  snap: 1 | 5
  /** Les nombres de 1 à 60 sont-ils écrits autour du cadran (aide) ? */
  showMinuteLabels: boolean
}

const pick = <T,>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)]
const int = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1))
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

/** Une heure typique du chapitre. */
export function timeForSkill(skill: SkillId, rng: Rng): Time {
  const h = int(rng, 1, 12)
  switch (skill) {
    case 'aiguilles':
    case 'heures':
      return { h, m: 0 }
    case 'minutes':
    case 'cinq':
    case 'regler':
      return { h, m: int(rng, 0, 11) * 5 }
    case 'demi':
      return { h, m: rng() < 0.75 ? 30 : 0 }
    case 'quart':
      return { h, m: rng() < 0.7 ? 15 : pick(rng, [0, 30]) }
    case 'moinsquart':
      return { h, m: rng() < 0.7 ? 45 : pick(rng, [15, 30]) }
    case 'toutes': {
      let m = int(rng, 1, 58)
      if (m % 5 === 0) m += 1 + int(rng, 0, 3)
      return { h, m: m % 60 }
    }
    case 'moins':
      return { h, m: rng() < 0.85 ? int(rng, 7, 11) * 5 : int(rng, 36, 58) }
    case 'quotidien':
      return { h, m: int(rng, 0, 11) * 5 }
    case 'defi':
      return { h, m: rng() < 0.5 ? int(rng, 0, 11) * 5 : int(rng, 0, 59) }
  }
}

/** Erreurs classiques pour une heure donnée → distracteurs crédibles. */
export function typicalMistakes(t: Time): { time: Time; error: ErrorType }[] {
  const out: { time: Time; error: ErrorType }[] = []
  const nextH = (t.h % 12) + 1
  const prevH = t.h === 1 ? 12 : t.h - 1
  // Aiguilles inversées : on lit la grande comme l'heure, la petite comme les minutes.
  const swappedH = t.m === 0 ? 12 : Math.max(1, Math.round(t.m / 5))
  const swappedM = (t.h % 12) * 5
  if (!(swappedH === t.h && swappedM === t.m)) out.push({ time: { h: swappedH, m: swappedM }, error: 'aiguilles' })
  // Heure suivante (très fréquent après la demie).
  if (t.m >= 30) out.push({ time: { h: nextH, m: t.m }, error: 'heureSuivante' })
  else if (t.m > 0) out.push({ time: { h: prevH, m: t.m }, error: 'heurePrecedente' })
  // Nombre lu comme minutes : grande aiguille sur le 9 → « 9 minutes ».
  if (t.m % 5 === 0 && t.m > 0 && t.m / 5 !== t.m) out.push({ time: { h: t.h, m: t.m / 5 }, error: 'minutesNombre' })
  // Confusion d'expression : et quart ↔ moins le quart.
  if (t.m === 15) out.push({ time: { h: t.h, m: 45 }, error: 'expression' })
  if (t.m === 45) out.push({ time: { h: t.h, m: 15 }, error: 'expression' })
  return out
}

function uniqueByTime(list: { time: Time; error?: ErrorType }[], target: Time) {
  const seen = new Set([toTotal(target)])
  return list.filter((x) => {
    const k = toTotal(x.time)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function timeChoices(t: Time, rng: Rng, count: number, fmt: (t: Time) => string): Choice[] {
  const mistakes = uniqueByTime(typicalMistakes(t), t)
  const fill: { time: Time; error?: ErrorType }[] = []
  // Compléter avec des heures proches.
  const deltas = shuffle(rng, [-60, 60, -5, 5, -15, 15, 30, -30, 120])
  for (const d of deltas) fill.push({ time: fromTotal(toTotal(t) + d), error: Math.abs(d) >= 60 ? 'heure' : 'minutes' })
  const distractors = uniqueByTime([...shuffle(rng, mistakes), ...fill], t).slice(0, count - 1)
  return shuffle(rng, [
    { label: fmt(t), time: t, correct: true },
    ...distractors.map((d) => ({ label: fmt(d.time), time: d.time, correct: false, error: d.error })),
  ])
}

const DAILY: { text: (t: string) => string; pm: boolean }[] = [
  { text: (t) => `Le goûter des chats est servi à ${t}.`, pm: true },
  { text: (t) => `Le train du port part à ${t}.`, pm: true },
  { text: (t) => `Le marché ouvre à ${t}.`, pm: false },
  { text: (t) => `Le cours de danse commence à ${t}.`, pm: true },
  { text: (t) => `Le bateau des étoiles arrive à ${t}.`, pm: true },
  { text: (t) => `Le petit-déjeuner est à ${t}.`, pm: false },
]

/** Fabrique un exercice pour un chapitre. `kind` peut être imposé. */
export function generate(skill: SkillId, rng: Rng = Math.random, kind?: ExerciseKind): Exercise {
  const t = timeForSkill(skill, rng)
  const early = skill === 'aiguilles' || skill === 'heures' || skill === 'minutes'
  const snap: 1 | 5 = skill === 'toutes' || skill === 'defi' || (skill === 'moins' && t.m % 5 !== 0) ? 1 : 5
  const base = { id: uid(), skill, target: t, snap, showMinuteLabels: early }

  const kinds: Record<SkillId, ExerciseKind[]> = {
    aiguilles: ['tapHand', 'tapHand', 'handRole'],
    heures: ['readChoice', 'setClock', 'pickClock'],
    minutes: ['minutesChoice', 'minutesChoice', 'setClock'],
    demi: ['readChoice', 'matchSpoken', 'setClock', 'pickClock'],
    quart: ['readChoice', 'matchSpoken', 'setClock', 'pickClock'],
    moinsquart: ['matchSpoken', 'readChoice', 'setClock', 'pickClock', 'fixClock'],
    cinq: ['readChoice', 'setClock', 'pickClock', 'fixClock'],
    toutes: ['readChoice', 'setClock', 'pickClock'],
    moins: ['matchSpoken', 'readChoice', 'setClock'],
    regler: ['setClock', 'fixClock', 'setClock'],
    quotidien: ['setClock', 'pickClock', 'readChoice'],
    defi: ['readChoice', 'matchSpoken', 'setClock', 'pickClock', 'fixClock'],
  }
  const k = kind ?? pick(rng, kinds[skill])

  // Vie quotidienne : phrase avec un horaire 24 h.
  let context: string | undefined
  if (skill === 'quotidien') {
    const s = pick(rng, DAILY)
    context = s.text(digital24(t, s.pm))
  }

  switch (k) {
    case 'tapHand': {
      const hand = rng() < 0.5 ? 'hour' : 'minute'
      const tt = { h: t.h, m: pick(rng, [10, 20, 40, 50]) }
      return { ...base, kind: k, target: tt, hand, prompt: hand === 'hour' ? 'Touche l’aiguille des heures.' : 'Touche l’aiguille des minutes.' }
    }
    case 'handRole': {
      const big = rng() < 0.5
      return {
        ...base, kind: k, target: { h: t.h, m: 20 },
        prompt: big ? 'La grande aiguille montre…' : 'La petite aiguille montre…',
        choices: shuffle(rng, [
          { label: 'les minutes', correct: big, error: big ? undefined : 'aiguilles' },
          { label: 'les heures', correct: !big, error: big ? 'aiguilles' : undefined },
        ]),
      }
    }
    case 'minutesChoice': {
      const m = t.m === 0 ? 5 * int(rng, 1, 11) : t.m
      const tt = { h: t.h, m }
      const opts = new Map<number, Choice>()
      opts.set(m, { label: `${m} minutes`, correct: true })
      const add = (v: number, e: ErrorType) => { if (v >= 0 && v < 60 && !opts.has(v)) opts.set(v, { label: `${v} minutes`, correct: false, error: e }) }
      add(m / 5, 'minutesNombre')
      add(m + 5, 'minutes'); add(m - 5, 'minutes'); add(m + 10, 'minutes'); add((m + 30) % 60, 'minutes')
      return { ...base, kind: k, target: tt, prompt: 'Combien de minutes montre la grande aiguille ?', choices: shuffle(rng, [...opts.values()].slice(0, 4)) }
    }
    case 'readChoice':
      return { ...base, kind: k, context, prompt: 'Quelle heure est-il ?', choices: timeChoices(t, rng, 4, digital) }
    case 'matchSpoken':
      return { ...base, kind: k, context, prompt: 'Comment dit-on cette heure ?', choices: timeChoices(t, rng, 4, spoken) }
    case 'pickClock':
      return { ...base, kind: k, context, prompt: context ? 'Quelle horloge montre cette heure ?' : `Trouve l’horloge qui montre ${rng() < 0.5 ? digital(t) : spoken(t)}.`, choices: timeChoices(t, rng, 3, digital) }
    case 'setClock': {
      const start = fromTotal(toTotal(t) + pick(rng, [-200, -95, 140, 260, 330]))
      return { ...base, kind: k, context, start, prompt: `Règle l’horloge sur ${rng() < 0.6 || early ? digital(t) : spoken(t)}.` }
    }
    case 'fixClock': {
      const wrong = typicalMistakes(t)
      const start = wrong.length ? pick(rng, wrong).time : fromTotal(toTotal(t) + 60)
      return { ...base, kind: k, context, start, prompt: `Oups, l’horloge du chat est fausse ! Corrige-la : ${digital(t)}.` }
    }
  }
}

/** Analyse d'une horloge réglée par l'enfant. */
export function checkSetClock(target: Time, given: Time): { correct: boolean; error?: ErrorType } {
  // Exactitude demandée : la minute juste et la petite aiguille sur la bonne heure.
  const minuteOk = target.m === given.m
  const hourOk = Math.abs(angleDiff(handAngles(given).hour, handAngles(target).hour)) < 7.5
  if (minuteOk && hourOk) return { correct: true }
  if (!minuteOk) {
    // Aiguilles inversées ?
    const swapped = Math.abs(angleDiff(handAngles(given).minute, handAngles(target).hour)) <= 30 &&
      Math.abs(angleDiff(handAngles(given).hour, handAngles(target).minute)) <= 30
    if (swapped && target.m !== 0) return { correct: false, error: 'aiguilles' }
  }
  if (minuteOk && !hourOk) {
    if (given.h === (target.h % 12) + 1) return { correct: false, error: 'heureSuivante' }
    if (target.h === (given.h % 12) + 1) return { correct: false, error: 'heurePrecedente' }
    return { correct: false, error: 'heure' }
  }
  if (target.m % 5 === 0 && given.m === target.m / 5) return { correct: false, error: 'minutesNombre' }
  return { correct: false, error: 'minutes' }
}

/** Explication courte et bienveillante d'une erreur. */
/**
 * Explication courte et bienveillante d'une erreur.
 * reveal = false : on explique sans donner la réponse, pour laisser un nouvel essai.
 */
export function explain(error: ErrorType | undefined, target: Time, reveal = true): string {
  const t = digital(target)
  if (!reveal) {
    switch (error) {
      case 'aiguilles': return 'Attention : la petite aiguille montre les heures, la grande montre les minutes.'
      case 'heureSuivante': return 'La petite aiguille n’a pas encore atteint l’heure suivante. Regarde le nombre qu’elle vient de dépasser.'
      case 'heurePrecedente': return 'La petite aiguille a déjà dépassé un nombre : c’est lui, l’heure.'
      case 'minutesNombre': return 'Le nombre sous la grande aiguille n’est pas les minutes : compte de 5 en 5 !'
      case 'expression': return '« Et quart » = grande aiguille sur le 3. « Moins le quart » = grande aiguille sur le 9.'
      case 'minutes': return 'Regarde bien la grande aiguille et compte de 5 en 5.'
      case 'heure': return 'Regarde bien la petite aiguille : c’est elle qui montre l’heure.'
      default: return 'Regarde bien les deux aiguilles.'
    }
  }
  switch (error) {
    case 'aiguilles':
      return `La petite aiguille montre les heures, la grande montre les minutes. Ici, il est ${t}.`
    case 'heureSuivante':
      return `La petite aiguille n’a pas encore atteint le ${(target.h % 12) + 1}. L’heure est donc encore ${target.h} : ${t}.`
    case 'heurePrecedente':
      return `La petite aiguille a déjà dépassé le ${target.h}. C’est donc ${target.h} h : ${t}.`
    case 'minutesNombre':
      return `Grande aiguille sur le ${target.m / 5} : ${target.m / 5} × 5 = ${target.m} minutes. Il est ${t}.`
    case 'expression':
      return target.m === 15
        ? `« Et quart », c’est 15 minutes après l’heure : grande aiguille sur le 3.`
        : `« Moins le quart », c’est 15 minutes avant l’heure suivante : grande aiguille sur le 9.`
    case 'minutes':
      return `Compte de 5 en 5 jusqu’à la grande aiguille. Il est ${t}.`
    case 'heure':
      return `La petite aiguille montre l’heure. Il est ${t}.`
    default:
      return `La bonne réponse est ${t}.`
  }
}

/** Petit indice avant de répondre. */
export function hint(ex: Exercise): string {
  const { h, m } = ex.target
  switch (ex.kind) {
    case 'tapHand':
    case 'handRole':
      return 'La petite aiguille est courte et épaisse : elle montre les heures.'
    case 'minutesChoice':
      return `Compte de 5 en 5 jusqu’à la grande aiguille : 5, 10, 15…`
    default:
      if (m === 0) return 'La grande aiguille est sur le 12 : c’est une heure pile.'
      if (m === 30) return 'Grande aiguille sur le 6 : c’est « et demie ».'
      if (m === 15) return 'Grande aiguille sur le 3 : c’est « et quart ».'
      if (m === 45) return `Grande aiguille sur le 9 : il manque 15 minutes pour ${(h % 12) + 1} h.`
      return 'Commence par la grande aiguille (minutes), puis regarde où est la petite.'
  }
}
