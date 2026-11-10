// Les 12 chapitres. L'ordre est celui de la progression.

export type SkillId =
  | 'aiguilles'
  | 'heures'
  | 'minutes'
  | 'demi'
  | 'quart'
  | 'moinsquart'
  | 'cinq'
  | 'toutes'
  | 'moins'
  | 'regler'
  | 'quotidien'
  | 'defi'

export interface Skill {
  id: SkillId
  chapter: number
  title: string
  short: string
  /** Mini-leçon montrée avant le premier exercice du chapitre. */
  intro: string[]
}

export const SKILLS: Skill[] = [
  { id: 'aiguilles', chapter: 1, title: 'Découverte de l’horloge', short: 'Les aiguilles',
    intro: ['La petite aiguille montre les heures.', 'La grande aiguille montre les minutes.', 'Elles tournent toutes les deux dans le même sens.'] },
  { id: 'heures', chapter: 2, title: 'Les heures entières', short: 'Heures pile',
    intro: ['Quand la grande aiguille est sur le 12, c’est une heure pile.', 'La petite aiguille montre alors exactement l’heure.'] },
  { id: 'minutes', chapter: 3, title: 'Le rôle des minutes', short: 'Les minutes',
    intro: ['Entre deux nombres, il y a 5 minutes.', 'Sur le 1 : 5 minutes. Sur le 2 : 10. Sur le 3 : 15…', 'Astuce : on compte de 5 en 5.'] },
  { id: 'demi', chapter: 4, title: 'Les demi-heures', short: 'Et demie',
    intro: ['Grande aiguille sur le 6 : 30 minutes, c’est « et demie ».', 'La petite aiguille est alors au milieu, entre deux heures.'] },
  { id: 'quart', chapter: 5, title: 'Les quarts d’heure', short: 'Et quart',
    intro: ['Grande aiguille sur le 3 : 15 minutes, c’est « et quart ».', 'La petite aiguille a fait un quart du chemin vers l’heure suivante.'] },
  { id: 'moinsquart', chapter: 6, title: 'Les trois quarts', short: 'Moins le quart',
    intro: ['Grande aiguille sur le 9 : 45 minutes.', 'On dit aussi « moins le quart » de l’heure suivante.', 'À 8 h 45, il est 9 heures moins le quart : la petite aiguille est presque sur le 9 !'] },
  { id: 'cinq', chapter: 7, title: 'Les minutes de 5 en 5', short: '5 en 5',
    intro: ['Compte de 5 en 5 en suivant les nombres.', 'Sur le 7 : 35 minutes. Sur le 10 : 50 minutes.'] },
  { id: 'toutes', chapter: 8, title: 'Toutes les minutes', short: 'Minute près',
    intro: ['Les petits traits sont les minutes.', 'Trouve le nombre juste avant, puis ajoute les petits traits.'] },
  { id: 'moins', chapter: 9, title: 'Les expressions avec « moins »', short: 'Avec moins',
    intro: ['Après la demie, on peut compter ce qui manque.', '8 h 40 = 9 heures moins 20 : il manque 20 minutes pour 9 h.'] },
  { id: 'regler', chapter: 10, title: 'Positionner les aiguilles', short: 'Régler',
    intro: ['Place d’abord la grande aiguille.', 'Vérifie que la petite aiguille est au bon endroit entre deux heures.'] },
  { id: 'quotidien', chapter: 11, title: 'Les horaires de la vie', short: 'Vie de tous les jours',
    intro: ['L’après-midi, on ajoute 12 : 15 h, c’est 3 h de l’après-midi.', 'Sur l’horloge, 15 h et 3 h se lisent pareil.'] },
  { id: 'defi', chapter: 12, title: 'Le défi des maîtres du temps', short: 'Grand défi',
    intro: ['Tout ce que tu as appris, mélangé.', 'Prends ton temps : la précision compte plus que la vitesse.'] },
]

export const SKILL_BY_ID: Record<SkillId, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, Skill>

export const SKILL_ORDER: SkillId[] = SKILLS.map((s) => s.id)
