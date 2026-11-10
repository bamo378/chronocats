// Mathématiques de l'horloge analogique 12 heures. Tout est exact et testé.

export interface Time {
  /** 1 à 12 */
  h: number
  /** 0 à 59 */
  m: number
}

export const MIN_PER_TURN = 720 // 12 h

/** Minutes écoulées depuis 12:00 (0 à 719). */
export function toTotal(t: Time): number {
  return (t.h % 12) * 60 + t.m
}

/** Inverse de toTotal, avec repli sur 12 heures. */
export function fromTotal(total: number): Time {
  const n = ((Math.round(total) % MIN_PER_TURN) + MIN_PER_TURN) % MIN_PER_TURN
  const h = Math.floor(n / 60)
  return { h: h === 0 ? 12 : h, m: n % 60 }
}

/** Angles en degrés, 0 = midi, sens horaire. La petite aiguille avance de 0,5° par minute. */
export function handAngles(t: Time): { hour: number; minute: number } {
  return { hour: ((t.h % 12) * 30 + t.m * 0.5) % 360, minute: (t.m * 6) % 360 }
}

/** Angle (degrés, 0 = 12 h) d'un point par rapport au centre. */
export function pointAngle(cx: number, cy: number, x: number, y: number): number {
  const a = (Math.atan2(x - cx, cy - y) * 180) / Math.PI
  return (a + 360) % 360
}

/** Différence d'angle la plus courte, de -180 à 180. */
export function angleDiff(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180
}

/**
 * Nouvelle heure après avoir tiré la grande aiguille vers `angle`.
 * La petite aiguille suit : passer le 12 avance ou recule d'une heure.
 */
export function dragMinuteHand(prev: Time, angle: number, snap = 1): Time {
  let m = Math.round(angle / 6 / snap) * snap
  if (m >= 60) m = 0
  const prevTotal = toTotal(prev)
  // On choisit la position la plus proche de l'ancienne (gère le passage du 12).
  const base = prevTotal - prev.m
  const candidates = [base - 60 + m, base + m, base + 60 + m]
  let best = candidates[0]
  for (const c of candidates) if (Math.abs(c - prevTotal) < Math.abs(best - prevTotal)) best = c
  return fromTotal(best)
}

/** Nouvelle heure après avoir tiré la petite aiguille : l'angle fixe heure ET minutes. */
export function dragHourHand(prev: Time, angle: number, snap = 1): Time {
  let total = angle * 2 // 0,5° par minute
  // Garder la continuité avec l'ancienne heure (un tour = 720 min).
  const prevTotal = toTotal(prev)
  const k = Math.round((prevTotal - total) / MIN_PER_TURN)
  total += k * MIN_PER_TURN
  total = Math.round(total / snap) * snap
  return fromTotal(total)
}

export function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

/** « 8 h 45 » */
export function digital(t: Time): string {
  return `${t.h} h ${pad2(t.m)}`
}

/** « 20 h 45 » pour un affichage 24 h (pm = après-midi / soir). */
export function digital24(t: Time, pm: boolean): string {
  const h = pm ? (t.h % 12) + 12 : t.h % 12
  return `${h} h ${pad2(t.m)}`
}

function hourWord(h: number): string {
  return h === 1 ? '1 heure' : `${h} heures`
}

const next = (h: number) => (h % 12) + 1

/** Expression orale française : « 9 heures moins le quart », « 3 heures et demie »… */
export function spoken(t: Time): string {
  const { h, m } = t
  if (m === 0) return hourWord(h)
  if (m === 15) return `${hourWord(h)} et quart`
  if (m === 30) return `${hourWord(h)} et demie`
  if (m === 45) return `${hourWord(next(h))} moins le quart`
  if (m >= 35) return `${hourWord(next(h))} moins ${60 - m}`
  return `${hourWord(h)} ${m}`
}

export function sameTime(a: Time, b: Time): boolean {
  return toTotal(a) === toTotal(b)
}

/** Écart en minutes, sur le cadran (0 à 360). */
export function minutesApart(a: Time, b: Time): number {
  const d = Math.abs(toTotal(a) - toTotal(b)) % MIN_PER_TURN
  return Math.min(d, MIN_PER_TURN - d)
}
