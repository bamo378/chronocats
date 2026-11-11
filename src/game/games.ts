// Les mini-jeux. Tous utilisent les livrets choisis par la joueuse.

export interface GameDef {
  id: 'eclair' | 'survie' | 'memory' | 'bulles' | 'vraifaux'
  name: string
  icon: string
  pitch: string
  rules: string
  /** Couleurs de la carte (dégradé). */
  from: string
  to: string
  /** Record : plus haut est mieux, sauf Memory (temps). */
  lowerIsBetter?: boolean
  unit?: string
}

export const GAMES: GameDef[] = [
  { id: 'eclair', name: 'Éclair', icon: 'bolt', pitch: '60 secondes chrono', rules: 'Tape un maximum de bonnes réponses en 60 secondes. Toutes les 5 réponses justes d’affilée, un point bonus.', from: '#f59e0b', to: '#ef4444', unit: 'pts' },
  { id: 'survie', name: 'Survie', icon: 'heart', pitch: '3 vies, de plus en plus vite', rules: 'Tu as 3 vies. Chaque calcul a son propre chrono, qui raccourcit à mesure que tu avances. Une erreur ou un temps écoulé coûte une vie.', from: '#f43f5e', to: '#a855f7', unit: 'pts' },
  { id: 'bulles', name: 'Bulles', icon: 'bubbles', pitch: 'Éclate la bonne réponse', rules: 'Les réponses montent dans des bulles. Touche la bonne avant qu’elle s’envole. 3 vies.', from: '#06b6d4', to: '#6366f1', unit: 'pts' },
  { id: 'memory', name: 'Memory', icon: 'grid', pitch: 'Retrouve les paires', rules: 'Retourne les cartes deux par deux et associe chaque calcul à son résultat. Le plus vite possible.', from: '#10b981', to: '#0ea5e9', lowerIsBetter: true, unit: 's' },
  { id: 'vraifaux', name: 'Vrai ou faux', icon: 'scale', pitch: '45 secondes pour juger', rules: 'Un calcul s’affiche avec un résultat. Juste ou pas ? Réponds vite : une erreur bloque 1 seconde.', from: '#ec4899', to: '#f97316', unit: 'pts' },
]

export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameDef['id'], GameDef>

/** Affichage court d'une sélection de livrets : « 2, 3, 7 » ou « Tous ». */
export function tablesLabel(t: number[]): string {
  const s = [...t].sort((a, b) => a - b)
  if (s.length === 12) return 'Tous les livrets'
  if (!s.length) return 'Aucun livret'
  return (s.length === 1 ? 'Livret ' : 'Livrets ') + s.join(', ')
}
