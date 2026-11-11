import { Profile } from '../profiles/store'

/** Récompenses d'une partie, fondées sur les bonnes réponses (pas sur la durée de jeu). */
export function applyRewards(p: Profile, r: { correct: number; record?: boolean; bonus?: number }) {
  const xp = r.correct * 10 + (r.record ? 50 : 0) + (r.bonus ?? 0)
  const coins = Math.min(60, r.correct * 2) + (r.record ? 15 : 0)
  const cubes = r.record ? 3 : r.correct >= 20 ? 1 : 0
  p.xp = (p.xp ?? 0) + xp
  p.coins += coins
  p.cubes += cubes
  return { xp, coins, cubes }
}
