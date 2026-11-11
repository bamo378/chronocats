// Points et médailles par livret (mode S'entraîner), diplômes (mode Tester).

export const MEDALS = [
  { name: 'Bronze', at: 150, color: '#d6915a' },
  { name: 'Argent', at: 400, color: '#cbd5e1' },
  { name: 'Or', at: 800, color: '#fbbf24' },
]

/** Médaille atteinte (0 = aucune, 3 = or) et progression vers la suivante. */
export function medalFor(points: number): { tier: number; next?: { name: string; at: number }; frac: number } {
  let tier = 0
  for (const m of MEDALS) if (points >= m.at) tier++
  if (tier >= MEDALS.length) return { tier, frac: 1 }
  const prev = tier ? MEDALS[tier - 1].at : 0
  const next = MEDALS[tier]
  return { tier, next, frac: (points - prev) / (next.at - prev) }
}

/** Points d'une bonne réponse à l'entraînement. */
export function trainPoints(firstTry: boolean, eventually: boolean, hint: boolean, combo: number): number {
  if (!eventually) return 0
  let p = firstTry ? 10 : 4
  if (hint) p = Math.ceil(p / 2)
  if (firstTry && combo >= 3) p += Math.min(10, (combo - 2) * 2)
  return p
}

/** Questions d'un test : tous les calculs des livrets choisis, répartis, 24 au plus. */
export function testPlan(tables: number[], rng: () => number = Math.random): { table: number; n: number }[] {
  const ts = [...new Set(tables)].sort((a, b) => a - b)
  const per = ts.length === 1 ? 12 : ts.length === 2 ? 12 : Math.max(3, Math.floor(24 / ts.length))
  const out: { table: number; n: number }[] = []
  for (const t of ts) {
    const ns = Array.from({ length: 12 }, (_, i) => i + 1).sort(() => rng() - 0.5).slice(0, per)
    for (const n of ns) out.push({ table: t, n })
  }
  return out.sort(() => rng() - 0.5).slice(0, Math.max(12, Math.min(24, out.length)))
}

/** Un livret est réussi au test avec au moins 5 questions posées et 90 % de bonnes réponses. */
export function testPassed(ok: number, asked: number): boolean {
  return asked >= 5 && ok / asked >= 0.9
}
