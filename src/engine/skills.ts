// Les 12 chapitres : un par livret (du plus simple au plus difficile), puis le grand défi.

export type SkillId = 'x1x10' | 'x2' | 'x5' | 'x3' | 'x4' | 'x9' | 'x6' | 'x11' | 'x7' | 'x8' | 'x12' | 'defi'

export interface Skill {
  id: SkillId
  chapter: number
  title: string
  short: string
  /** Livrets travaillés dans ce chapitre. */
  tables: number[]
  /** Astuces montrées dans la mini-leçon. */
  intro: string[]
}

export const MAX_FACTOR = 12

export const SKILLS: Skill[] = [
  { id: 'x1x10', chapter: 1, title: 'Les livrets 1 et 10', short: '× 1 et × 10', tables: [1, 10],
    intro: ['Fois 1 : le nombre ne change pas. 7 × 1 = 7.', 'Fois 10 : on ajoute un zéro. 7 × 10 = 70.'] },
  { id: 'x2', chapter: 2, title: 'Le livret 2', short: '× 2', tables: [2],
    intro: ['Fois 2, c’est le double.', '8 × 2 = 8 + 8 = 16.'] },
  { id: 'x5', chapter: 3, title: 'Le livret 5', short: '× 5', tables: [5],
    intro: ['Les résultats finissent toujours par 0 ou 5.', 'Fois 5, c’est la moitié de fois 10 : 6 × 10 = 60, donc 6 × 5 = 30.'] },
  { id: 'x3', chapter: 4, title: 'Le livret 3', short: '× 3', tables: [3],
    intro: ['Fois 3 = le double, plus encore une fois.', '7 × 3 = 14 + 7 = 21.'] },
  { id: 'x4', chapter: 5, title: 'Le livret 4', short: '× 4', tables: [4],
    intro: ['Fois 4, c’est le double du double.', '6 × 4 : double de 6 = 12, double de 12 = 24.'] },
  { id: 'x9', chapter: 6, title: 'Le livret 9', short: '× 9', tables: [9],
    intro: ['Fois 9 = fois 10, moins une fois.', '7 × 9 = 70 − 7 = 63.', 'Jusqu’à 10 × 9, les chiffres du résultat font toujours 9 : 6 + 3 = 9.'] },
  { id: 'x6', chapter: 7, title: 'Le livret 6', short: '× 6', tables: [6],
    intro: ['Fois 6 = fois 5, plus encore une fois.', '7 × 6 = 35 + 7 = 42.'] },
  { id: 'x11', chapter: 8, title: 'Le livret 11', short: '× 11', tables: [11],
    intro: ['Jusqu’à 9 × 11, on répète le chiffre : 4 × 11 = 44.', 'Ensuite : 11 × 11 = 121, 12 × 11 = 132.'] },
  { id: 'x7', chapter: 9, title: 'Le livret 7', short: '× 7', tables: [7],
    intro: ['Fois 7 = fois 5, plus fois 2.', '8 × 7 = 40 + 16 = 56. Et 7 × 8 = 8 × 7 !'] },
  { id: 'x8', chapter: 10, title: 'Le livret 8', short: '× 8', tables: [8],
    intro: ['Fois 8 = le double du double du double.', '6 × 8 : 12, puis 24, puis 48.'] },
  { id: 'x12', chapter: 11, title: 'Le livret 12', short: '× 12', tables: [12],
    intro: ['Fois 12 = fois 10, plus fois 2.', '7 × 12 = 70 + 14 = 84.'] },
  { id: 'defi', chapter: 12, title: 'Le grand défi des livrets', short: 'Grand défi', tables: [2, 3, 4, 5, 6, 7, 8, 9, 11, 12],
    intro: ['Tous les livrets mélangés.', 'Prends ton temps : un calcul juste vaut mieux qu’un calcul rapide.'] },
]

export const SKILL_BY_ID: Record<SkillId, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, Skill>
export const SKILL_ORDER: SkillId[] = SKILLS.map((s) => s.id)

/** Chapitre qui travaille un livret donné. */
export function skillForTable(n: number): SkillId {
  return SKILLS.find((s) => s.id !== 'defi' && s.tables.includes(n))!.id
}
